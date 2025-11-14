/* ======= FUNCIONALIDAD PARA COMUNIDADES ======= */

// ======= DATOS DE COMUNIDADES - CARGA DESDE BD =======

// Configuración e in-memory cache
const DEFAULT_COMMUNITY_IMAGE_LARGE = 'https://images.unsplash.com/photo-1523978591478-c753949ff840?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
const DEFAULT_COMMUNITY_IMAGE_SMALL = 'https://images.unsplash.com/photo-1523978591478-c753949ff840?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
const COMMUNITIES_LIST_ENDPOINT = '/api/comunidades/';
const COMMUNITY_DETAIL_ENDPOINT = (id) => `/api/comunidad/${id}/`;

const USER_AUTH = window.USER_AUTH || { isAuthenticated: false, isAdmin: false, isPersonal: false };
const CAN_EDIT_COMMUNITIES = USER_AUTH.isAuthenticated && (USER_AUTH.isAdmin || USER_AUTH.isPersonal);

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

let pendingCommunityDetailId = consumePendingNavigationTarget({
  storageKey: 'pendingCommunityDetail',
  queryParam: 'community',
});

function normalizeTitle(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

const BUILTIN_COMMUNITY_TITLES = ['Población', 'Coordenadas', 'COCODE', 'Teléfono COCODE', 'Tipo de Comunidad'];
const BUILTIN_COMMUNITY_TITLES_NORMALIZED = new Set(BUILTIN_COMMUNITY_TITLES.map(normalizeTitle));

let communitiesData = {};
let allCommunitiesData = [];
let filteredCommunities = [];
let currentCommunityData = null;
let isCommunitiesLoading = false;
let isDetailLoading = false;
let pendingGalleryImages = [];
let currentFileEdit = null;
let FEATURED_COMMUNITIES_LIMIT = null;

function escapeHtml(string = '') {
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDescription(text) {
  if (!text) {
    return '<p>Sin descripción disponible.</p>';
  }
  const paragraphs = escapeHtml(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (!paragraphs.length) {
    return '<p>Sin descripción disponible.</p>';
  }

  return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
}

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (let i = 0; i < cookies.length; i += 1) {
    const parts = cookies[i].split('=');
    const key = decodeURIComponent(parts[0]);
    if (key === name) {
      return decodeURIComponent(parts.slice(1).join('='));
    }
  }
  return null;
}

async function fetchJson(url) {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP ${response.status}`);
  }
  return response.json();
}

function normalizeCommunityDetailResponse(data) {
  if (!data) {
    return null;
  }

  const regionName = data.region && data.region.nombre ? data.region.nombre : 'Sin región asignada';
  const regionCode = data.region && data.region.codigo ? data.region.codigo : '';
  const regionDisplayName = regionName;

  const photos = Array.isArray(data.photos)
    ? data.photos.map((photo) => ({
        id: photo.id || null,
        url: photo.url,
        description: photo.description || 'Imagen de la comunidad',
      }))
    : [];

  const files = Array.isArray(data.files)
    ? data.files.map((file) => ({
        id: file.id || null,
        name: file.name || 'Archivo',
        description: file.description || '',
        type: file.type || 'archivo',
        url: file.url,
        date: file.date ? formatDate(file.date) : 'Fecha no disponible',
      }))
    : [];

  const projects = Array.isArray(data.projects) ? data.projects : [];
  const authorities = Array.isArray(data.autoridades) ? data.autoridades : [];

  const dataSummary = Array.isArray(data.data)
    ? data.data.map((item) => ({
        icon: item.icon || '📌',
        label: item.label || '',
        value: item.value !== undefined && item.value !== null ? String(item.value) : '',
        isDefault: Boolean(item.is_default),
        hasValue: Boolean(item.has_value),
      }))
    : [];

  const customCards = Array.isArray(data.custom_cards)
    ? data.custom_cards.map((card, index) => ({
        id: card.id || null,
        title: card.title || '',
        value: card.value || '',
        icon: card.icon || '',
        order: typeof card.order === 'number' ? card.order : index,
      }))
    : [];

  customCards.sort((a, b) => (a.order || 0) - (b.order || 0));

  let coordinates = data.coordinates || '';
  if (!coordinates && data.latitud !== null && data.latitud !== undefined && data.longitud !== null && data.longitud !== undefined) {
    coordinates = `${data.latitud}, ${data.longitud}`;
  }

  const existingListEntry = allCommunitiesData.find((item) => item.id === data.id);
  const coverImage = data.cover_image || (existingListEntry ? existingListEntry.image : DEFAULT_COMMUNITY_IMAGE_LARGE);

  return {
    id: data.id,
    code: data.codigo,
    name: data.nombre,
    description: formatDescription(data.descripcion),
    rawDescription: data.descripcion || '',
    region: regionDisplayName,
    regionName,
    regionCode,
    type: data.tipo || 'Sin tipo',
    population: Number.isFinite(data.poblacion) ? data.poblacion : null,
    latitud: data.latitud !== undefined ? data.latitud : null,
    longitud: data.longitud !== undefined ? data.longitud : null,
    coordinates,
    cocode: data.cocode || '',
    cocodePhone: data.telefono_cocode || '',
    location: data.location || '',
    photos,
    files,
    projects,
    authorities,
    dataSummary,
    customCards,
    coverImage,
    image: coverImage,
    lastUpdate: data.actualizado_en || null,
    createdAt: data.creado_en || null,
  };
}

async function fetchCommunitiesList(force = false) {
  if (!force && allCommunitiesData.length > 0) {
    return allCommunitiesData;
  }

  if (isCommunitiesLoading) {
    return allCommunitiesData;
  }

  isCommunitiesLoading = true;
  try {
    const comunidades = await fetchJson(COMMUNITIES_LIST_ENDPOINT);
    allCommunitiesData = comunidades.map((item) => ({
      id: item.id,
      name: item.nombre,
      region: item.region && item.region.nombre ? item.region.nombre : 'Sin región',
      regionCode: item.region && item.region.codigo ? item.region.codigo : '',
      type: item.tipo || 'Sin tipo',
      hasProjects: Boolean(item.has_projects),
      lastUpdate: item.actualizado_en || item.creado_en || null,
      image: item.imagen_url || DEFAULT_COMMUNITY_IMAGE_SMALL,
    }));
    filteredCommunities = [...allCommunitiesData];
  } catch (error) {
    showErrorMessage('No se pudieron cargar las comunidades. Inténtalo nuevamente.');
  } finally {
    isCommunitiesLoading = false;
  }
  return allCommunitiesData;
}

async function fetchCommunityDetail(communityId, { force = false } = {}) {
  if (!force && communitiesData[communityId]) {
    return communitiesData[communityId];
  }

  if (isDetailLoading) {
    return communitiesData[communityId];
  }

  isDetailLoading = true;
  try {
    const data = await fetchJson(COMMUNITY_DETAIL_ENDPOINT(communityId));
    const normalized = normalizeCommunityDetailResponse(data);
    if (normalized) {
      communitiesData[communityId] = normalized;
    }
    return normalized;
  } catch (error) {
    throw error;
  } finally {
    isDetailLoading = false;
  }
}

async function refreshCurrentCommunity(successMessage) {
  if (!currentCommunityData) return;
  try {
    const updated = await fetchCommunityDetail(currentCommunityData.id, { force: true });
    if (updated) {
      currentCommunityData = updated;
      loadCommunityDetail(updated);
      updateCommunitiesCache(updated);
      updateMainCommunityCard(updated);
      promoteCommunityToFeatured(updated);
      const listView = document.getElementById('communitiesListView');
      if (listView && listView.style.display !== 'none') {
        loadCommunitiesList();
      }
      if (successMessage) {
        showSuccessMessage(successMessage);
      }
    }
  } catch (error) {
    showErrorMessage(error.message || 'No se pudo actualizar la información de la comunidad.');
  }
}

// ======= FUNCIONES DE UTILIDAD =======

// Función para formatear fechas
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Función para mostrar notificaciones
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

// ======= FUNCIONES DE MODAL =======

// Función para mostrar modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

// Función para ocultar modal
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Función para validar credenciales (ya no se usa)
// function validateCredentials(user, password) {
//   return user === ADMIN_CREDENTIALS.user && password === ADMIN_CREDENTIALS.password;
// }

// ======= VISTA DE LISTA DE COMUNIDADES =======

// Función para mostrar vista de lista
async function showCommunitiesList() {
  const mainView = document.querySelector('.communities-main');
  const listView = document.getElementById('communitiesListView');
  const detailView = document.getElementById('communityDetailView');
  
  if (detailView) {
    detailView.style.display = 'none';
  }
  
  // Ocultar vista principal
  mainView.style.display = 'none';
  
  // Mostrar vista de lista
  listView.style.display = 'block';

  await fetchCommunitiesList();

  // Cargar lista de comunidades
  loadCommunitiesList();
  
  // Re-agregar listeners después de cargar la lista
  setTimeout(() => {
    addCommunityViewMoreListeners();
  }, 100);
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

// Función para cargar lista de comunidades
function loadCommunitiesList() {
  const communitiesList = document.getElementById('communitiesList');
  if (!communitiesList) return;
  
  communitiesList.innerHTML = '';

  if (!filteredCommunities.length) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'community-list-empty';
    emptyMessage.innerHTML = '<p>No se encontraron comunidades.</p>';
    communitiesList.appendChild(emptyMessage);
    return;
  }

  filteredCommunities.forEach(community => {
    const listItem = document.createElement('div');
    listItem.className = 'community-list-item';
    listItem.innerHTML = `
      <div class="community-list-item__image">
        <img src="${community.image || DEFAULT_COMMUNITY_IMAGE_SMALL}" alt="${escapeHtml(community.name)}">
      </div>
      <div class="community-list-item__content">
        <div class="community-list-item__info">
          <h3 class="community-list-item__name">${escapeHtml(community.name)}</h3>
          <div class="community-list-item__details">
            <div class="community-list-item__region">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${escapeHtml(community.region)}
            </div>
            <div class="community-list-item__type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
              ${escapeHtml(community.type)}
            </div>
            <div class="community-list-item__projects">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              ${community.hasProjects ? 'Con proyectos' : 'Sin proyectos'}
            </div>
          </div>
        </div>
        <button class="community-list-item__btn" data-community-id="${community.id}">Ver más</button>
      </div>
    `;
    communitiesList.appendChild(listItem);
  });
  
  // Agregar event listeners a los botones
  setTimeout(() => {
    addCommunityViewMoreListeners();
  }, 100);
}

// Función para volver a la vista principal
function showMainView() {
  const mainView = document.querySelector('.communities-main');
  const listView = document.getElementById('communitiesListView');
  const detailView = document.getElementById('communityDetailView');
  
  setDetailLoading(false);

  // Ocultar otras vistas
  listView.style.display = 'none';
  detailView.style.display = 'none';
  
  // Mostrar vista principal
  mainView.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

// ======= VISTA DETALLADA DE COMUNIDAD =======

function setDetailLoading(isLoading, message = 'Cargando comunidad...') {
  const detailView = document.getElementById('communityDetailView');
  if (!detailView) return;
  const detailContent = detailView.querySelector('.detail-content');
  if (!detailContent) return;

  let overlay = detailContent.querySelector('.loading-overlay');
  if (isLoading) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      `;
      detailContent.appendChild(overlay);
    } else {
      overlay.querySelector('.loading-message').textContent = message;
    }
  } else if (overlay) {
    overlay.remove();
  }
}

