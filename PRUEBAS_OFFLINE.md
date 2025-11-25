# 🧪 Guía de Pruebas - Sistema Offline

## Pruebas Básicas

### 1. Verificar que los proyectos se cargan normalmente (con conexión)

**Pasos:**
1. Abre la página de proyectos: `http://127.0.0.1:8000/proyectos/`
2. Abre la consola del navegador (F12 → Console)
3. Verifica que:
   - Los proyectos se muestran correctamente
   - No hay errores en la consola
   - Deberías ver: `✅ IndexedDB inicializado en proyectos.js`

**Resultado esperado:** ✅ Los proyectos se cargan normalmente

---

### 2. Verificar que IndexedDB se está usando

**Pasos:**
1. Con la página de proyectos abierta, abre DevTools (F12)
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú lateral, expande **IndexedDB**
4. Deberías ver: `webmaga_offline`
5. Expande `webmaga_offline` → `proyectos`
6. Haz clic en `proyectos` para ver los datos guardados

**Resultado esperado:** ✅ Deberías ver proyectos guardados en IndexedDB

---

### 3. Probar modo offline - Ver proyectos sin conexión

**Pasos:**
1. Abre la página de proyectos
2. Abre DevTools (F12) → Pestaña **Network** (Red)
3. En la parte superior, busca el dropdown de throttling
4. Selecciona **Offline** (o marca la casilla "Offline")
5. Recarga la página (F5)
6. Verifica en la consola que aparezca: `📴 Modo offline: Cargando proyectos desde IndexedDB`

**Resultado esperado:** 
- ✅ Los proyectos se cargan desde IndexedDB
- ✅ Aparece el banner "Sin conexión a Internet"
- ✅ Aparece el indicador de sincronización (naranja) en la esquina inferior derecha

---

### 4. Probar guardar cambios offline

**Pasos:**
1. Con la conexión **Offline** activada
2. Intenta crear o editar un proyecto/evento
3. Verifica en la consola que aparezca: `📴 [OFFLINE] Solicitud guardada`
4. Verifica que el indicador muestre "X pendientes"

**Resultado esperado:**
- ✅ El cambio se guarda en la cola de sincronización
- ✅ Aparece mensaje de confirmación
- ✅ El indicador muestra cuántos cambios están pendientes

---

### 5. Probar sincronización automática

**Pasos:**
1. Con cambios pendientes en la cola (después de la prueba anterior)
2. En DevTools → Network, cambia de **Offline** a **Online**
3. Observa la consola y el indicador de sincronización

**Resultado esperado:**
- ✅ El indicador cambia a "Sincronizando..." (azul)
- ✅ En la consola aparecen mensajes: `🔄 [SYNC] Iniciando sincronización...`
- ✅ Aparecen mensajes: `✅ [SYNC] Enviado exitosamente`
- ✅ El indicador cambia a "Sincronizado" (verde) y desaparece después de 2 segundos
- ✅ Los cambios se aplican en el servidor

---

### 6. Verificar cola de sincronización

**Pasos:**
1. Con la consola abierta, escribe: `window.OfflineSync.getQueue()`
2. Presiona Enter
3. Deberías ver un array con los cambios pendientes

**Resultado esperado:** ✅ Array con los cambios pendientes (vacío si todo está sincronizado)

---

### 7. Probar sincronización desde servidor

**Pasos:**
1. Con conexión activa, abre la consola
2. Escribe: `window.OfflineSync.syncFromServer()`
3. Presiona Enter
4. Observa los mensajes en la consola

**Resultado esperado:**
- ✅ Mensajes: `🔄 Sincronizando datos desde el servidor...`
- ✅ Mensajes: `✅ X proyectos sincronizados`
- ✅ Mensajes: `✅ X comunidades sincronizadas`
- ✅ Mensajes: `✅ X regiones sincronizadas`

---

### 8. Verificar estadísticas de IndexedDB

