/* ======= FUNCIONALIDAD PARA COMUNIDADES ======= */

// ======= DROPDOWNS ESCRITORIO =======
const dropdowns = document.querySelectorAll('.dd');
const closeAll = () => dropdowns.forEach(dd => {
  dd.querySelector('.dd__btn').classList.remove('is-open');
  dd.querySelector('.dd__btn').setAttribute('aria-expanded','false');
  dd.querySelector('.dd__panel').classList.remove('show');
});
dropdowns.forEach(dd=>{
  const btn   = dd.querySelector('.dd__btn');
  const panel = dd.querySelector('.dd__panel');
  btn.addEventListener('click', ()=>{
    const isOpen = panel.classList.contains('show');
    closeAll();
    if(!isOpen){
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded','true');
      panel.classList.add('show');
    }
  });
});
document.addEventListener('click', (e)=>{ if(!e.target.closest('.dd')) closeAll(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeAll(); });

// ======= BUSCADOR PRINCIPAL =======
document.querySelector('.search .mini').addEventListener('click', (e)=>{
  e.preventDefault();
  const q = document.getElementById('buscar-comunidad').value.trim();
  if(q) console.log('Buscar comunidad:', q);
});

// ======= DRAWER MÓVIL =======
const drawer = document.getElementById('drawer');
const btnHamburger = document.getElementById('btnHamburger');
const btnCloseDrawer = document.getElementById('btnCloseDrawer');
const openDrawer = () => {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  btnHamburger.setAttribute('aria-expanded','true');
  document.body.style.overflow='hidden';
};
const closeDrawer = () => {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  btnHamburger.setAttribute('aria-expanded','false');
  document.body.style.overflow='';
};
btnHamburger.addEventListener('click', openDrawer);
btnCloseDrawer.addEventListener('click', closeDrawer);
drawer.addEventListener('click', (e)=>{ if(e.target === drawer) closeDrawer(); });
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeDrawer(); });

// Acordeón dentro del drawer
document.querySelectorAll('.ddm').forEach(ddm=>{
  const btn = ddm.querySelector('.ddm__btn');
  const panel = ddm.querySelector('.ddm__panel');
  btn.addEventListener('click', ()=>{
    const open = ddm.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    panel.style.maxHeight = open ? panel.scrollHeight+'px' : '0px';
  });
});

