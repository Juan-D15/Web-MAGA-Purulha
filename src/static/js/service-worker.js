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
  event.waitUntil(self.clients.claim());
  
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
  }
});

// Función para mostrar notificación
function showNotification(title, body, tag, data) {
  const options = {
    body: body,
    icon: '/static/img/logos/logo_maga.png',
    badge: '/static/img/logos/logo_maga.png',
    tag: tag || 'reminder',
    requireInteraction: false,
    data: data || {}
  };
  
  self.registration.showNotification(title, options);
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
    // Pedir a los clientes que verifiquen recordatorios
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        clients.forEach(client => {
          client.postMessage({ type: 'CHECK_REMINDERS_BACKGROUND' });
        });
      } else {
        // No hay clientes activos, pero el Service Worker puede seguir funcionando
        console.log('[Service Worker] No hay clientes activos, pero Service Worker sigue activo');
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

