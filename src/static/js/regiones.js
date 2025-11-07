// ======= DATOS DE REGIONES - CARGA DESDE BD =======
console.log('📦 Regiones.js - Cargando datos desde la base de datos');

// ======= VARIABLES GLOBALES =======
let regionsData = {}; // Se llenará dinámicamente desde la API
let currentRegionData = null;
let currentRegionId = null;
let allRegions = []; // Todas las regiones para la lista completa

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
    console.log('🔄 No hay regiones cargadas, cargando desde API...');
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
      description: regionData.descripcion ? `<p>${regionData.descripcion}</p>` : '',
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
    console.error('❌ Error al cargar detalle de región:', error);
    
    // Remover el overlay de carga en caso de error
    const loadingOverlay = detailContent?.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
    
    showErrorMessage('Error al cargar el detalle de la región. Por favor, intenta de nuevo.');
    backToMain();
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
  console.log('🔄 Iniciando carga de regiones desde API (actualización dinámica)...');
  try {
    const response = await fetch('/api/regiones/');
    console.log('📡 Respuesta recibida:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const regiones = await response.json();
    console.log('✅ Regiones recibidas:', regiones.length, regiones);
    
    if (!regiones || regiones.length === 0) {
      console.warn('⚠️ No se encontraron regiones en la base de datos');
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
        num_comunidades: region.num_comunidades || 0
      };
    });
    
    // Guardar todas las regiones en allRegions (mantener formato de API)
    allRegions = regiones;
    console.log('📊 Total de regiones procesadas:', allRegions.length);
    console.log('📋 Primeras 3 regiones:', allRegions.slice(0, 3));
    
    // Actualizar la lista completa solo si estamos en la vista de lista
    const listView = document.getElementById('regionsListView');
    if (listView && listView.style.display !== 'none') {
      console.log('🔄 Actualizando lista de regiones...');
      loadRegionsList();
    }
    
    console.log('✅ Regiones cargadas exitosamente:', Object.keys(regionsData).length);
  } catch (error) {
    console.error('❌ Error al cargar regiones:', error);
    console.error('Detalles del error:', error.message, error.stack);
    // No mostrar error si las regiones ya están cargadas desde el template
  }
}

