// Service Worker para notificaciones de recordatorios y modo offline
const CACHE_NAME = 'webmaga-offline-v4';
const CHECK_INTERVAL = 30000; // Verificar cada 30 segundos (más frecuente para Android)
let checkIntervalId = null;
let lastCheckTime = 0;
let sentNotifications = new Set(); // Para evitar notificaciones duplicadas

// Recursos a cachear para modo offline
const CACHE_URLS = [
  '/',
  '/static/css/styles.css',
  '/static/css/proyectos.css',
  '/static/css/gestioneseventos.css',
  '/static/css/comunidades.css',
  '/static/css/regiones.css',
  '/static/js/proyectos.js',
  '/static/js/gestioneseventos.js',
  '/static/js/offline-auth.js',
  '/static/js/offline-sync.js',
  '/static/js/navigation.js',
  '/static/js/login.js',
  '/static/img/logos/logo_maga.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando recursos para modo offline...');
      // Cachear recursos individualmente para que si uno falla, los demás puedan cachearse
      return Promise.allSettled(
        CACHE_URLS.map(url => {
          return cache.add(url).catch((error) => {
            // Verificar si es un error de red esperado (offline)
            // Si el error es "Failed to fetch" o similar, es porque está offline, lo cual es normal
            const isNetworkError = error.name === 'TypeError' && 
              (error.message.includes('Failed to fetch') || 
               error.message.includes('NetworkError') ||
               error.message.includes('ERR_INTERNET_DISCONNECTED') ||
               error.message.includes('ERR_NETWORK_CHANGED'));
            
            // Solo mostrar error si no es un error de red esperado (offline)
            // Los errores de red son normales cuando se instala el SW sin conexión
            if (!isNetworkError) {
              // Solo mostrar error si no es un error de red esperado
              console.warn(`[Service Worker] No se pudo cachear ${url}:`, error.message);
            }
            // Retornar null para indicar que este recurso no se pudo cachear
            return null;
          });
        })
      ).then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        const failed = results.length - successful;
        if (successful > 0) {
          console.log(`[Service Worker] ✅ ${successful} recursos cacheados exitosamente`);
        }
        // No mostrar advertencia sobre recursos fallidos, ya que es normal si está offline
        // Los recursos se cachearán cuando haya conexión y se acceda a ellos
      });
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Limpiar cachés antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
  
  // Iniciar verificación periódica de recordatorios
  startPeriodicCheck();
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Limpiar todo el cache cuando se hace logout
    console.log('[Service Worker] Limpiando cache por logout...');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[Service Worker] Eliminando cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[Service Worker] ✅ Cache limpiado exitosamente');
        // Notificar a todos los clientes que el cache fue limpiado
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  } else if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    // Mostrar notificación desde el Service Worker
    const { title, body, tag, data } = event.data;
    
    // En el Service Worker, siempre incluir vibración (se ignorará en desktop)
    const options = {
      body: body,
      icon: '/static/img/logos/logo_maga.png',
      badge: '/static/img/logos/logo_maga.png',
      tag: tag || 'reminder',
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200], // Vibración (se ignora en desktop, funciona en Android)
      data: data || {},
      timestamp: Date.now()
    };
    
    // Usar event.waitUntil para asegurar que la notificación se muestre
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => {
          console.log('[Service Worker] ✅ Notificación mostrada desde mensaje:', tag);
        })
        .catch(error => {
          console.error('[Service Worker] ❌ Error al mostrar notificación desde mensaje:', error);
        })
    );
  } else if (event.data && event.data.type === 'CHECK_REMINDERS') {
    // Pedir al cliente que verifique recordatorios
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'CHECK_REMINDERS' });
      });
    });
  } else if (event.data && event.data.type === 'CHECK_REMINDERS_BACKGROUND') {
    // Verificar recordatorios directamente desde el Service Worker (para Android)
    checkRemindersFromServiceWorker();
  }
});

// Función para mostrar notificación (mejorada para Android)
function showNotification(title, body, tag, data) {
  // En el Service Worker, siempre incluir vibración (se ignorará en desktop)
  const options = {
    body: body,
    icon: '/static/img/logos/logo_maga.png',
    badge: '/static/img/logos/logo_maga.png',
    tag: tag || 'reminder',
    requireInteraction: false,
    silent: false, // Asegurar que haga sonido
    vibrate: [200, 100, 200], // Vibración (se ignora en desktop, funciona en Android)
    data: data || {},
    timestamp: Date.now()
  };
  
  // Usar event.waitUntil para asegurar que la notificación se muestre
  return self.registration.showNotification(title, options).catch(error => {
    console.error('[Service Worker] Error al mostrar notificación:', error);
  });
}