// Función para mostrar vista detallada
async function showCommunityDetail(communityId) {
  // Prevenir múltiples clics mientras se está cargando
  if (isDetailLoading) {
    return;
  }

  const mainView = document.querySelector('.communities-main');
  const listView = document.getElementById('communitiesListView');
  const detailView = document.getElementById('communityDetailView');
  
  if (!detailView) {
    return;
  }
  
  // Ocultar otras vistas
  if (mainView) {
    mainView.style.display = 'none';
  }
  if (listView) {
    listView.style.display = 'none';
  }
  
  // Mostrar vista detallada
  detailView.style.display = 'block';
  
  setDetailLoading(true);

  try {
    const community = await fetchCommunityDetail(communityId);
    if (community) {
      currentCommunityData = community;
      loadCommunityDetail(community);
    } else {
      throw new Error('Comunidad no encontrada');
    }
  } catch (error) {
    showErrorMessage('No se pudo cargar la información de la comunidad.');
    setDetailLoading(false);
    // Solo regresar a la vista principal si es un error crítico
    if (mainView) {
      mainView.style.display = 'block';
    }
    if (detailView) {
      detailView.style.display = 'none';
    }
  }
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

if (typeof window !== 'undefined') {
  window.showCommunityDetail = showCommunityDetail;
  window.searchCommunities = searchCommunities;
  window.showCommunitiesList = showCommunitiesList;
}

// Función para cargar datos de la comunidad en la vista detallada
function loadCommunityDetail(community) {
  // Quitar loader si está activo
  setDetailLoading(false);

  // Título y región
  document.getElementById('detailTitle').textContent = community.name;
  document.getElementById('detailRegion').textContent = community.region;
  
  // Galería de fotos con botones de eliminación
  if (community.photos && community.photos.length) {
    loadGalleryWithDeleteButtons(community.photos);
  } else {
    const galleryContainer = document.getElementById('detailGallery');
    if (galleryContainer) {
      galleryContainer.innerHTML = `
        <div class="gallery-empty">
          <p>No hay imágenes registradas para esta comunidad.</p>
        </div>
      `;
    }
  }
  
  // Ubicación
  const locationContainer = document.getElementById('detailLocationInfo');
  if (locationContainer) {
    const locationDetails = [];
    if (community.location) {
      locationDetails.push(`
        <div class="location-item">
          <div class="location-icon">📍</div>
          <div class="location-content">
            <h4>Ubicación</h4>
            <p>${escapeHtml(community.location)}</p>
          </div>
        </div>
      `);
    }
    if (community.coordinates) {
      locationDetails.push(`
        <div class="location-item">
          <div class="location-icon">🧭</div>
          <div class="location-content">
            <h4>Coordenadas</h4>
            <p>${escapeHtml(community.coordinates)}</p>
          </div>
        </div>
      `);
    }
    locationContainer.innerHTML = locationDetails.join('') || `
      <div class="location-item">
        <div class="location-icon">ℹ️</div>
        <div class="location-content">
          <h4>Ubicación</h4>
          <p>No hay información de ubicación disponible.</p>
        </div>
      </div>
    `;
  }
  
  // Datos generales
  const dataContainer = document.getElementById('detailData');
  if (dataContainer) {
    const summaryItems = [];

    if (Array.isArray(community.dataSummary)) {
      community.dataSummary.forEach((item) => {
        summaryItems.push({
          icon: item.icon || 'ℹ️',
          label: item.label || '',
          value: item.value || '',
          isDefault: Boolean(item.isDefault),
        });
      });
    }

    if (Array.isArray(community.customCards)) {
      community.customCards.forEach((card) => {
        if (BUILTIN_COMMUNITY_TITLES_NORMALIZED.has(normalizeTitle(card.title))) {
          return;
        }
        summaryItems.push({
          icon: card.icon || '📌',
          label: card.title || '',
          value: card.value || '',
          isCustom: true,
        });
      });
    }

    if (!summaryItems.length) {
      summaryItems.push({
        icon: 'ℹ️',
        label: 'Información',
        value: 'No hay datos generales disponibles.',
      });
    }

    dataContainer.innerHTML = summaryItems.map((item) => {
      const iconText = item.icon ? escapeHtml(item.icon) : 'ℹ️';
      const labelText = escapeHtml(item.label || '');
      const valueRaw = item.value === undefined || item.value === null ? '' : String(item.value).trim();
      const valueText = escapeHtml(valueRaw || 'Sin datos disponibles');

      return `
        <div class="data-item${item.isDefault ? ' data-item--default' : ''}">
          <div class="data-icon">${iconText}</div>
          <div class="data-content">
            <h4>${labelText}</h4>
            <p>${valueText}</p>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Descripción
  const descriptionEl = document.getElementById('detailDescription');
  if (descriptionEl) {
    descriptionEl.innerHTML = community.description;
  }
  
  // Proyectos activos
  const projectsContainer = document.getElementById('detailProjects');
  if (projectsContainer) {
    projectsContainer.innerHTML = '';
    if (community.projects && community.projects.length) {
      community.projects.forEach((project, index) => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.innerHTML = `
          <div class="project-icon">${index + 1}</div>
          <div class="project-info">
            <h4>${escapeHtml(project.name || '')}</h4>
            <p>${escapeHtml(project.type || '')}${project.status ? ` • ${escapeHtml(project.status)}` : ''}</p>
          </div>
        `;
        projectsContainer.appendChild(projectItem);
      });
    } else {
      projectsContainer.innerHTML = `
        <div class="projects-empty">
          <p>No hay proyectos registrados para esta comunidad.</p>
        </div>
      `;
    }
  }
  
  // Archivos con botones de eliminación
  if (community.files && community.files.length > 0) {
    loadFilesWithDeleteButtons(community.files);
  } else {
    const filesContainer = document.getElementById('detailFiles');
    filesContainer.innerHTML = `
      <div class="file-item">
        <div class="file-info">
          <p style="color: var(--text-muted); text-align: center; margin: 20px 0;">No hay archivos disponibles para esta comunidad.</p>
        </div>
      </div>
    `;
  }
}

// Función para obtener el icono del archivo
function getFileIcon(fileType) {
  const icons = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'xls': '📊',
    'xlsx': '📊',
    'ppt': '📋',
    'pptx': '📋',
    'txt': '📄',
    'default': '📁'
  };
  return icons[fileType] || icons.default;
}

// Función para abrir modal de imagen
function openImageModal(imageUrl, description) {
  const modal = document.getElementById('communityImageViewerModal');
  const modalImg = document.getElementById('communityImageViewerImg');
  const modalDescription = document.getElementById('communityImageViewerDescription');
  const modalTitle = document.getElementById('communityImageViewerTitle');

  if (!modal || !modalImg) {
    window.open(imageUrl, '_blank');
    return;
  }

  modalImg.src = imageUrl;
  modalImg.alt = description || 'Imagen de la comunidad';
  if (modalTitle) {
    modalTitle.textContent = description || 'Imagen de la comunidad';
  }
  if (modalDescription) {
    modalDescription.textContent = description || '';
    modalDescription.style.display = description ? 'block' : 'none';
  }

  modal.classList.add('active');
}

// Función para volver a la vista principal desde la vista detallada
function backFromDetail() {
  if (currentCommunityData) {
    updateMainCommunityCard(currentCommunityData);
  }

  const mainView = document.querySelector('.communities-main');
  const detailView = document.getElementById('communityDetailView');
  
  // Ocultar vista detallada
  detailView.style.display = 'none';
  
  // Mostrar vista principal
  mainView.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

// ======= FUNCIONES DE BÚSQUEDA Y FILTROS =======

// Función para buscar comunidades
async function searchCommunities(query) {
  if (!allCommunitiesData.length) {
    await fetchCommunitiesList();
  }

  // Aplicar filtro de búsqueda
  if (!query.trim()) {
    filteredCommunities = [...allCommunitiesData];
  } else {
    filteredCommunities = allCommunitiesData.filter(community => 
      community.name.toLowerCase().includes(query.toLowerCase()) ||
      community.region.toLowerCase().includes(query.toLowerCase()) ||
      community.type.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Aplicar el ordenamiento actual si hay uno seleccionado
  const sortSelect = document.getElementById('sortCommunities');
  if (sortSelect && sortSelect.value) {
    const sortBy = sortSelect.value;
    switch (sortBy) {
      case 'name-asc':
        filteredCommunities.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filteredCommunities.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'recent':
        filteredCommunities.sort((a, b) => {
          const dateA = a.lastUpdate ? new Date(a.lastUpdate) : new Date(0);
          const dateB = b.lastUpdate ? new Date(b.lastUpdate) : new Date(0);
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'region':
        filteredCommunities.sort((a, b) => a.region.localeCompare(b.region));
        break;
    }
  }

  loadCommunitiesList();
}

// Función para ordenar comunidades
async function sortCommunities(sortBy) {
  if (!allCommunitiesData.length) {
    await fetchCommunitiesList();
  }

  // Primero aplicar la búsqueda actual si hay una
  const searchInput = document.getElementById('searchCommunities');
  const currentQuery = searchInput ? searchInput.value.trim() : '';
  
  // Aplicar filtro de búsqueda primero
  if (currentQuery) {
    filteredCommunities = allCommunitiesData.filter(community => 
      community.name.toLowerCase().includes(currentQuery.toLowerCase()) ||
      community.region.toLowerCase().includes(currentQuery.toLowerCase()) ||
      community.type.toLowerCase().includes(currentQuery.toLowerCase())
    );
  } else {
    filteredCommunities = [...allCommunitiesData];
  }

  // Luego aplicar el ordenamiento
  switch (sortBy) {
    case 'name-asc':
      filteredCommunities.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredCommunities.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'recent':
      filteredCommunities.sort((a, b) => {
        // Manejar valores null/undefined en lastUpdate
        const dateA = a.lastUpdate ? new Date(a.lastUpdate) : new Date(0);
        const dateB = b.lastUpdate ? new Date(b.lastUpdate) : new Date(0);
        
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
        // Ordenar por fecha descendente (más reciente primero)
        return dateB.getTime() - dateA.getTime();
      });
      break;
    case 'region':
      filteredCommunities.sort((a, b) => a.region.localeCompare(b.region));
      break;
  }
  loadCommunitiesList();
}

// ======= FUNCIONES DE EDICIÓN =======

// Variable para almacenar la acción pendiente (ya no se usa)
// let pendingAction = null;

// Función para mostrar modal de credenciales (ya no se usa)
// function showCredentialsModal(action) {
//   pendingAction = action;
//   document.getElementById('adminUsername').value = '';
//   document.getElementById('adminPassword').value = '';
//   document.getElementById('credentialsError').style.display = 'none';
//   showModal('adminCredentialsModal');
// }

// Función para validar credenciales (ya no se usa)
// function verifyCredentials() {
//   const username = document.getElementById('adminUsername').value;
//   const password = document.getElementById('adminPassword').value;
//   const errorDiv = document.getElementById('credentialsError');

//   if (username === ADMIN_CREDENTIALS.user && password === ADMIN_CREDENTIALS.password) {
//     // Credenciales correctas - ejecutar acción directamente
//     errorDiv.style.display = 'none';
//     executePendingAction();
//   } else {
//     // Credenciales incorrectas
//     errorDiv.style.display = 'block';
//   }
// }

// function executePendingAction() {
//   if (pendingAction) {
//     pendingAction();
//     pendingAction = null;
//   }
//   hideModal('adminCredentialsModal');
// }

function showEditDataModal() {
  if (!currentCommunityData) return;

  const populationInput = document.getElementById('editPopulation');
  const coordinatesInput = document.getElementById('editCoordinates');
  const cocodeInput = document.getElementById('editCocode');
  const cocodePhoneInput = document.getElementById('editCocodePhone');

  if (populationInput) {
    populationInput.value = currentCommunityData.population !== null && currentCommunityData.population !== undefined
      ? currentCommunityData.population
      : '';
  }
  if (coordinatesInput) {
    coordinatesInput.value = currentCommunityData.coordinates || '';
  }
  if (cocodeInput) {
    cocodeInput.value = currentCommunityData.cocode || '';
  }
  if (cocodePhoneInput) {
    cocodePhoneInput.value = currentCommunityData.cocodePhone || '';
  }

  showModal('editDataModal');
}

function updateCommunitiesCache(updatedCommunity) {
  if (!updatedCommunity) return;

  const listIndex = allCommunitiesData.findIndex((item) => item.id === updatedCommunity.id);
  const entryUpdate = {
    name: updatedCommunity.name,
    region: updatedCommunity.regionName || 'Sin región',
    regionCode: updatedCommunity.regionCode || '',
    type: updatedCommunity.type,
    lastUpdate: updatedCommunity.lastUpdate || new Date().toISOString(),
    image: updatedCommunity.coverImage || updatedCommunity.image || DEFAULT_COMMUNITY_IMAGE_SMALL,
    hasProjects: Array.isArray(updatedCommunity.projects) ? updatedCommunity.projects.length > 0 : false,
  };

  if (listIndex !== -1) {
    allCommunitiesData[listIndex] = {
      ...allCommunitiesData[listIndex],
      ...entryUpdate,
    };
  }

  filteredCommunities = filteredCommunities.map((item) =>
    item.id === updatedCommunity.id ? { ...item, ...entryUpdate } : item
  );
}

async function updateCommunityData() {
  if (!currentCommunityData) return;

  const populationInput = document.getElementById('editPopulation');
  const coordinatesInput = document.getElementById('editCoordinates');
  const cocodeInput = document.getElementById('editCocode');
  const cocodePhoneInput = document.getElementById('editCocodePhone');

  const populationValue = populationInput ? populationInput.value.trim() : '';
  const coordinatesValue = coordinatesInput ? coordinatesInput.value.trim() : '';
  const rawCocodeValue = cocodeInput ? cocodeInput.value.trim() : '';
  const rawCocodePhone = cocodePhoneInput ? cocodePhoneInput.value.trim() : '';

  const normalizedCocode = rawCocodeValue.replace(/\s+/g, ' ').trim();
  const phoneDigits = rawCocodePhone.replace(/\s+/g, '');
  let formattedCoordinates = coordinatesValue;
  if (coordinatesValue) {
    const parts = coordinatesValue.split(',');
    if (parts.length === 2) {
      formattedCoordinates = `${parts[0].trim()}, ${parts[1].trim()}`;
    }
  }

  const errors = [];
  const validators = [
    () => {
      if (!populationValue) {
        errors.push('La población es obligatoria.');
        return;
      }
      if (!/^\d+$/.test(populationValue)) {
        errors.push('La población debe contener solo números.');
        return;
      }
    },
    () => {
      if (!normalizedCocode) {
        errors.push('El COCODE es obligatorio.');
        return;
      }
      if (normalizedCocode.length > 100) {
        errors.push('El COCODE no puede superar los 100 caracteres.');
        return;
      }
      const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\s-]+$/;
      if (!nameRegex.test(normalizedCocode)) {
        errors.push('El COCODE solo puede contener letras y espacios.');
      }
    },
    () => {
      if (!phoneDigits) {
        errors.push('El teléfono del COCODE es obligatorio.');
        return;
      }
      if (!/^\d{8}$/.test(phoneDigits)) {
        errors.push('El teléfono COCODE debe tener exactamente 8 dígitos numéricos.');
      }
    },
    () => {
      if (!formattedCoordinates) {
        return;
      }
      const coordsRegex = /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/;
      if (!coordsRegex.test(formattedCoordinates)) {
        errors.push('Las coordenadas deben tener el formato "latitud, longitud" con números válidos.');
      }
    },
  ];

  validators.forEach((fn) => fn());

  if (errors.length) {
    showErrorMessage(errors[0]);
    return;
  }

  const payload = {
    poblacion: populationValue !== '' ? populationValue : null,
    coordenadas: formattedCoordinates,
    cocode: normalizedCocode,
    telefono_cocode: phoneDigits,
  };

  try {
    const response = await fetch(`/api/comunidad/${currentCommunityData.id}/datos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken') || '',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'No se pudieron actualizar los datos.');
    }

    const normalized = normalizeCommunityDetailResponse(result.comunidad);
    if (!normalized) {
      throw new Error('La respuesta del servidor no es válida.');
    }

    currentCommunityData = normalized;
    communitiesData[normalized.id] = normalized;
    updateCommunitiesCache(normalized);

    loadCommunityDetail(normalized);
    updateMainCommunityCard(normalized);
    promoteCommunityToFeatured(normalized);

    const listView = document.getElementById('communitiesListView');
    if (listView && listView.style.display !== 'none') {
      loadCommunitiesList();
    }

    hideModal('editDataModal');
    showSuccessMessage(result.message || 'Datos actualizados correctamente.');
  } catch (error) {
    showErrorMessage(error.message || 'No se pudieron actualizar los datos.');
  }
}

// Función para mostrar modal de editar descripción
function showEditDescriptionModal() {
  if (currentCommunityData) {
    const textarea = document.getElementById('editDescriptionText');
    if (!textarea) return;

    const rawDescription = currentCommunityData.rawDescription;
    if (typeof rawDescription === 'string') {
      textarea.value = rawDescription;
    } else {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentCommunityData.description || '';
      textarea.value = tempDiv.textContent || tempDiv.innerText || '';
    }
    showModal('editDescriptionModal');
  }
}

// Función para actualizar descripción de la comunidad
function updateCommunityDescription() {
  if (!currentCommunityData) {
    return;
  }

  const descriptionTextarea = document.getElementById('editDescriptionText');
  if (!descriptionTextarea) {
    return;
  }

  const newDescription = descriptionTextarea.value.trim();

  fetch(`/api/comunidad/${currentCommunityData.id}/descripcion/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken') || '',
    },
    body: JSON.stringify({ descripcion: newDescription }),
  })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo actualizar la descripción.');
      }
      const normalized = normalizeCommunityDetailResponse(result.comunidad);
      if (!normalized) {
        throw new Error('La respuesta del servidor no es válida.');
      }
      currentCommunityData = normalized;
      communitiesData[normalized.id] = normalized;
      updateCommunitiesCache(normalized);
      loadCommunityDetail(normalized);
      updateMainCommunityCard(normalized);
      promoteCommunityToFeatured(normalized);
      const listView = document.getElementById('communitiesListView');
      if (listView && listView.style.display !== 'none') {
        loadCommunitiesList();
      }
      hideModal('editDescriptionModal');
      showSuccessMessage(result.message || 'Descripción actualizada exitosamente.');
    })
    .catch((error) => {
      showErrorMessage(error.message || 'No se pudo actualizar la descripción.');
    });
}

// ======= FUNCIONES PARA AGREGAR IMÁGENES =======

// Función para mostrar modal de agregar imagen
function showAddImageModal() {
  showModal('addImageModal');
  clearImageForm();
}

function renderPendingImages() {
  const previewContainer = document.getElementById('imagePreview');
  if (!previewContainer) {
    return;
  }

  previewContainer.innerHTML = '';

  if (!pendingGalleryImages.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'image-preview-empty';
    emptyState.textContent = 'No has seleccionado imágenes.';
    previewContainer.appendChild(emptyState);
    return;
  }

  pendingGalleryImages.forEach((item, index) => {
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
  const imageInput = document.getElementById('imageFileInput');
  if (imageInput) {
    imageInput.value = '';
  }
  pendingGalleryImages = [];
  renderPendingImages();
}

// ======= FUNCIONES PARA AGREGAR ARCHIVOS =======

// Función para mostrar modal de agregar archivo
function showAddFileModal() {
  showModal('addFileModal');
  clearFileForm();
}

function clearFileForm() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.value = '';
  }
  const descriptionInput = document.getElementById('fileDescription');
  if (descriptionInput) {
    descriptionInput.value = '';
  }
  const preview = document.getElementById('filePreview');
  if (preview) {
    preview.innerHTML = '';
  }
}

// Función para manejar la selección de archivos de imagen
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
      pendingGalleryImages.push({
        file,
        previewUrl: e.target.result,
        description: '',
      });
      renderPendingImages();
    };
    reader.readAsDataURL(file);
  });

  if (invalidFiles > 0) {
    showErrorMessage('Algunos archivos fueron descartados porque no son imágenes válidas.');
  }

  // Permitir volver a seleccionar los mismos archivos si se desea
  input.value = '';
}

// Función para manejar la selección de archivos
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById('filePreview');
  if (preview) {
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    preview.innerHTML = `
      <div class="file-preview-item">
        <div class="file-icon">${getFileIcon(extension)}</div>
        <div class="file-name">${file.name}</div>
        <button type="button" class="file-preview-remove" data-role="community-file-remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Quitar
        </button>
      </div>
    `;
  }
}

async function addImageToCommunity() {
  if (!CAN_EDIT_COMMUNITIES) {
    showErrorMessage('No tienes permisos para agregar imágenes.');
    return;
  }

  if (!currentCommunityData) {
    showErrorMessage('Debe seleccionar una comunidad.');
    return;
  }

  if (!pendingGalleryImages.length) {
    showErrorMessage('Selecciona al menos una imagen antes de continuar.');
    return;
  }

  const confirmButton = document.getElementById('confirmImageBtn');
  const originalLabel = confirmButton ? confirmButton.textContent : null;

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Guardando...';
  }

  const imagesToUpload = [...pendingGalleryImages];
  let uploadedCount = 0;

  try {
    for (const item of imagesToUpload) {
      const formData = new FormData();
      formData.append('imagen', item.file);
      formData.append('descripcion', (item.description || '').trim());

      const response = await fetch(`/api/comunidad/${currentCommunityData.id}/galeria/agregar/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo agregar la imagen');
      }

      uploadedCount += 1;
    }

    clearImageForm();
    hideModal('addImageModal');

    const successMessage = imagesToUpload.length === 1
      ? 'Imagen agregada exitosamente'
      : 'Imágenes agregadas exitosamente';

    await refreshCurrentCommunity(successMessage);
  } catch (error) {
    pendingGalleryImages = imagesToUpload.slice(uploadedCount);
    renderPendingImages();

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

function addFileToCommunity() {
  if (!CAN_EDIT_COMMUNITIES) {
    showErrorMessage('No tienes permisos para agregar archivos.');
    return;
  }

  const fileInput = document.getElementById('fileInput');
  const descriptionInput = document.getElementById('fileDescription');

  if (!currentCommunityData) {
    showErrorMessage('Debe seleccionar una comunidad.');
    return;
  }

  if (!fileInput || !fileInput.files[0]) {
    showErrorMessage('Por favor selecciona un archivo');
    return;
  }

  const file = fileInput.files[0];
  const description = descriptionInput ? descriptionInput.value.trim() : '';
  const finalName = file.name;

  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('nombre', finalName);
  formData.append('descripcion', description);

  fetch(`/api/comunidad/${currentCommunityData.id}/archivos/agregar/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken') || '',
    },
    body: formData,
  })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo agregar el archivo');
      }
      clearFileForm();
      hideModal('addFileModal');
      return refreshCurrentCommunity(result.message || 'Archivo agregado exitosamente');
    })
    .catch((error) => {
      showErrorMessage(error.message || 'No se pudo agregar el archivo');
    });
}

function showEditFileDescriptionModal(fileId, description) {
  if (!CAN_EDIT_COMMUNITIES) {
    showErrorMessage('No tienes permisos para editar archivos.');
    return;
  }

  const textarea = document.getElementById('editFileDescriptionInput');
  if (!textarea) {
    return;
  }

  currentFileEdit = {
    id: fileId,
    originalDescription: description || '',
  };
  textarea.value = description || '';
  showModal('editFileDescriptionModal');
  textarea.focus();
}

async function updateFileDescription() {
  if (!CAN_EDIT_COMMUNITIES) {
    showErrorMessage('No tienes permisos para editar archivos.');
    return;
  }

  if (!currentCommunityData || !currentFileEdit || !currentFileEdit.id) {
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
    const response = await fetch(`/api/comunidad/${currentCommunityData.id}/archivos/${currentFileEdit.id}/actualizar/`, {
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

    hideModal('editFileDescriptionModal');
    currentFileEdit = null;
    await refreshCurrentCommunity(result.message || 'Descripción actualizada correctamente.');
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

// ======= EVENT LISTENERS =======

// Event listeners para botones principales
document.addEventListener('DOMContentLoaded', function() {
  const featuredContainer = document.getElementById('featuredCommunitiesContainer');
  if (featuredContainer && FEATURED_COMMUNITIES_LIMIT === null) {
    FEATURED_COMMUNITIES_LIMIT = featuredContainer.children.length || 4;
  }

  // Verificar si hay una búsqueda pendiente desde el dropdown del nav
  if (typeof sessionStorage !== 'undefined') {
    const searchQuery = sessionStorage.getItem('communitiesSearchQuery');
    const showList = sessionStorage.getItem('showCommunitiesList');
    
    if (showList === 'true') {
      // Limpiar el flag
      sessionStorage.removeItem('showCommunitiesList');
      
      // Mostrar la vista de listado
      showCommunitiesList().then(() => {
        // Aplicar la búsqueda si existe
        if (searchQuery) {
          sessionStorage.removeItem('communitiesSearchQuery');
          
          // Esperar a que se cargue la lista
          setTimeout(() => {
            const searchInput = document.getElementById('searchCommunities');
            if (searchInput) {
              searchInput.value = searchQuery;
              searchCommunities(searchQuery);
              
              // Sincronizar con el buscador del dropdown si existe
              const dropdownSearchInput = document.getElementById('search-comunidades');
              if (dropdownSearchInput) {
                dropdownSearchInput.value = searchQuery;
              }
              
              // Sincronizar con el buscador móvil si existe
              const mobileSearchInput = document.getElementById('search-comunidades-mobile');
              if (mobileSearchInput) {
                mobileSearchInput.value = searchQuery;
              }
            }
          }, 300);
        }
      });
    }
  }

  // Botón "Ver todas las comunidades"
  const btnVerTodas = document.getElementById('btnVerTodas');
  if (btnVerTodas) {
    btnVerTodas.addEventListener('click', showCommunitiesList);
  }
  
  // Botón de regreso desde lista
  const btnBackFromList = document.getElementById('btnBackFromList');
  if (btnBackFromList) {
    btnBackFromList.addEventListener('click', showMainView);
  }
  
  // Botón de regreso desde detalle
  const btnBackFromDetail = document.getElementById('btnBackFromDetail');
  if (btnBackFromDetail) {
    btnBackFromDetail.addEventListener('click', backFromDetail);
  }
  
  // Búsqueda de comunidades
  const searchInput = document.getElementById('searchCommunities');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value;
      searchCommunities(query);
      
      // Sincronizar con el buscador del dropdown si existe
      const dropdownSearchInput = document.getElementById('search-comunidades');
      if (dropdownSearchInput) {
        dropdownSearchInput.value = query;
      }
      
      // Sincronizar con el buscador móvil si existe
      const mobileSearchInput = document.getElementById('search-comunidades-mobile');
      if (mobileSearchInput) {
        mobileSearchInput.value = query;
      }
    });
  }

  // El buscador del dropdown está manejado completamente en navigation.js
  // No necesitamos código adicional aquí para evitar conflictos
  
  // Ordenamiento de comunidades
  const sortSelect = document.getElementById('sortCommunities');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      sortCommunities(this.value);
    });
  }
  
  // Botones de editar datos
  const editDataBtn = document.getElementById('editDataBtn');
  if (editDataBtn) {
    editDataBtn.addEventListener('click', showEditDataModal);
  }
  const confirmDataBtn = document.getElementById('confirmDataBtn');
  if (confirmDataBtn) {
    confirmDataBtn.addEventListener('click', updateCommunityData);
  }
  
  // Botón de editar descripción
  const editDescriptionBtn = document.getElementById('editDescriptionBtn');
  if (editDescriptionBtn) {
    editDescriptionBtn.addEventListener('click', showEditDescriptionModal);
  }
  
  // Event listeners para credenciales (ya no se usan)
  // const verifyCredentialsBtn = document.getElementById('verifyCredentialsBtn');
  // if (verifyCredentialsBtn) {
  //   verifyCredentialsBtn.addEventListener('click', verifyCredentials);
  // }
  
  // const cancelCredentialsBtn = document.getElementById('cancelCredentialsBtn');
  // if (cancelCredentialsBtn) {
  //   cancelCredentialsBtn.addEventListener('click', () => {
  //     pendingAction = null;
  //     hideModal('adminCredentialsModal');
  //   });
  // }
  
  // const closeCredentialsModal = document.getElementById('closeCredentialsModal');
  // if (closeCredentialsModal) {
  //   closeCredentialsModal.addEventListener('click', () => {
  //     pendingAction = null;
  //     hideModal('adminCredentialsModal');
  //   });
  // }
  
  // Event listeners para editar datos
  const cancelDataBtn = document.getElementById('cancelDataBtn');
  if (cancelDataBtn) {
    cancelDataBtn.addEventListener('click', () => hideModal('editDataModal'));
  }
  
  const closeDataModal = document.getElementById('closeDataModal');
  if (closeDataModal) {
    closeDataModal.addEventListener('click', () => hideModal('editDataModal'));
  }
  
  // Event listeners para editar descripción
  const confirmDescriptionBtn = document.getElementById('confirmDescriptionBtn');
  if (confirmDescriptionBtn) {
    confirmDescriptionBtn.addEventListener('click', updateCommunityDescription);
  }
  
  const cancelDescriptionBtn = document.getElementById('cancelDescriptionBtn');
  if (cancelDescriptionBtn) {
    cancelDescriptionBtn.addEventListener('click', () => hideModal('editDescriptionModal'));
  }
  
  const closeDescriptionModal = document.getElementById('closeDescriptionModal');
  if (closeDescriptionModal) {
    closeDescriptionModal.addEventListener('click', () => hideModal('editDescriptionModal'));
  }
  
  // Botón de agregar imagen
  const addImageBtn = document.getElementById('addImageBtn');
  if (addImageBtn) {
    addImageBtn.addEventListener('click', showAddImageModal);
  }
  
  // Botón de agregar archivo
  const addFileBtn = document.getElementById('addFileBtn');
  if (addFileBtn) {
    addFileBtn.addEventListener('click', showAddFileModal);
  }
  
  // Input de archivo de imagen
  const imageFileInput = document.getElementById('imageFileInput');
  if (imageFileInput) {
    imageFileInput.addEventListener('change', handleImageFileSelect);
  }
  
  // Input de archivo
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }
  
  // Botones del modal de imagen
  const cancelImageBtn = document.getElementById('cancelImageBtn');
  const confirmImageBtn = document.getElementById('confirmImageBtn');
  const closeImageModal = document.getElementById('closeImageModal');
  
  if (cancelImageBtn) {
    cancelImageBtn.addEventListener('click', function() {
      hideModal('addImageModal');
      clearImageForm();
    });
  }
  
  if (confirmImageBtn) {
    confirmImageBtn.addEventListener('click', addImageToCommunity);
  }
  
  if (closeImageModal) {
    closeImageModal.addEventListener('click', function() {
      hideModal('addImageModal');
      clearImageForm();
    });
  }

  const imageViewerModal = document.getElementById('communityImageViewerModal');
  const closeImageViewerBtn = document.getElementById('closeCommunityImageViewer');
  if (closeImageViewerBtn) {
    closeImageViewerBtn.addEventListener('click', () => hideModal('communityImageViewerModal'));
  }
  if (imageViewerModal) {
    imageViewerModal.addEventListener('click', (event) => {
      if (event.target === imageViewerModal) {
        hideModal('communityImageViewerModal');
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && imageViewerModal.classList.contains('active')) {
        hideModal('communityImageViewerModal');
      }
    });
  }

  // Botones del modal de archivo
  const cancelFileBtn = document.getElementById('cancelFileBtn');
  const confirmFileBtn = document.getElementById('confirmFileBtn');
  const closeFileModal = document.getElementById('closeFileModal');
  
  if (cancelFileBtn) {
    cancelFileBtn.addEventListener('click', function() {
      hideModal('addFileModal');
      clearFileForm();
    });
  }
  
  if (confirmFileBtn) {
    confirmFileBtn.addEventListener('click', addFileToCommunity);
  }
  
  if (closeFileModal) {
    closeFileModal.addEventListener('click', function() {
      hideModal('addFileModal');
      clearFileForm();
    });
  }

  const confirmFileDescriptionBtn = document.getElementById('confirmFileDescriptionBtn');
  if (confirmFileDescriptionBtn) {
    confirmFileDescriptionBtn.addEventListener('click', updateFileDescription);
  }

  const cancelFileDescriptionBtn = document.getElementById('cancelFileDescriptionBtn');
  if (cancelFileDescriptionBtn) {
    cancelFileDescriptionBtn.addEventListener('click', () => {
      hideModal('editFileDescriptionModal');
      currentFileEdit = null;
    });
  }

  const closeFileDescriptionModal = document.getElementById('closeFileDescriptionModal');
  if (closeFileDescriptionModal) {
    closeFileDescriptionModal.addEventListener('click', () => {
      hideModal('editFileDescriptionModal');
      currentFileEdit = null;
    });
  }
});

function setupEditDataFormConstraints() {
  const populationInput = document.getElementById('editPopulation');
  if (populationInput) {
    populationInput.addEventListener('input', () => {
      const digitsOnly = populationInput.value.replace(/\D+/g, '');
      populationInput.value = digitsOnly;
    });
  }

  const cocodeInput = document.getElementById('editCocode');
  if (cocodeInput) {
    cocodeInput.addEventListener('input', () => {
      let sanitized = cocodeInput.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\s-]+/g, '');
      sanitized = sanitized.replace(/\s+/g, ' ');
      if (sanitized.length > 100) {
        sanitized = sanitized.slice(0, 100);
      }
      cocodeInput.value = sanitized;
    });
  }

  const phoneInput = document.getElementById('editCocodePhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      let digits = phoneInput.value.replace(/\D+/g, '');
      if (digits.length > 8) {
        digits = digits.slice(0, 8);
      }
      phoneInput.value = digits;
    });
  }

  const coordinatesInput = document.getElementById('editCoordinates');
  if (coordinatesInput) {
    coordinatesInput.addEventListener('input', () => {
      let value = coordinatesInput.value.replace(/[^0-9,\.\-\s]/g, '');
      const firstComma = value.indexOf(',');
      if (firstComma !== -1) {
        const before = value.slice(0, firstComma + 1);
        const after = value
          .slice(firstComma + 1)
          .replace(/,/g, '');
        value = `${before}${after}`;
      }
      value = value.replace(/\s+/g, ' ');
      coordinatesInput.value = value;
    });
  }
}

// Función para manejar clic en botones de comunidad
function handleCommunityButtonClick(e) {
  const button = e.target.closest('.community-card__btn, .community-list-item__btn');
  if (!button) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  // Prevenir múltiples clics mientras se está cargando
  if (isDetailLoading) {
    return;
  }
  
  const communityId = button.getAttribute('data-community-id');
  if (communityId) {
    showCommunityDetail(communityId);
  }
}

// Función para agregar event listeners a los botones "Ver más"
function addCommunityViewMoreListeners() {
  // Usar delegación de eventos en el documento para capturar todos los clics
  // Esto evita problemas con elementos dinámicos y múltiples listeners
  
  // Delegación de eventos en el contenedor principal (solo una vez)
  const mainContainer = document.querySelector('.communities-main');
  const listContainer = document.getElementById('communitiesList');
  
  if (mainContainer && !mainContainer.dataset.listenerAdded) {
    mainContainer.addEventListener('click', handleCommunityButtonClick);
    mainContainer.dataset.listenerAdded = 'true';
  }
  
  if (listContainer && !listContainer.dataset.listenerAdded) {
    listContainer.addEventListener('click', handleCommunityButtonClick);
    listContainer.dataset.listenerAdded = 'true';
  }
  
  // También agregar listeners directos para compatibilidad
  const viewMoreButtons = document.querySelectorAll('.community-card__btn');
  viewMoreButtons.forEach(button => {
    if (!button.dataset.listenerAdded) {
      button.dataset.listenerAdded = 'true';
      button.addEventListener('click', handleCommunityButtonClick);
    }
  });
  
  const listViewMoreButtons = document.querySelectorAll('.community-list-item__btn');
  listViewMoreButtons.forEach(button => {
    if (!button.dataset.listenerAdded) {
      button.dataset.listenerAdded = 'true';
      button.addEventListener('click', handleCommunityButtonClick);
    }
  });
}

// Agregar event listeners cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
  setupEditDataFormConstraints();
  addCommunityViewMoreListeners();

  // Verificar si hay una comunidad pendiente para mostrar
  if (pendingCommunityDetailId) {
    const targetId = pendingCommunityDetailId;
    pendingCommunityDetailId = null;
    setTimeout(() => {
      showCommunityDetail(targetId);
    }, 120);
  }
});

// Cerrar modales al hacer clic fuera de ellos
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
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
function executeDeleteAction() {
  if (pendingDeleteAction) {
    pendingDeleteAction();
    hideModal('confirmDeleteModal');
    pendingDeleteAction = null;
  }
}

// Función para eliminar imagen de la galería
function removeImageFromCommunity(imageIndex) {
  if (!currentCommunityData || !Array.isArray(currentCommunityData.photos)) return;
  const targetPhoto = currentCommunityData.photos[imageIndex];
  if (!targetPhoto || !targetPhoto.id) {
    showErrorMessage('No se pudo identificar la imagen a eliminar.');
    return;
  }

  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar esta imagen de la galería?',
    () => {
      fetch(`/api/comunidad/${currentCommunityData.id}/galeria/${targetPhoto.id}/eliminar/`, {
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
          hideModal('confirmDeleteModal');
          await refreshCurrentCommunity(result.message || 'Imagen eliminada exitosamente');
        })
        .catch((error) => {
          showErrorMessage(error.message || 'No se pudo eliminar la imagen');
        });
    }
  );
}

// Función para eliminar archivo
function removeFileFromCommunity(fileId) {
  if (!currentCommunityData || !fileId) return;

  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar este archivo?',
    () => {
      fetch(`/api/comunidad/${currentCommunityData.id}/archivos/${fileId}/eliminar/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'No se pudo eliminar el archivo');
          }
          hideModal('confirmDeleteModal');
          return refreshCurrentCommunity(result.message || 'Archivo eliminado correctamente');
        })
        .catch((error) => {
          showErrorMessage(error.message || 'No se pudo eliminar el archivo');
        });
    }
  );
}

