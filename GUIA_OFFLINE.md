# 📴 Guía de Implementación Offline - Web-MAGA-Purulhá

## 📊 Estado Actual del Sistema Offline

### ✅ Lo que YA está implementado:

1. **Service Worker** (`service-worker.js`)
   - Cachea recursos estáticos (CSS, JS, imágenes)
   - Funciona para notificaciones push
   - ✅ **FUNCIONANDO**

2. **Sincronización de Requests** (`offline-sync.js`)
   - Intercepta requests POST/PUT/DELETE cuando no hay conexión
   - Guarda en cola (localStorage) para sincronizar después
   - ✅ **FUNCIONANDO** para rutas específicas

3. **Autenticación Offline** (`offline-auth.js`)
   - Permite login offline con credenciales guardadas
   - Sesiones offline con expiración
   - ✅ **FUNCIONANDO**

4. **Modelos de Base de Datos**
   - Campos `version`, `ultimo_sync`, `modificado_offline` en:
     - `Actividad` (proyectos/eventos)
     - `Comunidad`
     - `Beneficiario`
   - Modelo `ColaSincronizacion` para operaciones pendientes
   - Modelo `SesionOffline` para sesiones offline
   - ✅ **IMPLEMENTADO**

### ⚠️ Lo que FALTA implementar:

1. **Almacenamiento Local de Datos (IndexedDB)**
   - Guardar proyectos/comunidades/regiones localmente
   - Permitir lectura offline de datos
   - ❌ **NO IMPLEMENTADO**

2. **Sincronización Bidireccional**
   - Descargar datos del servidor cuando hay conexión
   - Actualizar datos locales con cambios del servidor
   - ❌ **PARCIALMENTE IMPLEMENTADO**

3. **Manejo de Conflictos**
   - Detectar conflictos cuando se sincroniza
   - Resolver conflictos automáticamente o manualmente
   - ❌ **MODELO EXISTE, LÓGICA FALTA**

4. **UI de Estado de Sincronización**
   - Mostrar qué datos están pendientes de sincronizar
   - Indicador visual de estado offline/online
   - ❌ **BÁSICO IMPLEMENTADO (banner)**

5. **Rutas Completas de Proyectos**
   - Verificar que todas las rutas de proyectos estén en `allowedPaths`
   - ❌ **PARCIALMENTE IMPLEMENTADO**

---

## 🎯 Plan de Implementación

### FASE 1: Almacenamiento Local con IndexedDB

**Objetivo**: Guardar proyectos, comunidades y regiones localmente para poder leerlos offline.

#### Paso 1.1: Crear módulo de IndexedDB

Crear archivo: `src/static/js/offline-db.js`

