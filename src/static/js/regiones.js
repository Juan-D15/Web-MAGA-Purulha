function openImageViewer(url, description) {
  const viewerImg = document.getElementById('imageViewerImg');
  const viewerDesc = document.getElementById('imageViewerDescription');
  const viewerTitle = document.getElementById('imageViewerTitle');

  if (viewerImg) {
    viewerImg.src = url;
  }

  if (viewerDesc) {
    viewerDesc.textContent = description || '';
    viewerDesc.style.display = 'none';
  }

  if (viewerTitle) {
    viewerTitle.textContent = description || 'Imagen de la región';
  }

  showModal('imageViewerModal');
}
// ======= DATOS DE REGIONES - CARGA DESDE BD =======

// ======= VARIABLES GLOBALES =======
let regionsData = {}; // Se llenará dinámicamente desde la API
let currentRegionData = null;
let currentRegionId = null;
let allRegions = []; // Todas las regiones para la lista completa

const USER_AUTH = window.USER_AUTH || { isAuthenticated: false, isAdmin: false, isPersonal: false };
const CAN_EDIT_REGIONS = USER_AUTH.isAuthenticated && (USER_AUTH.isAdmin || USER_AUTH.isPersonal);
let pendingRegionGalleryImages = [];
let currentRegionFileEdit = null;

// Variables para navegación de galería (igual que en proyectos.js)
let currentRegionGalleryImages = [];
let currentRegionGalleryPage = 0;
let currentRegionGalleryCanManage = false;
const REGION_GALLERY_PAGE_SIZE = 4;

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDescription(text) {
  if (!text) return '';
  return `<p>${escapeHtml(text).replace(/\r?\n/g, '<br>')}</p>`;
}

function consumePendingNavigationTarget({ storageKey, queryParam }) {
  let targetId = null;

  if (queryParam) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has(queryParam)) {
        targetId = params.get(queryParam);
        params.delete(queryParam);
        if (typeof window.history?.replaceState === 'function') {
          const newSearch = params.toString();
          const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    } catch (error) {
    }
  }

  if ((!targetId || !String(targetId).trim()) && storageKey && typeof window.sessionStorage !== 'undefined') {
    try {
      const storedValue = window.sessionStorage.getItem(storageKey);
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        if (parsed && parsed.id) {
          targetId = parsed.id;
        }
      }
    } catch (error) {
    } finally {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch (_) {
        /* noop */
      }
    }
  } else if (storageKey && typeof window.sessionStorage !== 'undefined') {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch (_) {
      /* noop */
    }
  }

  const normalizedId = targetId !== undefined && targetId !== null ? String(targetId).trim() : '';
  return normalizedId || null;
}

let pendingRegionDetailId = consumePendingNavigationTarget({
  storageKey: 'pendingRegionDetail',
  queryParam: 'region',
});

// ======= FUNCIONES DE NAVEGACIÓN =======
async function showRegionsList() {
  const mainView = document.querySelector('.regions-main');
  const listView = document.getElementById('regionsListView');
  const detailView = document.getElementById('regionDetailView');
  
  mainView.style.display = 'none';
  detailView.style.display = 'none';
  listView.style.display = 'block';
  
  // Mostrar indicador de carga
  const regionsList = document.getElementById('regionsList');
  if (regionsList) {
    regionsList.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 300px; flex-direction: column; gap: 20px;">
        <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #4A90E2; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="color: var(--text-muted);">Cargando regiones...</p>
      </div>
    `;
  }
  
  // Si no hay regiones cargadas, cargarlas desde la API
  if (!allRegions || allRegions.length === 0) {
    await loadRegionsFromAPI();
  }
  
  // Cargar la lista
  loadRegionsList();
  window.scrollTo(0, 0);
}

async function showRegionDetail(regionId) {
  const mainView = document.querySelector('.regions-main');
  const listView = document.getElementById('regionsListView');
  const detailView = document.getElementById('regionDetailView');
  
  mainView.style.display = 'none';
  listView.style.display = 'none';
  detailView.style.display = 'block';
  
  currentRegionId = regionId;
  
  // Mostrar indicador de carga como overlay sin eliminar el contenido
  const detailContent = document.querySelector('.detail-content');
  if (detailContent) {
    // Guardar el contenido original si no existe un overlay de carga
    if (!detailContent.querySelector('.loading-overlay')) {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(30, 39, 54, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 20px;
        z-index: 1000;
      `;
      loadingOverlay.innerHTML = `
        <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #4A90E2; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="color: var(--text-muted);">Cargando información de la región...</p>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      detailContent.style.position = 'relative';
      detailContent.appendChild(loadingOverlay);
    }
  }
  
  // Cargar detalle completo desde la API
  try {
    const response = await fetch(`/api/region/${regionId}/`);
    if (!response.ok) throw new Error('Error al cargar detalle de región');
    const regionData = await response.json();
    
    // Convertir formato de API a formato esperado por loadRegionDetail
    currentRegionData = {
      id: regionData.id,
      name: regionData.nombre,
      code: regionData.codigo,
      codigo: regionData.codigo,  // Agregar también codigo para el mapa
      comunidad_sede: regionData.comunidad_sede || '',
      location: regionData.location,
      photos: regionData.photos || [],
      data: regionData.data || [],
      rawDescription: regionData.descripcion || '',
      description: regionData.descripcion ? formatDescription(regionData.descripcion) : '',
      projects: regionData.projects || [],
      communities: regionData.communities || [],
      files: regionData.files || []
    };
    
    // Remover el overlay de carga antes de cargar el detalle
    const loadingOverlay = detailContent?.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
    
  loadRegionDetail(currentRegionData);
  window.scrollTo(0, 0);
  } catch (error) {
    
    // Remover el overlay de carga en caso de error
    const loadingOverlay = detailContent?.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
    
    showErrorMessage('Error al cargar el detalle de la región. Por favor, intenta de nuevo.');
    backToMain();
  }
}

if (typeof window !== 'undefined') {
  window.showRegionDetail = showRegionDetail;
}

function showEditFileDescriptionModal(fileId, description) {
  if (!CAN_EDIT_REGIONS) {
    showErrorMessage('No tienes permisos para editar archivos.');
    return;
  }

  const textarea = document.getElementById('editFileDescriptionInput');
  if (!textarea) {
    return;
  }

  currentRegionFileEdit = {
    id: fileId,
    originalDescription: description || '',
  };
  textarea.value = description || '';
  showModal('editFileDescriptionModal');
  textarea.focus();
}

async function updateRegionFileDescription() {
  if (!CAN_EDIT_REGIONS) {
    showErrorMessage('No tienes permisos para editar archivos.');
    return;
  }

  if (!currentRegionId || !currentRegionFileEdit || !currentRegionFileEdit.id) {
    showErrorMessage('No se pudo identificar el archivo a editar.');
    return;
  }

  const textarea = document.getElementById('editFileDescriptionInput');
  if (!textarea) {
    return;
  }

  const newDescription = textarea.value.trim();

  const confirmButton = document.getElementById('confirmFileDescriptionBtn');
  const originalLabel = confirmButton ? confirmButton.textContent : null;

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Guardando...';
  }

  try {
    const response = await fetch(`/api/region/${currentRegionId}/archivo/${currentRegionFileEdit.id}/actualizar/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken') || '',
      },
      body: JSON.stringify({ descripcion: newDescription }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'No se pudo actualizar la descripción del archivo.');
    }

    if (currentRegionData && Array.isArray(currentRegionData.files)) {
      currentRegionData.files = currentRegionData.files.map((file) =>
        file.id === currentRegionFileEdit.id
          ? { ...file, description: newDescription }
          : file
      );
      renderRegionFiles(currentRegionData.files);
    }

    hideModal('editFileDescriptionModal');
    currentRegionFileEdit = null;
    showSuccessMessage(result.message || 'Descripción actualizada correctamente.');
  } catch (error) {
    showErrorMessage(error.message || 'No se pudo actualizar la descripción del archivo.');
  } finally {
    if (confirmButton) {
      confirmButton.disabled = false;
      if (originalLabel !== null) {
        confirmButton.textContent = originalLabel;
      }
    }
  }
}