async function loadFeaturedRegions() {
  console.log('🔄 Cargando últimas regiones...');
  try {
    const response = await fetch('/api/regiones/recientes/?limite=2');
    console.log('📡 Respuesta últimas regiones:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const regiones = await response.json();
    console.log('✅ Últimas regiones recibidas:', regiones.length, regiones);
    
    const container = document.getElementById('featuredRegionsContainer');
    if (!container) {
      console.error('❌ No se encontró el contenedor featuredRegionsContainer');
      return;
    }
    
    container.innerHTML = '';
    
    if (regiones.length === 0) {
      console.warn('⚠️ No hay regiones recientes');
      container.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">No hay regiones recientes disponibles</p>';
      return;
    }
    
    regiones.forEach((region, index) => {
      console.log(`📦 Creando tarjeta ${index + 1} para región:`, region.nombre);
      const card = createRegionCard(region, true); // true = featured card
      container.appendChild(card);
    });
    
    console.log('✅ Últimas regiones cargadas:', regiones.length);
  } catch (error) {
    console.error('❌ Error al cargar últimas regiones:', error);
    const container = document.getElementById('featuredRegionsContainer');
    if (container) {
      container.innerHTML = '<p style="color: var(--text-danger); padding: 20px; text-align: center;">Error al cargar últimas regiones</p>';
    }
  }
}

function loadRegionsGrid() {
  console.log('🔄 Cargando grid de regiones...');
  const grid = document.getElementById('regionsGrid');
  if (!grid) {
    console.error('❌ No se encontró el contenedor regionsGrid');
    return;
  }
  
  grid.innerHTML = '';
  
  if (!allRegions || allRegions.length === 0) {
    console.warn('⚠️ No hay regiones para mostrar en el grid');
    grid.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">No hay regiones disponibles</p>';
    return;
  }
  
  // Excluir las regiones que ya están en "Últimas Regiones"
  const featuredIds = new Set();
  document.querySelectorAll('#featuredRegionsContainer [data-region-id]').forEach(el => {
    const id = el.getAttribute('data-region-id');
    if (id) featuredIds.add(id);
  });
  
  console.log('📋 Regiones destacadas (excluidas del grid):', Array.from(featuredIds));
  
  // Cargar todas las demás regiones
  let regionesAgregadas = 0;
  allRegions.forEach((region, index) => {
    if (!featuredIds.has(region.id)) {
      console.log(`📦 Creando tarjeta ${index + 1} para región:`, region.nombre);
      const card = createRegionCard(region, false); // false = normal card
      grid.appendChild(card);
      regionesAgregadas++;
    }
  });
  
  console.log(`✅ Grid de regiones cargado: ${regionesAgregadas} regiones agregadas`);
  
  if (regionesAgregadas === 0) {
    grid.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">Todas las regiones están en la sección de últimas regiones</p>';
  }
}

function createRegionCard(region, isFeatured = false) {
  console.log('🎨 Creando tarjeta para región:', region.nombre, 'Featured:', isFeatured);
  
  const card = document.createElement('div');
  card.className = `region-card ${isFeatured ? 'featured-card' : ''}`;
  
  // El título grande muestra la comunidad_sede, el código pequeño muestra el nombre de la región
  const tituloGrande = region.comunidad_sede || region.nombre || 'Sin comunidad sede';
  const codigoPequeño = region.nombre || region.codigo || 'Sin nombre';
  
  const imagenUrl = region.imagen_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  
  console.log('📝 Datos de la tarjeta:', {
    tituloGrande,
    codigoPequeño,
    imagenUrl,
    regionId: region.id
  });
  
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
    console.warn('⚠️ No se encontró el contenedor regionsList');
    return;
  }
  
  console.log('🔄 Cargando lista de regiones, total:', allRegions.length);
  
  regionsList.innerHTML = '';
  
  if (!allRegions || allRegions.length === 0) {
    console.warn('⚠️ No hay regiones para mostrar en la lista');
    regionsList.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">No hay regiones disponibles</p>';
    return;
  }
  
  allRegions.forEach((region, index) => {
    console.log(`📦 Creando item ${index + 1} para región:`, region.nombre);
    const regionItem = createRegionListItem(region);
    regionsList.appendChild(regionItem);
  });
  
  console.log(`✅ Lista de regiones cargada: ${allRegions.length} regiones`);
}