```javascript
// offline-db.js - Gestión de IndexedDB para datos offline

const DB_NAME = 'webmaga_offline';
const DB_VERSION = 1;

const STORES = {
  PROYECTOS: 'proyectos',
  COMUNIDADES: 'comunidades',
  REGIONES: 'regiones',
  BENEFICIARIOS: 'beneficiarios',
  TIPOS_ACTIVIDAD: 'tipos_actividad',
  PERSONAL: 'personal',
  COLABORADORES: 'colaboradores',
};

class OfflineDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store de Proyectos
        if (!db.objectStoreNames.contains(STORES.PROYECTOS)) {
          const store = db.createObjectStore(STORES.PROYECTOS, { keyPath: 'id' });
          store.createIndex('tipo', 'tipo', { unique: false });
          store.createIndex('estado', 'estado', { unique: false });
          store.createIndex('fecha', 'fecha', { unique: false });
          store.createIndex('ultimo_sync', 'ultimo_sync', { unique: false });
        }

        // Store de Comunidades
        if (!db.objectStoreNames.contains(STORES.COMUNIDADES)) {
          const store = db.createObjectStore(STORES.COMUNIDADES, { keyPath: 'id' });
          store.createIndex('region_id', 'region_id', { unique: false });
          store.createIndex('nombre', 'nombre', { unique: false });
        }

        // Store de Regiones
        if (!db.objectStoreNames.contains(STORES.REGIONES)) {
          const store = db.createObjectStore(STORES.REGIONES, { keyPath: 'id' });
          store.createIndex('codigo', 'codigo', { unique: true });
        }

        // Store de Beneficiarios
        if (!db.objectStoreNames.contains(STORES.BENEFICIARIOS)) {
          const store = db.createObjectStore(STORES.BENEFICIARIOS, { keyPath: 'id' });
          store.createIndex('comunidad_id', 'comunidad_id', { unique: false });
        }

        // Store de Tipos de Actividad
        if (!db.objectStoreNames.contains(STORES.TIPOS_ACTIVIDAD)) {
          db.createObjectStore(STORES.TIPOS_ACTIVIDAD, { keyPath: 'id' });
        }

        // Store de Personal
        if (!db.objectStoreNames.contains(STORES.PERSONAL)) {
          db.createObjectStore(STORES.PERSONAL, { keyPath: 'id' });
        }

        // Store de Colaboradores
        if (!db.objectStoreNames.contains(STORES.COLABORADORES)) {
          db.createObjectStore(STORES.COLABORADORES, { keyPath: 'id' });
        }
      };
    });
  }

  // Métodos genéricos para CRUD
  async add(storeName, data) {
    const tx = this.db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    return store.add(data);
  }

  async put(storeName, data) {
    const tx = this.db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    return store.put(data);
  }

  async get(storeName, id) {
    const tx = this.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    return store.get(id);
  }

  async getAll(storeName, indexName = null, query = null) {
    const tx = this.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const source = indexName ? store.index(indexName) : store;
    return source.getAll(query);
  }

  async delete(storeName, id) {
    const tx = this.db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    return store.delete(id);
  }

  // Métodos específicos para Proyectos
  async saveProyecto(proyecto) {
    const data = {
      ...proyecto,
      saved_at: new Date().toISOString(),
      is_offline: true,
    };
    return this.put(STORES.PROYECTOS, data);
  }

  async getProyecto(id) {
    return this.get(STORES.PROYECTOS, id);
  }

  async getAllProyectos(tipo = null) {
    if (tipo) {
      return this.getAll(STORES.PROYECTOS, 'tipo', tipo);
    }
    return this.getAll(STORES.PROYECTOS);
  }

  async getProyectosByEstado(estado) {
    return this.getAll(STORES.PROYECTOS, 'estado', estado);
  }

  // Métodos específicos para Comunidades
  async saveComunidad(comunidad) {
    const data = {
      ...comunidad,
      saved_at: new Date().toISOString(),
      is_offline: true,
    };
    return this.put(STORES.COMUNIDADES, data);
  }

  async getAllComunidades(regionId = null) {
    if (regionId) {
      return this.getAll(STORES.COMUNIDADES, 'region_id', regionId);
    }
    return this.getAll(STORES.COMUNIDADES);
  }

  // Métodos específicos para Regiones
  async saveRegion(region) {
    const data = {
      ...region,
      saved_at: new Date().toISOString(),
      is_offline: true,
    };
    return this.put(STORES.REGIONES, data);
  }

  async getAllRegiones() {
    return this.getAll(STORES.REGIONES);
  }
}

// Instancia global
const offlineDB = new OfflineDB();

// Inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await offlineDB.init();
      console.log('✅ IndexedDB inicializado correctamente');
      window.OfflineDB = offlineDB;
    } catch (error) {
      console.error('❌ Error al inicializar IndexedDB:', error);
    }
  });
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflineDB, offlineDB };
}
```

#### Paso 1.2: Integrar IndexedDB en proyectos.js

Modificar `src/static/js/proyectos.js` para usar IndexedDB cuando no hay conexión:

```javascript
// Al inicio del archivo, después de las importaciones
let offlineDB = null;

// Inicializar IndexedDB
async function initOfflineDB() {
  if (window.OfflineDB) {
    offlineDB = window.OfflineDB;
    return true;
  }
  return false;
}

// Modificar función cargarProyectosPorTipo
async function cargarProyectosPorTipo(tipo) {
  try {
    // Intentar cargar desde servidor
    if (navigator.onLine) {
      const response = await fetch(`/api/proyectos/${tipo}/`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const proyectos = data.proyectos.map(proyecto => ({
            // ... mapeo existente
          }));

          // Guardar en IndexedDB para uso offline
          if (offlineDB) {
            proyectos.forEach(proyecto => {
              offlineDB.saveProyecto({
                ...proyecto,
                tipo: tipo,
                ultimo_sync: new Date().toISOString(),
              });
            });
          }

          return proyectos;
        }
      }
    }

    // Si no hay conexión, cargar desde IndexedDB
    if (offlineDB) {
      console.log('📴 Modo offline: Cargando proyectos desde IndexedDB');
      const proyectos = await offlineDB.getAllProyectos(tipo);
      return proyectos.map(p => ({
        id: p.id,
        name: p.nombre || p.name,
        // ... mapeo completo
      }));
    }

    throw new Error('Sin conexión y sin datos offline disponibles');
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
    return [];
  }
}

// Llamar a initOfflineDB al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  await initOfflineDB();
  // ... resto del código
});
```

