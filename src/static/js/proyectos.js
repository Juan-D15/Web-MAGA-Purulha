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
        categoryKey: tipo,

        estado: proyecto.estado,

        estado_display: proyecto.estado_display,

        descripcion: proyecto.descripcion,

        portada: proyecto.portada || null,

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

    console.log('📥 Respuesta de la API:', data);

    

    if (data.success) {

      console.log(`✅ Cargados ${data.total} últimos proyectos`);

      console.log('📊 Proyectos recibidos:', data.proyectos);

      return data.proyectos || [];

    } else {

      console.error('❌ Error al cargar últimos proyectos:', data.error);

      return [];

    }

  } catch (error) {

    console.error('❌ Error al cargar últimos proyectos:', error);

    console.error('Stack trace:', error.stack);

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

    console.log('📊 Últimos proyectos:', ultimosProyectos);

    

    // Renderizar proyectos en el HTML

    renderizarProyectosEnHTML();

    

    // Renderizar últimos proyectos

    renderizarUltimosProyectos(ultimosProyectos);

    

    // Verificar si hay un hash en la URL para abrir un evento específico

    verificarHashYAbrirEvento();

    

  } catch (error) {

    console.error('❌ Error al inicializar proyectos:', error);

    console.error('Stack trace:', error.stack);

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
  const formatter = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!dateString) {
    return formatter.format(new Date());
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return formatter.format(new Date());
  }

  return formatter.format(date);
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

  const imagenUrl = (proyecto.portada && proyecto.portada.url) || proyecto.imagen_principal || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

  

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

        <p class="project-location">${proyecto.ubicacion || proyecto.location}</p>

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

  console.log('📊 Proyectos recibidos:', proyectos);

  console.log('📊 Cantidad de proyectos:', proyectos ? proyectos.length : 0);

  featuredProjectsData = Array.isArray(proyectos)
    ? proyectos.map(normalizeProjectForFeatured).filter(Boolean)
    : [];

  if (featuredProjectsData.length > 1) {
    const uniqueProjects = [];
    const seenIds = new Set();
    featuredProjectsData.forEach((project) => {
      if (!seenIds.has(project.id)) {
        seenIds.add(project.id);
        uniqueProjects.push(project);
      }
    });
    featuredProjectsData = uniqueProjects;
  }

  renderFeaturedProjectsGrid();

}