function backToMain() {
  const mainView = document.querySelector('.regions-main');
  const listView = document.getElementById('regionsListView');
  const detailView = document.getElementById('regionDetailView');
  
  listView.style.display = 'none';
  detailView.style.display = 'none';
  mainView.style.display = 'block';
  
  currentRegionData = null;
  currentRegionId = null;
  window.scrollTo(0, 0);
}

function backToList() {
  const mainView = document.querySelector('.regions-main');
  const listView = document.getElementById('regionsListView');
  const detailView = document.getElementById('regionDetailView');
  
  mainView.style.display = 'none';
  detailView.style.display = 'none';
  listView.style.display = 'block';
  
  currentRegionData = null;
  currentRegionId = null;
  window.scrollTo(0, 0);
}

// ======= FUNCIONES DE CARGA DE DATOS DESDE API =======
// Estas funciones se usan para actualizar dinámicamente las regiones si es necesario
// Las regiones iniciales se cargan desde Django templates
async function loadRegionsFromAPI() {
  try {
    const response = await fetch(`/api/regiones/?_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const regiones = await response.json();
    
    if (!regiones || regiones.length === 0) {
      return;
    }
    
    // Convertir array a objeto con ID como clave
    regionsData = {};
    regiones.forEach(region => {
      regionsData[region.id] = {
        id: region.id,
        name: region.nombre,
        code: region.codigo,
        comunidad_sede: region.comunidad_sede || '',
        imagen_url: region.imagen_url,
        num_comunidades: region.num_comunidades || 0,
        lastUpdate: region.actualizado_en || region.creado_en || null
      };
    });
    
    // Guardar todas las regiones en allRegions (mantener formato de API)
    allRegions = regiones;
    
    // Actualizar la lista y el grid según corresponda
    const listView = document.getElementById('regionsListView');
    if (listView && listView.style.display !== 'none') {
      loadRegionsList();
    }

    loadRegionsGrid();
    
  } catch (error) {
    // No mostrar error si las regiones ya están cargadas desde el template
  }
}

async function loadFeaturedRegions() {
  try {
    const response = await fetch(`/api/regiones/recientes/?limite=3&_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const regiones = await response.json();
    
    const container = document.getElementById('featuredRegionsContainer');
    if (!container) {
      return;
    }
    
    container.innerHTML = '';
    
    if (regiones.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">No hay regiones recientes disponibles</p>';
      return;
    }
    
    regiones.forEach((region, index) => {
      const card = createRegionCard(region, true); // true = featured card
      container.appendChild(card);
    });
    
  } catch (error) {
    const container = document.getElementById('featuredRegionsContainer');
    if (container) {
      container.innerHTML = '<p style="color: var(--text-danger); padding: 20px; text-align: center;">Error al cargar últimas regiones</p>';
    }
  }
}

function loadRegionsGrid() {
  const grid = document.getElementById('regionsGrid');
  if (!grid) {
    return;
  }
  
  grid.innerHTML = '';
  
  if (!allRegions || allRegions.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">No hay regiones disponibles</p>';
    return;
  }
  
  // Excluir las regiones que ya están en "Últimas Regiones"
  const featuredIds = new Set();
  document.querySelectorAll('#featuredRegionsContainer [data-region-id]').forEach(el => {
    const id = el.getAttribute('data-region-id');
    if (id) featuredIds.add(id);
  });

  // Cargar todas las demás regiones
  let regionesAgregadas = 0;
  allRegions.forEach((region, index) => {
    if (!featuredIds.has(region.id)) {
      const card = createRegionCard(region, false); // false = normal card
      grid.appendChild(card);
      regionesAgregadas++;
    }
  });

  if (regionesAgregadas === 0) {
    grid.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">Todas las regiones están en la sección de últimas regiones</p>';
  }
}

function createRegionCard(region, isFeatured = false) {
  
  const card = document.createElement('div');
  card.className = `region-card ${isFeatured ? 'featured-card' : ''}`;
  
  // El título grande muestra la comunidad_sede, el código pequeño muestra el nombre de la región
  const tituloGrande = region.comunidad_sede || region.nombre || 'Sin comunidad sede';
  const codigoPequeño = region.nombre || region.codigo || 'Sin nombre';
  
  const imagenUrl = region.imagen_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  card.innerHTML = `
    <div class="region-card__image">
      <img src="${imagenUrl}" 
           alt="${region.nombre}" 
           loading="${isFeatured ? 'eager' : 'lazy'}">
      <div class="region-card__overlay">
        <div class="region-card__info">
          <h3 class="region-card__title">${tituloGrande}</h3>
          <p class="region-card__code">${codigoPequeño}</p>
        </div>
        <button class="region-card__btn" data-region-id="${region.id}">Ver más</button>
      </div>
    </div>
  `;
  
  return card;
}

// ======= FUNCIONES DE CARGA DE DATOS =======
function loadRegionsList() {
  const regionsList = document.getElementById('regionsList');
  if (!regionsList) {
    return;
  }

  regionsList.innerHTML = '';
  
  if (!allRegions || allRegions.length === 0) {
    regionsList.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">No hay regiones disponibles</p>';
    return;
  }
  
  allRegions.forEach((region, index) => {
    const regionItem = createRegionListItem(region);
    regionsList.appendChild(regionItem);
  });
  
}

function createRegionListItem(region) {
  const regionItem = document.createElement('div');
  regionItem.className = 'region-list-item';
  
  // Agregar el atributo data-last-update para el ordenamiento
  if (region.actualizado_en || region.creado_en) {
    regionItem.dataset.lastUpdate = region.actualizado_en || region.creado_en;
  }
  
  const imagenUrl = region.imagen_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  const numComunidades = region.num_comunidades || 0;
  
  // Mostrar primero la sede, luego la región junto al icono de ubicación
  const sedeNombre = region.comunidad_sede || 'Sin sede';
  const regionNombre = region.nombre || region.codigo || 'Sin nombre';
  
  regionItem.innerHTML = `
    <div class="region-list-item__image">
      <img src="${imagenUrl}" alt="${regionNombre}" loading="lazy">
    </div>
    <div class="region-list-item__content">
      <div class="region-list-item__info">
        <h3 class="region-list-item__name">${sedeNombre}</h3>
        <div class="region-list-item__details">
          <div class="region-list-item__code">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${regionNombre}
          </div>
          <div class="region-list-item__communities">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            ${numComunidades} comunidades
          </div>
        </div>
      </div>
      <button class="region-list-item__btn" data-region-id="${region.id}">Ver más</button>
    </div>
  `;
  
  return regionItem;
}

function loadRegionDetail(region) {
  if (!region) return;
  
  // Restaurar el contenido del detalle (por si estaba en estado de carga)
  const detailContent = document.querySelector('.detail-content');
  if (!detailContent) {
    return;
  }
  
  // Asegurarse de que el contenido esté visible (no en estado de carga)
  const loadingOverlay = detailContent.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
  
  // Título: mostrar comunidad sede (o nombre de región si no hay sede)
  const tituloPrincipal = region.comunidad_sede || region.name || 'Sin sede';
  const subtitulo = region.name || region.code || 'Sin nombre';
  
  const detailTitle = document.getElementById('detailTitle');
  const detailCode = document.getElementById('detailCode');
  if (detailTitle) detailTitle.textContent = tituloPrincipal;
  if (detailCode) detailCode.textContent = subtitulo;
  
  const photos = region.photos || [];
  if (CAN_EDIT_REGIONS) {
    loadGalleryWithDeleteButtons(photos);
  } else {
    loadGallery(photos);
  }
  
  // Ubicación
  loadLocation(region.location);
  
  // Mapa de la región (esperar un poco para asegurar que el DOM esté listo)
  setTimeout(() => {
  loadRegionMap(region.id);
  }, 100);
  
  // Datos generales
  loadData(region.data);
  
  // Descripción
  const descElement = document.getElementById('detailDescription');
  if (descElement) {
    descElement.innerHTML = region.description || '<p style="color: var(--text-muted);">No hay descripción disponible</p>';
  }
  
  // Proyectos activos
  loadProjects(region.projects);
  
  // Comunidades
  loadCommunities(region.communities);
  
  // Archivos
  renderRegionFiles(region.files || []);
}

// Función para inicializar la galería de región (similar a renderProjectGalleryImages)
function renderRegionGalleryImages(photos, puedeGestionar) {
  // Ordenar fotos por fecha más reciente primero (si tienen fecha)
  const sortedPhotos = Array.isArray(photos) ? [...photos].sort((a, b) => {
    const dateA = a.fecha || a.creado_en || a.date || '';
    const dateB = b.fecha || b.creado_en || b.date || '';
    if (dateA && dateB) {
      return new Date(dateB) - new Date(dateA);
    }
    return 0;
  }) : [];

  currentRegionGalleryImages = sortedPhotos;
  currentRegionGalleryCanManage = !!puedeGestionar;
  currentRegionGalleryPage = 0;
  renderRegionGalleryPage();
}

// Función para renderizar la página actual de la galería (3 imágenes)
function renderRegionGalleryPage() {
  const detailGallery = document.getElementById('detailGallery');
  
  if (!detailGallery) {
    return;
  }

  detailGallery.classList.toggle('gallery-can-manage', currentRegionGalleryCanManage);

  if (!currentRegionGalleryImages.length) {
    detailGallery.innerHTML = '<p class="gallery-empty-state">No hay imágenes disponibles.</p>';
    return;
  }

  const totalPages = Math.ceil(currentRegionGalleryImages.length / REGION_GALLERY_PAGE_SIZE);
  if (totalPages === 0) {
    currentRegionGalleryPage = 0;
  } else if (currentRegionGalleryPage >= totalPages) {
    currentRegionGalleryPage = totalPages - 1;
  } else if (currentRegionGalleryPage < 0) {
    currentRegionGalleryPage = 0;
  }

  const startIndex = currentRegionGalleryPage * REGION_GALLERY_PAGE_SIZE;
  const visibleImages = currentRegionGalleryImages.slice(startIndex, startIndex + REGION_GALLERY_PAGE_SIZE);

  const itemsHtml = visibleImages.map((photo) => {
    const descriptionText = escapeHtml(photo.description || photo.descripcion || 'Imagen de la región');
    const descriptionHtml = descriptionText
      ? `<div class="gallery-item-description">${descriptionText}</div>`
      : '';
    const photoUrl = photo.url || '';
    const encodedName = encodeURIComponent(photo.nombre || photo.name || photo.archivo_nombre || '');
    const imageUrlAttr = escapeHtml(photoUrl);
    const removeButton = currentRegionGalleryCanManage
      ? `<button class="btn-remove-item" data-imagen-id="${photo.id}" data-image-name="${encodedName}" title="Eliminar imagen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
         </button>`
      : '';

    const imageDescriptionAttr = escapeHtml(photo.description || photo.descripcion || '');
    const imageAltAttr = escapeHtml(photo.nombre || photo.name || photo.archivo_nombre || 'Imagen de la región');

    return `
      <div class="gallery-item" data-image-url="${imageUrlAttr}" data-image-description="${imageDescriptionAttr}">
        ${removeButton}
        <img src="${imageUrlAttr}" alt="${imageAltAttr}" data-image-url="${imageUrlAttr}" data-image-description="${imageDescriptionAttr}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
        ${descriptionHtml}
      </div>
    `;
  }).join('');

  const navHtml = totalPages > 1
    ? `<div class="project-gallery-nav">
        <button class="project-gallery-nav-btn" data-gallery-direction="prev" ${currentRegionGalleryPage === 0 ? 'disabled' : ''} aria-label="Ver imágenes anteriores">▲</button>
        <button class="project-gallery-nav-btn" data-gallery-direction="next" ${currentRegionGalleryPage >= totalPages - 1 ? 'disabled' : ''} aria-label="Ver imágenes siguientes">▼</button>
      </div>`
    : '';

  detailGallery.innerHTML = `
    <div class="project-gallery-wrapper">
      <div class="gallery-items-wrapper">
        ${itemsHtml}
      </div>
      ${navHtml}
    </div>
  `;

  // Event listeners para abrir imagen en modal
  detailGallery.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', function (e) {
      if (e.target.closest('.btn-remove-item')) {
        return;
      }
      const imageUrl = this.getAttribute('data-image-url') || this.querySelector('img')?.getAttribute('data-image-url') || this.querySelector('img')?.getAttribute('src');
      const imageDescription = this.getAttribute('data-image-description') || this.querySelector('img')?.getAttribute('data-image-description') || '';
      if (imageUrl) {
        openImageViewer(imageUrl, imageDescription);
      }
    });
  });

  // Event listeners para eliminar imagen
  if (currentRegionGalleryCanManage) {
    detailGallery.querySelectorAll('[data-imagen-id]').forEach((btn) => {
      btn.addEventListener('click', async function (e) {
        e.stopPropagation();
        const imagenId = this.getAttribute('data-imagen-id');
        const imageName = decodeURIComponent(this.getAttribute('data-image-name') || '');
        confirmarEliminacionImagenRegion(imagenId, imageName);
      });
    });
  }
}

