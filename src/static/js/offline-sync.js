(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'magaOfflineQueue';
  const DEVICE_KEY = 'magaOfflineDeviceId';
  const BANNER_ID = 'offlineBanner';
  const MAX_QUEUE_SIZE = 200;
  const originalFetch = window.fetch.bind(window);
  let queue = loadQueue();
  let flushing = false;

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback simple UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function loadQueue() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('No se pudo cargar la cola offline:', error);
      return [];
    }
  }

  function persistQueue() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('No se pudo guardar la cola offline:', error);
    }
  }

  function getDeviceId() {
    let deviceId = window.localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = uuid();
      window.localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  }

  function getBannerElement() {
    return document.getElementById(BANNER_ID);
  }

  function showBanner(message) {
    const banner = getBannerElement();
    if (!banner) {
      return;
    }
    if (message) {
      const textEl = banner.querySelector('.offline-text');
      if (textEl) {
        textEl.textContent = message;
      }
    }
    banner.classList.add('is-visible');
    banner.setAttribute('aria-hidden', 'false');
    document.body.style.paddingTop = banner.offsetHeight + 'px';
  }

  function hideBanner() {
    const banner = getBannerElement();
    if (!banner) {
      return;
    }
    banner.classList.remove('is-visible');
    banner.setAttribute('aria-hidden', 'true');
    document.body.style.paddingTop = '';
  }

  function createHeadersObject(headers) {
    if (!headers) {
      return {};
    }
    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }
    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }
    return { ...headers };
  }

  function serializeBody(body) {
    if (!body) {
      return null;
    }

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return { type: 'json', data: parsed };
      } catch (_) {
        return { type: 'text', data: body };
      }
    }

    if (body instanceof URLSearchParams) {
      return { type: 'search', data: body.toString() };
    }

    if (body instanceof FormData) {
      return { type: 'form', data: Array.from(body.entries()) };
    }

    if (body instanceof Blob) {
      console.warn('No se puede serializar un Blob para modo offline.');
      return null;
    }

    if (typeof body === 'object') {
      return { type: 'json', data: body };
    }

    return null;
  }

  function deserializeBody(serialized) {
    if (!serialized) {
      return undefined;
    }

    switch (serialized.type) {
      case 'json':
        return JSON.stringify(serialized.data);
      case 'text':
        return serialized.data;
      case 'search':
        return new URLSearchParams(serialized.data);
      case 'form': {
        const formData = new FormData();
        serialized.data.forEach(([key, value]) => formData.append(key, value));
        return formData;
      }
      default:
        return undefined;
    }
  }

  function enqueue(request) {
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.shift();
    }
    queue.push(request);
    persistQueue();
    document.dispatchEvent(new CustomEvent('OfflineSync:queued', { detail: request }));
    showBanner('Sin conexión a Internet');
  }

  async function flushQueue() {
    if (flushing || !queue.length || !navigator.onLine) {
      if (navigator.onLine && !queue.length) {
        hideBanner();
      }
      return;
    }

    flushing = true;
    showBanner('Sincronizando cambios pendientes…');

    const deviceId = getDeviceId();

    while (queue.length && navigator.onLine) {
      const item = queue[0];
      const headers = new Headers(item.headers || {});
      headers.set('X-Offline-Request-Id', item.id);
      headers.set('X-Offline-Device-Id', deviceId);

      const options = {
        method: item.method,
        headers,
        credentials: item.credentials || 'same-origin',
      };

      const body = deserializeBody(item.body);
      if (body !== undefined) {
        options.body = body;
      }

      let response;
      let error = null;

      try {
        response = await originalFetch(item.url, options);
        if (!response.ok) {
          error = new Error(`Error ${response.status} al reenviar la solicitud offline`);
        }
      } catch (err) {
        error = err;
      }

      if (error) {
        item.retries = (item.retries || 0) + 1;
        item.lastError = error.message;
        persistQueue();
        document.dispatchEvent(new CustomEvent('OfflineSync:error', { detail: { item, error } }));

        if (!navigator.onLine || item.retries > 3) {
          showBanner('Sin conexión a Internet');
          break;
        }

        // Esperar un poco antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 1000 * item.retries));
      } else {
        const completed = queue.shift();
        persistQueue();
        document.dispatchEvent(new CustomEvent('OfflineSync:sent', { detail: completed }));
      }
    }

    flushing = false;

    if (!queue.length && navigator.onLine) {
      hideBanner();
      document.dispatchEvent(new CustomEvent('OfflineSync:idle'));
    } else if (queue.length) {
      showBanner('Sin conexión a Internet');
    }
  }

  function normalizeUrl(input) {
    if (typeof input === 'string') {
      return input;
    }
    if (input instanceof Request) {
      return input.url;
    }
    try {
      return String(input);
    } catch (_) {
      return null;
    }
  }

  function collectInitData(input, init) {
    let method = 'GET';
    let headers = {};
    let body = null;
    let credentials = 'same-origin';

    if (input instanceof Request) {
      method = input.method || method;
      headers = createHeadersObject(input.headers);
      credentials = input.credentials || credentials;
    }

    if (init && typeof init === 'object') {
      method = init.method || method;
      if (init.headers) {
        headers = { ...headers, ...createHeadersObject(init.headers) };
      }
      if (init.credentials) {
        credentials = init.credentials;
      }
      if (init.body !== undefined) {
        body = serializeBody(init.body);
      }
    } else if (input instanceof Request && input.bodyUsed === false) {
      // Intentar clonar el request para obtener su body original (solo si no se usó todavía)
      try {
        const clone = input.clone();
        return clone.text().then((text) => ({
          method,
          headers,
          body: serializeBody(text),
          credentials,
        }));
      } catch (_) {
        // Ignorar
      }
    }

    return { method, headers, body, credentials };
  }

  function shouldBypass(url) {
    try {
      const requestUrl = new URL(url, window.location.origin);
      return requestUrl.origin !== window.location.origin;
    } catch (_) {
      return false;
    }
  }

  async function offlineAwareFetch(input, init) {
    const url = normalizeUrl(input);
    if (!url) {
      return originalFetch(input, init);
    }

    const initData = await collectInitData(input, init);

    const method = (initData.method || 'GET').toUpperCase();
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

    if (shouldBypass(url) || !isMutation) {
      if (!navigator.onLine) {
        showBanner('Sin conexión a Internet');
      }
      return originalFetch(input, init);
    }

    if (!navigator.onLine) {
      enqueue({
        id: uuid(),
        url,
        method,
        headers: initData.headers,
        body: initData.body,
        credentials: initData.credentials,
        createdAt: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          offline: true,
          message: 'Solicitud guardada sin conexión. Se enviará automáticamente cuando vuelva el internet.',
        }),
        {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
            'X-Offline-Queued': 'true',
          },
        }
      );
    }

    try {
      const response = await originalFetch(input, init);
      if (!response.ok && !navigator.onLine) {
        // Si la solicitud falló y perdimos la conexión a mitad de camino, almacena para reintentar
        enqueue({
          id: uuid(),
          url,
          method,
          headers: initData.headers,
          body: initData.body,
          credentials: initData.credentials,
          createdAt: new Date().toISOString(),
        });
        return new Response(
          JSON.stringify({
            success: true,
            offline: true,
            message: 'Solicitud guardada. Se reenviará automáticamente al recuperar la conexión.',
          }),
          {
            status: 202,
            headers: {
              'Content-Type': 'application/json',
              'X-Offline-Queued': 'true',
            },
          }
        );
      }
      return response;
    } catch (error) {
      if (!navigator.onLine) {
        enqueue({
          id: uuid(),
          url,
          method,
          headers: initData.headers,
          body: initData.body,
          credentials: initData.credentials,
          createdAt: new Date().toISOString(),
        });
        return new Response(
          JSON.stringify({
            success: true,
            offline: true,
            message: 'Solicitud guardada sin conexión. Se enviará automáticamente cuando vuelva el internet.',
          }),
          {
            status: 202,
            headers: {
              'Content-Type': 'application/json',
              'X-Offline-Queued': 'true',
            },
          }
        );
      }
      throw error;
    }
  }

  window.fetch = offlineAwareFetch;

  window.OfflineSync = {
    getQueue: () => [...queue],
    flush: flushQueue,
    clear: () => {
      queue = [];
      persistQueue();
      hideBanner();
    },
    isOffline: () => !navigator.onLine,
    enqueueManual: (url, options) => {
      const initData = collectInitData(url, options);
      Promise.resolve(initData).then((data) => {
        enqueue({
          id: uuid(),
          url: normalizeUrl(url),
          method: (data.method || 'POST').toUpperCase(),
          headers: data.headers,
          body: data.body,
          credentials: data.credentials,
          createdAt: new Date().toISOString(),
        });
      });
    },
  };

  window.addEventListener('online', () => {
    if (!queue.length) {
      hideBanner();
    } else {
      flushQueue();
    }
  });

  window.addEventListener('offline', () => {
    showBanner('Sin conexión a Internet');
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.onLine) {
      showBanner('Sin conexión a Internet');
    } else if (queue.length) {
      flushQueue();
    }
  });
})(window, document);