function renderFeaturedProjectsGrid() {
  const featuredGrid = document.querySelector('.latest-projects .projects-grid.featured');

  if (!featuredGrid) {
    console.error('❌ No se encontró el grid de últimos proyectos');
    return;
  }

  featuredGrid.innerHTML = '';

  if (!featuredProjectsData.length) {
    console.warn('⚠️ No hay proyectos para renderizar');
    featuredGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
        <p>No hay proyectos recientes aún.</p>
      </div>
    `;
    return;
  }

  const projectsToRender = featuredProjectsData.slice(0, FEATURED_PROJECTS_LIMIT);

  projectsToRender.forEach((proyecto, index) => {
    try {
      console.log(`🔄 Renderizando proyecto destacado ${index + 1}:`, proyecto.nombre);
      const card = crearTarjetaProyectoDestacado(proyecto);
      if (!card) {
        console.error(`❌ No se pudo crear la tarjeta para el proyecto ${index + 1}`);
        return;
      }

      const imagenDestacada =
        (proyecto.portada && proyecto.portada.url) ||
        proyecto.imagen_principal ||
        null;

      const imgTag = card.querySelector('img');
      if (imgTag && imagenDestacada) {
        imgTag.src = imagenDestacada;
      }

      featuredGrid.appendChild(card);
      console.log(`✅ Proyecto destacado ${index + 1} agregado al DOM`);
    } catch (error) {
      console.error(`❌ Error al renderizar proyecto destacado ${index + 1}:`, error);
      console.error('Stack trace:', error.stack);
    }
  });

  console.log(`✅ Renderizados ${projectsToRender.length} últimos proyectos`);
}


function normalizeProjectForFeatured(proyecto) {
  if (!proyecto) {
    return null;
  }

  const projectId = proyecto.id || proyecto.uuid || proyecto.pk;
  if (!projectId) {
    return null;
  }

  const nombre = proyecto.nombre || proyecto.name || 'Sin nombre';

  let ubicacion = proyecto.ubicacion || proyecto.location || '';
  if (!ubicacion) {
    const comunidadNombre =
      (proyecto.comunidad && (proyecto.comunidad.nombre || proyecto.comunidad.name)) ||
      proyecto.comunidad_nombre ||
      proyecto.community_name ||
      '';
    const regionNombre =
      (proyecto.comunidad &&
        proyecto.comunidad.region &&
        (proyecto.comunidad.region.nombre || proyecto.comunidad.region.name)) ||
      proyecto.region_nombre ||
      proyecto.region ||
      '';
    if (comunidadNombre && regionNombre) {
      ubicacion = `${comunidadNombre}, ${regionNombre}`;
    } else if (comunidadNombre) {
      ubicacion = comunidadNombre;
    } else if (regionNombre) {
      ubicacion = regionNombre;
    }
  }

  const fecha =
    proyecto.fecha ||
    proyecto.fecha_evento ||
    proyecto.fecha_inicio ||
    proyecto.createdDate ||
    proyecto.creado_en ||
    proyecto.actualizado_en ||
    '';

  const fechaDisplay =
    proyecto.fecha_display ||
    proyecto.fecha_formatted ||
    proyecto.fecha_formateada ||
    proyecto.fecha_formato ||
    proyecto.actualizado_en_formatted ||
    proyecto.creado_en_formatted ||
    fecha;

  let portada = null;
  const portadaFuente = proyecto.portada || proyecto.portada_url || proyecto.coverImage;
  if (typeof portadaFuente === 'string') {
    portada = { url: portadaFuente };
  } else if (portadaFuente && typeof portadaFuente === 'object') {
    const portadaUrl =
      portadaFuente.url ||
      portadaFuente.imagen_url ||
      portadaFuente.image_url ||
      portadaFuente.archivo_url ||
      portadaFuente.path ||
      null;
    if (portadaUrl) {
      portada = { url: portadaUrl };
    }
  }

  let imagenPrincipal = proyecto.imagen_principal || proyecto.imagenPrincipal || null;
  if (!imagenPrincipal && portada && portada.url) {
    imagenPrincipal = portada.url;
  }

  if (!imagenPrincipal && Array.isArray(proyecto.evidencias)) {
    const primeraGaleria = proyecto.evidencias.find((item) => item && item.es_galeria === true && (item.url || item.url_almacenamiento || item.imagen_url));
    const primeraImagen = primeraGaleria || proyecto.evidencias.find((item) => {
      if (!item || item.es_galeria === false) {
        if (!item || !item.es_imagen) return false;
        return Boolean(item.url || item.url_almacenamiento || item.imagen_url);
      }
      if (item.es_imagen === false) return false;
      const tipoArchivo = item.archivo_tipo || item.tipo;
      if (tipoArchivo && typeof tipoArchivo === 'string') {
        return tipoArchivo.startsWith('image/');
      }
      return Boolean(item.url || item.url_almacenamiento || item.imagen_url);
    });

    if (primeraImagen) {
      imagenPrincipal =
        primeraImagen.url ||
        primeraImagen.url_almacenamiento ||
        primeraImagen.imagen_url ||
        primeraImagen.archivo_url ||
        null;
    }
  }

  return {
    ...proyecto,
    id: String(projectId),
    nombre,
    ubicacion: ubicacion || 'Sin ubicación',
    fecha,
    fecha_display: fechaDisplay || fecha,
    imagen_principal: imagenPrincipal,
    portada,
  };
}


function promoteProjectToFeatured(proyecto) {
  const normalized = normalizeProjectForFeatured(proyecto);
  if (!normalized) {
    return;
  }

  featuredProjectsData = featuredProjectsData.filter((item) => item.id !== normalized.id);
  featuredProjectsData.unshift(normalized);

  if (FEATURED_PROJECTS_LIMIT && featuredProjectsData.length > FEATURED_PROJECTS_LIMIT) {
    featuredProjectsData = featuredProjectsData.slice(0, FEATURED_PROJECTS_LIMIT);
  }

  renderFeaturedProjectsGrid();
}


async function refreshLatestProjectsFromServer() {
  try {
    const ultimosProyectos = await cargarUltimosProyectos();
    renderizarUltimosProyectos(ultimosProyectos);
  } catch (error) {
    console.error('❌ Error al refrescar los últimos proyectos:', error);
  }
}
// Función para crear una tarjeta de proyecto destacado

function crearTarjetaProyectoDestacado(proyecto) {

  if (!proyecto) {

    console.error('❌ Proyecto no válido:', proyecto);

    return null;

  }

  

  const card = document.createElement('div');

  card.className = 'project-card featured-card';

  

  // Manejar fecha de forma segura

  let fecha;

  try {

    fecha = new Date(proyecto.fecha || proyecto.createdDate || new Date());

    if (isNaN(fecha.getTime())) {

      fecha = new Date();

    }

  } catch (e) {

    fecha = new Date();

  }

  

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const mes = meses[fecha.getMonth()] || 'Ene';

  const dia = fecha.getDate() || 1;

  const anio = fecha.getFullYear() || new Date().getFullYear();

  

  const portadaUrl = proyecto.portada && proyecto.portada.url ? proyecto.portada.url : null;

  const imagenUrl = portadaUrl || proyecto.imagen_principal || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  const nombreProyecto = proyecto.nombre || proyecto.name || 'Sin nombre';

  const ubicacionProyecto = proyecto.ubicacion || 'Sin ubicación';



  card.innerHTML = `

    <div class="project-image">

      <img src="${imagenUrl}" alt="${nombreProyecto}" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">

      <div class="project-date-overlay">

        <div class="date__month">${mes}</div>

        <div class="date__day">${dia}</div>

        <div class="date__year">${anio}</div>

      </div>

      <div class="project-content-overlay">

        <h3 class="project-title">${nombreProyecto}</h3>

        <p class="project-location">${ubicacionProyecto}</p>

        <button class="project-btn" data-project-id="${proyecto.id}">Ver más ></button>

      </div>

    </div>

  `;



  const btn = card.querySelector('.project-btn');

  if (btn && proyecto.id) {

  btn.addEventListener('click', function() {

    const projectId = this.getAttribute('data-project-id');

      if (projectId) {

    loadProjectDetails(projectId);

      }

  });

  }



  return card;

}



// Función para cargar los detalles completos de un proyecto

async function loadProjectDetails(projectId) {

  try {

    console.log(`🔄 Cargando detalles del proyecto ${projectId}...`);

    resetProjectPermissionState();

    const response = await fetch(`/api/proyecto/${projectId}/`);

    

    if (!response.ok) {

      throw new Error(`Error HTTP: ${response.status}`);

    }

    

    const data = await response.json();

    

    if (data.success) {

      console.log('✅ Detalles del proyecto cargados:', data.proyecto);

      console.log('📊 Cambios recibidos:', data.proyecto.cambios);

      console.log('📊 Cantidad de cambios:', data.proyecto.cambios ? data.proyecto.cambios.length : 0);

      // Guardar el proyecto en variables globales antes de mostrar

      const proyecto = data.proyecto;

      currentProjectData = proyecto;

      currentProjectId = proyecto.id;

      if (proyecto.permisos && typeof proyecto.permisos === 'object') {
        window.USER_AUTH = window.USER_AUTH || {};
    window.USER_AUTH.permisos = Object.assign({}, window.USER_AUTH.permisos || {}, proyecto.permisos);
        if (typeof proyecto.permisos.es_admin === 'boolean') {
          window.USER_AUTH.isAdmin = proyecto.permisos.es_admin;
        }
        if (typeof proyecto.permisos.es_personal === 'boolean') {
          window.USER_AUTH.isPersonal = proyecto.permisos.es_personal;
        }
    window.USER_AUTH.permisos.puede_gestionar = Boolean(proyecto.permisos.puede_gestionar);
  } else if (window.USER_AUTH) {
    window.USER_AUTH.permisos = Object.assign({}, window.USER_AUTH.permisos || {});
    window.USER_AUTH.permisos.puede_gestionar = false;
      }

      let puedeGestionar = null;
      if (typeof proyecto.puede_gestionar === 'boolean') {
        puedeGestionar = proyecto.puede_gestionar;
        console.log('📋 Usando proyecto.puede_gestionar:', puedeGestionar);
      } else if (proyecto.permisos && typeof proyecto.permisos.puede_gestionar === 'boolean') {
        puedeGestionar = proyecto.permisos.puede_gestionar;
        console.log('📋 Usando proyecto.permisos.puede_gestionar:', puedeGestionar);
      } else {
        puedeGestionar = await usuarioPuedeGestionarProyecto(proyecto);
        console.log('📋 Usando usuarioPuedeGestionarProyecto:', puedeGestionar);
      }

      puedeGestionarProyectoActual = Boolean(puedeGestionar);
      console.log('🔑 puedeGestionarProyectoActual establecido a:', puedeGestionarProyectoActual);
      projectActionButtonSelectors = buildProjectActionButtonSelectors();

      mostrarDetalleProyecto(proyecto);

      aplicarVisibilidadBotonesGestion(puedeGestionarProyectoActual);

      if (shouldRefreshLatestProjects) {
        shouldRefreshLatestProjects = false;
        promoteProjectToFeatured(proyecto);
      }

      return proyecto;

    } else {

      console.error('❌ Error al cargar proyecto:', data.error);

      alert('Error al cargar el proyecto: ' + data.error);

    }

  } catch (error) {

    console.error('❌ Error al cargar proyecto:', error);

    alert('Error al cargar el proyecto. Por favor, intenta de nuevo.');

  }

  shouldRefreshLatestProjects = false;
  return null;

}



// Función para mostrar los detalles del proyecto en la vista de detalle

function mostrarDetalleProyecto(proyecto) {

  console.log('📝 Mostrando datos del proyecto:', proyecto.nombre);

  
  ensureProjectActionHandlers();
  ensureModalCloseHandlers();

  // IMPORTANTE: Guardar el proyecto en las variables globales para que getCurrentProject() funcione

  currentProjectData = proyecto;

  currentProjectId = proyecto.id;

  

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

  if (detailMainImage) {

    const portadaUrl = proyecto.portada && proyecto.portada.url ? proyecto.portada.url : null;

    if (portadaUrl) {

      detailMainImage.src = portadaUrl;

    } else if (proyecto.evidencias && proyecto.evidencias.length > 0) {

      const primeraImagen =
        proyecto.evidencias.find(e => e && e.es_galeria === true && e.es_imagen) ||
        proyecto.evidencias.find(e => e && e.es_imagen);

      if (primeraImagen) {

        detailMainImage.src = primeraImagen.url;

      } else {

        detailMainImage.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

      }

    } else {

      detailMainImage.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    }

  }

  

  // Actualizar descripción

  if (detailDescription) {

    const descripcionTexto = proyecto.descripcion || 'Sin descripción disponible';

    // Mostrar la descripción como texto plano, preservando saltos de línea

    detailDescription.innerHTML = `<p style="white-space: pre-wrap; color: #b8c5d1; line-height: 1.6;">${descripcionTexto.replace(/\n/g, '<br>')}</p>`;

  }

  

  // Actualizar personal a cargo

  const detailPersonnelInfo = document.getElementById('detailPersonnelInfo');

  

  if (detailPersonnelInfo && proyecto.personal) {

    if (proyecto.personal.length === 0) {

      detailPersonnelInfo.innerHTML = '<p style="color: #6c757d;">No hay personal asignado a este proyecto.</p>';

    } else {

      detailPersonnelInfo.innerHTML = proyecto.personal.map((persona, index) => {

        return `

        <div class="personnel-card" style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #007bff; position: relative;">

          <div style="display: flex; justify-content: space-between; align-items: start;">

            <div style="flex: 1;">

              <h4 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1.1rem;">${persona.nombre || persona.username || 'Sin nombre'}</h4>

              <p style="margin: 4px 0; color: #007bff; font-weight: 500;">${persona.puesto || 'Sin puesto'}</p>

              <p style="margin: 4px 0; color: #b8c5d1; font-size: 0.9rem;">Rol: ${persona.rol_display || persona.rol || 'Sin rol'}</p>

            </div>

          </div>

        </div>

      `;

      }).join('');

    }

  }

  

  // Actualizar galería de imágenes

  const detailGallery = document.getElementById('detailGallery');

  if (detailGallery) {
    const puedeGestionar = puedeGestionarGaleria();
    const imagenes = Array.isArray(proyecto.evidencias)
      ? proyecto.evidencias.filter(e => e && e.es_imagen && e.es_galeria !== false)
      : [];
    currentProjectGalleryPage = 0;
    renderProjectGalleryImages(imagenes, puedeGestionar);
  }

  

  // Actualizar datos del proyecto (tarjetas_datos)

  const detailData = document.getElementById('detailData');

  if (detailData && proyecto.tarjetas_datos) {

    console.log('📊 Renderizando tarjetas de datos:', proyecto.tarjetas_datos.length);

    console.log('📊 Tarjetas recibidas:', proyecto.tarjetas_datos);

    

    // Eliminar duplicados por ID antes de renderizar

    const tarjetasUnicas = [];

    const idsVistos = new Set();

    

    proyecto.tarjetas_datos.forEach(tarjeta => {

      const tarjetaId = tarjeta.id || tarjeta.titulo;

      if (!idsVistos.has(tarjetaId)) {

        idsVistos.add(tarjetaId);

        tarjetasUnicas.push(tarjeta);

      } else {

        console.warn('⚠️ Tarjeta duplicada detectada y omitida:', tarjeta.titulo, 'ID:', tarjetaId);

      }

    });

    

    console.log('📊 Tarjetas únicas después de filtrar:', tarjetasUnicas.length);

    

    if (tarjetasUnicas.length === 0) {

      detailData.innerHTML = '<p style="color: #6c757d; grid-column: 1 / -1;">No hay datos del proyecto registrados.</p>';

    } else {

      detailData.innerHTML = tarjetasUnicas.map(tarjeta => {

        // Para la tarjeta de Beneficiarios, mostrar solo el número si contiene "beneficiarios" o "beneficiario"

        let valorMostrar = tarjeta.valor || 'Sin valor';

        if (tarjeta.titulo === 'Beneficiarios' && tarjeta.icono === '👨‍👩‍👧‍👦') {

          // Extraer solo el número del valor

          const numeroMatch = valorMostrar.toString().match(/^(\d+)/);

          if (numeroMatch) {

            valorMostrar = numeroMatch[1];

          }

        }

        return `

        <div class="data-item" style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; border-left: 3px solid #007bff;">

          <div class="data-icon" style="font-size: 2rem; margin-bottom: 8px;">${tarjeta.icono || '📊'}</div>

          <div class="data-content">

            <h4 style="margin: 0 0 8px 0; color: #ffffff; font-size: 1rem; font-weight: 600;">${tarjeta.titulo}</h4>

            <p style="margin: 0; color: #b8c5d1; font-size: 0.9rem;">${valorMostrar}</p>

          </div>

        </div>

      `;

      }).join('');

    }

  }

  

  // Actualizar comunidades alcanzadas

  const detailCommunities = document.getElementById('detailCommunities');

  if (detailCommunities) {

    const rawCommunities = [

      ...(Array.isArray(proyecto.communities) ? proyecto.communities : []),

      ...(Array.isArray(proyecto.comunidades) ? proyecto.comunidades : []),

    ];

    const normalizedCommunities = normalizeCommunitiesData(rawCommunities);

    if (normalizedCommunities.length) {

      loadCommunities(normalizedCommunities);

    } else {

      loadCommunities([]);

    }

  }

  

  // Actualizar archivos del proyecto

  const detailFiles = document.getElementById('detailFiles');

  if (detailFiles && Array.isArray(proyecto.archivos)) {

    // Verificar si el usuario tiene permisos (admin o personal)

    const puedeGestionar = puedeGestionarGaleria();

    

    if (proyecto.archivos.length === 0) {

      detailFiles.innerHTML = '<p style="color: #6c757d;">No hay archivos adjuntos para este proyecto.</p>';

    } else {

      detailFiles.innerHTML = proyecto.archivos.map(archivo => {

        const extension = archivo.es_imagen ? 'IMG' : (archivo.nombre.split('.').pop()?.toUpperCase() || 'FILE');

        const tamanioTexto = archivo.tamanio ? formatFileSize(archivo.tamanio) : '';

        const puedeEliminar = puedeGestionar && !archivo.es_evidencia; // Solo se pueden eliminar archivos que NO sean evidencias Y si tiene permisos
        const puedeEditar = puedeGestionar && !archivo.es_evidencia;
        const descripcionVisible = archivo.descripcion ? escapeHtml(archivo.descripcion) : '';
        const descripcionEncoded = archivo.descripcion ? encodeURIComponent(archivo.descripcion) : '';

        

        // Si puede gestionar, mostrar enlace clickeable, si no, solo texto

        const nombreArchivo = puedeGestionar 

          ? `<a href="${archivo.url}" target="_blank" style="color: #007bff; text-decoration: none; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${archivo.nombre}</a>`

          : `<span style="color: #6c757d; cursor: not-allowed;" title="Debes iniciar sesión como admin o personal para ver/descargar archivos">${archivo.nombre}</span>`;

        

        return `

          <div class="file-item" style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 15px; border-left: 3px solid ${archivo.es_evidencia ? '#6c757d' : '#007bff'};">

            <div class="file-icon" style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; color: #fff;">

              ${extension}

            </div>

            <div class="file-info" style="flex: 1;">

              <h4 style="margin: 0 0 4px 0; color: #ffffff; font-size: 0.95rem; font-weight: 600;">

                ${nombreArchivo}

              </h4>

              ${archivo.descripcion ? `<p style="margin: 0 0 4px 0; color: #b8c5d1; font-size: 0.85rem;">${descripcionVisible}</p>` : ''}

              <div style="display: flex; gap: 12px; align-items: center; font-size: 0.8rem; color: #6c757d;">

                ${tamanioTexto ? `<span>${tamanioTexto}</span>` : ''}

                ${archivo.es_imagen ? '<span style="color: #0ea5e9;">(Evidencia - Imagen)</span>' : (archivo.es_evidencia ? '<span style="color: #6c757d;">(Evidencia)</span>' : '<span style="color: #28a745;">(Archivo del proyecto)</span>')}

              </div>

            </div>

          ${puedeGestionar ? `
          <div class="file-actions">
            <a class="file-download-btn" href="${archivo.url}" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Descargar
            </a>
              ${puedeEditar ? `
                <button class="file-edit-btn" data-edit-archivo-id="${archivo.id}" data-archivo-descripcion="${descripcionEncoded}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                  </svg>
                  Editar
                </button>
              ` : ''}
              ${puedeEliminar ? `
                <button class="btn-danger btn-cover-remove" data-archivo-id="${archivo.id}" data-file-id="${archivo.id}" title="Eliminar archivo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Eliminar
                </button>
              ` : ''}
            </div>
          ` : ''}

          </div>

        `;

      }).join('');

      

      // Agregar event listeners a los botones de editar/eliminar solo si el usuario tiene permisos

      if (puedeGestionar) {

        detailFiles.querySelectorAll('[data-edit-archivo-id]').forEach(btn => {

          btn.addEventListener('click', function (e) {
            e.preventDefault();
            const archivoId = this.getAttribute('data-edit-archivo-id');
            const descripcion = this.getAttribute('data-archivo-descripcion');
            const decoded = descripcion ? decodeURIComponent(descripcion) : '';
            showEditProjectFileDescriptionModal(archivoId, decoded);
          });

        });

        detailFiles.querySelectorAll('[data-archivo-id]').forEach(btn => {

          btn.addEventListener('click', async function(e) {

            e.stopPropagation();

            const archivoId = this.getAttribute('data-archivo-id');

            

            // Obtener el nombre del archivo para el mensaje de confirmación

            const fileItem = this.closest('.file-item');

            const fileNameElement = fileItem ? fileItem.querySelector('.file-info h4 a, .file-info h4 span') : null;

            const fileName = fileNameElement ? fileNameElement.textContent.trim() : 'este archivo';

            

            // Mostrar modal de confirmación

            showConfirmDeleteModal(

              `¿Estás seguro de que deseas eliminar el archivo "${fileName}"? Esta acción no se puede deshacer.`,

              async () => {

                await eliminarArchivoProyecto(archivoId);

              }

            );

          });

        });

      }

    }

  } else if (detailFiles) {

    detailFiles.innerHTML = '<p style="color: #6c757d;">No hay archivos adjuntos para este proyecto.</p>';

  }

  

  // Cambios realizados

  console.log('🔍 Cambios del proyecto:', proyecto.cambios);

  console.log('🔍 Tipo de cambios:', typeof proyecto.cambios);

  console.log('🔍 Es array?:', Array.isArray(proyecto.cambios));

  console.log('🔍 Cantidad de cambios:', proyecto.cambios ? proyecto.cambios.length : 0);

  

  if (proyecto.cambios && proyecto.cambios.length > 0) {

    console.log('✅ Renderizando cambios:', proyecto.cambios.length);

    console.log('🔍 Primer cambio:', proyecto.cambios[0]);

    renderCambios(proyecto.cambios);

  } else {

    console.log('⚠️ No hay cambios para renderizar');

    console.log('🔍 proyecto.cambios es:', proyecto.cambios);

    const detailChanges = document.getElementById('detailChanges');

    console.log('🔍 Contenedor detailChanges encontrado:', detailChanges ? 'Sí' : 'No');

    if (detailChanges) {

      detailChanges.innerHTML = '<p style="color: #6c757d;">No hay cambios registrados para este proyecto.</p>';

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

          <div class="list-item-location">${project.location}</div>

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



// Variable global para almacenar los proyectos originales de la vista actual

let currentListViewProjects = [];

let currentListViewCategory = null;

let currentListViewTypeFilter = 'all';

let currentProjectSearchTerm = '';



function applyProjectListFilters() {

  let filteredProjects = [];

  // Si hay un término de búsqueda, buscar en TODOS los proyectos del sistema
  if (currentProjectSearchTerm.trim() !== '') {
    // Obtener todos los proyectos de todas las categorías
    const allProjects = [
      ...projectsData.capacitaciones,
      ...projectsData.entregas,
      ...projectsData['proyectos-ayuda']
    ];
    
    const searchLower = currentProjectSearchTerm.toLowerCase().trim();
    
    // Buscar en todos los proyectos
    filteredProjects = allProjects.filter((project) => {
      const nombre = (project.nombre || project.name || '').toLowerCase();
      const ubicacion = (project.ubicacion || project.location || '').toLowerCase();
      const descripcion = (project.descripcion || project.description || '').toLowerCase();
      
      // Buscar en nombre, ubicación y descripción
      return nombre.includes(searchLower) || 
             ubicacion.includes(searchLower) || 
             descripcion.includes(searchLower);
    });
    
    // Si hay un filtro de tipo activo, aplicarlo después de la búsqueda
    if (!currentListViewCategory && currentListViewTypeFilter !== 'all') {
      filteredProjects = filteredProjects.filter((project) => {
        const categoryKey = (project.categoryKey || project.category || '').toLowerCase();
        
        if (categoryKey === currentListViewTypeFilter) {
          return true;
        }
        
        const typeLabel = (project.type || '').toLowerCase();
        
        if (!typeLabel) {
          return false;
        }
        
        if (currentListViewTypeFilter === 'capacitaciones') {
          return typeLabel.includes('capacit');
        }
        
        if (currentListViewTypeFilter === 'entregas') {
          return typeLabel.includes('entrega');
        }
        
        if (currentListViewTypeFilter === 'proyectos-ayuda') {
          return typeLabel.includes('ayuda') || typeLabel.includes('proyecto');
        }
        
        return false;
      });
    }
  } else {
    // Si no hay búsqueda, usar la lógica normal con los proyectos de la vista actual
    filteredProjects = [...currentListViewProjects];
    
    if (!currentListViewCategory && currentListViewTypeFilter !== 'all') {
      filteredProjects = filteredProjects.filter((project) => {
        const categoryKey = (project.categoryKey || project.category || '').toLowerCase();
        
        if (categoryKey === currentListViewTypeFilter) {
          return true;
        }
        
        const typeLabel = (project.type || '').toLowerCase();
        
        if (!typeLabel) {
          return false;
        }
        
        if (currentListViewTypeFilter === 'capacitaciones') {
          return typeLabel.includes('capacit');
        }
        
        if (currentListViewTypeFilter === 'entregas') {
          return typeLabel.includes('entrega');
        }
        
        if (currentListViewTypeFilter === 'proyectos-ayuda') {
          return typeLabel.includes('ayuda') || typeLabel.includes('proyecto');
        }
        
        return false;
      });
    }
  }



  const projectsList = document.getElementById('projectsList');

  if (projectsList) {

    projectsList.innerHTML = generateListItems(filteredProjects, !currentListViewCategory);

    setTimeout(() => {

      addViewMoreListeners();

    }, 100);

  }

}



// Función para filtrar proyectos por nombre

function filterProjectsBySearch(searchTerm) {

  currentProjectSearchTerm = searchTerm || '';
  
  // Si hay un término de búsqueda, asegurarse de que estamos mostrando todos los proyectos
  if (searchTerm && searchTerm.trim() !== '') {
    // Si estamos en una categoría específica, cambiar a "Todos los Proyectos"
    if (currentListViewCategory) {
      // Actualizar los proyectos a todos los proyectos del sistema
      currentListViewProjects = [
        ...projectsData.capacitaciones,
        ...projectsData.entregas,
        ...projectsData['proyectos-ayuda']
      ];
      currentListViewCategory = null;
      
      // Actualizar el título y subtítulo
      const listTitle = document.getElementById('listTitle');
      const listSubtitle = document.getElementById('listSubtitle');
      if (listTitle) listTitle.textContent = 'Todos los Proyectos';
      if (listSubtitle) listSubtitle.textContent = 'Resultados de búsqueda en todos los proyectos';
      
      // Resetear el filtro de tipo a "Todos los tipos"
      const typeFilter = document.getElementById('projectTypeFilter');
      if (typeFilter) typeFilter.value = 'all';
      currentListViewTypeFilter = 'all';
    }
  }

  applyProjectListFilters();

}

// Exponer funciones globalmente para uso desde navigation.js
if (typeof window !== 'undefined') {
  window.showListView = showListView;
  window.filterProjectsBySearch = filterProjectsBySearch;
}



// Función para mostrar vista de lista

function showListView(category = null) {

  console.log('Intentando mostrar vista de lista, categoría:', category);

  

  const mainView = document.querySelector('.projects-main');

  const listView = document.getElementById('projectsListView');

  const listTitle = document.getElementById('listTitle');

  const listSubtitle = document.getElementById('listSubtitle');

  const projectsList = document.getElementById('projectsList');

  const searchInput = document.getElementById('projectSearchInput');

  const searchClearBtn = document.getElementById('searchClearBtn');

  const typeFilter = document.getElementById('projectTypeFilter');



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



  // Guardar los proyectos originales y la categoría actual

  currentListViewProjects = projects;

  currentListViewCategory = category;

  currentProjectSearchTerm = '';

  if (typeFilter) {

    if (category) {

      typeFilter.value = category;

      typeFilter.disabled = true;

      typeFilter.classList.add('is-disabled');

      currentListViewTypeFilter = category;

    } else {

      typeFilter.value = 'all';

      typeFilter.disabled = false;

      typeFilter.classList.remove('is-disabled');

      currentListViewTypeFilter = 'all';

    }

  } else {

    currentListViewTypeFilter = category || 'all';

  }



  // Actualizar títulos

  listTitle.textContent = title;

  listSubtitle.textContent = subtitle;



  // Limpiar el buscador

  if (searchInput) {

    searchInput.value = '';

  }

  if (searchClearBtn) {

    searchClearBtn.style.display = 'none';

  }



  applyProjectListFilters();



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

    changes: []

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

    changes: []

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

    changes: []

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

    changes: []

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
// Función para cargar los datos del proyecto en la vista detallada (LEGACY - usar mostrarDetalleProyecto)

function loadProjectDetail(project) {

  console.warn('⚠️ loadProjectDetail() está usando datos hardcodeados. Usar loadProjectDetails() para datos de API.');

  

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
  // NOTA: Deshabilitado porque mostrarDetalleProyecto() ya maneja la galería con renderProjectGalleryImages()
  // Esto evita duplicación de imágenes
  
  // if (project.gallery) {
  //   loadGalleryWithDescriptions(project.gallery);
  // }

  

  // Datos del proyecto

  const dataContainer = document.getElementById('detailData');

  if (dataContainer) {

    dataContainer.innerHTML = '';

    if (project.data && project.data.length > 0) {

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

    }

  }

  

  // Ubicación

  const projectCommunities = [

    ...(Array.isArray(project.communities) ? project.communities : []),

    ...(Array.isArray(project.comunidades) ? project.comunidades : []),

  ];

  if (projectCommunities.length) {

    const normalizedCommunities = normalizeCommunitiesData(projectCommunities);

    if (normalizedCommunities.length) {

      loadCommunities(normalizedCommunities);

    } else {

      loadCommunities([]);

    }

  } else {

    loadCommunities([]);

  }

  

  // Descripción

  const detailDescription = document.getElementById('detailDescription');

  if (detailDescription) {

    detailDescription.innerHTML = project.description || '';

  }

  

  // Cambios realizados - IMPORTANTE: usar project.cambios o project.changes

  const cambios = project.cambios || project.changes || [];

  console.log('🔍 loadProjectDetail - Cambios encontrados:', cambios);

  console.log('🔍 loadProjectDetail - Tipo:', typeof cambios);

  console.log('🔍 loadProjectDetail - Es array?:', Array.isArray(cambios));

  console.log('🔍 loadProjectDetail - Cantidad:', cambios.length);

  

  if (cambios && cambios.length > 0) {

    console.log('✅ loadProjectDetail - Renderizando cambios:', cambios.length);

    renderCambios(cambios);

  } else {

    console.log('⚠️ loadProjectDetail - No hay cambios para renderizar');

    const detailChanges = document.getElementById('detailChanges');

    if (detailChanges) {

      detailChanges.innerHTML = '<p style="color: #6c757d;">No hay cambios registrados para este proyecto.</p>';

    }

  }

  

  // Scroll al inicio

  window.scrollTo({ top: 0, behavior: 'smooth' });

  

  console.log('✅ Vista de detalle actualizada (loadProjectDetail)');

}



// Función para abrir modal de imagen (placeholder)

function openImageModal(imageUrl) {

  // Por ahora, abrir en nueva pestaña

  window.open(imageUrl, '_blank');

}



// Función para volver a la vista principal desde la vista detallada

function backFromDetail() {

  console.log('🔙 Volviendo a la vista principal');

  resetProjectPermissionState();
  projectActionButtonSelectors = buildProjectActionButtonSelectors();

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

let pendingProjectGalleryImages = [];
let currentProjectGalleryImages = [];
let currentProjectGalleryPage = 0;
let currentProjectGalleryCanManage = false;
const PROJECT_GALLERY_PAGE_SIZE = 3;
const FEATURED_PROJECTS_LIMIT = 3;
let featuredProjectsData = [];
let shouldRefreshLatestProjects = false;

let currentProjectFileEdit = null;

function revokePendingImagePreview(item) {
  if (!item) {
    return;
  }

  if (
    item.objectUrl &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    try {
      URL.revokeObjectURL(item.objectUrl);
    } catch (error) {
      console.warn('No se pudo liberar el recurso de previsualización de imagen:', error);
    }
    item.objectUrl = null;
  }
}

function getGuatemalaDateParts(sourceDate = new Date()) {
  const baseFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = baseFormatter.formatToParts(sourceDate);
  const getValue = (type) => {
    const part = parts.find((item) => item.type === type);
    return part ? part.value : '';
  };

  const year = getValue('year');
  const month = getValue('month');
  const day = getValue('day');
  const hour = getValue('hour');
  const minute = getValue('minute');

  const formatted = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(sourceDate);

  return {
    year,
    month,
    day,
    hour,
    minute,
    formatted,
  };
}

// Variable para almacenar archivos de evidencias seleccionados en el modal de cambios

let selectedEvidencesFiles = [];



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

let puedeGestionarProyectoActual = Boolean(
  window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin
);

function resetProjectPermissionState() {
  puedeGestionarProyectoActual = false;
  window.USER_AUTH = window.USER_AUTH || {};
  window.USER_AUTH.permisos = Object.assign({}, window.USER_AUTH.permisos || {});
  window.USER_AUTH.permisos.puede_gestionar = false;
  try {
    aplicarVisibilidadBotonesGestion(false);
  } catch (error) {
    console.warn('No se pudo aplicar visibilidad de botones al resetear permisos:', error);
  }
}

let usuarioActualInfoCache = null;
let usuarioActualInfoPromise = null;

const MENSAJE_PERMISOS_INSUFICIENTES = 'No tienes permisos para gestionar este evento.';

const PROJECT_ACTION_BUTTON_SELECTOR_LIST_BASE = [
  '#addImageBtn',
  '#editDataBtn',
  '#editDescriptionBtn',
];

function buildProjectActionButtonSelectors() {
  if (!window.USER_AUTH || !window.USER_AUTH.isAuthenticated) {
    return [];
  }

  const selectors = PROJECT_ACTION_BUTTON_SELECTOR_LIST_BASE.slice();

  const permissions = (window.USER_AUTH && window.USER_AUTH.permisos) || {};
  const puedeGestionar = Boolean(puedeGestionarProyectoActual) || Boolean(permissions.puede_gestionar);

  if (puedeGestionar) {
    selectors.push('#addChangeBtn', '#addFileBtn');
  }

  return selectors;
}

let projectActionButtonSelectors = buildProjectActionButtonSelectors();

function isProjectActionButton(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  if (typeof element.matches === 'function') {
    return projectActionButtonSelectors.some((selector) => element.matches(selector));
  }

  const id = element.getAttribute && element.getAttribute('id');
  if (!id) {
    return false;
  }

  return projectActionButtonSelectors.some((selector) => selector === `#${id}`);
}

function findProjectActionButton(startElement) {
  let node = startElement;

  while (node && node !== document) {
    if (isProjectActionButton(node)) {
      return node;
    }

    node = node.parentNode;
  }

  return null;
}

let projectActionHandlersRegistered = false;
let modalCloseHandlersRegistered = false;

function handleProjectActionButtonClick(event) {
  projectActionButtonSelectors = buildProjectActionButtonSelectors();
  const actionButton = findProjectActionButton(event.target);
  if (!actionButton || actionButton.disabled) {
    return;
  }

  switch (actionButton.id) {
    case 'addImageBtn':
      showAddImageModal();
      break;
    case 'editDataBtn':
      showEditDataModal();
      break;
    case 'addChangeBtn':
      showAddChangeModal();
      break;
    case 'addFileBtn':
      showAddFileModal();
      break;
    case 'editDescriptionBtn':
      showEditDescriptionModal();
      break;
    default:
      break;
  }
}

function ensureProjectActionHandlers() {
  projectActionButtonSelectors = buildProjectActionButtonSelectors();

  if (projectActionHandlersRegistered) {
    return;
  }

  document.addEventListener('click', handleProjectActionButtonClick);
  projectActionHandlersRegistered = true;
}

const MODAL_CLOSE_MAPPING = {
  closeImageModal: 'addImageModal',
  cancelImageBtn: 'addImageModal',
  closeDescriptionModal: 'editDescriptionModal',
  cancelDescriptionBtn: 'editDescriptionModal',
  closeDataModal: 'editDataModal',
  cancelDataBtn: 'editDataModal',
  closeCommunityModal: 'addCommunityModal',
  cancelCommunityBtn: 'addCommunityModal',
  closePersonnelModal: 'addPersonnelModal',
  cancelPersonnelBtn: 'addPersonnelModal',
  closeChangeModal: 'addChangeModal',
  cancelChangeBtn: 'addChangeModal',
  closeFileModal: 'addFileModal',
  cancelFileBtn: 'addFileModal',
  closeFileDescriptionModal: 'editFileDescriptionModal',
  cancelFileDescriptionBtn: 'editFileDescriptionModal',
  closeAddEvidenceModal: 'addEvidenceModal',
  cancelEvidenceBtn: 'addEvidenceModal',
  closeChangeDetailsBtn: 'changeDetailsModal',
  closeChangeDetailsModal: 'changeDetailsModal',
  closeImageViewModal: 'imageViewModal',
};

function findModalDismissButton(startElement) {
  let node = startElement;

  while (node && node !== document) {
    if (node.id && MODAL_CLOSE_MAPPING[node.id]) {
      return node;
    }

    node = node.parentNode;
  }

  return null;
}

function handleModalDismissClick(event) {
  const dismissButton = findModalDismissButton(event.target);
  if (!dismissButton) {
    return;
  }

  const modalId = MODAL_CLOSE_MAPPING[dismissButton.id];
  if (!modalId) {
    return;
  }

  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  hideModal(modalId);
}

function ensureModalCloseHandlers() {
  if (modalCloseHandlersRegistered) {
    return;
  }

  document.addEventListener('click', handleModalDismissClick);
  modalCloseHandlersRegistered = true;
}

async function obtenerUsuarioActualInfo() {
  if (!window.USER_AUTH || !window.USER_AUTH.isAuthenticated) {
    return null;
  }

  if (usuarioActualInfoCache) {
    return usuarioActualInfoCache;
  }

  if (usuarioActualInfoPromise) {
    return usuarioActualInfoPromise;
  }

  const url = (window.DJANGO_URLS && window.DJANGO_URLS.usuario) || '/api/usuario/';

  usuarioActualInfoPromise = fetch(url, { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then(data => {
      if (data && data.autenticado !== false) {
        usuarioActualInfoCache = data;

        window.USER_AUTH = window.USER_AUTH || {};

        if (typeof data.isAdmin === 'boolean') {
          window.USER_AUTH.isAdmin = data.isAdmin;
        }

        if (typeof data.permisos === 'object' && data.permisos) {
          window.USER_AUTH.permisos = Object.assign(
            {},
            window.USER_AUTH.permisos || {},
            data.permisos
          );

          if (typeof data.permisos.es_personal === 'boolean') {
            window.USER_AUTH.isPersonal = data.permisos.es_personal;
          }

          if (typeof data.permisos.es_admin === 'boolean') {
            window.USER_AUTH.isAdmin = window.USER_AUTH.isAdmin || data.permisos.es_admin;
          }
        }

        if (data.userId) {
          window.USER_AUTH.userId = data.userId;
        } else if (data.id) {
          window.USER_AUTH.userId = data.id;
        }

        if (data.collaboratorId || data.colaborador_id) {
          window.USER_AUTH.collaboratorId = data.collaboratorId || data.colaborador_id;
        }

        if (data.username) {
          window.USER_AUTH.username = data.username;
        }
      }

      return usuarioActualInfoCache;
    })
    .catch(error => {
      console.error('Error al obtener la información del usuario actual:', error);
      return null;
    })
    .finally(() => {
      usuarioActualInfoPromise = null;
    });

  return usuarioActualInfoPromise;
}

function obtenerIdentificadoresPersonal(proyecto) {
  const ids = new Set();
  const usernames = new Set();

  if (!proyecto || !Array.isArray(proyecto.personal)) {
    if (proyecto && proyecto.responsable_id) {
      ids.add(String(proyecto.responsable_id));
    }
    if (proyecto && proyecto.responsable_colaborador_id) {
      ids.add(String(proyecto.responsable_colaborador_id));
    }
    if (proyecto && proyecto.responsable_username) {
      usernames.add(String(proyecto.responsable_username).toLowerCase());
    }
    return { ids, usernames };
  }

  proyecto.personal.forEach(persona => {
    if (!persona) {
      return;
    }

    const posiblesIds = [
      persona.id,
      persona.colaborador_id,
      persona.colaboradorId,
      persona.usuario_id,
      persona.usuarioId
    ];

    posiblesIds.forEach(valor => {
      if (valor || valor === 0) {
        ids.add(String(valor));
      }
    });

    if (persona.username) {
      usernames.add(String(persona.username).toLowerCase());
    }

    if (persona.usuario_username) {
      usernames.add(String(persona.usuario_username).toLowerCase());
    }
  });

  if (proyecto.responsable_id) {
    ids.add(String(proyecto.responsable_id));
  }

  if (proyecto.responsable_colaborador_id) {
    ids.add(String(proyecto.responsable_colaborador_id));
  }

  if (proyecto.responsable_username) {
    usernames.add(String(proyecto.responsable_username).toLowerCase());
  }

  return { ids, usernames };
}

async function usuarioPuedeGestionarProyecto(proyecto) {
  if (!proyecto) {
    return false;
  }

  if (typeof proyecto.puede_gestionar === 'boolean') {
    return proyecto.puede_gestionar;
  }

  if (proyecto.permisos && typeof proyecto.permisos.puede_gestionar === 'boolean') {
    return proyecto.permisos.puede_gestionar;
  }

  if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin) {
    return true;
  }

  if (!window.USER_AUTH || !window.USER_AUTH.isAuthenticated) {
    return false;
  }

  const info = await obtenerUsuarioActualInfo();
  const assigned = obtenerIdentificadoresPersonal(proyecto);

  const collaboratorId =
    (info && (info.collaboratorId || info.colaborador_id)) || window.USER_AUTH.collaboratorId;
  const userId = (info && (info.userId || info.id)) || window.USER_AUTH.userId;
  const username = (info && info.username) || window.USER_AUTH.username || '';

  if (collaboratorId && assigned.ids.has(String(collaboratorId))) {
    return true;
  }

  if (userId && assigned.ids.has(String(userId))) {
    return true;
  }

  if (username && assigned.usernames.has(String(username).toLowerCase())) {
    return true;
  }

  return false;
}

function tienePermisoGestionActual() {
  console.log('🔐 Verificando permisos de gestión:');
  console.log('  - window.USER_AUTH:', window.USER_AUTH);
  console.log('  - isAuthenticated:', window.USER_AUTH?.isAuthenticated);
  console.log('  - isAdmin:', window.USER_AUTH?.isAdmin);
  console.log('  - isPersonal:', window.USER_AUTH?.isPersonal);
  console.log('  - puedeGestionarProyectoActual:', puedeGestionarProyectoActual);
  console.log('  - USER_AUTH.permisos:', window.USER_AUTH?.permisos);
  
  if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin) {
    console.log('✅ Permiso concedido: Usuario es admin');
    return true;
  }
  
  const resultado = !!puedeGestionarProyectoActual;
  console.log(resultado ? '✅ Permiso concedido: puedeGestionarProyectoActual es true' : '❌ Permiso denegado: puedeGestionarProyectoActual es false');
  return resultado;
}

function mostrarMensajePermisoDenegado() {
  if (typeof showErrorMessage === 'function') {
    showErrorMessage(MENSAJE_PERMISOS_INSUFICIENTES);
  } else {
    alert(MENSAJE_PERMISOS_INSUFICIENTES);
  }
}

function aplicarVisibilidadBotonesGestion(puedeGestionar) {
  const toggleElementoGestion = (element) => {
    if (!element) {
      return;
    }

    if (!element.dataset.originalDisplayValue) {
      const computed = window.getComputedStyle(element);
      let originalDisplay = computed ? computed.display : '';
      if (!originalDisplay || originalDisplay === 'none') {
        originalDisplay = element.tagName === 'BUTTON' ? 'inline-flex' : 'block';
      }
      element.dataset.originalDisplayValue = originalDisplay;
    }

    if (puedeGestionar) {
      element.style.display = element.dataset.originalDisplayValue || '';
      element.removeAttribute('aria-hidden');
      element.classList.remove('is-hidden-by-permissions');
      if (element.tagName === 'BUTTON') {
        element.disabled = false;
      }
    } else {
      if (element.tagName === 'BUTTON') {
        element.disabled = true;
      }
      element.style.display = 'none';
      element.setAttribute('aria-hidden', 'true');
      element.classList.add('is-hidden-by-permissions');
    }
  };

  const manageClassSelectors = ['.btn-edit-item', '.btn-add-evidence'];
  manageClassSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(toggleElementoGestion);
  });

  const manageIdSelectors = ['#addCustomCardBtn'];
  manageIdSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(toggleElementoGestion);
  });

  const manageDisableOnlySelectors = [
    '#confirmCommunitySelectionBtn',
    '#confirmChangeSelectionBtn',
    '#confirmFileSelectionBtn',
    '#confirmDeleteBtn'
  ];

  manageDisableOnlySelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.disabled = !puedeGestionar;
    });
  });

  document.querySelectorAll('.remove-card-btn').forEach(btn => {
    if (puedeGestionar) {
      btn.disabled = false;
      btn.classList.remove('disabled');
    } else {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
  });

  const selectedCardsContainer = document.getElementById('selectedCardsContainer');
  if (selectedCardsContainer && typeof loadSelectedCards === 'function') {
    loadSelectedCards();
  }
}



// Función para verificar si el usuario puede gestionar la galería (admin o personal)

function puedeGestionarGaleria() {
  if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin) {
    return true;
  }
  return !!puedeGestionarProyectoActual;
}



// Función para obtener el proyecto actual

