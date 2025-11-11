// reportes.js

// Variables globales
let charts = {};
let currentReportType = null;
let currentFilters = {};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // 1. Cargar datos del dashboard ejecutivo
    loadDashboardStats();
    
    // 2. Configurar event listeners para tarjetas de reportes
    setupReportCards();
    
    // 3. Cargar opciones para filtros
    loadFilterOptions();
    
    // 4. Configurar filtros
    setupFilters();
    
    // 5. Configurar botón de volver
    setupBackButton();

    // 6. Procesar parámetros de la URL (si existen)
    initializeFromQueryParams();
});

// Función para cargar dashboard
async function loadDashboardStats() {
    try {
        const response = await fetch('/reportes/dashboard/stats/');
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas del dashboard');
        }
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showError('Error al cargar el dashboard. Por favor, recarga la página.');
    }
}

// Función para renderizar dashboard
function renderDashboard(data) {
    // Actualizar métricas
    document.getElementById('metricTotalActividades').textContent = data.total_actividades || 0;
    document.getElementById('metricComunidades').textContent = data.comunidades_alcanzadas || 0;
    document.getElementById('metricTrabajadores').textContent = data.trabajadores_activos || 0;
    document.getElementById('metricBeneficiarios').textContent = data.beneficiarios_alcanzados || 0;
    document.getElementById('metricCompletadasMes').textContent = data.actividades_completadas_mes || 0;
    document.getElementById('metricPendientes').textContent = data.actividades_pendientes || 0;
    
    // Renderizar gráficos
    renderChartActividadesMes(data.actividades_por_mes || []);
    renderChartPorTipo(data.distribucion_por_tipo || {});
    renderChartPorRegion(data.actividades_por_region || []);
    renderChartEstado(data.estado_actividades || {});
    
    // Renderizar tablas
    renderTableComunidadesActivas(data.top_comunidades || []);
    renderTableResponsables(data.top_responsables || []);
    renderTableProximas(data.actividades_trabajadas_recientemente || []);
}

// Gráfico: Actividades por Mes
function renderChartActividadesMes(data) {
    const ctx = document.getElementById('chartActividadesMes').getContext('2d');
    
    if (charts.actividadesMes) {
        charts.actividadesMes.destroy();
    }
    
    charts.actividadesMes = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.mes),
            datasets: [{
                label: 'Actividades',
                data: data.map(item => item.total),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#eef5ff'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#a8b2c2'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#a8b2c2'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Gráfico: Distribución por Tipo
function renderChartPorTipo(data) {
    const ctx = document.getElementById('chartPorTipo').getContext('2d');
    
    if (charts.porTipo) {
        charts.porTipo.destroy();
    }
    
    charts.porTipo = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#17a2b8',
                    '#dc3545'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#eef5ff'
                    }
                }
            }
        }
    });
}

// Gráfico: Actividades por Región (Top 5)
function renderChartPorRegion(data) {
    const ctx = document.getElementById('chartPorRegion').getContext('2d');
    
    if (charts.porRegion) {
        charts.porRegion.destroy();
    }
    
    charts.porRegion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.region),
            datasets: [{
                label: 'Actividades',
                data: data.map(item => item.total),
                backgroundColor: '#007bff'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#a8b2c2'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#a8b2c2'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Gráfico: Estado de Actividades
function renderChartEstado(data) {
    const ctx = document.getElementById('chartEstado').getContext('2d');
    
    if (charts.estado) {
        charts.estado.destroy();
    }
    
    charts.estado = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#ffc107',
                    '#17a2b8',
                    '#28a745',
                    '#dc3545'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#eef5ff'
                    }
                }
            }
        }
    });
}