// Función para confirmar eliminación de imagen
function confirmarEliminacionImagenRegion(imagenId, imageName = '') {
  if (!CAN_EDIT_REGIONS) {
    return;
  }

  const trimmedName = (imageName || '').trim();
  const message = trimmedName
    ? `¿Estás seguro de que deseas eliminar la imagen "${trimmedName}" de la galería?`
    : '¿Estás seguro de que deseas eliminar esta imagen de la galería?';

  showConfirmDeleteModal(message, async () => {
    await eliminarImagenRegion(imagenId);
  });
}

// Función para eliminar imagen de la galería por ID
async function eliminarImagenRegion(imagenId) {
  if (!imagenId) {
    showErrorMessage('No se pudo identificar la imagen a eliminar.');
    return;
  }

  // Obtener el regionId de currentRegionId o currentRegionData
  let regionId = currentRegionId;
  if (!regionId && currentRegionData) {
    regionId = currentRegionData.id;
  }

  if (!regionId) {
    showErrorMessage('No se pudo identificar la región actual.');
    return;
  }

  try {
    const url = `/api/region/${regionId}/galeria/${imagenId}/eliminar/`;
    console.log('Eliminando imagen:', url); // Debug
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCookie('csrftoken') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'No se pudo eliminar la imagen');
    }

    hideModal('confirmDeleteModal');
    // Recargar la galería después de eliminar
    await refreshCurrentRegion(result.message || 'Imagen eliminada exitosamente');
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    showErrorMessage(error.message || 'No se pudo eliminar la imagen');
  }
}