function getCurrentProject() {

  // Usar currentProjectData si está disponible y tiene id

  if (currentProjectData && currentProjectData.id) {

    console.log('✅ Proyecto actual obtenido desde currentProjectData:', currentProjectData.id);

    return currentProjectData;

  }

  

  // Fallback al proyecto por ID

  if (currentProjectId && projectDetails[currentProjectId]) {

    console.log('✅ Proyecto actual obtenido desde projectDetails:', currentProjectId);

    return projectDetails[currentProjectId];

  }

  

  // Si currentProjectData existe pero no tiene id, intentar obtenerlo del URL o de otra forma

  if (currentProjectData) {

    console.log('⚠️ currentProjectData existe pero sin id:', currentProjectData);

    // Intentar obtener el ID del URL si está disponible

    const urlParams = new URLSearchParams(window.location.search);

    const projectId = urlParams.get('id');

    if (projectId) {

      currentProjectData.id = projectId;

      currentProjectId = projectId;

      return currentProjectData;

    }

  }

  

  console.error('❌ No se pudo obtener el proyecto actual');

  return null;

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

    const firstTextarea = modal.querySelector('textarea');
    if (firstTextarea) {
      setTimeout(() => firstTextarea.focus(), 120);
    }

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

    

    // Limpiar formulario de cambios si se cierra el modal de cambios

    if (modalId === 'addChangeModal') {

      clearChangeForm();

    }

  }

}



// Función para mostrar modal de credenciales

function showCredentialsModal(callback = null) {

  // Verificar que los elementos existan antes de usarlos

  const adminUsername = document.getElementById('adminUsername');

  const adminPassword = document.getElementById('adminPassword');

  

  // Limpiar campos antes de mostrar el modal (solo si existen)

  if (adminUsername) adminUsername.value = '';

  if (adminPassword) adminPassword.value = '';

  

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

function openCommunityInlinePanel({ hostCard, community, regionId, description }) {
  closeCommunityInlinePanel(hostCard);

  const panelDescriptionRaw =
    description ||
    community.description ||
    community.detail ||
    community.descripcion ||
    community.descripcion_general ||
    '';
  const panelDescription = typeof panelDescriptionRaw === 'string' ? panelDescriptionRaw.trim() : '';
  const hasPanelDescription = Boolean(panelDescription);
  let panelDateHtml = '';
  if (community.agregado_en) {
    const fechaDetail = new Date(community.agregado_en);
    if (!Number.isNaN(fechaDetail.getTime())) {
      const fechaTexto = fechaDetail.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      });
      panelDateHtml = `<p class="community-inline-panel__date">Agregada el ${escapeHtml(fechaTexto)}</p>`;
    }
  }

  const panel = document.createElement('div');
  panel.className = 'community-inline-panel';
  panel.innerHTML = `
    <div class="community-inline-panel__content">
      <header class="community-inline-panel__header">
        <div class="community-inline-panel__title-group">
          <h3>${escapeHtml(community.name)}</h3>
          <p>${escapeHtml(community.region || 'Sin región asignada')}</p>
          ${panelDateHtml}
        </div>
        <button type="button" class="community-inline-panel__close" aria-label="Cerrar panel">×</button>
      </header>

      <section class="community-inline-panel__body">
        ${
          hasPanelDescription
            ? `
        <div class="community-inline-panel__description">
          <h4>Descripción</h4>
          <p>${escapeHtml(panelDescription)}</p>
        </div>
        `
            : ''
        }
        <div class="community-inline-panel__actions">
          <button type="button" class="btn-secondary community-inline-panel__action" data-region-id="${regionId || ''}">
            Ver región
          </button>
          <button type="button" class="btn-primary community-inline-panel__action" data-community-id="${community.id || ''}">
            Ver comunidad
          </button>
        </div>
      </section>
    </div>
  `;

  hostCard.classList.add('is-open');
  hostCard.appendChild(panel);

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  panel.querySelector('.community-inline-panel__close').addEventListener('click', (event) => {
    event.stopPropagation();
    closeCommunityInlinePanel(hostCard);
  });

  panel.querySelectorAll('.community-inline-panel__action').forEach((actionBtn) => {
    actionBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      const regionTarget = actionBtn.getAttribute('data-region-id');
      const communityTarget = actionBtn.getAttribute('data-community-id');

      closeCommunityInlinePanel(hostCard);

      if (regionTarget) {
        await navigateToRegion(regionTarget);
      } else if (communityTarget) {
        await navigateToCommunity(communityTarget);
      }
    });
  });
}

function closeCommunityInlinePanel(card) {
  if (!card) return;
  card.classList.remove('is-open');
  const panel = card.querySelector('.community-inline-panel');
  if (panel) {
    panel.remove();
  }
}

function showCommunityDetailPanel({ communityId, regionId, communities }) {
  const community = communities.find((item) => item.id === communityId);
  if (!community) {
    showErrorMessage('No se encontró información de la comunidad.');
    return;
  }

  const targetCard = document.querySelector(`.location-item--community[data-community-id="${communityId}"]`);

  if (targetCard) {
    const descriptionText = targetCard.dataset.description || community.description || community.detail || 'No hay descripción disponible para esta comunidad.';

    openCommunityInlinePanel({
      hostCard: targetCard,
      community,
      regionId,
      description: descriptionText,
    });
    targetCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function redirectToDetailPage({ storageKey, queryParam, targetId, pathname }) {
  if (!targetId) {
    return;
  }

  const targetValue = String(targetId).trim();
  if (!targetValue) {
    return;
  }

  try {
    if (typeof window.sessionStorage !== 'undefined') {
      const payload = JSON.stringify({ id: targetValue, timestamp: Date.now() });
      window.sessionStorage.setItem(storageKey, payload);
    }
  } catch (storageError) {
    console.warn(`⚠️ No se pudo guardar ${storageKey} en sessionStorage:`, storageError);
  }

  try {
    const targetUrl = new URL(pathname, window.location.origin);
    if (queryParam) {
      targetUrl.searchParams.set(queryParam, targetValue);
    }
    window.location.href = targetUrl.toString();
  } catch (urlError) {
    console.warn('⚠️ No se pudo construir la URL con URL API, usando fallback:', urlError);
    const querySuffix = queryParam ? `?${encodeURIComponent(queryParam)}=${encodeURIComponent(targetValue)}` : '';
    window.location.href = `${pathname}${querySuffix}`;
  }
}

async function navigateToRegion(regionId) {
  const normalizedId = regionId !== undefined && regionId !== null ? String(regionId).trim() : '';

  if (!normalizedId) {
    showErrorMessage('No se encontró la región asociada a esta comunidad.');
    return;
  }

  try {
    if (typeof window.showRegionDetail === 'function') {
      await window.showRegionDetail(normalizedId);
      return;
    }
  } catch (error) {
    console.error('Error al navegar a la región:', error);
  }

  redirectToDetailPage({
    storageKey: 'pendingRegionDetail',
    queryParam: 'region',
    targetId: normalizedId,
    pathname: '/regiones/',
  });
}

async function navigateToCommunity(communityId) {
  const normalizedId = communityId !== undefined && communityId !== null ? String(communityId).trim() : '';

  if (!normalizedId) {
    showErrorMessage('No se encontró la comunidad seleccionada.');
    return;
  }

  try {
    if (typeof window.showCommunityDetail === 'function') {
      await window.showCommunityDetail(normalizedId);
      return;
    }
  } catch (error) {
    console.error('Error al navegar a la comunidad:', error);
  }

  redirectToDetailPage({
    storageKey: 'pendingCommunityDetail',
    queryParam: 'community',
    targetId: normalizedId,
    pathname: '/comunidades/',
  });
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



// Normalizar datos de comunidades provenientes de distintas fuentes

function normalizeCommunitiesData(rawList) {
  if (!Array.isArray(rawList)) {
    return [];
  }

  const seenKeys = new Set();
  const normalized = [];

  rawList.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const regionObject = item.region && typeof item.region === 'object' ? item.region : null;

    const regionName =
      item.region_nombre ||
      item.region_name ||
      (regionObject && (regionObject.nombre || regionObject.name)) ||
      (typeof item.region === 'string' ? item.region : '');

    const regionSede =
      item.region_sede ||
      (regionObject &&
        (regionObject.sede ||
          regionObject.location ||
          regionObject.descripcion ||
          regionObject.detail)) ||
      (typeof item.sede === 'string' ? item.sede : '');

    const regionText =
      regionName && regionSede
        ? `${regionName} — ${regionSede}`
        : regionName || regionSede || '';

    const descriptionText =
      item.description ||
      item.descripcion ||
      item.detalle ||
      item.detail ||
      item.descripcion_general ||
      '';

    const normalizedItem = {
      ...item,
      id: item.id ?? item.comunidad_id ?? item.community_id ?? item.uuid ?? item.pk ?? '',
      name:
        item.name ??
        item.nombre ??
        item.comunidad_nombre ??
        item.community_name ??
        'Comunidad sin nombre',
      // También mantener el nombre original para compatibilidad
      nombre: item.nombre ?? item.comunidad_nombre ?? item.name ?? 'Comunidad sin nombre',
      comunidad_nombre: item.comunidad_nombre ?? item.nombre ?? item.name ?? 'Comunidad sin nombre',
      region:
        regionText ||
        (typeof item.region === 'string' ? item.region : '') ||
        (typeof item.type === 'string' ? item.type : '') ||
        'Sin región asignada',
      region_id: item.region_id ?? (regionObject && (regionObject.id || regionObject.pk)) ?? '',
      region_nombre: (item.region_nombre ?? regionName) || 'Sin región asignada',
      region_sede: (item.region_sede ?? regionSede) || '',
      description: descriptionText,
      agregado_en: item.agregado_en || item.creado_en || item.created_at || null,
    };

    if (typeof normalizedItem.name === 'string') {
      normalizedItem.name = normalizedItem.name.trim() || 'Comunidad sin nombre';
    }

    if (typeof normalizedItem.region === 'string') {
      normalizedItem.region = normalizedItem.region.trim() || 'Sin región asignada';
    } else {
      normalizedItem.region = 'Sin región asignada';
    }

    const uniqueKey = normalizedItem.id || normalizedItem.name;

    if (uniqueKey && seenKeys.has(uniqueKey)) {
      return;
    }

    if (uniqueKey) {
      seenKeys.add(uniqueKey);
    }

    normalized.push(normalizedItem);
  });

  return normalized;
}

// Función para cargar comunidades

function loadCommunities(communities) {
  const container = document.getElementById('detailCommunities');

  if (!container) return;

  container.innerHTML = '';

  const communitiesList = Array.isArray(communities) ? communities : [];

  if (!communitiesList.length) {
    container.innerHTML = `
      <div class="communities-empty">
        <p>No hay comunidades registradas para este proyecto.</p>
      </div>
    `;
    return;
  }

  communitiesList.forEach((community) => {
    const card = document.createElement('div');
    card.className = 'location-item location-item--community';

    const descriptionText =
      community.description ||
      community.detail ||
      community.descripcion ||
      community.descripcion_general ||
      '';
    card.dataset.communityId = community.id || '';
    card.dataset.description = descriptionText;
    card.dataset.regionId = community.region_id || '';

    const regionLabel = escapeHtml(community.region || 'Sin región asignada');
    const communityName = escapeHtml(community.name || 'Comunidad sin nombre');
    const hasDescription = Boolean(community.description && community.description.trim());
    let fechaHtml = '';
    if (community.agregado_en) {
      const fecha = new Date(community.agregado_en);
      if (!Number.isNaN(fecha.getTime())) {
        const fechaTexto = fecha.toLocaleDateString('es-GT', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
        fechaHtml = `<p class="location-card-date">Agregada el ${escapeHtml(fechaTexto)}</p>`;
      }
    }

    card.innerHTML = `
      <div class="location-card-main">
      <div class="location-icon">📍</div>
      <div class="location-content">
          <h4>${communityName}</h4>
          <p class="location-card-region">${regionLabel}</p>
          ${fechaHtml}
        </div>
      </div>
      ${hasDescription ? `<p class="location-card-description">${escapeHtml(descriptionText)}</p>` : ''}
    `;

    const openPanel = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (card.classList.contains('is-open')) {
        closeCommunityInlinePanel(card);
        return;
      }

      container.querySelectorAll('.location-item--community.is-open').forEach((openCard) => {
        if (openCard !== card) {
          closeCommunityInlinePanel(openCard);
        }
      });

      openCommunityInlinePanel({
        hostCard: card,
        community,
        regionId: community.region_id || '',
        description: descriptionText,
      });
    };

    card.addEventListener('click', openPanel);

    container.appendChild(card);
  });
}
// Función para renderizar cambios desde la API

function renderCambios(cambios) {

  console.log('🎨 renderCambios llamado');

  console.log('🎨 Tipo de cambios recibidos:', typeof cambios);

  console.log('🎨 Es array?:', Array.isArray(cambios));

  console.log('🎨 Cantidad:', cambios ? cambios.length : 0);

  console.log('🎨 Datos completos:', cambios);

  

  const container = document.getElementById('detailChanges');

  console.log('🎨 Contenedor encontrado:', container ? 'Sí' : 'No');

  if (!container) {

    console.error('❌ No se encontró el contenedor detailChanges');

    console.error('❌ Intentando buscar contenedor...');

    const altContainer = document.querySelector('#detailChanges');

    console.error('❌ Resultado querySelector:', altContainer ? 'Encontrado' : 'No encontrado');

    return;

  }



  container.innerHTML = '';

  

  console.log('🎨 renderCambios llamado con:', cambios);

  

  if (!cambios || cambios.length === 0) {

    console.log('⚠️ No hay cambios para renderizar');

    container.innerHTML = '<p style="color: #6c757d;">No hay cambios registrados para este proyecto.</p>';

    return;

  }

  

  console.log(`✅ Renderizando ${cambios.length} cambios`);

  

  // Verificar si el usuario puede gestionar (admin o personal)

  const puedeGestionar = puedeGestionarGaleria();

  

  cambios.forEach((cambio, index) => {

    console.log(`🎨 Renderizando cambio ${index + 1}:`, cambio);

    console.log(`🎨 ID del cambio:`, cambio.id);

    console.log(`🎨 Descripción:`, cambio.descripcion);

    console.log(`🎨 Fecha display:`, cambio.fecha_display);

    console.log(`🎨 Responsable:`, cambio.responsable);
    
    console.log(`🏘️ Comunidades del cambio:`, cambio.comunidades);
    console.log(`🏘️ Comunidades_nombres del cambio:`, cambio.comunidades_nombres);
    console.log(`🏘️ Tipo de comunidades:`, typeof cambio.comunidades);
    console.log(`🏘️ Comunidades vacío?:`, cambio.comunidades === '' || cambio.comunidades === null || cambio.comunidades === undefined);

    // Obtener el texto de comunidades
    let comunidadesTexto = '';
    if (cambio.comunidades && typeof cambio.comunidades === 'string' && cambio.comunidades.trim() !== '') {
      comunidadesTexto = cambio.comunidades.trim();
    } else if (cambio.comunidades_nombres && typeof cambio.comunidades_nombres === 'string' && cambio.comunidades_nombres.trim() !== '') {
      comunidadesTexto = cambio.comunidades_nombres.trim();
    }
    
    console.log(`🏘️ Texto final de comunidades:`, comunidadesTexto);

    const changeItem = document.createElement('div');

    changeItem.className = 'change-item clickable';

    changeItem.setAttribute('data-cambio-id', cambio.id);
    if (cambio.grupo_id) {
      changeItem.setAttribute('data-grupo-id', cambio.grupo_id);
    }

    changeItem.innerHTML = `
      <div class="change-content">
        <div class="change-date">${cambio.fecha_display || cambio.fecha_cambio || 'Sin fecha'}</div>
        <div class="change-description">${cambio.descripcion || 'Sin descripción'}</div>
        <div class="change-personnel">Por: ${cambio.responsables_display || cambio.responsable || 'Sin responsable'}</div>
        ${comunidadesTexto ? 
          `<div class="change-communities" style="margin-top: 8px; color: #0ea5e9; font-size: 0.9rem; display: block !important; visibility: visible !important; opacity: 1 !important;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Trabajado en: ${escapeHtml(comunidadesTexto)}
          </div>` : 
          ''
        }
        ${cambio.evidencias && cambio.evidencias.length > 0 ? 
          `<div class="change-evidences-count">${cambio.evidencias.length} evidencia(s)</div>` : 
          '<div class="change-evidences-count">Sin evidencias</div>'
        }
      </div>

      ${puedeGestionar ? `

      <div style="display: flex; gap: 8px;">

        <button class="btn-edit-item" data-cambio-id="${cambio.id}" title="Editar cambio" style="background: rgba(0, 123, 255, 0.9); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>

            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>

          </svg>

          Editar

        </button>

        <button class="btn-delete-item" data-cambio-id="${cambio.id}" title="Eliminar cambio" style="background: rgba(220, 53, 69, 0.9); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

            <line x1="18" y1="6" x2="6" y2="18"></line>

            <line x1="6" y1="6" x2="18" y2="18"></line>

          </svg>

          Eliminar

        </button>

      </div>

      ` : ''}

    `;

    container.appendChild(changeItem);

    

    // Agregar event listeners directamente a los botones si el usuario tiene permisos

    if (puedeGestionar) {

      const editBtn = changeItem.querySelector('.btn-edit-item');

      const deleteBtn = changeItem.querySelector('.btn-delete-item');

      

      if (editBtn) {

        editBtn.addEventListener('click', function(e) {

          e.stopPropagation();

          e.preventDefault();

          editarCambio(cambio.id, cambio);

        });

      }

      

      if (deleteBtn) {

        deleteBtn.addEventListener('click', function(e) {

          e.stopPropagation();

          e.preventDefault();

          confirmarEliminarCambio(cambio.id, cambio);

        });

      }

      

      // Event listener para mostrar detalles al hacer clic en el cambio (solo para usuarios autenticados)

      changeItem.addEventListener('click', function(e) {

        // Solo mostrar detalles si no se hizo clic en un botón

        if (!e.target.closest('.btn-edit-item') && !e.target.closest('.btn-delete-item')) {

          showChangeDetailsModal(cambio);

        }

      });

    } else {

      // Si no tiene permisos, NO agregar event listener de clic y remover clase clickable

      changeItem.classList.remove('clickable');

      changeItem.style.cursor = 'default';

      changeItem.style.opacity = '0.9';

      changeItem.title = 'Debes iniciar sesión como admin o personal para ver detalles del cambio';

    }

    

    console.log(`✅ Cambio ${index + 1} agregado al DOM`);

  });

  

  console.log('✅ Cambios renderizados correctamente. Total elementos en contenedor:', container.children.length);

}
// Función para mostrar modal de imagen en tamaño completo

function showImageViewModal(imageUrl, imageDescription = '') {

  const modal = document.getElementById('imageViewModal');

  const fullSizeImage = document.getElementById('fullSizeImage');

  const imageViewDescription = document.getElementById('imageViewDescription');

  

  if (!modal || !fullSizeImage) {

    console.error('Modal de imagen no encontrado');

    return;

  }

  

  // Establecer la imagen y descripción

  fullSizeImage.src = imageUrl;

  fullSizeImage.alt = imageDescription || 'Imagen en tamaño completo';

  imageViewDescription.textContent = imageDescription || '';

  

  // Mostrar el modal

  modal.classList.add('active');

  document.body.style.overflow = 'hidden';

}



// Función para cerrar modal de imagen

function closeImageViewModal() {

  const modal = document.getElementById('imageViewModal');

  if (modal) {

    modal.classList.remove('active');

    document.body.style.overflow = '';

  }

}



// Función para mostrar modal de agregar imagen

function showAddImageModal() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  showModal('addImageModal');

  clearImageForm();

}



// Función para limpiar formulario de imagen

function clearImageForm() {
  const fileInput = document.getElementById('imageFileInput');
  if (fileInput) {
    fileInput.value = '';
  }
  pendingProjectGalleryImages.forEach(revokePendingImagePreview);
  pendingProjectGalleryImages = [];
  renderPendingProjectImages();
}

function renderPendingProjectImages() {
  console.log('🖼️ renderPendingProjectImages() llamada');
  console.log('🖼️ Imágenes pendientes:', pendingProjectGalleryImages.length);
  
  const previewContainer = document.getElementById('imagePreview');
  console.log('🖼️ Preview container:', previewContainer);
  
  if (!previewContainer) {
    console.warn('⚠️ Preview container NO encontrado');
    return;
  }

  previewContainer.innerHTML = '';

  if (!pendingProjectGalleryImages.length) {
    console.log('ℹ️ No hay imágenes pendientes, mostrando estado vacío');
    const emptyState = document.createElement('div');
    emptyState.className = 'image-preview-empty';
    emptyState.textContent = 'No has seleccionado imágenes.';
    previewContainer.appendChild(emptyState);
    return;
  }
  
  console.log('✅ Renderizando', pendingProjectGalleryImages.length, 'imagen(es)');

  pendingProjectGalleryImages.forEach((item, index) => {
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

    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(removeBtn.dataset.index || '', 10);
      if (!Number.isNaN(targetIndex)) {
        const removedItems = pendingProjectGalleryImages.splice(targetIndex, 1);
        removedItems.forEach(revokePendingImagePreview);
        renderPendingProjectImages();
      }
    });

    const img = document.createElement('img');
    img.src = item.previewUrl || '';
    img.alt = 'Vista previa de la imagen seleccionada';
    img.style.pointerEvents = 'none';

    const descriptionWrapper = document.createElement('div');
    descriptionWrapper.className = 'image-preview-description';

    const descriptionInput = document.createElement('textarea');
    descriptionInput.className = 'image-description-input';
    descriptionInput.dataset.index = index;
    descriptionInput.placeholder = 'Agrega una descripción...';
    descriptionInput.rows = 2;
    descriptionInput.value = item.description || '';

    descriptionInput.addEventListener('input', () => {
      const targetIndex = parseInt(descriptionInput.dataset.index || '', 10);
      if (!Number.isNaN(targetIndex) && pendingProjectGalleryImages[targetIndex]) {
        pendingProjectGalleryImages[targetIndex].description = descriptionInput.value;
      }
    });

    descriptionWrapper.appendChild(descriptionInput);

    wrapper.appendChild(removeBtn);
    wrapper.appendChild(img);
    wrapper.appendChild(descriptionWrapper);
    previewContainer.appendChild(wrapper);
  });
}


function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


function renderProjectGalleryImages(images, puedeGestionar) {
  currentProjectGalleryImages = Array.isArray(images) ? images : [];
  currentProjectGalleryCanManage = !!puedeGestionar;

  const totalPages = Math.ceil(currentProjectGalleryImages.length / PROJECT_GALLERY_PAGE_SIZE);
  if (totalPages === 0) {
    currentProjectGalleryPage = 0;
  } else if (currentProjectGalleryPage >= totalPages) {
    currentProjectGalleryPage = totalPages - 1;
  } else if (currentProjectGalleryPage < 0) {
    currentProjectGalleryPage = 0;
  }

  renderProjectGalleryPage();
}