**Pasos:**
1. En la consola, escribe: `window.OfflineDB.getStats()`
2. Presiona Enter
3. Espera a que se resuelva la promesa (puede tomar un momento)

**Resultado esperado:** ✅ Objeto con el conteo de registros en cada store

---

## Pruebas Avanzadas

### 9. Probar con múltiples pestañas

**Pasos:**
1. Abre la página de proyectos en dos pestañas diferentes
2. En una pestaña, activa modo offline
3. Haz cambios en la pestaña offline
4. Vuelve a online
5. Verifica que los cambios se sincronicen

**Resultado esperado:** ✅ Los cambios se sincronizan correctamente

---

### 10. Probar con datos grandes

**Pasos:**
1. Carga muchos proyectos (si tienes)
2. Activa modo offline
3. Verifica que todos los proyectos se carguen desde IndexedDB
4. Verifica el rendimiento

**Resultado esperado:** ✅ Los proyectos se cargan rápidamente desde IndexedDB

---

## Verificación de Errores

### Errores comunes y soluciones:

1. **Error: "IndexedDB no disponible"**
   - **Causa:** El navegador no soporta IndexedDB o está bloqueado
   - **Solución:** Usa un navegador moderno (Chrome, Firefox, Edge)

2. **Error: "offlineDB is not defined"**
   - **Causa:** El script offline-db.js no se cargó
   - **Solución:** Verifica que el script esté incluido en base.html

3. **Los proyectos no se cargan offline**
   - **Causa:** No hay datos guardados en IndexedDB
   - **Solución:** Primero carga los proyectos con conexión para que se guarden

4. **Los cambios no se sincronizan**
   - **Causa:** La cola de sincronización tiene errores
   - **Solución:** Revisa la consola para ver errores específicos

---

## Checklist de Pruebas

- [ ] Los proyectos se cargan normalmente con conexión
- [ ] IndexedDB contiene datos después de cargar proyectos
- [ ] Los proyectos se cargan desde IndexedDB cuando está offline
- [ ] Los cambios se guardan en la cola cuando está offline
- [ ] Los cambios se sincronizan automáticamente al volver online
- [ ] El indicador de sincronización funciona correctamente
- [ ] El banner de offline aparece cuando no hay conexión
- [ ] La sincronización desde servidor funciona
- [ ] No hay errores en la consola

---

## Comandos Útiles para Debugging

Abre la consola del navegador (F12) y usa estos comandos:

```javascript
// Ver la cola de sincronización
window.OfflineSync.getQueue()

// Limpiar la cola
window.OfflineSync.clear()

// Forzar sincronización desde servidor
window.OfflineSync.syncFromServer()

// Ver estadísticas de IndexedDB
window.OfflineDB.getStats()

// Verificar si está offline
window.OfflineSync.isOffline()

// Obtener un proyecto específico de IndexedDB
window.OfflineDB.getProyecto('ID-DEL-PROYECTO')

// Ver todos los proyectos en IndexedDB
window.OfflineDB.getAllProyectos()
```

---

## Notas Importantes

1. **Primera carga:** La primera vez que cargas proyectos, IndexedDB estará vacío. Necesitas cargar con conexión primero para que se guarden los datos.

2. **Límites de almacenamiento:** IndexedDB tiene límites de almacenamiento (generalmente varios GB), pero es bueno limpiar datos antiguos periódicamente.

3. **Sincronización automática:** La sincronización desde servidor ocurre automáticamente cada 5 minutos cuando hay conexión.

4. **Persistencia:** Los datos en IndexedDB persisten incluso si cierras el navegador.

---

## ¿Problemas?

Si encuentras algún problema:

1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que todos los scripts se carguen correctamente
3. Verifica que IndexedDB esté habilitado en tu navegador
4. Limpia el caché y recarga la página
5. Verifica que el servidor esté funcionando correctamente

---

¡Listo para probar! 🚀