// Función para refrescar la región actual
async function refreshCurrentRegion(successMessage = '') {
  if (!currentRegionData || !currentRegionData.id) {
    // Si no hay currentRegionData, intentar usar currentRegionId
    const regionId = currentRegionId;
    if (!regionId) {
      console.error('No se puede refrescar: no hay región actual');
      return;
    }
    // Cargar la región desde cero
    await showRegionDetail(regionId);
    if (successMessage) {
      showSuccessMessage(successMessage);
    }
    return;
  }

  const regionId = currentRegionId || currentRegionData.id;

  try {
    const response = await fetch(`/api/region/${regionId}/`);
    if (!response.ok) {
      throw new Error('Error al cargar los detalles de la región');
    }

    const regionData = await response.json();
    
    // Convertir formato de API a formato esperado por loadRegionDetail
    const formattedRegionData = {
      id: regionData.id,
      name: regionData.nombre,
      code: regionData.codigo,
      codigo: regionData.codigo,
      comunidad_sede: regionData.comunidad_sede || '',
      location: regionData.location,
      photos: regionData.photos || [],
      data: regionData.data || [],
      rawDescription: regionData.descripcion || '',
      description: regionData.descripcion ? formatDescription(regionData.descripcion) : '',
      projects: regionData.projects || [],
      communities: regionData.communities || [],
      files: regionData.files || []
    };
    
    // Actualizar currentRegionData
    currentRegionData = formattedRegionData;
    
    // Recargar el detalle con los nuevos datos
    loadRegionDetail(currentRegionData);
    
    if (successMessage) {
      showSuccessMessage(successMessage);
    }
  } catch (error) {
    console.error('Error al refrescar región:', error);
    showErrorMessage(error.message || 'Error al actualizar la información de la región');
  }
}

// Event listener global para navegación de galería de región
document.addEventListener('click', (event) => {
  // Verificar si el click es en un botón de navegación de galería de región
  const navBtn = event.target.closest('.project-gallery-nav-btn');
  if (!navBtn) {
    return;
  }

  // Solo procesar si estamos en la vista de detalle de región
  const detailGallery = document.getElementById('detailGallery');
  if (!detailGallery || !detailGallery.closest('.region-detail-view')) {
    return;
  }

  if (!currentRegionGalleryImages.length) {
    return;
  }

  event.preventDefault();

  const direction = navBtn.getAttribute('data-gallery-direction');
  const totalPages = Math.ceil(currentRegionGalleryImages.length / REGION_GALLERY_PAGE_SIZE);

  if (direction === 'prev' && currentRegionGalleryPage > 0) {
    currentRegionGalleryPage -= 1;
    renderRegionGalleryPage();
  } else if (direction === 'next' && currentRegionGalleryPage < totalPages - 1) {
    currentRegionGalleryPage += 1;
    renderRegionGalleryPage();
  }
});

// Función para cargar galería (mantener por compatibilidad, ahora usa renderRegionGalleryImages)
function loadGallery(photos) {
  renderRegionGalleryImages(photos, CAN_EDIT_REGIONS);
}

// Función para cargar galería con botones de eliminación (mantener por compatibilidad)
function loadGalleryWithDeleteButtons(photos) {
  renderRegionGalleryImages(photos, CAN_EDIT_REGIONS);
}

function loadLocation(location) {
  const locationInfo = document.getElementById('detailLocationInfo');
  if (!locationInfo) return;
  
  locationInfo.innerHTML = `
    <div class="location-item">
      <div class="location-icon">📍</div>
      <div class="location-content">
        <h4>Ubicación Geográfica</h4>
        <p>${location}</p>
      </div>
    </div>
  `;
}

function loadRegionMap(regionId) {
  const regionMapImage = document.getElementById('regionMapImage');
  if (!regionMapImage) {
    return;
  }

  const fallbackImage =
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=60';

  const getRegionNumberFromCode = (codigo) => {
    if (!codigo) return null;
    const codigoMatch = codigo.match(/\d+/);
    return codigoMatch ? parseInt(codigoMatch[0], 10) : null;
  };

  const loadMapImage = (regionNumber, regionName = '') => {
    if (!regionNumber) {
      regionMapImage.src = fallbackImage;
      regionMapImage.alt = 'Mapa no disponible';
      regionMapImage.style.display = 'block';
      return;
    }

    const pngPath = `/static/img/regiones%20mapa/region${regionNumber}.png`;

    regionMapImage.style.display = 'block';
    regionMapImage.src = pngPath;
    regionMapImage.alt = `Mapa de la región ${regionName || regionNumber}`;

    regionMapImage.onload = () => {
      regionMapImage.style.display = 'block';
    };

    regionMapImage.onerror = () => {
      regionMapImage.src = fallbackImage;
      regionMapImage.alt = 'Mapa no disponible';
      regionMapImage.style.display = 'block';
    };
  };

  const region = allRegions.find((r) => r.id === regionId);
  if (region && region.codigo) {
    loadMapImage(getRegionNumberFromCode(region.codigo), region.nombre);
    return;
  }

  if (currentRegionData) {
    const codigo = currentRegionData.code || currentRegionData.codigo;
    const nombre = currentRegionData.name || currentRegionData.nombre || '';
    loadMapImage(getRegionNumberFromCode(codigo), nombre);
    return;
  }

  regionMapImage.src = fallbackImage;
  regionMapImage.alt = 'Mapa no disponible';
  regionMapImage.style.display = 'block';
}

function loadData(data) {
  const dataContainer = document.getElementById('detailData');
  if (!dataContainer) return;
  
  dataContainer.innerHTML = '';
  
  data.forEach(item => {
    const dataItem = document.createElement('div');
    dataItem.className = 'data-item';
    dataItem.innerHTML = `
      <div class="data-icon">${item.icon}</div>
      <div class="data-content">
        <h4>${item.label}</h4>
        <p>${item.value}</p>
      </div>
    `;
    dataContainer.appendChild(dataItem);
  });
}

function loadProjects(projects) {
  const projectsContainer = document.getElementById('detailProjects');
  if (!projectsContainer) return;
  
  projectsContainer.innerHTML = '';

  if (!Array.isArray(projects) || projects.length === 0) {
    projectsContainer.innerHTML = `
      <div class="projects-empty">
        <p>No hay proyectos activos registrados para esta región.</p>
      </div>
    `;
    return;
  }
  
  projects.forEach(project => {
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';
    projectItem.innerHTML = `
      <div class="project-icon">P</div>
      <div class="project-info">
        <h4>${project.name}</h4>
        <p>${project.type} - ${project.status}</p>
      </div>
    `;
    projectsContainer.appendChild(projectItem);
  });
}

function loadCommunities(communities) {
  const communitiesContainer = document.getElementById('detailCommunities');
  if (!communitiesContainer) return;
  
  communitiesContainer.innerHTML = '';

  if (!Array.isArray(communities) || communities.length === 0) {
    communitiesContainer.innerHTML = `
      <div class="communities-empty">
        <p>No hay comunidades registradas para esta región.</p>
      </div>
    `;
    return;
  }
  
  communities.forEach(community => {
    const communityItem = document.createElement('div');
    communityItem.className = 'community-item';
    communityItem.innerHTML = `
      <div class="community-icon">C</div>
      <div class="community-info">
        <h4>${community.name}</h4>
        <p>${community.type}</p>
      </div>
    `;
    communitiesContainer.appendChild(communityItem);
  });
}