// Tabla: Top 5 Comunidades Más Activas
function renderTableComunidadesActivas(data) {
    const tbody = document.querySelector('#tableComunidadesActivas tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No hay datos disponibles</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.comunidad || '-')}</td>
            <td>${escapeHtml(item.region || '-')}</td>
            <td>${item.total_actividades || 0}</td>
            <td>${item.ultima_actividad || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Tabla: Top 5 Responsables Más Productivos
function renderTableResponsables(data) {
    const tbody = document.querySelector('#tableResponsables tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No hay datos disponibles</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.responsable || '-')}</td>
            <td>${escapeHtml(item.puesto || '-')}</td>
            <td>${item.completadas || 0}</td>
            <td>${item.en_progreso || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

// Tabla: Próximas Actividades (7 días)
function renderTableProximas(data) {
    const tbody = document.querySelector('#tableProximas tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No hay actividades trabajadas recientemente</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.nombre || '-')}</td>
            <td>${item.fecha || '-'}</td>
            <td>${item.fecha_ultimo_cambio || '-'}</td>
            <td>${escapeHtml(item.comunidad || '-')}</td>
            <td><span class="status-badge status-${item.estado || 'planificado'}">${formatEstado(item.estado)}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Configurar tarjetas de reportes
function setupReportCards() {
    const reportCards = document.querySelectorAll('.report-card');
    reportCards.forEach(card => {
        card.addEventListener('click', function() {
            const reportType = this.getAttribute('data-report-type');
            openReport(reportType);
        });
    });
}

// Abrir reporte
function openReport(reportType, options = {}) {
    currentReportType = reportType;
    
    // Limpiar completamente el contenedor de resultados antes de mostrar el nuevo reporte
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    // Ocultar dashboard y sección de reportes
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('reportsSection').style.display = 'none';
    
    // Mostrar sección de resultados
    document.getElementById('resultsSection').style.display = 'block';
    
    // Actualizar título (solo si existe la tarjeta del reporte)
    const reportCard = document.querySelector('.report-card[data-report-type="' + reportType + '"]');
    const resultsTitle = document.getElementById('resultsTitle');
    if (reportCard && resultsTitle) {
        const cardTitle = reportCard.querySelector('.card-title');
        if (cardTitle) {
            resultsTitle.textContent = cardTitle.textContent;
        }
    } else if (reportType === 'reporte-general' && resultsTitle) {
        // Título especial para reporte general
        resultsTitle.textContent = 'Reporte General';
    }
    
    // Mostrar formulario específico según el tipo de reporte
    hideAllForms();
    showFormForReport(reportType);
    
    // Cargar datos específicos del formulario (async, esperar a que termine)
    const loadPromise = loadFormData(reportType);

    return loadPromise.then(() => {
        if (!options.skipReset) {
            resetFiltersForm(reportType);
        }
    }).catch(error => {
        console.error('Error al preparar el formulario del reporte:', error);
        if (options.propagateError) {
            throw error;
        }
    });
}

// Ocultar todos los formularios
function hideAllForms() {
    document.querySelectorAll('.report-form').forEach(form => {
        form.style.display = 'none';
    });
}

// Mostrar formulario según tipo de reporte
// Función para abrir el reporte general
function openReporteGeneral() {
    openReport('reporte-general');
}

function showFormForReport(reportType) {
    const formMap = {
        'actividades-por-region-comunidad': 'form-actividades-por-region-comunidad',
        'beneficiarios-por-region-comunidad': 'form-beneficiarios-por-region-comunidad',
        'actividad-de-personal': 'form-actividad-de-personal',
        'avances-eventos-generales': 'form-avances-eventos-generales',
        'reporte-evento-individual': 'form-reporte-evento-individual',
        'comunidades': 'form-comunidades',
        'actividad-usuarios': 'form-actividad-usuarios',
        'reporte-general': 'form-reporte-general'
    };
    
    const formId = formMap[reportType] || 'form-generic';
    const form = document.getElementById(formId);
    if (form) {
        form.style.display = 'block';
    }
}

// Cargar datos específicos del formulario
async function loadFormData(reportType) {
    if (reportType === 'actividades-por-region-comunidad' || reportType === 'beneficiarios-por-region-comunidad') {
        // Cargar todas las comunidades para el buscador
        await loadAllComunidades();
        
        // Cargar eventos si es el reporte de beneficiarios
        if (reportType === 'beneficiarios-por-region-comunidad') {
            await loadEventos();
            // Configurar buscador de eventos
            setupEventoSearchBeneficiarios();
        }
        
        // Configurar switches (solo para actividades, no para beneficiarios)
        if (reportType === 'actividades-por-region-comunidad') {
            setupSwitches(reportType);
            // Configurar selectores de período (solo para actividades)
            setupPeriodSelectors(reportType);
        }
        
        // Configurar buscadores de comunidades
        setupComunidadSearch(reportType);
    } else if (reportType === 'actividad-de-personal') {
        // Cargar todas las comunidades para el buscador
        await loadAllComunidades();
        
        // Cargar eventos
        await loadEventosPersonal();
        
        // Cargar colaboradores
        await loadColaboradores();
        
        // Configurar selector de período
        setupPeriodSelectorPersonal();
        
        // Configurar buscadores
        setupComunidadSearchPersonal();
        setupEventoSearchPersonal();
        
        // Configurar lista de colaboradores con checklist
        setupColaboradorSearchPersonal();
    } else if (reportType === 'avances-eventos-generales') {
        // Cargar todas las comunidades para el buscador
        await loadAllComunidades();
        
        // Cargar eventos
        await loadEventosPersonal();
        
        // Cargar colaboradores
        await loadColaboradores();
        
        // Configurar selector de período
        setupPeriodSelectorAvances();
        
        // Configurar buscadores
        setupComunidadSearchAvances();
        setupEventoSearchAvances();
        setupColaboradorSearchAvances();
    } else if (reportType === 'reporte-evento-individual') {
        // Cargar eventos
        await loadEventosIndividual();
        
        // Configurar buscador de eventos (solo uno)
        setupEventoSearchIndividual();
    } else if (reportType === 'comunidades') {
        // Cargar todas las comunidades
        await loadAllComunidades();
        
        // Cargar eventos
        await loadEventosComunidades();
        
        // Configurar selector de período
        setupPeriodSelectorComunidades();
        
        // Configurar buscadores
        setupEventoSearchComunidades();
        setupComunidadSearchComunidades();
    } else if (reportType === 'actividad-usuarios') {
        // Cargar todas las comunidades
        await loadAllComunidades();
        
        // Cargar eventos
        await loadEventosActividadUsuarios();
        
        // Cargar usuarios
        await loadUsuariosActividadUsuarios();
        
        // Configurar selector de período
        setupPeriodSelectorActividadUsuarios();
        
        // Configurar buscadores
        setupEventoSearchActividadUsuarios();
        setupComunidadSearchActividadUsuarios();
        setupUsuariosSearchActividadUsuarios();
    } else if (reportType === 'reporte-general') {
        // Configurar selector de período
        setupPeriodSelectorReporteGeneral();
    }
}

// Cargar todas las comunidades
let allComunidades = [];
async function loadAllComunidades() {
    try {
        const response = await fetch('/api/comunidades/');
        if (response.ok) {
            allComunidades = await response.json();
        }
    } catch (error) {
        console.error('Error cargando comunidades:', error);
    }
}

// Cargar tipos de actividad (solo para reporte de beneficiarios)
async function loadTiposActividad(reportType) {
    try {
        const response = await fetch('/api/tipos-actividad/');
        if (response.ok) {
            const tipos = await response.json();
            // Solo cargar para reporte de beneficiarios (actividades usa checkboxes estáticos)
            const selectId = 'filterTipoActividadBeneficiarios';
            const select = document.getElementById(selectId);
            
            if (select) {
                // Limpiar opciones existentes completamente
                select.innerHTML = '';
                
                // Agregar opciones de tipos de actividad (NINGUNA seleccionada por defecto)
                tipos.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.nombre;
                    option.textContent = tipo.nombre;
                    option.selected = false; // Asegurar que ninguna esté seleccionada
                    select.appendChild(option);
                });
                
                // Asegurar que no haya ninguna opción seleccionada
                select.selectedIndex = -1;
            }
        }
    } catch (error) {
        console.error('Error cargando tipos de actividad:', error);
    }
}

// Cargar eventos para reporte de beneficiarios
let allEventosBeneficiarios = [];
async function loadEventos() {
    try {
        const response = await fetch('/api/actividades/');
        if (response.ok) {
            allEventosBeneficiarios = await response.json();
            // Renderizar checklist de eventos
            renderEventosBeneficiariosChecklist();
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
    }
}

// Configurar lista de eventos con checklist y buscador para beneficiarios
let selectedEventosBeneficiarios = [];
let eventoBeneficiariosCheckboxes = [];
let eventoBeneficiariosSearchHandler = null;

function renderEventosBeneficiariosChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterEventosBeneficiarios');
    if (!checklistContainer) return;
    
    // Filtrar eventos según la búsqueda Y excluir los ya seleccionados
    const filtered = allEventosBeneficiarios.filter(evento => {
        // Excluir eventos ya seleccionados
        if (selectedEventosBeneficiarios.includes(evento.id)) {
            return false;
        }
        // Aplicar filtro de búsqueda
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase().trim();
        return evento.nombre && evento.nombre.toLowerCase().includes(query);
    });
    
    // Limpiar contenedor
    checklistContainer.innerHTML = '';
    eventoBeneficiariosCheckboxes = [];
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron eventos</p>';
        return;
    }
    
    // Crear checkboxes solo para eventos NO seleccionados
    filtered.forEach(evento => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = evento.id;
        checkbox.checked = false; // Nunca están seleccionados aquí porque ya están en tags
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedEventosBeneficiarios.includes(evento.id)) {
                    selectedEventosBeneficiarios.push(evento.id);
                    updateSelectedEventosBeneficiariosTags();
                    renderEventosBeneficiariosChecklist(filterQuery); // Re-renderizar lista sin el seleccionado
                }
            }
        });
        
        eventoBeneficiariosCheckboxes.push(checkbox);
        
        const span = document.createElement('span');
        span.textContent = evento.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

function updateSelectedEventosBeneficiariosTags() {
    const tagsContainer = document.getElementById('selectedEventosBeneficiariosTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedEventosBeneficiarios.forEach(eventoId => {
        const evento = allEventosBeneficiarios.find(e => e.id === eventoId);
        if (evento) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = evento.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedEventosBeneficiarios = selectedEventosBeneficiarios.filter(id => id !== eventoId);
                updateSelectedEventosBeneficiariosTags();
                // Re-renderizar lista con el evento deseleccionado
                const searchInput = document.getElementById('searchEventoBeneficiarios');
                renderEventosBeneficiariosChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

function setupEventoSearchBeneficiarios() {
    const searchInput = document.getElementById('searchEventoBeneficiarios');
    const checklistContainer = document.getElementById('filterEventosBeneficiarios');
    const container = document.getElementById('eventosBeneficiariosContainer');
    
    if (!searchInput || !checklistContainer || !container) return;
    
    // Renderizar tags seleccionados
    updateSelectedEventosBeneficiariosTags();
    
    // Renderizar lista inicial
    renderEventosBeneficiariosChecklist();
    
    // Configurar buscador para filtrar la lista
    if (eventoBeneficiariosSearchHandler) {
        searchInput.removeEventListener('input', eventoBeneficiariosSearchHandler);
    }
    
    eventoBeneficiariosSearchHandler = function() {
        const query = this.value;
        renderEventosBeneficiariosChecklist(query);
    };
    
    searchInput.addEventListener('input', eventoBeneficiariosSearchHandler);
    
    // Expandir lista cuando el usuario hace foco en el buscador
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconEventosBeneficiarios');
        if (icon) icon.textContent = '▼';
    });
    
    // Colapsar lista cuando el usuario sale del buscador
    searchInput.addEventListener('blur', function(e) {
        // Usar setTimeout para permitir que se procesen los clicks en los checkboxes y tags
        setTimeout(function() {
            // Verificar si el nuevo elemento activo está dentro del contenedor o en los tags
            const activeElement = document.activeElement;
            const tagsContainer = document.getElementById('selectedEventosBeneficiariosTags');
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer && tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconEventosBeneficiarios');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    // Mantener la lista abierta cuando se hace clic en los checkboxes
    checklistContainer.addEventListener('click', function(e) {
        // Si se hace clic en un checkbox o label, restaurar el foco al input después de un pequeño delay
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Cargar eventos para reporte de personal
let allEventos = [];
async function loadEventosPersonal() {
    try {
        const response = await fetch('/api/actividades/');
        if (response.ok) {
            allEventos = await response.json();
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
    }
}

// Cargar colaboradores
let allColaboradores = [];
async function loadColaboradores() {
    try {
        const response = await fetch('/api/colaboradores/');
        if (response.ok) {
            const data = await response.json();
            allColaboradores = data.colaboradores || [];
        }
    } catch (error) {
        console.error('Error cargando colaboradores:', error);
    }
}

// Configurar selector de período para reporte general
let periodoReporteGeneralHandler = null;
function setupPeriodSelectorReporteGeneral() {
    const periodSelect = document.getElementById('periodoReporteGeneral');
    const fechaInicioContainer = document.getElementById('fechaInicioReporteGeneral');
    const fechaFinContainer = document.getElementById('fechaFinReporteGeneral');
    
    if (!periodSelect || !fechaInicioContainer || !fechaFinContainer) return;
    
    // Remover listener anterior si existe
    if (periodoReporteGeneralHandler) {
        periodSelect.removeEventListener('change', periodoReporteGeneralHandler);
    }
    
    periodoReporteGeneralHandler = function() {
        if (this.value === 'rango') {
            fechaInicioContainer.style.display = 'block';
            fechaFinContainer.style.display = 'block';
        } else {
            fechaInicioContainer.style.display = 'none';
            fechaFinContainer.style.display = 'none';
        }
    };
    
    periodSelect.addEventListener('change', periodoReporteGeneralHandler);
    
    // Aplicar estado inicial
    if (periodSelect.value === 'rango') {
        fechaInicioContainer.style.display = 'block';
        fechaFinContainer.style.display = 'block';
    } else {
        fechaInicioContainer.style.display = 'none';
        fechaFinContainer.style.display = 'none';
    }
}

// Configurar selector de período para personal
let periodoPersonalHandler = null;
function setupPeriodSelectorPersonal() {
    const periodSelect = document.getElementById('filterPeriodoPersonal');
    const dateRangeContainer = document.getElementById('dateRangePersonal');
    
    if (!periodSelect || !dateRangeContainer) return;
    
    // Remover listener anterior si existe
    if (periodoPersonalHandler) {
        periodSelect.removeEventListener('change', periodoPersonalHandler);
    }
    
    periodoPersonalHandler = function() {
        if (this.value === 'rango') {
            dateRangeContainer.style.display = 'block';
        } else {
            dateRangeContainer.style.display = 'none';
        }
    };
    
    periodSelect.addEventListener('change', periodoPersonalHandler);
    
    // Aplicar estado inicial
    if (periodSelect.value === 'rango') {
        dateRangeContainer.style.display = 'block';
    } else {
        dateRangeContainer.style.display = 'none';
    }
}

// Configurar buscador de comunidades para personal
let selectedComunidadesPersonal = [];
let comunidadSearchHandler = null;
function setupComunidadSearchPersonal() {
    const searchInput = document.getElementById('searchComunidadPersonal');
    const resultsDiv = document.getElementById('searchResultsComunidadPersonal');
    
    if (!searchInput || !resultsDiv) return;
    
    // Remover listener anterior si existe
    if (comunidadSearchHandler) {
        searchInput.removeEventListener('input', comunidadSearchHandler);
    }
    
    comunidadSearchHandler = function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        const filtered = allComunidades.filter(com => 
            com.nombre.toLowerCase().includes(query)
        ).slice(0, 10);
        
        if (filtered.length === 0) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        resultsDiv.innerHTML = '';
        filtered.forEach(comunidad => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = comunidad.nombre;
            div.addEventListener('click', function() {
                if (!selectedComunidadesPersonal.includes(comunidad.id)) {
                    selectedComunidadesPersonal.push(comunidad.id);
                    updateSelectedComunidadesPersonal();
                }
                searchInput.value = '';
                resultsDiv.style.display = 'none';
            });
            resultsDiv.appendChild(div);
        });
        
        resultsDiv.style.display = 'block';
    };
    
    searchInput.addEventListener('input', comunidadSearchHandler);
    
    // Ocultar resultados al hacer clic fuera (solo una vez)
    if (!searchInput._clickOutsideHandlerComunidad) {
        searchInput._clickOutsideHandlerComunidad = function(e) {
            if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.style.display = 'none';
            }
        };
        document.addEventListener('click', searchInput._clickOutsideHandlerComunidad);
    }
}

function updateSelectedComunidadesPersonal() {
    const searchInput = document.getElementById('searchComunidadPersonal');
    if (!searchInput) return;
    
    const container = searchInput.parentElement;
    let selectedContainer = container.querySelector('.selected-comunidades');
    
    if (!selectedContainer) {
        selectedContainer = document.createElement('div');
        selectedContainer.className = 'selected-comunidades';
    } else {
        selectedContainer.innerHTML = '';
    }
    
    selectedComunidadesPersonal.forEach(comId => {
        const comunidad = allComunidades.find(c => c.id === comId);
        if (comunidad) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = comunidad.nombre;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedComunidadesPersonal = selectedComunidadesPersonal.filter(id => id !== comId);
                updateSelectedComunidadesPersonal();
            });
            tag.appendChild(removeBtn);
            selectedContainer.appendChild(tag);
        }
    });
    
    const existing = container.querySelector('.selected-comunidades');
    if (existing) existing.remove();
    container.appendChild(selectedContainer);
}

// Configurar lista de eventos con checklist y buscador para personal
let selectedEventosPersonal = [];
let eventoCheckboxes = [];
let eventoSearchHandler = null;

function renderEventosChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterEventosPersonal');
    if (!checklistContainer) return;
    
    // Filtrar eventos según la búsqueda Y excluir los ya seleccionados
    const filtered = allEventos.filter(evento => {
        // Excluir eventos ya seleccionados
        if (selectedEventosPersonal.includes(evento.id)) {
            return false;
        }
        // Aplicar filtro de búsqueda
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase().trim();
        return evento.nombre && evento.nombre.toLowerCase().includes(query);
    });
    
    // Limpiar contenedor
    checklistContainer.innerHTML = '';
    eventoCheckboxes = [];
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron eventos</p>';
        return;
    }
    
    // Crear checkboxes solo para eventos NO seleccionados
    filtered.forEach(evento => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = evento.id;
        checkbox.checked = false; // Nunca están seleccionados aquí porque ya están en tags
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedEventosPersonal.includes(evento.id)) {
                    selectedEventosPersonal.push(evento.id);
                    updateSelectedEventosPersonalTags();
                    renderEventosChecklist(filterQuery); // Re-renderizar lista sin el seleccionado
                }
            }
        });
        
        eventoCheckboxes.push(checkbox);
        
        const span = document.createElement('span');
        span.textContent = evento.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

function updateSelectedEventosPersonalTags() {
    const tagsContainer = document.getElementById('selectedEventosPersonalTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedEventosPersonal.forEach(eventoId => {
        const evento = allEventos.find(e => e.id === eventoId);
        if (evento) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = evento.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedEventosPersonal = selectedEventosPersonal.filter(id => id !== eventoId);
                updateSelectedEventosPersonalTags();
                // Re-renderizar lista con el evento deseleccionado
                const searchInput = document.getElementById('searchEventoPersonal');
                renderEventosChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

function setupEventoSearchPersonal() {
    const searchInput = document.getElementById('searchEventoPersonal');
    const checklistContainer = document.getElementById('filterEventosPersonal');
    const container = document.getElementById('eventosPersonalContainer');
    
    if (!searchInput || !checklistContainer || !container) return;
    
    // Renderizar tags seleccionados
    updateSelectedEventosPersonalTags();
    
    // Renderizar lista inicial
    renderEventosChecklist();
    
    // Configurar buscador para filtrar la lista
    if (eventoSearchHandler) {
        searchInput.removeEventListener('input', eventoSearchHandler);
    }
    
    eventoSearchHandler = function() {
        const query = this.value;
        renderEventosChecklist(query);
    };
    
    searchInput.addEventListener('input', eventoSearchHandler);
    
    // Expandir lista cuando el usuario hace foco en el buscador
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconEventosPersonal');
        if (icon) icon.textContent = '▼';
    });
    
    // Colapsar lista cuando el usuario sale del buscador
    searchInput.addEventListener('blur', function(e) {
        // Usar setTimeout para permitir que se procesen los clicks en los checkboxes y tags
        setTimeout(function() {
            // Verificar si el nuevo elemento activo está dentro del contenedor o en los tags
            const activeElement = document.activeElement;
            const tagsContainer = document.getElementById('selectedEventosPersonalTags');
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer && tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconEventosPersonal');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    // Mantener la lista abierta cuando se hace clic en los checkboxes
    checklistContainer.addEventListener('click', function(e) {
        // Si se hace clic en un checkbox o label, restaurar el foco al input después de un pequeño delay
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Función para colapsar/expandir checklists
function toggleChecklist(type) {
    let container, icon;
    
    if (type === 'eventosPersonal') {
        container = document.getElementById('eventosPersonalContainer');
        icon = document.getElementById('toggleIconEventosPersonal');
    } else if (type === 'colaboradoresPersonal') {
        container = document.getElementById('colaboradoresPersonalContainer');
        icon = document.getElementById('toggleIconColaboradoresPersonal');
    } else if (type === 'eventosBeneficiarios') {
        container = document.getElementById('eventosBeneficiariosContainer');
        icon = document.getElementById('toggleIconEventosBeneficiarios');
    }
    
    if (!container || !icon) return;
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        icon.textContent = '▼';
    } else {
        container.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Configurar lista de colaboradores con checklist y buscador para personal
let selectedColaboradoresPersonal = [];
let colaboradorCheckboxes = [];
let colaboradorSearchHandler = null;

function renderColaboradoresChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterColaboradoresPersonal');
    if (!checklistContainer) return;
    
    // Filtrar colaboradores según la búsqueda Y excluir los ya seleccionados
    const filtered = allColaboradores.filter(col => {
        // Excluir colaboradores ya seleccionados
        if (selectedColaboradoresPersonal.includes(col.id)) {
            return false;
        }
        // Aplicar filtro de búsqueda
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase().trim();
        return col.nombre && col.nombre.toLowerCase().includes(query);
    });
    
    // Limpiar contenedor
    checklistContainer.innerHTML = '';
    colaboradorCheckboxes = [];
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron colaboradores</p>';
        return;
    }
    
    // Crear checkboxes solo para colaboradores NO seleccionados
    filtered.forEach(colaborador => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = colaborador.id;
        checkbox.checked = false; // Nunca están seleccionados aquí porque ya están en tags
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedColaboradoresPersonal.includes(colaborador.id)) {
                    selectedColaboradoresPersonal.push(colaborador.id);
                    updateSelectedColaboradoresPersonalTags();
                    renderColaboradoresChecklist(filterQuery); // Re-renderizar lista sin el seleccionado
                }
            }
        });
        
        colaboradorCheckboxes.push(checkbox);
        
        const span = document.createElement('span');
        span.textContent = colaborador.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

function updateSelectedColaboradoresPersonalTags() {
    const tagsContainer = document.getElementById('selectedColaboradoresPersonalTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedColaboradoresPersonal.forEach(colId => {
        const colaborador = allColaboradores.find(c => c.id === colId);
        if (colaborador) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = colaborador.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedColaboradoresPersonal = selectedColaboradoresPersonal.filter(id => id !== colId);
                updateSelectedColaboradoresPersonalTags();
                // Re-renderizar lista con el colaborador deseleccionado
                const searchInput = document.getElementById('searchColaboradorPersonal');
                renderColaboradoresChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

function setupColaboradorSearchPersonal() {
    const searchInput = document.getElementById('searchColaboradorPersonal');
    const checklistContainer = document.getElementById('filterColaboradoresPersonal');
    const container = document.getElementById('colaboradoresPersonalContainer');
    
    if (!searchInput || !checklistContainer || !container) return;
    
    // Renderizar tags seleccionados
    updateSelectedColaboradoresPersonalTags();
    
    // Renderizar lista inicial
    renderColaboradoresChecklist();
    
    // Configurar buscador para filtrar la lista
    if (colaboradorSearchHandler) {
        searchInput.removeEventListener('input', colaboradorSearchHandler);
    }
    
    colaboradorSearchHandler = function() {
        const query = this.value;
        renderColaboradoresChecklist(query);
    };
    
    searchInput.addEventListener('input', colaboradorSearchHandler);
    
    // Expandir lista cuando el usuario hace foco en el buscador
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconColaboradoresPersonal');
        if (icon) icon.textContent = '▼';
    });
    
    // Colapsar lista cuando el usuario sale del buscador
    searchInput.addEventListener('blur', function(e) {
        // Usar setTimeout para permitir que se procesen los clicks en los checkboxes y tags
        setTimeout(function() {
            // Verificar si el nuevo elemento activo está dentro del contenedor o en los tags
            const activeElement = document.activeElement;
            const tagsContainer = document.getElementById('selectedColaboradoresPersonalTags');
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer && tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconColaboradoresPersonal');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    // Mantener la lista abierta cuando se hace clic en los checkboxes
    checklistContainer.addEventListener('click', function(e) {
        // Si se hace clic en un checkbox o label, restaurar el foco al input después de un pequeño delay
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// ==================== REPORTE: AVANCES DE EVENTOS GENERALES ====================

// Variables globales para Avances de Eventos Generales
let selectedComunidadesAvances = [];
let selectedEventosAvances = [];
let selectedColaboradoresAvances = [];
let eventoAvancesCheckboxes = [];
let colaboradorAvancesCheckboxes = [];
let periodoAvancesHandler = null;

// Configurar selector de período para Avances
function setupPeriodSelectorAvances() {
    const periodoSelect = document.getElementById('filterPeriodoAvances');
    const dateRangeContainer = document.getElementById('dateRangeAvances');
    
    if (!periodoSelect || !dateRangeContainer) return;
    
    if (periodoAvancesHandler) {
        periodoSelect.removeEventListener('change', periodoAvancesHandler);
    }
    
    periodoAvancesHandler = function() {
        if (this.value === 'rango') {
            dateRangeContainer.style.display = 'flex';
        } else {
            dateRangeContainer.style.display = 'none';
        }
    };
    
    periodoSelect.addEventListener('change', periodoAvancesHandler);
    if (periodoSelect.value !== 'rango') {
        dateRangeContainer.style.display = 'none';
    }
}

// Configurar buscador de comunidades para Avances
function setupComunidadSearchAvances() {
    const searchInput = document.getElementById('searchComunidadAvances');
    const resultsContainer = document.getElementById('searchResultsComunidadAvances');
    
    if (!searchInput || !resultsContainer) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        const filtered = allComunidades.filter(com => 
            com.nombre.toLowerCase().includes(query)
        ).slice(0, 10);
        
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">No se encontraron comunidades</div>';
        } else {
            resultsContainer.innerHTML = filtered.map(com => 
                `<div class="search-result-item" data-comunidad-id="${com.id}">${com.nombre}</div>`
            ).join('');
            
            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', function() {
                    const comId = this.getAttribute('data-comunidad-id');
                    const comunidad = allComunidades.find(c => c.id === comId);
                    if (comunidad && !selectedComunidadesAvances.includes(comId)) {
                        selectedComunidadesAvances.push(comId);
                        updateSelectedComunidadesAvances();
                    }
                    searchInput.value = '';
                    resultsContainer.style.display = 'none';
                });
            });
        }
        
        resultsContainer.style.display = 'block';
    });
    
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
}

function updateSelectedComunidadesAvances() {
    const container = document.querySelector('#searchResultsComunidadAvances')?.parentElement;
    if (!container) return;
    
    const selectedContainer = document.createElement('div');
    selectedContainer.className = 'selected-comunidades';
    selectedContainer.style.marginTop = '12px';
    
    selectedComunidadesAvances.forEach(comId => {
        const comunidad = allComunidades.find(c => c.id === comId);
        if (!comunidad) return;
        
        const tag = document.createElement('span');
        tag.className = 'selected-tag';
        tag.textContent = comunidad.nombre;
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function() {
            selectedComunidadesAvances = selectedComunidadesAvances.filter(id => id !== comId);
            updateSelectedComunidadesAvances();
        });
        
        tag.appendChild(removeBtn);
        selectedContainer.appendChild(tag);
    });
    
    const existing = container.querySelector('.selected-comunidades');
    if (existing) existing.remove();
    if (selectedComunidadesAvances.length > 0) {
        container.appendChild(selectedContainer);
    }
}

// Configurar buscador de eventos para Avances
function renderEventosAvancesChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterEventosAvances');
    if (!checklistContainer) return;
    
    checklistContainer.innerHTML = '';
    eventoAvancesCheckboxes = [];
    
    const query = filterQuery.toLowerCase();
    const filtered = allEventos.filter(evento => {
        const nombre = (evento.nombre || '').toLowerCase();
        return nombre.includes(query) && !selectedEventosAvances.includes(evento.id);
    });
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron eventos</p>';
        return;
    }
    
    filtered.forEach(evento => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = evento.id;
        checkbox.addEventListener('change', function() {
            if (this.checked && !selectedEventosAvances.includes(evento.id)) {
                selectedEventosAvances.push(evento.id);
                updateSelectedEventosAvancesTags();
                renderEventosAvancesChecklist(filterQuery);
            }
        });
        
        eventoAvancesCheckboxes.push(checkbox);
        const span = document.createElement('span');
        span.textContent = evento.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

function updateSelectedEventosAvancesTags() {
    const tagsContainer = document.getElementById('selectedEventosAvancesTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedEventosAvances.forEach(eventoId => {
        const evento = allEventos.find(e => e.id === eventoId);
        if (evento) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = evento.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedEventosAvances = selectedEventosAvances.filter(id => id !== eventoId);
                updateSelectedEventosAvancesTags();
                const searchInput = document.getElementById('searchEventoAvances');
                renderEventosAvancesChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

function setupEventoSearchAvances() {
    const searchInput = document.getElementById('searchEventoAvances');
    const checklistContainer = document.getElementById('filterEventosAvances');
    const container = document.getElementById('eventosAvancesContainer');
    const tagsContainer = document.getElementById('selectedEventosAvancesTags');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedEventosAvancesTags();
    renderEventosAvancesChecklist();
    
    searchInput.addEventListener('input', function() {
        renderEventosAvancesChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconEventosAvances');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function(e) {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer && tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconEventosAvances');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Configurar buscador de colaboradores para Avances
function renderColaboradoresAvancesChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterColaboradoresAvances');
    if (!checklistContainer) return;
    
    checklistContainer.innerHTML = '';
    colaboradorAvancesCheckboxes = [];
    
    const query = filterQuery.toLowerCase();
    const filtered = allColaboradores.filter(col => {
        const nombre = (col.nombre || '').toLowerCase();
        return nombre.includes(query) && !selectedColaboradoresAvances.includes(col.id);
    });
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron colaboradores</p>';
        return;
    }
    
    filtered.forEach(colaborador => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = colaborador.id;
        checkbox.addEventListener('change', function() {
            if (this.checked && !selectedColaboradoresAvances.includes(colaborador.id)) {
                selectedColaboradoresAvances.push(colaborador.id);
                updateSelectedColaboradoresAvancesTags();
                renderColaboradoresAvancesChecklist(filterQuery);
            }
        });
        
        colaboradorAvancesCheckboxes.push(checkbox);
        const span = document.createElement('span');
        span.textContent = colaborador.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

function updateSelectedColaboradoresAvancesTags() {
    const tagsContainer = document.getElementById('selectedColaboradoresAvancesTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedColaboradoresAvances.forEach(colId => {
        const colaborador = allColaboradores.find(c => c.id === colId);
        if (colaborador) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = colaborador.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedColaboradoresAvances = selectedColaboradoresAvances.filter(id => id !== colId);
                updateSelectedColaboradoresAvancesTags();
                const searchInput = document.getElementById('searchColaboradorAvances');
                renderColaboradoresAvancesChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

function setupColaboradorSearchAvances() {
    const searchInput = document.getElementById('searchColaboradorAvances');
    const checklistContainer = document.getElementById('filterColaboradoresAvances');
    const container = document.getElementById('colaboradoresAvancesContainer');
    const tagsContainer = document.getElementById('selectedColaboradoresAvancesTags');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedColaboradoresAvancesTags();
    renderColaboradoresAvancesChecklist();
    
    searchInput.addEventListener('input', function() {
        renderColaboradoresAvancesChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconColaboradoresAvances');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function(e) {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer && tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconColaboradoresAvances');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// ==================== REPORTE: EVENTO INDIVIDUAL ====================

// Variables globales para Reporte de Evento Individual
let allEventosIndividual = [];
let selectedEventoIndividual = null;
let eventoIndividualCheckboxes = [];

// Cargar eventos para reporte individual (filtrado por tipo de actividad)
async function loadEventosIndividual() {
    try {
        const response = await fetch('/api/actividades/');
        if (response.ok) {
            allEventosIndividual = await response.json();
            renderEventoIndividualChecklist();
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
    }
}

function renderEventoIndividualChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterEventoIndividual');
    if (!checklistContainer) return;
    
    checklistContainer.innerHTML = '';
    eventoIndividualCheckboxes = [];
    
    const tiposSeleccionados = Array.from(
        document.querySelectorAll('#filterTipoActividadIndividual input[type="checkbox"]:checked')
    ).map(cb => cb.value).filter(v => v !== 'todos');
    
    const query = filterQuery.toLowerCase();
    const filtered = allEventosIndividual.filter(evento => {
        const nombre = (evento.nombre || '').toLowerCase();
        const tipoMatch = tiposSeleccionados.length === 0 || 
            tiposSeleccionados.includes(evento.tipo) || 
            document.querySelector('#filterTipoActividadIndividual input[value="todos"]')?.checked;
        return nombre.includes(query) && tipoMatch && selectedEventoIndividual !== evento.id;
    });
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron eventos</p>';
        return;
    }
    
    filtered.forEach(evento => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'radio';
        checkbox.name = 'eventoIndividual';
        checkbox.value = evento.id;
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                selectedEventoIndividual = evento.id;
                updateSelectedEventoIndividualTag();
                renderEventoIndividualChecklist(filterQuery);
            }
        });
        
        eventoIndividualCheckboxes.push(checkbox);
        const span = document.createElement('span');
        span.textContent = evento.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

function updateSelectedEventoIndividualTag() {
    const tagsContainer = document.getElementById('selectedEventoIndividualTag');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    if (selectedEventoIndividual) {
        const evento = allEventosIndividual.find(e => e.id === selectedEventoIndividual);
        if (evento) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = evento.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedEventoIndividual = null;
                updateSelectedEventoIndividualTag();
                const searchInput = document.getElementById('searchEventoIndividual');
                renderEventoIndividualChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    }
}

function setupEventoSearchIndividual() {
    const searchInput = document.getElementById('searchEventoIndividual');
    const checklistContainer = document.getElementById('filterEventoIndividual');
    const container = document.getElementById('eventoIndividualContainer');
    const tagsContainer = document.getElementById('selectedEventoIndividualTag');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedEventoIndividualTag();
    renderEventoIndividualChecklist();
    
    document.querySelectorAll('#filterTipoActividadIndividual input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            renderEventoIndividualChecklist(searchInput.value);
        });
    });
    
    searchInput.addEventListener('input', function() {
        renderEventoIndividualChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconEventoIndividual');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function(e) {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer && tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconEventoIndividual');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'radio' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// ========== FUNCIONES PARA REPORTE DE COMUNIDADES ==========

// Variables globales para reporte de comunidades
let allEventosComunidades = [];
let selectedEventoComunidades = null;
let eventoComunidadesCheckboxes = [];
let selectedComunidadesComunidades = [];
let comunidadComunidadesCheckboxes = [];
let comunidadesDelEvento = []; // Comunidades relacionadas con el evento seleccionado

// Cargar eventos para reporte de comunidades
async function loadEventosComunidades() {
    try {
        const response = await fetch('/api/actividades/');
        if (response.ok) {
            allEventosComunidades = await response.json();
            renderEventoComunidadesChecklist();
        }
    } catch (error) {
        console.error('Error cargando eventos para comunidades:', error);
    }
}

// Renderizar checklist de eventos (selección única, tipo radio)
function renderEventoComunidadesChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterEventoComunidades');
    if (!checklistContainer) return;
    
    checklistContainer.innerHTML = '';
    eventoComunidadesCheckboxes = [];
    
    const tiposSeleccionados = Array.from(
        document.querySelectorAll('#filterTipoActividadComunidades input[type="checkbox"]:checked')
    ).map(cb => cb.value).filter(v => v !== 'todos');
    
    const query = filterQuery.toLowerCase();
    const filtered = allEventosComunidades.filter(evento => {
        const nombre = (evento.nombre || '').toLowerCase();
        const tipoMatch = tiposSeleccionados.length === 0 || 
            tiposSeleccionados.includes(evento.tipo) || 
            document.querySelector('#filterTipoActividadComunidades input[value="todos"]')?.checked;
        return nombre.includes(query) && tipoMatch && selectedEventoComunidades !== evento.id;
    });
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron eventos</p>';
        return;
    }
    
    filtered.forEach(evento => {
        const label = document.createElement('label');
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'eventoComunidades';
        radio.value = evento.id;
        radio.checked = selectedEventoComunidades === evento.id;
        radio.addEventListener('change', function() {
            if (this.checked) {
                selectedEventoComunidades = evento.id;
                updateSelectedEventoComunidadesTag();
                renderEventoComunidadesChecklist(filterQuery);
                // Cargar comunidades del evento seleccionado
                loadComunidadesDelEvento(evento.id);
            }
        });
        
        eventoComunidadesCheckboxes.push(radio);
        
        const span = document.createElement('span');
        span.textContent = evento.nombre || 'Sin nombre';
        
        label.appendChild(radio);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

// Actualizar tag del evento seleccionado
function updateSelectedEventoComunidadesTag() {
    const tagsContainer = document.getElementById('selectedEventoComunidadesTag');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    if (selectedEventoComunidades) {
        const evento = allEventosComunidades.find(e => e.id === selectedEventoComunidades);
        if (evento) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = evento.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedEventoComunidades = null;
                comunidadesDelEvento = []; // Limpiar comunidades del evento
                updateSelectedEventoComunidadesTag();
                const searchInput = document.getElementById('searchEventoComunidades');
                renderEventoComunidadesChecklist(searchInput ? searchInput.value : '');
                // Actualizar lista de comunidades para mostrar todas
                const comunidadSearchInput = document.getElementById('searchComunidadComunidades');
                renderComunidadComunidadesChecklist(comunidadSearchInput ? comunidadSearchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    }
}

// Configurar búsqueda de eventos (selección única)
function setupEventoSearchComunidades() {
    const searchInput = document.getElementById('searchEventoComunidades');
    const checklistContainer = document.getElementById('filterEventoComunidades');
    const container = document.getElementById('eventoComunidadesContainer');
    const tagsContainer = document.getElementById('selectedEventoComunidadesTag');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedEventoComunidadesTag();
    renderEventoComunidadesChecklist();
    
    // Escuchar cambios en tipo de actividad para actualizar lista
    document.querySelectorAll('#filterTipoActividadComunidades input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            renderEventoComunidadesChecklist(searchInput.value);
        });
    });
    
    searchInput.addEventListener('input', function() {
        renderEventoComunidadesChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconEventoComunidades');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconEventoComunidades');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'radio' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Cargar comunidades relacionadas con un evento específico
async function loadComunidadesDelEvento(eventoId) {
    try {
        const response = await fetch(`/api/evento/${eventoId}/`);
        if (response.ok) {
            const data = await response.json();
            const evento = data.evento || data; // El endpoint retorna {success: true, evento: {...}}
            
            // Obtener comunidades del evento (directa y M2M)
            comunidadesDelEvento = [];
            
            // El endpoint retorna 'comunidades' que es un array de objetos con 'comunidad_id'
            if (evento.comunidades && Array.isArray(evento.comunidades)) {
                evento.comunidades.forEach(comunidadData => {
                    if (comunidadData.comunidad_id && !comunidadesDelEvento.includes(comunidadData.comunidad_id)) {
                        comunidadesDelEvento.push(comunidadData.comunidad_id);
                    }
                });
            }
            
            // También verificar comunidad directa (por si no está en el array de comunidades)
            if (evento.comunidad_id && !comunidadesDelEvento.includes(evento.comunidad_id)) {
                comunidadesDelEvento.push(evento.comunidad_id);
            }
            
            // Limpiar comunidades seleccionadas que no pertenecen al nuevo evento
            selectedComunidadesComunidades = selectedComunidadesComunidades.filter(comunidadId => 
                comunidadesDelEvento.includes(comunidadId)
            );
            updateSelectedComunidadesComunidadesTags();
            
            // Actualizar lista de comunidades
            const searchInput = document.getElementById('searchComunidadComunidades');
            renderComunidadComunidadesChecklist(searchInput ? searchInput.value : '');
        }
    } catch (error) {
        console.error('Error cargando comunidades del evento:', error);
        comunidadesDelEvento = [];
    }
}

// Renderizar checklist de comunidades (selección múltiple)
function renderComunidadComunidadesChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterComunidadComunidades');
    if (!checklistContainer) return;
    
    // Si hay un evento seleccionado, filtrar solo las comunidades de ese evento
    // Si no hay evento seleccionado, mostrar todas las comunidades
    let comunidadesDisponibles = allComunidades;
    if (selectedEventoComunidades && comunidadesDelEvento.length > 0) {
        // Filtrar solo las comunidades relacionadas con el evento
        comunidadesDisponibles = allComunidades.filter(comunidad => 
            comunidadesDelEvento.includes(comunidad.id)
        );
    }
    
    const filtered = comunidadesDisponibles.filter(comunidad => {
        if (selectedComunidadesComunidades.includes(comunidad.id)) {
            return false;
        }
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase().trim();
        return comunidad.nombre && comunidad.nombre.toLowerCase().includes(query);
    });
    
    checklistContainer.innerHTML = '';
    comunidadComunidadesCheckboxes = [];
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron comunidades</p>';
        return;
    }
    
    filtered.forEach(comunidad => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = comunidad.id;
        checkbox.checked = false;
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedComunidadesComunidades.includes(comunidad.id)) {
                    selectedComunidadesComunidades.push(comunidad.id);
                    updateSelectedComunidadesComunidadesTags();
                    renderComunidadComunidadesChecklist(filterQuery);
                }
            }
        });
        
        comunidadComunidadesCheckboxes.push(checkbox);
        
        const span = document.createElement('span');
        span.textContent = comunidad.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

// Actualizar tags de comunidades seleccionadas
function updateSelectedComunidadesComunidadesTags() {
    const tagsContainer = document.getElementById('selectedComunidadesComunidadesTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedComunidadesComunidades.forEach(comunidadId => {
        const comunidad = allComunidades.find(c => c.id === comunidadId);
        if (comunidad) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = comunidad.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedComunidadesComunidades = selectedComunidadesComunidades.filter(id => id !== comunidadId);
                updateSelectedComunidadesComunidadesTags();
                const searchInput = document.getElementById('searchComunidadComunidades');
                renderComunidadComunidadesChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

// Configurar búsqueda de comunidades (selección múltiple)
function setupComunidadSearchComunidades() {
    const searchInput = document.getElementById('searchComunidadComunidades');
    const checklistContainer = document.getElementById('filterComunidadComunidades');
    const container = document.getElementById('comunidadComunidadesContainer');
    const tagsContainer = document.getElementById('selectedComunidadesComunidadesTags');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedComunidadesComunidadesTags();
    renderComunidadComunidadesChecklist();
    
    searchInput.addEventListener('input', function() {
        renderComunidadComunidadesChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconComunidadComunidades');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconComunidadComunidades');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Configurar selector de período para comunidades
function setupPeriodSelectorComunidades() {
    const periodSelect = document.getElementById('periodoComunidades');
    const fechaInicioContainer = document.getElementById('fechaInicioComunidades');
    const fechaFinContainer = document.getElementById('fechaFinComunidades');
    
    if (!periodSelect || !fechaInicioContainer || !fechaFinContainer) return;
    
    periodSelect.addEventListener('change', function() {
        if (this.value === 'rango') {
            fechaInicioContainer.style.display = 'block';
            fechaFinContainer.style.display = 'block';
        } else {
            fechaInicioContainer.style.display = 'none';
            fechaFinContainer.style.display = 'none';
        }
    });
}

// ========== FUNCIONES PARA REPORTE DE ACTIVIDAD DE USUARIOS ==========

// Variables globales para reporte de actividad de usuarios
let allEventosActividadUsuarios = [];
let selectedEventoActividadUsuarios = null;
let eventoActividadUsuariosCheckboxes = [];
let selectedComunidadesActividadUsuarios = [];
let comunidadActividadUsuariosCheckboxes = [];
let allUsuariosActividadUsuarios = [];
let selectedUsuariosActividadUsuarios = [];
let usuariosActividadUsuariosCheckboxes = [];
let comunidadesDelEventoActividadUsuarios = []; // Comunidades relacionadas con el evento seleccionado

// Cargar eventos para reporte de actividad de usuarios
async function loadEventosActividadUsuarios() {
    try {
        const response = await fetch('/api/actividades/');
        if (response.ok) {
            allEventosActividadUsuarios = await response.json();
            renderEventoActividadUsuariosChecklist();
        }
    } catch (error) {
        console.error('Error cargando eventos para actividad de usuarios:', error);
    }
}

// Renderizar checklist de eventos (selección única, tipo radio)
function renderEventoActividadUsuariosChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterEventoActividadUsuarios');
    if (!checklistContainer) return;
    
    checklistContainer.innerHTML = '';
    eventoActividadUsuariosCheckboxes = [];
    
    const tiposSeleccionados = Array.from(
        document.querySelectorAll('#filterTipoActividadActividadUsuarios input[type="checkbox"]:checked')
    ).map(cb => cb.value).filter(v => v !== 'todos');
    
    const query = filterQuery.toLowerCase();
    const filtered = allEventosActividadUsuarios.filter(evento => {
        const nombre = (evento.nombre || '').toLowerCase();
        const tipoMatch = tiposSeleccionados.length === 0 || 
            tiposSeleccionados.includes(evento.tipo) || 
            document.querySelector('#filterTipoActividadActividadUsuarios input[value="todos"]')?.checked;
        return nombre.includes(query) && tipoMatch && selectedEventoActividadUsuarios !== evento.id;
    });
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron eventos</p>';
        return;
    }
    
    filtered.forEach(evento => {
        const label = document.createElement('label');
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'eventoActividadUsuarios';
        radio.value = evento.id;
        radio.checked = selectedEventoActividadUsuarios === evento.id;
        radio.addEventListener('change', function() {
            if (this.checked) {
                selectedEventoActividadUsuarios = evento.id;
                updateSelectedEventoActividadUsuariosTag();
                renderEventoActividadUsuariosChecklist(filterQuery);
                // Cargar comunidades del evento seleccionado
                loadComunidadesDelEventoActividadUsuarios(evento.id);
            }
        });
        
        eventoActividadUsuariosCheckboxes.push(radio);
        
        const span = document.createElement('span');
        span.textContent = evento.nombre || 'Sin nombre';
        
        label.appendChild(radio);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

// Actualizar tag del evento seleccionado
function updateSelectedEventoActividadUsuariosTag() {
    const tagsContainer = document.getElementById('selectedEventoActividadUsuariosTag');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    if (selectedEventoActividadUsuarios) {
        const evento = allEventosActividadUsuarios.find(e => e.id === selectedEventoActividadUsuarios);
        if (evento) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = evento.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedEventoActividadUsuarios = null;
                updateSelectedEventoActividadUsuariosTag();
                const searchInput = document.getElementById('searchEventoActividadUsuarios');
                renderEventoActividadUsuariosChecklist(searchInput ? searchInput.value : '');
                
                // Limpiar filtro de comunidades y mostrar todas
                comunidadesDelEventoActividadUsuarios = [];
                const comunidadSearchInput = document.getElementById('searchComunidadActividadUsuarios');
                renderComunidadActividadUsuariosChecklist(comunidadSearchInput ? comunidadSearchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    }
}

// Configurar búsqueda de eventos (selección única)
function setupEventoSearchActividadUsuarios() {
    const searchInput = document.getElementById('searchEventoActividadUsuarios');
    const checklistContainer = document.getElementById('filterEventoActividadUsuarios');
    const container = document.getElementById('eventoActividadUsuariosContainer');
    const tagsContainer = document.getElementById('selectedEventoActividadUsuariosTag');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedEventoActividadUsuariosTag();
    renderEventoActividadUsuariosChecklist();
    
    // Escuchar cambios en tipo de actividad para actualizar lista
    document.querySelectorAll('#filterTipoActividadActividadUsuarios input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            renderEventoActividadUsuariosChecklist(searchInput.value);
        });
    });
    
    searchInput.addEventListener('input', function() {
        renderEventoActividadUsuariosChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconEventoActividadUsuarios');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconEventoActividadUsuarios');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'radio' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Renderizar checklist de comunidades (selección múltiple)
function renderComunidadActividadUsuariosChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterComunidadActividadUsuarios');
    if (!checklistContainer) return;
    
    // Determinar qué comunidades mostrar
    let comunidadesDisponibles = allComunidades;
    if (selectedEventoActividadUsuarios && comunidadesDelEventoActividadUsuarios.length > 0) {
        // Si hay un evento seleccionado, mostrar solo las comunidades relacionadas
        comunidadesDisponibles = allComunidades.filter(c => 
            comunidadesDelEventoActividadUsuarios.includes(c.id)
        );
    }
    
    const filtered = comunidadesDisponibles.filter(comunidad => {
        if (selectedComunidadesActividadUsuarios.includes(comunidad.id)) {
            return false;
        }
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase().trim();
        return comunidad.nombre && comunidad.nombre.toLowerCase().includes(query);
    });
    
    checklistContainer.innerHTML = '';
    comunidadActividadUsuariosCheckboxes = [];
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron comunidades</p>';
        return;
    }
    
    filtered.forEach(comunidad => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = comunidad.id;
        checkbox.checked = false;
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedComunidadesActividadUsuarios.includes(comunidad.id)) {
                    selectedComunidadesActividadUsuarios.push(comunidad.id);
                    updateSelectedComunidadesActividadUsuariosTags();
                    renderComunidadActividadUsuariosChecklist(filterQuery);
                }
            }
        });
        
        comunidadActividadUsuariosCheckboxes.push(checkbox);
        
        const span = document.createElement('span');
        span.textContent = comunidad.nombre || 'Sin nombre';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

// Actualizar tags de comunidades seleccionadas
function updateSelectedComunidadesActividadUsuariosTags() {
    const tagsContainer = document.getElementById('selectedComunidadesActividadUsuariosTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedComunidadesActividadUsuarios.forEach(comunidadId => {
        const comunidad = allComunidades.find(c => c.id === comunidadId);
        if (comunidad) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.textContent = comunidad.nombre || 'Sin nombre';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedComunidadesActividadUsuarios = selectedComunidadesActividadUsuarios.filter(id => id !== comunidadId);
                updateSelectedComunidadesActividadUsuariosTags();
                const searchInput = document.getElementById('searchComunidadActividadUsuarios');
                renderComunidadActividadUsuariosChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

// Configurar búsqueda de comunidades (selección múltiple)
function setupComunidadSearchActividadUsuarios() {
    const searchInput = document.getElementById('searchComunidadActividadUsuarios');
    const checklistContainer = document.getElementById('filterComunidadActividadUsuarios');
    const container = document.getElementById('comunidadActividadUsuariosContainer');
    const tagsContainer = document.getElementById('selectedComunidadesActividadUsuariosTags');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedComunidadesActividadUsuariosTags();
    renderComunidadActividadUsuariosChecklist();
    
    searchInput.addEventListener('input', function() {
        renderComunidadActividadUsuariosChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconComunidadActividadUsuarios');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconComunidadActividadUsuarios');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Cargar comunidades relacionadas con un evento específico para reporte de actividad de usuarios
async function loadComunidadesDelEventoActividadUsuarios(eventoId) {
    try {
        const response = await fetch(`/api/evento/${eventoId}/`);
        if (response.ok) {
            const data = await response.json();
            const evento = data.evento || data;
            
            // Obtener comunidades del evento (directa y M2M)
            comunidadesDelEventoActividadUsuarios = [];
            
            // El endpoint retorna 'comunidades' que es un array de objetos con 'comunidad_id'
            if (evento.comunidades && Array.isArray(evento.comunidades)) {
                evento.comunidades.forEach(comunidadData => {
                    if (comunidadData.comunidad_id && !comunidadesDelEventoActividadUsuarios.includes(comunidadData.comunidad_id)) {
                        comunidadesDelEventoActividadUsuarios.push(comunidadData.comunidad_id);
                    }
                });
            }
            
            // También verificar comunidad directa (por si no está en el array de comunidades)
            if (evento.comunidad_id && !comunidadesDelEventoActividadUsuarios.includes(evento.comunidad_id)) {
                comunidadesDelEventoActividadUsuarios.push(evento.comunidad_id);
            }
            
            // Limpiar comunidades seleccionadas que no pertenecen al nuevo evento
            selectedComunidadesActividadUsuarios = selectedComunidadesActividadUsuarios.filter(comunidadId => 
                comunidadesDelEventoActividadUsuarios.includes(comunidadId)
            );
            updateSelectedComunidadesActividadUsuariosTags();
            
            // Actualizar lista de comunidades
            const searchInput = document.getElementById('searchComunidadActividadUsuarios');
            renderComunidadActividadUsuariosChecklist(searchInput ? searchInput.value : '');
        }
    } catch (error) {
        console.error('Error cargando comunidades del evento:', error);
        comunidadesDelEventoActividadUsuarios = [];
    }
}

// Cargar usuarios para reporte de actividad de usuarios
async function loadUsuariosActividadUsuarios() {
    try {
        const response = await fetch('/api/usuarios/');
        if (response.ok) {
            const data = await response.json();
            // La API devuelve {success: true, usuarios: [...]}
            if (data.success && data.usuarios) {
                allUsuariosActividadUsuarios = data.usuarios;
                renderUsuariosActividadUsuariosChecklist();
            } else {
                allUsuariosActividadUsuarios = [];
            }
        }
    } catch (error) {
        console.error('Error cargando usuarios para actividad de usuarios:', error);
        allUsuariosActividadUsuarios = [];
    }
}

// Renderizar checklist de usuarios (selección múltiple)
function renderUsuariosActividadUsuariosChecklist(filterQuery = '') {
    const checklistContainer = document.getElementById('filterUsuariosActividadUsuarios');
    if (!checklistContainer) return;
    
    const filtered = allUsuariosActividadUsuarios.filter(usuario => {
        if (selectedUsuariosActividadUsuarios.includes(usuario.id)) {
            return false;
        }
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase().trim();
        const nombre = (usuario.nombre || usuario.username || '').toLowerCase();
        return nombre.includes(query);
    });
    
    checklistContainer.innerHTML = '';
    usuariosActividadUsuariosCheckboxes = [];
    
    if (filtered.length === 0) {
        checklistContainer.innerHTML = '<p style="color: var(--text-70); padding: 12px;">No se encontraron usuarios</p>';
        return;
    }
    
    filtered.forEach(usuario => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = usuario.id;
        checkbox.checked = false;
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedUsuariosActividadUsuarios.includes(usuario.id)) {
                    selectedUsuariosActividadUsuarios.push(usuario.id);
                    updateSelectedUsuariosActividadUsuariosTags();
                    renderUsuariosActividadUsuariosChecklist(filterQuery);
                }
            }
        });
        
        usuariosActividadUsuariosCheckboxes.push(checkbox);
        
        const span = document.createElement('span');
        const displayName = usuario.nombre || usuario.username || 'Sin nombre';
        // Si tiene colaborador, agregar indicador
        if (usuario.tiene_colaborador && usuario.colaborador_nombre) {
            span.textContent = `${displayName} (${usuario.colaborador_nombre})`;
        } else {
            span.textContent = displayName;
        }
        
        label.appendChild(checkbox);
        label.appendChild(span);
        checklistContainer.appendChild(label);
    });
}

// Actualizar tags de usuarios seleccionados
function updateSelectedUsuariosActividadUsuariosTags() {
    const tagsContainer = document.getElementById('selectedUsuariosActividadUsuariosTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedUsuariosActividadUsuarios.forEach(usuarioId => {
        const usuario = allUsuariosActividadUsuarios.find(u => u.id === usuarioId);
        if (usuario) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            const displayName = usuario.nombre || usuario.username || 'Sin nombre';
            // Si tiene colaborador, agregar indicador
            if (usuario.tiene_colaborador && usuario.colaborador_nombre) {
                tag.textContent = `${displayName} (${usuario.colaborador_nombre})`;
            } else {
                tag.textContent = displayName;
            }
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function() {
                selectedUsuariosActividadUsuarios = selectedUsuariosActividadUsuarios.filter(id => id !== usuarioId);
                updateSelectedUsuariosActividadUsuariosTags();
                const searchInput = document.getElementById('searchUsuariosActividadUsuarios');
                renderUsuariosActividadUsuariosChecklist(searchInput ? searchInput.value : '');
            });
            
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        }
    });
}

// Configurar búsqueda de usuarios (selección múltiple)
function setupUsuariosSearchActividadUsuarios() {
    const searchInput = document.getElementById('searchUsuariosActividadUsuarios');
    const checklistContainer = document.getElementById('filterUsuariosActividadUsuarios');
    const container = document.getElementById('usuariosActividadUsuariosContainer');
    const tagsContainer = document.getElementById('selectedUsuariosActividadUsuariosTags');
    
    if (!searchInput || !checklistContainer || !container || !tagsContainer) return;
    
    updateSelectedUsuariosActividadUsuariosTags();
    renderUsuariosActividadUsuariosChecklist();
    
    searchInput.addEventListener('input', function() {
        renderUsuariosActividadUsuariosChecklist(this.value);
    });
    
    searchInput.addEventListener('focus', function() {
        container.style.display = 'block';
        const icon = document.getElementById('toggleIconUsuariosActividadUsuarios');
        if (icon) icon.textContent = '▼';
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(function() {
            const activeElement = document.activeElement;
            const isInContainer = container.contains(activeElement);
            const isInTags = tagsContainer.contains(activeElement);
            
            if (!isInContainer && !isInTags && activeElement !== searchInput) {
                container.style.display = 'none';
                const icon = document.getElementById('toggleIconUsuariosActividadUsuarios');
                if (icon) icon.textContent = '▶';
            }
        }, 200);
    });
    
    checklistContainer.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            setTimeout(function() {
                searchInput.focus();
            }, 10);
        }
    });
}