---

### FASE 2: Sincronización Bidireccional

**Objetivo**: Sincronizar datos entre servidor y cliente cuando hay conexión.

#### Paso 2.1: Crear función de sincronización

Agregar a `offline-sync.js`:

```javascript
// Función para sincronizar datos desde el servidor
async function syncFromServer() {
  if (!navigator.onLine || !window.OfflineDB) {
    return;
  }

  console.log('🔄 Sincronizando datos desde el servidor...');

  try {
    // Sincronizar proyectos
    const proyectosResponse = await fetch('/api/actividades/');
    if (proyectosResponse.ok) {
      const data = await proyectosResponse.json();
      if (data.success && data.actividades) {
        for (const proyecto of data.actividades) {
          await window.OfflineDB.saveProyecto({
            ...proyecto,
            ultimo_sync: new Date().toISOString(),
            is_offline: false,
          });
        }
        console.log(`✅ ${data.actividades.length} proyectos sincronizados`);
      }
    }

    // Sincronizar comunidades
    const comunidadesResponse = await fetch('/api/comunidades/');
    if (comunidadesResponse.ok) {
      const data = await comunidadesResponse.json();
      if (data.success && data.comunidades) {
        for (const comunidad of data.comunidades) {
          await window.OfflineDB.saveComunidad({
            ...comunidad,
            ultimo_sync: new Date().toISOString(),
            is_offline: false,
          });
        }
        console.log(`✅ ${data.comunidades.length} comunidades sincronizadas`);
      }
    }

    // Sincronizar regiones
    const regionesResponse = await fetch('/api/regiones/');
    if (regionesResponse.ok) {
      const data = await regionesResponse.json();
      if (data.success && data.regiones) {
        for (const region of data.regiones) {
          await window.OfflineDB.saveRegion({
            ...region,
            ultimo_sync: new Date().toISOString(),
            is_offline: false,
          });
        }
        console.log(`✅ ${data.regiones.length} regiones sincronizadas`);
      }
    }

    console.log('✅ Sincronización completada');
    document.dispatchEvent(new CustomEvent('OfflineSync:synced'));
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
  }
}

// Sincronizar cuando se recupera la conexión
window.addEventListener('online', async () => {
  await syncFromServer();
  await flushQueue(); // Sincronizar cambios pendientes
});

// Sincronizar periódicamente (cada 5 minutos si hay conexión)
setInterval(() => {
  if (navigator.onLine) {
    syncFromServer();
  }
}, 5 * 60 * 1000);

// Exportar función
window.OfflineSync.syncFromServer = syncFromServer;
```

---

### FASE 3: Mejorar Rutas de Proyectos en offline-sync.js

**Objetivo**: Asegurar que todas las rutas de proyectos estén incluidas.

Modificar `shouldBypass` en `offline-sync.js`:

```javascript
function shouldBypass(url) {
  try {
    const requestUrl = new URL(url, window.location.origin);
    
    if (requestUrl.origin !== window.location.origin) {
      return true;
    }

    // ✅ RUTAS COMPLETAS PARA PROYECTOS/EVENTOS
    const allowedPaths = [
      // === PROYECTOS/EVENTOS ===
      '/api/proyecto/',
      '/api/evento/',
      '/api/eventos/',
      '/api/proyectos/',
      '/api/ultimos-proyectos/',
      '/api/actividades/',
      '/api/tipos-actividad/',
      
      // Operaciones CRUD de eventos
      '/api/evento/crear/',
      '/api/evento/', // Para actualizar/eliminar (incluye UUID)
      
      // Archivos y evidencias de eventos
      '/api/evento/', // Para agregar archivos/evidencias
      
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

    const isAllowed = allowedPaths.some(path => requestUrl.pathname.includes(path));
    
    if (!isAllowed) {
      return true; // Bypass - no guardar offline
    }

    return false; // No bypass - guardar offline si no hay conexión
  } catch (_) {
    return false;
  }
}
```

---

### FASE 4: UI de Estado de Sincronización

**Objetivo**: Mostrar al usuario el estado de sincronización.

#### Paso 4.1: Crear componente de estado

Agregar a `base.html`:

```html
<!-- Indicador de estado offline/online -->
<div id="syncStatus" class="sync-status" style="display: none;">
  <div class="sync-status-content">
    <span class="sync-icon">🔄</span>
    <span class="sync-text">Sincronizando...</span>
    <span class="sync-count">0 pendientes</span>
  </div>
</div>
```