function renderProjectGalleryPage() {
  const detailGallery = document.getElementById('detailGallery');

  if (!detailGallery) {
    return;
  }

  detailGallery.classList.toggle('gallery-can-manage', currentProjectGalleryCanManage);

  if (!currentProjectGalleryImages.length) {
    detailGallery.innerHTML = '<p class="gallery-empty-state">No hay imágenes disponibles.</p>';
    return;
  }

  const totalPages = Math.ceil(currentProjectGalleryImages.length / PROJECT_GALLERY_PAGE_SIZE);
  if (totalPages === 0) {
    currentProjectGalleryPage = 0;
  } else if (currentProjectGalleryPage >= totalPages) {
    currentProjectGalleryPage = totalPages - 1;
  } else if (currentProjectGalleryPage < 0) {
    currentProjectGalleryPage = 0;
  }

  const startIndex = currentProjectGalleryPage * PROJECT_GALLERY_PAGE_SIZE;
  const visibleImages = currentProjectGalleryImages.slice(startIndex, startIndex + PROJECT_GALLERY_PAGE_SIZE);

  const itemsHtml = visibleImages.map((img) => {
    const descriptionText = escapeHtml(img.descripcion || '');
    const descriptionHtml = descriptionText
      ? `<div class="gallery-item-description">${descriptionText}</div>`
      : '';
    const encodedName = encodeURIComponent(img.nombre || img.archivo_nombre || '');
    const imageUrlAttr = escapeHtml(img.url || '');
    const removeButton = currentProjectGalleryCanManage
      ? `<button class="btn-remove-item" data-imagen-id="${img.id}" data-image-name="${encodedName}" title="Eliminar imagen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
         </button>`
      : '';

    const imageDescriptionAttr = escapeHtml(img.descripcion || '');
    const imageAltAttr = escapeHtml(img.nombre || img.archivo_nombre || 'Imagen');

    return `
      <div class="gallery-item" data-image-url="${imageUrlAttr}" data-image-description="${imageDescriptionAttr}">
        ${removeButton}
        <img src="${imageUrlAttr}" alt="${imageAltAttr}" data-image-url="${imageUrlAttr}" data-image-description="${imageDescriptionAttr}" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
        ${descriptionHtml}
      </div>
    `;
  }).join('');

  const navHtml = totalPages > 1
    ? `<div class="project-gallery-nav">
        <button class="project-gallery-nav-btn" data-gallery-direction="prev" ${currentProjectGalleryPage === 0 ? 'disabled' : ''} aria-label="Ver imágenes anteriores">▲</button>
        <button class="project-gallery-nav-btn" data-gallery-direction="next" ${currentProjectGalleryPage >= totalPages - 1 ? 'disabled' : ''} aria-label="Ver imágenes siguientes">▼</button>
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

  detailGallery.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', function (e) {
      if (e.target.closest('.btn-remove-item')) {
        return;
      }
      const imageUrl = this.getAttribute('data-image-url') || this.querySelector('img')?.getAttribute('data-image-url') || this.querySelector('img')?.getAttribute('src');
      const imageDescription = this.getAttribute('data-image-description') || this.querySelector('img')?.getAttribute('data-image-description') || '';
      if (imageUrl) {
        showImageViewModal(imageUrl, imageDescription);
      }
    });
  });

  if (currentProjectGalleryCanManage) {
    detailGallery.querySelectorAll('[data-imagen-id]').forEach((btn) => {
      btn.addEventListener('click', async function (e) {
        e.stopPropagation();
        const imagenId = this.getAttribute('data-imagen-id');
        const imageName = decodeURIComponent(this.getAttribute('data-image-name') || '');
        confirmarEliminacionImagenGaleria(imagenId, imageName);
      });
    });
  }
}

function confirmarEliminacionImagenGaleria(imagenId, imageName = '') {
  console.log('🗑️ confirmarEliminacionImagenGaleria() llamada');
  console.log('🗑️ ID de imagen a eliminar:', imagenId);
  console.log('🗑️ Verificando permisos...');
  
  if (!tienePermisoGestionActual()) {
    console.log('❌ Sin permisos para eliminar imagen');
    mostrarMensajePermisoDenegado();
    return;
  }
  
  console.log('✅ Permisos verificados, mostrando confirmación');
  
  const trimmedName = (imageName || '').trim();
  const message = trimmedName
    ? `¿Estás seguro de que deseas eliminar la imagen "${trimmedName}" de la galería?`
    : '¿Estás seguro de que deseas eliminar esta imagen de la galería?';

  showConfirmDeleteModal(message, async () => {
    console.log('✅ Usuario confirmó eliminación');
    await eliminarImagenGaleria(imagenId);
  });
}

document.addEventListener('click', (event) => {
  const navBtn = event.target.closest('.project-gallery-nav-btn');
  if (!navBtn) {
    return;
  }

  if (!currentProjectGalleryImages.length) {
    return;
  }

  event.preventDefault();

  const direction = navBtn.getAttribute('data-gallery-direction');
  const totalPages = Math.ceil(currentProjectGalleryImages.length / PROJECT_GALLERY_PAGE_SIZE);

  if (direction === 'prev' && currentProjectGalleryPage > 0) {
    currentProjectGalleryPage -= 1;
    renderProjectGalleryPage();
  } else if (direction === 'next' && currentProjectGalleryPage < totalPages - 1) {
    currentProjectGalleryPage += 1;
    renderProjectGalleryPage();
  }
});


// Función para manejar selección de imagen

function handleImageSelect(event) {
  console.log('📸 handleImageSelect() llamada', event);
  const input = event.target;
  console.log('📸 Input element:', input);
  const files = Array.from(input.files || []);
  console.log('📸 Archivos seleccionados:', files.length, files);

  if (!files.length) {
    console.warn('⚠️ No se seleccionaron archivos');
    return;
  }

  let invalidFiles = 0;
  let addedFiles = 0;
  const canUseObjectUrl =
    typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';

  files.forEach((file) => {
    if (file && file.type && file.type.startsWith('image/')) {
      if (canUseObjectUrl) {
        try {
          const objectUrl = URL.createObjectURL(file);
          pendingProjectGalleryImages.push({
            file,
            previewUrl: objectUrl,
            objectUrl,
            description: '',
          });
          addedFiles += 1;
        } catch (error) {
          console.warn('No se pudo generar la previsualización con createObjectURL:', error);
          const reader = new FileReader();
          reader.onload = (e) => {
            pendingProjectGalleryImages.push({
              file,
              previewUrl: e.target && e.target.result ? e.target.result : '',
              description: '',
            });
            renderPendingProjectImages();
          };
          reader.onerror = (readError) => {
            console.error('Error al leer la imagen seleccionada:', readError);
            showErrorMessage('No se pudo previsualizar una de las imágenes seleccionadas.');
          };
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          pendingProjectGalleryImages.push({
            file,
            previewUrl: e.target && e.target.result ? e.target.result : '',
            description: '',
          });
          renderPendingProjectImages();
        };
        reader.onerror = (readError) => {
          console.error('Error al leer la imagen seleccionada:', readError);
          showErrorMessage('No se pudo previsualizar una de las imágenes seleccionadas.');
        };
        reader.readAsDataURL(file);
      }
    } else {
      invalidFiles += 1;
    }
  });

  if (addedFiles > 0) {
    console.log(`✅ ${addedFiles} imagen(es) agregada(s) a pendientes`);
    renderPendingProjectImages();
  }

  if (invalidFiles > 0) {
    console.warn(`⚠️ ${invalidFiles} archivo(s) inválido(s)`);
    showErrorMessage('Algunos archivos fueron descartados porque no son imágenes válidas.');
  }

  console.log('📸 Total de imágenes pendientes:', pendingProjectGalleryImages.length);
  input.value = '';
}



// Función para agregar imagen al proyecto

async function addImageToProject() {
  console.log('💾 addImageToProject() llamada');
  console.log('💾 Imágenes pendientes a guardar:', pendingProjectGalleryImages.length);

  if (!tienePermisoGestionActual()) {
    console.log('❌ Sin permisos para gestionar');
    mostrarMensajePermisoDenegado();

    return;

  }
  
  console.log('✅ Permisos verificados');

  if (!pendingProjectGalleryImages.length) {
    console.warn('⚠️ No hay imágenes pendientes');
    showErrorMessage('Selecciona al menos una imagen antes de continuar.');

    return;

  }
  
  console.log('✅ Hay imágenes para subir, continuando...');

  

  // Obtener el proyecto actual

  let currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    const detailTitle = document.getElementById('detailTitle');

    if (detailTitle && detailTitle.dataset.projectId) {

      const projectId = detailTitle.dataset.projectId;

      try {

        const response = await fetch(`/api/proyecto/${projectId}/`);

        const data = await response.json();

        if (data.success) {

          currentProject = data.proyecto;

          currentProjectData = currentProject;

          currentProjectId = currentProject.id;

        }

      } catch (error) {

        console.error('Error al obtener proyecto:', error);

      }

    }

    if (!currentProject || !currentProject.id) {

      alert('Error: No se pudo obtener la información del evento. Por favor, recarga la página.');

      return;

    }

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

  const imagesToUpload = [...pendingProjectGalleryImages];

  let uploadedCount = 0;

  try {

    for (const item of imagesToUpload) {

      const formData = new FormData();

      formData.append('imagen', item.file);

      formData.append('descripcion', (item.description || '').trim());

      const response = await fetch(`/api/evento/${currentProject.id}/galeria/agregar/`, {

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

    }

    clearImageForm();

    hideModal('addImageModal');

    shouldRefreshLatestProjects = true;
    await loadProjectDetails(currentProject.id);

    showSuccessMessage(uploadedCount === 1 ? 'Imagen agregada exitosamente' : 'Imágenes agregadas exitosamente');

  } catch (error) {

    console.error('❌ Error al agregar imagen:', error);

    if (uploadedCount > 0) {
      const uploadedItems = imagesToUpload.slice(0, uploadedCount);
      uploadedItems.forEach(revokePendingImagePreview);
    }

    pendingProjectGalleryImages = imagesToUpload.slice(uploadedCount);

    renderPendingProjectImages();

    if (uploadedCount > 0) {

      showErrorMessage((error.message || 'Ocurrió un problema al agregar las imágenes.') + ' Se subieron ' + uploadedCount + ' imagen(es) antes del error.');

    } else {

      showErrorMessage(error.message || 'No se pudieron agregar las imágenes.');

    }

  } finally {

    if (confirmButton) {

      confirmButton.disabled = false;

      confirmButton.textContent = originalLabel || 'Agregar';

    }

  }

}



// Función para eliminar imagen de la galería

async function eliminarImagenGaleria(imagenId) {
  console.log('🗑️ eliminarImagenGaleria() llamada');
  console.log('🗑️ ID de imagen:', imagenId);
  
  let currentProject = getCurrentProject();
  console.log('🗑️ Proyecto actual:', currentProject);

  if (!currentProject || !currentProject.id) {
    const detailTitle = document.getElementById('detailTitle');

    if (detailTitle && detailTitle.dataset.projectId) {
      const projectId = detailTitle.dataset.projectId;
      console.log('📌 Obteniendo ID del proyecto desde dataset:', projectId);

      try {
        const response = await fetch(`/api/proyecto/${projectId}/`);
        const data = await response.json();

        if (data.success) {
          currentProject = data.proyecto;
          currentProjectData = currentProject;
          currentProjectId = currentProject.id;
        }
      } catch (error) {
        console.error('Error al obtener proyecto:', error);
      }
    }

    if (!currentProject || !currentProject.id) {
      console.error('❌ No se pudo obtener el proyecto actual:', currentProject);
      showErrorMessage('No se pudo obtener la información del evento. Por favor, recarga la página.');
      return;
    }
  }

  console.log('🗑️ Eliminando imagen del proyecto:', currentProject.id);

  try {
    const response = await fetch(`/api/evento/${currentProject.id}/galeria/${imagenId}/eliminar/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    });

    const result = await response.json();

    if (result.success) {
      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);
      showSuccessMessage('Imagen eliminada exitosamente de la galería.');
    } else {
      showErrorMessage(result.error || 'Error al eliminar la imagen de la galería.');
    }
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    showErrorMessage('Error al eliminar la imagen. Por favor, intenta de nuevo.');
  }
}
// Función para mostrar modal de editar descripción

function showEditDescriptionModal() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    alert('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  // Cargar la descripción actual del proyecto

  const descripcionActual = currentProject.descripcion || '';

  const descripcionTexto = descripcionActual
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();

  

  const editDescriptionText = document.getElementById('editDescriptionText');

  if (editDescriptionText) {

    editDescriptionText.value = descripcionTexto;

  }

  

  showModal('editDescriptionModal');

}



// Función para actualizar descripción del proyecto

async function updateProjectDescription() {
  console.log('💾 updateProjectDescription() llamada');

  if (!tienePermisoGestionActual()) {
    console.log('❌ Sin permisos para gestionar');
    mostrarMensajePermisoDenegado();

    return;

  }
  
  console.log('✅ Permisos verificados, continuando...');

  const newDescription = document.getElementById('editDescriptionText').value.trim();
  console.log('📝 Descripción a guardar:', newDescription);

  

  if (!newDescription) {

    showErrorMessage('Por favor ingresa una descripción');

    return;

  }

  // Normalizar saltos de línea a <br> para almacenarlos
  const newDescriptionHtml = newDescription.replace(/\r?\n/g, '<br>');
  

  // Obtener el proyecto actual

  let proyecto = getCurrentProject();

  if (!proyecto || !proyecto.id) {

    showErrorMessage('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  try {

    // Preparar datos para enviar a la API

    const formData = new FormData();

    formData.append('descripcion', newDescriptionHtml);

    

    // Enviar a la API

    const response = await fetch(`/api/evento/${proyecto.id}/actualizar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      },

      body: formData

    });

    

    const result = await response.json();

    

    if (result.success) {

      // Recargar los detalles del proyecto para mostrar la descripción actualizada

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(proyecto.id);

      hideModal('editDescriptionModal');

      alert('Descripción actualizada exitosamente.');

    } else {

      alert(result.error || 'Error al actualizar la descripción.');

    }

    

  } catch (error) {

    console.error('Error al guardar descripción:', error);

    alert('Error al guardar la descripción. Por favor, intenta de nuevo.');

  }

}



// Variables globales para el modal de edición de datos

let selectedCards = [];

let currentEditProject = null;



// Función para mostrar modal de editar datos

function showEditDataModal() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  console.log('showEditDataModal() llamada');

  currentEditProject = getCurrentProject();

  console.log('Proyecto actual:', currentEditProject);

  

  // Obtener el proyecto actual con fallback

  let proyecto = getCurrentProject();

  if (!proyecto || !proyecto.id) {

    alert('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  // Cargar datos actuales de las tarjetas desde tarjetas_datos (viene de la API)

  const tarjetasDatos = proyecto.tarjetas_datos || [];

  console.log('Tarjetas de datos desde API:', tarjetasDatos);

  

  // Convertir las tarjetas existentes al formato de tarjetas seleccionadas

  selectedCards = tarjetasDatos.map(tarjeta => {

    const tituloNormalizado = (tarjeta.titulo || '').toLowerCase().trim();

    const isLocked = tituloNormalizado === 'beneficiarios';

    return {

      id: tarjeta.id,

      icon: tarjeta.icono || '📊',

      label: tarjeta.titulo,

      value: tarjeta.valor || '',

      isCustom: true, // Las tarjetas de la BD se consideran personalizadas

      isLocked

    };

  });

  

  console.log('Tarjetas seleccionadas:', selectedCards);

  

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

    

    // Verificar si ya está seleccionada usando el ID de la tarjeta predefinida

    const isSelected = selectedCards.some(selected => 

      selected.predefinedCardId === card.id || 

      (selected.label === card.label && !selected.isCustom && (!selected.id || selected.id?.startsWith('card_')))

    );

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

  

  if (selectedCards.length === 0) {

    container.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No hay tarjetas seleccionadas. Selecciona tarjetas predefinidas o crea una personalizada.</p>';

    return;

  }

  

  const puedeEditarTarjetas = !!puedeGestionarProyectoActual;

  selectedCards.forEach((card, index) => {
    const cardElement = document.createElement('div');

    cardElement.className = 'selected-card';

    cardElement.dataset.index = index;

    const icon = escapeHtml(card.icon || '📊');

    const label = escapeHtml(card.label || '');

    const value = escapeHtml(card.value || '');

    const isLocked = !!card.isLocked;

    const esSoloLectura = isLocked || !puedeEditarTarjetas;

    if (esSoloLectura) {
      cardElement.classList.add('selected-card-locked');

      const indicatorLabel = isLocked ? 'Fijo' : 'Solo lectura';

      const indicatorTitle = isLocked
        ? 'Este dato no se puede editar ni eliminar'
        : 'No tienes permisos para editar este dato';

      cardElement.innerHTML = `
        <div class="selected-card-icon">
          <span class="card-icon-locked" title="${indicatorTitle}">${icon}</span>
        </div>
        <div class="selected-card-info">
          <div class="selected-card-label selected-card-label-locked">${label}</div>
          <div class="selected-card-value selected-card-value-locked">${value}</div>
        </div>
        <div class="selected-card-lock-indicator" title="${indicatorTitle}" style="color: #6c757d; font-size: 0.75rem; margin-top: 8px;">${indicatorLabel}</div>
      `;
    } else {
      cardElement.innerHTML = `
        <div class="selected-card-icon">
          <input type="text" value="${icon}" placeholder="📊" class="card-icon-input" data-index="${index}" maxlength="2" style="width: 40px; text-align: center; font-size: 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 4px;">
        </div>
        <div class="selected-card-info">
          <div class="selected-card-label">
            <input type="text" value="${label}" placeholder="Título de la tarjeta..." class="card-label-input" data-index="${index}">
          </div>
          <div class="selected-card-value">
            <input type="text" value="${value}" placeholder="Ingresa el valor..." class="card-value-input" data-index="${index}">
          </div>
        </div>
        <button class="remove-card-btn" data-index="${index}" title="Eliminar tarjeta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
    }

    container.appendChild(cardElement);
  });

  

  // Agregar event listeners para inputs de icono, título y valor

  container.querySelectorAll('.card-icon-input').forEach(input => {

    input.addEventListener('input', (e) => {

      const index = parseInt(e.target.dataset.index);

      if (selectedCards[index]) {

        selectedCards[index].icon = e.target.value || '📊';

      }

    });

  });

  

  container.querySelectorAll('.card-label-input').forEach(input => {

    input.addEventListener('input', (e) => {

      const index = parseInt(e.target.dataset.index);

      if (selectedCards[index]) {

        selectedCards[index].label = e.target.value;

      }

    });

  });

  

  container.querySelectorAll('.card-value-input').forEach(input => {

    input.addEventListener('input', (e) => {

      const index = parseInt(e.target.dataset.index);

      if (selectedCards[index]) {

        selectedCards[index].value = e.target.value;

      }

    });

  });

}



// Función para alternar selección de tarjeta predefinida

function togglePredefinedCard(card) {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);

  

  // Verificar si ya está seleccionada usando el ID de la tarjeta predefinida

  const existingIndex = selectedCards.findIndex(selected => 

    selected.predefinedCardId === card.id

  );

  

  if (existingIndex !== -1) {

    // Remover de seleccionadas si ya existe

    selectedCards.splice(existingIndex, 1);

    cardElement.classList.remove('selected');

  } else {

    // Verificar si ya existe una tarjeta con el mismo label (evitar duplicados)

    const duplicateLabel = selectedCards.some(selected => (selected.label || '').toLowerCase() === card.label.toLowerCase());

    if (duplicateLabel) {

      showErrorMessage(`Ya existe una tarjeta con el título "${card.label}"`);

      return;

    }

    

    // Agregar a seleccionadas (con ID temporal para nuevas y el ID de predefinida)

    selectedCards.push({

      id: generateCardId(), // ID temporal para nuevas tarjetas

      predefinedCardId: card.id, // ID de la tarjeta predefinida para evitar duplicados

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

  

  // Los event listeners para inputs de título y valor se agregan en loadSelectedCards()

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

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  const icon = document.getElementById('customIcon').value.trim();

  const label = document.getElementById('customLabel').value.trim();

  const value = document.getElementById('customValue').value.trim();

  

  if (!icon || !label || !value) {

    showErrorMessage('Por favor completa todos los campos');

    return;

  }

  

  // Verificar si ya existe una tarjeta con el mismo título

  const normalizedLabel = label.toLowerCase();

  if (selectedCards.some(card => (card.label || '').toLowerCase() === normalizedLabel)) {

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

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  if (selectedCards[index] && selectedCards[index].isLocked) {

    showErrorMessage('Este dato es fijo y no se puede eliminar.');

    return;

  }

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



// Función para actualizar valor de tarjeta seleccionada (ya no se usa, se maneja con event listeners)

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

async function showAddPersonnelModal() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  

  showModal('addPersonnelModal');

  await loadPersonnelListFromAPI();

  

  // Configurar búsqueda de personal

  const searchInput = document.getElementById('personnelSearch');

  if (searchInput) {

    searchInput.value = '';

    // Remover listeners anteriores para evitar duplicados

    const newSearchInput = searchInput.cloneNode(true);

    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    newSearchInput.addEventListener('input', filterPersonnelList);

  }

}
// Función para cargar colaboradores desde la API

async function loadPersonnelListFromAPI() {

  const personnelList = document.getElementById('personnelList');

  if (!personnelList) return;

  

  personnelList.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">Cargando colaboradores...</div>';

  

  try {

    const response = await fetch('/api/personal/');

    if (!response.ok) {

      throw new Error('Error al cargar colaboradores');

    }

    

    const colaboradores = await response.json();

    

    if (colaboradores.length === 0) {

      personnelList.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No hay colaboradores disponibles.</div>';

      return;

    }

    

    // Obtener el proyecto actual para ver qué personal ya está asignado

    const currentProject = getCurrentProject();

    const personalAsignadoIds = currentProject && currentProject.personal 

      ? currentProject.personal.map(p => p.id || p.colaborador_id || p.usuario_id).filter(Boolean)

      : [];

    

    personnelList.innerHTML = colaboradores.map(colaborador => {

      const isSelected = personalAsignadoIds.includes(colaborador.id);

      return `

        <div class="personnel-item" data-personnel-id="${colaborador.id}" data-personnel-type="${colaborador.tipo || 'colaborador'}" style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; cursor: pointer; border: 2px solid ${isSelected ? '#007bff' : 'transparent'}; ${isSelected ? 'background: rgba(0, 123, 255, 0.1);' : ''}">

          <input type="checkbox" class="personnel-checkbox" data-personnel-id="${colaborador.id}" ${isSelected ? 'checked disabled' : ''} style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;">

          <div style="flex: 1;">

            <h4 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1rem;">${colaborador.nombre || 'Sin nombre'}</h4>

            <p style="margin: 2px 0; color: #007bff; font-size: 0.9rem;">${colaborador.puesto || 'Sin puesto'}</p>

            <p style="margin: 2px 0; color: #b8c5d1; font-size: 0.85rem;">${colaborador.rol_display || 'Colaborador'}</p>

            ${isSelected ? '<p style="margin: 4px 0 0 0; color: #ffc107; font-size: 0.8rem;">✓ Ya asignado</p>' : ''}

          </div>

        </div>

      `;

    }).join('');

    

    // Agregar event listeners a los checkboxes

    personnelList.querySelectorAll('.personnel-checkbox').forEach(checkbox => {

      checkbox.addEventListener('change', function() {

        const item = this.closest('.personnel-item');

        if (this.checked) {

          item.style.borderColor = '#007bff';

          item.style.background = 'rgba(0, 123, 255, 0.1)';

        } else {

          item.style.borderColor = 'transparent';

          item.style.background = 'rgba(255, 255, 255, 0.05)';

        }

      });

    });

    

  } catch (error) {

    console.error('Error al cargar colaboradores:', error);

    personnelList.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error al cargar colaboradores. Por favor, intenta de nuevo.</div>';

  }

}



// Función para limpiar formulario de personal

function clearPersonnelForm() {

  document.getElementById('personnelName').value = '';

  document.getElementById('personnelRole').value = '';

}



// Función para agregar personal al proyecto

async function addPersonnelToProject() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  

  const selectedPersonnel = getSelectedPersonnel();

  

  if (selectedPersonnel.length === 0) {

    alert('Por favor selecciona al menos un colaborador');

    return;

  }

  

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    alert('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  try {

    // Obtener el personal actual del evento

    const currentPersonnel = currentProject.personal || [];

    const currentPersonnelIds = currentPersonnel.map(p => p.id || p.colaborador_id || p.usuario_id).filter(Boolean);

    

    // Preparar el nuevo personal a agregar (solo los que no están ya asignados)

    const newPersonnel = selectedPersonnel.filter(p => !currentPersonnelIds.includes(p.id));

    

    if (newPersonnel.length === 0) {

      alert('Los colaboradores seleccionados ya están asignados al evento.');

      return;

    }

    

    // Preparar el formato para la API

    const personalIds = [

      ...currentPersonnel.map(p => ({

        id: p.id || p.colaborador_id || p.usuario_id,

        tipo: p.tipo || 'colaborador',

        rol: p.rol || 'Colaborador'

      })),

      ...newPersonnel.map(p => ({

        id: p.id,

        tipo: p.tipo,

        rol: 'Colaborador'

      }))

    ];

    

    // Crear FormData para enviar a la API

    const formData = new FormData();

    formData.append('personal_ids', JSON.stringify(personalIds));

    

    // Llamar a la API de actualizar evento

    const response = await fetch(`/api/evento/${currentProject.id}/actualizar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      },

      body: formData

    });

    

    const result = await response.json();

    

    if (result.success) {

      // Recargar los detalles del evento

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

      alert(`${newPersonnel.length} colaborador(es) agregado(s) exitosamente`);

      hideModal('addPersonnelModal');

    } else {

      alert(result.error || 'Error al agregar personal al evento.');

    }

    

  } catch (error) {

    console.error('Error al agregar personal:', error);

    alert('Error al agregar personal. Por favor, intenta de nuevo.');

  }

}



// Función para obtener el token CSRF

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



// Función para mostrar modal de agregar cambio

function showAddChangeModal() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  editingCambioId = null;
  editingCambioGroupId = null;
  editingCambioIds = [];

  document.getElementById('changeModalTitle').textContent = 'Agregar Cambio';

  document.getElementById('confirmChangeBtn').textContent = 'Agregar';

  showModal('addChangeModal');

  clearChangeForm();

  // Esperar un momento para que el modal esté completamente visible antes de cargar la lista
  setTimeout(() => {
    loadChangePersonnelList();
    loadChangeCommunitiesList();
  }, 100);

}



// Variable para almacenar el ID del cambio que se está editando

let editingCambioId = null;
let editingCambioGroupId = null;
let editingCambioIds = [];


function resetChangeCurrentTimeControls() {
  const checkbox = document.getElementById('changeUseCurrentTime');
  const dateInput = document.getElementById('changeDate');
  const timeInput = document.getElementById('changeTime');
  const helper = document.getElementById('changeUseCurrentTimeHelper');

  if (checkbox) {
    checkbox.checked = false;
  }

  if (dateInput) {
    dateInput.disabled = false;
    delete dateInput.dataset.prevValue;
  }

  if (timeInput) {
    timeInput.disabled = false;
    delete timeInput.dataset.prevValue;
  }

  if (helper) {
    helper.style.display = 'none';
  }
}


function toggleChangeUseCurrentTime(isChecked) {
  const dateInput = document.getElementById('changeDate');
  const timeInput = document.getElementById('changeTime');
  const helper = document.getElementById('changeUseCurrentTimeHelper');

  if (!dateInput || !timeInput) {
    return;
  }

  if (isChecked) {
    dateInput.dataset.prevValue = dateInput.value || '';
    timeInput.dataset.prevValue = timeInput.value || '';

    const guatemalaNow = getGuatemalaDateParts();

    dateInput.value = `${guatemalaNow.year}-${guatemalaNow.month}-${guatemalaNow.day}`;
    timeInput.value = `${guatemalaNow.hour}:${guatemalaNow.minute}`;

    dateInput.disabled = true;
    timeInput.disabled = true;

    if (helper) {
      helper.textContent = `Se registrará la fecha y hora actuales al guardar (${guatemalaNow.formatted}).`;
      helper.style.display = 'block';
    }
  } else {
    dateInput.disabled = false;
    timeInput.disabled = false;

    if (dateInput.dataset.prevValue !== undefined) {
      dateInput.value = dateInput.dataset.prevValue;
    }

    if (timeInput.dataset.prevValue !== undefined) {
      timeInput.value = timeInput.dataset.prevValue;
    }

    delete dateInput.dataset.prevValue;
    delete timeInput.dataset.prevValue;

    if (helper) {
      helper.style.display = 'none';
    }
  }
}


// Función para limpiar formulario de cambio

function clearChangeForm() {

  resetChangeCurrentTimeControls();

  document.getElementById('changeDescription').value = '';

  // Limpiar campos de fecha y hora

  document.getElementById('changeDate').value = '';

  document.getElementById('changeTime').value = '';

  const checkboxes = document.querySelectorAll('#changePersonnelList input.change-personnel-checkbox');

  checkboxes.forEach(cb => cb.checked = false);

  const evidencesInput = document.getElementById('changeEvidencesInput');

  if (evidencesInput) evidencesInput.value = '';

  selectedEvidencesFiles = [];

  const preview = document.getElementById('changeEvidencesPreview');

  if (preview) preview.innerHTML = '';

  // Limpiar selección de comunidades
  const communityCheckboxes = document.querySelectorAll('#changeCommunitiesList input.change-community-checkbox');
  communityCheckboxes.forEach(cb => cb.checked = false);
  
  const communityItems = document.querySelectorAll('#changeCommunitiesList .community-item');
  communityItems.forEach(item => {
    item.style.borderColor = 'transparent';
    item.style.background = 'rgba(255, 255, 255, 0.05)';
  });

  // Limpiar búsqueda de comunidades
  const communitiesSearch = document.getElementById('changeCommunitiesSearch');
  if (communitiesSearch) communitiesSearch.value = '';

  editingCambioId = null;
  editingCambioGroupId = null;
  editingCambioIds = [];

  document.getElementById('changeModalTitle').textContent = 'Agregar Cambio';

  document.getElementById('confirmChangeBtn').textContent = 'Agregar';

}



// Función para confirmar eliminación de cambio

function confirmarEliminarCambio(cambioId, cambio) {

  const mensaje = cambio 

    ? `¿Estás seguro de que deseas eliminar el cambio "${cambio.descripcion?.substring(0, 50)}..."?`

    : '¿Estás seguro de que deseas eliminar este cambio?';

  

  document.getElementById('confirmMessage').textContent = mensaje;

  document.getElementById('confirmDeleteBtn').onclick = () => eliminarCambio(cambioId);

  showModal('confirmDeleteModal');

}



// Función para eliminar cambio

async function eliminarCambio(cambioId) {

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    showErrorMessage('No se pudo obtener la información del proyecto');

    return;

  }

  

  try {

    const response = await fetch(`/api/evento/${currentProject.id}/cambio/${cambioId}/eliminar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      }

    });

    

    const result = await response.json();

    

    if (result.success) {

      showSuccessMessage('Cambio eliminado exitosamente');

      hideModal('confirmDeleteModal');

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

    } else {

      showErrorMessage(result.error || 'Error al eliminar el cambio');

    }

  } catch (error) {

    console.error('Error al eliminar cambio:', error);

    showErrorMessage('Error al eliminar el cambio. Por favor, intenta de nuevo.');

  }

}
// Función para editar cambio