// Verificar recordatorios directamente desde el Service Worker (para cuando la página está cerrada)
async function checkRemindersFromServiceWorker() {
  try {
    console.log('[Service Worker] Verificando recordatorios desde Service Worker...');
    
    // Obtener la URL base desde el origen
    const baseUrl = self.location.origin;
    // Usar el nuevo endpoint que verifica sesión activa
    const apiUrl = `${baseUrl}/api/reminders/check-background/`;
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store' // Evitar caché
      });
    } catch (fetchError) {
      // Si el fetch falla, probablemente estamos offline
      // No mostrar error en consola si es un error de red esperado
      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        // Silenciosamente ignorar errores de red (offline)
        return;
      }
      // Si es otro tipo de error, lanzarlo para que se maneje en el catch externo
      throw fetchError;
    }
    
    if (!response.ok) {
      // Si es error 401/403, el usuario no está autenticado o cerró sesión
      if (response.status === 401 || response.status === 403) {
        console.log('[Service Worker] Usuario no autenticado o sesión cerrada, saltando verificación');
        return;
      }
      // Para otros errores HTTP, solo mostrar warning (no error)
      console.warn('[Service Worker] Error al obtener recordatorios:', response.status, response.statusText);
      return;
    }
    
    // Verificar que la respuesta sea JSON antes de intentar parsear
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Si no es JSON (probablemente HTML de error), ignorar silenciosamente
      console.log('[Service Worker] Respuesta no es JSON, saltando verificación');
      return;
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // Si falla el parsing JSON (por ejemplo, si es HTML), ignorar silenciosamente
      console.log('[Service Worker] Error al parsear JSON, saltando verificación');
      return;
    }
    
    // Verificar si la sesión está activa
    if (!data.session_active) {
      console.log('[Service Worker] Sesión no activa, saltando verificación');
      return;
    }
    
    const reminders = data.reminders || [];
    
    if (!Array.isArray(reminders)) {
      console.warn('[Service Worker] Respuesta no es un array:', reminders);
      return;
    }
    
    if (reminders.length === 0) {
      console.log('[Service Worker] No hay recordatorios pendientes');
      return;
    }
    
    console.log(`[Service Worker] ${reminders.length} recordatorio(s) pendiente(s)`);
    
    // Procesar cada recordatorio
    reminders.forEach(reminder => {
      const reminderId = reminder.id;
      const tiempoRestante = reminder.tiempo_restante_segundos || 0;
      const recordar = reminder.recordar || false;
      const yaEnviado = reminder.enviado || false;
      
      // SOLO mostrar notificaciones para recordatorios que YA PASARON
      // NO enviar notificaciones para recordatorios futuros - esperar a que llegue la hora
      // Solo incluir recordatorios que ya pasaron pero están dentro de los 15 minutos
      const debeMostrar = tiempoRestante <= 0 && tiempoRestante >= -900; // Ya pasó pero dentro de 15 minutos
      
      if (debeMostrar) {
        // Verificar si ya fue enviado
        // Si ya fue enviado y NO tiene la opción "recordar", no enviar
        if (yaEnviado && !recordar) {
          return; // Ya enviado y sin recordar, saltar
        }
        
        // IMPORTANTE: El Service Worker NO debe reenviar automáticamente
        // Solo debe enviar la notificación principal una vez
        // El reenvío solo ocurre cuando el usuario recarga index.html y tiene "recordar" activado
        if (yaEnviado && recordar) {
          // Si ya fue enviado y tiene "recordar", NO reenviar desde el Service Worker
          // El reenvío se maneja solo en index.html cuando el usuario recarga la página
          return;
        }
        
        // Crear clave única para evitar duplicados
        const notificationKey = `${reminderId}-principal`;
        
        // Verificar si ya enviamos esta notificación recientemente (últimos 5 minutos)
        if (sentNotifications.has(notificationKey)) {
          console.log('[Service Worker] Notificación ya enviada recientemente, saltando:', notificationKey);
          return;
        }
        
        // Construir título y cuerpo (solo notificación principal, no reenvío)
        const title = '🔔 Recordatorio';
        let body = reminder.descripcion || '';
        
        if (reminder.evento_nombre || reminder.titulo) {
          body += (body ? '\n' : '') + `📅 Evento: ${reminder.evento_nombre || reminder.titulo}`;
        }
        
        if (reminder.fecha && reminder.hora) {
          body += (body ? '\n' : '') + `🕐 ${reminder.fecha} a las ${reminder.hora}`;
        }
        
        if (reminder.owners_text) {
          body += (body ? '\n' : '') + `👥 Personal: ${reminder.owners_text}`;
        }
        
        const tag = `reminder-${reminderId}`;
        
        console.log('[Service Worker] Mostrando notificación push:', { reminderId, tag, title, tiempoRestante });
        
        // Mostrar notificación usando Promise para asegurar que se muestre
        // Incluir vibración (se ignora en desktop, funciona en Android)
        const notificationPromise = self.registration.showNotification(title, {
          body: body || 'Tienes un recordatorio',
          icon: '/static/img/logos/logo_maga.png',
          badge: '/static/img/logos/logo_maga.png',
          tag: tag,
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200], // Vibración (se ignora en desktop, funciona en Android)
          data: {
            reminderId: reminderId,
            isReenviar: false  // Service Worker solo envía notificaciones principales
          },
          timestamp: Date.now()
        });
        
        notificationPromise.then(() => {
          console.log('[Service Worker] ✅ Notificación PUSH mostrada exitosamente:', reminderId);
          
          // Marcar como enviado para evitar duplicados (por 5 minutos)
          sentNotifications.add(notificationKey);
          setTimeout(() => {
            sentNotifications.delete(notificationKey);
          }, 5 * 60 * 1000); // 5 minutos
          
          // Marcar como enviado en el backend (solo notificación principal)
          if (!yaEnviado) {
            fetch(`${baseUrl}/api/reminders/${reminderId}/marcar-enviado/`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
              }
            }).catch(err => {
              // Solo mostrar warning si no es un error de red esperado (offline)
              if (err.name !== 'TypeError' || !err.message.includes('Failed to fetch')) {
                console.warn('[Service Worker] Error al marcar como enviado:', err);
              }
              // Si es un error de red, ignorarlo silenciosamente (se marcará cuando vuelva la conexión)
            });
          }
        }).catch(err => {
          console.error('[Service Worker] ❌ Error al mostrar notificación:', err);
          // Si falla, no agregar a sentNotifications para que pueda reintentar
        });
        
        // Asegurar que la promesa se complete antes de continuar
        return notificationPromise;
      }
    });
    
  } catch (error) {
    // Solo mostrar error si no es un error de red esperado (offline)
    // Los errores de red ya se manejan en el try interno
    if (error.name !== 'TypeError' || !error.message.includes('Failed to fetch')) {
      console.error('[Service Worker] Error inesperado al verificar recordatorios:', error);
    }
    // Si es un error de red, simplemente ignorarlo silenciosamente (estamos offline)
  }
}