Agregar CSS en `styles.css`:

```css
.sync-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #2196F3;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sync-status.offline {
  background: #FF9800;
}

.sync-status.syncing {
  background: #2196F3;
}

.sync-status.synced {
  background: #4CAF50;
}

.sync-status.error {
  background: #F44336;
}

.sync-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

#### Paso 4.2: Actualizar estado en JavaScript

Agregar a `offline-sync.js`:

```javascript
function updateSyncStatus() {
  const statusEl = document.getElementById('syncStatus');
  if (!statusEl) return;

  const queue = window.OfflineSync.getQueue();
  const queueLength = queue.length;

  if (!navigator.onLine) {
    statusEl.className = 'sync-status offline';
    statusEl.querySelector('.sync-text').textContent = 'Modo Offline';
    statusEl.querySelector('.sync-count').textContent = `${queueLength} pendientes`;
    statusEl.style.display = 'flex';
  } else if (flushing) {
    statusEl.className = 'sync-status syncing';
    statusEl.querySelector('.sync-text').textContent = 'Sincronizando...';
    statusEl.querySelector('.sync-count').textContent = `${queueLength} pendientes`;
    statusEl.style.display = 'flex';
  } else if (queueLength > 0) {
    statusEl.className = 'sync-status syncing';
    statusEl.querySelector('.sync-text').textContent = 'Pendientes de sincronizar';
    statusEl.querySelector('.sync-count').textContent = `${queueLength} pendientes`;
    statusEl.style.display = 'flex';
  } else {
    statusEl.className = 'sync-status synced';
    statusEl.querySelector('.sync-text').textContent = 'Sincronizado';
    statusEl.querySelector('.sync-count').textContent = '';
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 2000);
  }
}

// Actualizar estado cuando cambia la cola
document.addEventListener('OfflineSync:queued', updateSyncStatus);
document.addEventListener('OfflineSync:sent', updateSyncStatus);
document.addEventListener('OfflineSync:idle', updateSyncStatus);
document.addEventListener('OfflineSync:synced', updateSyncStatus);

// Actualizar estado cuando cambia la conexión
window.addEventListener('online', updateSyncStatus);
window.addEventListener('offline', updateSyncStatus);
```

---

### FASE 5: Incluir Scripts en Templates

**Objetivo**: Asegurar que los scripts se carguen correctamente.

Modificar `base.html` para incluir los scripts en orden:

```html
<!-- Al final del body, antes de cerrar </body> -->
<script src="{% static 'js/offline-db.js' %}"></script>
<script src="{% static 'js/offline-auth.js' %}"></script>
<script src="{% static 'js/offline-sync.js' %}"></script>
```

---

## 🧪 Testing

### Cómo probar la funcionalidad offline:

1. **Abrir DevTools** → Network → Throttling → Offline
2. **Intentar crear/editar un proyecto**
   - Debe guardarse en la cola
   - Debe mostrarse el banner de offline
3. **Verificar IndexedDB**
   - DevTools → Application → IndexedDB → `webmaga_offline`
   - Debe contener los datos guardados
4. **Recuperar conexión**
   - Cambiar Network a Online
   - Debe sincronizar automáticamente
   - Debe mostrar estado "Sincronizado"

---

## 📝 Checklist de Implementación

- [ ] Crear `offline-db.js` con IndexedDB
- [ ] Modificar `proyectos.js` para usar IndexedDB
- [ ] Agregar función `syncFromServer()` en `offline-sync.js`
- [ ] Actualizar `shouldBypass()` con todas las rutas
- [ ] Crear UI de estado de sincronización
- [ ] Incluir scripts en `base.html`
- [ ] Probar en modo offline
- [ ] Probar sincronización al recuperar conexión
- [ ] Documentar para usuarios

---

## 🚀 Próximos Pasos (Opcional)

1. **Manejo de Conflictos Avanzado**
   - Detectar conflictos de versión
   - UI para resolver conflictos manualmente

2. **Sincronización Incremental**
   - Solo sincronizar cambios desde último sync
   - Reducir uso de ancho de banda

3. **Compresión de Datos**
   - Comprimir datos antes de guardar en IndexedDB
   - Aumentar capacidad de almacenamiento

4. **Notificaciones Push**
   - Notificar cuando hay cambios en el servidor
   - Sincronizar automáticamente en segundo plano

---

## 📚 Referencias

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Offline Storage](https://web.dev/offline-storage/)

---

**¿Necesitas ayuda con alguna fase específica?** Puedo ayudarte a implementar cada parte paso a paso.