function editarCambio(cambioId, cambio) {

  if (!cambio) {

    console.error('No se encontró el cambio con ID:', cambioId);

    return;

  }

  
  editingCambioGroupId = cambio.grupo_id || null;
  editingCambioIds = Array.isArray(cambio.ids) && cambio.ids.length ? cambio.ids : [cambioId];
  editingCambioId = editingCambioIds[0] || cambioId;

  resetChangeCurrentTimeControls();

  document.getElementById('changeModalTitle').textContent = 'Editar Cambio';

  document.getElementById('confirmChangeBtn').textContent = 'Guardar';

  document.getElementById('changeDescription').value = cambio.descripcion || '';

  

  // Cargar fecha y hora del cambio si existe

  if (cambio.fecha_cambio) {

    const fechaCambio = new Date(cambio.fecha_cambio);

    // Obtener fecha y hora en zona horaria local del navegador

    const year = fechaCambio.getFullYear();

    const month = String(fechaCambio.getMonth() + 1).padStart(2, '0');

    const day = String(fechaCambio.getDate()).padStart(2, '0');

    const hours = String(fechaCambio.getHours()).padStart(2, '0');

    const minutes = String(fechaCambio.getMinutes()).padStart(2, '0');

    

    // Formatear fecha para input type="date" (YYYY-MM-DD)

    const fechaStr = `${year}-${month}-${day}`;

    // Formatear hora para input type="time" (HH:MM)

    const horaStr = `${hours}:${minutes}`;

    

    document.getElementById('changeDate').value = fechaStr;

    document.getElementById('changeTime').value = horaStr;

  } else {

    // Si no hay fecha, limpiar los campos

    document.getElementById('changeDate').value = '';

    document.getElementById('changeTime').value = '';

  }

  

  // Cargar colaborador seleccionado si existe

  const colaboradoresSeleccionados = Array.isArray(cambio.colaboradores_ids) && cambio.colaboradores_ids.length
    ? cambio.colaboradores_ids
    : (cambio.colaborador_id ? [cambio.colaborador_id] : []);

  loadChangePersonnelList().then(() => {
    colaboradoresSeleccionados.forEach((colaboradorId) => {
      const checkbox = document.querySelector(`#changePersonnelList input[value="${colaboradorId}"]`);
      if (checkbox) {
        checkbox.checked = true;
        const item = checkbox.closest('.selection-item');
        if (item) {
          item.classList.add('selected');
        }
      }
    });
  });

  // Cargar comunidades seleccionadas si existen
  // Las comunidades vienen como string separado por comas desde el backend
  if (cambio.comunidades) {
    const comunidadesNombres = cambio.comunidades.split(',').map(c => c.trim()).filter(c => c);
    loadChangeCommunitiesList().then(() => {
      // Buscar y seleccionar las comunidades por nombre
      comunidadesNombres.forEach(comunidadNombre => {
        const communityItems = document.querySelectorAll('#changeCommunitiesList .community-item');
        communityItems.forEach(item => {
          const nameElement = item.querySelector('h4');
          if (nameElement && nameElement.textContent.trim() === comunidadNombre) {
            const checkbox = item.querySelector('.change-community-checkbox');
            if (checkbox) {
              checkbox.checked = true;
              item.style.borderColor = '#007bff';
              item.style.background = 'rgba(0, 123, 255, 0.1)';
            }
          }
        });
      });
    });
  } else {
    // Si no hay comunidades, solo cargar la lista
    loadChangeCommunitiesList();
  }

  

  // Limpiar evidencias nuevas seleccionadas (para agregar nuevas en la edición)

  selectedEvidencesFiles = [];

  

  // Cargar evidencias existentes del cambio en el preview

  const preview = document.getElementById('changeEvidencesPreview');

  if (preview) {

    renderExistingEvidences(cambio.evidencias || []);

  }

  

  showModal('addChangeModal');

}



// Función para actualizar descripciones de evidencias existentes que hayan cambiado

async function updateExistingEvidenceDescriptions() {

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id || !editingCambioId) {

    return;

  }

  

  const preview = document.getElementById('changeEvidencesPreview');

  if (!preview) return;

  

  // Obtener todos los textareas de evidencias existentes

  const existingTextareas = preview.querySelectorAll('.evidence-description-input-existing');

  

  // Actualizar cada evidencia que haya cambiado

  const updatePromises = Array.from(existingTextareas).map(async (textarea) => {

    const evidenciaId = textarea.getAttribute('data-evidence-id');

    const descripcionOriginal = textarea.getAttribute('data-original-desc') || '';

    const descripcionActual = textarea.value.trim();

    

    // Solo actualizar si la descripción cambió

    if (descripcionActual !== descripcionOriginal) {

      try {

        const formData = new FormData();

        formData.append('descripcion', descripcionActual);

        

        const response = await fetch(`/api/evento/${currentProject.id}/cambio/${editingCambioId}/evidencia/${evidenciaId}/actualizar/`, {

          method: 'POST',

          body: formData,

          headers: {

            'X-CSRFToken': getCookie('csrftoken')

          }

        });

        

        const result = await response.json();

        if (!result.success) {

          console.error(`Error al actualizar descripción de evidencia ${evidenciaId}:`, result.error);

        }

      } catch (error) {

        console.error(`Error al actualizar descripción de evidencia ${evidenciaId}:`, error);

      }

    }

  });

  

  // Esperar a que todas las actualizaciones se completen

  await Promise.all(updatePromises);

}
// Función para agregar cambio al proyecto usando API

async function addChangeToProject() {
  console.log('💾 addChangeToProject() llamada');

  if (!tienePermisoGestionActual()) {
    console.log('❌ Sin permisos para gestionar');
    mostrarMensajePermisoDenegado();

    return;

  }
  
  console.log('✅ Permisos verificados');

  const description = document.getElementById('changeDescription').value.trim();
  console.log('📝 Descripción:', description);

  const selectedPersonnel = getSelectedChangePersonnel();
  console.log('👥 Personal seleccionado:', selectedPersonnel);

  

  if (!description) {

    showErrorMessage('Por favor ingresa una descripción del cambio');

    return;

  }

  

  // Validar que se haya seleccionado al menos un colaborador
  if (selectedPersonnel.length === 0) {
    showErrorMessage('Por favor selecciona al menos un colaborador responsable');
    return;
  }

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    showErrorMessage('No se pudo obtener la información del proyecto');

    return;

  }

  

  try {

    const formData = new FormData();

    formData.append('descripcion', description);

    if (editingCambioId && editingCambioGroupId) {
      formData.append('grupo_id', editingCambioGroupId);
    }
    if (editingCambioId && editingCambioIds && editingCambioIds.length) {
      formData.append('cambio_ids', JSON.stringify(editingCambioIds));
    }

    

    // Agregar fecha y hora si se especificaron o indicar que se use la actual

    const useCurrentTimeCheckbox = document.getElementById('changeUseCurrentTime');

    const useCurrentTime = useCurrentTimeCheckbox ? useCurrentTimeCheckbox.checked : false;

    const fechaCambio = document.getElementById('changeDate').value;

    const horaCambio = document.getElementById('changeTime').value;

    if (useCurrentTime) {

      formData.append('usar_fecha_actual', 'true');

    } else if (fechaCambio && horaCambio) {

      // Combinar fecha y hora en formato ISO para enviar al servidor

      // El servidor interpretará esto como hora local y la convertirá a zona horaria de Guatemala

      const fechaHoraISO = `${fechaCambio}T${horaCambio}:00`;

      formData.append('fecha_cambio', fechaHoraISO);

    }

    

    // Enviar TODOS los colaboradores seleccionados como una lista JSON
    const colaboradoresIds = selectedPersonnel.map(p => p.id);
    console.log('📤 Colaboradores seleccionados:', selectedPersonnel);
    console.log('📤 IDs de colaboradores:', colaboradoresIds);
    console.log('📤 JSON string:', JSON.stringify(colaboradoresIds));
    
    if (colaboradoresIds.length > 0) {
      formData.append('colaboradores_ids', JSON.stringify(colaboradoresIds));
      console.log('✅ colaboradores_ids agregado al FormData');
    } else {
      console.error('❌ No hay IDs de colaboradores para enviar');
    }

    // Enviar TODAS las comunidades seleccionadas como una lista JSON
    const selectedCommunities = getSelectedChangeCommunities();
    console.log('📤 Comunidades seleccionadas (objeto completo):', selectedCommunities);
    
    // Asegurarse de que los IDs sean strings o números válidos
    const comunidadesIds = selectedCommunities
      .map(c => {
        const id = c.id;
        // Convertir a string si es número, o mantener como string
        const idStr = String(id).trim();
        console.log(`  - Comunidad: ${c.name}, ID original: ${id} (tipo: ${typeof id}), ID procesado: ${idStr}`);
        return idStr;
      })
      .filter(id => id && id !== 'undefined' && id !== 'null' && id !== '');
    
    console.log('📤 IDs de comunidades procesados:', comunidadesIds);
    console.log('📤 JSON string de comunidades:', JSON.stringify(comunidadesIds));
    
    if (comunidadesIds.length > 0) {
      formData.append('comunidades_ids', JSON.stringify(comunidadesIds));
      console.log('✅ comunidades_ids agregado al FormData:', JSON.stringify(comunidadesIds));
    } else {
      console.log('ℹ️ No se seleccionaron comunidades (opcional)');
    }

    

    // Agregar archivos de evidencias con sus descripciones individuales

    console.log('Archivos seleccionados:', selectedEvidencesFiles.length);

    if (selectedEvidencesFiles.length > 0) {

      selectedEvidencesFiles.forEach((fileItem, index) => {

        console.log(`Agregando archivo ${index}:`, fileItem.file.name);

        formData.append(`archivo_${index}`, fileItem.file);

        // Agregar descripción si existe

        if (fileItem.descripcion) {

          formData.append(`descripcion_evidencia_${index}`, fileItem.descripcion);

        }

      });

    }

    

    const url = editingCambioId 

      ? `/api/evento/${currentProject.id}/cambio/${editingCambioId}/actualizar/`

      : `/api/evento/${currentProject.id}/cambio/crear/`;

    

    console.log('Enviando cambio a:', url);

    // Log de todos los datos del FormData
    console.log('📋 FormData keys:', Array.from(formData.keys()));
    for (let key of formData.keys()) {
      const value = formData.get(key);
      if (key === 'comunidades_ids') {
        console.log(`  🔵 ${key}:`, value, '(tipo:', typeof value, ')');
        try {
          const parsed = JSON.parse(value);
          console.log(`  🔵 ${key} parseado:`, parsed);
        } catch (e) {
          console.error(`  ❌ Error al parsear ${key}:`, e);
        }
      } else if (key === 'colaboradores_ids') {
        console.log(`  🔵 ${key}:`, value, '(tipo:', typeof value, ')');
        try {
          const parsed = JSON.parse(value);
          console.log(`  🔵 ${key} parseado:`, parsed);
        } catch (e) {
          console.error(`  ❌ Error al parsear ${key}:`, e);
        }
      } else {
        console.log(`  ${key}:`, value);
      }
    }
    
    // Verificación específica de comunidades
    const comunidadesEnFormData = formData.get('comunidades_ids');
    if (comunidadesEnFormData) {
      console.log('✅ comunidades_ids está en FormData:', comunidadesEnFormData);
    } else {
      console.warn('⚠️ comunidades_ids NO está en FormData');
      console.log('🔍 Comunidades seleccionadas antes de agregar:', selectedCommunities);
      console.log('🔍 IDs procesados antes de agregar:', comunidadesIds);
    }

    

    const response = await fetch(url, {

      method: 'POST',

      body: formData,

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      }

    });

    

    const result = await response.json();

    console.log('Respuesta del servidor:', result);

    

    if (result.success) {

      showSuccessMessage(editingCambioId ? 'Cambio actualizado exitosamente' : 'Cambio agregado exitosamente');

      

      // Si estamos editando, actualizar las descripciones de evidencias existentes que hayan cambiado

      if (editingCambioId) {

        await updateExistingEvidenceDescriptions();

      }

      

      editingCambioId = null;
      editingCambioGroupId = null;
      editingCambioIds = [];

      hideModal('addChangeModal');

      clearChangeForm();

      

      // Recargar los detalles del proyecto
      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

    } else {

      showErrorMessage(result.error || 'Error al guardar el cambio');

    }

  } catch (error) {

    console.error('Error al guardar cambio:', error);

    showErrorMessage('Error al guardar el cambio. Por favor, intenta de nuevo.');

  }

}



// Las funciones clearImageForm, handleImageSelect y addImageToProject ya están definidas arriba

// Las funciones showEditDescriptionModal y updateProjectDescription ya están definidas arriba





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

async function showAddPersonnelModal() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  

  showModal('addPersonnelModal');

  await loadPersonnelListFromAPI();

  

  // Configurar búsqueda de personal

  const searchInput = document.getElementById('personnelSearch');

  if (searchInput) {

    searchInput.value = '';

    // Remover listeners anteriores para evitar duplicados

    const newSearchInput = searchInput.cloneNode(true);

    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    newSearchInput.addEventListener('input', filterPersonnelList);

  }

}



// Función para cargar colaboradores desde la API

async function loadPersonnelListFromAPI() {

  const personnelList = document.getElementById('personnelList');

  if (!personnelList) return;

  

  personnelList.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">Cargando colaboradores...</div>';

  

  try {

    const response = await fetch('/api/personal/');

    if (!response.ok) {

      throw new Error('Error al cargar colaboradores');

    }

    

    const colaboradores = await response.json();

    

    if (colaboradores.length === 0) {

      personnelList.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No hay colaboradores disponibles.</div>';

      return;

    }

    

    // Obtener el proyecto actual para ver qué personal ya está asignado

    const currentProject = getCurrentProject();

    const personalAsignadoIds = currentProject && currentProject.personal 

      ? currentProject.personal.map(p => p.id || p.colaborador_id || p.usuario_id).filter(Boolean)

      : [];

    

    personnelList.innerHTML = colaboradores.map(colaborador => {

      const isSelected = personalAsignadoIds.includes(colaborador.id);

      return `

        <div class="personnel-item" data-personnel-id="${colaborador.id}" data-personnel-type="${colaborador.tipo || 'colaborador'}" style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; cursor: pointer; border: 2px solid ${isSelected ? '#007bff' : 'transparent'}; ${isSelected ? 'background: rgba(0, 123, 255, 0.1);' : ''}">

          <input type="checkbox" class="personnel-checkbox" data-personnel-id="${colaborador.id}" ${isSelected ? 'checked disabled' : ''} style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;">

          <div style="flex: 1;">

            <h4 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1rem;">${colaborador.nombre || 'Sin nombre'}</h4>

            <p style="margin: 2px 0; color: #007bff; font-size: 0.9rem;">${colaborador.puesto || 'Sin puesto'}</p>

            <p style="margin: 2px 0; color: #b8c5d1; font-size: 0.85rem;">${colaborador.rol_display || 'Colaborador'}</p>

            ${isSelected ? '<p style="margin: 4px 0 0 0; color: #ffc107; font-size: 0.8rem;">✓ Ya asignado</p>' : ''}

          </div>

        </div>

      `;

    }).join('');

    

    // Agregar event listeners a los checkboxes

    personnelList.querySelectorAll('.personnel-checkbox').forEach(checkbox => {

      checkbox.addEventListener('change', function() {

        const item = this.closest('.personnel-item');

        if (this.checked) {

          item.style.borderColor = '#007bff';

          item.style.background = 'rgba(0, 123, 255, 0.1)';

        } else {

          item.style.borderColor = 'transparent';

          item.style.background = 'rgba(255, 255, 255, 0.05)';

        }

      });

    });

    

  } catch (error) {

    console.error('Error al cargar colaboradores:', error);

    personnelList.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error al cargar colaboradores. Por favor, intenta de nuevo.</div>';

  }

}



// Función para limpiar formulario de personal

function clearPersonnelForm() {

  document.getElementById('personnelName').value = '';

  document.getElementById('personnelRole').value = '';

}
// Función para agregar personal al proyecto

