// ======= DATOS DE REGIONES =======
const regionsData = {
  'region-norte': {
    id: 'region-norte',
    name: 'Región Norte',
    code: 'Región 1',
    location: 'Zona norte de Purulhá',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Vista panorámica de la región norte'
      }
    ],
    data: [
      { icon: '🏘️', label: 'Número de Comunidades', value: '12 comunidades' },
      { icon: '👥', label: 'Población Aproximada', value: '2,500 habitantes' },
      { icon: '🏛️', label: 'Comunidad Sede', value: 'San José' }
    ],
    description: `
      <p>La Región Norte de Purulhá se caracteriza por su diversidad geográfica y cultural. Esta región abarca comunidades rurales que se dedican principalmente a la agricultura y ganadería.</p>
      <p>La región cuenta con un clima templado y suelos fértiles que favorecen el cultivo de maíz, frijol y café. Las comunidades mantienen tradiciones ancestrales y tienen una fuerte organización comunitaria.</p>
    `,
    projects: [
      { name: 'Capacitación en Técnicas Agrícolas', type: 'Capacitación', status: 'En ejecución' },
      { name: 'Entrega de Semillas Mejoradas', type: 'Entrega', status: 'Completado' }
    ],
    communities: [
      { name: 'San José', type: 'Aldea' },
      { name: 'Los Pinos', type: 'Caserío' },
      { name: 'El Progreso', type: 'Barrio' }
    ],
    files: [
      { 
        name: 'Plan Regional Norte 2024', 
        description: 'Documento estratégico para el desarrollo de la región norte',
        type: 'pdf',
        size: '3.2 MB',
        date: '2024-11-15',
        url: '#'
      },
      { 
        name: 'Censo Regional Norte', 
        description: 'Resultados del censo poblacional de la región norte',
        type: 'xlsx',
        size: '2.1 MB',
        date: '2024-11-10',
        url: '#'
      }
    ]
  },
  'region-sur': {
    id: 'region-sur',
    name: 'Región Sur',
    code: 'Región 2',
    location: 'Zona sur de Purulhá',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Paisaje montañoso de la región sur'
      }
    ],
    data: [
      { icon: '🏘️', label: 'Número de Comunidades', value: '15 comunidades' },
      { icon: '👥', label: 'Población Aproximada', value: '3,200 habitantes' },
      { icon: '🏛️', label: 'Comunidad Sede', value: 'Centro Panchisivic' }
    ],
    description: `
      <p>La Región Sur presenta un relieve montañoso que ofrece paisajes espectaculares y recursos naturales únicos. Las comunidades se adaptan a las condiciones topográficas del terreno.</p>
      <p>Esta región se destaca por su producción de café de altura y por mantener prácticas agrícolas sostenibles. Las comunidades tienen una fuerte identidad cultural y organizativa.</p>
    `,
    projects: [
      { name: 'Taller de Desarrollo Comunitario', type: 'Capacitación', status: 'Completado' },
      { name: 'Construcción de Invernadero', type: 'Proyecto de Ayuda', status: 'En ejecución' }
    ],
    communities: [
      { name: 'Centro Panchisivic', type: 'Aldea' },
      { name: 'Eben-Ezer', type: 'Caserío' },
      { name: 'Suquinay II', type: 'Barrio' }
    ],
    files: [
      { 
        name: 'Estudio de Suelos Región Sur', 
        description: 'Análisis de suelos y capacidad productiva de la región sur',
        type: 'pdf',
        size: '4.5 MB',
        date: '2024-11-12',
        url: '#'
      }
    ]
  },
  'region-este': {
    id: 'region-este',
    name: 'Región Este',
    code: 'Región 3',
    location: 'Zona este de Purulhá',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Vista de la región este'
      }
    ],
    data: [
      { icon: '🏘️', label: 'Número de Comunidades', value: '10 comunidades' },
      { icon: '👥', label: 'Población Aproximada', value: '2,100 habitantes' }
    ],
    description: `
      <p>La Región Este se caracteriza por su proximidad a áreas urbanas y su desarrollo comercial. Las comunidades mantienen un equilibrio entre tradición y modernidad.</p>
    `,
    projects: [
      { name: 'Capacitación Técnica Avanzada', type: 'Capacitación', status: 'En ejecución' }
    ],
    communities: [
      { name: 'Los Ángeles', type: 'Aldea' },
      { name: 'El Chol', type: 'Caserío' }
    ]
  },
  'region-oeste': {
    id: 'region-oeste',
    name: 'Región Oeste',
    code: 'Región 4',
    location: 'Zona oeste de Purulhá',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Paisaje de la región oeste'
      }
    ],
    data: [
      { icon: '🏘️', label: 'Número de Comunidades', value: '8 comunidades' },
      { icon: '👥', label: 'Población Aproximada', value: '1,800 habitantes' }
    ],
    description: `
      <p>La Región Oeste presenta características únicas en su geografía y desarrollo comunitario. Las comunidades se han adaptado a las condiciones específicas del área.</p>
    `,
    projects: [
      { name: 'Entrega de Herramientas Agrícolas', type: 'Entrega', status: 'Completado' }
    ],
    communities: [
      { name: 'San Antonio', type: 'Aldea' },
      { name: 'Las Flores', type: 'Caserío' }
    ]
  },
  'region-central': {
    id: 'region-central',
    name: 'Región Central',
    code: 'Región 5',
    location: 'Zona central de Purulhá',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Centro de la región'
      }
    ],
    data: [
      { icon: '🏘️', label: 'Número de Comunidades', value: '18 comunidades' },
      { icon: '👥', label: 'Población Aproximada', value: '4,500 habitantes' }
    ],
    description: `
      <p>La Región Central es el corazón de Purulhá, concentrando la mayor cantidad de comunidades y población. Esta región es estratégica para el desarrollo regional.</p>
    `,
    projects: [
      { name: 'Instalación de Sistema de Riego', type: 'Proyecto de Ayuda', status: 'En ejecución' }
    ],
    communities: [
      { name: 'Centro Panchisivic', type: 'Aldea' },
      { name: 'El Progreso', type: 'Barrio' }
    ]
  }
};

