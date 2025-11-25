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
      return [];
    }
  }

  function persistQueue() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
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
      console.warn('⚠️ Banner offline no encontrado en el DOM');
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
    // Asegurar que el banner sea visible
    banner.style.display = 'block';
    const bannerHeight = banner.offsetHeight || 60; // Fallback si no se puede calcular
    document.body.style.paddingTop = bannerHeight + 'px';
    console.log('✅ Banner offline mostrado');
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
      // FormData puede contener Files que no se pueden serializar directamente
      // Retornar null para que se maneje de forma especial
      return null;
    }

    if (body instanceof Blob) {
      return null;
    }

    if (typeof body === 'object') {
      // Si tiene type: 'formdata', es un objeto especial que contiene archivos en base64
      if (body.type === 'formdata') {
        console.log('📦 [SYNC] Serializando FormData especial con archivos base64');
        return { type: 'formdata', data: body };
      }
      return { type: 'json', data: body };
    }

    return null;
  }

  async function deserializeBody(serialized) {
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
      case 'formdata': {
        // Reconstruir FormData desde base64
        console.log('📦 [SYNC] Deserializando FormData desde base64');
        const formData = new FormData();
        const data = serialized.data;
        
        // Agregar archivos
        if (data.files && Array.isArray(data.files)) {
          console.log(`📦 [SYNC] Reconstruyendo ${data.files.length} archivo(s)`);
          for (const fileInfo of data.files) {
            try {
              // Convertir base64 a Blob
              const byteCharacters = atob(fileInfo.base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: fileInfo.fileType });
              const file = new File([blob], fileInfo.fileName, { type: fileInfo.fileType });
              formData.append(fileInfo.key, file);
              console.log(`✅ [SYNC] Archivo reconstruido: ${fileInfo.fileName} (${file.size} bytes)`);
            } catch (error) {
              console.error(`❌ [SYNC] Error al reconstruir archivo ${fileInfo.fileName}:`, error);
            }
          }
        }
        
        // Agregar campos de texto
        if (data.fields && Array.isArray(data.fields)) {
          for (const field of data.fields) {
            formData.append(field.key, field.value);
          }
        }
        
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

  async function flushQueue(force = false) {
    // Si se fuerza, permitir incluso si está en proceso (útil para reiniciar si se quedó atascado)
    if (!force && (flushing || !queue.length || !navigator.onLine)) {
      if (navigator.onLine && !queue.length) {
        hideBanner();
      }
      return;
    }
    
    // Si se fuerza y está en proceso, reiniciar
    if (force && flushing) {
      console.log('🔄 [SYNC] Forzando reinicio de sincronización...');
      flushing = false;
    }
    
    if (!queue.length || !navigator.onLine) {
      if (navigator.onLine && !queue.length) {
        hideBanner();
      }
      return;
    }

    flushing = true;
    showBanner('Sincronizando cambios pendientes…');

    console.log('🔄 [SYNC] Iniciando sincronización de', queue.length, 'solicitudes pendientes');

    const deviceId = getDeviceId();

    while (queue.length && navigator.onLine) {
      const item = queue[0];
      console.log('📤 [SYNC] Enviando:', item.method, item.url);
      const headers = new Headers(item.headers || {});
      headers.set('X-Offline-Request-Id', item.id);
      headers.set('X-Offline-Device-Id', deviceId);

      const options = {
        method: item.method,
        headers,
        credentials: item.credentials || 'same-origin',
      };

      const body = await deserializeBody(item.body);
      if (body !== undefined) {
        options.body = body;
      }

      let response;
      let error = null;
      let statusCode = null;

      try {
        response = await originalFetch(item.url, options);
        statusCode = response.status;
        if (!response.ok) {
          error = new Error(`Error ${response.status} al reenviar la solicitud offline`);
        }
      } catch (err) {
        error = err;
      }

      if (error) {
        // Si es un 404 (recurso no encontrado), eliminar de la cola y continuar
        // Los 404 generalmente indican que el recurso ya no existe o la URL es incorrecta
        if (statusCode === 404) {
          const failed = queue.shift();
          persistQueue();
          console.warn('⚠️ [SYNC] Recurso no encontrado (404), eliminando de la cola:', failed.method, failed.url);
          document.dispatchEvent(new CustomEvent('OfflineSync:failed', { detail: { item: failed, error, reason: 'not_found' } }));
          updateSyncStatus();
          // Continuar con el siguiente elemento sin reintentar
          continue;
        }
        
        // Si es un error de red (sin statusCode), verificar si hay conexión
        if (!statusCode && !navigator.onLine) {
          showBanner('Sin conexión a Internet');
          break; // Salir del bucle si no hay conexión
        }

        item.retries = (item.retries || 0) + 1;
        item.lastError = error.message;
        persistQueue();
        document.dispatchEvent(new CustomEvent('OfflineSync:error', { detail: { item, error } }));

        // Si no hay conexión o se excedieron los reintentos, eliminar de la cola y continuar
        if (!navigator.onLine || item.retries > 3) {
          if (item.retries > 3) {
            const failed = queue.shift();
            persistQueue();
            console.warn('⚠️ [SYNC] Máximo de reintentos excedido, eliminando de la cola:', failed.method, failed.url);
            document.dispatchEvent(new CustomEvent('OfflineSync:failed', { detail: { item: failed, error, reason: 'max_retries' } }));
            updateSyncStatus();
            continue; // Continuar con el siguiente elemento
          } else {
            showBanner('Sin conexión a Internet');
            break;
          }
        }

        // Esperar un poco antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 1000 * item.retries));
      } else {
        const completed = queue.shift();
        persistQueue();
        console.log('✅ [SYNC] Enviado exitosamente:', completed.method, completed.url);
        
        // Intentar capturar la respuesta del servidor para obtener datos del recurso creado
        let responseData = null;
        try {
          // Clonar la respuesta antes de leerla para poder usarla después
          const responseClone = response.clone();
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await responseClone.json();
            console.log('📦 [SYNC] Respuesta del servidor:', responseData);
          }
        } catch (err) {
          // Si no se puede parsear, continuar sin los datos
          console.warn('⚠️ [SYNC] No se pudo parsear la respuesta:', err);
        }
        
        // Incluir la respuesta en el evento si está disponible
        const eventDetail = {
          ...completed,
          response: responseData,
          statusCode: response.status
        };
        
        document.dispatchEvent(new CustomEvent('OfflineSync:sent', { detail: eventDetail }));
        updateSyncStatus();
      }
    }

    flushing = false;

    if (!queue.length && navigator.onLine) {
      console.log('✅ [SYNC] Sincronización completada - Cola vacía');
      hideBanner();
      updateSyncStatus();
      document.dispatchEvent(new CustomEvent('OfflineSync:idle'));
    } else if (queue.length) {
      console.log('⚠️ [SYNC] Sincronización pausada -', queue.length, 'solicitudes pendientes');
      showBanner('Sin conexión a Internet');
      updateSyncStatus();
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
      
      // Bypass si es origen diferente
      if (requestUrl.origin !== window.location.origin) {
        return true;
      }

      // ✅ RUTAS COMPLETAS PARA PROYECTOS/EVENTOS, COMUNIDADES Y REGIONES
      const allowedPaths = [
        // === PROYECTOS/EVENTOS ===
        '/api/proyecto/',
        '/api/evento/',
        '/api/eventos/',
        '/api/proyectos/',
        '/api/ultimos-proyectos/',
        '/api/actividades/',
        '/api/tipos-actividad/',
        
        // === COMUNIDADES ===
        '/api/comunidad/',
        '/api/comunidades/',
        
        // === REGIONES ===
        '/api/region/',
        '/api/regiones/',
        
        // === BENEFICIARIOS (opcional) ===
        '/api/beneficiarios/',
        '/api/beneficiario/',
      ];

      // ⚠️ IMPORTANTE: Solo interceptar si la ruta está en allowedPaths
      // Y si es una operación de modificación (POST, PUT, DELETE, PATCH)
      const isAllowed = allowedPaths.some(path => requestUrl.pathname.includes(path));
      
      if (!isAllowed) {
        return true; // Bypass - no guardar offline
      }

      return false; // No bypass - guardar offline si no hay conexión
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
    const bypass = shouldBypass(url);

    // 🔍 Log de debugging (solo para operaciones de mutación)
    if (isMutation) {
      console.log('🔍 [OFFLINE-SYNC] Interceptando:', {
        url,
        method,
        bypass,
        online: navigator.onLine,
      });
    }

    if (bypass || !isMutation) {
      // Solo mostrar banner si NO hay conexión Y es una ruta que intentamos interceptar
      if (!navigator.onLine && !bypass) {
        showBanner('Sin conexión a Internet');
      }
      
      // Si estamos offline, devolver directamente una respuesta JSON válida sin intentar fetch
      if (!navigator.onLine && !isMutation) {
        return Promise.resolve(new Response(JSON.stringify({ 
          success: false, 
          error: 'Sin conexión',
          offline: true,
          data: null
        }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Para requests GET cuando hay conexión, intentar hacer fetch normalmente
      // Pero capturar errores de red y devolver respuesta JSON válida
      return originalFetch(input, init).catch(error => {
        // Si el fetch falla (incluso si navigator.onLine es true, puede haber problemas de red)
        // y es un GET, retornar una respuesta JSON válida
        if (!isMutation) {
          // Detectar si es un error de red (offline real)
          const isNetworkError = error.name === 'TypeError' && 
            (error.message.includes('Failed to fetch') || 
             error.message.includes('NetworkError') ||
             error.message.includes('ERR_INTERNET_DISCONNECTED') ||
             error.message.includes('ERR_NETWORK_CHANGED'));
          
          if (isNetworkError) {
            // Mostrar banner si no está visible
            if (navigator.onLine) {
              showBanner('Sin conexión a Internet');
            }
          }
          
          return new Response(JSON.stringify({ 
            success: false, 
            error: isNetworkError ? 'Sin conexión' : 'Error de conexión',
            offline: isNetworkError,
            data: null
          }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw error;
      });
    }

    if (!navigator.onLine) {
      const requestData = {
        id: uuid(),
        url,
        method,
        headers: initData.headers,
        body: initData.body,
        credentials: initData.credentials,
        createdAt: new Date().toISOString(),
      };
      
      enqueue(requestData);
      updateSyncStatus();

      // 📝 Log para debugging
      console.log('📴 [OFFLINE] Solicitud guardada:', {
        url: url,
        method: method,
        queueId: requestData.id,
        timestamp: new Date().toLocaleString('es-GT'),
        queueSize: queue.length,
      });

      return new Response(
        JSON.stringify({
          success: true,
          offline: true,
          queue_id: requestData.id, // Incluir el ID de la cola en la respuesta
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
      
      // Si no hay conexión y la respuesta no es exitosa, devolver respuesta offline
      if (!navigator.onLine && (!response.ok || response.status === 0)) {
        // Si es una mutación, guardar en cola
        if (isMutation) {
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
        } else {
          // Para GET, devolver respuesta vacía en formato JSON
          return new Response(
            JSON.stringify({ success: false, error: 'Sin conexión', offline: true }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      // Si la respuesta no es JSON pero se espera JSON, convertir
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && url.pathname.startsWith('/api/')) {
        // Si es una respuesta de error y no es JSON, devolver JSON válido
        if (!response.ok) {
          return new Response(
            JSON.stringify({ success: false, error: `Error ${response.status}`, offline: !navigator.onLine }),
            {
              status: response.status,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      return response;
    } catch (error) {
      // Si no hay conexión, devolver respuesta offline
      if (!navigator.onLine) {
        if (isMutation) {
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
        } else {
          // Para GET, devolver respuesta vacía
          return new Response(
            JSON.stringify({ success: false, error: 'Sin conexión', offline: true }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
      throw error;
    }
  }

  window.fetch = offlineAwareFetch;

  // =====================================================
  // FUNCIÓN DE SINCRONIZACIÓN BIDIRECCIONAL
  // =====================================================

  async function syncFromServer() {
    if (!navigator.onLine) {
      // No intentar sincronizar si no hay conexión
      return;
    }
    
    if (!window.OfflineDB) {
      // IndexedDB no está disponible, no es crítico
      return;
    }

    console.log('🔄 Sincronizando datos desde el servidor...');
    updateSyncStatus();

    try {
        // Primero, sincronizar tipos de actividad para poder mapear UUIDs a nombres
        let tiposActividadMap = {};
        try {
          const tiposResponse = await fetch('/api/tipos-actividad/');
          if (tiposResponse.ok) {
            const tiposData = await tiposResponse.json();
            if (Array.isArray(tiposData)) {
              tiposData.forEach(tipo => {
                tiposActividadMap[tipo.id] = tipo.nombre;
              });
              console.log(`✅ ${tiposData.length} tipos de actividad sincronizados para mapeo`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error al sincronizar tipos de actividad:', error);
        }
        
        // Sincronizar proyectos/actividades (lista básica)
        try {
          const proyectosResponse = await fetch('/api/actividades/');
        if (proyectosResponse.ok) {
          // Verificar Content-Type antes de parsear JSON
          const contentType = proyectosResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ Respuesta de actividades no es JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          let data;
          try {
            data = await proyectosResponse.json();
          } catch (parseError) {
            // Si falla el parseo, probablemente es HTML
            console.warn('⚠️ Error al parsear respuesta de actividades como JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          // La API /api/actividades/ devuelve un array directo, no un objeto con success
          let actividades = [];
          if (Array.isArray(data)) {
            actividades = data;
          } else if (data.success && data.actividades) {
            actividades = data.actividades;
          } else if (data.actividades) {
            actividades = data.actividades;
          }
          
          if (actividades && actividades.length > 0) {
            for (const proyecto of actividades) {
              // Asegurar que el campo tipo esté presente y normalizado
              // El tipo puede venir como string, objeto con .nombre, o null
              let tipo = null;
              
              // Intentar obtener el tipo de diferentes formas
              if (proyecto.tipo) {
                if (typeof proyecto.tipo === 'object' && proyecto.tipo.nombre) {
                  tipo = proyecto.tipo.nombre;
                } else if (typeof proyecto.tipo === 'string') {
                  // Verificar que no sea un UUID (ID de tipo en lugar del nombre)
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (!uuidRegex.test(proyecto.tipo)) {
                    tipo = proyecto.tipo; // Es un nombre, no un UUID
                  } else {
                    console.warn('⚠️ Proyecto tiene tipo como UUID:', proyecto.id, proyecto.nombre, 'UUID:', proyecto.tipo);
                    tipo = null; // No usar UUID como tipo
                  }
                }
              }
              
              // Si aún no hay tipo, intentar otros campos
              if (!tipo) {
                tipo = proyecto.categoryKey || proyecto.category || null;
                // Verificar que categoryKey tampoco sea un UUID
                if (tipo) {
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (uuidRegex.test(String(tipo))) {
                    // Es un UUID, intentar obtener el nombre desde el mapa de tipos
                    if (tiposActividadMap[tipo]) {
                      tipo = tiposActividadMap[tipo];
                      console.log(`✅ Tipo UUID ${tipo} mapeado a nombre: ${tiposActividadMap[tipo]}`);
                    } else {
                      tipo = null; // No usar UUID como tipo si no está en el mapa
                    }
                  }
                }
              }
              
              // Si el tipo es un UUID y tenemos el mapa, intentar obtener el nombre
              if (tipo) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(String(tipo)) && tiposActividadMap[tipo]) {
                  tipo = tiposActividadMap[tipo];
                  console.log(`✅ Tipo UUID mapeado a nombre: ${tipo}`);
                }
              }
              
              // Convertir a string si no es null
              tipo = tipo ? String(tipo) : null;
              
              // Log para debugging
              if (!tipo) {
                console.warn('⚠️ Proyecto sin tipo válido:', proyecto.id, proyecto.nombre, 'tipo original:', proyecto.tipo, 'Campos disponibles:', Object.keys(proyecto));
              } else {
                console.log('✅ Proyecto con tipo:', proyecto.id, proyecto.nombre, 'tipo:', tipo);
              }
              
              // Determinar categoryKey basado en el tipo
              let categoryKey = proyecto.categoryKey || null;
              if (!categoryKey && tipo) {
                const tipoLower = tipo.toLowerCase();
                if (tipoLower.includes('capacitación') || tipoLower.includes('capacitacion')) {
                  categoryKey = 'capacitaciones';
                } else if (tipoLower.includes('entrega')) {
                  categoryKey = 'entregas';
                } else if (tipoLower.includes('proyecto') || tipoLower.includes('ayuda')) {
                  categoryKey = 'proyectos-ayuda';
                }
              }
              
              // Si aún no hay categoryKey pero hay tipo, usar el tipo como categoryKey
              if (!categoryKey && tipo) {
                categoryKey = tipo;
              }
              
              // Obtener el proyecto existente si existe
              const proyectoExistente = await window.OfflineDB.getProyecto(proyecto.id);
              
              // Asegurar que siempre tengamos tipo y categoryKey
              const tipoFinal = tipo || proyectoExistente?.tipo || null;
              const categoryKeyFinal = categoryKey || tipoFinal || proyectoExistente?.categoryKey || null;
              
              if (!tipoFinal) {
                console.warn('⚠️ Proyecto se guardará sin tipo:', proyecto.id, proyecto.nombre);
              }
              
              await window.OfflineDB.saveProyecto({
                ...(proyectoExistente || {}), // Preservar datos existentes
                ...proyecto, // Sobrescribir con datos nuevos del servidor
                tipo: tipoFinal,
                categoryKey: categoryKeyFinal,
                ultimo_sync: new Date().toISOString(),
                is_offline: false,
              });
            }
            console.log(`✅ ${actividades.length} proyectos sincronizados (lista básica)`);
            
            // Limpiar proyectos con UUIDs como tipo (proyectos mal guardados)
            try {
              const todosProyectos = await window.OfflineDB.getAllProyectos();
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              let proyectosActualizados = 0;
              
              for (const proyecto of todosProyectos) {
                const proyectoTipo = proyecto.tipo || proyecto.type || proyecto.categoryKey;
                if (proyectoTipo && uuidRegex.test(String(proyectoTipo))) {
                  // Este proyecto tiene un UUID como tipo, intentar actualizarlo
                  let tipoNombre = null;
                  
                  // Primero intentar obtener el nombre desde el mapa de tipos
                  if (tiposActividadMap[proyectoTipo]) {
                    tipoNombre = tiposActividadMap[proyectoTipo];
                    console.log(`✅ Tipo UUID ${proyectoTipo} encontrado en mapa: ${tipoNombre}`);
                  } else {
                    // Si no está en el mapa, buscar si existe en los proyectos sincronizados
                    const proyectoSincronizado = actividades.find(a => a.id === proyecto.id);
                    if (proyectoSincronizado) {
                      // El proyecto existe en el servidor, actualizar con los datos correctos
                      tipoNombre = proyectoSincronizado.tipo;
                      if (typeof tipoNombre === 'object' && tipoNombre.nombre) {
                        tipoNombre = tipoNombre.nombre;
                      }
                    }
                  }
                  
                  if (tipoNombre && !uuidRegex.test(String(tipoNombre))) {
                    // Determinar categoryKey
                    let categoryKey = null;
                    if (tipoNombre) {
                      const tipoLower = String(tipoNombre).toLowerCase();
                      if (tipoLower.includes('capacitación') || tipoLower.includes('capacitacion')) {
                        categoryKey = 'capacitaciones';
                      } else if (tipoLower.includes('entrega')) {
                        categoryKey = 'entregas';
                      } else if (tipoLower.includes('proyecto') || tipoLower.includes('ayuda')) {
                        categoryKey = 'proyectos-ayuda';
                      }
                    }
                    
                    await window.OfflineDB.saveProyecto({
                      ...proyecto,
                      tipo: tipoNombre,
                      categoryKey: categoryKey || tipoNombre,
                      ultimo_sync: new Date().toISOString(),
                      is_offline: proyecto.id && proyecto.id.startsWith('offline_') ? true : false,
                    });
                    proyectosActualizados++;
                    console.log(`✅ Proyecto ${proyecto.id} actualizado: UUID tipo "${proyectoTipo}" reemplazado por "${tipoNombre}"`);
                  } else {
                    // El proyecto no existe en el servidor o no se pudo mapear el UUID
                    console.log(`ℹ️ Proyecto ${proyecto.id} tiene UUID como tipo (${proyectoTipo}) pero no se pudo mapear a nombre. Puede ser proyecto offline pendiente.`);
                  }
                }
              }
              
              if (proyectosActualizados > 0) {
                console.log(`✅ ${proyectosActualizados} proyectos con UUID como tipo fueron actualizados`);
              }
            } catch (cleanupError) {
              console.warn('⚠️ Error al limpiar proyectos con UUID como tipo:', cleanupError);
            }
          }
        }
      } catch (error) {
        // Solo mostrar error si realmente hay conexión (puede ser un error de red temporal)
        if (navigator.onLine) {
          console.warn('⚠️ Error al sincronizar proyectos:', error);
        }
      }

      // Sincronizar eventos completos (con todos sus detalles)
      try {
        const eventosResponse = await fetch('/api/eventos/');
        if (eventosResponse.ok) {
          // Verificar Content-Type antes de parsear JSON
          const contentType = eventosResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ Respuesta de eventos no es JSON, saltando sincronización');
            // No intentar parsear, simplemente continuar
            throw new Error('Invalid content type');
          }
          let data;
          try {
            data = await eventosResponse.json();
          } catch (parseError) {
            // Si falla el parseo, probablemente es HTML
            console.warn('⚠️ Error al parsear respuesta de eventos como JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          if (data.success && data.eventos && Array.isArray(data.eventos)) {
            // Guardar la lista básica de eventos
            for (const evento of data.eventos) {
              // Asegurar que el campo tipo esté presente y normalizado
              // El tipo puede venir como string, objeto con .nombre, o null
              let tipo = null;
              
              // Intentar obtener el tipo de diferentes formas
              if (evento.tipo) {
                if (typeof evento.tipo === 'object' && evento.tipo.nombre) {
                  tipo = evento.tipo.nombre;
                } else if (typeof evento.tipo === 'string') {
                  // Verificar que no sea un UUID (ID de tipo en lugar del nombre)
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (!uuidRegex.test(evento.tipo)) {
                    tipo = evento.tipo; // Es un nombre, no un UUID
                  } else {
                    console.warn('⚠️ Evento tiene tipo como UUID:', evento.id, evento.nombre, 'UUID:', evento.tipo);
                    tipo = null; // No usar UUID como tipo
                  }
                }
              }
              
              // Si aún no hay tipo, intentar otros campos
              if (!tipo) {
                tipo = evento.categoryKey || evento.category || null;
                // Verificar que categoryKey tampoco sea un UUID
                if (tipo) {
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (uuidRegex.test(String(tipo))) {
                    // Es un UUID, intentar obtener el nombre desde el mapa de tipos
                    if (tiposActividadMap[tipo]) {
                      tipo = tiposActividadMap[tipo];
                      console.log(`✅ Tipo UUID ${tipo} mapeado a nombre: ${tiposActividadMap[tipo]}`);
                    } else {
                      tipo = null; // No usar UUID como tipo si no está en el mapa
                    }
                  }
                }
              }
              
              // Si el tipo es un UUID y tenemos el mapa, intentar obtener el nombre
              if (tipo) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(String(tipo)) && tiposActividadMap[tipo]) {
                  tipo = tiposActividadMap[tipo];
                  console.log(`✅ Tipo UUID mapeado a nombre: ${tipo}`);
                }
              }
              
              // Convertir a string si no es null
              tipo = tipo ? String(tipo) : null;
              
              // Log para debugging
              if (!tipo) {
                console.warn('⚠️ Evento sin tipo válido:', evento.id, evento.nombre, 'tipo original:', evento.tipo, 'Campos disponibles:', Object.keys(evento));
              }
              
              // Determinar categoryKey basado en el tipo
              let categoryKey = evento.categoryKey || null;
              if (!categoryKey && tipo) {
                const tipoLower = tipo.toLowerCase();
                if (tipoLower.includes('capacitación') || tipoLower.includes('capacitacion')) {
                  categoryKey = 'capacitaciones';
                } else if (tipoLower.includes('entrega')) {
                  categoryKey = 'entregas';
                } else if (tipoLower.includes('proyecto') || tipoLower.includes('ayuda')) {
                  categoryKey = 'proyectos-ayuda';
                }
              }
              
              // Obtener el proyecto existente si existe
              const proyectoExistente = await window.OfflineDB.getProyecto(evento.id);
              
              await window.OfflineDB.saveProyecto({
                ...(proyectoExistente || {}), // Preservar datos existentes (como detalles completos)
                ...evento, // Sobrescribir con datos nuevos del servidor
                tipo: tipo || proyectoExistente?.tipo || null, // Asegurar que siempre tenga tipo
                categoryKey: categoryKey || tipo || proyectoExistente?.categoryKey || null, // Asegurar categoryKey
                ultimo_sync: new Date().toISOString(),
                is_offline: false,
              });
            }
            console.log(`✅ ${data.eventos.length} eventos sincronizados (lista básica)`);
            
            // Cargar detalles completos de los primeros 10 eventos más recientes para tenerlos disponibles offline
            const eventosRecientes = data.eventos.slice(0, 10);
            let eventosDetallesSincronizados = 0;
            for (const eventoBasico of eventosRecientes) {
              try {
                const detalleResponse = await fetch(`/api/evento/${eventoBasico.id}/`, {
                  credentials: 'include',
                  headers: {
                    'Accept': 'application/json',
                  }
                }).catch(() => {
                  // Si el fetch falla, retornar null para que se maneje en el catch
                  return null;
                });
                
                // Si es 403 o null, el usuario no tiene permisos para ver este evento, ignorar silenciosamente
                if (!detalleResponse || detalleResponse.status === 403) {
                  // No mostrar error, es esperado cuando no hay permisos
                  continue;
                }
                
                if (detalleResponse.ok) {
                  // Verificar Content-Type antes de parsear JSON
                  const contentType = detalleResponse.headers.get('content-type');
                  if (!contentType || !contentType.includes('application/json')) {
                    // No es JSON, probablemente HTML, saltar este evento
                    continue;
                  }
                  let detalleData;
                  try {
                    detalleData = await detalleResponse.json();
                  } catch (parseError) {
                    // Si falla el parseo, probablemente es HTML, saltar este evento
                    continue;
                  }
                  if (detalleData.success && detalleData.evento) {
                    const eventoCompleto = detalleData.evento;
                    // Asegurar que el campo tipo esté presente y normalizado
                    let tipo = eventoCompleto.tipo || eventoCompleto.categoryKey || eventoCompleto.category || null;
                    // Si tipo es un objeto, extraer el nombre
                    if (tipo && typeof tipo === 'object' && tipo.nombre) {
                      tipo = tipo.nombre;
                    }
                    // Convertir a string si no es null
                    tipo = tipo ? String(tipo) : null;
                    
                    // Determinar categoryKey basado en el tipo
                    let categoryKey = eventoCompleto.categoryKey || null;
                    if (!categoryKey && tipo) {
                      const tipoLower = tipo.toLowerCase();
                      if (tipoLower.includes('capacitación') || tipoLower.includes('capacitacion')) {
                        categoryKey = 'capacitaciones';
                      } else if (tipoLower.includes('entrega')) {
                        categoryKey = 'entregas';
                      } else if (tipoLower.includes('proyecto') || tipoLower.includes('ayuda')) {
                        categoryKey = 'proyectos-ayuda';
                      } else {
                        // Si no coincide con ninguno, intentar usar el tipo como categoryKey
                        categoryKey = tipo;
                      }
                    }
                    
                    // Si aún no hay categoryKey, usar el tipo
                    if (!categoryKey) {
                      categoryKey = tipo || 'sin-tipo';
                    }
                    
                    // Guardar evento completo con todos sus detalles
                    await window.OfflineDB.saveProyecto({
                      ...eventoCompleto,
                      tipo: tipo,
                      categoryKey: categoryKey,
                      beneficiarios: eventoCompleto.beneficiarios || [],
                      personal: eventoCompleto.personal || [],
                      comunidades: eventoCompleto.comunidades || [],
                      evidencias: eventoCompleto.evidencias || [],
                      cambios: eventoCompleto.cambios || [],
                      tarjetas_datos: eventoCompleto.tarjetas_datos || [],
                      archivos: eventoCompleto.archivos || [],
                      ultimo_sync: new Date().toISOString(),
                      is_offline: false,
                    });
                    
                    eventosDetallesSincronizados++;
                    
                    // Guardar beneficiarios individualmente
                    if (eventoCompleto.beneficiarios && Array.isArray(eventoCompleto.beneficiarios)) {
                      for (const benef of eventoCompleto.beneficiarios) {
                        try {
                          await window.OfflineDB.saveBeneficiario(benef);
                        } catch (error) {
                          // Ignorar errores al guardar beneficiarios individuales
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                // Ignorar errores al cargar detalles individuales (puede ser 403 si no tienes permisos)
                // Solo mostrar warning si no es un error de permisos (403) o de red offline
                const isPermissionError = (error.message && error.message.includes('403')) || 
                                         (error.response && error.response.status === 403) ||
                                         (error.status === 403);
                
                // Si es un error 403, ignorar silenciosamente (no hay permisos para ver este evento)
                if (isPermissionError) {
                  continue;
                }
                const isNetworkError = error.name === 'TypeError' && error.message.includes('Failed to fetch');
                if (!isPermissionError && !isNetworkError) {
                  console.warn(`⚠️ Error al cargar detalles del evento ${eventoBasico.id}:`, error);
                }
              }
            }
            console.log(`✅ Detalles completos de ${eventosDetallesSincronizados} eventos más recientes sincronizados`);
          }
        }
      } catch (error) {
        // Solo mostrar error si realmente hay conexión y no es un error de Content-Type (HTML en lugar de JSON)
        const isContentTypeError = error.message && error.message.includes('Invalid content type');
        if (navigator.onLine && !isContentTypeError) {
          console.warn('⚠️ Error al sincronizar eventos completos:', error);
        }
      }

      // Sincronizar comunidades
      try {
        const comunidadesResponse = await fetch('/api/comunidades/');
        if (comunidadesResponse.ok) {
          // Verificar Content-Type antes de parsear JSON
          const contentType = comunidadesResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ Respuesta de comunidades no es JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          let data;
          try {
            data = await comunidadesResponse.json();
          } catch (parseError) {
            // Si falla el parseo, probablemente es HTML
            console.warn('⚠️ Error al parsear respuesta de comunidades como JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          // La API puede devolver un objeto con success y comunidades, o directamente un array
          const comunidades = Array.isArray(data) ? data : (data.success && data.comunidades ? data.comunidades : []);
          if (comunidades.length > 0) {
            for (const comunidad of comunidades) {
              await window.OfflineDB.saveComunidad({
                ...comunidad,
                ultimo_sync: new Date().toISOString(),
                is_offline: false,
              });
            }
            console.log(`✅ ${comunidades.length} comunidades sincronizadas`);
          }
        }
      } catch (error) {
        // Solo mostrar error si realmente hay conexión
        if (navigator.onLine) {
          console.warn('⚠️ Error al sincronizar comunidades:', error);
        }
      }

      // Sincronizar regiones
      try {
        const regionesResponse = await fetch('/api/regiones/');
        if (regionesResponse.ok) {
          // Verificar Content-Type antes de parsear JSON
          const contentType = regionesResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ Respuesta de regiones no es JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          let data;
          try {
            data = await regionesResponse.json();
          } catch (parseError) {
            // Si falla el parseo, probablemente es HTML
            console.warn('⚠️ Error al parsear respuesta de regiones como JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          // La API puede devolver un objeto con success y regiones, o directamente un array
          const regiones = Array.isArray(data) ? data : (data.success && data.regiones ? data.regiones : []);
          if (regiones.length > 0) {
            for (const region of regiones) {
              await window.OfflineDB.saveRegion({
                ...region,
                ultimo_sync: new Date().toISOString(),
                is_offline: false,
              });
            }
            console.log(`✅ ${regiones.length} regiones sincronizadas`);
          }
        }
      } catch (error) {
        // Solo mostrar error si realmente hay conexión y no es un error de Content-Type (HTML en lugar de JSON)
        const isContentTypeError = error.message && error.message.includes('Invalid content type');
        if (navigator.onLine && !isContentTypeError) {
          console.warn('⚠️ Error al sincronizar regiones:', error);
        }
      }

      // Sincronizar personal/colaboradores
      try {
        const personalResponse = await fetch('/api/personal/');
        if (personalResponse.ok) {
          // Verificar Content-Type antes de parsear JSON
          const contentType = personalResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ Respuesta de personal no es JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          let dataPersonal;
          try {
            dataPersonal = await personalResponse.json();
          } catch (parseError) {
            // Si falla el parseo, probablemente es HTML
            console.warn('⚠️ Error al parsear respuesta de personal como JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          if (Array.isArray(dataPersonal) && dataPersonal.length > 0) {
            for (const persona of dataPersonal) {
              // Solo guardar colaboradores (el personal puede incluir otros tipos)
              if (persona.tipo === 'colaborador' || !persona.tipo) {
                await window.OfflineDB.put('colaboradores', {
                  id: persona.id,
                  nombre: persona.nombre,
                  nombres: persona.nombre,
                  username: persona.username || '',
                  puesto: persona.rol ? { nombre: persona.rol } : null,
                  saved_at: new Date().toISOString(),
                  ultimo_sync: new Date().toISOString(),
                  is_offline: false,
                });
              }
            }
            console.log(`✅ Personal/colaboradores sincronizados`);
          }
        }
      } catch (error) {
        // Solo mostrar error si realmente hay conexión y no es un error de Content-Type (HTML en lugar de JSON)
        const isContentTypeError = error.message && error.message.includes('Invalid content type');
        if (navigator.onLine && !isContentTypeError) {
          console.warn('⚠️ Error al sincronizar personal:', error);
        }
      }

      // Sincronizar beneficiarios (cargar los primeros 100 para tener un catálogo básico)
      try {
        const beneficiariosResponse = await fetch('/api/beneficiarios/?limit=100');
        if (beneficiariosResponse.ok) {
          // Verificar Content-Type antes de parsear JSON
          const contentType = beneficiariosResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ Respuesta de beneficiarios no es JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          let beneficiarios;
          try {
            beneficiarios = await beneficiariosResponse.json();
          } catch (parseError) {
            // Si falla el parseo, probablemente es HTML
            console.warn('⚠️ Error al parsear respuesta de beneficiarios como JSON, saltando sincronización');
            throw new Error('Invalid content type');
          }
          const beneficiariosArray = Array.isArray(beneficiarios) ? beneficiarios : [];
          if (beneficiariosArray.length > 0) {
            for (const benef of beneficiariosArray) {
              await window.OfflineDB.saveBeneficiario({
                ...benef,
                ultimo_sync: new Date().toISOString(),
                is_offline: false,
              });
            }
            console.log(`✅ ${beneficiariosArray.length} beneficiarios sincronizados`);
          }
        }
      } catch (error) {
        // Solo mostrar error si realmente hay conexión y no es un error de Content-Type (HTML en lugar de JSON)
        const isContentTypeError = error.message && error.message.includes('Invalid content type');
        if (navigator.onLine && !isContentTypeError) {
          console.warn('⚠️ Error al sincronizar beneficiarios:', error);
        }
      }

      console.log('✅ Sincronización desde servidor completada');
      document.dispatchEvent(new CustomEvent('OfflineSync:synced'));
      updateSyncStatus();
    } catch (error) {
      console.error('❌ Error en sincronización desde servidor:', error);
      updateSyncStatus();
    }
  }

  // =====================================================
  // FUNCIÓN PARA ACTUALIZAR UI DE ESTADO
  // =====================================================

  function updateSyncStatus() {
    const statusEl = document.getElementById('syncStatus');
    if (!statusEl) {
      // Si el elemento no existe, intentar de nuevo después de un delay
      setTimeout(() => {
        const retryEl = document.getElementById('syncStatus');
        if (retryEl) {
          updateSyncStatus();
        }
      }, 500);
      return;
    }

    const syncTextEl = statusEl.querySelector('.sync-text');
    const syncCountEl = statusEl.querySelector('.sync-count');
    
    // Si los elementos hijos no existen, crear estructura básica o usar valores por defecto
    if (!syncTextEl || !syncCountEl) {
      // Intentar encontrar elementos alternativos o crear estructura
      const contentEl = statusEl.querySelector('.sync-status-content');
      if (contentEl) {
        // La estructura existe pero los elementos pueden tener nombres diferentes
        // Intentar actualizar directamente el contenido
        const queue = window.OfflineSync ? window.OfflineSync.getQueue() : [];
        const queueLength = queue ? queue.length : 0;
        
        if (!navigator.onLine) {
          statusEl.className = 'sync-status offline';
          statusEl.style.display = 'flex';
          contentEl.innerHTML = `
            <span class="sync-icon">🔄</span>
            <span class="sync-text">Modo Offline</span>
            <span class="sync-count">${queueLength} pendientes</span>
          `;
          console.log('✅ Botón Modo Offline mostrado (estructura alternativa):', { queueLength });
        } else if (queueLength > 0) {
          statusEl.className = 'sync-status syncing';
          statusEl.style.display = 'flex';
          contentEl.innerHTML = `
            <span class="sync-icon">🔄</span>
            <span class="sync-text">Pendientes de sincronizar</span>
            <span class="sync-count">${queueLength} pendientes</span>
          `;
        }
      }
      return;
    }

    const queue = window.OfflineSync.getQueue();
    const queueLength = queue ? queue.length : 0;

    if (!navigator.onLine) {
      // Asegurar que el banner se muestre cuando está offline
      const banner = getBannerElement();
      if (banner && !banner.classList.contains('is-visible')) {
        showBanner('Sin conexión a Internet. Los cambios se guardarán localmente.');
      }
      
      statusEl.className = 'sync-status offline';
      syncTextEl.textContent = 'Modo Offline';
      syncCountEl.textContent = `${queueLength} pendientes`;
      statusEl.style.display = 'flex';
      console.log('✅ Botón Modo Offline mostrado:', { queueLength, isOffline: true });
    } else if (flushing) {
      statusEl.className = 'sync-status syncing';
      syncTextEl.textContent = 'Sincronizando...';
      syncCountEl.textContent = `${queueLength} pendientes`;
      statusEl.style.display = 'flex';
    } else if (queueLength > 0) {
      statusEl.className = 'sync-status syncing';
      syncTextEl.textContent = 'Pendientes de sincronizar';
      syncCountEl.textContent = `${queueLength} pendientes`;
      statusEl.style.display = 'flex';
    } else {
      statusEl.className = 'sync-status synced';
      syncTextEl.textContent = 'Sincronizado';
      syncCountEl.textContent = '';
      setTimeout(() => {
        if (statusEl) {
          statusEl.style.display = 'none';
        }
      }, 2000);
    }
  }

  window.OfflineSync = {
    getQueue: () => [...queue],
    flush: (force) => flushQueue(force),
    forceFlush: () => flushQueue(true),
    syncFromServer: syncFromServer,
    clear: () => {
      queue = [];
      persistQueue();
      hideBanner();
      updateSyncStatus();
    },
    isOffline: () => !navigator.onLine,
    updateSyncStatus: updateSyncStatus,
    enqueueManual: (url, options) => {
      const initData = collectInitData(url, options);
      return Promise.resolve(initData).then((data) => {
        const request = {
          id: uuid(),
          url: normalizeUrl(url),
          method: (data.method || 'POST').toUpperCase(),
          headers: data.headers,
          body: data.body,
          credentials: data.credentials,
          createdAt: new Date().toISOString(),
        };
        enqueue(request);
        updateSyncStatus();
        console.log('📤 [SYNC] Item agregado a la cola:', request.method, request.url, 'ID:', request.id);
        // Retornar el ID de la cola para que pueda ser usado
        return request.id;
      }).catch((error) => {
        console.error('❌ [SYNC] Error al agregar item a la cola:', error);
        throw error;
      });
    },
  };

  // Función para verificar y mostrar banner offline si es necesario
  function checkAndShowOfflineBanner() {
    // Verificar si está offline (navigator.onLine puede no ser confiable, también verificar si hay errores de red)
    const isOffline = !navigator.onLine;
    
    if (isOffline) {
      console.log('⚠️ Verificando estado offline - Mostrando banner');
      const banner = getBannerElement();
      if (banner) {
        showBanner('Sin conexión a Internet. Los cambios se guardarán localmente.');
        updateSyncStatus();
      } else {
        // Si el banner no existe todavía, intentar de nuevo después de un breve delay
        setTimeout(() => {
          const bannerRetry = getBannerElement();
          if (bannerRetry && !navigator.onLine) {
            showBanner('Sin conexión a Internet. Los cambios se guardarán localmente.');
            updateSyncStatus();
          }
        }, 500);
      }
    }
  }

  window.addEventListener('online', () => {
    if (!queue.length) {
      hideBanner();
    } else {
      flushQueue();
    }
  });

  window.addEventListener('offline', () => {
    console.log('⚠️ Conexión perdida - Modo offline activado');
    showBanner('Sin conexión a Internet. Los cambios se guardarán localmente.');
    updateSyncStatus();
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Verificar estado offline al cargar la página
    checkAndShowOfflineBanner();
    
    if (navigator.onLine && queue.length) {
      flushQueue();
    }
    updateSyncStatus();

    // Sincronizar desde servidor cuando hay conexión (cada 5 minutos)
    if (navigator.onLine && window.OfflineSync && typeof window.OfflineSync.syncFromServer === 'function') {
      // Sincronizar inmediatamente
      setTimeout(() => {
        window.OfflineSync.syncFromServer();
      }, 2000);

      // Sincronizar periódicamente
      setInterval(() => {
        if (navigator.onLine) {
          window.OfflineSync.syncFromServer();
        }
      }, 5 * 60 * 1000); // Cada 5 minutos
    }
  });

  // Actualizar estado cuando cambia la cola
  document.addEventListener('OfflineSync:queued', updateSyncStatus);
  document.addEventListener('OfflineSync:sent', updateSyncStatus);
  document.addEventListener('OfflineSync:idle', updateSyncStatus);
  document.addEventListener('OfflineSync:synced', updateSyncStatus);
  document.addEventListener('OfflineSync:failed', updateSyncStatus);
  
  // Hacer el botón de sincronización clickeable para forzar sincronización
  document.addEventListener('DOMContentLoaded', () => {
    const syncStatusEl = document.getElementById('syncStatus');
    if (syncStatusEl) {
      const handleSyncClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const queue = window.OfflineSync.getQueue();
        if (queue.length === 0) {
          console.log('ℹ️ [SYNC] No hay elementos pendientes para sincronizar');
          return;
        }
        
        if (!navigator.onLine) {
          console.warn('⚠️ [SYNC] No hay conexión a Internet. No se puede sincronizar.');
          showBanner('Sin conexión a Internet');
          return;
        }
        
        console.log('🔄 [SYNC] Sincronización forzada por el usuario');
        await window.OfflineSync.forceFlush();
      };
      
      syncStatusEl.addEventListener('click', handleSyncClick);
      syncStatusEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSyncClick(e);
        }
      });
    }
  });

  // =====================================================
  // FUNCIÓN HELPER PARA VERIFICAR SI ES ERROR OFFLINE ESPERADO
  // =====================================================
  
  /**
   * Verifica si una respuesta es un error offline esperado
   * @param {Response} response - La respuesta del fetch
   * @returns {boolean} - true si es un error offline esperado
   */
  function isOfflineError(response) {
    if (!response) return false;
    
    // Si el status es 503 y estamos offline, es un error esperado
    if (response.status === 503 && !navigator.onLine) {
      return true;
    }
    
    // Verificar si la respuesta tiene el header X-Offline-Queued
    if (response.headers && response.headers.get('X-Offline-Queued') === 'true') {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica si un objeto de datos indica que es una respuesta offline
   * @param {Object} data - Los datos parseados de la respuesta
   * @returns {boolean} - true si es una respuesta offline
   */
  function isOfflineResponse(data) {
    if (!data || typeof data !== 'object') return false;
    return data.offline === true || (data.success === false && data.error === 'Sin conexión');
  }

  // Exponer funciones helper globalmente
  window.OfflineSync = window.OfflineSync || {};
  window.OfflineSync.isOfflineError = isOfflineError;
  window.OfflineSync.isOfflineResponse = isOfflineResponse;

  // =====================================================
  // DETECTAR CAMBIOS EN CONEXIÓN Y SINCRONIZAR
  // =====================================================

  // Verificar estado offline inmediatamente si el DOM ya está listo
  // Esto asegura que el banner se muestre incluso si la página se carga offline
  function initOfflineCheck() {
    // Verificar múltiples veces para asegurar que el banner se muestre
    checkAndShowOfflineBanner();
    
    // Verificar después de que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkAndShowOfflineBanner, 100);
      });
    } else {
      // DOM ya está listo, verificar después de un breve delay
      setTimeout(checkAndShowOfflineBanner, 100);
      setTimeout(checkAndShowOfflineBanner, 500);
    }
  }
  
  // Inicializar verificación offline
  initOfflineCheck();

})(window, document);