function createRegionListItem(region) {
  const regionItem = document.createElement('div');
  regionItem.className = 'region-list-item';
  
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
    console.error('❌ No se encontró el elemento detail-content');
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
  
  // Galería de imágenes con botones de eliminación
  if (region.photos && region.photos.length > 0) {
    loadGalleryWithDeleteButtons(region.photos);
  } else {
    const gallery = document.getElementById('detailGallery');
    if (gallery) {
      gallery.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">No hay imágenes disponibles</p>';
    }
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
  
  // Archivos con botones de eliminación
  if (region.files && region.files.length > 0) {
    loadFilesWithDeleteButtons(region.files);
  } else {
    const filesContainer = document.getElementById('detailFiles');
    if (filesContainer) {
      filesContainer.innerHTML = '<p class="no-files">No hay archivos disponibles</p>';
    }
  }
}

function loadGallery(photos) {
  const gallery = document.getElementById('detailGallery');
  if (!gallery) return;
  
  gallery.innerHTML = '';
  
  photos.forEach(photo => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.innerHTML = `
      <img src="${photo.url}" alt="${photo.description}" loading="lazy">
    `;
    gallery.appendChild(galleryItem);
  });
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
    console.warn('⚠️ No se encontró el elemento regionMapImage');
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
      console.warn('⚠️ No se pudo obtener el número de la región para cargar el mapa');
      regionMapImage.src = fallbackImage;
      regionMapImage.alt = 'Mapa no disponible';
      regionMapImage.style.display = 'block';
      return;
    }

    const pngPath = `/static/img/regiones%20mapa/region${regionNumber}.png`;
    console.log('🗺️ Cargando mapa PNG:', pngPath, '(región:', regionName || regionNumber, ')');

    regionMapImage.style.display = 'block';
    regionMapImage.src = pngPath;
    regionMapImage.alt = `Mapa de la región ${regionName || regionNumber}`;

    regionMapImage.onload = () => {
      console.log('✅ Mapa PNG cargado exitosamente:', pngPath);
      regionMapImage.style.display = 'block';
    };

    regionMapImage.onerror = () => {
      console.warn(`⚠️ No se pudo cargar el mapa PNG para la región ${regionNumber} (ruta: ${pngPath}). Usando imagen de respaldo.`);
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

  console.warn('⚠️ No se encontró información suficiente para mostrar el mapa de la región', regionId);
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

function loadFiles(files) {
  const filesContainer = document.getElementById('detailFiles');
  if (!filesContainer) return;
  
  filesContainer.innerHTML = '';
  if (files && files.length > 0) {
    files.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      // Calcular tamaño si no está disponible
      const fileSize = file.size || 'N/A';
      const fileDate = file.date ? formatDate(file.date) : 'Fecha no disponible';
      
      fileItem.innerHTML = `
        <div class="file-icon">${getFileIcon(file.type)}</div>
        <div class="file-info">
          <h4>${file.name}</h4>
          <p>${file.description || ''}</p>
          <div class="file-date">Agregado el ${fileDate}${fileSize !== 'N/A' ? ` • ${fileSize}` : ''}</div>
        </div>
        <div class="file-actions">
          <a href="${file.url}" class="file-download-btn" download>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar
          </a>
        </div>
      `;
      filesContainer.appendChild(fileItem);
    });
  } else {
    filesContainer.innerHTML = `
      <div class="file-item">
        <div class="file-info">
          <p style="color: var(--text-muted); text-align: center; margin: 20px 0;">No hay archivos disponibles para esta región.</p>
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

// Función para formatear fechas
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

// ======= FUNCIONES PARA AGREGAR ARCHIVOS =======

// Función para mostrar modal de agregar archivo
function showAddFileModal() {
  showModal('addFileModal');
  clearFileForm();
}

function clearFileForm() {
  document.getElementById('fileInput').value = '';
  document.getElementById('fileName').value = '';
  document.getElementById('fileDescription').value = '';
  document.getElementById('filePreview').innerHTML = '';
}

// Función para manejar la selección de archivos
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const preview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  
  // Auto-completar el nombre del archivo
  if (!fileName.value) {
    fileName.value = file.name.replace(/\.[^/.]+$/, ""); // Remover extensión
  }
  
  preview.innerHTML = `
    <div class="file-preview-item">
      <div class="file-icon">${getFileIcon(file.name.split('.').pop())}</div>
      <div class="file-name">${file.name}</div>
    </div>
  `;
}

// Función para agregar archivo a la región
function addFileToRegion() {
  const fileInput = document.getElementById('fileInput');
  const fileName = document.getElementById('fileName').value;
  const description = document.getElementById('fileDescription').value;
  
  if (!fileInput.files[0]) {
    showErrorMessage('Por favor selecciona un archivo');
    return;
  }
  
  if (!fileName.trim()) {
    showErrorMessage('Por favor ingresa un nombre para el archivo');
    return;
  }
  
  const file = fileInput.files[0];
  const fileType = file.name.split('.').pop().toLowerCase();
  const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  const currentDate = new Date().toISOString().split('T')[0];
  
  if (currentRegionData) {
    if (!currentRegionData.files) {
      currentRegionData.files = [];
    }
    
    currentRegionData.files.push({
      name: fileName,
      description: description || 'Archivo de la región',
      type: fileType,
      size: fileSize,
      date: currentDate,
      url: '#' // En una implementación real, aquí se subiría el archivo
    });
    
    loadRegionDetail(currentRegionData);
    showSuccessMessage('Archivo agregado exitosamente');
    hideModal('addFileModal');
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
    console.warn('⚠️ No hay elementos de región para ordenar');
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
        // Ordenar por fecha de actualización (si está disponible)
        // Por ahora, mantener el orden original
        return 0;
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
  
  console.log(`✅ Regiones ordenadas por: ${sortBy}`);
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

function clearImageForm() {
  document.getElementById('imageFileInput').value = '';
  document.getElementById('imageDescription').value = '';
  document.getElementById('imagePreview').innerHTML = '';
}

function handleImageFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `
      <div class="image-preview-item">
        <img src="${e.target.result}" alt="Preview">
        <div class="image-description">Vista previa</div>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

async function addImageToRegion() {
  const fileInput = document.getElementById('imageFileInput');
  const description = document.getElementById('imageDescription').value;
  
  if (!fileInput.files[0]) {
    showErrorMessage('Por favor selecciona una imagen');
    return;
  }
  
  if (!currentRegionId) {
    showErrorMessage('No hay región seleccionada');
    return;
  }
  
  const file = fileInput.files[0];
  
  // Validar que sea una imagen
  if (!file.type || !file.type.startsWith('image/')) {
    showErrorMessage('El archivo debe ser una imagen (JPG, PNG, GIF, etc.)');
    return;
  }
  
  try {
    // Crear FormData para enviar la imagen
    const formData = new FormData();
    formData.append('imagen', file);
    if (description) {
      formData.append('descripcion', description);
    }
    
    // Obtener token CSRF
    const csrfToken = getCookie('csrftoken');
    if (!csrfToken) {
      console.error('❌ No se encontró el token CSRF');
      showErrorMessage('Error de autenticación. Por favor, recarga la página.');
      return;
    }
    
    console.log('📤 Enviando imagen al servidor...');
    console.log('📋 ID de la región:', currentRegionId);
    console.log('📎 Nombre del archivo:', file.name);
    
    // Llamar a la API
    const response = await fetch(`/api/region/${currentRegionId}/galeria/agregar/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken
      },
      body: formData
    });
    
    console.log('📥 Respuesta recibida:', response.status, response.statusText);
    
    // Verificar si la respuesta es JSON válido
    const contentType = response.headers.get('content-type');
    let result;
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Respuesta no es JSON:', text.substring(0, 500));
      showErrorMessage('Error del servidor. Por favor, intenta de nuevo.');
      return;
    }
    
    // Parsear JSON
    try {
      result = await response.json();
    } catch (e) {
      console.error('❌ Error al parsear JSON:', e);
      showErrorMessage('Error al procesar la respuesta del servidor.');
      return;
    }
    
    if (!response.ok || !result.success) {
      const errorMsg = result.error || 'Error al agregar la imagen';
      console.error('❌ Error:', errorMsg);
      showErrorMessage(errorMsg);
      return;
    }
    
    console.log('✅ Imagen agregada exitosamente:', result.imagen);
    
    // Agregar la imagen a la lista local
    if (currentRegionData && currentRegionData.photos) {
      currentRegionData.photos.push({
        id: result.imagen.id,
        url: result.imagen.url,
        description: result.imagen.descripcion || 'Imagen de la región'
      });
      
      // Recargar la galería
      loadGalleryWithDeleteButtons(currentRegionData.photos);
    } else {
      // Recargar el detalle completo desde la API
      await showRegionDetail(currentRegionId);
    }
    
    showSuccessMessage(result.message || 'Imagen agregada exitosamente');
    hideModal('addImageModal');
    clearImageForm();
    
    // Recargar la lista de regiones para actualizar la portada
    await loadRegionsFromAPI();
    
  } catch (error) {
    console.error('❌ Error al agregar imagen:', error);
    showErrorMessage('Error al agregar la imagen. Por favor, intenta de nuevo.');
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
    document.getElementById('editDescriptionText').value = currentRegionData.description.replace(/<[^>]*>/g, '');
    showModal('editDescriptionModal');
  }
}

function updateRegionDescription() {
  const newDescription = document.getElementById('editDescriptionText').value;
  
  if (!newDescription.trim()) {
    showErrorMessage('Por favor ingresa una descripción');
    return;
  }
  
  if (currentRegionData) {
    currentRegionData.description = `<p>${newDescription}</p>`;
    document.getElementById('detailDescription').innerHTML = currentRegionData.description;
    showSuccessMessage('Descripción actualizada exitosamente');
    hideModal('editDescriptionModal');
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
  console.log('🚀 DOM cargado, iniciando carga de regiones...');
  
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
        console.log('🔍 Click en región:', regionId);
        showRegionDetail(regionId);
      }
    }
    
    if (e.target.classList.contains('region-list-item__btn') || e.target.closest('.region-list-item__btn')) {
      const btn = e.target.classList.contains('region-list-item__btn') ? e.target : e.target.closest('.region-list-item__btn');
      const regionId = btn.getAttribute('data-region-id');
      if (regionId) {
        console.log('🔍 Click en región de lista:', regionId);
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
  
  // Event listeners para modales de confirmación
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const closeConfirmModal = document.getElementById('closeConfirmModal');
  const removeFileBtn = document.getElementById('removeFileBtn');

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

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', function() {
      showFileSelectionModal();
    });
  }
  
  // Event listeners para modal de selección de archivos
  const closeFileSelectionModal = document.getElementById('closeFileSelectionModal');
  const cancelFileSelectionBtn = document.getElementById('cancelFileSelectionBtn');
  const confirmFileSelectionBtn = document.getElementById('confirmFileSelectionBtn');

  if (closeFileSelectionModal) {
    closeFileSelectionModal.addEventListener('click', function() {
      hideModal('fileSelectionModal');
    });
  }

  if (cancelFileSelectionBtn) {
    cancelFileSelectionBtn.addEventListener('click', function() {
      hideModal('fileSelectionModal');
    });
  }

  if (confirmFileSelectionBtn) {
    confirmFileSelectionBtn.addEventListener('click', function() {
      const checkboxes = document.querySelectorAll('#fileSelectionModal .file-checkbox:checked');
      const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.value));
      
      if (selectedIndices.length === 0) {
        showSuccessMessage('Selecciona al menos un archivo para eliminar');
        return;
      }
      
      showConfirmDeleteModal(
        `¿Estás seguro de que deseas eliminar ${selectedIndices.length} archivo(s) seleccionado(s)?`,
        () => {
          const currentRegion = getCurrentRegion();
          if (currentRegion && currentRegion.files) {
            // Eliminar archivos en orden descendente para mantener los índices correctos
            selectedIndices.sort((a, b) => b - a).forEach(index => {
              currentRegion.files.splice(index, 1);
            });
            loadRegionDetail(currentRegion);
            hideModal('fileSelectionModal');
            showSuccessMessage(`${selectedIndices.length} archivo(s) eliminado(s) exitosamente`);
          }
        }
      );
    });
  }
  
  // Cargar regiones desde la API al iniciar (para tener datos disponibles en JS)
  console.log('🔄 Ejecutando loadRegionsFromAPI()...');
  loadRegionsFromAPI();
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
function removeImageFromRegion(imageIndex) {
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar esta imagen de la galería?',
    () => {
      const currentRegion = getCurrentRegion();
      if (currentRegion && currentRegion.photos) {
        currentRegion.photos.splice(imageIndex, 1);
        loadRegionDetail(currentRegion);
        showSuccessMessage('Imagen eliminada exitosamente');
      }
    }
  );
}

// Función para eliminar archivo
function removeFileFromRegion(fileId) {
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar este archivo?',
    () => {
      const currentRegion = getCurrentRegion();
      if (currentRegion && currentRegion.files) {
        currentRegion.files = currentRegion.files.filter(file => file.id !== fileId);
        loadRegionDetail(currentRegion);
        showSuccessMessage('Archivo eliminado exitosamente');
      }
    }
  );
}

// Función para obtener la región actual
function getCurrentRegion() {
  // Retornar la región actualmente mostrada
  return currentRegionData;
}

// Función para cargar galería con botones de eliminación
function loadGalleryWithDeleteButtons(photos) {
  const container = document.getElementById('detailGallery');
  if (!container) return;

  container.innerHTML = '';
  
  photos.forEach((photo, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'gallery-item';
    imageItem.innerHTML = `
      <img src="${photo.url}" alt="${photo.description}" onclick="openImageModal('${photo.url}')">
      <div class="image-description">${photo.description}</div>
      <button class="btn-remove-item" data-image-index="${index}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    container.appendChild(imageItem);
  });
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
  if (e.target.closest('.btn-remove-item')) {
    const button = e.target.closest('.btn-remove-item');
    
    if (button.hasAttribute('data-image-index')) {
      const imageIndex = parseInt(button.getAttribute('data-image-index'));
      removeImageFromRegion(imageIndex);
    }
  }
});