// Manejar notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificación clickeada:', event.notification.tag);
  event.notification.close();
  
  // Abrir o enfocar la aplicación
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Recibir notificaciones push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recibido:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🔔 Recordatorio';
  const options = {
    body: data.body || data.descripcion || 'Tienes un recordatorio',
    icon: '/static/img/logos/logo_maga.png',
    badge: '/static/img/logos/logo_maga.png',
    tag: data.id || 'reminder',
    requireInteraction: false,
    silent: false,
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Función para verificar recordatorios periódicamente
function startPeriodicCheck() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
  }
  
  // Verificar inmediatamente al iniciar
  console.log('[Service Worker] Verificación inicial de recordatorios...');
  checkRemindersFromServiceWorker();
  
  checkIntervalId = setInterval(() => {
    const now = Date.now();
    // Evitar verificaciones demasiado frecuentes (mínimo 25 segundos entre checks)
    if (now - lastCheckTime < 25000) {
      console.log('[Service Worker] Saltando verificación (muy reciente)');
      return;
    }
    lastCheckTime = now;
    
    console.log('[Service Worker] Verificación periódica de recordatorios...');
    
    // Verificar recordatorios directamente desde el Service Worker (funciona incluso si la página está cerrada)
    checkRemindersFromServiceWorker();
    
    // También pedir a los clientes activos que verifiquen (para sincronización)
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        clients.forEach(client => {
          client.postMessage({ type: 'CHECK_REMINDERS' });
        });
      }
    });
  }, CHECK_INTERVAL);
  
  console.log('[Service Worker] Verificación periódica iniciada (cada', CHECK_INTERVAL / 1000, 'segundos)');
}

// Detener verificación cuando el Service Worker se desactiva
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STOP_PERIODIC_CHECK') {
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
  }
});

// =====================================================
// ESTRATEGIA DE CACHÉ PARA MODO OFFLINE
// =====================================================

