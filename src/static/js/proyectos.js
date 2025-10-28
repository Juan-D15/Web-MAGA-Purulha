/* ======= JAVASCRIPT PARA PROYECTOS.HTML ======= */

// NOTA: La funcionalidad de dropdowns, búsqueda y drawer está manejada por navigation.js
// Este archivo solo contiene la lógica específica de la página de proyectos

/* ---------- ANIMACIONES DE ENTRADA ---------- */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observar elementos para animación
document.querySelectorAll('.project-card, .featured-card, .category-section').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ======= DATOS DE PROYECTOS - CARGA DESDE BD =======
console.log('📦 Proyectos.js - Cargando datos desde la base de datos');

// Los datos se cargarán desde la API
let projectsData = {
  capacitaciones: [],
  entregas: [],
  "proyectos-ayuda": []
};

// Función para cargar proyectos desde la API
async function cargarProyectosPorTipo(tipo) {
  try {
    console.log(`🔄 Cargando proyectos tipo: ${tipo}`);
    const response = await fetch(`/api/proyectos/${tipo}/`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Cargados ${data.total} proyectos de tipo ${tipo}`);
      
      // Convertir el formato de la API al formato esperado por el frontend
      return data.proyectos.map(proyecto => ({
        id: proyecto.id,
        name: proyecto.nombre,
        location: proyecto.ubicacion,
        createdDate: proyecto.creado_en,
        modifiedDate: proyecto.actualizado_en,
        type: proyecto.tipo,
        estado: proyecto.estado,
        estado_display: proyecto.estado_display,
        descripcion: proyecto.descripcion,
        imagen_principal: proyecto.imagen_principal,
        personal_count: proyecto.personal_count,
        personal_nombres: proyecto.personal_nombres,
        beneficiarios_count: proyecto.beneficiarios_count,
        evidencias_count: proyecto.evidencias_count,
        fecha: proyecto.fecha
      }));
    } else {
      console.error(`❌ Error al cargar ${tipo}:`, data.error);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error al cargar proyectos tipo ${tipo}:`, error);
    return [];
  }
}

// Función para cargar los últimos proyectos
async function cargarUltimosProyectos() {
  try {
    console.log('🔄 Cargando últimos proyectos...');
    const response = await fetch('/api/ultimos-proyectos/');
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Cargados ${data.total} últimos proyectos`);
      return data.proyectos;
    } else {
      console.error('❌ Error al cargar últimos proyectos:', data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error al cargar últimos proyectos:', error);
    return [];
  }
}

// Función para inicializar la carga de todos los tipos de proyectos
async function inicializarProyectos() {
  try {
    console.log('🔄 Inicializando carga de proyectos...');
    
    // Cargar todos los tipos de proyectos y los últimos en paralelo
    const [capacitaciones, entregas, proyectosAyuda, ultimosProyectos] = await Promise.all([
      cargarProyectosPorTipo('capacitaciones'),
      cargarProyectosPorTipo('entregas'),
      cargarProyectosPorTipo('proyectos-ayuda'),
      cargarUltimosProyectos()
    ]);
    
    // Actualizar projectsData con los resultados
    projectsData.capacitaciones = capacitaciones;
    projectsData.entregas = entregas;
    projectsData['proyectos-ayuda'] = proyectosAyuda;
    
    console.log('✅ Todos los proyectos cargados:', projectsData);
    
    // Renderizar proyectos en el HTML
    renderizarProyectosEnHTML();
    
    // Renderizar últimos proyectos
    renderizarUltimosProyectos(ultimosProyectos);
    
    // Verificar si hay un hash en la URL para abrir un evento específico
    verificarHashYAbrirEvento();
    
  } catch (error) {
    console.error('❌ Error al inicializar proyectos:', error);
  }
}

// Función para verificar el hash de la URL y abrir el evento correspondiente
function verificarHashYAbrirEvento() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#evento-')) {
    const eventoId = hash.replace('#evento-', '');
    console.log(`🔍 Abriendo detalle del evento desde hash: ${eventoId}`);
    
    // Esperar un poco para que los proyectos se rendericen
    setTimeout(() => {
      loadProjectDetails(eventoId);
    }, 500);
  }
}

// Llamar a la función de inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarProyectos);
} else {
  inicializarProyectos();
}

// Función para formatear fechas
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Función para renderizar proyectos en el HTML
function renderizarProyectosEnHTML() {
  console.log('🎨 Renderizando proyectos en el HTML...');
  
  // Renderizar capacitaciones
  renderizarCategoria('capacitaciones', projectsData.capacitaciones);
  
  // Renderizar entregas
  renderizarCategoria('entregas', projectsData.entregas);
  
  // Renderizar proyectos de ayuda
  renderizarCategoria('proyectos-ayuda', projectsData['proyectos-ayuda']);
}

// Función para renderizar una categoría específica
function renderizarCategoria(categoriaId, proyectos) {
  const seccionCategoria = document.getElementById(categoriaId);
  if (!seccionCategoria) {
    console.warn(`No se encontró la sección ${categoriaId}`);
    return;
  }
  
  const gridContainer = seccionCategoria.querySelector('.projects-grid');
  if (!gridContainer) {
    console.warn(`No se encontró el grid en la sección ${categoriaId}`);
    return;
  }
  
  // Limpiar contenido existente
  gridContainer.innerHTML = '';
  
  // Si no hay proyectos, mostrar mensaje
  if (!proyectos || proyectos.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
        <p>No hay proyectos de este tipo aún.</p>
      </div>
    `;
    return;
  }
  
  // Mostrar solo los primeros 3 proyectos
  const proyectosMostrar = proyectos.slice(0, 3);
  
  proyectosMostrar.forEach(proyecto => {
    const projectCard = crearTarjetaProyecto(proyecto);
    gridContainer.appendChild(projectCard);
  });
  
  console.log(`✅ Renderizados ${proyectosMostrar.length} proyectos en ${categoriaId}`);
}

// Función para crear una tarjeta de proyecto
function crearTarjetaProyecto(proyecto) {
  const card = document.createElement('div');
  card.className = 'project-card';
  
  // Extraer mes, día y año de la fecha
  const fecha = new Date(proyecto.fecha || proyecto.createdDate);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mes = meses[fecha.getMonth()];
  const dia = fecha.getDate();
  const anio = fecha.getFullYear();
  
  // Determinar la imagen a usar
  const imagenUrl = proyecto.imagen_principal || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
  
  card.innerHTML = `
    <div class="project-image">
      <img src="${imagenUrl}" alt="${proyecto.nombre || proyecto.name}" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
      <div class="project-date-overlay">
        <div class="date__month">${mes}</div>
        <div class="date__day">${dia}</div>
        <div class="date__year">${anio}</div>
      </div>
      <div class="project-content-overlay">
        <h4 class="project-title">${proyecto.nombre || proyecto.name}</h4>
        <p class="project-location">
          <svg class="location-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${proyecto.ubicacion || proyecto.location}
        </p>
        <button class="project-btn" data-project-id="${proyecto.id}">Ver más ></button>
      </div>
    </div>
  `;
  
  // Agregar evento click al botón
  const btn = card.querySelector('.project-btn');
  btn.addEventListener('click', function() {
    const projectId = this.getAttribute('data-project-id');
    loadProjectDetails(projectId);
  });
  
  return card;
}

