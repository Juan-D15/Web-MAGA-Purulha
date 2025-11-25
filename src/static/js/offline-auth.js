(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'magaOfflineAuth';
  const ACTIVE_SESSION_KEY = 'magaOfflineActiveSession';
  const LAST_PATH_KEY = 'magaOfflineLastPath';
  const DEVICE_KEY = 'magaOfflineDeviceId';
  const DEFAULT_EXPIRY_HOURS = 72;
  const MAX_ALIAS_PER_USER = 5;
  const textEncoder = new TextEncoder();

  function generateUUID() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function normalizeIdentity(identity) {
    return (identity || '').trim().toLowerCase();
  }

  function loadStore() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function saveStore(store) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
    }
  }

  function getDeviceId() {
    let deviceId = window.localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      window.localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  }

  function ensureStore() {
    let store = loadStore();
    let modified = false;
    if (!store) {
      store = {};
      modified = true;
    }
    if (!store.version) {
      store.version = 1;
      modified = true;
    }
    if (!store.users || typeof store.users !== 'object') {
      store.users = {};
      modified = true;
    }
    if (!store.deviceId) {
      store.deviceId = getDeviceId();
      modified = true;
    }
    if (modified) {
      saveStore(store);
    }
    return store;
  }

  function enrichUserInfo(userInfo, overrides = {}) {
    const base = userInfo || {};
    return {
      autenticado: true,
      isAuthenticated: true,
      isOffline: true,
      username: base.username || overrides.username || '',
      nombre: base.nombre || base.name || overrides.nombre || '',
      email: base.email || overrides.email || '',
      rol: base.rol || base.role || overrides.rol || 'personal',
      isAdmin: Boolean(base.isAdmin || overrides.isAdmin || base.rol === 'admin'),
      isPersonal: Boolean(
        base.isPersonal ||
          overrides.isPersonal ||
          base.rol === 'personal' ||
          (!base.rol && !overrides.isAdmin)
      ),
      permisos: base.permisos || overrides.permisos || {},
    };
  }

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
      return meta.getAttribute('content');
    }
    const name = 'csrftoken';
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (let i = 0; i < cookies.length; i += 1) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === `${name}=`) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }
    return null;
  }

  async function hashPassword(password, salt) {
    const data = textEncoder.encode(`${salt}:${password}`);
    const buffer = await window.crypto.subtle.digest('SHA-256', data);
    return bufferToBase64(buffer);
  }

  function cleanupExpiredEntries(store) {
    const now = Date.now();
    let modified = false;
    for (const key of Object.keys(store.users)) {
      const credential = store.users[key];
      if (!credential) {
        delete store.users[key];
        modified = true;
        continue;
      }
      if (credential.expiresAt && Date.parse(credential.expiresAt) < now) {
        delete store.users[key];
        modified = true;
      }
    }
    if (modified) {
      saveStore(store);
    }
  }

  function findCredential(identity, store) {
    const normalized = normalizeIdentity(identity);
    const users = store.users || {};
    if (users[normalized]) {
      return { key: normalized, credential: users[normalized] };
    }
    for (const [key, credential] of Object.entries(users)) {
      const aliases = credential.aliases || [];
      if (aliases.includes(normalized)) {
        return { key, credential };
      }
    }
    return null;
  }

  function saveActiveSession(session) {
    try {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
    }
  }

  function clearActiveSession() {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    if (document.body && document.body.classList) {
      document.body.classList.remove('offline-session-activa');
    }
  }

  function getActiveSession() {
    try {
      const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      if (parsed.expiresAt && Date.parse(parsed.expiresAt) < Date.now()) {
        clearActiveSession();
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function recordVisitedPath(path) {
    if (!path) {
      return;
    }
    try {
      window.localStorage.setItem(LAST_PATH_KEY, path);
    } catch (error) {
    }
  }

  async function registerPendingSessions(store) {
    if (!navigator.onLine) {
      return;
    }
    const csrf = getCsrfToken();
    if (!csrf) {
      return;
    }
    const payloads = [];
    for (const [key, credential] of Object.entries(store.users)) {
      if (!credential || credential.pendingRegistration !== true) {
        continue;
      }
      if (!credential.hash || !credential.salt) {
        continue;
      }
      const userInfoData = credential.userInfo || {};
      const username = userInfoData.username || credential.username || key;
      payloads.push({
        key,
        credential,
        body: {
          username,
          credential_hash: credential.hash,
          salt: credential.salt,
          expires_at: credential.expiresAt,
          device_id: store.deviceId,
          permisos: userInfoData.permisos || {},
          metadata: {
            nombre: userInfoData.nombre || '',
            email: userInfoData.email || '',
            rol: userInfoData.rol || '',
            navegador: window.navigator.userAgent || '',
            sistema_operativo: window.navigator.platform || '',
          },
        },
      });
    }

    if (!payloads.length) {
      return;
    }

    let modified = false;
    await Promise.all(
      payloads.map(async (item) => {
        try {
          // Solo intentar registrar si hay conexión
          if (!navigator.onLine) {
            // Si está offline, mantener pendingRegistration pero no mostrar error
            return;
          }
          
          const response = await window.fetch('/api/auth/offline/register/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrf,
            },
            body: JSON.stringify(item.body),
          });
          
          if (!response.ok) {
            // Si es error 500 o similar, no es crítico para el funcionamiento offline
            // Solo loguear en modo debug, no mostrar error al usuario
            const detail = await response.json().catch(() => ({}));
            const errorMsg = detail.error || `HTTP ${response.status}`;
            console.log(`[OfflineAuth] No se pudo registrar sesión en servidor (no crítico): ${errorMsg}`);
            // Mantener pendingRegistration para reintentar más tarde
            item.credential.lastRegistrationError = errorMsg;
            item.credential.pendingRegistration = true;
            modified = true;
            return;
          }
          
          const data = await response.json().catch(() => ({}));
          item.credential.pendingRegistration = false;
          item.credential.lastRegisteredAt = new Date().toISOString();
          item.credential.serverExpiresAt = data.expires_at || null;
          modified = true;
        } catch (error) {
          // Si es un error de red (offline), no mostrar error
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            // Estamos offline, mantener pendingRegistration pero no mostrar error
            return;
          }
          // Para otros errores, solo loguear en modo debug
          console.log(`[OfflineAuth] Error al registrar sesión (no crítico): ${error.message}`);
          item.credential.lastRegistrationError = error.message;
          item.credential.pendingRegistration = true;
          modified = true;
        }
      })
    );

    if (modified) {
      saveStore(store);
    }
  }

  function syncCredentialAliases(key, credential, identity) {
    const normalized = normalizeIdentity(identity);
    if (!credential.aliases) {
      credential.aliases = [];
    }
    if (!credential.aliases.includes(normalized)) {
      credential.aliases.push(normalized);
      if (credential.aliases.length > MAX_ALIAS_PER_USER) {
        credential.aliases = credential.aliases.slice(-MAX_ALIAS_PER_USER);
      }
    }
    if (!credential.aliases.includes(key)) {
      credential.aliases.push(key);
    }
  }

  const OfflineAuth = {
    getDeviceId,

    recordVisitedPath,

    getCredential(identity) {
      const store = ensureStore();
      cleanupExpiredEntries(store);
      const result = findCredential(identity, store);
      return result ? { ...result } : null;
    },

    removeCredential(identity) {
      const store = ensureStore();
      const result = findCredential(identity, store);
      if (!result) {
        return;
      }
      delete store.users[result.key];
      saveStore(store);
      const active = getActiveSession();
      if (active && normalizeIdentity(active.username) === normalizeIdentity(identity)) {
        clearActiveSession();
      }
    },

    async storeCredential(identity, password, options = {}) {
      const store = ensureStore();
      cleanupExpiredEntries(store);
      const normalized = normalizeIdentity(identity);
      const existing = findCredential(identity, store);
      const credential = (existing && existing.credential) ? existing.credential : {};
      const now = new Date();
      const salt =
        credential.salt ||
        bufferToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
      const hash = await hashPassword(password, salt);
      const durationHours =
        typeof options.durationHours === 'number' && options.durationHours > 0
          ? options.durationHours
          : DEFAULT_EXPIRY_HOURS;
      const expiresAt = new Date(
        now.getTime() + durationHours * 60 * 60 * 1000
      ).toISOString();

      credential.username = credential.username || identity;
      credential.hash = hash;
      credential.salt = salt;
      credential.createdAt = credential.createdAt || now.toISOString();
      credential.updatedAt = now.toISOString();
      credential.expiresAt = expiresAt;
      credential.pendingRegistration = true;
      credential.aliases = credential.aliases || [];
      syncCredentialAliases(existing ? existing.key : normalized, credential, identity);

      if (!existing) {
        store.users[normalized] = credential;
      } else if (existing.key !== normalized) {
        store.users[existing.key] = credential;
        if (!store.users[normalized]) {
          store.users[normalized] = credential;
        }
      }

      saveStore(store);
      
      // Si se proporciona userInfo, crear sesión activa automáticamente
      if (options.userInfo) {
        try {
          const userInfo = enrichUserInfo(options.userInfo, {
            username: credential.username || identity,
          });
          const session = {
            username: userInfo.username,
            activatedAt: new Date().toISOString(),
            expiresAt: expiresAt,
            deviceId: store.deviceId,
            userInfo,
          };
          saveActiveSession(session);
          if (document.body && document.body.classList) {
            document.body.classList.add('offline-session-activa');
          }
          // También actualizar window.USER_AUTH para que esté disponible inmediatamente
          window.USER_AUTH = userInfo;
          console.log('[OfflineAuth] Sesión activa creada:', { username: userInfo.username, expiresAt });
        } catch (error) {
          console.error('[OfflineAuth] Error al crear sesión activa:', error);
        }
      } else {
        console.warn('[OfflineAuth] No se proporcionó userInfo al guardar credenciales');
      }
      
      return { hash, salt, expiresAt };
    },

    async tryOfflineLogin(identity, password) {
      const store = ensureStore();
      cleanupExpiredEntries(store);
      const result = findCredential(identity, store);
      if (!result) {
        return {
          success: false,
          error: 'No hay credenciales offline guardadas para este usuario en este dispositivo.',
        };
      }
      const credential = result.credential;
      if (!credential.hash || !credential.salt) {
        return { success: false, error: 'Las credenciales almacenadas son inválidas.' };
      }
      if (credential.expiresAt && Date.parse(credential.expiresAt) < Date.now()) {
        delete store.users[result.key];
        saveStore(store);
        return { success: false, error: 'Las credenciales offline expiraron. Inicia sesión en línea nuevamente.' };
      }
      const computedHash = await hashPassword(password, credential.salt);
      if (computedHash !== credential.hash) {
        return { success: false, error: 'Usuario o contraseña incorrectos (modo offline).' };
      }

      const userInfo = enrichUserInfo(credential.userInfo, {
        username:
          (credential.userInfo && credential.userInfo.username) ||
          credential.username ||
          identity,
      });
      const session = {
        username: userInfo.username,
        activatedAt: new Date().toISOString(),
        expiresAt: credential.expiresAt,
        deviceId: store.deviceId,
        userInfo,
      };
      saveActiveSession(session);
      if (document.body && document.body.classList) {
        document.body.classList.add('offline-session-activa');
      }

      const redirectUrl =
        window.localStorage.getItem(LAST_PATH_KEY) || window.location.origin || '/';
      return {
        success: true,
        userInfo,
        redirectUrl,
      };
    },

    getActiveSession,

    clearActiveSession() {
      clearActiveSession();
    },

    syncUserInfo(userInfo) {
      if (!userInfo || !userInfo.username) {
        return;
      }
      const store = ensureStore();
      const canonicalKey = normalizeIdentity(userInfo.username);
      cleanupExpiredEntries(store);
      let result = findCredential(userInfo.username, store);
      if (!result) {
        result = Object.entries(store.users).find(([, credential]) => {
          return (
            credential &&
            credential.userInfo &&
            normalizeIdentity(credential.userInfo.username) === canonicalKey
          );
        });
        if (result) {
          result = { key: result[0], credential: result[1] };
        }
      }
      if (!result) {
        return;
      }
      const { key, credential } = result;
      const enriched = enrichUserInfo(userInfo);
      credential.userInfo = enriched;
      credential.username = userInfo.username;
      credential.aliases = credential.aliases || [];
      if (!credential.aliases.includes(canonicalKey)) {
        credential.aliases.push(canonicalKey);
      }
      if (userInfo.email) {
        const emailKey = normalizeIdentity(userInfo.email);
        if (!credential.aliases.includes(emailKey)) {
          credential.aliases.push(emailKey);
        }
      }
      credential.updatedAt = new Date().toISOString();
      store.users[key] = credential;
      if (key !== canonicalKey) {
        store.users[canonicalKey] = credential;
      }
      saveStore(store);
      const active = getActiveSession();
      if (active && normalizeIdentity(active.username) === canonicalKey) {
        active.userInfo = enriched;
        saveActiveSession(active);
      }
    },

    async bootstrap(userAuth) {
      const store = ensureStore();
      cleanupExpiredEntries(store);
      
      // Siempre verificar si hay una sesión offline activa primero
      const active = getActiveSession();
      if (active && active.userInfo) {
        // Si hay sesión offline activa, usarla (incluso si navigator.onLine es true)
        // Esto permite que el usuario siga trabajando si la conexión falla intermitentemente
        window.USER_AUTH = active.userInfo;
        if (document.body && document.body.classList) {
          document.body.classList.add('offline-session-activa');
        }
        
        // Si estamos online, intentar sincronizar
        if (navigator.onLine) {
          this.syncUserInfo(active.userInfo);
          recordVisitedPath(window.location.pathname + window.location.search);
          await registerPendingSessions(store);
        }
        return;
      }
      
      // Si no hay sesión offline activa y estamos offline, no hacer nada más
      if (!navigator.onLine) {
        return;
      }

      // Si estamos online y hay autenticación del servidor, sincronizar
      if (userAuth && userAuth.isAuthenticated) {
        this.syncUserInfo(userAuth);
        recordVisitedPath(window.location.pathname + window.location.search);
        await registerPendingSessions(store);
      } else if (!userAuth || !userAuth.isAuthenticated) {
        // Solo limpiar sesión offline si estamos online y no hay autenticación del servidor
        clearActiveSession();
      }
    },
  };

  window.OfflineAuth = OfflineAuth;

  document.addEventListener('DOMContentLoaded', () => {
    try {
      recordVisitedPath(window.location.pathname + window.location.search);
    } catch (error) {
    }
  });

  if (typeof window.USER_AUTH !== 'undefined') {
    OfflineAuth.bootstrap(window.USER_AUTH || null);
  } else {
    OfflineAuth.bootstrap(null);
  }
})(window, document);