// Función para obtener la comunidad actual
function getCurrentCommunity() {
  return currentCommunityData;
}

// Función para mostrar mensaje de éxito
function showSuccessMessage(message) {
  // Crear notificación de éxito
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Función para cargar galería con botones de eliminación
function loadGalleryWithDeleteButtons(photos) {
  const container = document.getElementById('detailGallery');
  if (!container) return;

  container.innerHTML = '';
  
  photos.forEach((photo, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'gallery-item';
    const photoUrl = photo.url || '';
    const encodedUrl = encodeURI(photoUrl);
    const description = photo.description || 'Imagen de la comunidad';
    const controls = CAN_EDIT_COMMUNITIES ? `
      <button class="btn-remove-item" data-image-index="${index}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    ` : '';
    imageItem.innerHTML = `
      <img src="${encodedUrl}" alt="${escapeHtml(description)}" data-photo-index="${index}" loading="lazy">
      <div class="image-description">${escapeHtml(description)}</div>
      ${controls}
    `;
    const img = imageItem.querySelector('img');
    if (img) {
      // Manejar errores de carga de imagen sin interrumpir el flujo
      img.addEventListener('error', function() {
        // Usar una imagen por defecto o ocultar la imagen
        this.style.display = 'none';
        // Opcional: mostrar un placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.textContent = 'Imagen no disponible';
        placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; min-height: 200px; background: #f0f0f0; color: #666;';
        this.parentNode.insertBefore(placeholder, this);
      });
      img.addEventListener('click', () => openImageModal(photoUrl, description));
    }
    container.appendChild(imageItem);
  });
}

// Función para cargar archivos (sin botones X)
function loadFilesWithDeleteButtons(files) {
  const container = document.getElementById('detailFiles');
  if (!container) return;

  container.innerHTML = '';

  if (!files || !files.length) {
    container.innerHTML = `
      <div class="file-item">
        <div class="file-info">
          <p style="color: var(--text-muted); text-align: center; margin: 20px 0;">No hay archivos disponibles para esta comunidad.</p>
        </div>
      </div>
    `;
    return;
  }

  files.forEach((file) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    const fileType = (file.type || '').toLowerCase();
    const fileDate = file.date ? formatDate(file.date) : 'Fecha no disponible';
    const description = file.description ? escapeHtml(file.description) : '';
    const fileName = escapeHtml(file.name || 'Archivo sin nombre');
    const fileTypeLabel = fileType ? ` • ${fileType.toUpperCase()}` : '';
    const fileDateText = fileDate === 'Fecha no disponible'
      ? fileDate
      : `Agregado el ${fileDate}${fileTypeLabel}`;
    const safeDescriptionAttr = file.description
      ? escapeHtml(file.description).replace(/"/g, '&quot;')
      : '';

    const actions = USER_AUTH.isAuthenticated
      ? `
        <div class="file-actions">
          <a href="${file.url}" class="file-download-btn" download>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar
          </a>
          ${CAN_EDIT_COMMUNITIES ? `
            <button class="file-edit-btn" data-file-id="${file.id}" data-file-description="${safeDescriptionAttr}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </button>
            <button class="file-delete-btn" data-file-id="${file.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Eliminar
            </button>
          ` : ''}
        </div>
      `
      : '';

    fileItem.innerHTML = `
      <div class="file-icon">${getFileIcon(fileType)}</div>
      <div class="file-info">
        <h4>${fileName}</h4>
        ${description ? `<p>${description}</p>` : ''}
        <div class="file-date">${fileDateText}</div>
      </div>
      ${actions}
    `;
    container.appendChild(fileItem);
  });
}

// Event listeners para botones de eliminación (solo imágenes)
document.addEventListener('click', function(e) {
  const removeImageButton = e.target.closest('.btn-remove-item');
  if (removeImageButton && removeImageButton.hasAttribute('data-image-index')) {
    const imageIndex = parseInt(removeImageButton.getAttribute('data-image-index'), 10);
    if (!Number.isNaN(imageIndex)) {
      removeImageFromCommunity(imageIndex);
    }
    return;
  }

  const pendingImageRemoveButton = e.target.closest('.image-preview-remove');
  if (pendingImageRemoveButton && pendingImageRemoveButton.hasAttribute('data-index')) {
    const pendingIndex = parseInt(pendingImageRemoveButton.getAttribute('data-index'), 10);
    if (!Number.isNaN(pendingIndex)) {
      pendingGalleryImages.splice(pendingIndex, 1);
      renderPendingImages();
    }
    return;
  }

  const removeFileButton = e.target.closest('.file-delete-btn');
  if (removeFileButton && removeFileButton.dataset.fileId) {
    removeFileFromCommunity(removeFileButton.dataset.fileId);
    return;
  }

  const editFileButton = e.target.closest('.file-edit-btn');
  if (editFileButton && editFileButton.dataset.fileId) {
    const description = editFileButton.dataset.fileDescription || '';
    showEditFileDescriptionModal(
      editFileButton.dataset.fileId,
      description ? decodeHTMLEntities(description) : ''
    );
    return;
  }

  const filePreviewRemoveButton = e.target.closest('.file-preview-remove[data-role="community-file-remove"]');
  if (filePreviewRemoveButton) {
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
  if (Number.isNaN(index) || !pendingGalleryImages[index]) {
    return;
  }

  pendingGalleryImages[index].description = descriptionInput.value;
});

function decodeHTMLEntities(html) {
  if (!html) {
    return '';
  }
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Event listeners para modales de confirmación
document.addEventListener('DOMContentLoaded', function() {
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
});

function updateMainCommunityCard(community) {
  if (!community || !community.id) return;

  const buttons = document.querySelectorAll(`.community-card__btn[data-community-id="${community.id}"]`);
  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    const card = button.closest('.community-card');
    if (!card) return;

    const titleEl = card.querySelector('.community-card__title');
    if (titleEl) {
      titleEl.textContent = community.name;
    }

    const regionEl = card.querySelector('.community-card__region');
    if (regionEl) {
      regionEl.textContent = community.regionName || 'Sin región asignada';
    }

    const imgEl = card.querySelector('img');
    if (imgEl) {
      const newSrc = community.coverImage || community.image || DEFAULT_COMMUNITY_IMAGE_SMALL;
      if (newSrc) {
        imgEl.src = newSrc;
      }
      imgEl.alt = community.name;
    }
  });
}

function promoteCommunityToFeatured(community) {
  if (!community || !community.id) return;
  const container = document.getElementById('featuredCommunitiesContainer');
  if (!container) return;

  const existingButton = container.querySelector(`.community-card__btn[data-community-id="${community.id}"]`);
  let cardElement = existingButton ? existingButton.closest('.community-card') : null;

  if (!cardElement) {
    cardElement = document.createElement('div');
    cardElement.className = 'community-card featured-card';
    const imageUrl = community.coverImage || community.image || DEFAULT_COMMUNITY_IMAGE_LARGE;
    const regionName = community.regionName || community.region || 'Sin región asignada';
    cardElement.innerHTML = `
      <div class="community-card__image">
        <img src="${imageUrl}" alt="${escapeHtml(community.name)}" loading="eager">
        <div class="community-card__overlay">
          <div class="community-card__info">
            <h3 class="community-card__title">${escapeHtml(community.name)}</h3>
            <p class="community-card__region">${escapeHtml(regionName)}</p>
          </div>
          <button class="community-card__btn" data-community-id="${community.id}">Ver más</button>
        </div>
      </div>
    `;
    const button = cardElement.querySelector('.community-card__btn');
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const communityId = button.getAttribute('data-community-id');
        if (communityId) {
          showCommunityDetail(communityId);
        }
      });
    }
  }

  container.prepend(cardElement);

  if (FEATURED_COMMUNITIES_LIMIT && container.children.length > FEATURED_COMMUNITIES_LIMIT) {
    while (container.children.length > FEATURED_COMMUNITIES_LIMIT) {
      container.removeChild(container.lastElementChild);
    }
  }
}
