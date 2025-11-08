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
    renderTableProximas(data.proximas_actividades || []);
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
        tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No hay actividades próximas</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.nombre || '-')}</td>
            <td>${item.fecha || '-'}</td>
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
function openReport(reportType) {
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
    
    // Actualizar título
    const reportTitle = document.querySelector('.report-card[data-report-type="' + reportType + '"] .card-title').textContent;
    document.getElementById('resultsTitle').textContent = reportTitle;
    
    // Mostrar formulario específico según el tipo de reporte
    hideAllForms();
    showFormForReport(reportType);
    
    // Cargar datos específicos del formulario (async, esperar a que termine)
    loadFormData(reportType).then(() => {
        // Después de cargar datos, resetear filtros
        resetFiltersForm(reportType);
    });
}

// Ocultar todos los formularios
function hideAllForms() {
    document.querySelectorAll('.report-form').forEach(form => {
        form.style.display = 'none';
    });
}

// Mostrar formulario según tipo de reporte
function showFormForReport(reportType) {
    const formMap = {
        'actividades-por-region-comunidad': 'form-actividades-por-region-comunidad',
        'beneficiarios-por-region-comunidad': 'form-beneficiarios-por-region-comunidad',
        'actividad-de-personal': 'form-actividad-de-personal',
        'avances-eventos-generales': 'form-avances-eventos-generales',
        'reporte-evento-individual': 'form-reporte-evento-individual'
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
        
        // Cargar tipos de actividad
        await loadTiposActividad(reportType);
        
        // Cargar eventos si es el reporte de beneficiarios
        if (reportType === 'beneficiarios-por-region-comunidad') {
            await loadEventos();
            // Configurar buscador de eventos
            setupEventoSearchBeneficiarios();
        }
        
        // Configurar switches
        setupSwitches(reportType);
        
        // Configurar selectores de período
        setupPeriodSelectors(reportType);
        
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

// Cargar tipos de actividad
async function loadTiposActividad(reportType) {
    try {
        const response = await fetch('/api/tipos-actividad/');
        if (response.ok) {
            const tipos = await response.json();
            const selectId = reportType === 'actividades-por-region-comunidad' 
                ? 'filterTipoActividadActividades'
                : 'filterTipoActividadBeneficiarios';
            const select = document.getElementById(selectId);
            
            if (select) {
                // Limpiar opciones existentes
                select.innerHTML = '';
                
                // Agregar opciones de tipos de actividad
                tipos.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.nombre;
                    option.textContent = tipo.nombre;
                    select.appendChild(option);
                });
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
        const estadosSeleccionados = Array.from(
            document.querySelectorAll('#filterEstadoActividades input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        // Obtener tipos de actividad seleccionados
        const tiposActividadSeleccionados = Array.from(
            document.getElementById('filterTipoActividadActividades').selectedOptions
        ).map(opt => opt.value).filter(v => v);
        
        filters = {
            agrupar_por: document.getElementById('switchAgruparActividades').checked ? 'comunidad' : 'region',
            periodo: document.getElementById('filterPeriodoActividades').value,
            fecha_inicio: document.getElementById('filterFechaInicioActividades').value,
            fecha_fin: document.getElementById('filterFechaFinActividades').value,
            comunidades: selectedComunidades.actividades,
            estado: estadosSeleccionados.length > 0 ? estadosSeleccionados : ['planificado', 'en_progreso', 'completado', 'cancelado'],
            tipo_actividad: tiposActividadSeleccionados
        };
    } else if (reportType === 'beneficiarios-por-region-comunidad') {
        // Obtener tipos de actividad seleccionados
        const tiposActividadSeleccionados = Array.from(
            document.getElementById('filterTipoActividadBeneficiarios').selectedOptions
        ).map(opt => opt.value).filter(v => v);
        
        // Obtener tipos de beneficiario seleccionados
        const tiposBeneficiarioSeleccionados = Array.from(
            document.querySelectorAll('#filterTipoBeneficiarioBeneficiarios input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        filters = {
            agrupar_por: document.getElementById('switchAgruparBeneficiarios').checked ? 'comunidad' : 'region',
            periodo: document.getElementById('filterPeriodoBeneficiarios').value,
            fecha_inicio: document.getElementById('filterFechaInicioBeneficiarios').value,
            fecha_fin: document.getElementById('filterFechaFinBeneficiarios').value,
            comunidades: selectedComunidades.beneficiarios,
            evento: Array.from(document.querySelectorAll('#filterEventosBeneficiarios input[type="checkbox"]:checked')).map(cb => cb.value),
            tipo_actividad: tiposActividadSeleccionados,
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
    }
    
    currentFilters = filters;
    generateReport(reportType, filters);
}

// Resetear filtros del formulario específico
function resetFiltersForm(reportType) {
    if (reportType === 'actividades-por-region-comunidad') {
        document.getElementById('switchAgruparActividades').checked = false;
        document.getElementById('switchLabelActividades').textContent = 'Región';
        document.getElementById('filterPeriodoActividades').value = 'ultimo_mes';
        document.getElementById('dateRangeActividades').style.display = 'none';
        document.getElementById('filterFechaInicioActividades').value = '';
        document.getElementById('filterFechaFinActividades').value = '';
        document.getElementById('searchComunidadActividades').value = '';
        
        // Resetear checkboxes de estado (todos marcados)
        document.querySelectorAll('#filterEstadoActividades input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        // Resetear selector de tipo de actividad
        document.getElementById('filterTipoActividadActividades').selectedIndex = -1;
        
        selectedComunidades.actividades = [];
        const selectedContainer = document.querySelector('#searchResultsActividades').parentElement.querySelector('.selected-comunidades');
        if (selectedContainer) selectedContainer.remove();
    } else if (reportType === 'beneficiarios-por-region-comunidad') {
        document.getElementById('switchAgruparBeneficiarios').checked = false;
        document.getElementById('switchLabelBeneficiarios').textContent = 'Región';
        document.getElementById('filterPeriodoBeneficiarios').value = 'ultimo_mes';
        document.getElementById('dateRangeBeneficiarios').style.display = 'none';
        document.getElementById('filterFechaInicioBeneficiarios').value = '';
        document.getElementById('filterFechaFinBeneficiarios').value = '';
        document.getElementById('searchComunidadBeneficiarios').value = '';
        // Limpiar selecciones de eventos
        selectedEventosBeneficiarios = [];
        updateSelectedEventosBeneficiariosTags();
        document.getElementById('searchEventoBeneficiarios').value = '';
        renderEventosBeneficiariosChecklist();
        
        // Resetear selector de tipo de actividad
        document.getElementById('filterTipoActividadBeneficiarios').selectedIndex = -1;
        
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
                if (filters.estado && filters.estado.length > 0) {
                    params.append('estado', filters.estado.join(','));
                }
                if (filters.tipo_actividad && filters.tipo_actividad.length > 0) {
                    params.append('tipo_actividad', filters.tipo_actividad.join(','));
                }
            }
            
            // Filtros específicos para beneficiarios
            if (reportType === 'beneficiarios-por-region-comunidad') {
                if (filters.evento) params.append('evento', filters.evento);
                if (filters.tipo_actividad && filters.tipo_actividad.length > 0) {
                    params.append('tipo_actividad', filters.tipo_actividad.join(','));
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
    html += '<th>Responsables</th>';
    html += '</tr></thead><tbody>';
    
    let todasLasActividades = [];
    
    data.forEach(item => {
        html += '<tr>';
        html += `<td data-label="Región/Comunidad"><span class="cell-value">${escapeHtml(item.nombre || '-')}</span></td>`;
        html += `<td data-label="Total Actividades"><span class="cell-value">${item.total_actividades || 0}</span></td>`;
        html += `<td data-label="Total Beneficiarios"><span class="cell-value">${item.total_beneficiarios || 0}</span></td>`;
        html += `<td data-label="Beneficiarios Individuales"><span class="cell-value">${item.beneficiarios_individuales || 0}</span></td>`;
        html += `<td data-label="Beneficiarios Familias"><span class="cell-value">${item.beneficiarios_familias || 0}</span></td>`;
        html += `<td data-label="Beneficiarios Instituciones"><span class="cell-value">${item.beneficiarios_instituciones || 0}</span></td>`;
        html += `<td data-label="Responsables"><span class="cell-value">${escapeHtml(item.responsables || '-')}</span></td>`;
        html += '</tr>';
        
        // Acumular actividades para la tabla de detalles
        if (item.actividades && Array.isArray(item.actividades)) {
            todasLasActividades = todasLasActividades.concat(item.actividades);
        }
    });
    
    html += '</tbody></table></div>';
    
    // Agregar tabla expandible con detalles de actividades
    if (todasLasActividades.length > 0) {
        html += '<div style="margin-top: 32px;"><h3 style="color: var(--text-100); margin-bottom: 16px;">Detalles de Actividades</h3>';
        html += '<div class="table-responsive-wrapper"><table class="results-table"><thead><tr>';
        html += '<th>Nombre</th>';
        html += '<th>Fecha</th>';
        html += '<th>Estado</th>';
        html += '<th>Comunidad</th>';
        html += '<th>Responsable</th>';
        html += '<th>Total Beneficiarios</th>';
        html += '</tr></thead><tbody>';
        
        todasLasActividades.forEach(actividad => {
            html += '<tr>';
            html += `<td data-label="Nombre"><span class="cell-value">${escapeHtml(actividad.nombre || '-')}</span></td>`;
            html += `<td data-label="Fecha"><span class="cell-value">${actividad.fecha || '-'}</span></td>`;
            html += `<td data-label="Estado"><span class="status-badge status-${actividad.estado || 'planificado'}">${formatEstado(actividad.estado)}</span></td>`;
            html += `<td data-label="Comunidad"><span class="cell-value">${escapeHtml(actividad.comunidad || '-')}</span></td>`;
            html += `<td data-label="Responsable"><span class="cell-value">${escapeHtml(actividad.responsable || '-')}</span></td>`;
            html += `<td data-label="Total Beneficiarios"><span class="cell-value">${actividad.total_beneficiarios || 0}</span></td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table></div></div>';
    }
    
    resultsContainer.innerHTML = html;
}

// Renderizar reporte de beneficiarios (con mejoras)
function renderBeneficiariosReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    let html = '<div class="table-responsive-wrapper"><table class="results-table"><thead><tr>';
    html += '<th>Nombre</th>';
    html += '<th>Tipo</th>';
    html += '<th>Comunidad</th>';
    html += '<th>Región</th>';
    html += '<th>DPI/Documento</th>';
    html += '<th>Teléfono</th>';
    html += '<th>Email</th>';
    html += '<th>Evento</th>';
    html += '</tr></thead><tbody>';
    
    data.forEach(item => {
        html += '<tr>';
        html += `<td data-label="Nombre"><span class="cell-value">${escapeHtml(item.nombre || '-')}</span></td>`;
        html += `<td data-label="Tipo"><span class="cell-value">${escapeHtml(item.tipo || '-')}</span></td>`;
        html += `<td data-label="Comunidad"><span class="cell-value">${escapeHtml(item.comunidad || '-')}</span></td>`;
        html += `<td data-label="Región"><span class="cell-value">${escapeHtml(item.region || '-')}</span></td>`;
        html += `<td data-label="DPI/Documento"><span class="cell-value">${escapeHtml(item.dpi || item.documento || '-')}</span></td>`;
        html += `<td data-label="Teléfono"><span class="cell-value">${escapeHtml(item.telefono || '-')}</span></td>`;
        html += `<td data-label="Email"><span class="cell-value">${escapeHtml(item.email || '-')}</span></td>`;
        html += `<td data-label="Evento"><span class="cell-value">${escapeHtml(item.evento || '-')}</span></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
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
            html += `<div style="color: var(--text-100); font-weight: 500; margin-bottom: 4px;">${escapeHtml(cambio.descripcion || 'Sin descripción')}</div>`;
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