function renderRegionFiles(files) {
  const filesContainer = document.getElementById('detailFiles');
  if (!filesContainer) return;
  
  filesContainer.innerHTML = '';

  if (!Array.isArray(files) || files.length === 0) {
    filesContainer.innerHTML = '<p class="no-files">No hay archivos disponibles</p>';
    return;
  }

  files.forEach((file) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';

    const fileType = (file.type || '').toLowerCase();
    const fileDate = file.date ? formatDate(file.date) : 'Fecha no disponible';
    const description = file.description ? escapeHtml(file.description) : '';
    const rawFileName = file.name || 'Archivo sin nombre';
    const fileName = escapeHtml(rawFileName);
    const datasetFileName = encodeURIComponent(rawFileName);
    const safeDescriptionAttr = file.description
      ? escapeHtml(file.description).replace(/"/g, '&quot;')
      : '';

      fileItem.innerHTML = `
      <div class="file-icon">${getFileIcon(fileType)}</div>
        <div class="file-info">
        <h4>${fileName}</h4>
        ${description ? `<p>${description}</p>` : ''}
        <div class="file-date">Agregado el ${fileDate}${fileType ? ` • ${fileType.toUpperCase()}` : ''}</div>
        </div>
      ${USER_AUTH.isAuthenticated ? `
        <div class="file-actions">
          <a href="${file.url}" class="file-download-btn" download>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar
          </a>
          ${CAN_EDIT_REGIONS ? `
            <button class="file-edit-btn" data-file-id="${file.id}" data-file-description="${safeDescriptionAttr}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </button>
            <button class="file-delete-btn" data-file-id="${file.id}" data-file-name="${datasetFileName}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Eliminar
            </button>
          ` : ''}
        </div>
      ` : ''}
      `;

      filesContainer.appendChild(fileItem);
    });
}

function getFileIcon(fileType) {
  const icons = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📋',
    pptx: '📋',
    txt: '📄',
    default: '📁'
  };

  if (!fileType) {
    return icons.default;
  }

  const normalized = fileType.includes('/') ? fileType.split('/').pop() : fileType;
  return icons[normalized] || icons.default;
}

function formatDate(dateString) {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

function decodeFileName(encodedName) {
  if (!encodedName) return 'este archivo';
  try {
    const decoded = decodeURIComponent(encodedName);
    return decoded || 'este archivo';
  } catch (error) {
    return encodedName;
  }
}

function confirmDeleteRegionFile(fileId, encodedName) {
  if (!fileId) return;
  const readableName = decodeFileName(encodedName);
  showConfirmDeleteModal(
    `¿Estás seguro de que deseas eliminar el archivo "${escapeHtml(readableName)}"?`,
    async () => {
      await performDeleteRegionFile(fileId, readableName);
    }
  );
}

async function performDeleteRegionFile(fileId, fileName) {
  if (!currentRegionId) {
    showErrorMessage('No se pudo determinar la región actual.');
    return;
  }

  try {
    const response = await fetch(`/api/region/${currentRegionId}/archivo/${fileId}/eliminar/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      const errorMessage = result.error || 'No se pudo eliminar el archivo.';
      throw new Error(errorMessage);
    }

    if (currentRegionData && Array.isArray(currentRegionData.files)) {
      currentRegionData.files = currentRegionData.files.filter((file) => file.id !== fileId);
    }

    renderRegionFiles(currentRegionData?.files || []);
    showSuccessMessage(result.message || `Archivo "${fileName}" eliminado correctamente.`);
  } catch (error) {
    showErrorMessage(error.message || 'Ocurrió un error al eliminar el archivo.');
  }
}

// ======= FUNCIONES PARA AGREGAR ARCHIVOS =======

// Función para mostrar modal de agregar archivo
function showAddFileModal() {
  showModal('addFileModal');
  clearFileForm();
}

function clearFileForm() {
  document.getElementById('fileInput').value = '';
  document.getElementById('fileDescription').value = '';
  document.getElementById('filePreview').innerHTML = '';
}

// Función para manejar la selección de archivos
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const preview = document.getElementById('filePreview');
  
  preview.innerHTML = `
    <div class="file-preview-item">
      <div class="file-icon">${getFileIcon(file.name.split('.').pop().toLowerCase())}</div>
      <div class="file-name">${file.name}</div>
      <button type="button" class="file-preview-remove" data-role="region-file-remove">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Quitar
      </button>
    </div>
  `;
}

// Función para agregar archivo a la región
async function addFileToRegion() {
  if (!CAN_EDIT_REGIONS) {
    showErrorMessage('No tienes permisos para agregar archivos.');
    return;
  }

  if (!currentRegionId) {
    showErrorMessage('No se pudo identificar la región seleccionada.');
    return;
  }
  
  const fileInput = document.getElementById('fileInput');
  const fileDescriptionInput = document.getElementById('fileDescription');
  const confirmButton = document.getElementById('confirmFileBtn');

  if (!fileInput || !fileInput.files[0]) {
    showErrorMessage('Por favor selecciona un archivo.');
    return;
  }
  
  const file = fileInput.files[0];
  const finalName = file.name;
  const description = fileDescriptionInput ? fileDescriptionInput.value.trim() : '';

  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('nombre', finalName);
  formData.append('descripcion', description);

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Guardando...';
    }
    
  try {
    const response = await fetch(`/api/region/${currentRegionId}/archivo/agregar/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      const errorMessage = result.error || 'No se pudo guardar el archivo.';
      throw new Error(errorMessage);
    }

    if (currentRegionData) {
      currentRegionData.files = currentRegionData.files || [];
      currentRegionData.files.push(result.archivo);
      renderRegionFiles(currentRegionData.files);
    }

    clearFileForm();
    hideModal('addFileModal');
    showSuccessMessage(result.message || 'Archivo agregado exitosamente.');
  } catch (error) {
    showErrorMessage(error.message || 'Ocurrió un error al guardar el archivo.');
  } finally {
    if (confirmButton) {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Agregar';
    }
  }
}

// ======= FUNCIONES DE BÚSQUEDA Y FILTRO =======
function searchRegions(query) {
  const regionsList = document.getElementById('regionsList');
  if (!regionsList) return;
  
  const regionItems = regionsList.querySelectorAll('.region-list-item');
  const queryLower = query.toLowerCase().trim();
  
  if (!queryLower) {
    // Si no hay búsqueda, mostrar todas las regiones
  regionItems.forEach(item => {
      item.style.display = 'flex';
    });
    // Eliminar mensaje de no resultados si existe
    const existingNoResults = regionsList.querySelector('.no-results');
    if (existingNoResults) {
      existingNoResults.remove();
    }
    return;
  }
  
  let visibleCount = 0;
  regionItems.forEach(item => {
    // Buscar en nombre de sede (título principal)
    const sedeName = item.querySelector('.region-list-item__name')?.textContent.toLowerCase() || '';
    // Buscar en nombre de región (junto al icono de ubicación)
    const regionName = item.querySelector('.region-list-item__code')?.textContent.toLowerCase() || '';
    // También buscar en el código si está disponible en los datos
    const regionCode = item.getAttribute('data-region-code')?.toLowerCase() || '';
    
    // Buscar en sede, nombre de región o código
    if (sedeName.includes(queryLower) || regionName.includes(queryLower) || regionCode.includes(queryLower)) {
      item.style.display = 'flex';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  // Si no hay resultados, mostrar mensaje
  if (visibleCount === 0 && regionItems.length > 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.style.cssText = 'padding: 40px; text-align: center; color: var(--text-muted); width: 100%;';
    noResults.innerHTML = `<p>No se encontraron regiones que coincidan con "${query}"</p>`;
    
    // Verificar si ya existe el mensaje
    const existingNoResults = regionsList.querySelector('.no-results');
    if (!existingNoResults) {
      regionsList.appendChild(noResults);
    } else {
      existingNoResults.innerHTML = `<p>No se encontraron regiones que coincidan con "${query}"</p>`;
    }
  } else {
    // Eliminar mensaje de no resultados si existe
    const existingNoResults = regionsList.querySelector('.no-results');
    if (existingNoResults) {
      existingNoResults.remove();
    }
  }
}

function sortRegions(sortBy) {
  const regionsList = document.getElementById('regionsList');
  if (!regionsList) return;
  
  const regionItems = Array.from(regionsList.querySelectorAll('.region-list-item'));
  
  if (regionItems.length === 0) {
    return;
  }
  
  regionItems.sort((a, b) => {
    const nameA = a.querySelector('.region-list-item__name')?.textContent || '';
    const nameB = b.querySelector('.region-list-item__name')?.textContent || '';
    
    switch (sortBy) {
      case 'name-asc':
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      case 'name-desc':
        return nameB.localeCompare(nameA, 'es', { sensitivity: 'base' });
      case 'recent':
        // Ordenar por fecha de actualización (más reciente primero)
        const dateA = a.dataset.lastUpdate ? new Date(a.dataset.lastUpdate) : new Date(0);
        const dateB = b.dataset.lastUpdate ? new Date(b.dataset.lastUpdate) : new Date(0);
        
        // Si ambas fechas son inválidas, mantener el orden original
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
          return 0;
        }
        // Si solo A es inválida, ponerla al final
        if (isNaN(dateA.getTime())) {
          return 1;
        }
        // Si solo B es inválida, ponerla al final
        if (isNaN(dateB.getTime())) {
          return -1;
        }
        // Ordenar de más reciente a más antiguo
        return dateB.getTime() - dateA.getTime();
      case 'communities':
        const communitiesA = parseInt(a.querySelector('.region-list-item__communities')?.textContent || '0');
        const communitiesB = parseInt(b.querySelector('.region-list-item__communities')?.textContent || '0');
        return communitiesB - communitiesA;
      default:
        return 0;
    }
  });
  
  // Limpiar el contenedor y agregar los elementos ordenados
  regionsList.innerHTML = '';
  regionItems.forEach(item => {
    regionsList.appendChild(item);
  });
  
}

// ======= FUNCIONES DE MODALES =======
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// ======= FUNCIONES DE FORMULARIOS (SIN CREDENCIALES) =======

function showAddImageModal() {
  showModal('addImageModal');
  clearImageForm();
}

function renderPendingRegionImages() {
  const previewContainer = document.getElementById('imagePreview');
  if (!previewContainer) {
    return;
  }

  previewContainer.innerHTML = '';

  if (!pendingRegionGalleryImages.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'image-preview-empty';
    emptyState.textContent = 'No has seleccionado imágenes.';
    previewContainer.appendChild(emptyState);
    return;
  }

  pendingRegionGalleryImages.forEach((item, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-preview-item';
    wrapper.dataset.index = index;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'image-preview-remove';
    removeBtn.dataset.index = index;
    removeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    const img = document.createElement('img');
    img.src = item.previewUrl || '';
    img.alt = 'Vista previa de la imagen seleccionada';

    const descriptionWrapper = document.createElement('div');
    descriptionWrapper.className = 'image-preview-description';

    const descriptionInput = document.createElement('textarea');
    descriptionInput.className = 'image-description-input';
    descriptionInput.dataset.index = index;
    descriptionInput.placeholder = 'Agrega una descripción...';
    descriptionInput.rows = 2;
    descriptionInput.value = item.description || '';

    descriptionWrapper.appendChild(descriptionInput);

    wrapper.appendChild(removeBtn);
    wrapper.appendChild(img);
    wrapper.appendChild(descriptionWrapper);

    previewContainer.appendChild(wrapper);
  });
}

function clearImageForm() {
  const input = document.getElementById('imageFileInput');
  if (input) {
    input.value = '';
  }
  pendingRegionGalleryImages = [];
  renderPendingRegionImages();
}

function handleImageFileSelect(event) {
  const input = event.target;
  const files = Array.from(input.files || []);
  if (!files.length) {
    return;
  }

  const validImages = [];
  let invalidFiles = 0;

  files.forEach((file) => {
    if (file && file.type && file.type.startsWith('image/')) {
      validImages.push(file);
    } else {
      invalidFiles += 1;
    }
  });

  validImages.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingRegionGalleryImages.push({
        file,
        previewUrl: e.target.result,
        description: '',
      });
      renderPendingRegionImages();
    };
    reader.readAsDataURL(file);
  });

  if (invalidFiles > 0) {
    showErrorMessage('Algunos archivos fueron descartados porque no son imágenes válidas.');
  }

  input.value = '';
}