// ======= DATOS DE COMUNIDADES =======
const communitiesData = {
  'san-jose': {
    name: 'San José',
    region: 'Región Norte',
    type: 'Aldea',
    population: 1250,
    coordinates: '15.1234, -90.5678',
    cocode: 'María González',
    cocodePhone: '3015-6925',
    location: 'Ubicada en la parte norte del municipio, a 15 km del centro',
    description: `
      <p>San José es una comunidad próspera ubicada en la región norte de Purulhá. Con una población de más de 1,200 habitantes, esta aldea se caracteriza por su fuerte sentido comunitario y su compromiso con el desarrollo sostenible.</p>
      <p>La comunidad cuenta con servicios básicos como agua potable, electricidad y acceso a educación primaria. Los habitantes se dedican principalmente a la agricultura y la ganadería, siendo el maíz y el frijol sus cultivos principales.</p>
    `,
    photos: [
      { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Vista general de la comunidad' },
      { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Centro comunitario' },
      { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Escuela local' }
    ],
    projects: [
      { name: 'Capacitación Agrícola Sostenible', status: 'Activo', type: 'Capacitación' },
      { name: 'Entrega de Semillas Mejoradas', status: 'Completado', type: 'Entrega' },
      { name: 'Construcción de Sistema de Riego', status: 'En Progreso', type: 'Proyecto de Ayuda' }
    ],
    files: [
      { 
        name: 'Plan de Desarrollo Comunitario 2024', 
        description: 'Documento oficial del plan de desarrollo para la comunidad',
        type: 'pdf',
        size: '2.3 MB',
        date: '2024-11-15',
        url: '#'
      },
      { 
        name: 'Censo Poblacional 2024', 
        description: 'Resultados del censo poblacional realizado en la comunidad',
        type: 'xlsx',
        size: '1.8 MB',
        date: '2024-11-10',
        url: '#'
      },
      { 
        name: 'Acta de Reunión COCODE', 
        description: 'Acta de la última reunión del COCODE',
        type: 'docx',
        size: '0.5 MB',
        date: '2024-11-05',
        url: '#'
      }
    ]
  },
  'el-progreso': {
    name: 'El Progreso',
    region: 'Región Sur',
    type: 'Barrio',
    population: 850,
    coordinates: '15.0987, -90.5432',
    cocode: 'Carlos Rodríguez',
    cocodePhone: '3015-6926',
    location: 'Ubicada en la zona sur, a 8 km del centro municipal',
    description: `
      <p>El Progreso es un barrio dinámico que ha experimentado un crecimiento significativo en los últimos años. Con una población joven y emprendedora, la comunidad se ha destacado por su participación activa en proyectos de desarrollo.</p>
      <p>La comunidad cuenta con acceso a servicios de salud y educación secundaria. Los habitantes se dedican principalmente al comercio y la artesanía, contribuyendo al desarrollo económico local.</p>
    `,
    photos: [
      { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Vista del barrio' },
      { url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Mercado local' }
    ],
    projects: [
      { name: 'Taller de Artesanía', status: 'Activo', type: 'Capacitación' },
      { name: 'Mejora de Infraestructura', status: 'Completado', type: 'Proyecto de Ayuda' }
    ],
    files: [
      { 
        name: 'Registro de Artesanos', 
        description: 'Lista de artesanos registrados en la comunidad',
        type: 'xlsx',
        size: '0.8 MB',
        date: '2024-11-12',
        url: '#'
      }
    ]
  },
  'la-esperanza': {
    name: 'La Esperanza',
    region: 'Región Este',
    type: 'Caserío',
    population: 450,
    coordinates: '15.1456, -90.5123',
    cocode: 'Ana Martínez',
    cocodePhone: '3015-6927',
    location: 'Ubicada en la zona este, a 12 km del centro municipal',
    description: `
      <p>La Esperanza es un caserío pequeño pero muy unido, donde los habitantes han trabajado juntos para mejorar sus condiciones de vida. A pesar de su tamaño, la comunidad ha logrado implementar varios proyectos exitosos.</p>
      <p>La comunidad se caracteriza por su tradición agrícola y su compromiso con la conservación del medio ambiente. Los habitantes han adoptado prácticas sostenibles en sus cultivos.</p>
    `,
    photos: [
      { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Vista del caserío' },
      { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Cultivos locales' }
    ],
    projects: [
      { name: 'Proyecto de Reforestación', status: 'Activo', type: 'Proyecto de Ayuda' },
      { name: 'Capacitación en Agricultura Orgánica', status: 'Completado', type: 'Capacitación' }
    ]
  },
  'los-pinos': {
    name: 'Los Pinos',
    region: 'Región Oeste',
    type: 'Aldea',
    population: 980,
    coordinates: '15.0876, -90.5890',
    cocode: 'Luis Hernández',
    cocodePhone: '3015-6928',
    location: 'Ubicada en la zona oeste, a 18 km del centro municipal',
    description: `
      <p>Los Pinos es una aldea con una rica tradición cultural y una fuerte identidad comunitaria. Los habitantes han preservado sus costumbres ancestrales mientras adoptan nuevas tecnologías para el desarrollo.</p>
      <p>La comunidad cuenta con una organización comunitaria sólida y ha logrado implementar varios proyectos de infraestructura con éxito.</p>
    `,
    photos: [
      { url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Vista de la aldea' },
      { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Centro cultural' }
    ],
    projects: [
      { name: 'Construcción de Centro Comunitario', status: 'Completado', type: 'Proyecto de Ayuda' },
      { name: 'Capacitación en Liderazgo', status: 'Activo', type: 'Capacitación' }
    ]
  },
  'centro-panchisivic': {
    name: 'Centro Panchisivic',
    region: 'Región Central',
    type: 'Aldea',
    population: 2100,
    coordinates: '15.1123, -90.5555',
    cocode: 'Roberto García',
    cocodePhone: '3015-6929',
    location: 'Ubicada en el centro del municipio, a 5 km del centro municipal',
    description: `
      <p>Centro Panchisivic es una de las comunidades más grandes y desarrolladas del municipio. Con una población de más de 2,000 habitantes, cuenta con servicios completos y una economía diversificada.</p>
      <p>La comunidad se ha convertido en un centro de referencia para otras comunidades cercanas, ofreciendo servicios de salud, educación y comercio.</p>
    `,
    photos: [
      { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Vista del centro' },
      { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Servicios de salud' },
      { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Centro educativo' }
    ],
    projects: [
      { name: 'Mejora del Sistema de Salud', status: 'Activo', type: 'Proyecto de Ayuda' },
      { name: 'Capacitación en Comercio', status: 'Completado', type: 'Capacitación' },
      { name: 'Entrega de Equipos Médicos', status: 'Completado', type: 'Entrega' }
    ]
  }
};

// Datos adicionales para la lista completa
const allCommunitiesData = [
  { id: 'san-jose', name: 'San José', region: 'Región Norte', type: 'Aldea', hasProjects: true, lastUpdate: '2024-11-28' },
  { id: 'el-progreso', name: 'El Progreso', region: 'Región Sur', type: 'Barrio', hasProjects: true, lastUpdate: '2024-11-25' },
  { id: 'la-esperanza', name: 'La Esperanza', region: 'Región Este', type: 'Caserío', hasProjects: true, lastUpdate: '2024-11-22' },
  { id: 'los-pinos', name: 'Los Pinos', region: 'Región Oeste', type: 'Aldea', hasProjects: true, lastUpdate: '2024-11-20' },
  { id: 'centro-panchisivic', name: 'Centro Panchisivic', region: 'Región Central', type: 'Aldea', hasProjects: true, lastUpdate: '2024-11-18' },
  { id: 'eben-ezer', name: 'Eben-Ezer', region: 'Región Norte', type: 'Aldea', hasProjects: false, lastUpdate: '2024-11-15' },
  { id: 'suquinay-ii', name: 'Suquinay II', region: 'Región Sur', type: 'Barrio', hasProjects: true, lastUpdate: '2024-11-12' },
  { id: 'el-chol', name: 'El Chol', region: 'Región Este', type: 'Aldea', hasProjects: false, lastUpdate: '2024-11-10' },
  { id: 'los-angeles', name: 'Los Ángeles', region: 'Región Oeste', type: 'Caserío', hasProjects: true, lastUpdate: '2024-11-08' },
  { id: 'san-antonio', name: 'San Antonio', region: 'Región Central', type: 'Aldea', hasProjects: true, lastUpdate: '2024-11-05' },
  { id: 'las-flores', name: 'Las Flores', region: 'Región Norte', type: 'Barrio', hasProjects: false, lastUpdate: '2024-11-03' }
];

// Credenciales de administrador (ya no se usan)
// const ADMIN_CREDENTIALS = {
//   user: 'admin',
//   password: 'admin'
// };

// Variables globales
let currentCommunityData = null;
let filteredCommunities = [...allCommunitiesData];

// ======= FUNCIONES DE UTILIDAD =======

// Función para formatear fechas
function formatDate(dateString) {
  const date = new Date(dateString);
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
function showCommunitiesList() {
  const mainView = document.querySelector('.communities-main');
  const listView = document.getElementById('communitiesListView');
  
  // Ocultar vista principal
  mainView.style.display = 'none';
  
  // Mostrar vista de lista
  listView.style.display = 'block';
  
  // Cargar lista de comunidades
  loadCommunitiesList();
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

// Función para cargar lista de comunidades
function loadCommunitiesList() {
  const communitiesList = document.getElementById('communitiesList');
  if (!communitiesList) return;
  
  communitiesList.innerHTML = '';
  
  filteredCommunities.forEach(community => {
    const listItem = document.createElement('div');
    listItem.className = 'community-list-item';
    listItem.innerHTML = `
      <div class="community-list-item__image">
        <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" alt="${community.name}">
      </div>
      <div class="community-list-item__content">
        <div class="community-list-item__info">
          <h3 class="community-list-item__name">${community.name}</h3>
          <div class="community-list-item__details">
            <div class="community-list-item__region">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${community.region}
            </div>
            <div class="community-list-item__type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
              ${community.type}
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
  
  // Ocultar otras vistas
  listView.style.display = 'none';
  detailView.style.display = 'none';
  
  // Mostrar vista principal
  mainView.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

// ======= VISTA DETALLADA DE COMUNIDAD =======

// Función para mostrar vista detallada
function showCommunityDetail(communityId) {
  const mainView = document.querySelector('.communities-main');
  const listView = document.getElementById('communitiesListView');
  const detailView = document.getElementById('communityDetailView');
  
  // Ocultar otras vistas
  mainView.style.display = 'none';
  listView.style.display = 'none';
  
  // Mostrar vista detallada
  detailView.style.display = 'block';
  
  // Cargar datos de la comunidad
  const community = communitiesData[communityId];
  if (community) {
    loadCommunityDetail(community);
    currentCommunityData = community;
  }
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

// Función para cargar datos de la comunidad en la vista detallada
function loadCommunityDetail(community) {
  // Título y región
  document.getElementById('detailTitle').textContent = community.name;
  document.getElementById('detailRegion').textContent = community.region;
  
  // Galería de fotos con botones de eliminación
  if (community.photos) {
    loadGalleryWithDeleteButtons(community.photos);
  }
  
  // Ubicación
  const locationContainer = document.getElementById('detailLocationInfo');
  locationContainer.innerHTML = `
    <div class="location-item">
      <div class="location-icon">📍</div>
      <div class="location-content">
        <h4>Ubicación</h4>
        <p>${community.location}</p>
      </div>
    </div>
  `;
  
  // Datos generales
  const dataContainer = document.getElementById('detailData');
  dataContainer.innerHTML = `
    <div class="data-item">
      <div class="data-icon">👥</div>
      <div class="data-content">
        <h4>Población</h4>
        <p>${community.population.toLocaleString()} habitantes</p>
      </div>
    </div>
    <div class="data-item">
      <div class="data-icon">📍</div>
      <div class="data-content">
        <h4>Coordenadas</h4>
        <p>${community.coordinates}</p>
      </div>
    </div>
    <div class="data-item">
      <div class="data-icon">👤</div>
      <div class="data-content">
        <h4>COCODE</h4>
        <p>${community.cocode}</p>
      </div>
    </div>
    <div class="data-item">
      <div class="data-icon">📞</div>
      <div class="data-content">
        <h4>Teléfono COCODE</h4>
        <p>${community.cocodePhone}</p>
      </div>
    </div>
    <div class="data-item">
      <div class="data-icon">🏘️</div>
      <div class="data-content">
        <h4>Tipo de Comunidad</h4>
        <p>${community.type}</p>
      </div>
    </div>
  `;
  
  // Descripción
  document.getElementById('detailDescription').innerHTML = community.description;
  
  // Proyectos activos
  const projectsContainer = document.getElementById('detailProjects');
  projectsContainer.innerHTML = '';
  community.projects.forEach((project, index) => {
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';
    projectItem.innerHTML = `
      <div class="project-icon">${index + 1}</div>
      <div class="project-info">
        <h4>${project.name}</h4>
        <p>${project.type} - ${project.status}</p>
      </div>
    `;
    projectsContainer.appendChild(projectItem);
  });
  
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
function openImageModal(imageUrl) {
  window.open(imageUrl, '_blank');
}

// Función para volver a la vista principal desde la vista detallada
function backFromDetail() {
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
function searchCommunities(query) {
  if (!query.trim()) {
    filteredCommunities = [...allCommunitiesData];
  } else {
    filteredCommunities = allCommunitiesData.filter(community => 
      community.name.toLowerCase().includes(query.toLowerCase()) ||
      community.region.toLowerCase().includes(query.toLowerCase()) ||
      community.type.toLowerCase().includes(query.toLowerCase())
    );
  }
  loadCommunitiesList();
}

// Función para ordenar comunidades
function sortCommunities(sortBy) {
  switch (sortBy) {
    case 'name-asc':
      filteredCommunities.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredCommunities.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'recent':
      filteredCommunities.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
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

// Función para mostrar modal de editar datos
function showEditDataModal() {
  if (currentCommunityData) {
    // Cargar datos actuales en el modal
    document.getElementById('editPopulation').value = currentCommunityData.population || '';
    document.getElementById('editCoordinates').value = currentCommunityData.coordinates || '';
    document.getElementById('editCocode').value = currentCommunityData.cocode || '';
    document.getElementById('editCocodePhone').value = currentCommunityData.cocodePhone || '';
    showModal('editDataModal');
  }
}

// Función para actualizar datos de la comunidad
function updateCommunityData() {
  const population = document.getElementById('editPopulation').value;
  const coordinates = document.getElementById('editCoordinates').value;
  const cocode = document.getElementById('editCocode').value;
  const cocodePhone = document.getElementById('editCocodePhone').value;
  
  if (!population || !coordinates.trim()) {
    showErrorMessage('Por favor completa todos los campos obligatorios');
    return;
  }
  
  if (currentCommunityData) {
    // Actualizar datos
    currentCommunityData.population = parseInt(population);
    currentCommunityData.coordinates = coordinates;
    currentCommunityData.cocode = cocode;
    currentCommunityData.cocodePhone = cocodePhone;
    
    // Recargar vista detallada
    loadCommunityDetail(currentCommunityData);
    showSuccessMessage('Datos actualizados exitosamente');
    hideModal('editDataModal');
  }
}

// Función para mostrar modal de editar descripción
function showEditDescriptionModal() {
  if (currentCommunityData) {
    // Cargar descripción actual en el modal
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentCommunityData.description || '';
    document.getElementById('editDescriptionText').value = tempDiv.textContent || tempDiv.innerText || '';
    showModal('editDescriptionModal');
  }
}

// Función para actualizar descripción de la comunidad
function updateCommunityDescription() {
  const newDescription = document.getElementById('editDescriptionText').value;
  
  if (!newDescription.trim()) {
    showErrorMessage('Por favor ingresa una descripción');
    return;
  }
  
  if (currentCommunityData) {
    // Actualizar descripción
    currentCommunityData.description = `<p>${newDescription}</p>`;
    
    // Recargar vista detallada
    loadCommunityDetail(currentCommunityData);
    showSuccessMessage('Descripción actualizada exitosamente');
    hideModal('editDescriptionModal');
  }
}

// ======= FUNCIONES PARA AGREGAR IMÁGENES =======

// Función para mostrar modal de agregar imagen
function showAddImageModal() {
  showModal('addImageModal');
  clearImageForm();
}

function clearImageForm() {
  document.getElementById('imageFile').value = '';
  document.getElementById('imageDescription').value = '';
  document.getElementById('imagePreview').innerHTML = '';
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

// Función para manejar la selección de archivos de imagen
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

// Función para agregar imagen a la comunidad
function addImageToCommunity() {
  const fileInput = document.getElementById('imageFileInput');
  const description = document.getElementById('imageDescription').value;
  
  if (!fileInput.files[0]) {
    showErrorMessage('Por favor selecciona una imagen');
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    if (currentCommunityData) {
      if (!currentCommunityData.photos) {
        currentCommunityData.photos = [];
      }
      
      currentCommunityData.photos.push({
        url: e.target.result,
        description: description || 'Imagen de la comunidad'
      });
      
      loadCommunityDetail(currentCommunityData);
      showSuccessMessage('Imagen agregada exitosamente');
      hideModal('addImageModal');
    }
  };
  
  reader.readAsDataURL(file);
}

// Función para agregar archivo a la comunidad
function addFileToCommunity() {
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
  
  if (currentCommunityData) {
    if (!currentCommunityData.files) {
      currentCommunityData.files = [];
    }
    
    currentCommunityData.files.push({
      name: fileName,
      description: description || 'Archivo de la comunidad',
      type: fileType,
      size: fileSize,
      date: currentDate,
      url: '#' // En una implementación real, aquí se subiría el archivo
    });
    
    loadCommunityDetail(currentCommunityData);
    showSuccessMessage('Archivo agregado exitosamente');
    hideModal('addFileModal');
  }
}

// ======= EVENT LISTENERS =======

// Event listeners para botones principales
document.addEventListener('DOMContentLoaded', function() {
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
      searchCommunities(this.value);
    });
  }
  
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
  const confirmDataBtn = document.getElementById('confirmDataBtn');
  if (confirmDataBtn) {
    confirmDataBtn.addEventListener('click', updateCommunityData);
  }
  
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
    });
  }
  
  if (confirmImageBtn) {
    confirmImageBtn.addEventListener('click', addImageToCommunity);
  }
  
  if (closeImageModal) {
    closeImageModal.addEventListener('click', function() {
      hideModal('addImageModal');
    });
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
    confirmFileBtn.addEventListener('click', addFileToCommunity);
  }
  
  if (closeFileModal) {
    closeFileModal.addEventListener('click', function() {
      hideModal('addFileModal');
    });
  }
});

// Función para agregar event listeners a los botones "Ver más"
function addCommunityViewMoreListeners() {
  // Botones en tarjetas principales
  const viewMoreButtons = document.querySelectorAll('.community-card__btn');
  viewMoreButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const communityId = this.getAttribute('data-community-id');
      if (communityId) {
        showCommunityDetail(communityId);
      }
    });
  });
  
  // Botones en lista
  const listViewMoreButtons = document.querySelectorAll('.community-list-item__btn');
  listViewMoreButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const communityId = this.getAttribute('data-community-id');
      if (communityId) {
        showCommunityDetail(communityId);
      }
    });
  });
}

// Agregar event listeners cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
  addCommunityViewMoreListeners();
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
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar esta imagen de la galería?',
    () => {
      const currentCommunity = getCurrentCommunity();
      if (currentCommunity && currentCommunity.photos) {
        currentCommunity.photos.splice(imageIndex, 1);
        loadCommunityDetail(currentCommunity);
        showSuccessMessage('Imagen eliminada exitosamente');
      }
    }
  );
}

// Función para eliminar archivo
function removeFileFromCommunity(fileId) {
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar este archivo?',
    () => {
      const currentCommunity = getCurrentCommunity();
      if (currentCommunity && currentCommunity.files) {
        currentCommunity.files = currentCommunity.files.filter(file => file.id !== fileId);
        loadCommunityDetail(currentCommunity);
        showSuccessMessage('Archivo eliminado exitosamente');
      }
    }
  );
}

// Función para obtener la comunidad actual
function getCurrentCommunity() {
  // Esta función debería retornar la comunidad actualmente mostrada
  // Por ahora retornamos una comunidad de ejemplo
  return communitiesData['san-jose'];
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
      removeImageFromCommunity(imageIndex);
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
      showFileSelectionModal();
    });
  }
});

// ======= FUNCIONALIDAD DE SELECCIÓN DE ARCHIVOS =======

// Función para mostrar modal de selección de archivos
function showFileSelectionModal() {
  const currentCommunity = getCurrentCommunity();
  if (!currentCommunity || !currentCommunity.files || currentCommunity.files.length === 0) {
    showSuccessMessage('No hay archivos para eliminar');
    return;
  }
  
  loadFileSelectionList(currentCommunity.files);
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
          const currentCommunity = getCurrentCommunity();
          if (currentCommunity && currentCommunity.files) {
            // Eliminar archivos en orden descendente para mantener los índices correctos
            selectedIndices.sort((a, b) => b - a).forEach(index => {
              currentCommunity.files.splice(index, 1);
            });
            loadCommunityDetail(currentCommunity);
            hideModal('fileSelectionModal');
            showSuccessMessage(`${selectedIndices.length} archivo(s) eliminado(s) exitosamente`);
          }
        }
      );
    });
  }
});