// Función para renderizar los últimos proyectos
function renderizarUltimosProyectos(proyectos) {
  console.log('🎨 Renderizando últimos proyectos...');
  
  // Buscar el contenedor de últimos proyectos
  const featuredGrid = document.querySelector('.latest-projects .projects-grid.featured');
  if (!featuredGrid) {
    console.warn('No se encontró el grid de últimos proyectos');
    return;
  }
  
  // Limpiar contenido existente
  featuredGrid.innerHTML = '';
  
  // Si no hay proyectos, mostrar mensaje
  if (!proyectos || proyectos.length === 0) {
    featuredGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
        <p>No hay proyectos recientes aún.</p>
      </div>
    `;
    return;
  }
  
  // Renderizar cada proyecto (máximo 2)
  proyectos.forEach(proyecto => {
    const card = crearTarjetaProyectoDestacado(proyecto);
    featuredGrid.appendChild(card);
  });
  
  console.log(`✅ Renderizados ${proyectos.length} últimos proyectos`);
}

// Función para crear una tarjeta de proyecto destacado
function crearTarjetaProyectoDestacado(proyecto) {
  const card = document.createElement('div');
  card.className = 'project-card featured-card';
  
  // Extraer mes, día y año de la fecha
  const fecha = new Date(proyecto.fecha || new Date());
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mes = meses[fecha.getMonth()];
  const dia = fecha.getDate();
  const anio = fecha.getFullYear();
  
  // Determinar la imagen a usar
  const imagenUrl = proyecto.imagen_principal || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  
  card.innerHTML = `
    <div class="project-image">
      <img src="${imagenUrl}" alt="${proyecto.nombre}" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
      <div class="project-date-overlay">
        <div class="date__month">${mes}</div>
        <div class="date__day">${dia}</div>
        <div class="date__year">${anio}</div>
      </div>
      <div class="project-content-overlay">
        <h3 class="project-title">${proyecto.nombre}</h3>
        <p class="project-location">
          <svg class="location-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${proyecto.ubicacion}
        </p>
        <button class="project-btn" data-project-id="${proyecto.id}">Ver más ></button>
      </div>
    </div>
  `;
  
  // Agregar evento click al botón
  const btn = card.querySelector('.project-btn');
  btn.addEventListener('click', function() {
    const projectId = this.getAttribute('data-project-id');
    loadProjectDetails(projectId);
  });
  
  return card;
}

// Función para cargar los detalles completos de un proyecto
async function loadProjectDetails(projectId) {
  try {
    console.log(`🔄 Cargando detalles del proyecto ${projectId}...`);
    
    const response = await fetch(`/api/proyecto/${projectId}/`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Detalles del proyecto cargados:', data.proyecto);
      mostrarDetalleProyecto(data.proyecto);
    } else {
      console.error('❌ Error al cargar proyecto:', data.error);
      alert('Error al cargar el proyecto: ' + data.error);
    }
  } catch (error) {
    console.error('❌ Error al cargar proyecto:', error);
    alert('Error al cargar el proyecto. Por favor, intenta de nuevo.');
  }
}

// Función para mostrar los detalles del proyecto en la vista de detalle
function mostrarDetalleProyecto(proyecto) {
  console.log('📝 Mostrando datos del proyecto:', proyecto.nombre);
  
  // Ocultar todas las vistas y mostrar solo la de detalle
  const mainView = document.querySelector('.projects-main');
  const listView = document.getElementById('projectsListView');
  const detailView = document.getElementById('projectDetailView');
  
  if (!detailView) {
    console.error('❌ No se encontró la vista de detalle');
    return;
  }
  
  // Ocultar todas las demás vistas
  if (mainView) mainView.style.display = 'none';
  if (listView) listView.style.display = 'none';
  
  // Mostrar vista de detalle
  detailView.style.display = 'block';
  
  // Actualizar título y ubicación
  const detailTitle = document.getElementById('detailTitle');
  const detailLocation = document.getElementById('detailLocation');
  const detailDateText = document.getElementById('detailDateText');
  const statusText = document.getElementById('statusText');
  const detailMainImage = document.getElementById('detailMainImage');
  const detailDescription = document.getElementById('detailDescription');
  
  if (detailTitle) detailTitle.textContent = proyecto.nombre;
  if (detailLocation) detailLocation.textContent = proyecto.ubicacion;
  if (detailDateText) detailDateText.textContent = proyecto.fecha_display || proyecto.fecha;
  if (statusText) statusText.textContent = proyecto.estado_display || proyecto.estado;
  
  // Actualizar imagen principal
  if (detailMainImage && proyecto.evidencias && proyecto.evidencias.length > 0) {
    const primeraImagen = proyecto.evidencias.find(e => e.es_imagen);
    if (primeraImagen) {
      detailMainImage.src = primeraImagen.url;
    } else {
      detailMainImage.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
  }
  
  // Actualizar descripción
  if (detailDescription) {
    detailDescription.innerHTML = `<p>${proyecto.descripcion || 'Sin descripción disponible'}</p>`;
  }
  
  // Actualizar personal a cargo
  const detailPersonnelInfo = document.getElementById('detailPersonnelInfo');
  if (detailPersonnelInfo && proyecto.personal) {
    if (proyecto.personal.length === 0) {
      detailPersonnelInfo.innerHTML = '<p style="color: #6c757d;">No hay personal asignado a este proyecto.</p>';
    } else {
      detailPersonnelInfo.innerHTML = proyecto.personal.map(persona => `
        <div class="personnel-card" style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #007bff;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h4 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1.1rem;">${persona.nombre}</h4>
              <p style="margin: 4px 0; color: #007bff; font-weight: 500;">${persona.puesto}</p>
              <p style="margin: 4px 0; color: #b8c5d1; font-size: 0.9rem;">Rol: ${persona.rol_display}</p>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
  
  // Actualizar galería de imágenes
  const detailGallery = document.getElementById('detailGallery');
  if (detailGallery && proyecto.evidencias) {
    const imagenes = proyecto.evidencias.filter(e => e.es_imagen);
    if (imagenes.length === 0) {
      detailGallery.innerHTML = '<p style="color: #6c757d; grid-column: 1 / -1;">No hay imágenes disponibles.</p>';
    } else {
      detailGallery.innerHTML = imagenes.map(img => `
        <div class="gallery-item" style="position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 16/9;">
          <img src="${img.url}" alt="${img.nombre}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
          ${img.descripcion ? `<div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 8px; color: white; font-size: 0.85rem;">${img.descripcion}</div>` : ''}
        </div>
      `).join('');
    }
  }
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  console.log('✅ Vista de detalle actualizada');
}

// Función para generar elementos de lista
function generateListItems(projects, showType = false) {
  return projects.map(project => `
    <div class="list-item">
      <div class="list-item-content">
        <div class="list-item-header">
          <h3 class="list-item-title">${project.name}</h3>
          ${showType ? `<span class="list-item-type">${project.type}</span>` : ''}
        </div>
        <div class="list-item-details">
          <div class="list-item-location">
            <svg class="location-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${project.location}
          </div>
          <div class="list-item-dates">
            <div class="list-item-date">
              <strong>Creado:</strong> ${formatDate(project.createdDate)}
            </div>
            <div class="list-item-date">
              <strong>Modificado:</strong> ${formatDate(project.modifiedDate)}
            </div>
          </div>
        </div>
      </div>
      <div class="list-item-actions">
        <button class="list-item-btn" data-project-id="${project.id}">Ver más</button>
      </div>
    </div>
  `).join('');
}

// Función para mostrar vista de lista
function showListView(category = null) {
  console.log('Intentando mostrar vista de lista, categoría:', category);
  
  const mainView = document.querySelector('.projects-main');
  const listView = document.getElementById('projectsListView');
  const listTitle = document.getElementById('listTitle');
  const listSubtitle = document.getElementById('listSubtitle');
  const projectsList = document.getElementById('projectsList');

  console.log('Elementos encontrados:');
  console.log('- Vista principal:', mainView ? 'Sí' : 'No');
  console.log('- Vista de lista:', listView ? 'Sí' : 'No');
  console.log('- Título de lista:', listTitle ? 'Sí' : 'No');
  console.log('- Subtítulo de lista:', listSubtitle ? 'Sí' : 'No');
  console.log('- Lista de proyectos:', projectsList ? 'Sí' : 'No');

  if (!listView) {
    console.error('No se encontró la vista de lista');
    return;
  }

  // Ocultar vista principal
  if (mainView) mainView.style.display = 'none';
  
  // Mostrar vista de lista
  listView.style.display = 'block';

  let projects = [];
  let title = '';
  let subtitle = '';

  if (category) {
    // Mostrar proyectos de una categoría específica
    projects = projectsData[category] || [];
    const categoryNames = {
      'capacitaciones': 'Capacitaciones',
      'entregas': 'Entregas',
      'proyectos-ayuda': 'Proyectos de Ayuda'
    };
    title = categoryNames[category] || 'Categoría';
    subtitle = `Lista completa de ${title.toLowerCase()}`;
  } else {
    // Mostrar todos los proyectos
    projects = [
      ...projectsData.capacitaciones,
      ...projectsData.entregas,
      ...projectsData['proyectos-ayuda']
    ];
    title = 'Todos los Proyectos';
    subtitle = 'Lista completa de proyectos y eventos';
  }

  // Actualizar títulos
  listTitle.textContent = title;
  listSubtitle.textContent = subtitle;

  // Generar y mostrar lista
  projectsList.innerHTML = generateListItems(projects, !category);

  // Agregar event listeners a los botones "Ver más" de la lista
  setTimeout(() => {
    addViewMoreListeners();
  }, 100);

  // Scroll al inicio
  window.scrollTo(0, 0);
}

// Función para volver a la vista principal
function showMainView() {
  const mainView = document.querySelector('.projects-main');
  const listView = document.getElementById('projectsListView');

  // Ocultar vista de lista
  listView.style.display = 'none';
  
  // Mostrar vista principal
  mainView.style.display = 'block';

  // Scroll al inicio
  window.scrollTo(0, 0);
}

// Función para hacer scroll suave a una sección
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Calcular la posición considerando el header fijo
    const headerHeight = document.querySelector('.topbar').offsetHeight + 
                        document.querySelector('.nav').offsetHeight;
    const sectionTop = section.offsetTop - headerHeight - 20; // 20px de margen adicional
    
    window.scrollTo({
      top: sectionTop,
      behavior: 'smooth'
    });

    // Agregar efecto de resaltado temporal
    section.classList.add('scroll-highlight');
    
    // Remover el efecto después de 3 segundos
    setTimeout(() => {
      section.classList.remove('scroll-highlight');
    }, 3000);
  }
}

// Función para manejar el scroll automático desde URL
function handleUrlAnchor() {
  const hash = window.location.hash;
  if (hash) {
    // Remover el # del hash
    const sectionId = hash.substring(1);
    
    // Esperar un poco para que la página se cargue completamente
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 300); // Aumentado el tiempo para asegurar que todo esté cargado
  }
}

// ======= FUNCIONALIDAD DE VISTA DETALLADA =======

// Datos de proyectos detallados (simulados)
const projectDetails = {
  'proyecto-1': {
    title: 'ESCUELA #297',
    location: 'Centro Escolar Lotificación Campo Verde',
    date: 'octubre 17, 2025',
    type: 'Capacitación',
    status: 'En ejecución',
    mainImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    personnel: [
      { name: 'Juan Pérez', role: 'Coordinador Principal', id: 'juan-perez' },
      { name: 'María Gómez', role: 'Técnica Agrícola', id: 'maria-gomez' }
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Vista general del proyecto' },
      { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Trabajos en progreso' },
      { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Detalle de construcción' },
      { url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Materiales utilizados' }
    ],
    data: [
      { icon: '😊', label: 'Cantidad de estudiantes', value: '31' },
      { icon: '💰', label: 'Monto de inversión', value: '$ 601 mil' },
      { icon: '📏', label: 'Área de construcción', value: '390 m²' },
      { icon: '🏢', label: 'Institución ejecutora', value: 'Dirección General de Centros Penales' },
      { icon: '🎓', label: 'Nivel educativo', value: 'Parvularia a Básica' }
    ],
    files: [
      {
        id: 'file_1',
        name: 'Plan de Construcción',
        description: 'Documento técnico con los planos y especificaciones del proyecto',
        originalName: 'plan_construccion_escuela_297.pdf',
        size: 2048576,
        type: 'application/pdf',
        extension: 'pdf',
        uploadDate: '2024-11-15T10:30:00Z',
        url: '#'
      },
      {
        id: 'file_2',
        name: 'Presupuesto Detallado',
        description: 'Desglose completo de costos y materiales del proyecto',
        originalName: 'presupuesto_detallado.xlsx',
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        uploadDate: '2024-11-20T14:15:00Z',
        url: '#'
      },
      {
        id: 'file_3',
        name: 'Acta de Inicio',
        description: 'Documento oficial que marca el inicio de las obras',
        originalName: 'acta_inicio_obras.docx',
        size: 256000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        uploadDate: '2024-11-25T09:45:00Z',
        url: '#'
      }
    ],
    communities: [
      { name: 'Comunidad San José', region: 'Región Norte' },
      { name: 'Comunidad El Progreso', region: 'Región Norte' },
      { name: 'Comunidad La Esperanza', region: 'Región Sur' }
    ],
    description: `
      <p>El proyecto consiste en la escarificación de paredes para retirar las capas de pintura en mal estado y preparar las superficies para repello, afinado y aplicación de nueva pintura, logrando un acabado uniforme y de alta calidad.</p>
      <p>De manera simultánea, se nivelarán los pisos interiores y se coloca porcelanato de alto tráfico, que aporta mayor resistencia y una imagen renovada a los espacios.</p>
    `,
    changes: [
      { 
        date: '2024-01-15 14:30', 
        description: 'Inicio de trabajos de escarificación de paredes', 
        personnel: 'Juan Pérez',
        evidences: [
          {
            id: 'evidence_1',
            name: 'antes_escarificacion.jpg',
            description: 'Estado de las paredes antes de la escarificación',
            type: 'image/jpeg',
            size: 2048000,
            url: 'https://via.placeholder.com/300x200/FF5722/white?text=Antes+Escarificación',
            uploadDate: '2024-01-15T14:30:00Z'
          }
        ]
      },
      { 
        date: '2024-01-16 09:15', 
        description: 'Aplicación de primera capa de repello', 
        personnel: 'María Gómez',
        evidences: []
      },
      { 
        date: '2024-01-17 11:45', 
        description: 'Instalación de porcelanato en aulas principales', 
        personnel: 'Juan Pérez',
        evidences: [
          {
            id: 'evidence_2',
            name: 'porcelanato_instalado.jpg',
            description: 'Porcelanato instalado en aula principal',
            type: 'image/jpeg',
            size: 1856000,
            url: 'https://via.placeholder.com/300x200/4CAF50/white?text=Porcelanato+Instalado',
            uploadDate: '2024-01-17T11:45:00Z'
          },
          {
            id: 'evidence_3',
            name: 'detalle_instalacion.jpg',
            description: 'Detalle de la instalación del porcelanato',
            type: 'image/jpeg',
            size: 1920000,
            url: 'https://via.placeholder.com/300x200/2196F3/white?text=Detalle+Instalación',
            uploadDate: '2024-01-17T12:00:00Z'
          }
        ]
      },
      { 
        date: '2024-01-18 16:20', 
        description: 'Aplicación de pintura base en todas las paredes', 
        personnel: 'María Gómez',
        evidences: []
      }
    ]
  },
  '1': {
    title: 'CAPACITACIÓN TÉCNICA AVANZADA',
    location: 'Los Pinos, Región 3',
    date: 'noviembre 28, 2024',
    type: 'Capacitación',
    status: 'Completado',
    mainImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Capacitación técnica' }
    ],
    data: [
      { icon: '👥', label: 'Participantes', value: '30 técnicos' },
      { icon: '⏱️', label: 'Duración', value: '6 horas' },
      { icon: '🎯', label: 'Objetivo', value: 'Mejorar técnicas agrícolas' },
      { icon: '📊', label: 'Evaluación', value: '95% aprobación' }
    ],
    communities: [
      { name: 'Los Pinos', region: 'Región 3' }
    ],
    description: `
      <p>Capacitación especializada en técnicas avanzadas de cultivo y manejo de suelos para técnicos agrícolas de la región.</p>
      <p>Se incluyeron módulos sobre agricultura sostenible, manejo integrado de plagas y técnicas de riego eficiente.</p>
    `,
    changes: [
      { date: '2024-11-15 08:00', description: 'Inicio de la capacitación técnica' },
      { date: '2024-11-15 10:30', description: 'Módulo de agricultura sostenible' },
      { date: '2024-11-15 14:00', description: 'Práctica de técnicas de riego' },
      { date: '2024-11-15 16:00', description: 'Evaluación final y certificación' }
    ]
  },
  '2': {
    title: 'TALLER DE DESARROLLO COMUNITARIO',
    location: 'Aldea San Miguel, Región 1',
    date: 'noviembre 25, 2024',
    type: 'Capacitación',
    status: 'Completado',
    mainImage: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    personnel: [
      { name: 'Carlos Rodríguez', role: 'Especialista en Proyectos', id: 'carlos-rodriguez' }
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Taller comunitario' }
    ],
    data: [
      { icon: '👥', label: 'Participantes', value: '45 líderes comunitarios' },
      { icon: '⏱️', label: 'Duración', value: '8 horas' }
    ],
    communities: [
      { name: 'Aldea San Miguel', region: 'Región 1' }
    ],
    description: `
      <p>Taller integral de desarrollo comunitario enfocado en fortalecer las capacidades de liderazgo y organización comunitaria.</p>
    `,
    changes: [
      { date: '2024-11-10 16:00', description: 'Clausura y entrega de certificados', personnel: 'Carlos Rodríguez' }
    ]
  },
  '3': {
    title: 'CURSO DE AGRICULTURA SOSTENIBLE',
    location: 'Centro Panchisivic, Región 8',
    date: 'noviembre 20, 2024',
    type: 'Capacitación',
    status: 'En ejecución',
    mainImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    personnel: [
      { name: 'Ana Martínez', role: 'Supervisora de Campo', id: 'ana-martinez' }
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Curso de agricultura' }
    ],
    data: [
      { icon: '👥', label: 'Participantes', value: '20 agricultores' },
      { icon: '⏱️', label: 'Duración', value: '12 horas' }
    ],
    communities: [
      { name: 'Centro Panchisivic', region: 'Región 8' }
    ],
    description: `
      <p>Curso especializado en agricultura sostenible y técnicas orgánicas de cultivo para mejorar la productividad sin dañar el medio ambiente.</p>
    `,
    changes: [
      { date: '2024-11-05 16:00', description: 'Sesión de preguntas y respuestas', personnel: 'Ana Martínez' }
    ]
  }
};

// Función para mostrar la vista detallada
function showProjectDetail(projectId) {
  console.log('🔍 Mostrando detalle del proyecto:', projectId);
  
  const mainView = document.querySelector('.projects-main');
  const listView = document.getElementById('projectsListView');
  const detailView = document.getElementById('projectDetailView');
  
  if (!detailView) {
    console.error('❌ No se encontró la vista detallada');
    return;
  }
  
  // Ocultar otras vistas
  if (mainView) mainView.style.display = 'none';
  if (listView) listView.style.display = 'none';
  
  // Mostrar vista detallada (con indicador de carga)
  detailView.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo(0, 0);
  
  // Cargar datos del proyecto desde la API
  console.log('📡 Cargando datos desde la API...');
  loadProjectDetails(projectId);
}

// Función para cargar los datos del proyecto en la vista detallada
function loadProjectDetail(project) {
  // Actualizar las variables globales
  currentProjectData = project;
  
  // Título y ubicación
  document.getElementById('detailTitle').textContent = project.title;
  document.getElementById('detailLocation').textContent = project.location;
  document.getElementById('detailDateText').textContent = project.date;
  
  // Imagen principal
  const mainImage = document.getElementById('detailMainImage');
  mainImage.src = project.mainImage;
  mainImage.alt = `Imagen principal de ${project.title}`;
  
  // Estado
  document.getElementById('statusText').textContent = project.status;
  
  // Personal a cargo
  if (project.personnel) {
    loadPersonnelInfo(project.personnel);
  }
  
  // Galería de imágenes
  if (project.gallery) {
    loadGalleryWithDescriptions(project.gallery);
  }
  
  // Datos del proyecto
  const dataContainer = document.getElementById('detailData');
  dataContainer.innerHTML = '';
  project.data.forEach(item => {
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
  
  // Ubicación
  if (project.communities) {
    loadCommunities(project.communities);
  }
  
  // Descripción
  document.getElementById('detailDescription').innerHTML = project.description;
  
  // Cambios realizados
  if (project.changes) {
    loadChangesWithPersonnel(project.changes);
  }
  
  // Archivos del proyecto
  if (project.files) {
    loadProjectFiles(project.files);
  } else {
    loadProjectFiles([]);
  }
}

// Función para abrir modal de imagen (placeholder)
function openImageModal(imageUrl) {
  // Por ahora, abrir en nueva pestaña
  window.open(imageUrl, '_blank');
}

// Función para volver a la vista principal desde la vista detallada
function backFromDetail() {
  console.log('🔙 Volviendo a la vista principal');
  
  const mainView = document.querySelector('.projects-main');
  const listView = document.getElementById('projectsListView');
  const detailView = document.getElementById('projectDetailView');
  
  // Ocultar vistas de detalle y lista
  if (detailView) detailView.style.display = 'none';
  if (listView) listView.style.display = 'none';
  
  // Mostrar vista principal
  if (mainView) mainView.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

// Event listener para el botón de volver desde la vista detallada
document.getElementById('btnBackFromDetail').addEventListener('click', backFromDetail);

// Función para agregar event listeners a los botones "Ver más"
function addViewMoreListeners() {
  console.log('Configurando event listeners para botones Ver más');
  
  // Buscar todos los botones "Ver más" en las tarjetas
  const viewMoreButtons = document.querySelectorAll('.project-card .project-btn');
  console.log('Botones de tarjetas encontrados:', viewMoreButtons.length);
  viewMoreButtons.forEach(button => {
    // Remover event listeners existentes
    button.removeEventListener('click', handleProjectCardClick);
    // Agregar nuevo event listener
    button.addEventListener('click', handleProjectCardClick);
  });

  // Buscar todos los botones "Ver más" en la lista
  const listViewMoreButtons = document.querySelectorAll('.list-item-btn');
  console.log('Botones de lista encontrados:', listViewMoreButtons.length);
  listViewMoreButtons.forEach(button => {
    // Remover event listeners existentes
    button.removeEventListener('click', handleListItemClick);
    // Agregar nuevo event listener
    button.addEventListener('click', handleListItemClick);
  });
}

// Función para manejar clicks en botones de tarjetas
function handleProjectCardClick(e) {
  e.preventDefault();
  const projectId = this.getAttribute('data-project-id') || 'proyecto-1';
  console.log('Navegando a proyecto desde tarjeta:', projectId);
  showProjectDetail(projectId);
}

// Función para manejar clicks en botones de lista
function handleListItemClick(e) {
  e.preventDefault();
  const projectId = this.getAttribute('data-project-id');
  if (projectId) {
    console.log('Navegando a proyecto desde lista:', projectId);
    showProjectDetail(projectId);
  }
}

// Variables globales para almacenar datos del proyecto actual
let currentProjectData = null;
let currentProjectId = null;
let pendingAction = null; // Para almacenar la acción pendiente después de verificar credenciales

// Sistema de permisos manejado por permisos.js y el backend

// ======= DATOS FICTICIOS =======
const availableCommunities = [
  { id: 1, name: 'San José', region: 'Región Norte' },
  { id: 2, name: 'Los Pinos', region: 'Región Norte' },
  { id: 3, name: 'El Progreso', region: 'Región Norte' },
  { id: 4, name: 'Centro Panchisivic', region: 'Región Sur' },
  { id: 5, name: 'Eben-Ezer', region: 'Región Sur' },
  { id: 6, name: 'Suquinay II', region: 'Región Sur' },
  { id: 7, name: 'Los Ángeles', region: 'Región Este' },
  { id: 8, name: 'El Chol', region: 'Región Este' },
  { id: 9, name: 'San Antonio', region: 'Región Oeste' },
  { id: 10, name: 'Las Flores', region: 'Región Oeste' }
];

// ======= TARJETAS PREDEFINIDAS =======
const predefinedCards = [
  { id: 'participants', icon: '👥', label: 'Participantes', placeholder: 'Ej: 30 técnicos', category: 'General' },
  { id: 'duration', icon: '⏱️', label: 'Duración', placeholder: 'Ej: 6 horas', category: 'General' },
  { id: 'objective', icon: '🎯', label: 'Objetivo', placeholder: 'Ej: Mejorar técnicas agrícolas', category: 'General' },
  { id: 'evaluation', icon: '📊', label: 'Evaluación', placeholder: 'Ej: 95% aprobación', category: 'General' },
  { id: 'budget', icon: '💰', label: 'Presupuesto', placeholder: 'Ej: $50,000', category: 'Financiero' },
  { id: 'area', icon: '📏', label: 'Área', placeholder: 'Ej: 2 hectáreas', category: 'Físico' },
  { id: 'institution', icon: '🏢', label: 'Institución Ejecutora', placeholder: 'Ej: MAGA', category: 'Institucional' },
  { id: 'level', icon: '🎓', label: 'Nivel Educativo', placeholder: 'Ej: Básico', category: 'Educativo' },
  { id: 'beneficiaries', icon: '👨‍👩‍👧‍👦', label: 'Beneficiarios', placeholder: 'Ej: 50 familias', category: 'Social' },
  { id: 'materials', icon: '🔧', label: 'Materiales', placeholder: 'Ej: Semillas, herramientas', category: 'Recursos' },
  { id: 'location', icon: '📍', label: 'Ubicación Específica', placeholder: 'Ej: Campo experimental', category: 'Físico' },
  { id: 'schedule', icon: '📅', label: 'Cronograma', placeholder: 'Ej: 3 meses', category: 'Temporal' },
  { id: 'methodology', icon: '📋', label: 'Metodología', placeholder: 'Ej: Práctica participativa', category: 'Técnico' },
  { id: 'results', icon: '✅', label: 'Resultados Esperados', placeholder: 'Ej: 80% de éxito', category: 'Evaluación' },
  { id: 'sustainability', icon: '🌱', label: 'Sostenibilidad', placeholder: 'Ej: 5 años', category: 'Ambiental' }
];

const availablePersonnel = [
  { id: 1, name: 'María González', role: 'Coordinadora de Proyectos' },
  { id: 2, name: 'Carlos Rodríguez', role: 'Técnico Agrícola' },
  { id: 3, name: 'Ana Martínez', role: 'Supervisora de Campo' },
  { id: 4, name: 'Luis Hernández', role: 'Especialista en Desarrollo' },
  { id: 5, name: 'Carmen López', role: 'Facilitadora Comunitaria' },
  { id: 6, name: 'Roberto Silva', role: 'Ingeniero Agrónomo' },
  { id: 7, name: 'Patricia Morales', role: 'Coordinadora de Capacitaciones' },
  { id: 8, name: 'Miguel Torres', role: 'Técnico de Campo' },
  { id: 9, name: 'Sofia Ramírez', role: 'Especialista en Sostenibilidad' },
  { id: 10, name: 'Diego Castro', role: 'Coordinador Regional' }
];
let selectedCommunity = null;
let selectedPersonnel = null;
let pendingDeleteAction = null;
let pendingDeleteData = null;

// Función para obtener el proyecto actual
function getCurrentProject() {
  // Usar currentProjectData si está disponible
  if (currentProjectData) {
    return currentProjectData;
  }
  
  // Fallback al proyecto por ID
  if (currentProjectId && projectDetails[currentProjectId]) {
    return projectDetails[currentProjectId];
  }
  
  // Fallback al primer proyecto si no hay uno seleccionado
  return projectDetails['proyecto-1'];
}

// Función para establecer el proyecto actual
function setCurrentProject(projectId) {
  currentProjectId = projectId;
  if (projectDetails[projectId]) {
    currentProjectData = projectDetails[projectId];
  }
}

// Función para actualizar los datos del proyecto
function updateProjectData(newData) {
  if (currentProjectData) {
    Object.assign(currentProjectData, newData);
  }
}

// Función para agregar comunidad
function addCommunityToProject(communityName) {
  const currentProject = getCurrentProject();
  if (!currentProject.communities) {
    currentProject.communities = [];
  }
  
  // Verificar si ya existe
  const exists = currentProject.communities.some(c => c.name === communityName);
  if (!exists) {
    currentProject.communities.push({
      name: communityName,
      region: 'Región por definir'
    });
    
    // Actualizar la vista
    loadProjectDetail(currentProject);
    showSuccessMessage('Comunidad agregada exitosamente');
  } else {
    showErrorMessage('Esta comunidad ya está agregada al proyecto');
  }
}

// Función para agregar personal
function addPersonnelToProject(personnelData) {
  const currentProject = getCurrentProject();
  if (!currentProject.personnel) {
    currentProject.personnel = [];
  }
  
  // Verificar si ya existe
  const exists = currentProject.personnel.some(p => p.id === personnelData.id);
  if (!exists) {
    currentProject.personnel.push(personnelData);
    
    // Actualizar la vista
    loadProjectDetail(currentProject);
    showSuccessMessage('Personal agregado exitosamente');
  } else {
    showErrorMessage('Este personal ya está agregado al proyecto');
  }
}

// Función para agregar imagen
function addImageToProject(imageData) {
  const currentProject = getCurrentProject();
  if (!currentProject.gallery) {
    currentProject.gallery = [];
  }
  
  currentProject.gallery.push(imageData);
  
  // Actualizar la vista
  loadProjectDetail(currentProject);
  showSuccessMessage('Imagen agregada exitosamente');
}

// Función para agregar cambio
function addChangeToProject(changeData) {
  const currentProject = getCurrentProject();
  if (!currentProject.changes) {
    currentProject.changes = [];
  }
  
  currentProject.changes.push(changeData);
  
  // Actualizar la vista
  loadProjectDetail(currentProject);
  showSuccessMessage('Cambio agregado exitosamente');
}

// Función para actualizar descripción
function updateProjectDescription(newDescription) {
  const currentProject = getCurrentProject();
  currentProject.description = newDescription;
  
  // Actualizar la vista
  loadProjectDetail(currentProject);
  showSuccessMessage('Descripción actualizada exitosamente');
}

// Función para actualizar datos del proyecto
function updateProjectData(newData) {
  const currentProject = getCurrentProject();
  Object.assign(currentProject, newData);
  
  // Actualizar la vista
  loadProjectDetail(currentProject);
  showSuccessMessage('Datos actualizados exitosamente');
}

// Función para mostrar modal
function showModal(modalId) {
  console.log('showModal() llamada con ID:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    console.log('Modal encontrado, agregando clase active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('Modal mostrado correctamente');
  } else {
    console.error('Modal no encontrado:', modalId);
  }
}

// Función para ocultar modal
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Función para mostrar modal de credenciales
function showCredentialsModal(callback = null) {
  // Limpiar campos antes de mostrar el modal
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminPassword').value = '';
  
  // Ocultar mensaje de error si existe
  const errorElement = document.getElementById('credentialsError');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
  
  // Guardar callback si se proporciona
  if (callback) {
    pendingAction = callback;
  }
  
  showModal('adminCredentialsModal');
}

// Función para verificar credenciales
function verifyCredentials() {
  console.log('verifyCredentials() llamada');
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  
  console.log('Credenciales ingresadas:', { username, password });
  console.log('Credenciales esperadas:', ADMIN_CREDENTIALS);
  console.log('Acción pendiente:', pendingAction);
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    console.log('Credenciales correctas, ejecutando acción pendiente');
    // Limpiar campos antes de cerrar
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    
    // Ocultar mensaje de error
    const errorElement = document.getElementById('credentialsError');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    
    hideModal('adminCredentialsModal');
    
    // Ejecutar la acción pendiente
    if (typeof pendingAction === 'function') {
      // Si es un callback, ejecutarlo
      pendingAction();
    } else if (pendingAction === 'addPersonnel') {
      console.log('Ejecutando showAddPersonnelModal()');
      showAddPersonnelModal();
    } else if (pendingAction === 'editData') {
      console.log('Ejecutando showEditDataModal()');
      showEditDataModal();
    }
    
    // Limpiar la acción pendiente
    pendingAction = null;
  } else {
    console.log('Credenciales incorrectas');
    // Mostrar mensaje de error en el modal
    const errorElement = document.getElementById('credentialsError');
    if (errorElement) {
      errorElement.style.display = 'block';
    } else {
      showErrorMessage('Credenciales incorrectas');
    }
  }
}

// Función para mostrar mensaje de éxito
function showSuccessMessage(message) {
  // Crear elemento de mensaje
  const messageElement = document.createElement('div');
  messageElement.className = 'success-message';
  messageElement.textContent = message;
  
  // Agregar al body
  document.body.appendChild(messageElement);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 3000);
}

// Función para mostrar mensaje de error
function showErrorMessage(message) {
  // Crear elemento de mensaje
  const messageElement = document.createElement('div');
  messageElement.className = 'error-message';
  messageElement.textContent = message;
  
  // Agregar al body
  document.body.appendChild(messageElement);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 3000);
}

// Función para cargar personal en la vista detallada
function loadPersonnelInfo(personnel) {
  const container = document.getElementById('detailPersonnelInfo');
  if (!container) return;

  container.innerHTML = '';
  
  personnel.forEach(person => {
    const personnelItem = document.createElement('div');
    personnelItem.className = 'personnel-item';
    personnelItem.innerHTML = `
      <div class="personnel-info">
        <h4 class="personnel-name">${person.name}</h4>
        <p class="personnel-role">${person.role}</p>
      </div>
      <button class="btn-remove-item" data-personnel-id="${person.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    container.appendChild(personnelItem);
  });
}

// Función para cargar galería con descripciones
function loadGalleryWithDescriptions(gallery) {
  const container = document.getElementById('detailGallery');
  if (!container) return;

  container.innerHTML = '';
  
  gallery.forEach((image, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'gallery-item';
    imageItem.innerHTML = `
      <img src="${image.url}" alt="${image.description}" onclick="openImageModal('${image.url}')">
      <div class="image-description">${image.description}</div>
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

// Función para cargar comunidades
function loadCommunities(communities) {
  const container = document.getElementById('detailLocationInfo');
  if (!container) return;

  container.innerHTML = '';
  
  communities.forEach((community, index) => {
    const locationItem = document.createElement('div');
    locationItem.className = 'location-item';
    locationItem.innerHTML = `
      <div class="location-icon">📍</div>
      <div class="location-content">
        <h4>${community.name}</h4>
        <p>${community.region}</p>
      </div>
      <button class="btn-remove-item" data-community-index="${index}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    container.appendChild(locationItem);
  });
}

// Función para cargar cambios con personal
function loadChangesWithPersonnel(changes) {
  const container = document.getElementById('detailChanges');
  if (!container) return;

  container.innerHTML = '';
  
  changes.forEach((change, index) => {
    const changeItem = document.createElement('div');
    changeItem.className = 'change-item clickable';
    changeItem.setAttribute('data-change-index', index);
    changeItem.innerHTML = `
      <div class="change-content">
        <div class="change-date">${change.date}</div>
        <div class="change-description">${change.description}</div>
        <div class="change-personnel">Por: ${change.personnel}</div>
        ${change.evidences && change.evidences.length > 0 ? 
          `<div class="change-evidences-count">${change.evidences.length} evidencia(s)</div>` : 
          '<div class="change-evidences-count">Sin evidencias</div>'
        }
      </div>
      <button class="btn-remove-item" data-change-index="${index}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    container.appendChild(changeItem);
  });
  
  // Agregar event listeners para mostrar detalles
  container.addEventListener('click', function(e) {
    if (e.target.closest('.change-item.clickable') && !e.target.closest('.btn-remove-item')) {
      const changeItem = e.target.closest('.change-item.clickable');
      const changeIndex = parseInt(changeItem.getAttribute('data-change-index'));
      showChangeDetailsModal(changes[changeIndex], changeIndex);
    }
  });
}

// Función para mostrar modal de agregar imagen
function showAddImageModal() {
  showModal('addImageModal');
  clearImageForm();
}

// Función para limpiar formulario de imagen
function clearImageForm() {
  document.getElementById('imageFileInput').value = '';
  document.getElementById('imageDescription').value = '';
  document.getElementById('imagePreview').style.display = 'none';
}

// Función para manejar selección de imagen
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('imagePreview').src = e.target.result;
      document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// Función para agregar imagen al proyecto
function addImageToProject() {
  const fileInput = document.getElementById('imageFileInput');
  const description = document.getElementById('imageDescription').value;
  
  if (!fileInput.files[0]) {
    showErrorMessage('Por favor selecciona una imagen');
    return;
  }
  
  if (!description.trim()) {
    showErrorMessage('Por favor ingresa una descripción');
    return;
  }
  
  const imageData = {
    url: URL.createObjectURL(fileInput.files[0]),
    description: description
  };
  
  addImageToProject(imageData);
  hideModal('addImageModal');
}

// Función para mostrar modal de editar descripción
function showEditDescriptionModal() {
  const currentProject = getCurrentProject();
  document.getElementById('editDescriptionText').value = currentProject.description.replace(/<[^>]*>/g, '');
  showModal('editDescriptionModal');
}

// Función para actualizar descripción del proyecto
function updateProjectDescription() {
  const newDescription = document.getElementById('editDescriptionText').value;
  
  if (!newDescription.trim()) {
    showErrorMessage('Por favor ingresa una descripción');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    currentProject.description = `<p>${newDescription}</p>`;
    document.getElementById('detailDescription').innerHTML = currentProject.description;
    showSuccessMessage('Descripción actualizada exitosamente');
    hideModal('editDescriptionModal');
  }
}

// Variables globales para el modal de edición de datos
let selectedCards = [];
let currentEditProject = null;

// Función para mostrar modal de editar datos
function showEditDataModal() {
  console.log('showEditDataModal() llamada');
  currentEditProject = getCurrentProject();
  console.log('Proyecto actual:', currentEditProject);
  
  // Cargar datos actuales de las tarjetas
  const dataCards = currentEditProject.data || [];
  console.log('Tarjetas de datos:', dataCards);
  
  // Convertir las tarjetas existentes al formato de tarjetas seleccionadas
  selectedCards = dataCards.map(card => ({
    id: card.id || generateCardId(),
    icon: card.icon,
    label: card.label,
    value: card.value,
    isCustom: card.isCustom || false
  }));
  
  // Cargar la interfaz del modal
  loadEditDataModal();
  
  console.log('Llamando a showModal con editDataModal');
  showModal('editDataModal');
}

// Función para cargar la interfaz del modal de edición
function loadEditDataModal() {
  // Cargar tarjetas predefinidas
  loadPredefinedCards();
  
  // Cargar tarjetas seleccionadas
  loadSelectedCards();
  
  // Configurar event listeners
  setupEditDataEventListeners();
}

// Función para cargar tarjetas predefinidas
function loadPredefinedCards() {
  const grid = document.getElementById('predefinedCardsGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  predefinedCards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'predefined-card';
    cardElement.dataset.cardId = card.id;
    
    // Verificar si ya está seleccionada
    const isSelected = selectedCards.some(selected => selected.label === card.label);
    if (isSelected) {
      cardElement.classList.add('selected');
    }
    
    cardElement.innerHTML = `
      <div class="predefined-card-icon">${card.icon}</div>
      <div class="predefined-card-info">
        <div class="predefined-card-label">${card.label}</div>
        <div class="predefined-card-category">${card.category}</div>
      </div>
    `;
    
    cardElement.addEventListener('click', () => togglePredefinedCard(card));
    grid.appendChild(cardElement);
  });
}

// Función para cargar tarjetas seleccionadas
function loadSelectedCards() {
  const container = document.getElementById('selectedCardsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  selectedCards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'selected-card';
    cardElement.dataset.index = index;
    
    cardElement.innerHTML = `
      <div class="selected-card-icon">${card.icon}</div>
      <div class="selected-card-info">
        <div class="selected-card-label">${card.label}</div>
        <div class="selected-card-value">
          <input type="text" value="${card.value}" placeholder="Ingresa el valor...">
        </div>
      </div>
      <button class="remove-card-btn" data-index="${index}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    container.appendChild(cardElement);
  });
}

// Función para alternar selección de tarjeta predefinida
function togglePredefinedCard(card) {
  const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
  const isSelected = selectedCards.some(selected => selected.label === card.label);
  
  if (isSelected) {
    // Remover de seleccionadas
    selectedCards = selectedCards.filter(selected => selected.label !== card.label);
    cardElement.classList.remove('selected');
  } else {
    // Agregar a seleccionadas
    selectedCards.push({
      id: card.id,
      icon: card.icon,
      label: card.label,
      value: '',
      isCustom: false
    });
    cardElement.classList.add('selected');
  }
  
  // Recargar tarjetas seleccionadas
  loadSelectedCards();
}

// Función para configurar event listeners del modal
function setupEditDataEventListeners() {
  // Pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      switchTab(tab);
    });
  });
  
  // Búsqueda de tarjetas
  const searchInput = document.getElementById('cardSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterPredefinedCards);
  }
  
  // Filtro de categorías
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterPredefinedCards);
  }
  
  // Botón de agregar tarjeta personalizada
  const addCustomBtn = document.getElementById('addCustomCardBtn');
  if (addCustomBtn) {
    addCustomBtn.addEventListener('click', addCustomCard);
  }
  
  // Event delegation para botones de eliminar
  document.addEventListener('click', (e) => {
    if (e.target.closest('.remove-card-btn')) {
      const index = parseInt(e.target.closest('.remove-card-btn').dataset.index);
      removeSelectedCard(index);
    }
  });
  
  // Event delegation para inputs de valor
  document.addEventListener('input', (e) => {
    if (e.target.closest('.selected-card-value input')) {
      const index = parseInt(e.target.closest('.selected-card').dataset.index);
      updateSelectedCardValue(index, e.target.value);
    }
  });
}