async function addImageToRegion() {
  if (!CAN_EDIT_REGIONS) {
    showErrorMessage('No tienes permisos para agregar imágenes.');
    return;
  }

  if (!currentRegionId) {
    showErrorMessage('No hay región seleccionada');
    return;
  }

  if (!pendingRegionGalleryImages.length) {
    showErrorMessage('Selecciona al menos una imagen antes de continuar.');
    return;
  }

  const csrfToken = getCookie('csrftoken');
  if (!csrfToken) {
    showErrorMessage('Error de autenticación. Por favor, recarga la página.');
    return;
  }

  const confirmButton = document.getElementById('confirmImageBtn');
  const originalLabel = confirmButton ? confirmButton.textContent : null;

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Guardando...';
  }

  const imagesToUpload = [...pendingRegionGalleryImages];
  let uploadedCount = 0;

  try {
    for (const item of imagesToUpload) {
      const formData = new FormData();
      formData.append('imagen', item.file);
      formData.append('descripcion', (item.description || '').trim());

      const response = await fetch(`/api/region/${currentRegionId}/galeria/agregar/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo agregar la imagen');
      }

      uploadedCount += 1;

      if (currentRegionData && Array.isArray(currentRegionData.photos)) {
        currentRegionData.photos.push({
          id: result.imagen?.id || null,
          url: result.imagen?.url || '',
          description: result.imagen?.descripcion || result.imagen?.description || 'Imagen de la región',
        });
      }
    }

    if (currentRegionData && Array.isArray(currentRegionData.photos)) {
      loadGalleryWithDeleteButtons(currentRegionData.photos);
    } else {
      await showRegionDetail(currentRegionId);
    }

    clearImageForm();
    hideModal('addImageModal');

    const successMessage = imagesToUpload.length === 1
      ? 'Imagen agregada exitosamente'
      : 'Imágenes agregadas exitosamente';
    showSuccessMessage(successMessage);

    await loadFeaturedRegions();
    await loadRegionsFromAPI();
  } catch (error) {
    pendingRegionGalleryImages = imagesToUpload.slice(uploadedCount);
    renderPendingRegionImages();

    if (uploadedCount > 0) {
      showErrorMessage(`${error.message || 'Ocurrió un problema al agregar las imágenes.'} Se subieron ${uploadedCount} imagen(es) antes del error.`);
    } else {
      showErrorMessage(error.message || 'No se pudieron agregar las imágenes.');
    }
  } finally {
    if (confirmButton) {
      confirmButton.disabled = false;
      if (originalLabel !== null) {
        confirmButton.textContent = originalLabel;
      }
    }
  }
}

// Función para obtener cookie CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function showEditDescriptionModal() {
  if (currentRegionData) {
    const textarea = document.getElementById('editDescriptionText');
    if (textarea) {
      textarea.value = currentRegionData.rawDescription || '';
    }
    showModal('editDescriptionModal');
  }
}

async function updateRegionDescription() {
  const textarea = document.getElementById('editDescriptionText');
  if (!textarea) return;
  
  const newDescription = textarea.value.trim();

  if (!newDescription) {
    showErrorMessage('Por favor ingresa una descripción');
    return;
  }
  
  if (!currentRegionId || !currentRegionData) {
    showErrorMessage('No se pudo identificar la región seleccionada');
    return;
  }

  const csrfToken = getCookie('csrftoken');
  if (!csrfToken) {
    showErrorMessage('No se pudo obtener el token CSRF. Refresca la página e intenta de nuevo.');
    return;
  }

  try {
    const response = await fetch(`/api/region/${currentRegionId}/descripcion/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ descripcion: newDescription })
    });

    let result = {};
    try {
      result = await response.json();
    } catch (jsonError) {
    }

    if (!response.ok || !result.success) {
      showErrorMessage(result.error || 'Error al actualizar la descripción de la región');
      return;
    }

    currentRegionData.rawDescription = result.descripcion || newDescription;
    currentRegionData.description = currentRegionData.rawDescription
      ? formatDescription(currentRegionData.rawDescription)
      : '';

    const descElement = document.getElementById('detailDescription');
    if (descElement) {
      descElement.innerHTML = currentRegionData.description || '<p style="color: var(--text-muted);">No hay descripción disponible</p>';
    }

    showSuccessMessage(result.message || 'Descripción actualizada exitosamente');
    hideModal('editDescriptionModal');

    await loadRegionsFromAPI();
    await loadFeaturedRegions();
  } catch (error) {
    showErrorMessage('Error al actualizar la descripción. Por favor, intenta de nuevo.');
  }
}

