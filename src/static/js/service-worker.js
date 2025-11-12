// Service Worker para notificaciones de recordatorios
const CACHE_NAME = 'webmaga-reminders-v1';
const CHECK_INTERVAL = 30000; // Verificar cada 30 segundos (más frecuente para Android)
let checkIntervalId = null;
let lastCheckTime = 0;
let sentNotifications = new Set(); // Para evitar notificaciones duplicadas

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
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
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
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
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store' // Evitar caché
    });
    
    if (!response.ok) {
      console.warn('[Service Worker] Error al obtener recordatorios:', response.status, response.statusText);
      // Si es error 401/403, el usuario no está autenticado o cerró sesión
      if (response.status === 401 || response.status === 403) {
        console.log('[Service Worker] Usuario no autenticado o sesión cerrada, saltando verificación');
      }
      return;
    }
    
    const data = await response.json();
    
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
      
      // Mostrar notificaciones que están listas:
      // 1. Recordatorios que ya pasaron pero están dentro del límite de 15 minutos (prioridad)
      // 2. Recordatorios futuros que están muy cercanos (dentro de 2 minutos para mejor detección)
      const debeMostrar = (tiempoRestante <= 0 && tiempoRestante >= -900) || // Ya pasó pero dentro de 15 minutos
                          (tiempoRestante > 0 && tiempoRestante <= 120); // Próximos 2 minutos (más margen para Android)
      
      if (debeMostrar) {
        // Verificar si ya fue enviado
        if (yaEnviado && !recordar) {
          return; // Ya enviado y sin recordar, saltar
        }
        
        // Crear clave única para evitar duplicados
        const notificationKey = `${reminderId}-${recordar ? 'reenviar' : 'principal'}`;
        
        // Verificar si ya enviamos esta notificación recientemente (últimos 5 minutos)
        if (sentNotifications.has(notificationKey)) {
          console.log('[Service Worker] Notificación ya enviada recientemente, saltando:', notificationKey);
          return;
        }
        
        // Construir título y cuerpo
        const title = recordar ? '🔔 Recordatorio (Recordar)' : '🔔 Recordatorio';
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
        
        const tag = `reminder-${reminderId}${recordar ? '-reenviar' : ''}`;
        
        console.log('[Service Worker] Mostrando notificación push:', { reminderId, tag, title });
        
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
            isReenviar: recordar
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
          
          // Marcar como enviado en el backend si no es reenvío
          if (!recordar && !yaEnviado) {
            fetch(`${baseUrl}/api/reminders/${reminderId}/marcar-enviado/`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
              }
            }).catch(err => {
              console.warn('[Service Worker] Error al marcar como enviado:', err);
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
    console.error('[Service Worker] Error al verificar recordatorios:', error);
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