// Configurar selector de período para actividad de usuarios
function setupPeriodSelectorActividadUsuarios() {
    const periodSelect = document.getElementById('periodoActividadUsuarios');
    const fechaInicioContainer = document.getElementById('fechaInicioActividadUsuarios');
    const fechaFinContainer = document.getElementById('fechaFinActividadUsuarios');
    
    if (!periodSelect || !fechaInicioContainer || !fechaFinContainer) return;
    
    periodSelect.addEventListener('change', function() {
        if (this.value === 'rango') {
            fechaInicioContainer.style.display = 'block';
            fechaFinContainer.style.display = 'block';
        } else {
            fechaInicioContainer.style.display = 'none';
            fechaFinContainer.style.display = 'none';
        }
    });
}

// Configurar switches
function setupSwitches(reportType) {
    if (reportType === 'actividades-por-region-comunidad') {
        const switchEl = document.getElementById('switchAgruparActividades');
        const labelEl = document.getElementById('switchLabelActividades');
        
        switchEl.addEventListener('change', function() {
            labelEl.textContent = this.checked ? 'Comunidad' : 'Región';
        });
    } else if (reportType === 'beneficiarios-por-region-comunidad') {
        const switchEl = document.getElementById('switchAgruparBeneficiarios');
        const labelEl = document.getElementById('switchLabelBeneficiarios');
        
        switchEl.addEventListener('change', function() {
            labelEl.textContent = this.checked ? 'Comunidad' : 'Región';
        });
    }
}