function showEditDataModal() {
  if (currentRegionData) {
    // Extraer valores actuales de los datos
    const communitiesData = currentRegionData.data.find(item => item.label === 'Número de Comunidades');
    const populationData = currentRegionData.data.find(item => item.label === 'Población Aproximada');
    const sedeData = currentRegionData.data.find(item => item.label === 'Comunidad Sede');
    
    document.getElementById('editCommunitiesCount').value = communitiesData ? communitiesData.value.replace(/\D/g, '') : '';
    document.getElementById('editPopulation').value = populationData ? populationData.value : '';
    document.getElementById('editSedeCommunity').value = sedeData ? sedeData.value : '';
    showModal('editDataModal');
  }
}

function updateRegionData() {
  const communitiesCount = document.getElementById('editCommunitiesCount').value;
  const population = document.getElementById('editPopulation').value;
  const sedeCommunity = document.getElementById('editSedeCommunity').value;
  
  if (!communitiesCount || !population.trim() || !sedeCommunity.trim()) {
    showErrorMessage('Por favor completa todos los campos');
    return;
  }
  
  if (currentRegionData) {
    // Actualizar los datos
    currentRegionData.data = [
      { icon: '🏘️', label: 'Número de Comunidades', value: `${communitiesCount} comunidades` },
      { icon: '👥', label: 'Población Aproximada', value: population },
      { icon: '🏛️', label: 'Comunidad Sede', value: sedeCommunity }
    ];
    
    // Recargar la vista de datos
    loadData(currentRegionData.data);
    showSuccessMessage('Datos actualizados exitosamente');
    hideModal('editDataModal');
  }
}

// ======= FUNCIONES DE NOTIFICACIONES =======
function showSuccessMessage(message) {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showErrorMessage(message) {
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ======= INICIALIZACIÓN =======
document.addEventListener('DOMContentLoaded', function() {
  const featuredPromise = Promise.resolve(loadFeaturedRegions());
  
  // Event listeners para navegación
  const btnVerTodas = document.getElementById('btnVerTodas');
  if (btnVerTodas) {
    btnVerTodas.addEventListener('click', showRegionsList);
  }
  
  const btnBackFromList = document.getElementById('btnBackFromList');
  if (btnBackFromList) {
    btnBackFromList.addEventListener('click', backToMain);
  }
  
  const btnBackFromDetail = document.getElementById('btnBackFromDetail');
  if (btnBackFromDetail) {
    btnBackFromDetail.addEventListener('click', backToMain);  // Cambiar a backToMain
  }
  
  // Event listeners para tarjetas de región
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('region-card__btn') || e.target.closest('.region-card__btn')) {
      const btn = e.target.classList.contains('region-card__btn') ? e.target : e.target.closest('.region-card__btn');
      const regionId = btn.getAttribute('data-region-id');
      if (regionId) {
        showRegionDetail(regionId);
      }
    }
    
    if (e.target.classList.contains('region-list-item__btn') || e.target.closest('.region-list-item__btn')) {
      const btn = e.target.classList.contains('region-list-item__btn') ? e.target : e.target.closest('.region-list-item__btn');
      const regionId = btn.getAttribute('data-region-id');
      if (regionId) {
        showRegionDetail(regionId);
      }
    }
  });
  
  // Event listeners para búsqueda y filtro
  const searchInput = document.getElementById('searchRegions');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchRegions(e.target.value);
    });
  }
  
  const sortSelect = document.getElementById('sortRegions');
  if (sortSelect) {
    sortSelect.addEventListener('change', function(e) {
      sortRegions(e.target.value);
    });
  }
  
  // Event listeners para modales
  const addImageBtn = document.getElementById('addImageBtn');
  if (addImageBtn) {
    addImageBtn.addEventListener('click', showAddImageModal);
  }
  
  const imageFileInput = document.getElementById('imageFileInput');
  if (imageFileInput) {
    imageFileInput.addEventListener('change', handleImageFileSelect);
  }
  
  const confirmImageBtn = document.getElementById('confirmImageBtn');
  if (confirmImageBtn) {
    confirmImageBtn.addEventListener('click', addImageToRegion);
  }
  
  const cancelImageBtn = document.getElementById('cancelImageBtn');
  if (cancelImageBtn) {
    cancelImageBtn.addEventListener('click', () => hideModal('addImageModal'));
  }
  
  const closeImageModal = document.getElementById('closeImageModal');
  if (closeImageModal) {
    closeImageModal.addEventListener('click', () => hideModal('addImageModal'));
  }
  
  const closeImageViewer = document.getElementById('closeImageViewer');
  if (closeImageViewer) {
    closeImageViewer.addEventListener('click', () => hideModal('imageViewerModal'));
  }
  
  const editDescriptionBtn = document.getElementById('editDescriptionBtn');
  if (editDescriptionBtn) {
    editDescriptionBtn.addEventListener('click', showEditDescriptionModal);
  }
  
  const confirmDescriptionBtn = document.getElementById('confirmDescriptionBtn');
  if (confirmDescriptionBtn) {
    confirmDescriptionBtn.addEventListener('click', updateRegionDescription);
  }
  
  const cancelDescriptionBtn = document.getElementById('cancelDescriptionBtn');
  if (cancelDescriptionBtn) {
    cancelDescriptionBtn.addEventListener('click', () => hideModal('editDescriptionModal'));
  }
  
  const closeDescriptionModal = document.getElementById('closeDescriptionModal');
  if (closeDescriptionModal) {
    closeDescriptionModal.addEventListener('click', () => hideModal('editDescriptionModal'));
  }

  // Event listeners para editar datos
  const editDataBtn = document.getElementById('editDataBtn');
  if (editDataBtn) {
    editDataBtn.addEventListener('click', showEditDataModal);
  }
  
  const confirmDataBtn = document.getElementById('confirmDataBtn');
  if (confirmDataBtn) {
    confirmDataBtn.addEventListener('click', updateRegionData);
  }
  
  const cancelDataBtn = document.getElementById('cancelDataBtn');
  if (cancelDataBtn) {
    cancelDataBtn.addEventListener('click', () => hideModal('editDataModal'));
  }
  
  const closeDataModal = document.getElementById('closeDataModal');
  if (closeDataModal) {
    closeDataModal.addEventListener('click', () => hideModal('editDataModal'));
  }
  
  // Cerrar modales al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
  
  document.addEventListener('click', function(e) {
    if (e.target.id === 'imageViewerModal' && e.target.classList.contains('modal')) {
      hideModal('imageViewerModal');
    }
  });
  
  // Event listeners para archivos
  const addFileBtn = document.getElementById('addFileBtn');
  if (addFileBtn) {
    addFileBtn.addEventListener('click', showAddFileModal);
  }
  
  // Input de archivo
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }
  
  // Botones del modal de archivo
  const cancelFileBtn = document.getElementById('cancelFileBtn');
  const confirmFileBtn = document.getElementById('confirmFileBtn');
  const closeFileModal = document.getElementById('closeFileModal');
  
  if (cancelFileBtn) {
    cancelFileBtn.addEventListener('click', function() {
      hideModal('addFileModal');
    });
  }
  
  if (confirmFileBtn) {
    confirmFileBtn.addEventListener('click', addFileToRegion);
  }
  
  if (closeFileModal) {
    closeFileModal.addEventListener('click', function() {
      hideModal('addFileModal');
    });
  }

  const confirmFileDescriptionBtn = document.getElementById('confirmFileDescriptionBtn');
  if (confirmFileDescriptionBtn) {
    confirmFileDescriptionBtn.addEventListener('click', updateRegionFileDescription);
  }

  const cancelFileDescriptionBtn = document.getElementById('cancelFileDescriptionBtn');
  if (cancelFileDescriptionBtn) {
    cancelFileDescriptionBtn.addEventListener('click', () => {
      hideModal('editFileDescriptionModal');
      currentRegionFileEdit = null;
    });
  }

  const closeFileDescriptionModal = document.getElementById('closeFileDescriptionModal');
  if (closeFileDescriptionModal) {
    closeFileDescriptionModal.addEventListener('click', () => {
      hideModal('editFileDescriptionModal');
      currentRegionFileEdit = null;
    });
  }
  
  // Event listeners para modales de confirmación
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const closeConfirmModal = document.getElementById('closeConfirmModal');

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', executeDeleteAction);
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', function() {
      hideModal('confirmDeleteModal');
      pendingDeleteAction = null;
    });
  }

  if (closeConfirmModal) {
    closeConfirmModal.addEventListener('click', function() {
      hideModal('confirmDeleteModal');
      pendingDeleteAction = null;
    });
  }
  
  // Cargar regiones desde la API al iniciar (para tener datos disponibles en JS)
  const regionsPromise = Promise.resolve(loadRegionsFromAPI());

  Promise.allSettled([featuredPromise, regionsPromise]).then(() => {
    if (pendingRegionDetailId) {
      const targetId = pendingRegionDetailId;
      pendingRegionDetailId = null;
      setTimeout(() => {
        showRegionDetail(targetId);
      }, 120);
    }
  });
});