self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // No cachear recursos externos (Google Fonts, CDN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // No cachear requests a la API (excepto algunas específicas)
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/api/usuario/')) {
    return;
  }

  // Páginas HTML que deben ser cacheadas para modo offline
  // Incluir todas las rutas principales y sus variantes
  const htmlPages = [
    '/proyectos/', '/comunidades/', '/regiones/', '/', '/index/',
    '/gestioneseventos/', '/gestionusuarios/', '/generarreportes/', 
    '/reportes/', '/mapa-completo/', '/perfil/', '/config-general/',
    '/preguntas-frecuentes/'
  ];
  // Detectar si es una página HTML (no tiene extensión de archivo o es una ruta conocida)
  const hasFileExtension = url.pathname.match(/\.(html|htm|css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json|xml|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i);
  const isHtmlPage = !hasFileExtension && (
    htmlPages.some(page => url.pathname === page || url.pathname.startsWith(page)) ||
    (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/static/') && !url.pathname.startsWith('/media/'))
  );

  // IMPORTANTE: No interceptar solicitudes de /media/ cuando está online
  // Permitir que pasen directamente al servidor para evitar problemas con imágenes
  if (url.pathname.startsWith('/media/') && navigator.onLine) {
    // Dejar que la solicitud pase directamente al servidor sin interceptarla
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      // Verificar headers de cache-control antes de cachear
      const cacheControl = response.headers.get('Cache-Control');
      const pragma = response.headers.get('Pragma');
      
      // NO cachear si el servidor indica no-cache o no-store
      if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))) {
        // Si hay una respuesta en caché, eliminarla para forzar actualización
        if (isHtmlPage) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.delete(event.request);
          });
        }
        return response;
      }
      
      if (pragma && pragma.includes('no-cache')) {
        if (isHtmlPage) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.delete(event.request);
          });
        }
        return response;
      }

      // Verificar si está en caché solo para modo offline
      return caches.match(event.request).then((cachedResponse) => {
        // Si estamos online y hay una respuesta fresca del servidor, usarla
        if (navigator.onLine && response && response.status === 200) {
          // Solo cachear recursos estáticos (CSS, JS, imágenes) cuando estamos online
          // NO cachear páginas HTML cuando estamos online para evitar problemas de sesión
          if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }
        
        // Si estamos offline y hay una respuesta en caché, usarla
        if (!navigator.onLine && cachedResponse) {
          return cachedResponse;
        }
        
        // Si estamos offline y no hay caché, intentar servir fallback para páginas HTML
        if (!navigator.onLine && isHtmlPage) {
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.keys().then((keys) => {
              const htmlKey = keys.find(key => {
                const keyUrl = new URL(key.url);
                return keyUrl.origin === self.location.origin && 
                       htmlPages.some(page => keyUrl.pathname === page || keyUrl.pathname.startsWith(page));
              });
              if (htmlKey) {
                return cache.match(htmlKey);
              }
              return new Response('Sin conexión a internet', { status: 503, headers: { 'Content-Type': 'text/plain' } });
            });
          });
        }
        
        return response;
      });

    }).catch((error) => {
      // Si falla el fetch y es una página HTML, intentar servir desde caché solo si estamos offline
      if (isHtmlPage && !navigator.onLine) {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si la página específica no está en caché, intentar servir cualquier página HTML cacheada como fallback
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.keys().then((keys) => {
              const htmlRequests = keys.filter((request) => {
                try {
                  const cachedUrl = new URL(request.url);
                  const cachedHasExtension = cachedUrl.pathname.match(/\.(html|htm|css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json|xml|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i);
                  const cachedIsHtml = !cachedHasExtension && 
                    !cachedUrl.pathname.startsWith('/api/') && 
                    !cachedUrl.pathname.startsWith('/static/') && 
                    !cachedUrl.pathname.startsWith('/media/');
                  return cachedIsHtml;
                } catch (e) {
                  return false;
                }
              });
              
              if (htmlRequests.length > 0) {
                return cache.match(htmlRequests[0]);
              }
              
              return caches.match('/').then((fallback) => {
                return fallback || new Response('Sin conexión. Por favor, visita esta página con conexión a Internet al menos una vez para que esté disponible offline.', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'text/html; charset=utf-8'
                  })
                });
              });
            });
          });
        });
      }
      
      // Si no es una página HTML o estamos online, devolver error normalmente
      if (url.origin === self.location.origin && 
          !(error.name === 'TypeError' && error.message.includes('Failed to fetch'))) {
        console.log('[Service Worker] Fetch failed:', error);
      }
      return new Response('Error de red', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
});