// Función para cambiar pestañas
function switchTab(tabName) {
  // Actualizar botones de pestaña
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Actualizar contenido de pestañas
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Función para filtrar tarjetas predefinidas
function filterPredefinedCards() {
  const searchTerm = document.getElementById('cardSearch').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const cards = document.querySelectorAll('.predefined-card');
  
  cards.forEach(card => {
    const label = card.querySelector('.predefined-card-label').textContent.toLowerCase();
    const category = card.querySelector('.predefined-card-category').textContent;
    
    const matchesSearch = label.includes(searchTerm);
    const matchesCategory = !categoryFilter || category === categoryFilter;
    
    if (matchesSearch && matchesCategory) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Función para agregar tarjeta personalizada
function addCustomCard() {
  const icon = document.getElementById('customIcon').value.trim();
  const label = document.getElementById('customLabel').value.trim();
  const value = document.getElementById('customValue').value.trim();
  
  if (!icon || !label || !value) {
    showErrorMessage('Por favor completa todos los campos');
    return;
  }
  
  // Verificar si ya existe una tarjeta con el mismo título
  if (selectedCards.some(card => card.label === label)) {
    showErrorMessage('Ya existe una tarjeta con este título');
    return;
  }
  
  // Agregar tarjeta personalizada
  selectedCards.push({
    id: generateCardId(),
    icon: icon,
    label: label,
    value: value,
    isCustom: true
  });
  
  // Limpiar formulario
  document.getElementById('customIcon').value = '';
  document.getElementById('customLabel').value = '';
  document.getElementById('customValue').value = '';
  
  // Recargar tarjetas seleccionadas
  loadSelectedCards();
  
  showSuccessMessage('Tarjeta personalizada agregada');
}

// Función para remover tarjeta seleccionada
function removeSelectedCard(index) {
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar este dato del proyecto?',
    () => {
      selectedCards.splice(index, 1);
      loadSelectedCards();
      
      // Actualizar estado de tarjetas predefinidas
      loadPredefinedCards();
    }
  );
}

// Función para actualizar valor de tarjeta seleccionada
function updateSelectedCardValue(index, value) {
  if (selectedCards[index]) {
    selectedCards[index].value = value;
  }
}

// Función para generar ID único para tarjetas
function generateCardId() {
  return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Función para limpiar formulario de datos
function clearDataForm() {
  document.getElementById('editProjectTitle').value = '';
  document.getElementById('editProjectLocation').value = '';
  document.getElementById('editProjectDate').value = '';
  document.getElementById('editProjectStatus').value = '';
}

// Función para actualizar datos del proyecto
function updateProjectData() {
  const participants = document.getElementById('editParticipants').value;
  const duration = document.getElementById('editDuration').value;
  const objective = document.getElementById('editObjective').value;
  const evaluation = document.getElementById('editEvaluation').value;
  
  if (!participants.trim() || !duration.trim() || !objective.trim() || !evaluation.trim()) {
    showErrorMessage('Por favor completa todos los campos');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    // Actualizar los datos de las tarjetas
    currentProject.data = [
      { icon: '👥', label: 'Participantes', value: participants },
      { icon: '⏱️', label: 'Duración', value: duration },
      { icon: '🎯', label: 'Objetivo', value: objective },
      { icon: '📊', label: 'Evaluación', value: evaluation }
    ];
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage('Datos actualizados exitosamente');
    hideModal('editDataModal');
  }
}

// Función para mostrar modal de agregar comunidad
function showAddCommunityModal() {
  showModal('addCommunityModal');
  loadCommunitiesList();
}

// Función para limpiar formulario de comunidad
function clearCommunityForm() {
  document.getElementById('communityName').value = '';
  document.getElementById('communityRegion').value = '';
}

// Función para agregar comunidad al proyecto
function addCommunityToProject() {
  const selectedCommunities = getSelectedCommunities();
  
  if (selectedCommunities.length === 0) {
    showErrorMessage('Por favor selecciona al menos una comunidad');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    if (!currentProject.communities) {
      currentProject.communities = [];
    }
    
    selectedCommunities.forEach(community => {
      const communityData = {
        name: community.name,
        region: community.region
      };
      currentProject.communities.push(communityData);
    });
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage(`${selectedCommunities.length} comunidad(es) agregada(s) exitosamente`);
    hideModal('addCommunityModal');
  }
}

// Función para mostrar modal de agregar personal
function showAddPersonnelModal() {
  showModal('addPersonnelModal');
  loadPersonnelList();
  
  // Configurar búsqueda de personal
  const searchInput = document.getElementById('personnelSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterPersonnelList);
  }
}

// Función para limpiar formulario de personal
function clearPersonnelForm() {
  document.getElementById('personnelName').value = '';
  document.getElementById('personnelRole').value = '';
}

// Función para agregar personal al proyecto
function addPersonnelToProject() {
  const selectedPersonnel = getSelectedPersonnel();
  
  if (selectedPersonnel.length === 0) {
    showErrorMessage('Por favor selecciona al menos un colaborador');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    if (!currentProject.personnel) {
      currentProject.personnel = [];
    }
    
    selectedPersonnel.forEach(person => {
      const personnelData = {
        name: person.name,
        role: person.role,
        id: person.name.toLowerCase().replace(/\s+/g, '-')
      };
      currentProject.personnel.push(personnelData);
    });
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage(`${selectedPersonnel.length} colaborador(es) agregado(s) exitosamente`);
    hideModal('addPersonnelModal');
  }
}

// Función para mostrar modal de agregar cambio
function showAddChangeModal() {
  showModal('addChangeModal');
  loadChangePersonnelList();
}

// Función para limpiar formulario de cambio
function clearChangeForm() {
  document.getElementById('changeDescription').value = '';
  document.getElementById('changePersonnel').value = '';
}

// Función para agregar cambio al proyecto
function addChangeToProject() {
  const description = document.getElementById('changeDescription').value;
  const selectedPersonnel = getSelectedChangePersonnel();
  
  if (!description.trim()) {
    showErrorMessage('Por favor ingresa una descripción del cambio');
    return;
  }
  
  if (selectedPersonnel.length === 0) {
    showErrorMessage('Por favor selecciona al menos un colaborador responsable');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    if (!currentProject.changes) {
      currentProject.changes = [];
    }
    
    const personnelNames = selectedPersonnel.map(p => p.name).join(', ');
    
    const changeData = {
      date: new Date().toLocaleString('es-GT'),
      description: description,
      personnel: personnelNames
    };
    
    currentProject.changes.push(changeData);
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage('Cambio agregado exitosamente');
    hideModal('addChangeModal');
  }
}

// Función para limpiar formulario de imagen
function clearImageForm() {
  document.getElementById('imageFileInput').value = '';
  document.getElementById('imageDescription').value = '';
  document.getElementById('imagePreview').innerHTML = '';
}

// Función para manejar selección de imagen
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('imagePreview').innerHTML = `
        <div class="image-preview-item">
          <img src="${e.target.result}" alt="Preview">
          <div class="image-description">Vista previa</div>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }
}

// Función para agregar imagen al proyecto
function addImageToProject() {
  const fileInput = document.getElementById('imageFileInput');
  const description = document.getElementById('imageDescription').value;
  
  if (!fileInput.files[0]) {
    showErrorMessage('Por favor selecciona una imagen');
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const imageData = {
      url: e.target.result,
      description: description || 'Imagen del proyecto'
    };
    
    // Agregar imagen al proyecto actual
    const currentProject = getCurrentProject();
    if (currentProject) {
      if (!currentProject.gallery) {
        currentProject.gallery = [];
      }
      currentProject.gallery.push(imageData);
      
      // Recargar la vista del proyecto
      loadProjectDetail(currentProject);
      showSuccessMessage('Imagen agregada exitosamente');
      hideModal('addImageModal');
    }
  };
  
  reader.readAsDataURL(file);
}

// Función para mostrar modal de editar descripción
function showEditDescriptionModal() {
  const currentProject = getCurrentProject();
  document.getElementById('editDescriptionText').value = currentProject.description.replace(/<[^>]*>/g, '');
  showModal('editDescriptionModal');
}

// Función para actualizar descripción del proyecto
function updateProjectDescription() {
  const newDescription = document.getElementById('editDescriptionText').value;
  
  if (!newDescription.trim()) {
    showErrorMessage('Por favor ingresa una descripción');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    currentProject.description = `<p>${newDescription}</p>`;
    document.getElementById('detailDescription').innerHTML = currentProject.description;
    showSuccessMessage('Descripción actualizada exitosamente');
    hideModal('editDescriptionModal');
  }
}


// Función para limpiar formulario de datos
function clearDataForm() {
  document.getElementById('editProjectTitle').value = '';
  document.getElementById('editProjectLocation').value = '';
  document.getElementById('editProjectDate').value = '';
  document.getElementById('editProjectStatus').value = '';
}

// Función para actualizar datos del proyecto
function updateProjectData() {
  const participants = document.getElementById('editParticipants').value;
  const duration = document.getElementById('editDuration').value;
  const objective = document.getElementById('editObjective').value;
  const evaluation = document.getElementById('editEvaluation').value;
  
  if (!participants.trim() || !duration.trim() || !objective.trim() || !evaluation.trim()) {
    showErrorMessage('Por favor completa todos los campos');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    // Actualizar los datos de las tarjetas
    currentProject.data = [
      { icon: '👥', label: 'Participantes', value: participants },
      { icon: '⏱️', label: 'Duración', value: duration },
      { icon: '🎯', label: 'Objetivo', value: objective },
      { icon: '📊', label: 'Evaluación', value: evaluation }
    ];
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage('Datos actualizados exitosamente');
    hideModal('editDataModal');
  }
}

// Función para mostrar modal de agregar comunidad
function showAddCommunityModal() {
  showModal('addCommunityModal');
  loadCommunitiesList();
}

// Función para limpiar formulario de comunidad
function clearCommunityForm() {
  document.getElementById('communityName').value = '';
  document.getElementById('communityRegion').value = '';
}

// Función para agregar comunidad al proyecto
function addCommunityToProject() {
  const selectedCommunities = getSelectedCommunities();
  
  if (selectedCommunities.length === 0) {
    showErrorMessage('Por favor selecciona al menos una comunidad');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    if (!currentProject.communities) {
      currentProject.communities = [];
    }
    
    selectedCommunities.forEach(community => {
      const communityData = {
        name: community.name,
        region: community.region
      };
      currentProject.communities.push(communityData);
    });
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage(`${selectedCommunities.length} comunidad(es) agregada(s) exitosamente`);
    hideModal('addCommunityModal');
  }
}

// Función para mostrar modal de agregar personal
function showAddPersonnelModal() {
  showModal('addPersonnelModal');
  loadPersonnelList();
  
  // Configurar búsqueda de personal
  const searchInput = document.getElementById('personnelSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterPersonnelList);
  }
}

// Función para limpiar formulario de personal
function clearPersonnelForm() {
  document.getElementById('personnelName').value = '';
  document.getElementById('personnelRole').value = '';
}

// Función para agregar personal al proyecto
function addPersonnelToProject() {
  const selectedPersonnel = getSelectedPersonnel();
  
  if (selectedPersonnel.length === 0) {
    showErrorMessage('Por favor selecciona al menos un colaborador');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    if (!currentProject.personnel) {
      currentProject.personnel = [];
    }
    
    selectedPersonnel.forEach(person => {
      const personnelData = {
        name: person.name,
        role: person.role,
        id: person.name.toLowerCase().replace(/\s+/g, '-')
      };
      currentProject.personnel.push(personnelData);
    });
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage(`${selectedPersonnel.length} colaborador(es) agregado(s) exitosamente`);
    hideModal('addPersonnelModal');
  }
}

// Función para mostrar modal de agregar cambio
function showAddChangeModal() {
  showModal('addChangeModal');
  loadChangePersonnelList();
}

// Función para limpiar formulario de cambio
function clearChangeForm() {
  document.getElementById('changeDescription').value = '';
  document.getElementById('changePersonnel').value = '';
}

// Función para agregar cambio al proyecto
function addChangeToProject() {
  const description = document.getElementById('changeDescription').value;
  const selectedPersonnel = getSelectedChangePersonnel();
  
  if (!description.trim()) {
    showErrorMessage('Por favor ingresa una descripción del cambio');
    return;
  }
  
  if (selectedPersonnel.length === 0) {
    showErrorMessage('Por favor selecciona al menos un colaborador responsable');
    return;
  }
  
  const currentProject = getCurrentProject();
  if (currentProject) {
    if (!currentProject.changes) {
      currentProject.changes = [];
    }
    
    const personnelNames = selectedPersonnel.map(p => p.name).join(', ');
    
    const changeData = {
      date: new Date().toLocaleString('es-GT'),
      description: description,
      personnel: personnelNames
    };
    
    currentProject.changes.push(changeData);
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage('Cambio agregado exitosamente');
    hideModal('addChangeModal');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado, configurando event listeners...');
  
  // Manejar anclas de URL al cargar la página
  handleUrlAnchor();

  // Botones "Ver todos" por categoría
  document.querySelectorAll('.btn-ver-todos').forEach(button => {
    button.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      console.log('Navegando a lista de categoría:', category);
      showListView(category);
    });
  });

  // Botón "Ver todos los eventos"
  const verTodosBtn = document.querySelector('.btn-ver-todos-eventos');
  if (verTodosBtn) {
    verTodosBtn.addEventListener('click', function() {
      console.log('Navegando a lista de todos los eventos');
      showListView();
    });
  }

  // Botón de regreso
  const btnBack = document.getElementById('btnBack');
  if (btnBack) {
    btnBack.addEventListener('click', function() {
      console.log('Volviendo a vista principal');
      showMainView();
    });
  }

  // Botón "Agregar nuevo"
  document.getElementById('btnAgregarNuevo').addEventListener('click', function() {
    // Mostrar confirmación antes de redirigir
  const confirmed = confirm('¿Está seguro que quiere crear un evento nuevo?\n\nAbandonará esta página y será redirigido al formulario de creación de eventos.');
  
  if (confirmed) {
    // Redirigir a la página de gestión de eventos con scroll automático al formulario de creación
    window.location.href = window.DJANGO_URLS.gestioneseventos + '#createEventView';
  }
  });

  // Escuchar cambios en el hash de la URL
  window.addEventListener('hashchange', function() {
    handleUrlAnchor();
  });

  // Agregar event listeners cuando se cargue la página
  console.log('Agregando event listeners para botones Ver más');
  addViewMoreListeners();
  
  // Event delegation para botones "Ver más"
  document.addEventListener('click', function(e) {
    // Verificar si es un botón "Ver más"
    if (e.target.classList.contains('project-btn')) {
      console.log('Botón Ver más clickeado!');
      e.preventDefault();
      const projectId = e.target.getAttribute('data-project-id');
      console.log('ID del proyecto:', projectId);
      if (projectId) {
        showProjectDetail(projectId);
      } else {
        console.error('No se encontró data-project-id en el botón');
      }
    }
  });
  
  // Verificar que los elementos existan
  setTimeout(() => {
    const projectCards = document.querySelectorAll('.project-card');
    const listItems = document.querySelectorAll('.list-item-btn');
    const verTodosBtns = document.querySelectorAll('.btn-ver-todos');
    const verTodosEventosBtn = document.querySelector('.btn-ver-todos-eventos');
    
    console.log('Elementos encontrados:');
    console.log('- Tarjetas de proyecto:', projectCards.length);
    console.log('- Botones de lista:', listItems.length);
    console.log('- Botones Ver todos:', verTodosBtns.length);
    console.log('- Botón Ver todos eventos:', verTodosEventosBtn ? 'Sí' : 'No');
  }, 1000);

  // ======= EVENT LISTENERS PARA LOS NUEVOS BOTONES =======
  
  // Inicializar datos del proyecto actual
  currentProjectData = getCurrentProject();

  // Botón Editar Evento
  const editEventBtn = document.getElementById('editEventBtn');
  if (editEventBtn) {
    editEventBtn.addEventListener('click', function() {
      window.location.href = window.DJANGO_URLS.gestioneseventos + '#manageEventView';
    });
  }

  // Botón Generar Reporte
  const generateReportBtn = document.getElementById('generateReportBtn');
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', function() {
      alert('Funcionalidad de generar reporte estará disponible próximamente');
    });
  }

  // Botones de agregar elementos
  const addCommunityBtn = document.getElementById('addCommunityBtn');
  if (addCommunityBtn) {
    addCommunityBtn.addEventListener('click', showAddCommunityModal);
  }

  const addPersonnelBtn = document.getElementById('addPersonnelBtn');
  if (addPersonnelBtn) {
    addPersonnelBtn.addEventListener('click', function() {
      pendingAction = 'addPersonnel';
      showCredentialsModal();
    });
  }

  const addImageBtn = document.getElementById('addImageBtn');
  if (addImageBtn) {
    addImageBtn.addEventListener('click', showAddImageModal);
  }

  const editDataBtn = document.getElementById('editDataBtn');
  if (editDataBtn) {
    editDataBtn.addEventListener('click', function() {
      pendingAction = 'editData';
      showCredentialsModal();
    });
  }

  const addChangeBtn = document.getElementById('addChangeBtn');
  if (addChangeBtn) {
    addChangeBtn.addEventListener('click', showAddChangeModal);
  }

  const addFileBtn = document.getElementById('addFileBtn');
  if (addFileBtn) {
    addFileBtn.addEventListener('click', showAddFileModal);
  }

  const editDescriptionBtn = document.getElementById('editDescriptionBtn');
  if (editDescriptionBtn) {
    editDescriptionBtn.addEventListener('click', showEditDescriptionModal);
  }

  // Event listeners para modales (ya están definidos más abajo)

  // Event listeners para credenciales
  const verifyCredentialsBtn = document.getElementById('verifyCredentialsBtn');
  if (verifyCredentialsBtn) {
    verifyCredentialsBtn.addEventListener('click', verifyCredentials);
  }

  const cancelCredentialsBtn = document.getElementById('cancelCredentialsBtn');
  if (cancelCredentialsBtn) {
    cancelCredentialsBtn.addEventListener('click', function() {
      // Limpiar campos antes de cerrar
      document.getElementById('adminUsername').value = '';
      document.getElementById('adminPassword').value = '';
      hideModal('adminCredentialsModal');
    });
  }

  const closeCredentialsModal = document.getElementById('closeCredentialsModal');
  if (closeCredentialsModal) {
    closeCredentialsModal.addEventListener('click', function() {
      // Limpiar campos antes de cerrar
      document.getElementById('adminUsername').value = '';
      document.getElementById('adminPassword').value = '';
      hideModal('adminCredentialsModal');
    });
  }

  // Event listener para selección de imagen
  const imageFileInput = document.getElementById('imageFileInput');
  if (imageFileInput) {
    imageFileInput.addEventListener('change', handleImageSelect);
  }

  // Event listeners para cerrar modales
  const closeImageModal = document.getElementById('closeImageModal');
  if (closeImageModal) {
    closeImageModal.addEventListener('click', () => hideModal('addImageModal'));
  }

  const closeDescriptionModal = document.getElementById('closeDescriptionModal');
  if (closeDescriptionModal) {
    closeDescriptionModal.addEventListener('click', () => hideModal('editDescriptionModal'));
  }

  const closeDataModal = document.getElementById('closeDataModal');
  if (closeDataModal) {
    closeDataModal.addEventListener('click', () => hideModal('editDataModal'));
  }

  const closeCommunityModal = document.getElementById('closeCommunityModal');
  if (closeCommunityModal) {
    closeCommunityModal.addEventListener('click', () => hideModal('addCommunityModal'));
  }

  const closePersonnelModal = document.getElementById('closePersonnelModal');
  if (closePersonnelModal) {
    closePersonnelModal.addEventListener('click', () => hideModal('addPersonnelModal'));
  }

  const closeChangeModal = document.getElementById('closeChangeModal');
  if (closeChangeModal) {
    closeChangeModal.addEventListener('click', () => hideModal('addChangeModal'));
  }

  // Event listeners para botones de cancelar
  const cancelImageBtn = document.getElementById('cancelImageBtn');
  if (cancelImageBtn) {
    cancelImageBtn.addEventListener('click', () => hideModal('addImageModal'));
  }

  const cancelDescriptionBtn = document.getElementById('cancelDescriptionBtn');
  if (cancelDescriptionBtn) {
    cancelDescriptionBtn.addEventListener('click', () => hideModal('editDescriptionModal'));
  }

  const cancelDataBtn = document.getElementById('cancelDataBtn');
  if (cancelDataBtn) {
    cancelDataBtn.addEventListener('click', () => hideModal('editDataModal'));
  }

  const cancelCommunityBtn = document.getElementById('cancelCommunityBtn');
  if (cancelCommunityBtn) {
    cancelCommunityBtn.addEventListener('click', () => hideModal('addCommunityModal'));
  }

  const cancelPersonnelBtn = document.getElementById('cancelPersonnelBtn');
  if (cancelPersonnelBtn) {
    cancelPersonnelBtn.addEventListener('click', () => hideModal('addPersonnelModal'));
  }

  const cancelChangeBtn = document.getElementById('cancelChangeBtn');
  if (cancelChangeBtn) {
    cancelChangeBtn.addEventListener('click', () => hideModal('addChangeModal'));
  }

  // Event listeners para botones de confirmar
  const confirmImageBtn = document.getElementById('confirmImageBtn');
  if (confirmImageBtn) {
    confirmImageBtn.addEventListener('click', addImageToProject);
  }

  const confirmDescriptionBtn = document.getElementById('confirmDescriptionBtn');
  if (confirmDescriptionBtn) {
    confirmDescriptionBtn.addEventListener('click', updateProjectDescription);
  }

  const confirmDataBtn = document.getElementById('confirmDataBtn');
  if (confirmDataBtn) {
    confirmDataBtn.addEventListener('click', saveProjectData);
  }

  const confirmCommunityBtn = document.getElementById('confirmCommunityBtn');
  if (confirmCommunityBtn) {
    confirmCommunityBtn.addEventListener('click', addCommunityToProject);
  }

  const confirmPersonnelBtn = document.getElementById('confirmPersonnelBtn');
  if (confirmPersonnelBtn) {
    confirmPersonnelBtn.addEventListener('click', addPersonnelToProject);
  }

  const confirmChangeBtn = document.getElementById('confirmChangeBtn');
  if (confirmChangeBtn) {
    confirmChangeBtn.addEventListener('click', addChangeToProject);
  }

  // Event listeners para modal de archivos
  const closeFileModal = document.getElementById('closeFileModal');
  if (closeFileModal) {
    closeFileModal.addEventListener('click', () => hideModal('addFileModal'));
  }

  const cancelFileBtn = document.getElementById('cancelFileBtn');
  if (cancelFileBtn) {
    cancelFileBtn.addEventListener('click', () => hideModal('addFileModal'));
  }

  const confirmFileBtn = document.getElementById('confirmFileBtn');
  if (confirmFileBtn) {
    confirmFileBtn.addEventListener('click', addFileToProject);
  }

  // Input de archivo
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }

  // Event listeners para modales de selección
  const closeCommunitySelectionModal = document.getElementById('closeCommunitySelectionModal');
  if (closeCommunitySelectionModal) {
    closeCommunitySelectionModal.addEventListener('click', () => hideModal('communitySelectionModal'));
  }

  const cancelCommunitySelectionBtn = document.getElementById('cancelCommunitySelectionBtn');
  if (cancelCommunitySelectionBtn) {
    cancelCommunitySelectionBtn.addEventListener('click', () => hideModal('communitySelectionModal'));
  }

  const confirmCommunitySelectionBtn = document.getElementById('confirmCommunitySelectionBtn');
  if (confirmCommunitySelectionBtn) {
    confirmCommunitySelectionBtn.addEventListener('click', () => {
      const selectedIndices = getSelectedIndices('communitySelectionList');
      if (selectedIndices.length > 0) {
        const currentProject = getCurrentProject();
        if (currentProject) {
          // Eliminar comunidades seleccionadas (en orden inverso para mantener índices)
          selectedIndices.sort((a, b) => b - a).forEach(index => {
            currentProject.communities.splice(index, 1);
          });
          loadProjectDetail(currentProject);
          showSuccessMessage(`${selectedIndices.length} comunidad(es) eliminada(s) exitosamente`);
          hideModal('communitySelectionModal');
        }
      } else {
        showErrorMessage('Por favor selecciona al menos una comunidad para eliminar');
      }
    });
  }

  const closeChangeSelectionModal = document.getElementById('closeChangeSelectionModal');
  if (closeChangeSelectionModal) {
    closeChangeSelectionModal.addEventListener('click', () => hideModal('changeSelectionModal'));
  }

  const cancelChangeSelectionBtn = document.getElementById('cancelChangeSelectionBtn');
  if (cancelChangeSelectionBtn) {
    cancelChangeSelectionBtn.addEventListener('click', () => hideModal('changeSelectionModal'));
  }

  const confirmChangeSelectionBtn = document.getElementById('confirmChangeSelectionBtn');
  if (confirmChangeSelectionBtn) {
    confirmChangeSelectionBtn.addEventListener('click', () => {
      const selectedIndices = getSelectedIndices('changeSelectionList');
      if (selectedIndices.length > 0) {
        const currentProject = getCurrentProject();
        if (currentProject) {
          // Eliminar cambios seleccionados (en orden inverso para mantener índices)
          selectedIndices.sort((a, b) => b - a).forEach(index => {
            currentProject.changes.splice(index, 1);
          });
          loadProjectDetail(currentProject);
          showSuccessMessage(`${selectedIndices.length} cambio(s) eliminado(s) exitosamente`);
          hideModal('changeSelectionModal');
        }
      } else {
        showErrorMessage('Por favor selecciona al menos un cambio para eliminar');
      }
    });
  }

  const closeFileSelectionModal = document.getElementById('closeFileSelectionModal');
  if (closeFileSelectionModal) {
    closeFileSelectionModal.addEventListener('click', () => hideModal('fileSelectionModal'));
  }

  const cancelFileSelectionBtn = document.getElementById('cancelFileSelectionBtn');
  if (cancelFileSelectionBtn) {
    cancelFileSelectionBtn.addEventListener('click', () => hideModal('fileSelectionModal'));
  }

  const confirmFileSelectionBtn = document.getElementById('confirmFileSelectionBtn');
  if (confirmFileSelectionBtn) {
    confirmFileSelectionBtn.addEventListener('click', () => {
      const selectedIndices = getSelectedIndices('fileSelectionList');
      if (selectedIndices.length > 0) {
        const currentProject = getCurrentProject();
        if (currentProject) {
          // Eliminar archivos seleccionados (en orden inverso para mantener índices)
          selectedIndices.sort((a, b) => b - a).forEach(index => {
            currentProject.files.splice(index, 1);
          });
          loadProjectDetail(currentProject);
          showSuccessMessage(`${selectedIndices.length} archivo(s) eliminado(s) exitosamente`);
          hideModal('fileSelectionModal');
        }
      } else {
        showErrorMessage('Por favor selecciona al menos un archivo para eliminar');
      }
    });
  }

  // Event listeners para modales de evidencias
  const closeChangeDetailsModal = document.getElementById('closeChangeDetailsModal');
  if (closeChangeDetailsModal) {
    closeChangeDetailsModal.addEventListener('click', () => hideModal('changeDetailsModal'));
  }

  const closeChangeDetailsBtn = document.getElementById('closeChangeDetailsBtn');
  if (closeChangeDetailsBtn) {
    closeChangeDetailsBtn.addEventListener('click', () => hideModal('changeDetailsModal'));
  }

  const addEvidenceBtn = document.getElementById('addEvidenceBtn');
  if (addEvidenceBtn) {
    addEvidenceBtn.addEventListener('click', showAddEvidenceModal);
  }

  const closeAddEvidenceModal = document.getElementById('closeAddEvidenceModal');
  if (closeAddEvidenceModal) {
    closeAddEvidenceModal.addEventListener('click', () => hideModal('addEvidenceModal'));
  }

  const cancelEvidenceBtn = document.getElementById('cancelEvidenceBtn');
  if (cancelEvidenceBtn) {
    cancelEvidenceBtn.addEventListener('click', () => hideModal('addEvidenceModal'));
  }

  const confirmEvidenceBtn = document.getElementById('confirmEvidenceBtn');
  if (confirmEvidenceBtn) {
    confirmEvidenceBtn.addEventListener('click', addEvidenceToChange);
  }

  const evidenceInput = document.getElementById('evidenceInput');
  if (evidenceInput) {
    evidenceInput.addEventListener('change', handleEvidenceSelect);
  }

  // Event listener para eliminar evidencias
  document.addEventListener('click', function(e) {
    if (e.target.closest('.evidence-remove')) {
      const button = e.target.closest('.evidence-remove');
      const evidenceIndex = parseInt(button.getAttribute('data-evidence-index'));
      removeEvidence(evidenceIndex);
    }
  });

  // Event listeners para modal de confirmación
  const closeConfirmModal = document.getElementById('closeConfirmModal');
  if (closeConfirmModal) {
    closeConfirmModal.addEventListener('click', () => hideModal('confirmDeleteModal'));
  }

  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => hideModal('confirmDeleteModal'));
  }

  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', executeDeleteAction);
  }

  // Event listeners para botones de eliminación de sección
  const removeCommunityBtn = document.getElementById('removeCommunityBtn');
  if (removeCommunityBtn) {
    removeCommunityBtn.addEventListener('click', () => {
      const currentProject = getCurrentProject();
      if (currentProject && currentProject.communities && currentProject.communities.length > 0) {
        showCommunitySelectionModal(currentProject.communities);
      } else {
        showErrorMessage('No hay comunidades para eliminar');
      }
    });
  }

  const removeChangeBtn = document.getElementById('removeChangeBtn');
  if (removeChangeBtn) {
    removeChangeBtn.addEventListener('click', () => {
      const currentProject = getCurrentProject();
      if (currentProject && currentProject.changes && currentProject.changes.length > 0) {
        showChangeSelectionModal(currentProject.changes);
      } else {
        showErrorMessage('No hay cambios para eliminar');
      }
    });
  }

  const removeFileBtn = document.getElementById('removeFileBtn');
  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', () => {
      const currentProject = getCurrentProject();
      if (currentProject && currentProject.files && currentProject.files.length > 0) {
        showCredentialsModal(() => {
          showFileSelectionModal(currentProject.files);
        });
      } else {
        showErrorMessage('No hay archivos para eliminar');
      }
    });
  }

  // Event listeners para botones de eliminación usando delegación de eventos
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-remove-item')) {
      const button = e.target.closest('.btn-remove-item');
      
      if (button.hasAttribute('data-personnel-id')) {
        const personnelId = button.getAttribute('data-personnel-id');
        removePersonnelFromProject(personnelId);
      } else if (button.hasAttribute('data-image-index')) {
        const imageIndex = parseInt(button.getAttribute('data-image-index'));
        removeImageFromProject(imageIndex);
      } else if (button.hasAttribute('data-community-index')) {
        const communityIndex = parseInt(button.getAttribute('data-community-index'));
        removeCommunityFromProject(communityIndex);
      } else if (button.hasAttribute('data-change-index')) {
        const changeIndex = parseInt(button.getAttribute('data-change-index'));
        removeChangeFromProject(changeIndex);
      } else if (button.hasAttribute('data-file-id')) {
        const fileId = button.getAttribute('data-file-id');
        removeFileFromProject(fileId);
      }
    }
  });

  // Cerrar modales al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
});

// ======= FUNCIONES PARA LISTAS DE SELECCIÓN =======

// Función para cargar lista de comunidades
function loadCommunitiesList() {
  const communitiesList = document.getElementById('communitiesList');
  if (!communitiesList) return;
  
  communitiesList.innerHTML = '';
  
  availableCommunities.forEach(community => {
    const communityItem = document.createElement('div');
    communityItem.className = 'community-item';
    communityItem.innerHTML = `
      <input type="checkbox" id="community-${community.id}" value="${community.id}">
      <div class="community-info">
        <div class="community-name">${community.name}</div>
        <div class="community-region">${community.region}</div>
      </div>
    `;
    communitiesList.appendChild(communityItem);
  });
  
  // Agregar event listener para el buscador
  const searchInput = document.getElementById('communitySearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterCommunities);
  }
}

// Función para cargar lista de personal
function loadPersonnelList() {
  const personnelList = document.getElementById('personnelList');
  if (!personnelList) return;
  
  personnelList.innerHTML = '';
  
  availablePersonnel.forEach(person => {
    const personnelItem = document.createElement('div');
    personnelItem.className = 'personnel-item';
    personnelItem.innerHTML = `
      <input type="checkbox" id="personnel-${person.id}" value="${person.id}">
      <div class="personnel-info">
        <div class="personnel-name">${person.name}</div>
        <div class="personnel-role">${person.role}</div>
      </div>
    `;
    personnelList.appendChild(personnelItem);
  });
}

// Función para obtener comunidades seleccionadas
function getSelectedCommunities() {
  const checkboxes = document.querySelectorAll('#communitiesList input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => {
    const id = parseInt(cb.value);
    return availableCommunities.find(c => c.id === id);
  });
}

// Función para obtener personal seleccionado
function getSelectedPersonnel() {
  const checkboxes = document.querySelectorAll('#personnelList input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => {
    const id = parseInt(cb.value);
    return availablePersonnel.find(p => p.id === id);
  });
}

// Función para cargar lista de personal en modal de cambios
function loadChangePersonnelList() {
  const personnelList = document.getElementById('changePersonnelList');
  if (!personnelList) return;
  
  personnelList.innerHTML = '';
  
  availablePersonnel.forEach(person => {
    const personnelItem = document.createElement('div');
    personnelItem.className = 'personnel-item';
    personnelItem.innerHTML = `
      <input type="checkbox" id="change-personnel-${person.id}" value="${person.id}">
      <div class="personnel-info">
        <div class="personnel-name">${person.name}</div>
        <div class="personnel-role">${person.role}</div>
      </div>
    `;
    personnelList.appendChild(personnelItem);
  });
  
  // Agregar event listener para el buscador
  const searchInput = document.getElementById('changePersonnelSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterChangePersonnel);
  }
}

// Función para filtrar comunidades
function filterCommunities() {
  const searchTerm = document.getElementById('communitySearch').value.toLowerCase();
  const communityItems = document.querySelectorAll('.community-item');
  
  communityItems.forEach(item => {
    const name = item.querySelector('.community-name').textContent.toLowerCase();
    const region = item.querySelector('.community-region').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || region.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Función para filtrar personal en modal de cambios
function filterChangePersonnel() {
  const searchTerm = document.getElementById('changePersonnelSearch').value.toLowerCase();
  const personnelItems = document.querySelectorAll('#changePersonnelList .personnel-item');
  
  personnelItems.forEach(item => {
    const name = item.querySelector('.personnel-name').textContent.toLowerCase();
    const role = item.querySelector('.personnel-role').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || role.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Función para obtener personal seleccionado en modal de cambios
function getSelectedChangePersonnel() {
  const checkboxes = document.querySelectorAll('#changePersonnelList input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => {
    const id = parseInt(cb.value);
    return availablePersonnel.find(p => p.id === id);
  });
}

// También manejar el caso cuando la página se carga directamente con hash
window.addEventListener('load', function() {
  handleUrlAnchor();
});

// Re-agregar event listeners cuando se muestre la vista principal
const originalShowMainView = showMainView;
showMainView = function() {
  originalShowMainView();
  setTimeout(addViewMoreListeners, 100); // Pequeño delay para asegurar que los elementos estén disponibles
};

// ======= FUNCIÓN PARA GUARDAR DATOS DEL PROYECTO =======
function saveProjectData() {
  console.log('saveProjectData() llamada');
  console.log('selectedCards:', selectedCards);
  console.log('currentEditProject:', currentEditProject);
  
  // Validar que haya al menos una tarjeta seleccionada
  if (selectedCards.length === 0) {
    showErrorMessage('Por favor selecciona al menos una tarjeta de datos');
    return;
  }
  
  // Validar que todas las tarjetas tengan valores
  const emptyCards = selectedCards.filter(card => !card.value.trim());
  if (emptyCards.length > 0) {
    showErrorMessage('Por favor completa todos los valores de las tarjetas seleccionadas');
    return;
  }
  
  if (currentEditProject) {
    console.log('Actualizando proyecto con tarjetas:', selectedCards);
    
    // Actualizar los datos de las tarjetas
    currentEditProject.data = selectedCards.map(card => ({
      id: card.id,
      icon: card.icon,
      label: card.label,
      value: card.value,
      isCustom: card.isCustom
    }));
    
    console.log('Proyecto actualizado:', currentEditProject);
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentEditProject);
    showSuccessMessage('Datos actualizados exitosamente');
    hideModal('editDataModal');
    
    // Limpiar variables
    selectedCards = [];
    currentEditProject = null;
  } else {
    console.error('No hay proyecto actual para editar');
    showErrorMessage('Error: No se encontró el proyecto actual');
  }
}

// ======= FUNCIONES PARA MANEJO DE ARCHIVOS =======
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

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const preview = document.getElementById('filePreview');
  preview.innerHTML = '';
  
  const fileItem = document.createElement('div');
  fileItem.className = 'file-preview-item';
  
  const fileIcon = document.createElement('div');
  fileIcon.className = 'file-preview-icon';
  fileIcon.textContent = getFileExtension(file.name).toUpperCase();
  
  const fileName = document.createElement('div');
  fileName.className = 'file-preview-name';
  fileName.textContent = file.name;
  
  const fileSize = document.createElement('div');
  fileSize.className = 'file-preview-size';
  fileSize.textContent = formatFileSize(file.size);
  
  fileItem.appendChild(fileIcon);
  fileItem.appendChild(fileName);
  fileItem.appendChild(fileSize);
  preview.appendChild(fileItem);
  
  // Auto-completar el nombre del archivo si está vacío
  const nameInput = document.getElementById('fileName');
  if (!nameInput.value.trim()) {
    nameInput.value = file.name.replace(/\.[^/.]+$/, ""); // Remover extensión
  }
}

function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function addFileToProject() {
  const fileInput = document.getElementById('fileInput');
  const fileName = document.getElementById('fileName').value.trim();
  const fileDescription = document.getElementById('fileDescription').value.trim();
  
  if (!fileInput.files[0]) {
    showErrorMessage('Por favor selecciona un archivo');
    return;
  }
  
  if (!fileName) {
    showErrorMessage('Por favor ingresa un nombre para el archivo');
    return;
  }
  
  const file = fileInput.files[0];
  const currentProject = getCurrentProject();
  
  if (currentProject) {
    if (!currentProject.files) {
      currentProject.files = [];
    }
    
    const newFile = {
      id: generateFileId(),
      name: fileName,
      description: fileDescription,
      originalName: file.name,
      size: file.size,
      type: file.type,
      extension: getFileExtension(file.name),
      uploadDate: new Date().toISOString(),
      url: URL.createObjectURL(file) // En una aplicación real, esto sería la URL del servidor
    };
    
    currentProject.files.push(newFile);
    
    // Recargar la vista del proyecto
    loadProjectDetail(currentProject);
    showSuccessMessage('Archivo agregado exitosamente');
    hideModal('addFileModal');
    clearFileForm();
  }
}

function generateFileId() {
  return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadProjectFiles(files) {
  const filesContainer = document.getElementById('detailFiles');
  if (!filesContainer) return;
  
  if (!files || files.length === 0) {
    filesContainer.innerHTML = '<p class="no-files-message">No hay archivos adjuntos para este proyecto.</p>';
    return;
  }
  
  filesContainer.innerHTML = '';
  
  files.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileIcon = document.createElement('div');
    fileIcon.className = 'file-icon';
    fileIcon.textContent = file.extension.toUpperCase();
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    const fileName = document.createElement('h4');
    fileName.textContent = file.name;
    
    const fileDescription = document.createElement('p');
    fileDescription.textContent = file.description || 'Sin descripción';
    
    const fileDate = document.createElement('div');
    fileDate.className = 'file-date';
    fileDate.textContent = new Date(file.uploadDate).toLocaleDateString('es-GT');
    
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileDescription);
    fileInfo.appendChild(fileDate);
    
    const fileActions = document.createElement('div');
    fileActions.className = 'file-actions';
    
    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'file-download-btn';
    downloadBtn.href = file.url;
    downloadBtn.download = file.originalName;
    downloadBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7,10 12,15 17,10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Descargar
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-item';
    removeBtn.setAttribute('data-file-id', file.id);
    removeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    
    fileActions.appendChild(downloadBtn);
    fileActions.appendChild(removeBtn);
    
    fileItem.appendChild(fileIcon);
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(fileActions);
    
    filesContainer.appendChild(fileItem);
  });
}

// ======= FUNCIONES DE ELIMINACIÓN =======
function removePersonnelFromProject(personnelId) {
  showCredentialsModal(() => {
    showConfirmDeleteModal(
      '¿Estás seguro de que deseas eliminar este miembro del personal?',
      () => {
        const currentProject = getCurrentProject();
        if (currentProject && currentProject.personnel) {
          currentProject.personnel = currentProject.personnel.filter(person => person.id !== personnelId);
          loadProjectDetail(currentProject);
          showSuccessMessage('Personal eliminado exitosamente');
        }
      }
    );
  });
}

function removeImageFromProject(imageIndex) {
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar esta imagen de la galería?',
    () => {
      const currentProject = getCurrentProject();
      if (currentProject && currentProject.gallery) {
        currentProject.gallery.splice(imageIndex, 1);
        loadProjectDetail(currentProject);
        showSuccessMessage('Imagen eliminada exitosamente');
      }
    }
  );
}

function removeCommunityFromProject(communityIndex) {
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas quitar esta comunidad del proyecto?',
    () => {
      const currentProject = getCurrentProject();
      if (currentProject && currentProject.communities) {
        currentProject.communities.splice(communityIndex, 1);
        loadProjectDetail(currentProject);
        showSuccessMessage('Comunidad eliminada exitosamente');
      }
    }
  );
}

function removeChangeFromProject(changeIndex) {
  showConfirmDeleteModal(
    '¿Estás seguro de que deseas eliminar este cambio realizado?',
    () => {
      const currentProject = getCurrentProject();
      if (currentProject && currentProject.changes) {
        currentProject.changes.splice(changeIndex, 1);
        loadProjectDetail(currentProject);
        showSuccessMessage('Cambio eliminado exitosamente');
      }
    }
  );
}

function removeFileFromProject(fileId) {
  showCredentialsModal(() => {
    showConfirmDeleteModal(
      '¿Estás seguro de que deseas eliminar este archivo?',
      () => {
        const currentProject = getCurrentProject();
        if (currentProject && currentProject.files) {
          currentProject.files = currentProject.files.filter(file => file.id !== fileId);
          loadProjectDetail(currentProject);
          showSuccessMessage('Archivo eliminado exitosamente');
        }
      }
    );
  });
}

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

// Función para filtrar lista de personal
function filterPersonnelList() {
  const searchTerm = document.getElementById('personnelSearch').value.toLowerCase();
  const personnelItems = document.querySelectorAll('.personnel-item');
  
  personnelItems.forEach(item => {
    const name = item.querySelector('.personnel-name').textContent.toLowerCase();
    const role = item.querySelector('.personnel-role').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || role.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// ======= FUNCIONES PARA MODALES DE SELECCIÓN =======

// Función para mostrar modal de selección de comunidades
function showCommunitySelectionModal(communities) {
  const modal = document.getElementById('communitySelectionModal');
  const list = document.getElementById('communitySelectionList');
  
  list.innerHTML = '';
  
  communities.forEach((community, index) => {
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `
      <input type="checkbox" class="selection-checkbox" id="community-${index}" data-index="${index}">
      <div class="selection-content">
        <h4 class="selection-title">${community.name}</h4>
        <p class="selection-subtitle">${community.region}</p>
      </div>
    `;
    list.appendChild(item);
  });
  
  showModal('communitySelectionModal');
  setupSelectionHandlers('communitySelectionList');
}

// Función para mostrar modal de selección de cambios
function showChangeSelectionModal(changes) {
  const modal = document.getElementById('changeSelectionModal');
  const list = document.getElementById('changeSelectionList');
  
  list.innerHTML = '';
  
  changes.forEach((change, index) => {
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `
      <input type="checkbox" class="selection-checkbox" id="change-${index}" data-index="${index}">
      <div class="selection-content">
        <h4 class="selection-title">${change.date}</h4>
        <p class="selection-description">${change.description}</p>
        <p class="selection-subtitle">Por: ${change.personnel}</p>
      </div>
    `;
    list.appendChild(item);
  });
  
  showModal('changeSelectionModal');
  setupSelectionHandlers('changeSelectionList');
}

// Función para mostrar modal de selección de archivos
function showFileSelectionModal(files) {
  const modal = document.getElementById('fileSelectionModal');
  const list = document.getElementById('fileSelectionList');
  
  list.innerHTML = '';
  
  files.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `
      <input type="checkbox" class="selection-checkbox" id="file-${index}" data-index="${index}">
      <div class="selection-content">
        <h4 class="selection-title">${file.name}</h4>
        <p class="selection-description">${file.description || 'Sin descripción'}</p>
        <p class="selection-subtitle">${file.extension.toUpperCase()} • ${formatFileSize(file.size)}</p>
      </div>
    `;
    list.appendChild(item);
  });
  
  showModal('fileSelectionModal');
  setupSelectionHandlers('fileSelectionList');
}

// Función auxiliar para obtener índices seleccionados
function getSelectedIndices(listId) {
  const checkboxes = document.querySelectorAll(`#${listId} .selection-checkbox:checked`);
  return Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.index));
}

// Función para configurar selección de elementos
function setupSelectionHandlers(listId) {
  const checkboxes = document.querySelectorAll(`#${listId} .selection-checkbox`);
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const item = this.closest('.selection-item');
      if (this.checked) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  });
}

