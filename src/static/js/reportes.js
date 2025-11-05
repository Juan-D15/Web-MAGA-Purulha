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
    
    // Cargar datos específicos del formulario
    loadFormData(reportType);
    
    // Resetear filtros
    resetFiltersForm(reportType);
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
        'beneficiarios-por-region-comunidad': 'form-beneficiarios-por-region-comunidad'
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
        }
        
        // Configurar switches
        setupSwitches(reportType);
        
        // Configurar selectores de período
        setupPeriodSelectors(reportType);
        
        // Configurar buscadores de comunidades
        setupComunidadSearch(reportType);
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

// Cargar eventos
async function loadEventos() {
    try {
        const response = await fetch('/api/actividades/');
        if (response.ok) {
            const eventos = await response.json();
            const select = document.getElementById('filterEventoBeneficiarios');
            select.innerHTML = '<option value="">Todos los eventos</option>';
            eventos.forEach(evento => {
                const option = document.createElement('option');
                option.value = evento.id;
                option.textContent = evento.nombre || 'Sin nombre';
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
    }
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
            evento: document.getElementById('filterEventoBeneficiarios').value,
            tipo_actividad: tiposActividadSeleccionados,
            tipo_beneficiario: tiposBeneficiarioSeleccionados.length > 0 ? tiposBeneficiarioSeleccionados : ['individual', 'familia', 'institución', 'otro']
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
        document.getElementById('filterEventoBeneficiarios').value = '';
        
        // Resetear selector de tipo de actividad
        document.getElementById('filterTipoActividadBeneficiarios').selectedIndex = -1;
        
        // Resetear checkboxes de tipo de beneficiario (todos marcados)
        document.querySelectorAll('#filterTipoBeneficiarioBeneficiarios input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        selectedComunidades.beneficiarios = [];
        const selectedContainer = document.querySelector('#searchResultsBeneficiarios').parentElement.querySelector('.selected-comunidades');
        if (selectedContainer) selectedContainer.remove();
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
            
            if (filters.periodo === 'ultimo_mes') {
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
    } else {
        // Renderizado genérico para otros reportes
        renderGenericReport(data.data);
    }
}

// Renderizar reporte de actividades (con mejoras)
function renderActividadesReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    let html = '<table class="results-table"><thead><tr>';
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
        html += `<td>${escapeHtml(item.nombre || '-')}</td>`;
        html += `<td>${item.total_actividades || 0}</td>`;
        html += `<td>${item.total_beneficiarios || 0}</td>`;
        html += `<td>${item.beneficiarios_individuales || 0}</td>`;
        html += `<td>${item.beneficiarios_familias || 0}</td>`;
        html += `<td>${item.beneficiarios_instituciones || 0}</td>`;
        html += `<td>${escapeHtml(item.responsables || '-')}</td>`;
        html += '</tr>';
        
        // Acumular actividades para la tabla de detalles
        if (item.actividades && Array.isArray(item.actividades)) {
            todasLasActividades = todasLasActividades.concat(item.actividades);
        }
    });
    
    html += '</tbody></table>';
    
    // Agregar tabla expandible con detalles de actividades
    if (todasLasActividades.length > 0) {
        html += '<div style="margin-top: 32px;"><h3 style="color: var(--text-100); margin-bottom: 16px;">Detalles de Actividades</h3>';
        html += '<table class="results-table"><thead><tr>';
        html += '<th>Nombre</th>';
        html += '<th>Fecha</th>';
        html += '<th>Estado</th>';
        html += '<th>Comunidad</th>';
        html += '<th>Responsable</th>';
        html += '<th>Total Beneficiarios</th>';
        html += '</tr></thead><tbody>';
        
        todasLasActividades.forEach(actividad => {
            html += '<tr>';
            html += `<td>${escapeHtml(actividad.nombre || '-')}</td>`;
            html += `<td>${actividad.fecha || '-'}</td>`;
            html += `<td><span class="status-badge status-${actividad.estado || 'planificado'}">${formatEstado(actividad.estado)}</span></td>`;
            html += `<td>${escapeHtml(actividad.comunidad || '-')}</td>`;
            html += `<td>${escapeHtml(actividad.responsable || '-')}</td>`;
            html += `<td>${actividad.total_beneficiarios || 0}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
    }
    
    resultsContainer.innerHTML = html;
}

// Renderizar reporte de beneficiarios (con mejoras)
function renderBeneficiariosReport(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    let html = '<table class="results-table"><thead><tr>';
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
        html += `<td>${escapeHtml(item.nombre || '-')}</td>`;
        html += `<td>${escapeHtml(item.tipo || '-')}</td>`;
        html += `<td>${escapeHtml(item.comunidad || '-')}</td>`;
        html += `<td>${escapeHtml(item.region || '-')}</td>`;
        html += `<td>${escapeHtml(item.dpi || item.documento || '-')}</td>`;
        html += `<td>${escapeHtml(item.telefono || '-')}</td>`;
        html += `<td>${escapeHtml(item.email || '-')}</td>`;
        html += `<td>${escapeHtml(item.evento || '-')}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
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