// Configurar selectores de período
function setupPeriodSelectors(reportType) {
    const periodId = reportType === 'actividades-por-region-comunidad' 
        ? 'filterPeriodoActividades' 
        : 'filterPeriodoBeneficiarios';
    const dateRangeId = reportType === 'actividades-por-region-comunidad'
        ? 'dateRangeActividades'
        : 'dateRangeBeneficiarios';
    
    const periodSelect = document.getElementById(periodId);
    const dateRangeContainer = document.getElementById(dateRangeId);
    
    periodSelect.addEventListener('change', function() {
        if (this.value === 'rango') {
            dateRangeContainer.style.display = 'grid';
        } else {
            dateRangeContainer.style.display = 'none';
        }
    });
}

// Configurar buscadores de comunidades
let selectedComunidades = {
    actividades: [],
    beneficiarios: []
};

let searchEventListeners = {};

function setupComunidadSearch(reportType) {
    const searchId = reportType === 'actividades-por-region-comunidad'
        ? 'searchComunidadActividades'
        : 'searchComunidadBeneficiarios';
    const resultsId = reportType === 'actividades-por-region-comunidad'
        ? 'searchResultsActividades'
        : 'searchResultsBeneficiarios';
    const key = reportType === 'actividades-por-region-comunidad' ? 'actividades' : 'beneficiarios';
    
    const searchInput = document.getElementById(searchId);
    const resultsContainer = document.getElementById(resultsId);
    
    // Remover listener anterior si existe
    if (searchEventListeners[key]) {
        searchInput.removeEventListener('input', searchEventListeners[key].input);
        document.removeEventListener('click', searchEventListeners[key].click);
    }
    
    // Crear nuevo listener para input
    const inputHandler = function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        const filtered = allComunidades.filter(com => 
            com.nombre.toLowerCase().includes(query)
        ).slice(0, 10);
        
        if (filtered.length > 0) {
            resultsContainer.innerHTML = '';
            filtered.forEach(comunidad => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.textContent = comunidad.nombre;
                item.dataset.comunidadId = comunidad.id;
                
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (!selectedComunidades[key].includes(comunidad.id)) {
                        selectedComunidades[key].push(comunidad.id);
                        searchInput.value = '';
                        resultsContainer.style.display = 'none';
                        updateSelectedComunidades(key, resultsId);
                    }
                });
                
                resultsContainer.appendChild(item);
            });
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.style.display = 'none';
        }
    };
    
    // Crear listener para click fuera
    const clickHandler = function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    };
    
    searchInput.addEventListener('input', inputHandler);
    document.addEventListener('click', clickHandler);
    
    // Guardar listeners para poder removerlos después
    searchEventListeners[key] = {
        input: inputHandler,
        click: clickHandler
    };
}

// Actualizar lista de comunidades seleccionadas
function updateSelectedComunidades(key, resultsId) {
    const container = document.getElementById(resultsId);
    const selectedContainer = document.createElement('div');
    selectedContainer.className = 'selected-comunidades';
    selectedContainer.style.marginTop = '8px';
    
    selectedComunidades[key].forEach(comId => {
        const comunidad = allComunidades.find(c => c.id === comId);
        if (comunidad) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.style.cssText = 'display: inline-block; padding: 4px 8px; background: var(--primary-color); color: white; border-radius: 4px; margin-right: 8px; margin-bottom: 8px; font-size: 0.75rem;';
            tag.innerHTML = comunidad.nombre + ' <span style="cursor: pointer; margin-left: 4px;">×</span>';
            tag.querySelector('span').addEventListener('click', function(e) {
                e.stopPropagation();
                selectedComunidades[key] = selectedComunidades[key].filter(id => id !== comId);
                updateSelectedComunidades(key, resultsId);
            });
            selectedContainer.appendChild(tag);
        }
    });
    
    const existing = container.parentElement.querySelector('.selected-comunidades');
    if (existing) existing.remove();
    container.parentElement.appendChild(selectedContainer);
}