// ======= FUNCIONES PARA EVIDENCIAS DE CAMBIOS =======

let currentChangeIndex = null;

// Función para mostrar modal de detalles de cambio
function showChangeDetailsModal(change, changeIndex) {
  currentChangeIndex = changeIndex;
  
  // Llenar información del cambio
  document.getElementById('changeDetailsDate').textContent = change.date;
  document.getElementById('changeDetailsDescription').textContent = change.description;
  document.getElementById('changeDetailsPersonnel').textContent = change.personnel;
  
  // Cargar evidencias
  loadEvidences(change.evidences || []);
  
  showModal('changeDetailsModal');
}

// Función para cargar evidencias
function loadEvidences(evidences) {
  const grid = document.getElementById('evidencesGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (!evidences || evidences.length === 0) {
    grid.innerHTML = `
      <div class="no-evidences">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
        <p>No hay evidencias para este cambio</p>
        <p>Haz clic en "Agregar Evidencia" para comenzar</p>
      </div>
    `;
    return;
  }
  
  evidences.forEach((evidence, index) => {
    const evidenceItem = document.createElement('div');
    evidenceItem.className = 'evidence-item';
    
    const isImage = evidence.type && evidence.type.startsWith('image/');
    
    evidenceItem.innerHTML = `
      ${isImage ? 
        `<img src="${evidence.url}" alt="${evidence.name}" class="evidence-image">` :
        `<div class="evidence-file">
          <div class="evidence-file-icon">📄</div>
          <div class="evidence-file-name">${evidence.name}</div>
        </div>`
      }
      <div class="evidence-info">
        <p class="evidence-description">${evidence.description || 'Sin descripción'}</p>
        <p class="evidence-meta">${evidence.type || 'Archivo'} • ${formatFileSize(evidence.size)}</p>
      </div>
      <button class="evidence-remove" data-evidence-index="${index}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    grid.appendChild(evidenceItem);
  });
}

// Función para mostrar modal de agregar evidencia
function showAddEvidenceModal() {
  const currentProject = getCurrentProject();
  if (!currentProject || currentChangeIndex === null) return;
  
  const change = currentProject.changes[currentChangeIndex];
  if (change.evidences && change.evidences.length >= 3) {
    showErrorMessage('Máximo 3 evidencias por cambio');
    return;
  }
  
  showModal('addEvidenceModal');
  clearEvidenceForm();
}

// Función para limpiar formulario de evidencia
function clearEvidenceForm() {
  document.getElementById('evidenceInput').value = '';
  document.getElementById('evidenceDescription').value = '';
  document.getElementById('evidencePreview').innerHTML = '';
}

// Función para manejar selección de archivo de evidencia
function handleEvidenceSelect() {
  const fileInput = document.getElementById('evidenceInput');
  const preview = document.getElementById('evidencePreview');
  
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const isImage = file.type.startsWith('image/');
    
    preview.innerHTML = `
      <div class="file-preview-item">
        <div class="file-preview-icon">${isImage ? '🖼️' : '📄'}</div>
        <div class="file-preview-name">${file.name}</div>
        <div class="file-preview-size">${formatFileSize(file.size)}</div>
      </div>
    `;
  }
}

// Función para agregar evidencia
function addEvidenceToChange() {
  const fileInput = document.getElementById('evidenceInput');
  const description = document.getElementById('evidenceDescription').value;
  
  if (!fileInput.files || !fileInput.files[0]) {
    showErrorMessage('Por favor selecciona un archivo');
    return;
  }
  
  const file = fileInput.files[0];
  const currentProject = getCurrentProject();
  
  if (!currentProject || currentChangeIndex === null) return;
  
  const change = currentProject.changes[currentChangeIndex];
  if (!change.evidences) {
    change.evidences = [];
  }
  
  if (change.evidences.length >= 3) {
    showErrorMessage('Máximo 3 evidencias por cambio');
    return;
  }
  
  // Crear objeto de evidencia
  const evidence = {
    id: generateEvidenceId(),
    name: file.name,
    description: description,
    type: file.type,
    size: file.size,
    url: URL.createObjectURL(file), // En producción, esto se subiría al servidor
    uploadDate: new Date().toISOString()
  };
  
  change.evidences.push(evidence);
  
  // Recargar evidencias
  loadEvidences(change.evidences);
  
  // Cerrar modal
  hideModal('addEvidenceModal');
  
  // Actualizar vista principal
  loadProjectDetail(currentProject);
  
  showSuccessMessage('Evidencia agregada exitosamente');
}

// Función para generar ID de evidencia
function generateEvidenceId() {
  return 'evidence_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Función para eliminar evidencia
function removeEvidence(evidenceIndex) {
  const currentProject = getCurrentProject();
  if (!currentProject || currentChangeIndex === null) return;
  
  const change = currentProject.changes[currentChangeIndex];
  if (change.evidences && change.evidences[evidenceIndex]) {
    change.evidences.splice(evidenceIndex, 1);
    loadEvidences(change.evidences);
    loadProjectDetail(currentProject);
    showSuccessMessage('Evidencia eliminada exitosamente');
  }
}