async function addPersonnelToProject() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  

  const selectedPersonnel = getSelectedPersonnel();

  

  if (selectedPersonnel.length === 0) {

    alert('Por favor selecciona al menos un colaborador');

    return;

  }

  

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    alert('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  try {

    // Obtener el personal actual del evento

    const currentPersonnel = currentProject.personal || [];

    const currentPersonnelIds = currentPersonnel.map(p => p.id || p.colaborador_id || p.usuario_id).filter(Boolean);

    

    // Preparar el nuevo personal a agregar (solo los que no están ya asignados)

    const newPersonnel = selectedPersonnel.filter(p => !currentPersonnelIds.includes(p.id));

    

    if (newPersonnel.length === 0) {

      alert('Los colaboradores seleccionados ya están asignados al evento.');

      return;

    }

    

    // Preparar el formato para la API

    const personalIds = [

      ...currentPersonnel.map(p => ({

        id: p.id || p.colaborador_id || p.usuario_id,

        tipo: p.tipo || 'colaborador',

        rol: p.rol || 'Colaborador'

      })),

      ...newPersonnel.map(p => ({

        id: p.id,

        tipo: p.tipo,

        rol: 'Colaborador'

      }))

    ];

    

    // Crear FormData para enviar a la API

    const formData = new FormData();

    formData.append('personal_ids', JSON.stringify(personalIds));

    

    // Llamar a la API de actualizar evento

    const response = await fetch(`/api/evento/${currentProject.id}/actualizar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      },

      body: formData

    });

    

    const result = await response.json();

    

    if (result.success) {

      // Recargar los detalles del evento

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

      alert(`${newPersonnel.length} colaborador(es) agregado(s) exitosamente`);

      hideModal('addPersonnelModal');

    } else {

      alert(result.error || 'Error al agregar personal al evento.');

    }

    

  } catch (error) {

    console.error('Error al agregar personal:', error);

    alert('Error al agregar personal. Por favor, intenta de nuevo.');

  }

}



// Función para obtener el token CSRF

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
// Event listeners

document.addEventListener('DOMContentLoaded', function() {

  console.log('DOM cargado, configurando event listeners...');
  
  // Delegación de eventos para botones de modales (backup en caso de que los listeners directos fallen)
  document.body.addEventListener('click', function(e) {
    const target = e.target;
    
    // Verificar si es el botón de confirmar eliminación
    if (target.id === 'confirmDeleteBtn' || target.closest('#confirmDeleteBtn')) {
      console.log('🖱️ Click capturado por delegación en confirmDeleteBtn');
      e.preventDefault();
      e.stopPropagation();
      executeDeleteAction();
      return;
    }
    
    // Verificar si es el botón de agregar imagen
    if (target.id === 'confirmImageBtn' || target.closest('#confirmImageBtn')) {
      console.log('🖱️ Click capturado por delegación en confirmImageBtn');
      e.preventDefault();
      e.stopPropagation();
      addImageToProject();
      return;
    }
    
    // Verificar si es el botón de guardar descripción
    if (target.id === 'confirmDescriptionBtn' || target.closest('#confirmDescriptionBtn')) {
      console.log('🖱️ Click capturado por delegación en confirmDescriptionBtn');
      e.preventDefault();
      e.stopPropagation();
      updateProjectDescription();
      return;
    }
    
    // Verificar si es el botón de guardar datos
    if (target.id === 'confirmDataBtn' || target.closest('#confirmDataBtn')) {
      console.log('🖱️ Click capturado por delegación en confirmDataBtn');
      e.preventDefault();
      e.stopPropagation();
      saveProjectData();
      return;
    }
    
    // Verificar si es el botón de agregar cambio
    if (target.id === 'confirmChangeBtn' || target.closest('#confirmChangeBtn')) {
      console.log('🖱️ Click capturado por delegación en confirmChangeBtn');
      e.preventDefault();
      e.stopPropagation();
      addChangeToProject();
      return;
    }
    
    // Verificar si es el botón de agregar archivo del proyecto
    if (target.id === 'confirmFileBtn' || target.closest('#confirmFileBtn')) {
      console.log('🖱️ Click capturado por delegación en confirmFileBtn');
      e.preventDefault();
      e.stopPropagation();
      addFileToProject();
      return;
    }
    
    // Verificar si es el botón de guardar descripción de archivo
    if (target.id === 'confirmFileDescriptionBtn' || target.closest('#confirmFileDescriptionBtn')) {
      console.log('🖱️ Click capturado por delegación en confirmFileDescriptionBtn');
      e.preventDefault();
      e.stopPropagation();
      updateProjectFileDescription();
      return;
    }
    
    // Verificar si es el botón de editar archivo
    if (target.classList.contains('file-edit-btn') || target.closest('.file-edit-btn')) {
      console.log('🖱️ Click capturado por delegación en file-edit-btn');
      e.preventDefault();
      e.stopPropagation();
      const btn = target.classList.contains('file-edit-btn') ? target : target.closest('.file-edit-btn');
      const archivoId = btn.getAttribute('data-edit-archivo-id');
      const descripcion = btn.getAttribute('data-archivo-descripcion');
      const decoded = descripcion ? decodeURIComponent(descripcion) : '';
      console.log('📝 Editar archivo:', { archivoId, descripcion: decoded });
      showEditProjectFileDescriptionModal(archivoId, decoded);
      return;
    }
    
    // Verificar si es el botón de eliminar archivo (btn-danger con data-archivo-id)
    if ((target.classList.contains('btn-danger') || target.closest('.btn-danger')) && 
        (target.hasAttribute('data-archivo-id') || target.closest('[data-archivo-id]'))) {
      console.log('🖱️ Click capturado por delegación en btn-danger (eliminar archivo)');
      e.preventDefault();
      e.stopPropagation();
      const btn = target.hasAttribute('data-archivo-id') ? target : target.closest('[data-archivo-id]');
      const archivoId = btn.getAttribute('data-archivo-id');
      
      // Obtener el nombre del archivo para el mensaje de confirmación
      const fileItem = btn.closest('.file-item');
      const fileNameElement = fileItem ? fileItem.querySelector('.file-info h4 a, .file-info h4 span') : null;
      const fileName = fileNameElement ? fileNameElement.textContent.trim() : 'este archivo';
      
      console.log('🗑️ Eliminar archivo:', { archivoId, fileName });
      
      // Mostrar modal de confirmación
      showConfirmDeleteModal(
        `¿Estás seguro de que deseas eliminar el archivo "${fileName}"? Esta acción no se puede deshacer.`,
        async () => {
          console.log('✅ Usuario confirmó eliminación del archivo');
          await eliminarArchivoProyecto(archivoId);
        }
      );
      return;
    }
  });
  
  // Delegación de eventos para inputs de archivo (backup)
  document.body.addEventListener('change', function(e) {
    const target = e.target;
    
    // Verificar si es el input de imágenes
    if (target.id === 'imageFileInput') {
      console.log('📸 Change capturado por delegación en imageFileInput');
      handleImageSelect(e);
      return;
    }
    
    // Verificar si es el input de evidencias de cambios
    if (target.id === 'changeEvidencesInput') {
      console.log('📎 Change capturado por delegación en changeEvidencesInput');
      handleChangeEvidencesSelect(e);
      return;
    }
    
    // Verificar si es el input de archivos del proyecto
    if (target.id === 'fileInput') {
      console.log('📄 Change capturado por delegación en fileInput');
      handleFileSelect(e);
      return;
    }
  });

  // Verificar si hay una búsqueda pendiente desde el buscador principal
  if (typeof sessionStorage !== 'undefined') {
    const searchQuery = sessionStorage.getItem('projectSearchQuery');
    const showList = sessionStorage.getItem('showProjectsList');
    
    if (showList === 'true') {
      // Limpiar el flag
      sessionStorage.removeItem('showProjectsList');
      
      // Función para aplicar la búsqueda pendiente
      const applyPendingSearch = () => {
        // Verificar que los proyectos estén cargados
        const allProjectsLoaded = projectsData.capacitaciones.length > 0 || 
                                  projectsData.entregas.length > 0 || 
                                  projectsData['proyectos-ayuda'].length > 0;
        
        if (!allProjectsLoaded) {
          // Esperar un poco más si los proyectos aún no están cargados
          setTimeout(applyPendingSearch, 300);
          return;
        }
        
        // Mostrar la vista de listado
        showListView();
        
        // Aplicar la búsqueda si existe
        if (searchQuery) {
          sessionStorage.removeItem('projectSearchQuery');
          
          // Esperar a que se renderice la lista
          setTimeout(() => {
            const searchInput = document.getElementById('projectSearchInput');
            if (searchInput) {
              searchInput.value = searchQuery;
              filterProjectsBySearch(searchQuery);
              
              // Mostrar el botón de limpiar si hay texto
              const searchClearBtn = document.getElementById('searchClearBtn');
              if (searchClearBtn && searchQuery.trim()) {
                searchClearBtn.style.display = 'flex';
              }
            }
          }, 300);
        }
      };
      
      // Esperar a que los proyectos se carguen antes de aplicar la búsqueda
      setTimeout(applyPendingSearch, 800);
    }
  }

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



  // Configurar event listeners para el buscador

  const searchInput = document.getElementById('projectSearchInput');

  const searchClearBtn = document.getElementById('searchClearBtn');

  

  if (searchInput) {

    // Event listener para filtrar mientras se escribe

    searchInput.addEventListener('input', function(e) {

      const searchTerm = e.target.value;

      

      // Mostrar/ocultar botón de limpiar

      if (searchClearBtn) {

        if (searchTerm.trim() !== '') {

          searchClearBtn.style.display = 'flex';

        } else {

          searchClearBtn.style.display = 'none';

        }

      }

      

      // Filtrar proyectos

      filterProjectsBySearch(searchTerm);
      
      // Sincronizar con el buscador principal si existe
      const mainSearchInput = document.getElementById('buscar-proyecto');
      if (mainSearchInput) {
        mainSearchInput.value = searchTerm;
      }

    });

    

    // Event listener para limpiar búsqueda

    if (searchClearBtn) {

      searchClearBtn.addEventListener('click', function() {

        searchInput.value = '';

        searchClearBtn.style.display = 'none';

        filterProjectsBySearch('');

      });

    }

  }



  const typeFilter = document.getElementById('projectTypeFilter');

  if (typeFilter) {

    typeFilter.addEventListener('change', function(e) {

      const { value } = e.target;

      currentListViewTypeFilter = value || 'all';

      applyProjectListFilters();

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



  // Botón Editar Evento - Solo visible para admin

  const editEventBtn = document.getElementById('editEventBtn');

  if (editEventBtn) {

    // Verificar si el usuario es admin desde el contexto de Django

    // El contexto se pasa a través de una variable global o data attribute

    const isAdmin = editEventBtn.dataset.isAdmin === 'true' || 

                    (window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin) ||

                    (typeof usuario_maga !== 'undefined' && usuario_maga && usuario_maga.es_admin);

    

    if (!isAdmin) {

      // Ocultar el botón si no es admin

      editEventBtn.style.display = 'none';

    } else {

      // Mostrar y configurar el botón solo para admin

      editEventBtn.style.display = 'flex';

      editEventBtn.addEventListener('click', function() {

        const currentProject = getCurrentProject();

        if (!currentProject || !currentProject.id) {

          alert('Error: No se pudo obtener la información del evento.');

          return;

        }

        

        // Redirigir a la página de gestión de eventos con el ID del evento para editarlo directamente

        const eventoId = currentProject.id;

        window.location.href = `${window.DJANGO_URLS.gestioneseventos}#createEventView&evento=${eventoId}`;

      });

    }

  }



  // Botón Generar Reporte

  const generateReportBtn = document.getElementById('generateReportBtn');

  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', function() {
      const currentProject = getCurrentProject();

      if (!currentProject || !currentProject.id) {
        alert('No se pudo obtener la información del evento para generar el reporte.');
        return;
      }

      const baseReportesUrl = (window.DJANGO_URLS && window.DJANGO_URLS.reportes) || '/reportes/';
      let targetUrl;

      try {
        targetUrl = new URL(baseReportesUrl, window.location.origin);
      } catch (error) {
        console.warn('URL de reportes inválida, usando ruta por defecto.', error);
        targetUrl = new URL('/reportes/', window.location.origin);
      }

      targetUrl.searchParams.set('reporte', 'reporte-evento-individual');
      targetUrl.searchParams.set('evento', currentProject.id);

      window.location.href = targetUrl.toString();
    });
  }



  // Botones de agregar elementos

  // Los botones de agregar/quitar comunidad han sido removidos según solicitud del usuario


  ensureProjectActionHandlers();


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
  console.log('🔍 Buscando input imageFileInput...', imageFileInput);

  if (imageFileInput) {
    console.log('✅ Input imageFileInput encontrado, agregando listener');
    imageFileInput.addEventListener('change', handleImageSelect);

  } else {
    console.warn('⚠️ Input imageFileInput NO encontrado');
  }



  // Event listeners para cerrar modales

  const closeImageModal = document.getElementById('closeImageModal');

  if (closeImageModal) {

    closeImageModal.addEventListener('click', () => hideModal('addImageModal'));

  }



  // Event listener para cerrar modal de imagen en tamaño completo

  const closeImageViewModalBtn = document.getElementById('closeImageViewModal');

  if (closeImageViewModalBtn) {

    closeImageViewModalBtn.addEventListener('click', closeImageViewModal);

  }



  // Event listener para cerrar modal de imagen al hacer clic fuera del contenido

  const imageViewModal = document.getElementById('imageViewModal');

  if (imageViewModal) {

    imageViewModal.addEventListener('click', function(e) {

      // Cerrar si se hace clic fuera del contenido del modal

      if (e.target === imageViewModal) {

        closeImageViewModal();

      }

    });

  }



  // Event listener para cerrar modal de imagen con tecla ESC

  document.addEventListener('keydown', function(e) {

    if (e.key === 'Escape') {

      const imageViewModal = document.getElementById('imageViewModal');

      if (imageViewModal && imageViewModal.classList.contains('active')) {

        closeImageViewModal();

      }

    }

  });



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

    closeChangeModal.addEventListener('click', () => {

      clearChangeForm();

      hideModal('addChangeModal');

    });

  }



  // Event listeners para botones de cancelar

  const cancelImageBtn = document.getElementById('cancelImageBtn');

  if (cancelImageBtn) {

    cancelImageBtn.addEventListener('click', () => {

      clearImageForm();

      hideModal('addImageModal');

    });

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

    cancelChangeBtn.addEventListener('click', () => {

      clearChangeForm();

      hideModal('addChangeModal');

    });

  }



  // Event listeners para botones de confirmar

  const confirmImageBtn = document.getElementById('confirmImageBtn');
  console.log('🔍 Buscando botón confirmImageBtn...', confirmImageBtn);

  if (confirmImageBtn) {
    console.log('✅ Botón confirmImageBtn encontrado, agregando listener');
    confirmImageBtn.addEventListener('click', function(e) {
      console.log('🖱️ Click en botón AGREGAR (confirmImageBtn)');
      addImageToProject();
    });

  } else {
    console.warn('⚠️ Botón confirmImageBtn NO encontrado');
  }



  const confirmDescriptionBtn = document.getElementById('confirmDescriptionBtn');
  console.log('🔍 Buscando botón confirmDescriptionBtn...', confirmDescriptionBtn);

  if (confirmDescriptionBtn) {
    console.log('✅ Botón confirmDescriptionBtn encontrado, agregando listener');
    
    // Remover listener previo si existe (para evitar duplicados)
    confirmDescriptionBtn.removeEventListener('click', updateProjectDescription);
    
    confirmDescriptionBtn.addEventListener('click', function(e) {
      console.log('🖱️ Click en botón GUARDAR (confirmDescriptionBtn)', e);
      e.preventDefault();
      e.stopPropagation();
      updateProjectDescription();
    });

  } else {
    console.warn('⚠️ Botón confirmDescriptionBtn NO encontrado en el DOM');
    console.log('🔍 Elementos del DOM:', document.querySelectorAll('button'));
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
  console.log('🔍 Buscando botón confirmChangeBtn...', confirmChangeBtn);

  if (confirmChangeBtn) {
    console.log('✅ Botón confirmChangeBtn encontrado, agregando listener');
    confirmChangeBtn.addEventListener('click', function(e) {
      console.log('🖱️ Click en botón AGREGAR (confirmChangeBtn)');
      addChangeToProject();
    });

  } else {
    console.warn('⚠️ Botón confirmChangeBtn NO encontrado');
  }

  const confirmFileDescriptionBtn = document.getElementById('confirmFileDescriptionBtn');
  console.log('🔍 Buscando botón confirmFileDescriptionBtn...', confirmFileDescriptionBtn);

  if (confirmFileDescriptionBtn) {
    console.log('✅ Botón confirmFileDescriptionBtn encontrado, agregando listener');
    confirmFileDescriptionBtn.addEventListener('click', function(e) {
      console.log('🖱️ Click en botón GUARDAR CAMBIOS (confirmFileDescriptionBtn)');
      updateProjectFileDescription();
    });

  } else {
    console.log('⚠️ Botón confirmFileDescriptionBtn NO encontrado en el DOM');
  }

  const changeUseCurrentTimeCheckbox = document.getElementById('changeUseCurrentTime');

  if (changeUseCurrentTimeCheckbox) {

    changeUseCurrentTimeCheckbox.addEventListener('change', (event) => {
      toggleChangeUseCurrentTime(event.target.checked);
    });

  }

  

  // Event listener para el input de evidencias en el modal de cambios

  const changeEvidencesInput = document.getElementById('changeEvidencesInput');
  console.log('🔍 Buscando input changeEvidencesInput...', changeEvidencesInput);

  if (changeEvidencesInput) {
    console.log('✅ Input changeEvidencesInput encontrado, agregando listener');
    changeEvidencesInput.addEventListener('change', handleChangeEvidencesSelect);

  } else {
    console.warn('⚠️ Input changeEvidencesInput NO encontrado');
  }



  // Event listeners para modal de archivos

  const closeFileModal = document.getElementById('closeFileModal');

  if (closeFileModal) {

    closeFileModal.addEventListener('click', () => hideModal('addFileModal'));

  }

  const closeFileDescriptionModal = document.getElementById('closeFileDescriptionModal');

  if (closeFileDescriptionModal) {

    closeFileDescriptionModal.addEventListener('click', () => {
      currentProjectFileEdit = null;
      hideModal('editFileDescriptionModal');
    });

  }



  const cancelFileBtn = document.getElementById('cancelFileBtn');

  if (cancelFileBtn) {

    cancelFileBtn.addEventListener('click', () => hideModal('addFileModal'));

  }

  const cancelFileDescriptionBtn = document.getElementById('cancelFileDescriptionBtn');

  if (cancelFileDescriptionBtn) {

    cancelFileDescriptionBtn.addEventListener('click', () => {
      currentProjectFileEdit = null;
      hideModal('editFileDescriptionModal');
    });

  }



  const confirmFileBtn = document.getElementById('confirmFileBtn');
  console.log('🔍 Buscando botón confirmFileBtn...', confirmFileBtn);

  if (confirmFileBtn) {
    console.log('✅ Botón confirmFileBtn encontrado, agregando listener');
    confirmFileBtn.addEventListener('click', function(e) {
      console.log('🖱️ Click en botón AGREGAR (confirmFileBtn)');
      addFileToProject();
    });

  } else {
    console.log('⚠️ Botón confirmFileBtn NO encontrado en el DOM');
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
  console.log('🔍 Buscando botón confirmDeleteBtn...', confirmDeleteBtn);

  if (confirmDeleteBtn) {
    console.log('✅ Botón confirmDeleteBtn encontrado, agregando listener');
    confirmDeleteBtn.addEventListener('click', function(e) {
      console.log('🖱️ Click en botón ELIMINAR (confirmDeleteBtn)');
      executeDeleteAction();
    });

  } else {
    console.warn('⚠️ Botón confirmDeleteBtn NO encontrado');
  }



  // Event listeners para botones de eliminación de sección

  // El botón removeChangeBtn ha sido removido según solicitud del usuario



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

        const personnelType = button.getAttribute('data-personnel-type') || 'colaborador';

        removePersonnelFromProject(personnelId, personnelType);

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
      
      // Restaurar el scroll del body cuando se cierra el modal
      document.body.style.overflow = '';

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

  const checkboxes = document.querySelectorAll('.personnel-checkbox:checked:not(:disabled)');

  const selected = [];

  

  checkboxes.forEach(checkbox => {

    const item = checkbox.closest('.personnel-item');

    if (!item) return;

    

    const id = checkbox.getAttribute('data-personnel-id');

    const tipo = item.getAttribute('data-personnel-type');

    const nombreElement = item.querySelector('h4');

    const puestoElement = item.querySelector('p');

    

    if (id && nombreElement) {

      selected.push({

        id: id,

        tipo: tipo || 'colaborador',

        nombre: nombreElement.textContent.trim(),

        puesto: puestoElement ? puestoElement.textContent.trim() : ''

      });

    }

  });

  

  return selected;

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
// Función para cargar lista de personal en modal de cambios (solo colaboradores asignados al proyecto)

async function loadChangePersonnelList() {

  console.log('🔍 loadChangePersonnelList() llamada');
  
  const personnelList = document.getElementById('changePersonnelList');

  if (!personnelList) {
    console.error('❌ No se encontró el elemento changePersonnelList');
    return;
  }

  

  const currentProject = getCurrentProject();
  console.log('📦 Proyecto actual:', currentProject);

  if (!currentProject || !currentProject.id) {

    console.error('❌ No se pudo obtener el proyecto actual');
    personnelList.innerHTML = '<p style="color: #6c757d;">No se pudo obtener la información del proyecto.</p>';

    return;

  }

  

  // Obtener solo los colaboradores asignados al proyecto actual

  const personalAsignado = currentProject.personal || [];
  console.log('👥 Personal asignado:', personalAsignado);

  

  personnelList.innerHTML = '';

  

  if (personalAsignado.length === 0) {

    console.warn('⚠️ No hay personal asignado al proyecto');
    personnelList.innerHTML = '<p style="color: #6c757d;">No hay colaboradores asignados a este proyecto.</p>';

    return;

  }

  

  // Renderizar solo colaboradores (no usuarios directos) con checkboxes como en "Personal a Cargo"
  let colaboradoresCount = 0;
  
  personalAsignado.forEach(person => {
    console.log('👤 Procesando persona:', person.tipo, person.id, person.nombre);

    if (person.tipo === 'colaborador' && person.id) {
      colaboradoresCount++;

      const personnelItem = document.createElement('div');

      personnelItem.className = 'personnel-item';

      personnelItem.style.cssText = 'display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; cursor: pointer; border: 2px solid transparent;';

      personnelItem.setAttribute('data-personnel-id', person.id);

      personnelItem.innerHTML = `

        <input type="checkbox" class="change-personnel-checkbox" id="change-personnel-${person.id}" value="${person.id}" style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;">

        <div style="flex: 1;">

          <h4 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1rem;">${person.nombre || 'Sin nombre'}</h4>

          <p style="margin: 2px 0; color: #007bff; font-size: 0.9rem;">${person.puesto || person.rol_display || 'Sin puesto'}</p>

          <p style="margin: 2px 0; color: #b8c5d1; font-size: 0.85rem;">${person.rol_display || 'Colaborador'}</p>

        </div>

      `;

      personnelList.appendChild(personnelItem);

      

      // Agregar event listener para cambiar estilo cuando se selecciona

      const checkbox = personnelItem.querySelector('.change-personnel-checkbox');

      checkbox.addEventListener('change', function() {

        if (this.checked) {

          personnelItem.style.borderColor = '#007bff';

          personnelItem.style.background = 'rgba(0, 123, 255, 0.1)';

        } else {

          personnelItem.style.borderColor = 'transparent';

          personnelItem.style.background = 'rgba(255, 255, 255, 0.05)';

        }

      });

    }

  });

  console.log(`✅ Total colaboradores renderizados: ${colaboradoresCount}`);

  // Agregar event listener para el buscador

  const searchInput = document.getElementById('changePersonnelSearch');

  if (searchInput) {

    searchInput.addEventListener('input', filterChangePersonnel);

  }

}

// Función para cargar comunidades del proyecto en el formulario de cambios
async function loadChangeCommunitiesList() {
  console.log('🔍 loadChangeCommunitiesList() llamada');
  
  const communitiesList = document.getElementById('changeCommunitiesList');

  if (!communitiesList) {
    console.error('❌ No se encontró el elemento changeCommunitiesList');
    return;
  }

  const currentProject = getCurrentProject();
  console.log('📦 Proyecto actual:', currentProject);

  if (!currentProject || !currentProject.id) {
    console.error('❌ No se pudo obtener el proyecto actual');
    communitiesList.innerHTML = '<p style="color: #6c757d;">No se pudo obtener la información del proyecto.</p>';
    return;
  }

  // Obtener las comunidades relacionadas con el proyecto
  const rawCommunities = currentProject.comunidades || currentProject.communities || [];
  
  // Normalizar las comunidades para asegurar que tengan los campos correctos
  const comunidadesProyecto = normalizeCommunitiesData(rawCommunities);
  console.log('🏘️ Comunidades del proyecto (normalizadas):', comunidadesProyecto);

  communitiesList.innerHTML = '';

  if (comunidadesProyecto.length === 0) {
    console.warn('⚠️ No hay comunidades relacionadas con el proyecto');
    communitiesList.innerHTML = '<p style="color: #6c757d;">No hay comunidades relacionadas con este proyecto.</p>';
    return;
  }

  // Renderizar comunidades con checkboxes
  comunidadesProyecto.forEach(comunidad => {
    const communityItem = document.createElement('div');
    communityItem.className = 'community-item';
    communityItem.style.cssText = 'display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; cursor: pointer; border: 2px solid transparent;';

    // Obtener el ID de la comunidad de múltiples fuentes posibles
    // IMPORTANTE: Verificar todos los campos posibles donde puede estar el ID
    let comunidadId = null;
    
    // Intentar obtener el ID de diferentes campos
    if (comunidad.id) {
      comunidadId = String(comunidad.id).trim();
    } else if (comunidad.comunidad_id) {
      comunidadId = String(comunidad.comunidad_id).trim();
    } else if (comunidad.community_id) {
      comunidadId = String(comunidad.community_id).trim();
    } else if (comunidad.pk) {
      comunidadId = String(comunidad.pk).trim();
    } else if (comunidad.uuid) {
      comunidadId = String(comunidad.uuid).trim();
    }
    
    if (!comunidadId || comunidadId === '' || comunidadId === 'undefined' || comunidadId === 'null') {
      console.error('❌ Comunidad sin ID válido, saltando:', {
        comunidad: comunidad,
        id: comunidad.id,
        comunidad_id: comunidad.comunidad_id,
        community_id: comunidad.community_id,
        pk: comunidad.pk,
        uuid: comunidad.uuid
      });
      return; // Saltar esta comunidad si no tiene ID
    }
    
    // Usar el campo 'name' que viene de normalizeCommunitiesData
    const comunidadNombre = comunidad.name || comunidad.nombre || 'Sin nombre';
    // Usar el campo 'region' que viene de normalizeCommunitiesData (ya incluye región y sede)
    const regionNombre = comunidad.region || comunidad.region_nombre || 'Sin región';

    console.log(`🏘️ Cargando comunidad en lista: ${comunidadNombre} (ID: ${comunidadId}, tipo: ${typeof comunidadId})`);

    communityItem.setAttribute('data-community-id', comunidadId);

    // Asegurarse de que el valor del checkbox sea el ID correcto
    const checkboxId = `change-community-${comunidadId.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
    const checkboxValue = comunidadId; // El valor debe ser el ID de la comunidad
    
    communityItem.innerHTML = `
      <input type="checkbox" class="change-community-checkbox" id="${escapeHtml(checkboxId)}" value="${escapeHtml(checkboxValue)}" style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;">
      <div style="flex: 1;">
        <h4 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1rem;">${escapeHtml(comunidadNombre)}</h4>
        <p style="margin: 2px 0; color: #b8c5d1; font-size: 0.85rem;">${escapeHtml(regionNombre)}</p>
      </div>
    `;
    
    // Verificar que el checkbox se creó correctamente
    const createdCheckbox = communityItem.querySelector('.change-community-checkbox');
    if (createdCheckbox) {
      console.log(`✅ Checkbox creado: value="${createdCheckbox.value}", id="${createdCheckbox.id}"`);
    } else {
      console.error('❌ No se pudo crear el checkbox para:', comunidadNombre);
    }

    communitiesList.appendChild(communityItem);

    // Agregar event listener para cambiar estilo cuando se selecciona
    const checkbox = communityItem.querySelector('.change-community-checkbox');
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        communityItem.style.borderColor = '#007bff';
        communityItem.style.background = 'rgba(0, 123, 255, 0.1)';
      } else {
        communityItem.style.borderColor = 'transparent';
        communityItem.style.background = 'rgba(255, 255, 255, 0.05)';
      }
    });

    // Permitir clic en el item para seleccionar/deseleccionar
    communityItem.addEventListener('click', function(e) {
      if (e.target !== checkbox && e.target !== checkbox.parentElement) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
  });

  // Agregar event listener para el buscador de comunidades
  const searchInput = document.getElementById('changeCommunitiesSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterChangeCommunities);
  }
}

// Función para filtrar comunidades en el formulario de cambios
function filterChangeCommunities() {
  const searchTerm = document.getElementById('changeCommunitiesSearch').value.toLowerCase().trim();
  const communityItems = document.querySelectorAll('#changeCommunitiesList .community-item');

  communityItems.forEach(item => {
    const communityName = item.querySelector('h4')?.textContent.toLowerCase() || '';
    const regionName = item.querySelector('p')?.textContent.toLowerCase() || '';
    const matches = communityName.includes(searchTerm) || regionName.includes(searchTerm);
    item.style.display = matches ? 'flex' : 'none';
  });
}

// Función para obtener comunidades seleccionadas en modal de cambios
function getSelectedChangeCommunities() {
  const checkboxes = document.querySelectorAll('#changeCommunitiesList input.change-community-checkbox:checked');
  console.log('🔍 Comunidades seleccionadas:', checkboxes.length);

  const selected = [];

  checkboxes.forEach((cb, index) => {
    const communityItem = cb.closest('.community-item');
    if (communityItem) {
      const communityId = cb.value ? String(cb.value).trim() : '';
      const dataCommunityId = communityItem.getAttribute('data-community-id') ? String(communityItem.getAttribute('data-community-id')).trim() : '';
      const name = communityItem.querySelector('h4')?.textContent.trim() || '';
      
      // Usar el ID del checkbox o el data-attribute como respaldo
      let finalId = communityId || dataCommunityId || '';
      
      // Validar que el ID no sea vacío, null, undefined, o string "null"/"undefined"
      if (!finalId || finalId === '' || finalId === 'null' || finalId === 'undefined' || finalId === 'NaN') {
        console.error(`❌ Comunidad ${index + 1} sin ID válido:`, {
          name: name,
          checkboxValue: cb.value,
          checkboxValueType: typeof cb.value,
          dataAttribute: dataCommunityId,
          checkboxElement: cb
        });
        return; // Saltar esta comunidad
      }
      
      console.log(`✅ Comunidad seleccionada ${index + 1}:`, { 
        id: finalId, 
        idType: typeof finalId,
        name: name,
        checkboxValue: communityId,
        dataAttribute: dataCommunityId,
        checkboxElement: cb
      });

      selected.push({
        id: finalId,
        name: name
      });
    } else {
      console.error(`❌ No se pudo encontrar el elemento padre para checkbox ${index + 1}:`, cb);
    }
  });

  console.log('📋 Total comunidades seleccionadas:', selected);
  return selected;
}

// Función para obtener personal seleccionado en modal de cambios (múltiples)

function getSelectedChangePersonnel() {

  const checkboxes = document.querySelectorAll('#changePersonnelList input.change-personnel-checkbox:checked');
  console.log('🔍 Checkboxes seleccionados:', checkboxes.length);

  const selected = [];

  checkboxes.forEach(cb => {

    const personItem = cb.closest('.personnel-item');

    if (personItem) {

      const personId = cb.value;
      const name = personItem.querySelector('h4')?.textContent.trim() || '';
      
      console.log('✅ Colaborador seleccionado:', { id: personId, name: name });

      selected.push({

        id: personId,

        name: name

      });

    }

  });

  console.log('📋 Total seleccionados:', selected);
  return selected;

}
// Función para filtrar personal en modal de cambios

function filterChangePersonnel() {

  const searchTerm = document.getElementById('changePersonnelSearch').value.toLowerCase();

  const personnelItems = document.querySelectorAll('#changePersonnelList .personnel-item');

  

  personnelItems.forEach(item => {

    const name = item.querySelector('h4')?.textContent.toLowerCase() || '';

    const roleP = item.querySelector('p')?.textContent.toLowerCase() || '';

    const roleP2 = item.querySelectorAll('p')[1]?.textContent.toLowerCase() || '';

    

    if (name.includes(searchTerm) || roleP.includes(searchTerm) || roleP2.includes(searchTerm)) {

      item.style.display = 'flex';

    } else {

      item.style.display = 'none';

    }

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

async function saveProjectData() {

  console.log('saveProjectData() llamada');

  console.log('selectedCards:', selectedCards);

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  

  // Obtener el proyecto actual

  let proyecto = getCurrentProject();

  if (!proyecto || !proyecto.id) {

    showErrorMessage('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  // Validar que todas las tarjetas tengan título y valor

  const invalidCards = selectedCards.filter(card => !card.label.trim() || !card.value.trim());

  if (invalidCards.length > 0) {

    showErrorMessage('Por favor completa el título y valor de todas las tarjetas');

    return;

  }

  

  try {

    // Obtener tarjetas originales del proyecto

    const tarjetasOriginales = (proyecto.tarjetas_datos || []).map(t => t.id);

    console.log('📋 Tarjetas originales del proyecto:', tarjetasOriginales);

    

    // Crear un mapa de tarjetas por título para detectar duplicados

    const tarjetasPorTitulo = {};

    (proyecto.tarjetas_datos || []).forEach(t => {

      tarjetasPorTitulo[t.titulo.toLowerCase().trim()] = t.id;

    });

    

    // Separar tarjetas nuevas, actualizadas y eliminadas

    const tarjetasNuevas = [];

    const tarjetasActualizadas = [];

    const tarjetasTitulosNuevas = new Set(); // Para evitar duplicados en nuevas

    

    selectedCards.forEach(card => {

      const cardId = card.id || '';

      const cardLabelNormalized = card.label.trim().toLowerCase();

      console.log('🔍 Procesando tarjeta:', { id: cardId, label: card.label, isCustom: card.isCustom });

      

      // Si el ID es undefined, null, vacío o empieza con 'card_', es una tarjeta nueva

      if (!cardId || (typeof cardId === 'string' && cardId.startsWith('card_'))) {

        // Verificar si ya existe una tarjeta con el mismo título en la BD

        if (tarjetasPorTitulo[cardLabelNormalized]) {

          console.log('⚠️ Tarjeta con título existente encontrada, actualizando en lugar de crear nueva:', card.label);

          // Actualizar la tarjeta existente en lugar de crear una nueva

          tarjetasActualizadas.push({

            id: tarjetasPorTitulo[cardLabelNormalized],

            titulo: card.label.trim(),

            valor: card.value.trim(),

            icono: card.icon || '📊'

          });

        } else if (!tarjetasTitulosNuevas.has(cardLabelNormalized)) {

          // Solo agregar si no está duplicada en las nuevas

          console.log('✅ Tarjeta nueva detectada:', card.label);

          tarjetasNuevas.push({

            titulo: card.label.trim(),

            valor: card.value.trim(),

            icono: card.icon || '📊'

          });

          tarjetasTitulosNuevas.add(cardLabelNormalized);

        } else {

          console.log('⚠️ Tarjeta duplicada detectada (mismo título en nuevas):', card.label);

        }

      } else if (tarjetasOriginales.includes(cardId)) {

        // Si el ID existe en las tarjetas originales, es una actualización

        console.log('✅ Tarjeta actualizada detectada:', card.label, 'ID:', cardId);

        tarjetasActualizadas.push({

          id: cardId,

          titulo: card.label.trim(),

          valor: card.value.trim(),

          icono: card.icon || '📊'

        });

      } else {

        // Si el ID no está en las originales pero tampoco es nuevo, verificar por título

        if (tarjetasPorTitulo[cardLabelNormalized]) {

          console.log('⚠️ Tarjeta con ID desconocido pero título existente, actualizando:', card.label);

          tarjetasActualizadas.push({

            id: tarjetasPorTitulo[cardLabelNormalized],

            titulo: card.label.trim(),

            valor: card.value.trim(),

            icono: card.icon || '📊'

          });

        } else if (!tarjetasTitulosNuevas.has(cardLabelNormalized)) {

          console.log('⚠️ Tarjeta con ID desconocido, tratando como nueva:', card.label);

          tarjetasNuevas.push({

            titulo: card.label.trim(),

            valor: card.value.trim(),

            icono: card.icon || '📊'

          });

          tarjetasTitulosNuevas.add(cardLabelNormalized);

        }

      }

    });

    

    // Las tarjetas eliminadas son las que están en originales pero no en las actuales

    const tarjetasActualesIds = selectedCards

      .filter(c => c.id && typeof c.id === 'string' && !c.id.startsWith('card_'))

      .map(c => c.id);

    const tarjetasEliminadas = tarjetasOriginales.filter(id => !tarjetasActualesIds.includes(id));

    

    console.log('Tarjetas nuevas:', tarjetasNuevas);

    console.log('Tarjetas actualizadas:', tarjetasActualizadas);

    console.log('Tarjetas eliminadas:', tarjetasEliminadas);

    

    // Preparar datos para enviar a la API

    const formData = new FormData();

    

    if (tarjetasNuevas.length > 0) {

      formData.append('tarjetas_datos_nuevas', JSON.stringify(tarjetasNuevas));

    }

    if (tarjetasActualizadas.length > 0) {

      formData.append('tarjetas_datos_actualizadas', JSON.stringify(tarjetasActualizadas));

    }

    if (tarjetasEliminadas.length > 0) {

      formData.append('tarjetas_datos_eliminadas', JSON.stringify(tarjetasEliminadas));

    }

    

    // Si no hay cambios, solo cerrar el modal

    if (tarjetasNuevas.length === 0 && tarjetasActualizadas.length === 0 && tarjetasEliminadas.length === 0) {

      hideModal('editDataModal');

      return;

    }

    

    // Enviar a la API

    const response = await fetch(`/api/evento/${proyecto.id}/actualizar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

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

      console.log('📦 Resultado:', result);

    } catch (jsonError) {

      console.error('❌ Error al parsear JSON:', jsonError);

      showErrorMessage('Error al procesar la respuesta del servidor. Por favor, intenta de nuevo.');

      return;

    }

    

    if (!response.ok) {

      console.error('❌ Error en la respuesta:', result);

      showErrorMessage(result.error || `Error ${response.status}: ${response.statusText}`);

      return;

    }

    

    if (result.success) {

      console.log('✅ Datos del proyecto actualizados exitosamente');

      // Recargar los detalles del proyecto para mostrar los cambios

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(proyecto.id);

      hideModal('editDataModal');

      showSuccessMessage('Datos del proyecto actualizados exitosamente.');

      

      // Limpiar variables

      selectedCards = [];

      currentEditProject = null;

    } else {

      console.error('❌ Error en resultado:', result.error);

      showErrorMessage(result.error || 'Error al actualizar los datos del proyecto.');

    }

    

  } catch (error) {

    console.error('❌ Error al guardar datos del proyecto:', error);

    showErrorMessage('Error al guardar los datos. Por favor, intenta de nuevo.');

  }

}



// ======= FUNCIONES PARA MANEJO DE ARCHIVOS =======

// Variable para almacenar archivos seleccionados

let selectedProjectFiles = [];



function showAddFileModal() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  showModal('addFileModal');

  clearFileForm();

}



function clearFileForm() {

  document.getElementById('fileInput').value = '';

  document.getElementById('fileDescription').value = '';

  selectedProjectFiles = [];

  const filePreview = document.getElementById('filePreview');

  if (filePreview) {

    filePreview.innerHTML = '';

  }

}



function handleFileSelect(event) {
  console.log('📄 handleFileSelect() llamada', event);

  const file = event.target.files[0];
  console.log('📄 Archivo seleccionado:', file);

  if (!file) {
    console.log('❌ No se seleccionó ningún archivo');
    return;
  }

  

  // Agregar el archivo al array de archivos seleccionados
  const fileObj = {
    file: file,
    id: Date.now() + Math.random() // ID único para cada archivo
  };

  selectedProjectFiles.push(fileObj);
  console.log('✅ Archivo agregado a selectedProjectFiles:', fileObj);
  console.log('📄 Total de archivos en selectedProjectFiles:', selectedProjectFiles.length);

  

  // Limpiar el input para permitir seleccionar el mismo archivo de nuevo

  event.target.value = '';

  

  // Renderizar el preview de archivos

  renderFilePreview();

}



function renderFilePreview() {
  console.log('📄 renderFilePreview() llamada');
  console.log('📄 Archivos en selectedProjectFiles:', selectedProjectFiles.length);

  const preview = document.getElementById('filePreview');
  console.log('📄 Preview container:', preview);

  if (!preview) {
    console.log('❌ No se encontró el contenedor filePreview');
    return;
  }

  

  preview.innerHTML = '';

  

  if (selectedProjectFiles.length === 0) {
    console.log('ℹ️ No hay archivos para mostrar');
    return;

  }

  
  console.log('✅ Renderizando', selectedProjectFiles.length, 'archivo(s)');

  selectedProjectFiles.forEach((fileItem) => {

    const fileDiv = document.createElement('div');

    fileDiv.className = 'file-preview-item';

    fileDiv.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;';

    fileDiv.setAttribute('data-file-id', fileItem.id);

  

  const fileIcon = document.createElement('div');

  fileIcon.className = 'file-preview-icon';

    fileIcon.style.cssText = 'width: 48px; height: 48px; background: rgba(0, 123, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; color: #fff;';

    fileIcon.textContent = getFileExtension(fileItem.file.name).toUpperCase();

    

    const fileInfo = document.createElement('div');

    fileInfo.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 4px;';

  

  const fileName = document.createElement('div');

  fileName.className = 'file-preview-name';

    fileName.style.cssText = 'color: #fff; font-weight: 500; font-size: 0.9rem;';

    fileName.textContent = fileItem.file.name;

  

  const fileSize = document.createElement('div');

  fileSize.className = 'file-preview-size';

    fileSize.style.cssText = 'color: #6c757d; font-size: 0.85rem;';

    fileSize.textContent = formatFileSize(fileItem.file.size);

    

    fileInfo.appendChild(fileName);

    fileInfo.appendChild(fileSize);

    

    const removeBtn = document.createElement('button');

    removeBtn.type = 'button';

    removeBtn.className = 'remove-file-btn';

    removeBtn.setAttribute('data-file-id', fileItem.id);

    removeBtn.style.cssText = 'background: rgba(220, 53, 69, 0.9); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: background 0.2s;';

    removeBtn.title = 'Eliminar archivo';

    removeBtn.onmouseover = function() { this.style.background = '#dc3545'; };

    removeBtn.onmouseout = function() { this.style.background = 'rgba(220, 53, 69, 0.9)'; };

    removeBtn.innerHTML = `

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">

        <line x1="18" y1="6" x2="6" y2="18"></line>

        <line x1="6" y1="6" x2="18" y2="18"></line>

      </svg>

    `;

    

    // Event listener para eliminar archivo

    removeBtn.addEventListener('click', function(e) {

      e.stopPropagation();

      const fileId = this.getAttribute('data-file-id');

      removeProjectFile(fileId);

    });

    

    fileDiv.appendChild(fileIcon);

    fileDiv.appendChild(fileInfo);

    fileDiv.appendChild(removeBtn);

    preview.appendChild(fileDiv);

  });

}
function removeProjectFile(fileId) {

  selectedProjectFiles = selectedProjectFiles.filter(item => item.id !== parseFloat(fileId));

  renderFilePreview();

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



async function addFileToProject() {
  console.log('📄 addFileToProject() llamada');

  if (!tienePermisoGestionActual()) {
    console.log('❌ Sin permisos para gestionar');
    mostrarMensajePermisoDenegado();

    return;

  }
  
  console.log('✅ Permisos verificados');

  const fileDescription = document.getElementById('fileDescription').value.trim();
  console.log('📝 Descripción del archivo:', fileDescription);

  
  console.log('📄 Total de archivos en selectedProjectFiles:', selectedProjectFiles.length);

  if (selectedProjectFiles.length === 0) {

    showErrorMessage('Por favor selecciona al menos un archivo');

    return;

  }

  

  // Obtener el proyecto actual

  let proyecto = getCurrentProject();

  if (!proyecto || !proyecto.id) {

    alert('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  try {

    // Si hay múltiples archivos, enviarlos uno por uno

    // (El backend actualmente solo acepta un archivo a la vez)

    if (selectedProjectFiles.length > 1) {

      showErrorMessage('Por favor selecciona solo un archivo a la vez');

      return;

    }

    

    const fileItem = selectedProjectFiles[0];

    const file = fileItem.file;

    

    // Crear FormData para enviar el archivo

    const formData = new FormData();

    formData.append('archivo', file);

    if (fileDescription) {

      formData.append('descripcion', fileDescription);

    }

    

    // Llamar a la API

    const response = await fetch(`/api/evento/${proyecto.id}/archivo/agregar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      },

      body: formData

    });

    

    const result = await response.json();

    

    if (result.success) {

      // Recargar los detalles del proyecto para mostrar el nuevo archivo

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(proyecto.id);

      hideModal('addFileModal');

      clearFileForm();

      alert('Archivo agregado exitosamente al proyecto.');

    } else {

      alert(result.error || 'Error al agregar archivo.');

    }

    

  } catch (error) {

    console.error('Error al agregar archivo:', error);

    alert('Error al agregar archivo. Por favor, intenta de nuevo.');

  }

}
// Función para eliminar archivo del proyecto

async function eliminarArchivoProyecto(archivoId) {
  console.log('🗑️ eliminarArchivoProyecto() llamada', { archivoId });

  // Obtener el proyecto actual

  let proyecto = getCurrentProject();
  console.log('📂 Proyecto actual:', proyecto);

  if (!proyecto || !proyecto.id) {
    console.log('❌ No se pudo obtener la información del proyecto');
    showErrorMessage('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  try {
    console.log('🌐 Enviando solicitud DELETE a:', `/api/evento/${proyecto.id}/archivo/${archivoId}/eliminar/`);

    // Llamar a la API para eliminar

    const response = await fetch(`/api/evento/${proyecto.id}/archivo/${archivoId}/eliminar/`, {

      method: 'DELETE',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      }

    });

    

    const result = await response.json();
    console.log('📥 Respuesta del servidor:', result);

    

    if (result.success) {
      console.log('✅ Archivo eliminado exitosamente');

      // Recargar los detalles del proyecto para actualizar la lista

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(proyecto.id);

      showSuccessMessage('Archivo eliminado exitosamente.');

    } else {

      showErrorMessage(result.error || 'Error al eliminar archivo.');

    }

    

  } catch (error) {

    console.error('Error al eliminar archivo:', error);

    showErrorMessage('Error al eliminar archivo. Por favor, intenta de nuevo.');

  }

}


function showEditProjectFileDescriptionModal(fileId, description) {
  console.log('📝 showEditProjectFileDescriptionModal() llamada', { fileId, description });
  
  if (!puedeGestionarGaleria()) {
    console.log('❌ Sin permisos para editar archivos');
    showErrorMessage('No tienes permisos para editar archivos.');
    return;
  }
  
  console.log('✅ Permisos verificados');

  const textarea = document.getElementById('editFileDescriptionInput');
  console.log('📝 Textarea encontrado:', textarea);
  
  if (!textarea) {
    console.log('❌ No se encontró el textarea editFileDescriptionInput');
    return;
  }

  currentProjectFileEdit = {
    id: fileId,
    originalDescription: description || '',
  };
  console.log('📝 currentProjectFileEdit actualizado:', currentProjectFileEdit);

  textarea.value = description || '';
  showModal('editFileDescriptionModal');
  textarea.focus();
}


async function updateProjectFileDescription() {
  console.log('💾 updateProjectFileDescription() llamada');
  
  if (!puedeGestionarGaleria()) {
    console.log('❌ Sin permisos para editar archivos');
    showErrorMessage('No tienes permisos para editar archivos.');
    return;
  }
  
  console.log('✅ Permisos verificados');

  const proyectoId = currentProjectId || (currentProjectData && currentProjectData.id);
  console.log('📝 Proyecto ID:', proyectoId);
  console.log('📝 currentProjectFileEdit:', currentProjectFileEdit);
  
  if (!proyectoId || !currentProjectFileEdit || !currentProjectFileEdit.id) {
    console.log('❌ No se pudo identificar el archivo a editar');
    showErrorMessage('No se pudo identificar el archivo a editar.');
    return;
  }

  const textarea = document.getElementById('editFileDescriptionInput');
  console.log('📝 Textarea:', textarea);
  
  if (!textarea) {
    console.log('❌ No se encontró el textarea');
    return;
  }

  const newDescription = textarea.value.trim();
  console.log('📝 Nueva descripción:', newDescription);
  
  const confirmButton = document.getElementById('confirmFileDescriptionBtn');
  const originalLabel = confirmButton ? confirmButton.textContent : null;

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Guardando...';
  }

  try {
    const response = await fetch(`/api/evento/${proyectoId}/archivo/${currentProjectFileEdit.id}/actualizar/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken') || '',
      },
      body: JSON.stringify({ descripcion: newDescription }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'No se pudo actualizar la descripción');
    }

    shouldRefreshLatestProjects = true;
    await loadProjectDetails(proyectoId);
    hideModal('editFileDescriptionModal');
    showSuccessMessage('Descripción del archivo actualizada exitosamente.');
    currentProjectFileEdit = null;
  } catch (error) {
    console.error('Error al actualizar descripción del archivo:', error);
    showErrorMessage(error.message || 'Error al actualizar la descripción del archivo.');
  } finally {
    if (confirmButton) {
      confirmButton.disabled = false;
      confirmButton.textContent = originalLabel || 'Guardar cambios';
    }
  }
}


// Función obsoleta - mantener para compatibilidad pero no usar

function addFileToProjectOld() {

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

  

  const puedeGestionarGlobal = puedeGestionarGaleria();

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

    const puedeEditar = puedeGestionarGlobal && !file.es_evidencia;
    const puedeEliminar = puedeGestionarGlobal && !file.es_evidencia;

    if (puedeGestionarGlobal) {
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
      fileActions.appendChild(downloadBtn);
    }

    if (puedeEditar) {
      const editBtn = document.createElement('button');
      editBtn.className = 'file-edit-btn';
      editBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
        </svg>
        Editar
      `;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showEditProjectFileDescriptionModal(file.id, file.description || '');
      });
      fileActions.appendChild(editBtn);
    }

    if (puedeEliminar) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove-item';
      removeBtn.setAttribute('data-archivo-id', file.id);
      removeBtn.setAttribute('data-file-id', file.id);
      removeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showConfirmDeleteModal(
          `¿Estás seguro de que deseas eliminar el archivo "${file.name}"? Esta acción no se puede deshacer.`,
          async () => {
            await eliminarArchivoProyecto(file.id);
          }
        );
      });
      fileActions.appendChild(removeBtn);
    }

    fileItem.appendChild(fileIcon);

    fileItem.appendChild(fileInfo);

    if (fileActions.childElementCount > 0) {
      fileItem.appendChild(fileActions);
    }

    

    filesContainer.appendChild(fileItem);

  });

}



// ======= FUNCIONES DE ELIMINACIÓN =======

// Función para eliminar personal del proyecto

async function removePersonnelFromProject(personnelId, personnelType) {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  

  if (!confirm('¿Estás seguro de que deseas eliminar este miembro del personal del evento?')) {

    return;

  }

  

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    alert('Error: No se pudo obtener la información del evento.');

    return;

  }

  

  try {

    // Obtener el personal actual del evento

    const currentPersonnel = currentProject.personal || [];

    

    // Filtrar el personal a eliminar

    const updatedPersonnel = currentPersonnel.filter(p => {

      const pId = p.id || p.colaborador_id || p.usuario_id;

      return pId !== personnelId;

    });

    

    // Preparar el formato para la API

    const personalIds = updatedPersonnel.map(p => ({

      id: p.id || p.colaborador_id || p.usuario_id,

      tipo: p.tipo || 'colaborador',

      rol: p.rol || 'Colaborador'

    }));

    

    // Crear FormData para enviar a la API

    const formData = new FormData();

    formData.append('personal_ids', JSON.stringify(personalIds));

    

    // Llamar a la API de actualizar evento

    const response = await fetch(`/api/evento/${currentProject.id}/actualizar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      },

      body: formData

    });

    

    const result = await response.json();

    

    if (result.success) {

      // Recargar los detalles del evento

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

      alert('Personal eliminado exitosamente del evento.');

    } else {

      alert(result.error || 'Error al eliminar personal del evento.');

    }

    

  } catch (error) {

    console.error('Error al eliminar personal:', error);

    alert('Error al eliminar personal. Por favor, intenta de nuevo.');

  }

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
  console.log('🗑️ executeDeleteAction() llamada');
  console.log('🗑️ pendingDeleteAction:', pendingDeleteAction);

  if (!tienePermisoGestionActual()) {
    console.log('❌ Sin permisos en executeDeleteAction');
    mostrarMensajePermisoDenegado();

    pendingDeleteAction = null;

    hideModal('confirmDeleteModal');

    return;

  }
  
  console.log('✅ Permisos verificados en executeDeleteAction');

  if (!pendingDeleteAction) {
    console.warn('⚠️ No hay acción pendiente de eliminación');
    return;
  }
  
  console.log('✅ Ejecutando acción de eliminación...');

  try {
    const result = pendingDeleteAction();

    if (result && typeof result.then === 'function') {
      result.finally(() => {
        hideModal('confirmDeleteModal');
        pendingDeleteAction = null;
      });
    } else {
      hideModal('confirmDeleteModal');
      pendingDeleteAction = null;
    }
  } catch (error) {
    console.error('Error al ejecutar la acción de eliminación:', error);
    hideModal('confirmDeleteModal');
    pendingDeleteAction = null;
  }
}



