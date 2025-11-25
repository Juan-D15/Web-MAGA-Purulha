// Script de diagnóstico para modo offline en producción
// Ejecutar en la consola del navegador: diagnosticoOffline()

(function() {
  'use strict';

  window.diagnosticoOffline = function() {
    console.log('========================================');
    console.log('🔍 DIAGNÓSTICO DE MODO OFFLINE');
    console.log('========================================\n');

    const resultados = {
      navegador: {},
      scripts: {},
      indexeddb: {},
      offlineSync: {},
      banner: {},
      serviceWorker: {},
      conexion: {}
    };

    // 1. Información del navegador
    console.log('1️⃣ NAVEGADOR:');
    resultados.navegador.userAgent = navigator.userAgent;
    resultados.navegador.onLine = navigator.onLine;
    resultados.navegador.cookieEnabled = navigator.cookieEnabled;
    resultados.navegador.indexedDB = !!window.indexedDB;
    resultados.navegador.serviceWorker = 'serviceWorker' in navigator;
    console.log('  ✅ User Agent:', resultados.navegador.userAgent);
    console.log('  ✅ Online:', resultados.navegador.onLine);
    console.log('  ✅ Cookies habilitadas:', resultados.navegador.cookieEnabled);
    console.log('  ✅ IndexedDB disponible:', resultados.navegador.indexedDB);
    console.log('  ✅ Service Worker disponible:', resultados.navegador.serviceWorker);
    console.log('');

    // 2. Scripts cargados
    console.log('2️⃣ SCRIPTS:');
    resultados.scripts.offlineDB = typeof window.OfflineDB !== 'undefined';
    resultados.scripts.offlineSync = typeof window.OfflineSync !== 'undefined';
    resultados.scripts.offlineAuth = typeof window.OfflineAuth !== 'undefined';
    console.log('  ✅ offline-db.js cargado:', resultados.scripts.offlineDB);
    console.log('  ✅ offline-sync.js cargado:', resultados.scripts.offlineSync);
    console.log('  ✅ offline-auth.js cargado:', resultados.scripts.offlineAuth);
    
    if (!resultados.scripts.offlineDB) {
      console.error('  ❌ offline-db.js NO está cargado. Verifica que el script esté incluido en base.html');
    }
    if (!resultados.scripts.offlineSync) {
      console.error('  ❌ offline-sync.js NO está cargado. Verifica que el script esté incluido en base.html');
    }
    console.log('');

    // 3. IndexedDB
    console.log('3️⃣ INDEXEDDB:');
    if (resultados.scripts.offlineDB) {
      resultados.indexeddb.existe = !!window.OfflineDB;
      resultados.indexeddb.db = window.OfflineDB && window.OfflineDB.db ? 'Inicializado' : 'No inicializado';
      console.log('  ✅ OfflineDB existe:', resultados.indexeddb.existe);
      console.log('  ✅ Estado de DB:', resultados.indexeddb.db);
      
      // Intentar obtener estadísticas
      if (window.OfflineDB && typeof window.OfflineDB.getStats === 'function') {
        window.OfflineDB.getStats().then(stats => {
          console.log('  ✅ Estadísticas de IndexedDB:', stats);
        }).catch(err => {
          console.error('  ❌ Error al obtener estadísticas:', err);
        });
      }
    } else {
      console.error('  ❌ IndexedDB no disponible porque offline-db.js no está cargado');
    }
    console.log('');

    // 4. OfflineSync
    console.log('4️⃣ OFFLINE SYNC:');
    if (resultados.scripts.offlineSync) {
      resultados.offlineSync.existe = !!window.OfflineSync;
      resultados.offlineSync.queue = window.OfflineSync ? window.OfflineSync.getQueue() : [];
      resultados.offlineSync.isOffline = window.OfflineSync ? window.OfflineSync.isOffline() : null;
      console.log('  ✅ OfflineSync existe:', resultados.offlineSync.existe);
      console.log('  ✅ Estado offline:', resultados.offlineSync.isOffline);
      console.log('  ✅ Elementos en cola:', resultados.offlineSync.queue.length);
      if (resultados.offlineSync.queue.length > 0) {
        console.log('  📋 Cola:', resultados.offlineSync.queue);
      }
    } else {
      console.error('  ❌ OfflineSync no disponible porque offline-sync.js no está cargado');
    }
    console.log('');

    // 5. Banner offline
    console.log('5️⃣ BANNER OFFLINE:');
    const banner = document.getElementById('offlineBanner');
    resultados.banner.existe = !!banner;
    resultados.banner.visible = banner ? banner.classList.contains('is-visible') : false;
    resultados.banner.display = banner ? window.getComputedStyle(banner).display : 'N/A';
    console.log('  ✅ Banner existe en DOM:', resultados.banner.existe);
    if (banner) {
      console.log('  ✅ Banner visible:', resultados.banner.visible);
      console.log('  ✅ Display CSS:', resultados.banner.display);
      console.log('  ✅ Clases:', banner.className);
    } else {
      console.error('  ❌ Banner NO existe. Verifica que el elemento #offlineBanner esté en base.html');
    }
    console.log('');

    // 6. Service Worker
    console.log('6️⃣ SERVICE WORKER:');
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        resultados.serviceWorker.registrado = registrations.length > 0;
        resultados.serviceWorker.cantidad = registrations.length;
        console.log('  ✅ Service Worker registrado:', resultados.serviceWorker.registrado);
        console.log('  ✅ Cantidad de registros:', resultados.serviceWorker.cantidad);
        
        if (registrations.length > 0) {
          registrations.forEach((reg, index) => {
            console.log(`  📋 Registro ${index + 1}:`, {
              scope: reg.scope,
              active: !!reg.active,
              installing: !!reg.installing,
              waiting: !!reg.waiting
            });
          });
        } else {
          console.warn('  ⚠️ No hay Service Workers registrados. Verifica que se esté registrando correctamente.');
        }
      }).catch(err => {
        console.error('  ❌ Error al verificar Service Worker:', err);
      });
    } else {
      console.error('  ❌ Service Worker no está disponible en este navegador');
    }
    console.log('');

    // 7. Estado de conexión
    console.log('7️⃣ ESTADO DE CONEXIÓN:');
    resultados.conexion.navigatorOnLine = navigator.onLine;
    resultados.conexion.protocolo = window.location.protocol;
    resultados.conexion.hostname = window.location.hostname;
    console.log('  ✅ navigator.onLine:', resultados.conexion.navigatorOnLine);
    console.log('  ✅ Protocolo:', resultados.conexion.protocolo);
    console.log('  ✅ Hostname:', resultados.conexion.hostname);
    
    // Intentar hacer un fetch de prueba
    fetch('/api/tipos-actividad/', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(3000)
    }).then(response => {
      resultados.conexion.fetchOk = response.ok;
      console.log('  ✅ Fetch de prueba exitoso:', response.ok);
    }).catch(error => {
      resultados.conexion.fetchOk = false;
      resultados.conexion.fetchError = error.message;
      console.log('  ❌ Fetch de prueba falló:', error.message);
      console.log('  ℹ️ Esto es normal si estás offline');
    });
    console.log('');

    // Resumen
    console.log('========================================');
    console.log('📊 RESUMEN:');
    console.log('========================================');
    
    const problemas = [];
    if (!resultados.scripts.offlineDB) problemas.push('❌ offline-db.js no está cargado');
    if (!resultados.scripts.offlineSync) problemas.push('❌ offline-sync.js no está cargado');
    if (!resultados.banner.existe) problemas.push('❌ Banner offline no existe en el DOM');
    if (!resultados.navegador.indexedDB) problemas.push('❌ IndexedDB no está disponible');
    if (!resultados.navegador.serviceWorker) problemas.push('❌ Service Worker no está disponible');
    
    if (problemas.length === 0) {
      console.log('✅ Todos los componentes están disponibles');
    } else {
      console.log('⚠️ PROBLEMAS DETECTADOS:');
      problemas.forEach(p => console.log('  ' + p));
    }
    
    console.log('\n💡 Para probar modo offline:');
    console.log('  1. Abre DevTools → Network → Throttling → Offline');
    console.log('  2. Recarga la página');
    console.log('  3. Verifica que aparezca el banner "Sin conexión a Internet"');
    console.log('  4. Ejecuta este diagnóstico nuevamente');
    
    return resultados;
  };

  // Ejecutar automáticamente si estamos en modo offline
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.log('⚠️ Modo offline detectado. Ejecuta diagnosticoOffline() para verificar el estado.');
  }
})();