// Event listeners para modales de confirmación (se agregan al bloque principal DOMContentLoaded)

// ======= FUNCIONALIDAD DE SELECCIÓN DE ARCHIVOS =======

// Función para mostrar modal de selección de archivos
function showFileSelectionModal() {
  const currentRegion = getCurrentRegion();
  if (!currentRegion || !currentRegion.files || currentRegion.files.length === 0) {
    showSuccessMessage('No hay archivos para eliminar');
    return;
  }
  
  loadFileSelectionList(currentRegion.files);
  showModal('fileSelectionModal');
}

// Función para cargar la lista de archivos en el modal de selección
function loadFileSelectionList(files) {
  const container = document.getElementById('fileSelectionList');
  if (!container) return;

  container.innerHTML = '';
  
  files.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'selection-item';
    fileItem.innerHTML = `
      <input type="checkbox" class="selection-checkbox" id="file-${index}" data-file-index="${index}">
      <div class="file-icon">📄</div>
      <div class="file-info">
        <h4>${file.name}</h4>
        <p>${file.description}</p>
        <div class="file-date">${file.date}</div>
      </div>
    `;
    container.appendChild(fileItem);
  });
  
  setupFileSelectionHandlers();
}

// Función para configurar los manejadores de selección de archivos
function setupFileSelectionHandlers() {
  const selectionItems = document.querySelectorAll('#fileSelectionList .selection-item');
  const checkboxes = document.querySelectorAll('#fileSelectionList .selection-checkbox');
  
  selectionItems.forEach((item, index) => {
    item.addEventListener('click', function(e) {
      if (e.target.type !== 'checkbox') {
        const checkbox = this.querySelector('.selection-checkbox');
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('selected', checkbox.checked);
      }
    });
  });
  
  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener('change', function() {
      const item = this.closest('.selection-item');
      item.classList.toggle('selected', this.checked);
    });
  });
}

// Función para obtener los índices de archivos seleccionados
function getSelectedFileIndices() {
  const checkboxes = document.querySelectorAll('#fileSelectionList .selection-checkbox:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-file-index')));
}

// Event listeners para el modal de selección de archivos (ya están en el bloque principal DOMContentLoaded)

// FINAL VERSION: 2025-01-25 03:13 - Complete rewrite without any credential functions
// All forms now open directly without any credential verification