// Función para filtrar lista de personal

function filterPersonnelList() {

  const searchInput = document.getElementById('personnelSearch');

  if (!searchInput) return;

  

  const searchTerm = searchInput.value.toLowerCase();

  const personnelItems = document.querySelectorAll('.personnel-item');

  

  personnelItems.forEach(item => {

    const text = item.textContent.toLowerCase();

    if (text.includes(searchTerm)) {

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



// Función para mostrar modal de detalles de cambio (solo vista, excepto para agregar evidencias)

function showChangeDetailsModal(cambio) {

  if (!cambio) return;

  

  // Verificar permisos antes de mostrar el modal

  const puedeGestionar = puedeGestionarGaleria();

  if (!puedeGestionar) {

    console.log('⚠️ Usuario no autenticado intentó abrir modal de detalles del cambio');

    return; // Bloquear acceso al modal para usuarios no autenticados

  }

  

  // Llenar información del cambio

  const fechaDisplay = cambio.fecha_display || cambio.fecha_cambio || 'Sin fecha';

  document.getElementById('changeDetailsDate').textContent = fechaDisplay;

  

  // Mostrar descripción del cambio como texto de solo lectura (no editable)

  const descripcionElement = document.getElementById('changeDetailsDescription');

  if (descripcionElement) {

    descripcionElement.innerHTML = '';

    const descripcionText = document.createElement('p');

    descripcionText.style.cssText = 'color: #b8c5d1; font-size: 0.9rem; line-height: 1.6; margin: 0; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; white-space: pre-wrap; word-wrap: break-word;';

    descripcionText.textContent = cambio.descripcion || 'Sin descripción';

    descripcionElement.appendChild(descripcionText);

  }

  

  document.getElementById('changeDetailsPersonnel').textContent = cambio.responsables_display || cambio.responsable || 'Sin responsable';

  // Mostrar comunidades donde se trabajó
  const comunidadesInfo = document.getElementById('changeDetailsCommunities');
  if (comunidadesInfo) {
    const comunidadesText = (cambio.comunidades && cambio.comunidades.trim() !== '') 
      ? cambio.comunidades 
      : (cambio.comunidades_nombres && cambio.comunidades_nombres.trim() !== '') 
        ? cambio.comunidades_nombres 
        : null;
    
    if (comunidadesText && comunidadesText.trim() !== '' && comunidadesText !== 'Sin comunidades') {
      comunidadesInfo.innerHTML = `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="display: flex; align-items: center; gap: 8px; color: #0ea5e9; font-size: 0.9rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <strong>Trabajado en:</strong> <span>${escapeHtml(comunidadesText)}</span>
          </div>
        </div>
      `;
    } else {
      comunidadesInfo.innerHTML = '';
    }
  }

  

  // Cargar evidencias (pasar permisos)

  loadEvidences(cambio.evidencias || [], puedeGestionar);

  

  // Guardar el ID del cambio actual para agregar evidencias

  currentCambioId = cambio.id;

  

  // Mostrar/ocultar botón de agregar evidencia según permisos

  const addEvidenceBtn = document.getElementById('addEvidenceBtn');

  if (addEvidenceBtn) {

    addEvidenceBtn.style.display = puedeGestionar ? 'flex' : 'none';

  }

  

  showModal('changeDetailsModal');

}



// Función para actualizar descripción del cambio

async function actualizarDescripcionCambio(cambioId, descripcion) {

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id) {

    showErrorMessage('No se pudo obtener la información del proyecto');

    return;

  }

  

  try {

    const formData = new FormData();

    formData.append('descripcion', descripcion);

    

    const response = await fetch(`/api/evento/${currentProject.id}/cambio/${cambioId}/actualizar/`, {

      method: 'POST',

      body: formData,

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      }

    });

    

    const result = await response.json();

    

    if (result.success) {

      showSuccessMessage('Descripción del cambio actualizada exitosamente');

      

      // Recargar los detalles del proyecto

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

      

      // Reabrir el modal de detalles del cambio con los datos actualizados

      const cambioActualizado = currentProjectData?.cambios?.find(c => c.id === cambioId);

      if (cambioActualizado) {

        showChangeDetailsModal(cambioActualizado);

      }

    } else {

      showErrorMessage(result.error || 'Error al actualizar descripción');

    }

  } catch (error) {

    console.error('Error al actualizar descripción del cambio:', error);

    showErrorMessage('Error al actualizar descripción. Por favor, intenta de nuevo.');

  }

}



// Variable para almacenar el ID del cambio actual en el modal de detalles

let currentCambioId = null;



// Función para editar descripción de evidencia

function editarDescripcionEvidencia(evidenciaId, evidence) {

  const descripcionActual = evidence.descripcion || '';

  const nuevaDescripcion = prompt('Ingresa la descripción para esta evidencia:', descripcionActual);

  

  if (nuevaDescripcion === null) {

    return; // Usuario canceló

  }

  

  actualizarDescripcionEvidencia(evidenciaId, nuevaDescripcion.trim());

}



// Función para actualizar descripción de evidencia usando API

async function actualizarDescripcionEvidencia(evidenciaId, descripcion) {

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id || !currentCambioId) {

    showErrorMessage('No se pudo obtener la información del cambio');

    return;

  }

  

  try {

    const formData = new FormData();

    formData.append('descripcion', descripcion);

    

    const response = await fetch(`/api/evento/${currentProject.id}/cambio/${currentCambioId}/evidencia/${evidenciaId}/actualizar/`, {

      method: 'POST',

      body: formData,

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      }

    });

    

    const result = await response.json();

    

    if (result.success) {

      showSuccessMessage('Descripción actualizada exitosamente');

      

      // Recargar los detalles del proyecto

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

      

      // Reabrir el modal de detalles del cambio con datos actualizados

      const cambio = currentProjectData?.cambios?.find(c => c.id === currentCambioId);

      if (cambio) {

        // Actualizar el objeto evidence en el array para reflejar el cambio

        const evidenceIndex = cambio.evidencias?.findIndex(e => e.id === evidenciaId);

        if (evidenceIndex !== undefined && evidenceIndex !== -1 && cambio.evidencias) {

          cambio.evidencias[evidenceIndex].descripcion = descripcion;

        }

        showChangeDetailsModal(cambio);

      }

    } else {

      showErrorMessage(result.error || 'Error al actualizar descripción');

    }

  } catch (error) {

    console.error('Error al actualizar descripción:', error);

    showErrorMessage('Error al actualizar descripción. Por favor, intenta de nuevo.');

  }

}