// ======= VARIABLES GLOBALES =======
let currentRegionData = null;
let currentRegionId = null;
let pendingAction = null; // Para almacenar la acción pendiente después de verificar credenciales

// ======= CREDENCIALES DE ADMINISTRADOR =======
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin'
};

// ======= FUNCIONES DE NAVEGACIÓN =======
function showRegionsList() {
  const mainView = document.querySelector('.regions-main');
  const listView = document.getElementById('regionsListView');
  const detailView = document.getElementById('regionDetailView');
  
  mainView.style.display = 'none';
  detailView.style.display = 'none';
  listView.style.display = 'block';
  
  loadRegionsList();
  window.scrollTo(0, 0);
}

function showRegionDetail(regionId) {
  const mainView = document.querySelector('.regions-main');
  const listView = document.getElementById('regionsListView');
  const detailView = document.getElementById('regionDetailView');
  
  mainView.style.display = 'none';
  listView.style.display = 'none';
  detailView.style.display = 'block';
  
  currentRegionId = regionId;
  currentRegionData = regionsData[regionId];
  loadRegionDetail(currentRegionData);
  window.scrollTo(0, 0);
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

// ======= FUNCIONES DE CARGA DE DATOS =======
function loadRegionsList() {
  const regionsList = document.getElementById('regionsList');
  if (!regionsList) return;
  
  regionsList.innerHTML = '';
  
  Object.values(regionsData).forEach(region => {
    const regionItem = createRegionListItem(region);
    regionsList.appendChild(regionItem);
  });
}

function createRegionListItem(region) {
  const regionItem = document.createElement('div');
  regionItem.className = 'region-list-item';
  regionItem.innerHTML = `
    <div class="region-list-item__image">
      <img src="${region.photos[0].url}" alt="${region.name}" loading="lazy">
    </div>
    <div class="region-list-item__content">
      <div class="region-list-item__info">
        <h3 class="region-list-item__name">${region.name}</h3>
        <div class="region-list-item__details">
          <div class="region-list-item__code">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${region.code}
          </div>
          <div class="region-list-item__communities">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            ${region.communities.length} comunidades
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
  
  // Título y código
  document.getElementById('detailTitle').textContent = region.name;
  document.getElementById('detailCode').textContent = region.code;
  
  // Galería de imágenes con botones de eliminación
  if (region.photos) {
    loadGalleryWithDeleteButtons(region.photos);
  }
  
  // Ubicación
  loadLocation(region.location);
  
  // Mapa de la región
  loadRegionMap(region.id);
  
  // Datos generales
  loadData(region.data);
  
  // Descripción
  document.getElementById('detailDescription').innerHTML = region.description;
  
  // Proyectos activos
  loadProjects(region.projects);
  
  // Comunidades
  loadCommunities(region.communities);
  
  // Archivos con botones de eliminación
  if (region.files && region.files.length > 0) {
    loadFilesWithDeleteButtons(region.files);
  } else {
    const filesContainer = document.getElementById('detailFiles');
    filesContainer.innerHTML = '<p class="no-files">No hay archivos disponibles</p>';
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
  if (!regionMapImage) return;
  
  // Extraer el número de región del ID (ej: 'region-norte' -> '1')
  const regionNumber = getRegionNumber(regionId);
  
  if (regionNumber) {
    // Construir la ruta de la imagen
    const imagePath = `regiones mapa pngs/region${regionNumber}.png`;
    
    // Cargar la imagen
    regionMapImage.src = imagePath;
    regionMapImage.alt = `Mapa de la ${regionId.replace('region-', 'Región ')}`;
    
    // Manejar errores de carga
    regionMapImage.onerror = function() {
      console.warn(`No se pudo cargar el mapa para la región ${regionNumber}`);
      regionMapImage.style.display = 'none';
    };
    
    regionMapImage.onload = function() {
      regionMapImage.style.display = 'block';
    };
  } else {
    // Si no se puede determinar el número de región, ocultar la imagen
    regionMapImage.style.display = 'none';
  }
}

function getRegionNumber(regionId) {
  // Mapeo de IDs de región a números
  const regionMapping = {
    'region-norte': 1,
    'region-sur': 2,
    'region-este': 3,
    'region-oeste': 4,
    'region-central': 5,
    'region-noroeste': 6,
    'region-noreste': 7,
    'region-suroeste': 8,
    'region-sureste': 9,
    'region-10': 10,
    'region-11': 11,
    'region-12': 12,
    'region-13': 13,
    'region-14': 14,
    'region-15': 15,
    'region-16': 16,
    'region-17': 17
  };
  
  return regionMapping[regionId] || null;
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
      fileItem.innerHTML = `
        <div class="file-icon">${getFileIcon(file.type)}</div>
        <div class="file-info">
          <h4>${file.name}</h4>
          <p>${file.description}</p>
          <div class="file-date">Agregado el ${formatDate(file.date)} • ${file.size}</div>
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
  showCredentialsModal(() => {
    showModal('addFileModal');
    clearFileForm();
  });
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
  
  regionItems.forEach(item => {
    const regionName = item.querySelector('.region-list-item__name').textContent.toLowerCase();
    const regionCode = item.querySelector('.region-list-item__code').textContent.toLowerCase();
    
    if (regionName.includes(query.toLowerCase()) || regionCode.includes(query.toLowerCase())) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function sortRegions(sortBy) {
  const regionsList = document.getElementById('regionsList');
  if (!regionsList) return;
  
  const regionItems = Array.from(regionsList.querySelectorAll('.region-list-item'));
  
  regionItems.sort((a, b) => {
    const nameA = a.querySelector('.region-list-item__name').textContent;
    const nameB = b.querySelector('.region-list-item__name').textContent;
    
    switch (sortBy) {
      case 'name-asc':
        return nameA.localeCompare(nameB);
      case 'name-desc':
        return nameB.localeCompare(nameA);
      case 'communities':
        const communitiesA = parseInt(a.querySelector('.region-list-item__communities').textContent);
        const communitiesB = parseInt(b.querySelector('.region-list-item__communities').textContent);
        return communitiesB - communitiesA;
      default:
        return 0;
    }
  });
  
  regionItems.forEach(item => regionsList.appendChild(item));
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

// ======= FUNCIONES DE CREDENCIALES =======
function showCredentialsModal(action) {
  pendingAction = action;
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminPassword').value = '';
  document.getElementById('credentialsError').style.display = 'none';
  showModal('adminCredentialsModal');
}

function verifyCredentials() {
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  const errorDiv = document.getElementById('credentialsError');

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    // Credenciales correctas - ejecutar acción directamente
    errorDiv.style.display = 'none';
    executePendingAction();
  } else {
    // Credenciales incorrectas
    errorDiv.style.display = 'block';
  }
}

function executePendingAction() {
  if (pendingAction) {
    pendingAction();
    pendingAction = null;
  }
  hideModal('adminCredentialsModal');
}

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

function addImageToRegion() {
  const fileInput = document.getElementById('imageFileInput');
  const description = document.getElementById('imageDescription').value;
  
  if (!fileInput.files[0]) {
    showErrorMessage('Por favor selecciona una imagen');
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    if (currentRegionData) {
      currentRegionData.photos.push({
        url: e.target.result,
        description: description || 'Imagen de la región'
      });
      
      loadGallery(currentRegionData.photos);
      showSuccessMessage('Imagen agregada exitosamente');
      hideModal('addImageModal');
    }
  };
  
  reader.readAsDataURL(file);
}

function showEditDescriptionModal() {
  if (currentRegionData) {
    showCredentialsModal(() => {
      document.getElementById('editDescriptionText').value = currentRegionData.description.replace(/<[^>]*>/g, '');
      showModal('editDescriptionModal');
    });
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
    showCredentialsModal(() => {
      // Extraer valores actuales de los datos
      const communitiesData = currentRegionData.data.find(item => item.label === 'Número de Comunidades');
      const populationData = currentRegionData.data.find(item => item.label === 'Población Aproximada');
      const sedeData = currentRegionData.data.find(item => item.label === 'Comunidad Sede');
      
      document.getElementById('editCommunitiesCount').value = communitiesData ? communitiesData.value.replace(/\D/g, '') : '';
      document.getElementById('editPopulation').value = populationData ? populationData.value : '';
      document.getElementById('editSedeCommunity').value = sedeData ? sedeData.value : '';
      showModal('editDataModal');
    });
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
    btnBackFromDetail.addEventListener('click', backToList);
  }
  
  // Event listeners para tarjetas de región
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('region-card__btn')) {
      const regionId = e.target.getAttribute('data-region-id');
      if (regionId) {
        showRegionDetail(regionId);
      }
    }
    
    if (e.target.classList.contains('region-list-item__btn')) {
      const regionId = e.target.getAttribute('data-region-id');
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

  // Event listeners para credenciales
  const verifyCredentialsBtn = document.getElementById('verifyCredentialsBtn');
  if (verifyCredentialsBtn) {
    verifyCredentialsBtn.addEventListener('click', verifyCredentials);
  }
  
  const cancelCredentialsBtn = document.getElementById('cancelCredentialsBtn');
  if (cancelCredentialsBtn) {
    cancelCredentialsBtn.addEventListener('click', () => {
      pendingAction = null;
      hideModal('adminCredentialsModal');
    });
  }
  
  const closeCredentialsModal = document.getElementById('closeCredentialsModal');
  if (closeCredentialsModal) {
    closeCredentialsModal.addEventListener('click', () => {
      pendingAction = null;
      hideModal('adminCredentialsModal');
    });
  }
  
  // Cerrar modales al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
  
  // Cargar lista inicial
  loadRegionsList();
  
  // Event listeners para archivos (al final para evitar conflictos)
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
  // Esta función debería retornar la región actualmente mostrada
  // Por ahora retornamos una región de ejemplo
  return regionsData['region-norte'];
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

// Event listeners para modales de confirmación
document.addEventListener('DOMContentLoaded', function() {
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
      showCredentialsModal(() => {
        showFileSelectionModal();
      });
    });
  }
});

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

// Event listeners para el modal de selección de archivos
document.addEventListener('DOMContentLoaded', function() {
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
      const selectedIndices = getSelectedFileIndices();
      
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
});