// ======= FUNCIONALIDAD DE ELIMINACIÓN =======

// Variables globales para eliminación
let pendingDeleteAction = null;

// Función para mostrar modal de confirmación
function showConfirmDeleteModal(message, callback) {
  document.getElementById('confirmMessage').textContent = message;
  pendingDeleteAction = callback;
  showModal('confirmDeleteModal');
}

// Función para ejecutar la acción de eliminación
async function executeDeleteAction() {
  if (!pendingDeleteAction) return;

  try {
    await pendingDeleteAction();
  } catch (error) {
  } finally {
    hideModal('confirmDeleteModal');
    pendingDeleteAction = null;
  }
}

// Función para eliminar imagen de la galería
function removeImageFromRegion(imageIndex) {
  if (!currentRegionData || !Array.isArray(currentRegionData.photos)) return;
  const targetPhoto = currentRegionData.photos[imageIndex];
  if (!targetPhoto || !targetPhoto.id) {
    showErrorMessage('No se pudo identificar la imagen a eliminar.');
    return;
  }

  const regionId = currentRegionId || currentRegionData.id;
  if (!regionId) {
    showErrorMessage('No se pudo identificar la región actual.');
    return;
  }

  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar esta imagen de la galería?',
    () => {
      fetch(`/api/region/${regionId}/galeria/${targetPhoto.id}/eliminar/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'No se pudo eliminar la imagen');
          }
          currentRegionData.photos = currentRegionData.photos.filter((photo, idx) => idx !== imageIndex);
          loadGalleryWithDeleteButtons(currentRegionData.photos);
          showSuccessMessage(result.message || 'Imagen eliminada correctamente');
        })
        .catch((error) => {
          showErrorMessage(error.message || 'No se pudo eliminar la imagen');
        });
    }
  );
}

// Función para obtener la región actual
function getCurrentRegion() {
  // Retornar la región actualmente mostrada
  return currentRegionData;
}

// Función para cargar archivos (sin botones X)
function loadFilesWithDeleteButtons(files) {
  const container = document.getElementById('detailFiles');
  if (!container) return;

  container.innerHTML = '';
  
  files.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <div class="file-icon">📄</div>
      <div class="file-info">
        <h4>${file.name}</h4>
        <p>${file.description}</p>
        <div class="file-date">${file.date}</div>
      </div>
      <div class="file-actions">
        <a href="${file.url}" class="file-download-btn" download>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Descargar
        </a>
      </div>
    `;
    container.appendChild(fileItem);
  });
}

// Event listeners para botones de eliminación (solo imágenes)
document.addEventListener('click', function(e) {
  const imageDeleteButton = e.target.closest('.btn-remove-item');
  if (imageDeleteButton && imageDeleteButton.hasAttribute('data-image-index')) {
    const imageIndex = parseInt(imageDeleteButton.getAttribute('data-image-index'), 10);
    if (!Number.isNaN(imageIndex)) {
      removeImageFromRegion(imageIndex);
    }
  }

  const pendingImageRemoveButton = e.target.closest('.image-preview-remove');
  if (pendingImageRemoveButton && pendingImageRemoveButton.hasAttribute('data-index')) {
    const pendingIndex = parseInt(pendingImageRemoveButton.getAttribute('data-index'), 10);
    if (!Number.isNaN(pendingIndex)) {
      pendingRegionGalleryImages.splice(pendingIndex, 1);
      renderPendingRegionImages();
    }
    return;
  }

  const imageElement = e.target.closest('.gallery-item img');
  if (imageElement && imageElement.getAttribute('data-photo-url')) {
    const imageUrl = imageElement.getAttribute('data-photo-url');
    const imageDescription = imageElement.getAttribute('alt') || '';
    openImageViewer(imageUrl, imageDescription);
  }

  const fileDeleteButton = e.target.closest('.file-delete-btn');
  if (fileDeleteButton) {
    const fileId = fileDeleteButton.getAttribute('data-file-id');
    const encodedName = fileDeleteButton.getAttribute('data-file-name');
    confirmDeleteRegionFile(fileId, encodedName);
    return;
  }

  const fileEditButton = e.target.closest('.file-edit-btn');
  if (fileEditButton && fileEditButton.dataset.fileId) {
    const description = fileEditButton.dataset.fileDescription || '';
    showEditFileDescriptionModal(
      fileEditButton.dataset.fileId,
      description ? decodeHTMLEntities(description) : ''
    );
    return;
  }

  const previewRemoveButton = e.target.closest('.file-preview-remove[data-role="region-file-remove"]');
  if (previewRemoveButton) {
    e.preventDefault();
    clearFileForm();
  }
});

document.addEventListener('input', (event) => {
  const descriptionInput = event.target.closest('.image-description-input');
  if (!descriptionInput || !descriptionInput.hasAttribute('data-index')) {
    return;
  }

  const index = parseInt(descriptionInput.getAttribute('data-index'), 10);
  if (Number.isNaN(index) || !pendingRegionGalleryImages[index]) {
    return;
  }

  pendingRegionGalleryImages[index].description = descriptionInput.value;
});

function decodeHTMLEntities(html) {
  if (!html) {
    return '';
  }
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}