// Aplicar filtros del formulario específico
function applyFiltersForm(reportType) {
    let filters = {};
    
    if (reportType === 'actividades-por-region-comunidad') {
        // Obtener estados seleccionados
        let estadosSeleccionados = ['planificado', 'en_progreso', 'completado', 'cancelado']; // Default
        try {
            const estadosContainer = document.getElementById('filterEstadoActividades');
            if (estadosContainer && estadosContainer.querySelectorAll) {
                const checkboxes = estadosContainer.querySelectorAll('input[type="checkbox"]:checked');
                if (checkboxes) {
                    if (checkboxes.length > 0) {
                        estadosSeleccionados = [];
                        for (let i = 0; i < checkboxes.length; i++) {
                            const cb = checkboxes[i];
                            if (cb && cb.value) {
                                estadosSeleccionados.push(cb.value);
                            }
                        }
                        // Si no se seleccionó ninguno, usar todos por defecto
                        if (estadosSeleccionados.length === 0) {
                            estadosSeleccionados = ['planificado', 'en_progreso', 'completado', 'cancelado'];
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error obteniendo estados:', error);
            // Usar valores por defecto
            estadosSeleccionados = ['planificado', 'en_progreso', 'completado', 'cancelado'];
        }
        
        // Obtener tipos de actividad seleccionados desde checkboxes
        let tiposActividadSeleccionados = [];
        try {
            const tiposActividadContainer = document.getElementById('filterTipoActividadActividades');
            if (tiposActividadContainer && tiposActividadContainer.querySelectorAll) {
                const checkboxes = tiposActividadContainer.querySelectorAll('input[type="checkbox"]:checked');
                if (checkboxes && checkboxes.length > 0) {
                    for (let i = 0; i < checkboxes.length; i++) {
                        const cb = checkboxes[i];
                        if (cb && cb.value && cb.value.trim() !== '') {
                            tiposActividadSeleccionados.push(cb.value.trim());
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error obteniendo tipos de actividad:', error);
            tiposActividadSeleccionados = [];
        }
        
        // Obtener período y fechas
        let periodo = 'todo_el_tiempo';
        let fechaInicio = '';
        let fechaFin = '';
        try {
            const periodoSelect = document.getElementById('filterPeriodoActividades');
            if (periodoSelect) {
                periodo = periodoSelect.value || 'todo_el_tiempo';
            }
        } catch (error) {
            console.error('Error obteniendo período:', error);
        }
        
        if (periodo === 'todo_el_tiempo') {
            // No aplicar filtros de fecha - mostrar todas las actividades
            fechaInicio = '';
            fechaFin = '';
        } else if (periodo === 'rango') {
            try {
                const fechaInicioInput = document.getElementById('filterFechaInicioActividades');
                const fechaFinInput = document.getElementById('filterFechaFinActividades');
                fechaInicio = fechaInicioInput ? (fechaInicioInput.value || '') : '';
                fechaFin = fechaFinInput ? (fechaFinInput.value || '') : '';
            } catch (error) {
                console.error('Error obteniendo fechas de rango:', error);
            }
        } else if (periodo === 'ultimo_mes') {
            try {
                const fecha = new Date();
                fecha.setMonth(fecha.getMonth() - 1);
                fechaInicio = fecha.toISOString().split('T')[0];
                fechaFin = new Date().toISOString().split('T')[0];
            } catch (error) {
                console.error('Error calculando último mes:', error);
            }
        } else if (periodo === 'ultima_semana') {
            try {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - 7);
                fechaInicio = fecha.toISOString().split('T')[0];
                fechaFin = new Date().toISOString().split('T')[0];
            } catch (error) {
                console.error('Error calculando última semana:', error);
            }
        }
        
        // Obtener switch de agrupar por
        let agruparPor = 'region';
        try {
            const switchAgrupar = document.getElementById('switchAgruparActividades');
            if (switchAgrupar) {
                agruparPor = switchAgrupar.checked ? 'comunidad' : 'region';
            }
        } catch (error) {
            console.error('Error obteniendo switch agrupar:', error);
        }
        
        // Obtener comunidades seleccionadas
        let comunidadesSeleccionadas = [];
        try {
            if (selectedComunidades && selectedComunidades.actividades) {
                comunidadesSeleccionadas = Array.isArray(selectedComunidades.actividades) 
                    ? selectedComunidades.actividades 
                    : [];
            }
        } catch (error) {
            console.error('Error obteniendo comunidades:', error);
        }
        
        filters = {
            agrupar_por: agruparPor,
            periodo: periodo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            comunidades: comunidadesSeleccionadas,
            estado: estadosSeleccionados,
            tipo_actividad: tiposActividadSeleccionados // Si está vacío, no se enviará el parámetro (mostrar todos los tipos)
        };
    } else if (reportType === 'beneficiarios-por-region-comunidad') {
        // Obtener tipos de actividad seleccionados desde checkboxes
        let tiposActividadSeleccionados = [];
        try {
            const tiposActividadContainer = document.getElementById('filterTipoActividadBeneficiarios');
            if (tiposActividadContainer && tiposActividadContainer.querySelectorAll) {
                const checkboxes = tiposActividadContainer.querySelectorAll('input[type="checkbox"]:checked');
                if (checkboxes && checkboxes.length > 0) {
                    for (let i = 0; i < checkboxes.length; i++) {
                        const cb = checkboxes[i];
                        if (cb && cb.value && cb.value.trim() !== '') {
                            tiposActividadSeleccionados.push(cb.value.trim());
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error obteniendo tipos de actividad:', error);
            tiposActividadSeleccionados = [];
        }
        
        // Obtener tipos de beneficiario seleccionados
        const tiposBeneficiarioSeleccionados = Array.from(
            document.querySelectorAll('#filterTipoBeneficiarioBeneficiarios input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        filters = {
            agrupar_por: 'comunidad', // Siempre agrupar por comunidad
            comunidades: selectedComunidades.beneficiarios,
            evento: Array.from(document.querySelectorAll('#filterEventosBeneficiarios input[type="checkbox"]:checked')).map(cb => cb.value),
            tipo_actividad: tiposActividadSeleccionados, // Si está vacío, no se enviará el parámetro (mostrar todos los tipos)
            tipo_beneficiario: tiposBeneficiarioSeleccionados.length > 0 ? tiposBeneficiarioSeleccionados : ['individual', 'familia', 'institución', 'otro']
        };
    } else if (reportType === 'actividad-de-personal') {
        // Obtener estados seleccionados
        const estadosSeleccionados = Array.from(
            document.querySelectorAll('#filterEstadoPersonal input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        // Obtener tipos de actividad seleccionados
        const tiposActividadSeleccionados = Array.from(
            document.querySelectorAll('#filterTipoActividadPersonal input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        // Obtener colaboradores seleccionados (usar el array selectedColaboradoresPersonal que incluye todos los seleccionados)
        const colaboradoresSeleccionados = selectedColaboradoresPersonal.length > 0 ? selectedColaboradoresPersonal : Array.from(document.querySelectorAll('#filterColaboradoresPersonal input[type="checkbox"]:checked')).map(cb => cb.value);
        
        // Obtener eventos seleccionados (usar el array selectedEventosPersonal que incluye todos los seleccionados)
        const eventosSeleccionados = selectedEventosPersonal.length > 0 ? selectedEventosPersonal : Array.from(document.querySelectorAll('#filterEventosPersonal input[type="checkbox"]:checked')).map(cb => cb.value);
        
        filters = {
            periodo: document.getElementById('filterPeriodoPersonal').value,
            fecha_inicio: document.getElementById('filterFechaInicioPersonal').value,
            fecha_fin: document.getElementById('filterFechaFinPersonal').value,
            comunidades: selectedComunidadesPersonal,
            eventos: eventosSeleccionados,
            estado: estadosSeleccionados.length > 0 ? estadosSeleccionados : ['planificado', 'en_progreso', 'completado', 'cancelado'],
            tipo_actividad: tiposActividadSeleccionados.length > 0 ? tiposActividadSeleccionados : ['Capacitación', 'Entrega', 'Proyecto de Ayuda'],
            colaboradores: colaboradoresSeleccionados
        };
    } else if (reportType === 'avances-eventos-generales') {
        // Obtener período
        const periodo = document.getElementById('filterPeriodoAvances').value;
        let fechaInicio = '';
        let fechaFin = '';
        
        if (periodo === 'rango') {
            fechaInicio = document.getElementById('filterFechaInicioAvances').value;
            fechaFin = document.getElementById('filterFechaFinAvances').value;
        } else if (periodo === 'ultimo_mes') {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - 1);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        } else if (periodo === 'ultima_semana') {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - 7);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        }
        
        // Obtener tipos de actividad seleccionados
        const tiposActividadSeleccionados = Array.from(
            document.querySelectorAll('#filterTipoActividadAvances input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        // Obtener mostrar evidencias
        const mostrarEvidencias = document.getElementById('filterMostrarEvidenciasAvances').checked;
        
        filters = {
            periodo: periodo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            comunidades: selectedComunidadesAvances,
            eventos: selectedEventosAvances,
            tipo_actividad: tiposActividadSeleccionados.length > 0 ? tiposActividadSeleccionados : ['Capacitación', 'Entrega', 'Proyecto de Ayuda'],
            colaboradores: selectedColaboradoresAvances,
            mostrar_evidencias: mostrarEvidencias
        };
    } else if (reportType === 'reporte-evento-individual') {
        filters = {
            evento: selectedEventoIndividual
        };
    } else if (reportType === 'comunidades') {
        // Validar que al menos una comunidad esté seleccionada
        if (!selectedComunidadesComunidades || selectedComunidadesComunidades.length === 0) {
            showError('Por favor, seleccione al menos una comunidad');
            return;
        }
        
        // Obtener período
        const periodo = document.getElementById('periodoComunidades').value;
        let fechaInicio = '';
        let fechaFin = '';
        
        if (periodo === 'rango') {
            fechaInicio = document.getElementById('filterFechaInicioComunidades').value;
            fechaFin = document.getElementById('filterFechaFinComunidades').value;
        } else if (periodo === 'ultimo_mes') {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - 1);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        } else if (periodo === 'ultima_semana') {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - 7);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        }
        
        // Obtener tipos de actividad seleccionados
        const tiposActividadSeleccionados = Array.from(
            document.querySelectorAll('#filterTipoActividadComunidades input[type="checkbox"]:checked')
        ).map(cb => cb.value).filter(v => v !== 'todos');
        
        filters = {
            periodo: periodo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            comunidades: selectedComunidadesComunidades,
            evento: selectedEventoComunidades, // Puede ser null si no se selecciona
            tipo_actividad: tiposActividadSeleccionados.length > 0 ? tiposActividadSeleccionados : ['Capacitación', 'Entrega', 'Proyecto de Ayuda']
        };
    } else if (reportType === 'actividad-usuarios') {
        // Obtener período
        const periodo = document.getElementById('periodoActividadUsuarios').value;
        let fechaInicio = '';
        let fechaFin = '';
        
        if (periodo === 'rango') {
            fechaInicio = document.getElementById('filterFechaInicioActividadUsuarios').value;
            fechaFin = document.getElementById('filterFechaFinActividadUsuarios').value;
        } else if (periodo === 'ultimo_mes') {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - 1);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        } else if (periodo === 'ultima_semana') {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - 7);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        }
        
        // Obtener tipos de actividad seleccionados
        const tiposActividadSeleccionados = Array.from(
            document.querySelectorAll('#filterTipoActividadActividadUsuarios input[type="checkbox"]:checked')
        ).map(cb => cb.value).filter(v => v !== 'todos');
        
        filters = {
            periodo: periodo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            comunidades: selectedComunidadesActividadUsuarios.length > 0 ? selectedComunidadesActividadUsuarios : null,
            evento: selectedEventoActividadUsuarios, // Puede ser null
            tipo_actividad: tiposActividadSeleccionados.length > 0 ? tiposActividadSeleccionados : ['Capacitación', 'Entrega', 'Proyecto de Ayuda'],
            usuarios: selectedUsuariosActividadUsuarios.length > 0 ? selectedUsuariosActividadUsuarios : null
        };
    } else if (reportType === 'reporte-general') {
        // Obtener período
        const periodo = document.getElementById('periodoReporteGeneral').value;
        let fechaInicio = '';
        let fechaFin = '';
        
        if (periodo === 'rango') {
            fechaInicio = document.getElementById('filterFechaInicioReporteGeneral').value;
            fechaFin = document.getElementById('filterFechaFinReporteGeneral').value;
        } else if (periodo === 'ultimo_mes') {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - 1);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        } else if (periodo === 'ultima_semana') {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - 7);
            fechaInicio = fecha.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];
        }
        
        // Obtener apartados seleccionados
        const apartadosSeleccionados = Array.from(
            document.querySelectorAll('#filterApartadosReporteGeneral input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        filters = {
            periodo: periodo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            apartados: apartadosSeleccionados
        };
    }
    
    currentFilters = filters;
    generateReport(reportType, filters);
}

// Resetear filtros del formulario específico
function resetFiltersForm(reportType) {
    if (reportType === 'actividades-por-region-comunidad') {
        document.getElementById('switchAgruparActividades').checked = false;
        document.getElementById('switchLabelActividades').textContent = 'Región';
        document.getElementById('filterPeriodoActividades').value = 'todo_el_tiempo';
        document.getElementById('dateRangeActividades').style.display = 'none';
        document.getElementById('filterFechaInicioActividades').value = '';
        document.getElementById('filterFechaFinActividades').value = '';
        document.getElementById('searchComunidadActividades').value = '';
        
        // Resetear checkboxes de estado (todos marcados)
        document.querySelectorAll('#filterEstadoActividades input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Resetear checkboxes de tipo de actividad (ninguno marcado por defecto)
        document.querySelectorAll('#filterTipoActividadActividades input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        selectedComunidades.actividades = [];
        const selectedContainer = document.querySelector('#searchResultsActividades').parentElement.querySelector('.selected-comunidades');
        if (selectedContainer) selectedContainer.remove();
    } else if (reportType === 'beneficiarios-por-region-comunidad') {
        document.getElementById('searchComunidadBeneficiarios').value = '';
        // Limpiar selecciones de eventos
        selectedEventosBeneficiarios = [];
        updateSelectedEventosBeneficiariosTags();
        document.getElementById('searchEventoBeneficiarios').value = '';
        renderEventosBeneficiariosChecklist();
        
        // Resetear checkboxes de tipo de actividad (ninguno marcado por defecto)
        const tipoActividadCheckboxes = document.querySelectorAll('#filterTipoActividadBeneficiarios input[type="checkbox"]');
        if (tipoActividadCheckboxes) {
            for (let i = 0; i < tipoActividadCheckboxes.length; i++) {
                tipoActividadCheckboxes[i].checked = false;
            }
        }
        
        // Resetear checkboxes de tipo de beneficiario (todos marcados)
        document.querySelectorAll('#filterTipoBeneficiarioBeneficiarios input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        selectedComunidades.beneficiarios = [];
        const selectedContainer = document.querySelector('#searchResultsBeneficiarios').parentElement.querySelector('.selected-comunidades');
        if (selectedContainer) selectedContainer.remove();
    } else if (reportType === 'actividad-de-personal') {
        document.getElementById('filterPeriodoPersonal').value = 'todo';
        document.getElementById('dateRangePersonal').style.display = 'none';
        document.getElementById('filterFechaInicioPersonal').value = '';
        document.getElementById('filterFechaFinPersonal').value = '';
        document.getElementById('searchComunidadPersonal').value = '';
        document.getElementById('searchEventoPersonal').value = '';
        document.getElementById('searchColaboradorPersonal').value = '';
        
        // Resetear checkboxes de estado (todos marcados)
        document.querySelectorAll('#filterEstadoPersonal input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Resetear checkboxes de tipo de actividad (todos marcados)
        document.querySelectorAll('#filterTipoActividadPersonal input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Resetear selector de período
        document.getElementById('filterPeriodoPersonal').value = 'todo';
        document.getElementById('dateRangePersonal').style.display = 'none';
        document.getElementById('filterFechaInicioPersonal').value = '';
        document.getElementById('filterFechaFinPersonal').value = '';
        
        // Limpiar buscadores
        document.getElementById('searchComunidadPersonal').value = '';
        document.getElementById('searchEventoPersonal').value = '';
        document.getElementById('searchColaboradorPersonal').value = '';
        
        // Resetear checkboxes de estado (todos marcados)
        document.querySelectorAll('#filterEstadoPersonal input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Resetear checkboxes de tipo de actividad (todos marcados)
        document.querySelectorAll('#filterTipoActividadPersonal input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Limpiar arrays de selección
        selectedComunidadesPersonal = [];
        selectedEventosPersonal = []; // Mantener para compatibilidad, pero los eventos se obtienen de los checkboxes
        selectedColaboradoresPersonal = []; // Mantener para compatibilidad, pero los colaboradores se obtienen de los checkboxes
        
        // Limpiar contenedores de tags seleccionados
        const containerComunidades = document.querySelector('#searchComunidadPersonal')?.parentElement;
        if (containerComunidades) {
            const selectedComunidadesContainer = containerComunidades.querySelector('.selected-comunidades');
            if (selectedComunidadesContainer) selectedComunidadesContainer.remove();
        }
        
        // Limpiar selecciones de eventos
        selectedEventosPersonal = [];
        updateSelectedEventosPersonalTags();
        document.getElementById('searchEventoPersonal').value = '';
        renderEventosChecklist();
        
        // Limpiar selecciones de colaboradores
        selectedColaboradoresPersonal = [];
        updateSelectedColaboradoresPersonalTags();
        document.getElementById('searchColaboradorPersonal').value = '';
        renderColaboradoresChecklist();
    } else if (reportType === 'avances-eventos-generales') {
        document.getElementById('filterPeriodoAvances').value = 'todo';
        document.getElementById('dateRangeAvances').style.display = 'none';
        document.getElementById('filterFechaInicioAvances').value = '';
        document.getElementById('filterFechaFinAvances').value = '';
        document.getElementById('searchComunidadAvances').value = '';
        document.getElementById('searchEventoAvances').value = '';
        document.getElementById('searchColaboradorAvances').value = '';
        document.getElementById('filterMostrarEvidenciasAvances').checked = true;
        
        // Resetear checkboxes de tipo de actividad (todos marcados)
        document.querySelectorAll('#filterTipoActividadAvances input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Limpiar arrays de selección
        selectedComunidadesAvances = [];
        selectedEventosAvances = [];
        selectedColaboradoresAvances = [];
        
        // Limpiar contenedores de tags
        updateSelectedComunidadesAvances();
        updateSelectedEventosAvancesTags();
        updateSelectedColaboradoresAvancesTags();
        
        // Re-renderizar checklists
        renderEventosAvancesChecklist();
        renderColaboradoresAvancesChecklist();
    } else if (reportType === 'reporte-evento-individual') {
        // Resetear checkboxes de tipo de actividad (todos marcados)
        document.querySelectorAll('#filterTipoActividadIndividual input[type="checkbox"]').forEach(cb => {
            if (cb.value === 'todos') {
                cb.checked = true;
            } else {
                cb.checked = false;
            }
        });
        
        document.getElementById('searchEventoIndividual').value = '';
        selectedEventoIndividual = null;
        updateSelectedEventoIndividualTag();
        renderEventoIndividualChecklist();
    } else if (reportType === 'comunidades') {
        // Resetear selector de período
        document.getElementById('periodoComunidades').value = 'todo';
        document.getElementById('fechaInicioComunidades').style.display = 'none';
        document.getElementById('fechaFinComunidades').style.display = 'none';
        document.getElementById('filterFechaInicioComunidades').value = '';
        document.getElementById('filterFechaFinComunidades').value = '';
        
        // Resetear checkboxes de tipo de actividad (todos marcados)
        document.querySelectorAll('#filterTipoActividadComunidades input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Resetear evento seleccionado
        document.getElementById('searchEventoComunidades').value = '';
        selectedEventoComunidades = null;
        updateSelectedEventoComunidadesTag();
        renderEventoComunidadesChecklist();
        
        // Resetear comunidades seleccionadas
        document.getElementById('searchComunidadComunidades').value = '';
        selectedComunidadesComunidades = [];
        updateSelectedComunidadesComunidadesTags();
        renderComunidadComunidadesChecklist();
    } else if (reportType === 'actividad-usuarios') {
        // Resetear selector de período
        document.getElementById('periodoActividadUsuarios').value = 'todo';
        document.getElementById('fechaInicioActividadUsuarios').style.display = 'none';
        document.getElementById('fechaFinActividadUsuarios').style.display = 'none';
        document.getElementById('filterFechaInicioActividadUsuarios').value = '';
        document.getElementById('filterFechaFinActividadUsuarios').value = '';
        
        // Resetear checkboxes de tipo de actividad (todos marcados)
        document.querySelectorAll('#filterTipoActividadActividadUsuarios input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Resetear evento seleccionado
        document.getElementById('searchEventoActividadUsuarios').value = '';
        selectedEventoActividadUsuarios = null;
        updateSelectedEventoActividadUsuariosTag();
        renderEventoActividadUsuariosChecklist();
        
        // Resetear comunidades seleccionadas
        document.getElementById('searchComunidadActividadUsuarios').value = '';
        selectedComunidadesActividadUsuarios = [];
        updateSelectedComunidadesActividadUsuariosTags();
        renderComunidadActividadUsuariosChecklist();
        
        // Resetear usuarios seleccionados
        document.getElementById('searchUsuariosActividadUsuarios').value = '';
        selectedUsuariosActividadUsuarios = [];
        updateSelectedUsuariosActividadUsuariosTags();
        renderUsuariosActividadUsuariosChecklist();
    } else if (reportType === 'reporte-general') {
        // Resetear selector de período
        document.getElementById('periodoReporteGeneral').value = 'todo';
        document.getElementById('fechaInicioReporteGeneral').style.display = 'none';
        document.getElementById('fechaFinReporteGeneral').style.display = 'none';
        document.getElementById('filterFechaInicioReporteGeneral').value = '';
        document.getElementById('filterFechaFinReporteGeneral').value = '';
        
        // Resetear checkboxes de apartados (todos marcados)
        document.querySelectorAll('#filterApartadosReporteGeneral input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
    }
    
    currentFilters = {};
}

// Configurar botón de volver
function setupBackButton() {
    document.getElementById('backFromResultsBtn').addEventListener('click', function() {
        // Resetear filtros al volver
        if (currentReportType) {
            resetFiltersForm(currentReportType);
        } else {
            resetFilters();
        }
        
        // Ocultar todos los formularios
        hideAllForms();
        
        // Limpiar completamente el contenedor de resultados
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        
        // Mostrar dashboard y sección de reportes
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('reportsSection').style.display = 'block';
        
        // Ocultar sección de resultados
        document.getElementById('resultsSection').style.display = 'none';
        
        // Limpiar reporte actual
        currentReportType = null;
        currentFilters = {};
    });
}

// Inicializar vista basada en parámetros de la URL
async function initializeFromQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const reportParam = params.get('reporte');

    if (!reportParam) {
        return;
    }

    try {
        await openReport(reportParam, { propagateError: true });
    } catch (error) {
        console.error('Error al abrir el reporte desde la URL:', error);
        return;
    }

    if (reportParam === 'reporte-evento-individual') {
        const eventParam = params.get('evento');
        if (!eventParam) {
            return;
        }

        const matchingEvent = Array.isArray(allEventosIndividual)
            ? allEventosIndividual.find(evento => String(evento.id) === String(eventParam))
            : null;

        if (!matchingEvent) {
            showError('No se encontró el evento solicitado para el reporte.');
            return;
        }

        selectedEventoIndividual = matchingEvent.id;
        updateSelectedEventoIndividualTag();

        const searchInput = document.getElementById('searchEventoIndividual');
        renderEventoIndividualChecklist(searchInput ? searchInput.value : '');

        const container = document.getElementById('eventoIndividualContainer');
        if (container) {
            container.style.display = 'block';
        }

        const toggleIcon = document.getElementById('toggleIconEventoIndividual');
        if (toggleIcon) {
            toggleIcon.textContent = '▼';
        }
    }
}

// Cargar opciones para filtros
async function loadFilterOptions() {
    try {
        // Cargar regiones
        const regionesResponse = await fetch('/api/regiones/');
        if (regionesResponse.ok) {
            const regiones = await regionesResponse.json();
            
            // Ordenar regiones por código numérico (del 1 al 17)
            regiones.sort((a, b) => {
                // Extraer número del código (ej: "R1" -> 1, "REGION1" -> 1, "1" -> 1)
                const numA = parseInt(a.codigo.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.codigo.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
            
            const selectRegion = document.getElementById('filterRegion');
            selectRegion.innerHTML = '<option value="">Todas las regiones</option>';
            regiones.forEach(region => {
                const option = document.createElement('option');
                option.value = region.id;
                option.textContent = region.nombre;
                selectRegion.appendChild(option);
            });
        }
        
        // Cargar tipos de actividad
        // Nota: Necesitarás crear esta API endpoint o usar la existente
        // Por ahora, usar valores hardcodeados
        const tiposActividad = ['Capacitación', 'Entrega', 'Proyecto de Ayuda'];
        const selectTipo = document.getElementById('filterTipoActividad');
        selectTipo.innerHTML = '<option value="">Todos los tipos</option>';
        tiposActividad.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            selectTipo.appendChild(option);
        });
        
        // Cargar comunidades cuando se seleccione una región
        document.getElementById('filterRegion').addEventListener('change', async function() {
            const regionId = this.value;
            if (regionId) {
                const comunidadesResponse = await fetch(`/api/comunidades/?region_id=${regionId}`);
                if (comunidadesResponse.ok) {
                    const comunidades = await comunidadesResponse.json();
                    const selectComunidad = document.getElementById('filterComunidad');
                    selectComunidad.innerHTML = '<option value="">Todas las comunidades</option>';
                    comunidades.forEach(comunidad => {
                        const option = document.createElement('option');
                        option.value = comunidad.id;
                        option.textContent = comunidad.nombre;
                        selectComunidad.appendChild(option);
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error cargando opciones de filtros:', error);
    }
}

// Configurar filtros
function setupFilters() {
    // Toggle de filtros
    document.getElementById('filtersToggle').addEventListener('click', function() {
        const filtersContent = document.getElementById('filtersContent');
        filtersContent.classList.toggle('collapsed');
    });
    
    // Aplicar filtros
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        currentFilters = getFilters();
        
        // Validar filtros
        if (currentFilters.fecha_inicio && currentFilters.fecha_fin) {
            if (new Date(currentFilters.fecha_inicio) > new Date(currentFilters.fecha_fin)) {
                showError('La fecha de inicio debe ser anterior a la fecha de fin');
                return;
            }
        }
        
        if (currentReportType) {
            generateReport(currentReportType, currentFilters);
        }
    });
    
    // Limpiar filtros
    document.getElementById('resetFiltersBtn').addEventListener('click', function() {
        resetFilters();
    });
}

// Obtener filtros
function getFilters() {
    return {
        fecha_inicio: document.getElementById('filterFechaInicio').value,
        fecha_fin: document.getElementById('filterFechaFin').value,
        region: Array.from(document.getElementById('filterRegion').selectedOptions).map(opt => opt.value).filter(v => v),
        comunidad: Array.from(document.getElementById('filterComunidad').selectedOptions).map(opt => opt.value).filter(v => v),
        estado: Array.from(document.querySelectorAll('#filterEstadoCheckboxes input[type="checkbox"]:checked')).map(cb => cb.value),
        tipo_actividad: Array.from(document.getElementById('filterTipoActividad').selectedOptions).map(opt => opt.value).filter(v => v),
        responsable: document.getElementById('filterResponsable').value,
        tipo_beneficiario: Array.from(document.querySelectorAll('#filterTipoBeneficiarioCheckboxes input[type="checkbox"]:checked')).map(cb => cb.value)
    };
}

// Limpiar filtros
function resetFilters() {
    document.getElementById('filterFechaInicio').value = '';
    document.getElementById('filterFechaFin').value = '';
    document.getElementById('filterRegion').selectedIndex = 0;
    document.getElementById('filterComunidad').selectedIndex = 0;
    document.querySelectorAll('#filterEstadoCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
    document.querySelectorAll('#filterTipoBeneficiarioCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
    document.getElementById('filterTipoActividad').selectedIndex = 0;
    document.getElementById('filterResponsable').selectedIndex = 0;
    currentFilters = {};
}

// Generar reporte
async function generateReport(reportType, filters) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Generando reporte...</p></div>';
    
    try {
        // Construir URL con parámetros
        const params = new URLSearchParams();
        
        // Manejar fechas según período
        if (filters.periodo) {
            const now = new Date();
            let fechaInicio, fechaFin;
            
            if (filters.periodo === 'todo') {
                // No agregar filtros de fecha para "todo el tiempo"
                fechaInicio = null;
                fechaFin = null;
            } else if (filters.periodo === 'ultimo_mes') {
                fechaFin = now.toISOString().split('T')[0];
                const lastMonth = new Date(now);
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                fechaInicio = lastMonth.toISOString().split('T')[0];
            } else if (filters.periodo === 'ultima_semana') {
                fechaFin = now.toISOString().split('T')[0];
                const lastWeek = new Date(now);
                lastWeek.setDate(lastWeek.getDate() - 7);
                fechaInicio = lastWeek.toISOString().split('T')[0];
            } else if (filters.periodo === 'rango') {
                fechaInicio = filters.fecha_inicio;
                fechaFin = filters.fecha_fin;
            }
            
            if (fechaInicio) params.append('fecha_inicio', fechaInicio);
            if (fechaFin) params.append('fecha_fin', fechaFin);
        } else {
            // Filtros genéricos
            if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
            if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
        }
        
        // Parámetros específicos para nuevos reportes
        if (reportType === 'actividades-por-region-comunidad' || reportType === 'beneficiarios-por-region-comunidad') {
            if (filters.agrupar_por) params.append('agrupar_por', filters.agrupar_por);
            if (filters.comunidades && filters.comunidades.length > 0) {
                params.append('comunidades', filters.comunidades.join(','));
            }
            
            // Filtros específicos para actividades
            if (reportType === 'actividades-por-region-comunidad') {
                // Manejar período de fechas
                if (filters.periodo === 'todo_el_tiempo') {
                    // No enviar parámetros de fecha - mostrar todas las actividades
                    // (incluso futuras)
                } else if (filters.periodo === 'rango') {
                    if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
                    if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
                } else if (filters.periodo === 'ultimo_mes' || filters.periodo === 'ultima_semana') {
                    if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
                    if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
                }
                
                if (filters.estado && filters.estado.length > 0) {
                    params.append('estado', filters.estado.join(','));
                }
                
                // IMPORTANTE: Solo enviar tipo_actividad si hay tipos seleccionados explícitamente
                // Si está vacío o undefined, NO enviar el parámetro (para mostrar TODOS los tipos)
                if (filters.tipo_actividad && Array.isArray(filters.tipo_actividad) && filters.tipo_actividad.length > 0) {
                    // Validar que todos los valores sean válidos (no vacíos)
                    const tiposValidos = filters.tipo_actividad.filter(t => t && t.trim() !== '');
                    if (tiposValidos.length > 0) {
                        params.append('tipo_actividad', tiposValidos.join(','));
                    }
                }
            }
            
            // Filtros específicos para beneficiarios
            if (reportType === 'beneficiarios-por-region-comunidad') {
                // NO enviar fechas - buscar globalmente siempre
                
                // IMPORTANTE: Solo enviar tipo_actividad si hay tipos seleccionados explícitamente
                // Si está vacío o undefined, NO enviar el parámetro (para mostrar TODOS los tipos)
                if (filters.tipo_actividad && Array.isArray(filters.tipo_actividad) && filters.tipo_actividad.length > 0) {
                    // Validar que todos los valores sean válidos (no vacíos)
                    const tiposValidos = filters.tipo_actividad.filter(t => t && t.trim() !== '');
                    if (tiposValidos.length > 0) {
                        params.append('tipo_actividad', tiposValidos.join(','));
                    }
                }
                
                if (filters.evento && filters.evento.length > 0) {
                    params.append('evento', filters.evento.join(','));
                }
                
                if (filters.tipo_beneficiario && filters.tipo_beneficiario.length > 0) {
                    params.append('tipo_beneficiario', filters.tipo_beneficiario.join(','));
                }
            }
        }
        
        // Parámetros específicos para reporte de personal
        if (reportType === 'actividad-de-personal') {
            if (filters.comunidades && filters.comunidades.length > 0) {
                params.append('comunidades', filters.comunidades.join(','));
            }
            if (filters.eventos && filters.eventos.length > 0) {
                params.append('eventos', filters.eventos.join(','));
            }
            if (filters.estado && filters.estado.length > 0) {
                params.append('estado', filters.estado.join(','));
            }
            if (filters.tipo_actividad && filters.tipo_actividad.length > 0) {
                params.append('tipo_actividad', filters.tipo_actividad.join(','));
            }
            if (filters.colaboradores && filters.colaboradores.length > 0) {
                params.append('colaboradores', filters.colaboradores.join(','));
            }
        }
        
        // Parámetros específicos para Avances de Eventos Generales
        if (reportType === 'avances-eventos-generales') {
            if (filters.comunidades && filters.comunidades.length > 0) {
                params.append('comunidades', filters.comunidades.join(','));
            }
            if (filters.eventos && filters.eventos.length > 0) {
                params.append('eventos', filters.eventos.join(','));
            }
            if (filters.tipo_actividad && filters.tipo_actividad.length > 0) {
                params.append('tipo_actividad', filters.tipo_actividad.join(','));
            }
            if (filters.colaboradores && filters.colaboradores.length > 0) {
                params.append('colaboradores', filters.colaboradores.join(','));
            }
            if (filters.mostrar_evidencias !== undefined) {
                params.append('mostrar_evidencias', filters.mostrar_evidencias ? 'true' : 'false');
            }
        }
        
        // Parámetros específicos para Reporte de Evento Individual
        if (reportType === 'reporte-evento-individual') {
            if (filters.evento) {
                params.append('evento', filters.evento);
            }
        }
        
        // Parámetros específicos para Reporte de Comunidades
        if (reportType === 'comunidades') {
            if (filters.periodo) {
                params.append('periodo', filters.periodo);
            }
            if (filters.fecha_inicio) {
                params.append('fecha_inicio', filters.fecha_inicio);
            }
            if (filters.fecha_fin) {
                params.append('fecha_fin', filters.fecha_fin);
            }
            if (filters.comunidades && filters.comunidades.length > 0) {
                params.append('comunidades', filters.comunidades.join(','));
            }
            if (filters.evento) {
                // Si evento es un string, enviarlo directamente; si es un array, unirlo con comas
                if (Array.isArray(filters.evento)) {
                    params.append('evento', filters.evento.join(','));
                } else {
                    params.append('evento', filters.evento);
                }
            }
            if (filters.tipo_actividad && filters.tipo_actividad.length > 0) {
                params.append('tipo_actividad', filters.tipo_actividad.join(','));
            }
        }
        
        // Parámetros específicos para Reporte General
        if (reportType === 'reporte-general') {
            if (filters.periodo) {
                params.append('periodo', filters.periodo);
            }
            if (filters.fecha_inicio) {
                params.append('fecha_inicio', filters.fecha_inicio);
            }
            if (filters.fecha_fin) {
                params.append('fecha_fin', filters.fecha_fin);
            }
            if (filters.apartados && filters.apartados.length > 0) {
                params.append('apartados', filters.apartados.join(','));
            }
        }
        
        // Parámetros específicos para Reporte de Actividad de Usuarios
        if (reportType === 'actividad-usuarios') {
            if (filters.periodo) {
                params.append('periodo', filters.periodo);
            }
            if (filters.fecha_inicio) {
                params.append('fecha_inicio', filters.fecha_inicio);
            }
            if (filters.fecha_fin) {
                params.append('fecha_fin', filters.fecha_fin);
            }
            if (filters.comunidades && filters.comunidades.length > 0) {
                params.append('comunidades', filters.comunidades.join(','));
            }
            if (filters.evento) {
                params.append('evento', filters.evento);
            }
            if (filters.tipo_actividad && filters.tipo_actividad.length > 0) {
                params.append('tipo_actividad', filters.tipo_actividad.join(','));
            }
            if (filters.usuarios && filters.usuarios.length > 0) {
                params.append('usuarios', filters.usuarios.join(','));
            }
        }
        
        // Parámetros genéricos
        if (filters.region && filters.region.length > 0) params.append('region', filters.region.join(','));
        if (filters.comunidad && filters.comunidad.length > 0) params.append('comunidad', filters.comunidad.join(','));
        if (filters.estado && filters.estado.length > 0 && reportType !== 'actividades-por-region-comunidad') params.append('estado', filters.estado.join(','));
        if (filters.tipo_actividad && filters.tipo_actividad.length > 0 && reportType !== 'actividades-por-region-comunidad' && reportType !== 'beneficiarios-por-region-comunidad') params.append('tipo_actividad', filters.tipo_actividad.join(','));
        if (filters.responsable) params.append('responsable', filters.responsable);
        if (filters.tipo_beneficiario && filters.tipo_beneficiario.length > 0 && reportType !== 'beneficiarios-por-region-comunidad') params.append('tipo_beneficiario', filters.tipo_beneficiario.join(','));
        
        const response = await fetch(`/api/reportes/${reportType}/?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error('Error al generar el reporte');
        }
        
        const data = await response.json();
        renderReportResults(data, reportType);
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        resultsContainer.innerHTML = '<div class="loading-state"><p style="color: var(--danger-color);">Error al generar el reporte. Por favor, intenta nuevamente.</p></div>';
    }
}

// Renderizar resultados del reporte
function renderReportResults(data, reportType) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!data || !data.data || data.data.length === 0) {
        resultsContainer.innerHTML = '<div class="loading-state"><p>No se encontraron datos para este reporte.</p></div>';
        return;
    }
    
    // Renderizado específico según tipo de reporte
    if (reportType === 'actividades-por-region-comunidad') {
        renderActividadesReport(data.data);
    } else if (reportType === 'beneficiarios-por-region-comunidad') {
        renderBeneficiariosReport(data.data);
    } else if (reportType === 'actividad-de-personal') {
        renderPersonalReport(data.data);
    } else if (reportType === 'avances-eventos-generales') {
        renderAvancesEventosGeneralesReport(data.data);
    } else if (reportType === 'reporte-evento-individual') {
        renderEventoIndividualReport(data.data);
    } else if (reportType === 'comunidades') {
        renderComunidadesReport(data.data);
    } else if (reportType === 'actividad-usuarios') {
        renderActividadUsuariosReport(data.data);
    } else if (reportType === 'reporte-general') {
        renderReporteGeneral(data.data);
    } else {
        // Renderizado genérico para otros reportes
        renderGenericReport(data.data);
    }
}

// Renderizar reporte de actividades (con mejoras)
function renderActividadesReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    let html = '<div class="table-responsive-wrapper"><table class="results-table"><thead><tr>';
    html += '<th>Región/Comunidad</th>';
    html += '<th>Total Actividades</th>';
    html += '<th>Total Beneficiarios</th>';
    html += '<th>Beneficiarios Individuales</th>';
    html += '<th>Beneficiarios Familias</th>';
    html += '<th>Beneficiarios Instituciones</th>';
    html += '<th>Beneficiarios Exclusivos</th>';
    html += '<th>Responsables</th>';
    html += '</tr></thead><tbody>';
    
    // Usar un Map para evitar actividades duplicadas (basado en nombre + fecha)
    const actividadesUnicasMap = new Map();
    
    data.forEach(item => {
        html += '<tr>';
        html += `<td data-label="Región/Comunidad"><span class="cell-value">${escapeHtml(item.nombre || '-')}</span></td>`;
        html += `<td data-label="Total Actividades"><span class="cell-value">${item.total_actividades || 0}</span></td>`;
        html += `<td data-label="Total Beneficiarios"><span class="cell-value">${item.total_beneficiarios || 0}</span></td>`;
        html += `<td data-label="Beneficiarios Individuales"><span class="cell-value">${item.beneficiarios_individuales || 0}</span></td>`;
        html += `<td data-label="Beneficiarios Familias"><span class="cell-value">${item.beneficiarios_familias || 0}</span></td>`;
        html += `<td data-label="Beneficiarios Instituciones"><span class="cell-value">${item.beneficiarios_instituciones || 0}</span></td>`;
        html += `<td data-label="Beneficiarios Exclusivos"><span class="cell-value">${item.beneficiarios_exclusivos || 0}</span></td>`;
        html += `<td data-label="Responsables"><span class="cell-value">${escapeHtml(item.responsables || '-')}</span></td>`;
        html += '</tr>';
        
        // Acumular actividades únicas para la tabla de detalles (usar nombre + fecha como clave única)
        if (item.actividades && Array.isArray(item.actividades)) {
            item.actividades.forEach(actividad => {
                // Crear clave única basada en nombre y fecha
                const claveUnica = `${actividad.nombre || ''}_${actividad.fecha || ''}`;
                // Solo agregar si no existe ya (evitar duplicados)
                if (!actividadesUnicasMap.has(claveUnica)) {
                    actividadesUnicasMap.set(claveUnica, actividad);
                }
            });
        }
    });
    
    html += '</tbody></table></div>';
    
    // Convertir Map a Array para mostrar
    const todasLasActividades = Array.from(actividadesUnicasMap.values());
    
    // Agregar tabla expandible con detalles de actividades (SIN DUPLICADOS)
    if (todasLasActividades.length > 0) {
        html += '<div style="margin-top: 32px;"><h3 style="color: var(--text-100); margin-bottom: 16px;">Detalles de Actividades</h3>';
        html += '<div class="table-responsive-wrapper"><table class="results-table"><thead><tr>';
        html += '<th>Nombre</th>';
        html += '<th>Fecha</th>';
        html += '<th>Estado</th>';
        html += '<th>Tipo de Actividad</th>';
        html += '<th>Comunidad</th>';
        html += '<th>Responsable</th>';
        html += '<th>Colaborador</th>';
        html += '<th>Total Beneficiarios</th>';
        html += '</tr></thead><tbody>';
        
        // Ordenar por fecha (más reciente primero)
        todasLasActividades.sort((a, b) => {
            if (a.fecha && b.fecha) {
                return b.fecha.localeCompare(a.fecha);
            }
            return 0;
        });
        
        todasLasActividades.forEach(actividad => {
            html += '<tr>';
            html += `<td data-label="Nombre"><span class="cell-value">${escapeHtml(actividad.nombre || '-')}</span></td>`;
            html += `<td data-label="Fecha"><span class="cell-value">${actividad.fecha || '-'}</span></td>`;
            html += `<td data-label="Estado"><span class="status-badge status-${actividad.estado || 'planificado'}">${formatEstado(actividad.estado)}</span></td>`;
            html += `<td data-label="Tipo de Actividad"><span class="cell-value">${escapeHtml(actividad.tipo_actividad || '-')}</span></td>`;
            html += `<td data-label="Comunidad"><span class="cell-value">${escapeHtml(actividad.comunidad || '-')}</span></td>`;
            html += `<td data-label="Responsable"><span class="cell-value">${escapeHtml(actividad.responsable || '-')}</span></td>`;
            html += `<td data-label="Colaborador"><span class="cell-value">${escapeHtml(actividad.colaborador || '-')}</span></td>`;
            html += `<td data-label="Total Beneficiarios"><span class="cell-value">${actividad.total_beneficiarios || 0}</span></td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table></div></div>';
    }
    
    resultsContainer.innerHTML = html;
}

// Renderizar reporte de beneficiarios (con mejoras - agrupados por comunidad)
function renderBeneficiariosReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!data || data.length === 0) {
        resultsContainer.innerHTML = '<div class="loading-state"><p>No se encontraron beneficiarios para este reporte.</p></div>';
        return;
    }
    
    // Agrupar por comunidad para mostrar mejor
    const comunidadesMap = new Map();
    data.forEach(item => {
        const comunidadKey = item.comunidad || 'Sin comunidad';
        if (!comunidadesMap.has(comunidadKey)) {
            comunidadesMap.set(comunidadKey, {
                comunidad: item.comunidad || 'Sin comunidad',
                region: item.region || 'Sin región',
                beneficiarios: []
            });
        }
        comunidadesMap.get(comunidadKey).beneficiarios.push(item);
    });
    
    let html = '';
    
    // Mostrar cada comunidad con sus beneficiarios
    comunidadesMap.forEach((comunidadData, comunidadKey) => {
        html += `<div class="comunidad-group" style="margin-bottom: 32px;">`;
        html += `<h3 style="color: var(--text-100); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color);">`;
        html += `${escapeHtml(comunidadData.comunidad)}`;
        if (comunidadData.region && comunidadData.region !== 'Sin región') {
            html += ` <span style="color: var(--text-70); font-size: 0.9em; font-weight: normal;">(${escapeHtml(comunidadData.region)})</span>`;
        }
        html += ` <span style="color: var(--text-70); font-size: 0.85em; font-weight: normal;">(${comunidadData.beneficiarios.length} beneficiario${comunidadData.beneficiarios.length !== 1 ? 's' : ''})</span>`;
        html += `</h3>`;
        
        html += '<div class="table-responsive-wrapper"><table class="results-table"><thead><tr>';
        html += '<th>Nombre</th>';
        html += '<th>Tipo</th>';
        html += '<th>DPI/Documento</th>';
        html += '<th>Teléfono</th>';
        html += '<th>Email</th>';
        html += '<th>Evento</th>';
        html += '</tr></thead><tbody>';
        
        comunidadData.beneficiarios.forEach(item => {
            html += '<tr>';
            html += `<td data-label="Nombre"><span class="cell-value">${escapeHtml(item.nombre || '-')}</span></td>`;
            html += `<td data-label="Tipo"><span class="cell-value">${escapeHtml(item.tipo || '-')}</span></td>`;
            html += `<td data-label="DPI/Documento"><span class="cell-value">${escapeHtml(item.dpi || item.documento || '-')}</span></td>`;
            html += `<td data-label="Teléfono"><span class="cell-value">${escapeHtml(item.telefono || '-')}</span></td>`;
            html += `<td data-label="Email"><span class="cell-value">${escapeHtml(item.email || '-')}</span></td>`;
            html += `<td data-label="Evento"><span class="cell-value">${escapeHtml(item.evento || '-')}</span></td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        html += '</div>';
    });
    
    resultsContainer.innerHTML = html;
}

// Renderizar reporte de personal
function renderPersonalReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!data || data.length === 0) {
        resultsContainer.innerHTML = '<div class="loading-state"><p>No se encontraron datos para este reporte.</p></div>';
        return;
    }
    
    let html = '';
    
    data.forEach(colaborador => {
        html += `<div class="colaborador-report-card">`;
        html += `<div class="colaborador-header">`;
        html += `<h3 class="colaborador-name">${escapeHtml(colaborador.nombre || 'Sin nombre')}</h3>`;
        html += `<div class="colaborador-info">`;
        html += `<span class="colaborador-field"><strong>Tel:</strong> ${escapeHtml(colaborador.telefono || '-')}</span>`;
        html += `<span class="colaborador-field"><strong>Puesto:</strong> ${escapeHtml(colaborador.puesto || '-')}</span>`;
        html += `</div>`;
        html += `</div>`;
        
        html += `<div class="colaborador-stats">`;
        html += `<div class="stat-item">`;
        html += `<span class="stat-label">Total Eventos Trabajados</span>`;
        html += `<span class="stat-value">${colaborador.sin_avances ? 0 : (colaborador.total_eventos || 0)}</span>`;
        html += `</div>`;
        html += `<div class="stat-item">`;
        html += `<span class="stat-label">Total de Avances Realizados</span>`;
        html += `<span class="stat-value">${colaborador.sin_avances ? 0 : (colaborador.total_avances || 0)}</span>`;
        html += `</div>`;
        html += `</div>`;
        
        // Si tiene avances, mostrar eventos normalmente
        if (!colaborador.sin_avances && colaborador.eventos && colaborador.eventos.length > 0) {
            html += `<div class="eventos-section">`;
            html += `<h4 class="eventos-title">Eventos en el que trabajó</h4>`;
            html += `<div class="eventos-grid">`;
            
            colaborador.eventos.forEach(evento => {
                html += `<div class="evento-card">`;
                html += `<h5 class="evento-name">${escapeHtml(evento.nombre || 'Sin nombre')}</h5>`;
                html += `<div class="evento-details">`;
                html += `<span class="status-badge status-${evento.estado || 'planificado'}">${formatEstado(evento.estado)}</span>`;
                html += `<span class="evento-comunidad">${escapeHtml(evento.tipo_comunidad || '')} ${escapeHtml(evento.comunidad || '-')}</span>`;
                html += `</div>`;
                html += `<div class="evento-stats">`;
                html += `<div class="evento-stat">`;
                html += `<span class="evento-stat-label">Avances realizados:</span>`;
                html += `<span class="evento-stat-value">${evento.total_avances || 0}</span>`;
                html += `</div>`;
                html += `<div class="evento-stat">`;
                html += `<span class="evento-stat-label">Fecha primer avance:</span>`;
                html += `<span class="evento-stat-value">${evento.fecha_primer_avance || '-'}</span>`;
                html += `</div>`;
                html += `<div class="evento-stat">`;
                html += `<span class="evento-stat-label">Fecha último avance:</span>`;
                html += `<span class="evento-stat-value">${evento.fecha_ultimo_avance || '-'}</span>`;
                html += `</div>`;
                html += `</div>`;
                html += `</div>`;
            });
            
            html += `</div>`;
            html += `</div>`;
        } else if (colaborador.sin_avances) {
            // Si no tiene avances, mostrar mensaje especial
            html += `<div class="eventos-section">`;
            html += `<div class="evento-card" style="text-align: center; padding: 24px;">`;
            html += `<p style="color: var(--text-70); font-size: 1rem; margin: 0;">Personal sin Avances de proyecto</p>`;
            html += `</div>`;
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    resultsContainer.innerHTML = html;
}

// Renderizar reporte de Avances de Eventos Generales
function renderAvancesEventosGeneralesReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!data || data.length === 0) {
        resultsContainer.innerHTML = '<div class="loading-state"><p>No se encontraron avances para los filtros seleccionados.</p></div>';
        return;
    }
    
    let html = '';
    
    // Agrupar por evento si hay más de uno
    const eventosAgrupados = {};
    data.forEach(item => {
        const eventoId = item.evento_id || 'sin_evento';
        if (!eventosAgrupados[eventoId]) {
            eventosAgrupados[eventoId] = {
                evento: item.evento,
                comunidades: new Set(),
                total_cambios: 0,
                cambios_por_colaborador: {},
                cambios: []
            };
        }
        
        if (item.comunidad) eventosAgrupados[eventoId].comunidades.add(item.comunidad);
        eventosAgrupados[eventoId].total_cambios++;
        
        if (item.colaborador_id) {
            if (!eventosAgrupados[eventoId].cambios_por_colaborador[item.colaborador_id]) {
                eventosAgrupados[eventoId].cambios_por_colaborador[item.colaborador_id] = {
                    nombre: item.colaborador_nombre || 'Sin nombre',
                    total: 0
                };
            }
            eventosAgrupados[eventoId].cambios_por_colaborador[item.colaborador_id].total++;
        }
        
        eventosAgrupados[eventoId].cambios.push(item);
    });
    
    // Renderizar cada evento
    Object.values(eventosAgrupados).forEach((eventoData, index) => {
        if (Object.keys(eventosAgrupados).length > 1) {
            html += `<div class="evento-report-section" style="margin-bottom: 32px; padding: 24px; background: var(--bg-800); border-radius: var(--radius);">`;
        }
        
        html += `<div class="evento-header" style="margin-bottom: 24px;">`;
        html += `<h3 style="color: var(--text-100); margin-bottom: 12px;">${escapeHtml(eventoData.evento?.nombre || 'Sin nombre')}</h3>`;
        html += `<div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px;">`;
        html += `<span style="color: var(--text-70);"><strong>Estado:</strong> <span class="status-badge status-${eventoData.evento?.estado || 'planificado'}">${formatEstado(eventoData.evento?.estado)}</span></span>`;
        html += `<span style="color: var(--text-70);"><strong>Comunidades:</strong> ${Array.from(eventoData.comunidades).join(', ') || '-'}</span>`;
        html += `</div>`;
        html += `<div style="margin-top: 8px;">`;
        html += `<span style="color: var(--text-70);"><strong>Total de Cambios/Avances:</strong> <span style="color: var(--primary-color); font-weight: bold;">${eventoData.total_cambios}</span></span>`;
        html += `</div>`;
        html += `</div>`;
        
        // Cambios por colaborador
        if (Object.keys(eventoData.cambios_por_colaborador).length > 0) {
            html += `<div style="margin-bottom: 24px;">`;
            html += `<h4 style="color: var(--text-100); margin-bottom: 12px;">Cambios por Colaborador</h4>`;
            html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">`;
            Object.values(eventoData.cambios_por_colaborador).forEach(col => {
                html += `<div style="padding: 12px; background: var(--bg-900); border-radius: var(--radius-sm);">`;
                html += `<div style="color: var(--text-80); font-weight: 500;">${escapeHtml(col.nombre)}</div>`;
                html += `<div style="color: var(--primary-color); font-size: 1.25rem; font-weight: bold;">${col.total}</div>`;
                html += `</div>`;
            });
            html += `</div>`;
            html += `</div>`;
        }
        
        // Lista de cambios/avances
        html += `<div style="margin-bottom: 24px;">`;
        html += `<h4 style="color: var(--text-100); margin-bottom: 12px;">Detalles de Cambios/Avances</h4>`;
        html += `<div class="cambios-list">`;
        
        eventoData.cambios.forEach((cambio, cambioIndex) => {
            html += `<div class="cambio-item" style="padding: 16px; background: var(--bg-900); border-radius: var(--radius-sm); margin-bottom: 16px; border-left: 4px solid var(--primary-color);">`;
            html += `<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">`;
            html += `<div>`;
            // Mostrar la descripción del avance (descripcion_cambio), no la descripción de la evidencia
            html += `<div style="color: var(--text-100); font-weight: 500; margin-bottom: 4px;">${escapeHtml(cambio.descripcion_cambio || 'Sin descripción')}</div>`;
            html += `<div style="color: var(--text-70); font-size: 0.875rem;">Hecho por: <strong>${escapeHtml(cambio.colaborador_nombre || 'Sin nombre')}</strong></div>`;
            html += `<div style="color: var(--text-70); font-size: 0.875rem;">Fecha: ${cambio.fecha_display || cambio.fecha_cambio || '-'}</div>`;
            html += `</div>`;
            html += `</div>`;
            
            // Evidencias si están habilitadas y existen
            if (cambio.evidencias && cambio.evidencias.length > 0) {
                html += `<div class="evidencias-section" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">`;
                html += `<div style="color: var(--text-80); font-weight: 500; margin-bottom: 8px;">Evidencias:</div>`;
                html += `<div style="display: flex; flex-wrap: wrap; gap: 12px;">`;
                
                cambio.evidencias.forEach(evidencia => {
                    if (evidencia.es_imagen) {
                        html += `<div style="position: relative;">`;
                        html += `<img src="${evidencia.url}" alt="${escapeHtml(evidencia.nombre)}" style="max-width: 200px; max-height: 200px; border-radius: var(--radius-sm); cursor: pointer;" onclick="window.open('${evidencia.url}', '_blank')">`;
                        html += `<div style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${escapeHtml(evidencia.nombre)}</div>`;
                        html += `</div>`;
                    } else {
                        html += `<div style="padding: 8px 12px; background: var(--bg-800); border-radius: var(--radius-sm); border: 1px solid var(--border);">`;
                        html += `<a href="${evidencia.url}" download="${escapeHtml(evidencia.nombre)}" style="color: var(--primary-color); text-decoration: none; display: flex; align-items: center; gap: 8px;">`;
                        html += `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
                        html += `<span>${escapeHtml(evidencia.nombre)}</span>`;
                        html += `</a>`;
                        html += `</div>`;
                    }
                });
                
                html += `</div>`;
                html += `</div>`;
            }
            
            html += `</div>`;
        });
        
        html += `</div>`;
        html += `</div>`;
        
        if (Object.keys(eventosAgrupados).length > 1) {
            html += `</div>`;
        }
    });
    
    resultsContainer.innerHTML = html;
}

// Renderizar reporte de Evento Individual
function renderEventoIndividualReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!data || !data.evento) {
        resultsContainer.innerHTML = '<div class="loading-state"><p>No se encontró información del evento.</p></div>';
        return;
    }
    
    const evento = data.evento;
    let html = '';
    
    // Imagen de portada (si existe)
    if (evento.portada && evento.portada.url) {
        html += `<div style="margin-bottom: 24px; border-radius: var(--radius); overflow: hidden;">`;
        html += `<img src="${evento.portada.url}" alt="${escapeHtml(evento.portada.nombre || 'Portada del evento')}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: var(--radius);">`;
        html += `</div>`;
    }
    
    // Información general del evento
    html += `<div class="evento-individual-header" style="padding: 24px; background: var(--bg-800); border-radius: var(--radius); margin-bottom: 24px;">`;
    html += `<h2 style="color: var(--text-100); margin-bottom: 16px;">${escapeHtml(evento.nombre || 'Sin nombre')}</h2>`;
    html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">`;
    html += `<div><strong style="color: var(--text-80);">Tipo:</strong> <span style="color: var(--text-100);">${escapeHtml(evento.tipo || '-')}</span></div>`;
    html += `<div><strong style="color: var(--text-80);">Estado:</strong> <span class="status-badge status-${evento.estado || 'planificado'}">${formatEstado(evento.estado)}</span></div>`;
    html += `<div><strong style="color: var(--text-80);">Fecha:</strong> <span style="color: var(--text-100);">${evento.fecha_display || evento.fecha || '-'}</span></div>`;
    html += `<div><strong style="color: var(--text-80);">Ubicación:</strong> <span style="color: var(--text-100);">${escapeHtml(evento.ubicacion || '-')}</span></div>`;
    if (evento.responsable) {
        html += `<div><strong style="color: var(--text-80);">Responsable:</strong> <span style="color: var(--text-100);">${escapeHtml(evento.responsable)}</span></div>`;
    }
    html += `</div>`;
    
    if (evento.descripcion) {
        html += `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">`;
        html += `<strong style="color: var(--text-80); display: block; margin-bottom: 8px;">Descripción:</strong>`;
        html += `<p style="color: var(--text-100); line-height: 1.6;">${escapeHtml(evento.descripcion)}</p>`;
        html += `</div>`;
    }
    html += `</div>`;
    
    // Personal
    if (evento.personal && evento.personal.length > 0) {
        html += `<div style="margin-bottom: 24px;">`;
        html += `<h3 style="color: var(--text-100); margin-bottom: 16px;">Personal Asignado</h3>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">`;
        evento.personal.forEach(persona => {
            html += `<div style="padding: 12px; background: var(--bg-800); border-radius: var(--radius-sm);">`;
            html += `<div style="color: var(--text-100); font-weight: 500;">${escapeHtml(persona.nombre || persona.username || '-')}</div>`;
            html += `<div style="color: var(--text-70); font-size: 0.875rem;">${escapeHtml(persona.puesto || persona.rol_display || '-')}</div>`;
            html += `</div>`;
        });
        html += `</div>`;
        html += `</div>`;
    }
    
    // Beneficiarios (tabla expandible) - Siempre mostrar, incluso si está vacío
    const beneficiariosCount = evento.beneficiarios && Array.isArray(evento.beneficiarios) ? evento.beneficiarios.length : 0;
    html += `<div style="margin-bottom: 24px;">`;
    html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">`;
    html += `<h3 style="color: var(--text-100); margin: 0;">Beneficiarios (${beneficiariosCount})</h3>`;
    if (beneficiariosCount > 0) {
        html += `<button id="toggleBeneficiarios" onclick="toggleBeneficiariosTable()" style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer;">Ocultar</button>`;
    }
    html += `</div>`;
    html += `<div id="beneficiariosTable" style="overflow-x: auto;">`;
    
    if (beneficiariosCount > 0) {
        html += `<table class="results-table" style="width: 100%;">`;
        html += `<thead><tr>`;
        html += `<th>Nombre</th>`;
        html += `<th>Tipo</th>`;
        html += `<th>Comunidad</th>`;
        html += `<th>Información Adicional</th>`;
        html += `</tr></thead><tbody>`;
        
        evento.beneficiarios.forEach(benef => {
            html += `<tr>`;
            html += `<td data-label="Nombre"><span class="cell-value">${escapeHtml(benef.nombre || '-')}</span></td>`;
            html += `<td data-label="Tipo"><span class="cell-value">${escapeHtml(benef.tipo_display || benef.tipo || '-')}</span></td>`;
            html += `<td data-label="Comunidad"><span class="cell-value">${escapeHtml(benef.detalles?.comunidad_nombre || '-')}</span></td>`;
            html += `<td data-label="Información"><span class="cell-value">${escapeHtml(benef.info_adicional || '-')}</span></td>`;
            html += `</tr>`;
        });
        
        html += `</tbody></table>`;
    } else {
        html += `<div style="padding: 24px; background: var(--bg-800); border-radius: var(--radius-sm); text-align: center; color: var(--text-70);">`;
        html += `<p style="margin: 0;">No hay beneficiarios registrados para este evento.</p>`;
        html += `</div>`;
    }
    
    html += `</div>`;
    html += `</div>`;
    
    // Galería de imágenes
    if (evento.evidencias && evento.evidencias.length > 0) {
        html += `<div style="margin-bottom: 24px;">`;
        html += `<h3 style="color: var(--text-100); margin-bottom: 16px;">Galería de Imágenes</h3>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">`;
        
        evento.evidencias.forEach(evidencia => {
            if (evidencia.es_imagen) {
                html += `<div style="position: relative; cursor: pointer;" onclick="window.open('${evidencia.url}', '_blank')">`;
                html += `<img src="${evidencia.url}" alt="${escapeHtml(evidencia.nombre)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-sm);">`;
                html += `<div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); color: white; padding: 8px; border-radius: 0 0 var(--radius-sm) var(--radius-sm); font-size: 0.875rem;">${escapeHtml(evidencia.nombre)}</div>`;
                html += `</div>`;
            }
        });
        
        html += `</div>`;
        html += `</div>`;
    }
    
    // Archivos del proyecto
    if (evento.archivos && evento.archivos.length > 0) {
        html += `<div style="margin-bottom: 24px;">`;
        html += `<h3 style="color: var(--text-100); margin-bottom: 16px;">Archivos del Proyecto</h3>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">`;
        
        evento.archivos.forEach(archivo => {
            html += `<div style="padding: 12px; background: var(--bg-800); border-radius: var(--radius-sm); border: 1px solid var(--border);">`;
            html += `<a href="${archivo.url}" download="${escapeHtml(archivo.nombre)}" style="color: var(--primary-color); text-decoration: none; display: flex; align-items: center; gap: 8px;">`;
            html += `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
            html += `<div>`;
            html += `<div style="font-weight: 500;">${escapeHtml(archivo.nombre)}</div>`;
            if (archivo.descripcion) {
                html += `<div style="font-size: 0.875rem; color: var(--text-70);">${escapeHtml(archivo.descripcion)}</div>`;
            }
            html += `</div>`;
            html += `</a>`;
            html += `</div>`;
        });
        
        html += `</div>`;
        html += `</div>`;
    }
    
    // Cambios/Avances (tabla expandible) - Siempre mostrar, incluso si está vacío
    html += `<div style="margin-bottom: 24px;">`;
    html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">`;
    const cambiosCount = evento.cambios && Array.isArray(evento.cambios) ? evento.cambios.length : 0;
    html += `<h3 style="color: var(--text-100); margin: 0;">Cambios/Avances (${cambiosCount})</h3>`;
    if (cambiosCount > 0) {
        html += `<button id="toggleCambios" onclick="toggleCambiosTable()" style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer;">Ocultar</button>`;
    }
    html += `</div>`;
    html += `<div id="cambiosTable" style="overflow-x: auto;">`;
    
    if (evento.cambios && evento.cambios.length > 0) {
        evento.cambios.forEach(cambio => {
            html += `<div class="cambio-item" style="padding: 16px; background: var(--bg-800); border-radius: var(--radius-sm); margin-bottom: 16px; border-left: 4px solid var(--primary-color);">`;
            html += `<div style="color: var(--text-100); font-weight: 500; margin-bottom: 8px;">${escapeHtml(cambio.descripcion || 'Sin descripción')}</div>`;
            html += `<div style="display: flex; gap: 16px; flex-wrap: wrap; color: var(--text-70); font-size: 0.875rem;">`;
            html += `<span>Hecho por: <strong>${escapeHtml(cambio.responsable || '-')}</strong></span>`;
            html += `<span>Fecha: ${cambio.fecha_display || cambio.fecha_cambio || '-'}</span>`;
            html += `</div>`;
            
            // Evidencias del cambio
            if (cambio.evidencias && cambio.evidencias.length > 0) {
                html += `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">`;
                html += `<div style="color: var(--text-80); font-weight: 500; margin-bottom: 8px;">Evidencias:</div>`;
                html += `<div style="display: flex; flex-wrap: wrap; gap: 12px;">`;
                
                cambio.evidencias.forEach(evidencia => {
                    if (evidencia.es_imagen || (evidencia.tipo && evidencia.tipo.startsWith('image/'))) {
                        html += `<div style="position: relative;">`;
                        html += `<img src="${evidencia.url}" alt="${escapeHtml(evidencia.nombre)}" style="max-width: 200px; max-height: 200px; border-radius: var(--radius-sm); cursor: pointer;" onclick="window.open('${evidencia.url}', '_blank')">`;
                        html += `</div>`;
                    } else {
                        html += `<div style="padding: 8px 12px; background: var(--bg-900); border-radius: var(--radius-sm);">`;
                        html += `<a href="${evidencia.url}" download="${escapeHtml(evidencia.nombre)}" style="color: var(--primary-color); text-decoration: none;">${escapeHtml(evidencia.nombre)}</a>`;
                        html += `</div>`;
                    }
                });
                
                html += `</div>`;
                html += `</div>`;
            }
            
            html += `</div>`;
        });
    } else {
        html += `<div style="padding: 24px; background: var(--bg-800); border-radius: var(--radius-sm); text-align: center; color: var(--text-70);">`;
        html += `<p style="margin: 0;">No hay cambios o avances registrados para este evento.</p>`;
        html += `</div>`;
    }
    
    html += `</div>`;
    html += `</div>`;
    
    resultsContainer.innerHTML = html;
}

// Renderizar reporte genérico
function renderGenericReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Crear tabla de resultados
    let html = '<table class="results-table"><thead><tr>';
    
    // Crear encabezados basados en las claves del primer objeto
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        html += `<th>${formatHeader(header)}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Crear filas
    data.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            html += `<td>${formatCellValue(row[header])}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    resultsContainer.innerHTML = html;
}

// Funciones auxiliares
function escapeHtml(text) {
    if (!text) return '-';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatEstado(estado) {
    const estados = {
        'planificado': 'Planificado',
        'en_progreso': 'En Progreso',
        'completado': 'Completado',
        'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
}

function formatHeader(header) {
    return header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatCellValue(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return escapeHtml(String(value));
}

function showError(message) {
    // Crear un elemento de error temporal
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--danger-color); color: white; padding: 16px 24px; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Variable global para almacenar los datos originales del reporte de comunidades
let comunidadesReportDataOriginal = null;

// Renderizar reporte de comunidades
function renderComunidadesReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    if (!data || !data.comunidades || data.comunidades.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-70);">No se encontraron comunidades que cumplan con los criterios de búsqueda.</div>';
        comunidadesReportDataOriginal = null;
        return;
    }
    
    // Guardar datos originales para re-ordenamiento y filtrado
    comunidadesReportDataOriginal = JSON.parse(JSON.stringify(data));
    
    // Renderizar con los datos originales (sin filtros iniciales)
    renderComunidadesReportFiltered(data);
}

// Función para renderizar comunidades con filtros y ordenamiento aplicados
function renderComunidadesReportFiltered(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    if (!data || !data.comunidades || data.comunidades.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-70);">No se encontraron comunidades que cumplan con los criterios de búsqueda.</div>';
        return;
    }
    
    // Obtener valores actuales de los selectores (si existen)
    const ordenarActivasSelect = document.getElementById('ordenarComunidadesActivas');
    const ordenarTipoSelect = document.getElementById('ordenarComunidadesTipo');
    
    const ordenActivas = ordenarActivasSelect ? ordenarActivasSelect.value : 'mas_activas';
    const tipoFiltro = ordenarTipoSelect ? ordenarTipoSelect.value : 'todos';
    
    // Filtrar por tipo
    let comunidadesFiltradas = data.comunidades;
    if (tipoFiltro !== 'todos') {
        comunidadesFiltradas = comunidadesFiltradas.filter(comunidad => {
            const tipoComunidad = (comunidad.tipo || '').toLowerCase();
            return tipoComunidad === tipoFiltro.toLowerCase();
        });
    }
    
    // Ordenar por actividad (número de proyectos)
    comunidadesFiltradas = [...comunidadesFiltradas]; // Crear copia para no mutar el original
    if (ordenActivas === 'mas_activas') {
        comunidadesFiltradas.sort((a, b) => {
            const proyectosA = a.numero_proyectos || 0;
            const proyectosB = b.numero_proyectos || 0;
            if (proyectosB !== proyectosA) {
                return proyectosB - proyectosA; // Más proyectos primero
            }
            // Si tienen el mismo número de proyectos, ordenar por beneficiarios
            const benefA = a.numero_beneficiarios || 0;
            const benefB = b.numero_beneficiarios || 0;
            return benefB - benefA;
        });
    } else if (ordenActivas === 'menos_activas') {
        comunidadesFiltradas.sort((a, b) => {
            const proyectosA = a.numero_proyectos || 0;
            const proyectosB = b.numero_proyectos || 0;
            if (proyectosA !== proyectosB) {
                return proyectosA - proyectosB; // Menos proyectos primero
            }
            // Si tienen el mismo número de proyectos, ordenar por beneficiarios
            const benefA = a.numero_beneficiarios || 0;
            const benefB = b.numero_beneficiarios || 0;
            return benefA - benefB;
        });
    }
    
    let html = '<div class="comunidades-report-container">';
    
    // Opciones de ordenamiento
    html += '<div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;">';
    html += '<label style="color: var(--text-100); font-weight: 500;">Ordenar por:</label>';
    html += '<select id="ordenarComunidadesActivas" style="padding: 8px 12px; background: var(--bg-800); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-100);">';
    html += `<option value="mas_activas" ${ordenActivas === 'mas_activas' ? 'selected' : ''}>Más Activas</option>`;
    html += `<option value="menos_activas" ${ordenActivas === 'menos_activas' ? 'selected' : ''}>Menos Activas</option>`;
    html += '</select>';
    html += '<select id="ordenarComunidadesTipo" style="padding: 8px 12px; background: var(--bg-800); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-100);">';
    html += `<option value="todos" ${tipoFiltro === 'todos' ? 'selected' : ''}>Todos los Tipos</option>`;
    html += `<option value="barrio" ${tipoFiltro === 'barrio' ? 'selected' : ''}>Barrio</option>`;
    html += `<option value="caserío" ${tipoFiltro === 'caserío' ? 'selected' : ''}>Caserío</option>`;
    html += `<option value="aldea" ${tipoFiltro === 'aldea' ? 'selected' : ''}>Aldea</option>`;
    html += '</select>';
    html += '</div>';
    
    // Renderizar cada comunidad
    comunidadesFiltradas.forEach(comunidad => {
        html += `<div class="comunidad-card" style="background: var(--bg-800); border-radius: var(--radius-sm); padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--primary-color);">`;
        
        // Información general de la comunidad
        html += `<h3 style="color: var(--text-100); margin-bottom: 16px; font-size: 1.25rem;">${escapeHtml(comunidad.nombre || 'Sin nombre')}</h3>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">`;
        html += `<div><strong style="color: var(--text-80);">COCODE:</strong> <span style="color: var(--text-70);">${escapeHtml(comunidad.cocode || '-')}</span></div>`;
        html += `<div><strong style="color: var(--text-80);">Región:</strong> <span style="color: var(--text-70);">${escapeHtml(comunidad.region || '-')}</span></div>`;
        html += `<div><strong style="color: var(--text-80);">Tipo:</strong> <span style="color: var(--text-70);">${escapeHtml(comunidad.tipo || '-')}</span></div>`;
        html += `<div><strong style="color: var(--text-80);">Número de Beneficiarios:</strong> <span style="color: var(--text-70);">${comunidad.numero_beneficiarios || 0}</span></div>`;
        html += `<div><strong style="color: var(--text-80);">Número de Proyectos:</strong> <span style="color: var(--text-70);">${comunidad.numero_proyectos || 0}</span></div>`;
        html += `</div>`;
        
        // Proyectos/Eventos que alcanzan la comunidad
        if (comunidad.proyectos && comunidad.proyectos.length > 0) {
            html += `<h4 style="color: var(--text-100); margin-bottom: 12px; margin-top: 24px;">Proyectos/Eventos</h4>`;
            html += `<div style="display: grid; gap: 16px;">`;
            comunidad.proyectos.forEach(proyecto => {
                html += `<div style="padding: 16px; background: var(--bg-900); border-radius: var(--radius-sm); border-left: 3px solid var(--primary-color);">`;
                html += `<div style="color: var(--text-100); font-weight: 500; margin-bottom: 8px;">${escapeHtml(proyecto.nombre || 'Sin nombre')}</div>`;
                html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; color: var(--text-70); font-size: 0.875rem;">`;
                html += `<div><strong>Tipo:</strong> ${escapeHtml(proyecto.tipo || '-')}</div>`;
                html += `<div><strong>Estado:</strong> ${formatEstado(proyecto.estado || '-')}</div>`;
                html += `<div><strong>Fecha:</strong> ${proyecto.fecha || '-'}</div>`;
                html += `</div>`;
                html += `</div>`;
            });
            html += `</div>`;
        }
        
        // Beneficiarios de la comunidad
        if (comunidad.beneficiarios && comunidad.beneficiarios.length > 0) {
            html += `<h4 style="color: var(--text-100); margin-bottom: 12px; margin-top: 24px;">Beneficiarios</h4>`;
            html += `<div style="overflow-x: auto;">`;
            html += `<table class="results-table" style="width: 100%;">`;
            html += `<thead><tr>`;
            html += `<th>Nombre</th>`;
            html += `<th>Tipo</th>`;
            html += `<th>Eventos</th>`;
            html += `</tr></thead>`;
            html += `<tbody>`;
            comunidad.beneficiarios.forEach(beneficiario => {
                html += `<tr>`;
                html += `<td>${escapeHtml(beneficiario.nombre || '-')}</td>`;
                html += `<td>${escapeHtml(beneficiario.tipo || '-')}</td>`;
                html += `<td>${beneficiario.eventos ? beneficiario.eventos.map(e => escapeHtml(e)).join(', ') : '-'}</td>`;
                html += `</tr>`;
            });
            html += `</tbody>`;
            html += `</table>`;
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
    
    // Agregar event listeners para ordenamiento y filtrado dinámico
    const ordenarActivas = document.getElementById('ordenarComunidadesActivas');
    const ordenarTipo = document.getElementById('ordenarComunidadesTipo');
    
    // Función para actualizar el reporte cuando cambien los filtros
    const actualizarReporte = () => {
        if (comunidadesReportDataOriginal) {
            renderComunidadesReportFiltered(comunidadesReportDataOriginal);
        }
    };
    
    if (ordenarActivas) {
        // Remover listeners anteriores si existen
        const nuevaOrdenarActivas = ordenarActivas.cloneNode(true);
        ordenarActivas.parentNode.replaceChild(nuevaOrdenarActivas, ordenarActivas);
        
        nuevaOrdenarActivas.addEventListener('change', function() {
            actualizarReporte();
        });
    }
    
    if (ordenarTipo) {
        // Remover listeners anteriores si existen
        const nuevaOrdenarTipo = ordenarTipo.cloneNode(true);
        ordenarTipo.parentNode.replaceChild(nuevaOrdenarTipo, ordenarTipo);
        
        nuevaOrdenarTipo.addEventListener('change', function() {
            actualizarReporte();
        });
    }
}

// Renderizar reporte de actividad de usuarios
function renderActividadUsuariosReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    if (!data || !data.usuarios || data.usuarios.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-70);">No se encontraron usuarios que cumplan con los criterios de búsqueda.</div>';
        return;
    }
    
    let html = '<div class="actividad-usuarios-report-container">';
    
    // Opción de ordenamiento
    html += '<div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;">';
    html += '<label style="color: var(--text-100); font-weight: 500;">Ordenar por:</label>';
    html += '<select id="ordenarUsuariosActivos" style="padding: 8px 12px; background: var(--bg-800); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-100);">';
    html += '<option value="mas_activos">Más Activos</option>';
    html += '<option value="menos_activos">Menos Activos</option>';
    html += '</select>';
    html += '</div>';
    
    // Renderizar cada usuario
    data.usuarios.forEach(usuario => {
        html += `<div class="usuario-card" style="background: var(--bg-800); border-radius: var(--radius-sm); padding: 20px; margin-bottom: 20px; border-left: 4px solid var(--primary-color);">`;
        
        // Título con información general del usuario - Mejorado para responsive
        html += `<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">`;
        html += `<h3 style="color: var(--text-100); margin: 0; font-size: 1.25rem; flex: 1; min-width: 200px;">${escapeHtml(usuario.nombre || usuario.username || 'Sin nombre')}</h3>`;
        html += `<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; flex: 1; min-width: 200px;">`;
        html += `<span style="padding: 4px 12px; background: var(--bg-900); border-radius: 12px; color: var(--text-70); font-size: 0.875rem; white-space: nowrap;"><strong>Total:</strong> ${usuario.total_cambios || 0}</span>`;
        html += `</div>`;
        html += `</div>`;
        
        // Información del usuario en grid responsive
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; font-size: 0.9rem;">`;
        html += `<div><strong style="color: var(--text-80); display: block; margin-bottom: 4px;">Usuario:</strong> <span style="color: var(--text-70);">${escapeHtml(usuario.username || '-')}</span></div>`;
        html += `<div><strong style="color: var(--text-80); display: block; margin-bottom: 4px;">Rol:</strong> <span style="color: var(--text-70);">${escapeHtml(usuario.rol_display || usuario.rol || '-')}</span></div>`;
        if (usuario.puesto_nombre || usuario.puesto) {
            html += `<div><strong style="color: var(--text-80); display: block; margin-bottom: 4px;">Puesto:</strong> <span style="color: var(--text-70);">${escapeHtml(usuario.puesto_nombre || usuario.puesto || '-')}</span></div>`;
        }
        html += `</div>`;
        
        // Verificar si el usuario tiene actividad
        if (usuario.sin_actividad) {
            html += `<div style="padding: 16px; background: var(--bg-900); border-radius: var(--radius-sm); text-align: center; color: var(--text-70); font-size: 0.9rem;">`;
            html += `<p style="margin: 0;">Este usuario no tiene actividad registrada en los eventos o comunidades seleccionados.</p>`;
            html += `</div>`;
        } else if (usuario.cambios && usuario.cambios.length > 0) {
            // Agrupar cambios por evento
            const cambiosPorEvento = {};
            usuario.cambios.forEach(cambio => {
                const eventoId = cambio.evento_id || 'sin_evento';
                const eventoNombre = cambio.evento_nombre || 'Sin evento';
                if (!cambiosPorEvento[eventoId]) {
                    cambiosPorEvento[eventoId] = {
                        nombre: eventoNombre,
                        cambios: []
                    };
                }
                cambiosPorEvento[eventoId].cambios.push(cambio);
            });
            
            // Renderizar cambios por evento - Mejorado para responsive
            Object.keys(cambiosPorEvento).forEach(eventoId => {
                const eventoData = cambiosPorEvento[eventoId];
                html += `<div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid var(--primary-color);">`;
                html += `<h4 style="color: var(--text-100); margin: 0 0 12px 0; font-size: 1.1rem; font-weight: 600;">${escapeHtml(eventoData.nombre)}</h4>`;
                
                // Usar cards en lugar de tabla para mejor responsive
                eventoData.cambios.forEach(cambio => {
                    html += `<div style="background: var(--bg-900); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px; border-left: 3px solid var(--primary-color);">`;
                    html += `<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; justify-content: space-between;">`;
                    html += `<div style="flex: 1; min-width: 200px;">`;
                    html += `<div style="color: var(--text-80); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${escapeHtml(cambio.tipo_cambio || 'Cambio')}</div>`;
                    html += `<div style="color: var(--text-100); font-size: 0.95rem; line-height: 1.5; word-wrap: break-word;">${escapeHtml(cambio.descripcion || '-')}</div>`;
                    html += `</div>`;
                    html += `<div style="flex-shrink: 0; text-align: right; min-width: 100px;">`;
                    html += `<div style="color: var(--text-70); font-size: 0.85rem; white-space: nowrap;">${cambio.fecha_display || cambio.fecha || '-'}</div>`;
                    html += `</div>`;
                    html += `</div>`;
                    html += `</div>`;
                });
                html += `</div>`;
            });
        } else {
            html += `<div style="padding: 16px; background: var(--bg-900); border-radius: var(--radius-sm); text-align: center; color: var(--text-70); font-size: 0.9rem;">`;
            html += `<p style="margin: 0;">No se encontraron cambios registrados para este usuario.</p>`;
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
    
    // Agregar event listener para ordenamiento
    const ordenarActivos = document.getElementById('ordenarUsuariosActivos');
    if (ordenarActivos) {
        ordenarActivos.addEventListener('change', function() {
            // TODO: Implementar ordenamiento
            console.log('Ordenar por:', this.value);
        });
    }
}

// Renderizar reporte general
function renderReporteGeneral(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    if (!data) {
        resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-70);">No se encontraron datos para el reporte general.</div>';
        return;
    }
    
    let html = '<div class="reporte-general-container" style="padding: 24px;">';
    
    // Título del reporte
    html += '<h2 style="color: var(--text-100); margin-bottom: 32px; text-align: center; border-bottom: 2px solid var(--primary-color); padding-bottom: 16px;">Reporte General de la Oficina</h2>';
    
    // Total de Eventos (con lista si está seleccionado)
    if (data.total_eventos !== undefined) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--primary-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Total de Eventos</h3>';
        html += `<p style="color: var(--text-80); font-size: 1.5rem; margin-bottom: 16px;"><strong>${data.total_eventos.total || 0}</strong> eventos</p>`;
        
        // Lista de eventos si está seleccionado
        if (data.total_eventos.lista_eventos && data.total_eventos.lista_eventos.length > 0) {
            html += '<div style="margin-top: 16px;">';
            html += '<h4 style="color: var(--text-100); margin-bottom: 12px;">Lista de Eventos</h4>';
            html += '<div style="overflow-x: auto;">';
            html += '<table class="results-table" style="width: 100%;">';
            html += '<thead><tr>';
            html += '<th>Nombre</th>';
            html += '<th>Tipo</th>';
            html += '<th>Estado</th>';
            html += '<th>Fecha</th>';
            html += '<th>Comunidad</th>';
            html += '<th>Beneficiarios</th>';
            html += '</tr></thead>';
            html += '<tbody>';
            data.total_eventos.lista_eventos.forEach(evento => {
                html += '<tr>';
                html += `<td>${escapeHtml(evento.nombre || '-')}</td>`;
                html += `<td>${escapeHtml(evento.tipo || '-')}</td>`;
                html += `<td>${escapeHtml(evento.estado || '-')}</td>`;
                html += `<td>${evento.fecha || '-'}</td>`;
                html += `<td>${escapeHtml(evento.comunidad || '-')}</td>`;
                html += `<td>${evento.beneficiarios || 0}</td>`;
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // Total de Tipos de Eventos
    if (data.tipos_eventos !== undefined) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--success-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Total de Tipos de Eventos</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">';
        if (data.tipos_eventos.capacitacion !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Capacitación:</strong> <span style="color: var(--text-70);">${data.tipos_eventos.capacitacion || 0}</span></div>`;
        }
        if (data.tipos_eventos.entrega !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Entrega:</strong> <span style="color: var(--text-70);">${data.tipos_eventos.entrega || 0}</span></div>`;
        }
        if (data.tipos_eventos.proyecto_ayuda !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Proyecto de Ayuda:</strong> <span style="color: var(--text-70);">${data.tipos_eventos.proyecto_ayuda || 0}</span></div>`;
        }
        html += '</div>';
        html += '</div>';
    }
    
    // Total de Beneficiarios Alcanzados
    if (data.total_beneficiarios !== undefined) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--primary-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Total de Beneficiarios Alcanzados</h3>';
        html += `<p style="color: var(--text-80); font-size: 1.5rem;"><strong>${data.total_beneficiarios || 0}</strong> beneficiarios</p>`;
        html += '</div>';
    }
    
    // Total de Tipos de Beneficiarios
    if (data.tipos_beneficiarios !== undefined) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--success-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Total de Tipos de Beneficiarios</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">';
        if (data.tipos_beneficiarios.individual !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Individual:</strong> <span style="color: var(--text-70);">${data.tipos_beneficiarios.individual || 0}</span></div>`;
        }
        if (data.tipos_beneficiarios.familia !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Familia:</strong> <span style="color: var(--text-70);">${data.tipos_beneficiarios.familia || 0}</span></div>`;
        }
        if (data.tipos_beneficiarios.institucion !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Institución:</strong> <span style="color: var(--text-70);">${data.tipos_beneficiarios.institucion || 0}</span></div>`;
        }
        if (data.tipos_beneficiarios.mujeres !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Mujeres:</strong> <span style="color: var(--text-70);">${data.tipos_beneficiarios.mujeres || 0}</span></div>`;
        }
        if (data.tipos_beneficiarios.hombres !== undefined) {
            html += `<div><strong style="color: var(--text-80);">Hombres:</strong> <span style="color: var(--text-70);">${data.tipos_beneficiarios.hombres || 0}</span></div>`;
        }
        html += '</div>';
        html += '</div>';
    }
    
    // Total de Comunidades Alcanzadas
    if (data.total_comunidades !== undefined) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--primary-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Total de Comunidades Alcanzadas</h3>';
        
        // Si es un objeto con total y lista
        if (typeof data.total_comunidades === 'object' && data.total_comunidades.total !== undefined) {
            html += `<p style="color: var(--text-80); font-size: 1.5rem; margin-bottom: 16px;"><strong>${data.total_comunidades.total || 0}</strong> comunidades</p>`;
            
            // Lista de comunidades si está disponible
            if (data.total_comunidades.lista_comunidades && data.total_comunidades.lista_comunidades.length > 0) {
                html += '<div style="margin-top: 16px;">';
                html += '<h4 style="color: var(--text-100); margin-bottom: 12px;">Lista de Comunidades</h4>';
                html += '<div style="overflow-x: auto;">';
                html += '<table class="results-table" style="width: 100%;">';
                html += '<thead><tr>';
                html += '<th>Comunidad</th>';
                html += '<th>COCODE</th>';
                html += '<th>Región</th>';
                html += '<th>Tipo</th>';
                html += '<th>Total Eventos</th>';
                html += '<th>Total Beneficiarios</th>';
                html += '</tr></thead>';
                html += '<tbody>';
                data.total_comunidades.lista_comunidades.forEach(comunidad => {
                    html += '<tr>';
                    html += `<td>${escapeHtml(comunidad.nombre || '-')}</td>`;
                    html += `<td>${escapeHtml(comunidad.cocode || '-')}</td>`;
                    html += `<td>${escapeHtml(comunidad.region || '-')}</td>`;
                    html += `<td>${escapeHtml(comunidad.tipo || '-')}</td>`;
                    html += `<td>${comunidad.total_eventos || 0}</td>`;
                    html += `<td>${comunidad.total_beneficiarios || 0}</td>`;
                    html += '</tr>';
                });
                html += '</tbody></table>';
                html += '</div>';
                html += '</div>';
            }
        } else {
            // Compatibilidad con formato antiguo (solo número)
            html += `<p style="color: var(--text-80); font-size: 1.5rem;"><strong>${data.total_comunidades || 0}</strong> comunidades</p>`;
        }
        
        html += '</div>';
    }
    
    // Total de Avances en Proyectos
    if (data.total_avances !== undefined) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--success-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Total de Avances en Proyectos</h3>';
        html += `<p style="color: var(--text-80); font-size: 1.5rem;"><strong>${data.total_avances || 0}</strong> avances</p>`;
        html += '</div>';
    }
    
    // Comunidades con Más Beneficiarios y Eventos
    if (data.comunidades_mas_beneficiarios !== undefined && data.comunidades_mas_beneficiarios.length > 0) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--primary-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Comunidades con Más Beneficiarios y Eventos</h3>';
        html += '<div style="overflow-x: auto;">';
        html += '<table class="results-table" style="width: 100%;">';
        html += '<thead><tr>';
        html += '<th>Comunidad</th>';
        html += '<th>Región</th>';
        html += '<th>Total Beneficiarios</th>';
        html += '<th>Total Eventos</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        data.comunidades_mas_beneficiarios.forEach(comunidad => {
            html += '<tr>';
            html += `<td>${escapeHtml(comunidad.nombre || '-')}</td>`;
            html += `<td>${escapeHtml(comunidad.region || '-')}</td>`;
            html += `<td>${comunidad.total_beneficiarios || 0}</td>`;
            html += `<td>${comunidad.total_eventos || 0}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        html += '</div>';
        html += '</div>';
    }
    
    // Eventos con Más Beneficiarios
    if (data.eventos_mas_beneficiarios !== undefined && data.eventos_mas_beneficiarios.length > 0) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--success-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Eventos con Más Beneficiarios</h3>';
        html += '<div style="overflow-x: auto;">';
        html += '<table class="results-table" style="width: 100%;">';
        html += '<thead><tr>';
        html += '<th>Evento</th>';
        html += '<th>Tipo</th>';
        html += '<th>Estado</th>';
        html += '<th>Total Beneficiarios</th>';
        html += '<th>Comunidad</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        data.eventos_mas_beneficiarios.forEach(evento => {
            html += '<tr>';
            html += `<td>${escapeHtml(evento.nombre || '-')}</td>`;
            html += `<td>${escapeHtml(evento.tipo || '-')}</td>`;
            html += `<td>${escapeHtml(evento.estado || '-')}</td>`;
            html += `<td>${evento.total_beneficiarios || 0}</td>`;
            html += `<td>${escapeHtml(evento.comunidad || '-')}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        html += '</div>';
        html += '</div>';
    }
    
    // Evento con Más Avances y Cambios
    if (data.evento_mas_avances !== undefined) {
        html += '<div class="reporte-section" style="margin-bottom: 32px; background: var(--bg-800); padding: 24px; border-radius: var(--radius-sm); border-left: 4px solid var(--primary-color);">';
        html += '<h3 style="color: var(--text-100); margin-bottom: 16px;">Evento con Más Avances y Cambios</h3>';
        if (data.evento_mas_avances.nombre) {
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">';
            html += `<div><strong style="color: var(--text-80);">Evento:</strong> <span style="color: var(--text-70);">${escapeHtml(data.evento_mas_avances.nombre || '-')}</span></div>`;
            html += `<div><strong style="color: var(--text-80);">Tipo:</strong> <span style="color: var(--text-70);">${escapeHtml(data.evento_mas_avances.tipo || '-')}</span></div>`;
            html += `<div><strong style="color: var(--text-80);">Estado:</strong> <span style="color: var(--text-70);">${escapeHtml(data.evento_mas_avances.estado || '-')}</span></div>`;
            html += `<div><strong style="color: var(--text-80);">Total Avances:</strong> <span style="color: var(--text-70);">${data.evento_mas_avances.total_avances || 0}</span></div>`;
            html += `<div><strong style="color: var(--text-80);">Comunidad:</strong> <span style="color: var(--text-70);">${escapeHtml(data.evento_mas_avances.comunidad || '-')}</span></div>`;
            html += '</div>';
        } else {
            html += '<p style="color: var(--text-70);">No hay eventos con avances registrados.</p>';
        }
        html += '</div>';
    }
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

// Funciones globales para mostrar/ocultar tablas en reporte individual
function toggleBeneficiariosTable() {
    const table = document.getElementById('beneficiariosTable');
    const button = document.getElementById('toggleBeneficiarios');
    if (table && button) {
        // Verificar el estado actual de la tabla
        const currentDisplay = table.style.display;
        const computedDisplay = window.getComputedStyle(table).display;
        const isHidden = currentDisplay === 'none' || (currentDisplay === '' && computedDisplay === 'none');
        
        if (isHidden) {
            table.style.display = 'block';
            button.textContent = 'Ocultar';
        } else {
            table.style.display = 'none';
            button.textContent = 'Mostrar';
        }
    }
}

function toggleCambiosTable() {
    const table = document.getElementById('cambiosTable');
    const button = document.getElementById('toggleCambios');
    if (table && button) {
        // Verificar el estado actual de la tabla
        const currentDisplay = table.style.display;
        const computedDisplay = window.getComputedStyle(table).display;
        const isHidden = currentDisplay === 'none' || (currentDisplay === '' && computedDisplay === 'none');
        
        if (isHidden) {
            table.style.display = 'block';
            button.textContent = 'Ocultar';
        } else {
            table.style.display = 'none';
            button.textContent = 'Mostrar';
        }
    }
}