// Función para cargar evidencias

function loadEvidences(evidences, puedeGestionar = false) {

  const grid = document.getElementById('evidencesGrid');

  if (!grid) return;

  

  // Aplicar estilos mejorados al grid para evitar que se vea amontonado

  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding: 20px 0;';

  

  grid.innerHTML = '';

  

  if (!evidences || evidences.length === 0) {

    grid.innerHTML = `

      <div class="no-evidences" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">

        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px;">

          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>

          <polyline points="14,2 14,8 20,8"></polyline>

        </svg>

        <p style="margin: 8px 0; font-size: 1rem;">No hay evidencias para este cambio</p>

        ${puedeGestionar ? '<p style="margin: 8px 0; font-size: 0.9rem; color: #6c757d;">Haz clic en "Agregar Evidencia" para comenzar</p>' : ''}

      </div>

    `;

    return;

  }



  evidences.forEach((evidence) => {

    const evidenceItem = document.createElement('div');

    evidenceItem.className = 'evidence-item';

    evidenceItem.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s, box-shadow 0.2s;';

    evidenceItem.onmouseover = function() { 

      this.style.transform = 'translateY(-2px)'; 

      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; 

    };

    evidenceItem.onmouseout = function() { 

      this.style.transform = 'translateY(0)'; 

      this.style.boxShadow = 'none'; 

    };

    

    const isImage = evidence.tipo && evidence.tipo.startsWith('image/');

    const nombreArchivo = evidence.nombre || evidence.archivo_nombre || 'Sin nombre';

    

    // Si puede gestionar, mostrar enlace clickeable, si no, solo texto

    const nombreArchivoHTML = puedeGestionar 

      ? `<a href="${evidence.url}" target="_blank" style="color: #007bff; text-decoration: none; font-weight: 500; font-size: 0.9rem; flex: 1; min-width: 0; word-break: break-word;" title="${nombreArchivo}" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${nombreArchivo}</a>`

      : `<span style="color: #6c757d; font-weight: 500; font-size: 0.9rem; flex: 1; min-width: 0; word-break: break-word; cursor: not-allowed;" title="Debes iniciar sesión como admin o personal para ver/descargar evidencias">${nombreArchivo}</span>`;

    

    // Botón de eliminar solo si tiene permisos

    const botonEliminarHTML = puedeGestionar 

      ? `<button class="evidence-remove" data-evidence-id="${evidence.id}" style="background: rgba(220, 53, 69, 0.9); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; transition: background 0.2s; flex-shrink: 0;" title="Eliminar evidencia" onmouseover="this.style.background='#dc3545'" onmouseout="this.style.background='rgba(220, 53, 69, 0.9)'">

          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

            <line x1="18" y1="6" x2="6" y2="18"></line>

            <line x1="6" y1="6" x2="18" y2="18"></line>

          </svg>

        </button>`

      : '';

    

    evidenceItem.innerHTML = `

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">

        ${isImage ? 

          `<img src="${evidence.url}" alt="${nombreArchivo}" class="evidence-image" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">` :

          `<div class="evidence-file-icon" style="font-size: 1.8rem; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(0, 123, 255, 0.2); border-radius: 6px; flex-shrink: 0;">📄</div>`

        }

        <div style="flex: 1; min-width: 0;">

          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">

            ${nombreArchivoHTML}

            ${botonEliminarHTML}

          </div>

          <div style="color: #6c757d; font-size: 0.8rem; margin-bottom: 8px;">${evidence.tipo || 'Archivo'}</div>

        </div>

      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">

        <label style="color: #b8c5d1; font-size: 0.85rem; display: block; margin-bottom: 6px;">Descripción:</label>

        <p style="color: #fff; font-size: 0.9rem; margin: 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; min-height: 40px;">${evidence.descripcion || '<span style="color: #6c757d; font-style: italic;">Sin descripción</span>'}</p>

      </div>

    `;

    

    grid.appendChild(evidenceItem);

  });

  

  // Agregar event listeners para eliminar evidencias

  grid.querySelectorAll('.evidence-remove').forEach(btn => {

    btn.addEventListener('click', async function(e) {

      e.stopPropagation();

      const evidenciaId = this.getAttribute('data-evidence-id');

      await eliminarEvidenciaCambio(evidenciaId);

    });

  });

}
// Función para mostrar modal de agregar evidencia

function showAddEvidenceModal() {

  const currentProject = getCurrentProject();

  if (!currentProject || !currentCambioId) {

    showErrorMessage('No se pudo obtener la información del cambio');

    return;

  }

  

  const cambio = currentProject.cambios?.find(c => c.id === currentCambioId);

  if (cambio && cambio.evidencias && cambio.evidencias.length >= 10) {

    showErrorMessage('Máximo 10 evidencias por cambio');

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

  selectedEvidenceFile = null;

}
// Variable para almacenar el archivo de evidencia seleccionado
let selectedEvidenceFile = null;
// Función para manejar selección de archivo de evidencia

function handleEvidenceSelect() {

  const fileInput = document.getElementById('evidenceInput');

  const preview = document.getElementById('evidencePreview');

  

  if (fileInput.files && fileInput.files[0]) {

    const file = fileInput.files[0];

    selectedEvidenceFile = file;

    const isImage = file.type.startsWith('image/');

    

    preview.innerHTML = `

      <div class="file-preview-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.1);">

        <div class="file-preview-icon" style="font-size: 2rem; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(0, 123, 255, 0.2); border-radius: 8px;">${isImage ? '🖼️' : '📄'}</div>

        <div style="flex: 1; min-width: 0;">

          <div class="file-preview-name" style="font-weight: 500; color: #fff; font-size: 0.9rem; margin-bottom: 4px; word-break: break-word;">${file.name}</div>

          <div class="file-preview-size" style="color: #6c757d; font-size: 0.85rem;">${formatFileSize(file.size)}</div>

        </div>

        <button type="button" class="remove-evidence-file-btn" style="background: rgba(220, 53, 69, 0.9); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: background 0.2s;" title="Eliminar archivo" onmouseover="this.style.background='#dc3545'" onmouseout="this.style.background='rgba(220, 53, 69, 0.9)'">

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">

            <line x1="18" y1="6" x2="6" y2="18"></line>

            <line x1="6" y1="6" x2="18" y2="18"></line>

          </svg>

        </button>

      </div>

    `;

    

    // Agregar event listener para eliminar archivo

    const removeBtn = preview.querySelector('.remove-evidence-file-btn');

    if (removeBtn) {

      removeBtn.addEventListener('click', function() {

        selectedEvidenceFile = null;

        fileInput.value = '';

        preview.innerHTML = '';

      });

    }

  }

}
// Función para agregar evidencia a un cambio existente usando API

async function addEvidenceToChange() {

  if (!tienePermisoGestionActual()) {

    mostrarMensajePermisoDenegado();

    return;

  }

  const fileInput = document.getElementById('evidenceInput');

  const description = document.getElementById('evidenceDescription').value.trim();

  

  // Usar el archivo seleccionado (de selectedEvidenceFile o del input)

  const file = selectedEvidenceFile || (fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null);

  

  if (!file) {

    showErrorMessage('Por favor selecciona un archivo');

    return;

  }

  

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id || !currentCambioId) {

    showErrorMessage('No se pudo obtener la información del cambio');

    return;

  }

  

  try {

    const formData = new FormData();

    formData.append('archivo', file);

    if (description) {

      formData.append('descripcion', description);

    }

    

    const response = await fetch(`/api/evento/${currentProject.id}/cambio/${currentCambioId}/evidencia/agregar/`, {

      method: 'POST',

      body: formData,

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      }

    });

    

    const result = await response.json();

    

    if (result.success) {

      showSuccessMessage('Evidencia agregada exitosamente');

      hideModal('addEvidenceModal');

      clearEvidenceForm();

      

      // Recargar los detalles del proyecto para actualizar las evidencias

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

      

      // Reabrir el modal de detalles del cambio

      const cambio = currentProjectData?.cambios?.find(c => c.id === currentCambioId);

      if (cambio) {

        showChangeDetailsModal(cambio);

      }

    } else {

      showErrorMessage(result.error || 'Error al agregar evidencia');

    }

  } catch (error) {

    console.error('Error al agregar evidencia:', error);

    showErrorMessage('Error al agregar evidencia. Por favor, intenta de nuevo.');

  }

}



// Función para eliminar evidencia de un cambio usando API

async function eliminarEvidenciaCambio(evidenciaId) {

  const currentProject = getCurrentProject();

  if (!currentProject || !currentProject.id || !currentCambioId) {

    showErrorMessage('No se pudo obtener la información del cambio');

    return;

  }

  

  if (!confirm('¿Estás seguro de que deseas eliminar esta evidencia?')) {

    return;

  }

  

  try {

    const response = await fetch(`/api/evento/${currentProject.id}/cambio/${currentCambioId}/evidencia/${evidenciaId}/eliminar/`, {

      method: 'POST',

      headers: {

        'X-CSRFToken': getCookie('csrftoken')

      }

    });

    

    const result = await response.json();

    

    if (result.success) {

      showSuccessMessage('Evidencia eliminada exitosamente');

      

      // Recargar los detalles del proyecto

      shouldRefreshLatestProjects = true;
      await loadProjectDetails(currentProject.id);

      

      // Reabrir el modal de detalles del cambio

      const cambio = currentProjectData?.cambios?.find(c => c.id === currentCambioId);

      if (cambio) {

        showChangeDetailsModal(cambio);

      }

    } else {

      showErrorMessage(result.error || 'Error al eliminar evidencia');

    }

  } catch (error) {

    console.error('Error al eliminar evidencia:', error);

    showErrorMessage('Error al eliminar evidencia. Por favor, intenta de nuevo.');

  }

}



// Función para manejar selección de archivos de evidencias en el modal de cambios

function handleChangeEvidencesSelect(event) {
  console.log('📎 handleChangeEvidencesSelect() llamada', event);

  const files = event.target.files;
  console.log('📎 Archivos seleccionados:', files ? files.length : 0, files);

  const preview = document.getElementById('changeEvidencesPreview');
  console.log('📎 Preview container:', preview);

  if (!preview) {
    console.warn('⚠️ Preview container NO encontrado');
    return;
  }

  

  // Agregar nuevos archivos al array

  if (files && files.length > 0) {
    console.log('✅ Agregando', files.length, 'archivo(s) a selectedEvidencesFiles');

    Array.from(files).forEach(file => {

      selectedEvidencesFiles.push({

        file: file,

        id: Date.now() + Math.random(), // ID único para cada archivo

        descripcion: '' // Inicializar descripción vacía

      });

    });
    
    console.log('📎 Total de archivos en selectedEvidencesFiles:', selectedEvidencesFiles.length);

  }

  

  // Renderizar todos los archivos seleccionados

  renderEvidencesPreview();

  

  // Limpiar el input para permitir seleccionar el mismo archivo de nuevo

  event.target.value = '';

}



// Función para renderizar evidencias existentes en el modal de edición

function renderExistingEvidences(evidencias) {

  const preview = document.getElementById('changeEvidencesPreview');

  if (!preview) return;

  

  // Limpiar solo si no hay evidencias nuevas

  if (selectedEvidencesFiles.length === 0) {

    preview.innerHTML = '';

  }

  

  if (!evidencias || evidencias.length === 0) {

    if (selectedEvidencesFiles.length === 0) {

      preview.innerHTML = '<p style="color: #6c757d; padding: 12px; text-align: center;">No hay evidencias para este cambio.</p>';

    }

    return;

  }

  

  evidencias.forEach((evidencia) => {

    const fileDiv = document.createElement('div');

    fileDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(0, 123, 255, 0.1); border: 1px solid rgba(0, 123, 255, 0.3); border-radius: 8px; margin-top: 8px;';

    fileDiv.setAttribute('data-evidence-id', evidencia.id);

    fileDiv.setAttribute('data-evidence-existing', 'true');

    

    const isImage = evidencia.tipo && evidencia.tipo.startsWith('image/');

    const nombreArchivo = evidencia.nombre || evidencia.archivo_nombre || 'Sin nombre';

    

    // Guardar descripción original para comparar cambios

    const descripcionOriginal = evidencia.descripcion || '';

    // Escapar comillas para el atributo HTML data-original-desc

    const descripcionOriginalEscaped = descripcionOriginal.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    

    fileDiv.innerHTML = `

      <div style="display: flex; align-items: center; gap: 10px;">

        ${isImage ? 

          `<img src="${evidencia.url}" alt="${nombreArchivo}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` :

          `<div style="width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📄</div>`

        }

        <span style="color: #fff; flex: 1;">${nombreArchivo}</span>

        <a href="${evidencia.url}" target="_blank" style="color: #007bff; text-decoration: none; margin-right: 8px;" title="Ver archivo">

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>

            <polyline points="15 3 21 3 21 9"></polyline>

            <line x1="10" y1="14" x2="21" y2="3"></line>

          </svg>

        </a>

        <span style="color: #6c757d; font-size: 0.8rem; padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">Existente</span>

      </div>

      <div class="evidence-description-container" style="display: flex; flex-direction: column; gap: 4px;">

        <label style="color: #b8c5d1; font-size: 0.85rem;">Descripción:</label>

        <textarea class="evidence-description-input-existing" data-evidence-id="${evidencia.id}" data-original-desc="${descripcionOriginalEscaped}" rows="2" placeholder="Agregar descripción..." style="width: 100%; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.9rem; resize: vertical; font-family: inherit;">${descripcionOriginal.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>

      </div>

    `;

    

    // Insertar antes de las evidencias nuevas si existen

    if (selectedEvidencesFiles.length > 0) {

      const firstNewEvidence = preview.querySelector('[data-evidence-existing]');

      if (firstNewEvidence) {

        preview.insertBefore(fileDiv, firstNewEvidence);

      } else {

        preview.appendChild(fileDiv);

      }

    } else {

      preview.appendChild(fileDiv);

    }

  });

}



function renderEvidencesPreview() {

  const preview = document.getElementById('changeEvidencesPreview');

  if (!preview) return;

  

  // Guardar evidencias existentes antes de limpiar las nuevas

  const existingEvidences = Array.from(preview.querySelectorAll('[data-evidence-existing="true"]'));

  const existingEvidencesHTML = existingEvidences.map(el => el.outerHTML).join('');

  

  // Eliminar solo las evidencias nuevas (las que no tienen el atributo data-evidence-existing)

  const newEvidences = Array.from(preview.querySelectorAll('[data-file-id]:not([data-evidence-existing])'));

  newEvidences.forEach(el => el.remove());

  

  if (selectedEvidencesFiles.length === 0) {

    // Si no hay evidencias nuevas, restaurar las existentes o mostrar mensaje

    if (existingEvidencesHTML) {

      preview.innerHTML = existingEvidencesHTML;

    } else if (editingCambioId) {

      // Si estamos editando pero no hay evidencias nuevas ni existentes

      preview.innerHTML = '<p style="color: #6c757d; padding: 12px; text-align: center;">No hay evidencias nuevas seleccionadas.</p>';

    } else {

  preview.innerHTML = '';

    }

    return;

  }

  

  // Reconstruir: primero las existentes, luego las nuevas

  preview.innerHTML = existingEvidencesHTML;

  

  selectedEvidencesFiles.forEach((fileItem, index) => {

    const fileDiv = document.createElement('div');

    fileDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-top: 8px;';

    fileDiv.setAttribute('data-file-id', fileItem.id);

    fileDiv.innerHTML = `

      <div style="display: flex; align-items: center; gap: 10px;">

      <span style="color: #fff; flex: 1;">${fileItem.file.name}</span>

      <button type="button" class="remove-evidence-btn" data-file-id="${fileItem.id}" style="background: rgba(220, 53, 69, 0.9); color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;" title="Eliminar archivo">

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">

          <line x1="18" y1="6" x2="6" y2="18"></line>

          <line x1="6" y1="6" x2="18" y2="18"></line>

        </svg>

      </button>

      </div>

      <div class="evidence-description-container" style="display: flex; flex-direction: column; gap: 4px;">

        <label style="color: #b8c5d1; font-size: 0.85rem;">Descripción (opcional):</label>

        <textarea class="evidence-description-input" data-file-id="${fileItem.id}" rows="2" placeholder="Agregar descripción para esta evidencia..." style="width: 100%; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.9rem; resize: vertical;">${fileItem.descripcion || ''}</textarea>

      </div>

    `;

    preview.appendChild(fileDiv);

    

    // Agregar event listener para actualizar descripción cuando se escriba

    const textarea = fileDiv.querySelector('.evidence-description-input');

    if (textarea) {

      textarea.addEventListener('input', function(e) {

        const fileId = this.getAttribute('data-file-id');

        const fileItem = selectedEvidencesFiles.find(f => f.id == fileId);

        if (fileItem) {

          fileItem.descripcion = this.value.trim();

        }

      });

    }

  });

  

  // Agregar event listeners a los botones de eliminar

  preview.querySelectorAll('.remove-evidence-btn').forEach(btn => {

    btn.addEventListener('click', function(e) {

      e.stopPropagation();

      const fileId = this.getAttribute('data-file-id');

      removeEvidenceFile(fileId);

    });

  });

}



function removeEvidenceFile(fileId) {

  selectedEvidencesFiles = selectedEvidencesFiles.filter(item => item.id !== parseFloat(fileId));

  renderEvidencesPreview();

}

document.addEventListener('click', function(event) {
  const pendingRemoveButton = event.target.closest('.image-preview-remove');
  if (pendingRemoveButton && pendingRemoveButton.dataset.index) {
    event.preventDefault();
    const index = parseInt(pendingRemoveButton.dataset.index, 10);
    if (!Number.isNaN(index)) {
      const removedItems = pendingProjectGalleryImages.splice(index, 1);
      removedItems.forEach(revokePendingImagePreview);
      renderPendingProjectImages();
    }
    return;
  }
});