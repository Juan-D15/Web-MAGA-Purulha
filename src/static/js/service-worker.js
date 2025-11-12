// Service Worker para notificaciones de recordatorios
const CACHE_NAME = 'webmaga-reminders-v1';
const CHECK_INTERVAL = 60000; // Verificar cada minuto
let checkIntervalId = null;

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
    showNotification(title, body, tag, data);
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
  const options = {
    body: body,
    icon: '/static/img/logos/logo_maga.png',
    badge: '/static/img/logos/logo_maga.png',
    tag: tag || 'reminder',
    requireInteraction: false,
    silent: false, // Asegurar que haga sonido en Android
    vibrate: [200, 100, 200], // Vibración para Android
    data: data || {},
    // Opciones adicionales para Android
    actions: [],
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
    const apiUrl = `${baseUrl}/api/reminders/pending/`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn('[Service Worker] Error al obtener recordatorios:', response.status);
      return;
    }
    
    const reminders = await response.json();
    
    if (!Array.isArray(reminders) || reminders.length === 0) {
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
      // 1. Recordatorios futuros (tiempo restante > 0 y muy cercanos, dentro de 1 minuto)
      // 2. Recordatorios que ya pasaron pero están dentro del límite de 15 minutos
      const debeMostrar = (tiempoRestante > 0 && tiempoRestante <= 60) || // Próximos 60 segundos
                          (tiempoRestante <= 0 && tiempoRestante >= -900); // Dentro de 15 minutos después
      
      if (debeMostrar) {
        // Verificar si ya fue enviado
        if (yaEnviado && !recordar) {
          return; // Ya enviado y sin recordar, saltar
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
        
        // Mostrar notificación usando event.waitUntil para asegurar que se muestre
        self.registration.showNotification(title, {
          body: body || 'Tienes un recordatorio',
          icon: '/static/img/logos/logo_maga.png',
          badge: '/static/img/logos/logo_maga.png',
          tag: tag,
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200], // Vibración para Android
          data: {
            reminderId: reminderId,
            isReenviar: recordar
          },
          timestamp: Date.now()
        }).then(() => {
          console.log('[Service Worker] Notificación mostrada:', reminderId);
          
          // Marcar como enviado si no es reenvío
          if (!recordar && !yaEnviado) {
            fetch(`${baseUrl}/api/reminders/${reminderId}/mark-sent/`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'X-Requested-With': 'XMLHttpRequest'
              }
            }).catch(err => {
              console.warn('[Service Worker] Error al marcar como enviado:', err);
            });
          }
        }).catch(err => {
          console.error('[Service Worker] Error al mostrar notificación:', err);
        });
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
  
  checkIntervalId = setInterval(() => {
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
  
  // Verificar inmediatamente al iniciar
  checkRemindersFromServiceWorker();
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

