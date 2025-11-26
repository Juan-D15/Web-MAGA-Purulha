// ======================================
// GESTIÓN DE BENEFICIARIOS - MAGA PURULHÁ
// ======================================

// Variables globales
let currentView = 'main';
let beneficiariosData = [];
let proyectosData = [];
let comunidadesData = [];
let regionesData = [];
let eventosData = [];
let beneficiariosPendientesExcel = [];
let beneficiariosPendientesExcelGeneral = []; // Beneficiarios importados de Excel pendientes de guardar (modal general)
let selectedProjects = new Set();
let filters = {
    tipoBeneficiario: ['individual', 'familia', 'institución', 'otro'],
    comunidad: [],
    evento: []
};
let allComunidades = [];
let selectedComunidadId = null; // ID de la comunidad seleccionada
let sortOrder = 'reciente';
let searchQuery = '';
let regionesList = []; // Lista de regiones para el catálogo
let comunidadesList = []; // Lista de comunidades para el catálogo
let benefCatalogItems = []; // Items del catálogo (regiones + comunidades)
let benefCatalogState = {
    filtered: [],
    activeIndex: -1
};

// Funciones de utilidad
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

function mostrarMensaje(tipo, mensaje) {
    // Crear elemento de mensaje
    const mensajeEl = document.createElement('div');
    mensajeEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    mensajeEl.textContent = mensaje;
    document.body.appendChild(mensajeEl);
    
    setTimeout(() => {
        mensajeEl.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => mensajeEl.remove(), 300);
    }, 3000);
}

// Navegación entre vistas
function showView(viewName) {
    console.log('showView llamado con:', viewName);
    
    const mainView = document.getElementById('mainView');
    const addView = document.getElementById('addBeneficiaryView');
    const listView = document.getElementById('listBeneficiariesView');
    
    console.log('Vistas encontradas:', {
        mainView: !!mainView,
        addView: !!addView,
        listView: !!listView
    });
    
    // Ocultar todas las vistas
    if (mainView) mainView.style.display = 'none';
    if (addView) addView.style.display = 'none';
    if (listView) listView.style.display = 'none';
    
    // Mostrar la vista seleccionada con animación
    if (viewName === 'mainView' && mainView) {
        mainView.style.display = 'block';
        mainView.style.animation = 'slideInFromRight 0.4s ease-out';
        console.log('Mostrando vista principal');
    } else if (viewName === 'addBeneficiaryView' && addView) {
        addView.style.display = 'block';
        addView.style.animation = 'slideInFromLeft 0.4s ease-out';
        console.log('Mostrando vista de agregar beneficiario');
        initializeAddView();
    } else if (viewName === 'listBeneficiariesView' && listView) {
        listView.style.display = 'block';
        listView.style.animation = 'slideInFromLeft 0.4s ease-out';
        console.log('Mostrando vista de listado');
        loadBeneficiariosList();
    } else {
        console.error('Vista no encontrada o nombre incorrecto:', viewName);
    }
    
    currentView = viewName;
}

function initializeAddView() {
    // Resetear formulario
    const form = document.getElementById('beneficiaryForm');
    if (form) form.reset();
    
    // Limpiar campo de búsqueda de catálogo
    const catalogInput = document.getElementById('benef_nuevo_catalog_input');
    const catalogClear = document.getElementById('benef_nuevo_catalog_clear');
    if (catalogInput) catalogInput.value = '';
    if (catalogClear) catalogClear.style.display = 'none';
    ocultarSugerenciasCatalogo();
    selectedComunidadId = null;
    
    // Ocultar todos los campos
    hideAllBeneficiaryFields();
    
    // Resetear modo
    setBeneficiaryMode('nuevo');
    
    // Cargar regiones, todas las comunidades y proyectos
    // Esperar un poco para asegurar que el DOM esté listo
    setTimeout(() => {
        asegurarDatosRegionesComunidades();
        loadProyectos();
        setupCatalogSearch(); // Configurar buscador de catálogo
    }, 100);
    
    // Limpiar selección de proyectos
    selectedProjects.clear();
    updateProjectsChecklist();
    updateSelectedProjectsCount();
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Beneficiarios: Inicializando módulo...');
    
    // Botones de navegación principal
    const openAddBtn = document.getElementById('openAddBeneficiaryBtn');
    const openListBtn = document.getElementById('openListBeneficiariesBtn');
    const backFromAddBtn = document.getElementById('backFromAddBeneficiaryBtn');
    const backFromListBtn = document.getElementById('backFromListBeneficiariesBtn');
    
    console.log('Botones encontrados:', {
        openAddBtn: !!openAddBtn,
        openListBtn: !!openListBtn,
        backFromAddBtn: !!backFromAddBtn,
        backFromListBtn: !!backFromListBtn
    });
    
    if (openAddBtn) {
        openAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Click en Agregar Beneficiario');
            showView('addBeneficiaryView');
        });
    } else {
        console.error('No se encontró el botón openAddBeneficiaryBtn');
    }
    
    if (openListBtn) {
        openListBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Click en Ver Listado');
            showView('listBeneficiariesView');
        });
    } else {
        console.error('No se encontró el botón openListBeneficiariesBtn');
    }
    
    if (backFromAddBtn) {
        backFromAddBtn.addEventListener('click', () => showView('mainView'));
    }
    
    if (backFromListBtn) {
        backFromListBtn.addEventListener('click', () => showView('mainView'));
    }
    
    // Modal de detalles
    const closeModalBtn = document.getElementById('closeBeneficiaryDetailsModal');
    const closeModalBtn2 = document.getElementById('closeBeneficiaryDetailsBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeBeneficiaryDetailsModal);
    }
    if (closeModalBtn2) {
        closeModalBtn2.addEventListener('click', closeBeneficiaryDetailsModal);
    }
    
    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('beneficiaryDetailsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeBeneficiaryDetailsModal();
            }
        });
    }
    
    // Inicializar formulario de agregar beneficiario
    initializeBeneficiaryForm();
    
    // Inicializar listado
    initializeListado();
    
    // Inicializar modal de importación Excel general
    initializeImportExcelGeneral();
});

// ======================================
// FORMULARIO DE AGREGAR BENEFICIARIO
// ======================================

function initializeBeneficiaryForm() {
    // Modo toggle (nuevo/existente)
    const modeButtons = document.querySelectorAll('.benef-mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            setBeneficiaryMode(mode);
        });
    });
    
    // Tipo de beneficiario
    const tipoSelect = document.getElementById('benef_tipo');
    const useExcelImportCheckbox = document.getElementById('useExcelImportCheckbox');
    const excelToggleSection = document.getElementById('excel_toggle_section');
    const excelImportSection = document.getElementById('excel_import_section');
    const formFieldsContainer = document.getElementById('formFieldsContainer');
    
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            hideAllBeneficiaryFields();
            const tipo = this.value;
            
            // Mostrar/ocultar toggle de Excel (solo para individual)
            if (excelToggleSection) {
                excelToggleSection.style.display = tipo === 'individual' ? 'block' : 'none';
            }
            
            // Si no es individual, ocultar sección Excel y desactivar checkbox
            if (tipo !== 'individual') {
                if (excelImportSection) excelImportSection.style.display = 'none';
                if (excelToggleSection) excelToggleSection.style.display = 'none';
                if (useExcelImportCheckbox) {
                    useExcelImportCheckbox.checked = false;
                }
                if (formFieldsContainer) formFieldsContainer.style.display = 'block';
                // Limpiar beneficiarios pendientes de Excel
                beneficiariosPendientesExcel = [];
                actualizarContadorPendientes();
            } else {
                // Si es individual, asegurar que el toggle esté visible
                if (excelToggleSection) {
                    excelToggleSection.style.display = 'block';
                }
                // Si el checkbox está activado, mostrar Excel y ocultar campos
                if (useExcelImportCheckbox && useExcelImportCheckbox.checked) {
                    if (formFieldsContainer) formFieldsContainer.style.display = 'none';
                    if (excelImportSection) excelImportSection.style.display = 'block';
                } else {
                    // Si no está activado, mostrar campos y ocultar Excel
                    if (formFieldsContainer) formFieldsContainer.style.display = 'block';
                    if (excelImportSection) excelImportSection.style.display = 'none';
                }
            }
            
            // Mostrar campos según tipo
            if (tipo === 'individual') {
                document.getElementById('campos_individual').style.display = 'block';
            } else if (tipo === 'familia') {
                document.getElementById('campos_familia').style.display = 'block';
            } else if (tipo === 'institución') {
                document.getElementById('campos_institucion').style.display = 'block';
            } else if (tipo === 'otro') {
                document.getElementById('campos_otro').style.display = 'block';
            }
        });
    }
    
    // Toggle para importar desde Excel
    if (useExcelImportCheckbox) {
        useExcelImportCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            console.log('Toggle Excel cambiado:', isChecked);
            console.log('formFieldsContainer:', formFieldsContainer);
            console.log('excelImportSection:', excelImportSection);
            
            if (isChecked) {
                // Ocultar campos del formulario
                if (formFieldsContainer) {
                    formFieldsContainer.style.display = 'none';
                    console.log('Campos del formulario ocultados');
                }
                // Mostrar sección Excel
                if (excelImportSection) {
                    excelImportSection.style.display = 'block';
                    console.log('Sección Excel mostrada');
                } else {
                    console.error('No se encontró excelImportSection');
                }
                // Asegurar que la sección de proyectos y botones estén visibles
                const projectSection = document.getElementById('projectSelectionSection');
                const projectCheckbox = document.getElementById('addToProjectCheckbox');
                const formActions = document.querySelector('.form-actions');
                if (projectCheckbox && projectCheckbox.parentElement) {
                    projectCheckbox.parentElement.style.display = 'block';
                }
                if (formActions) {
                    formActions.style.display = 'flex';
                }
            } else {
                // Mostrar campos del formulario
                if (formFieldsContainer) {
                    formFieldsContainer.style.display = 'block';
                    console.log('Campos del formulario mostrados');
                }
                // Ocultar sección Excel
                if (excelImportSection) {
                    excelImportSection.style.display = 'none';
                    console.log('Sección Excel ocultada');
                }
                // Asegurar que la sección de proyectos y botones estén visibles
                const projectCheckbox = document.getElementById('addToProjectCheckbox');
                const formActions = document.querySelector('.form-actions');
                if (projectCheckbox && projectCheckbox.parentElement) {
                    projectCheckbox.parentElement.style.display = 'block';
                }
                if (formActions) {
                    formActions.style.display = 'flex';
                }
                // Limpiar beneficiarios pendientes
                beneficiariosPendientesExcel = [];
                actualizarContadorPendientes();
                // Limpiar archivo Excel
                const excelFileInput = document.getElementById('excelFileInput');
                const excelFileInfo = document.getElementById('excelFileInfo');
                const excelImportStatus = document.getElementById('excelImportStatus');
                if (excelFileInput) excelFileInput.value = '';
                if (excelFileInfo) excelFileInfo.style.display = 'none';
                if (excelImportStatus) {
                    excelImportStatus.style.display = 'none';
                    excelImportStatus.innerHTML = '';
                }
            }
        });
    } else {
        console.error('No se encontró useExcelImportCheckbox');
    }
    
    // Checkbox para agregar a proyecto
    const addToProjectCheckbox = document.getElementById('addToProjectCheckbox');
    const projectSection = document.getElementById('projectSelectionSection');
    
    if (addToProjectCheckbox && projectSection) {
        addToProjectCheckbox.addEventListener('change', function() {
            projectSection.style.display = this.checked ? 'block' : 'none';
            if (this.checked) {
                loadProyectos();
            }
        });
    }
    
    // Buscador de proyectos
    const projectSearchInput = document.getElementById('projectSearchInput');
    if (projectSearchInput) {
        projectSearchInput.addEventListener('input', function() {
            filterProjectsChecklist(this.value);
        });
    }
    
    // Botón guardar
    const saveBtn = document.getElementById('saveBeneficiaryBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveBeneficiary);
    }
    
    // Botón cancelar
    const cancelBtn = document.getElementById('cancelBeneficiaryBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            resetBeneficiaryForm();
            showView('mainView');
        });
    }
    
    // Descargar plantilla Excel
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', function() {
            window.location.href = '/api/beneficiarios/descargar-plantilla/';
        });
    }
    
    // Importar Excel
    const excelFileInput = document.getElementById('excelFileInput');
    if (excelFileInput) {
        excelFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                importarBeneficiariosExcel(file);
            }
        });
    }
    
    // Cargar regiones
    loadRegiones();
}

function setBeneficiaryMode(mode) {
    const nuevoSection = document.getElementById('benef_nuevo_section');
    const existenteSection = document.getElementById('benef_existente_section');
    const modeButtons = document.querySelectorAll('.benef-mode-btn');
    
    modeButtons.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
            btn.style.background = 'rgba(76, 175, 80, 0.2)';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255,255,255,0.05)';
        }
    });
    
    if (mode === 'nuevo') {
        if (nuevoSection) nuevoSection.style.display = 'block';
        if (existenteSection) existenteSection.style.display = 'none';
    } else {
        if (nuevoSection) nuevoSection.style.display = 'none';
        if (existenteSection) existenteSection.style.display = 'block';
        // Inicializar búsqueda de beneficiarios existentes
        // Esperar un poco para asegurar que el DOM esté listo
        setTimeout(() => {
            initializeBeneficiariosExistentes();
            // Realizar búsqueda inicial si hay filtros aplicados
            buscarBeneficiariosExistentes();
        }, 100);
    }
}

function hideAllBeneficiaryFields() {
    const campos = ['campos_individual', 'campos_familia', 'campos_institucion', 'campos_otro'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function resetBeneficiaryForm() {
    // Resetear formulario
    const form = document.getElementById('beneficiaryForm');
    if (form) {
        form.reset();
    }
    
    // Limpiar campo de búsqueda de catálogo
    const catalogInput = document.getElementById('benef_nuevo_catalog_input');
    const catalogClear = document.getElementById('benef_nuevo_catalog_clear');
    if (catalogInput) catalogInput.value = '';
    if (catalogClear) catalogClear.style.display = 'none';
    ocultarSugerenciasCatalogo();
    selectedComunidadId = null;
    
    // Resetear selects de región y comunidad
    const regionSelect = document.getElementById('benef_region_select');
    const comunidadSelect = document.getElementById('benef_comunidad_select');
    if (regionSelect) {
        regionSelect.value = '';
        // Limpiar opciones excepto la primera
        while (regionSelect.options.length > 1) {
            regionSelect.remove(1);
        }
    }
    if (comunidadSelect) {
        comunidadSelect.value = '';
        // Limpiar opciones excepto la primera
        while (comunidadSelect.options.length > 1) {
            comunidadSelect.remove(1);
        }
    }
    
    // Ocultar todos los campos
    hideAllBeneficiaryFields();
    
    // Resetear modo
    setBeneficiaryMode('nuevo');
    
    // Limpiar selección de proyectos
    selectedProjects.clear();
    updateSelectedProjectsCount();
    const projectSection = document.getElementById('projectSelectionSection');
    if (projectSection) projectSection.style.display = 'none';
    const addToProjectCheckbox = document.getElementById('addToProjectCheckbox');
    if (addToProjectCheckbox) addToProjectCheckbox.checked = false;
    
    // Limpiar checklist de proyectos
    const projectsChecklist = document.getElementById('projectsChecklist');
    if (projectsChecklist) {
        projectsChecklist.innerHTML = '';
    }
}

async function loadRegiones() {
    try {
        const response = await fetch('/api/regiones/');
        if (!response.ok) {
            throw new Error('Error al cargar regiones');
        }
        const data = await response.json();
        // La API devuelve un array directo, no un objeto con success
        if (Array.isArray(data)) {
            regionesData = data;
            populateRegionSelect();
        } else {
            console.error('Formato de respuesta inesperado:', data);
        }
    } catch (error) {
        console.error('Error cargando regiones:', error);
        mostrarMensaje('error', 'Error al cargar regiones');
    }
}

let regionSelectListenerAdded = false;

function populateRegionSelect() {
    const regionSelect = document.getElementById('benef_region_select');
    if (!regionSelect) return;
    
    // Limpiar opciones existentes (excepto la primera)
    while (regionSelect.options.length > 1) {
        regionSelect.remove(1);
    }
    
    regionesData.forEach(region => {
        const option = document.createElement('option');
        option.value = region.id;
        option.textContent = region.nombre;
        regionSelect.appendChild(option);
    });
    
    // Agregar event listener solo una vez
    if (!regionSelectListenerAdded) {
        regionSelect.addEventListener('change', function() {
            const regionId = this.value;
            if (regionId) {
                // Actualizar el select de comunidades con las comunidades de la región seleccionada
                renderBeneficiaryCommunityOptions(regionId, '');
            } else {
                // Limpiar comunidades si no hay región seleccionada
                const comunidadSelect = document.getElementById('benef_comunidad_select');
                if (comunidadSelect) {
                    while (comunidadSelect.options.length > 1) {
                        comunidadSelect.remove(1);
                    }
                    comunidadSelect.value = '';
                }
                // Limpiar buscador de catálogo
                const catalogInput = document.getElementById('benef_nuevo_catalog_input');
                if (catalogInput) catalogInput.value = '';
                ocultarSugerenciasCatalogo();
            }
        });
        regionSelectListenerAdded = true;
    }
}

async function asegurarDatosRegionesComunidades() {
    if (regionesList.length > 0 && comunidadesList.length > 0 && allComunidades.length > 0) {
        reconstruirCatalogoBusquedaBeneficiarios();
        return Promise.resolve();
    }
    try {
        if (comunidadesList.length === 0 || allComunidades.length === 0) {
            const responseComunidades = await fetch('/api/comunidades/');
            if (responseComunidades.ok) {
                comunidadesList = await responseComunidades.json();
                // Formatear para allComunidades con region_nombre
                allComunidades = comunidadesList.map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    region_id: c.region ? c.region.id : null,
                    region_nombre: c.region ? c.region.nombre : null,
                    codigo: c.codigo || ''
                }));
                console.log(`✅ Cargadas ${allComunidades.length} comunidades para búsqueda`);
            }
        }
        if (regionesList.length === 0) {
            const responseRegiones = await fetch('/api/regiones/');
            if (responseRegiones.ok) {
                regionesList = await responseRegiones.json();
                regionesList.sort((a, b) => {
                    const codeA = parseInt(a.codigo, 10);
                    const codeB = parseInt(b.codigo, 10);
                    const hasCodeA = !Number.isNaN(codeA);
                    const hasCodeB = !Number.isNaN(codeB);
                    if (hasCodeA && hasCodeB) return codeA - codeB;
                    if (hasCodeA) return -1;
                    if (hasCodeB) return 1;
                    return (a.nombre || '').localeCompare(b.nombre || '', 'es');
                });
                regionesData = regionesList; // Mantener compatibilidad
                populateRegionSelect();
            }
        }
        reconstruirCatalogoBusquedaBeneficiarios();
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

function reconstruirCatalogoBusquedaBeneficiarios() {
    benefCatalogItems = [];
    benefCatalogState.filtered = [];
    benefCatalogState.activeIndex = -1;
    
    // Agregar regiones al catálogo
    regionesList.forEach(region => {
        if (!region || region.id == null) return;
        
        const label = region.comunidad_sede
            ? `${region.nombre} — ${region.comunidad_sede}`
            : region.nombre || `Región ${region.id}`;
        
        benefCatalogItems.push({
            type: 'region',
            id: String(region.id),
            regionId: String(region.id),
            label,
            searchIndex: `${region.nombre || ''} ${region.comunidad_sede || ''}`.toLowerCase()
        });
    });
    
    // Agregar comunidades al catálogo
    comunidadesList.forEach(comunidad => {
        if (!comunidad || comunidad.id == null) return;
        
        const regionId = comunidad.region && comunidad.region.id != null
            ? comunidad.region.id
            : (comunidad.region_id != null ? comunidad.region_id : null);
        
        const regionObj = regionId ? regionesList.find(r => String(r.id) === String(regionId)) : null;
        const regionNombre = regionObj ? regionObj.nombre : (comunidad.region && comunidad.region.nombre ? comunidad.region.nombre : '');
        
        const label = regionNombre
            ? `${comunidad.nombre} (${regionNombre})`
            : comunidad.nombre || `Comunidad ${comunidad.id}`;
        
        benefCatalogItems.push({
            type: 'community',
            id: String(comunidad.id),
            regionId: regionId != null ? String(regionId) : '',
            label,
            searchIndex: `${comunidad.nombre || ''} ${regionNombre || ''}`.toLowerCase()
        });
    });
    
    benefCatalogItems.sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
}

function setupCatalogSearch() {
    const catalogInput = document.getElementById('benef_nuevo_catalog_input');
    const catalogSuggestions = document.getElementById('benef_nuevo_catalog_suggestions');
    const catalogClear = document.getElementById('benef_nuevo_catalog_clear');
    
    if (!catalogInput || !catalogSuggestions) return;
    
    // Event listener para búsqueda
    catalogInput.addEventListener('input', function() {
        mostrarSugerenciasCatalogo(this.value);
        if (catalogClear) {
            catalogClear.style.display = this.value.trim() ? 'flex' : 'none';
        }
    });
    
    // Event listener para teclado
    catalogInput.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            moverSeleccionCatalogo(1);
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            moverSeleccionCatalogo(-1);
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (benefCatalogState.activeIndex >= 0 && benefCatalogState.filtered[benefCatalogState.activeIndex]) {
                e.preventDefault();
                seleccionarSugerenciaCatalogo(benefCatalogState.filtered[benefCatalogState.activeIndex]);
            } else {
                ocultarSugerenciasCatalogo();
            }
        } else if (e.key === 'Escape') {
            ocultarSugerenciasCatalogo();
        }
    });
    
    // Event listener para blur
    catalogInput.addEventListener('blur', function() {
        setTimeout(() => ocultarSugerenciasCatalogo(), 120);
        if (catalogClear) {
            catalogClear.style.display = this.value.trim() ? 'flex' : 'none';
        }
    });
    
    // Event listener para botón limpiar
    if (catalogClear) {
        catalogClear.addEventListener('click', function() {
            catalogInput.value = '';
            catalogClear.style.display = 'none';
            ocultarSugerenciasCatalogo();
        });
    }
}

function mostrarSugerenciasCatalogo(term) {
    const catalogSuggestions = document.getElementById('benef_nuevo_catalog_suggestions');
    if (!catalogSuggestions) return;
    
    const consulta = (term || '').trim().toLowerCase();
    catalogSuggestions.innerHTML = '';
    benefCatalogState.filtered = [];
    benefCatalogState.activeIndex = -1;
    
    if (consulta.length < 2) {
        catalogSuggestions.classList.remove('show');
        return;
    }
    
    benefCatalogState.filtered = benefCatalogItems
        .filter(item => item.searchIndex.includes(consulta))
        .slice(0, 10);
    
    if (benefCatalogState.filtered.length === 0) {
        catalogSuggestions.classList.remove('show');
        return;
    }
    
    const fragment = document.createDocumentFragment();
    benefCatalogState.filtered.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'input-suggestion-item';
        li.textContent = item.label;
        li.dataset.type = item.type;
        li.dataset.id = item.id;
        if (item.regionId) {
            li.dataset.regionId = item.regionId;
        }
        li.dataset.index = index;
        li.addEventListener('mousedown', (event) => {
            event.preventDefault();
            seleccionarSugerenciaCatalogo(item);
        });
        fragment.appendChild(li);
    });
    
    catalogSuggestions.appendChild(fragment);
    catalogSuggestions.classList.add('show');
    benefCatalogState.activeIndex = 0;
    const items = Array.from(catalogSuggestions.querySelectorAll('.input-suggestion-item'));
    if (items[0]) {
        items[0].classList.add('active');
    }
}

function moverSeleccionCatalogo(direction) {
    const catalogSuggestions = document.getElementById('benef_nuevo_catalog_suggestions');
    if (!catalogSuggestions || benefCatalogState.filtered.length === 0) return;
    
    const items = Array.from(catalogSuggestions.querySelectorAll('.input-suggestion-item'));
    if (items.length === 0) return;
    
    const currentIndex = benefCatalogState.activeIndex;
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) {
        newIndex = items.length - 1;
    } else if (newIndex >= items.length) {
        newIndex = 0;
    }
    
    if (items[currentIndex]) {
        items[currentIndex].classList.remove('active');
    }
    
    benefCatalogState.activeIndex = newIndex;
    if (items[newIndex]) {
        items[newIndex].classList.add('active');
        items[newIndex].scrollIntoView({ block: 'nearest' });
    }
}

function seleccionarSugerenciaCatalogo(item) {
    if (!item) return;
    
    const catalogInput = document.getElementById('benef_nuevo_catalog_input');
    const regionSelect = document.getElementById('benef_region_select');
    const comunidadSelect = document.getElementById('benef_comunidad_select');
    
    if (catalogInput) {
        catalogInput.value = item.label;
    }
    
    if (item.type === 'region') {
        // Asegurar que el select de región esté poblado
        if (regionSelect && regionSelect.options.length <= 1) {
            populateRegionSelect();
        }
        
        // Establecer la región seleccionada
        if (regionSelect) {
            regionSelect.value = item.id;
            // Disparar evento change para actualizar comunidades
            const changeEvent = new Event('change', { bubbles: true });
            regionSelect.dispatchEvent(changeEvent);
        }
        
        // Renderizar comunidades de esa región
        renderBeneficiaryCommunityOptions(item.id, '');
    } else if (item.type === 'community') {
        const regionId = item.regionId || '';
        
        // Asegurar que el select de región esté poblado
        if (regionSelect && regionSelect.options.length <= 1) {
            populateRegionSelect();
        }
        
        // Establecer la región seleccionada primero
        if (regionSelect && regionId) {
            regionSelect.value = regionId;
            // Disparar evento change para actualizar comunidades
            const changeEvent = new Event('change', { bubbles: true });
            regionSelect.dispatchEvent(changeEvent);
        }
        
        // Renderizar y seleccionar la comunidad
        // Usar setTimeout para asegurar que el select de región se haya actualizado
        setTimeout(() => {
            renderBeneficiaryCommunityOptions(regionId, item.id);
            
            // Asegurar que la comunidad esté seleccionada
            if (comunidadSelect) {
                comunidadSelect.value = item.id;
                // Disparar evento change para notificar la selección
                const changeEvent = new Event('change', { bubbles: true });
                comunidadSelect.dispatchEvent(changeEvent);
            }
        }, 50);
    }
    
    ocultarSugerenciasCatalogo();
}

function ocultarSugerenciasCatalogo() {
    const catalogSuggestions = document.getElementById('benef_nuevo_catalog_suggestions');
    if (catalogSuggestions) {
        catalogSuggestions.classList.remove('show');
        catalogSuggestions.innerHTML = '';
    }
    benefCatalogState.filtered = [];
    benefCatalogState.activeIndex = -1;
}

// Estado para el buscador de catálogo en el listado
let listadoCatalogState = {
    filtered: [],
    activeIndex: -1
};

function setupCatalogSearchListado() {
    const catalogInput = document.getElementById('searchComunidadListado');
    const catalogSuggestions = document.getElementById('searchComunidadListadoSuggestions');
    const catalogClear = document.getElementById('searchComunidadListadoClear');
    
    if (!catalogInput || !catalogSuggestions) return;
    
    // Asegurar que el catálogo esté construido
    if (benefCatalogItems.length === 0) {
        asegurarDatosRegionesComunidades();
    }
    
    // Event listener para búsqueda
    catalogInput.addEventListener('input', function() {
        mostrarSugerenciasCatalogoListado(this.value);
        if (catalogClear) {
            catalogClear.style.display = this.value.trim() ? 'flex' : 'none';
        }
    });
    
    // Event listener para teclado
    catalogInput.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            moverSeleccionCatalogoListado(1);
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            moverSeleccionCatalogoListado(-1);
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (listadoCatalogState.activeIndex >= 0 && listadoCatalogState.filtered[listadoCatalogState.activeIndex]) {
                e.preventDefault();
                seleccionarSugerenciaCatalogoListado(listadoCatalogState.filtered[listadoCatalogState.activeIndex]);
            } else {
                ocultarSugerenciasCatalogoListado();
            }
        } else if (e.key === 'Escape') {
            ocultarSugerenciasCatalogoListado();
        }
    });
    
    // Event listener para blur
    catalogInput.addEventListener('blur', function() {
        setTimeout(() => ocultarSugerenciasCatalogoListado(), 120);
        if (catalogClear) {
            catalogClear.style.display = this.value.trim() ? 'flex' : 'none';
        }
    });
    
    // Event listener para botón limpiar
    if (catalogClear) {
        catalogClear.addEventListener('click', function() {
            catalogInput.value = '';
            catalogClear.style.display = 'none';
            ocultarSugerenciasCatalogoListado();
        });
    }
}

function mostrarSugerenciasCatalogoListado(term) {
    const catalogSuggestions = document.getElementById('searchComunidadListadoSuggestions');
    if (!catalogSuggestions) return;
    
    const consulta = (term || '').trim().toLowerCase();
    catalogSuggestions.innerHTML = '';
    listadoCatalogState.filtered = [];
    listadoCatalogState.activeIndex = -1;
    
    if (consulta.length < 2) {
        catalogSuggestions.classList.remove('show');
        return;
    }
    
    listadoCatalogState.filtered = benefCatalogItems
        .filter(item => item.searchIndex.includes(consulta))
        .slice(0, 10);
    
    if (listadoCatalogState.filtered.length === 0) {
        catalogSuggestions.classList.remove('show');
        return;
    }
    
    const fragment = document.createDocumentFragment();
    listadoCatalogState.filtered.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'input-suggestion-item';
        li.textContent = item.label;
        li.dataset.type = item.type;
        li.dataset.id = item.id;
        if (item.regionId) {
            li.dataset.regionId = item.regionId;
        }
        li.dataset.index = index;
        li.addEventListener('mousedown', (event) => {
            event.preventDefault();
            seleccionarSugerenciaCatalogoListado(item);
        });
        fragment.appendChild(li);
    });
    
    catalogSuggestions.appendChild(fragment);
    catalogSuggestions.classList.add('show');
    listadoCatalogState.activeIndex = 0;
    const items = Array.from(catalogSuggestions.querySelectorAll('.input-suggestion-item'));
    if (items[0]) {
        items[0].classList.add('active');
    }
}

function moverSeleccionCatalogoListado(direction) {
    const catalogSuggestions = document.getElementById('searchComunidadListadoSuggestions');
    if (!catalogSuggestions || listadoCatalogState.filtered.length === 0) return;
    
    const items = Array.from(catalogSuggestions.querySelectorAll('.input-suggestion-item'));
    if (items.length === 0) return;
    
    const currentIndex = listadoCatalogState.activeIndex;
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) {
        newIndex = items.length - 1;
    } else if (newIndex >= items.length) {
        newIndex = 0;
    }
    
    if (items[currentIndex]) {
        items[currentIndex].classList.remove('active');
    }
    
    listadoCatalogState.activeIndex = newIndex;
    if (items[newIndex]) {
        items[newIndex].classList.add('active');
        items[newIndex].scrollIntoView({ block: 'nearest' });
    }
}

function seleccionarSugerenciaCatalogoListado(item) {
    if (!item) return;
    
    const catalogInput = document.getElementById('searchComunidadListado');
    
    if (item.type === 'community') {
        // Agregar la comunidad al filtro si no está ya agregada
        if (!filters.comunidad.includes(item.id)) {
            filters.comunidad.push(item.id);
            updateComunidadTags();
            applyFiltersAndSort();
        }
        
        // Limpiar el input
        if (catalogInput) {
            catalogInput.value = '';
        }
        const catalogClear = document.getElementById('searchComunidadListadoClear');
        if (catalogClear) {
            catalogClear.style.display = 'none';
        }
    } else if (item.type === 'region') {
        // Si es una región, agregar todas las comunidades de esa región
        const comunidadesRegion = allComunidades.filter(c => c.region_id === item.id);
        comunidadesRegion.forEach(com => {
            if (!filters.comunidad.includes(com.id)) {
                filters.comunidad.push(com.id);
            }
        });
        updateComunidadTags();
        applyFiltersAndSort();
        
        // Limpiar el input
        if (catalogInput) {
            catalogInput.value = '';
        }
        const catalogClear = document.getElementById('searchComunidadListadoClear');
        if (catalogClear) {
            catalogClear.style.display = 'none';
        }
    }
    
    ocultarSugerenciasCatalogoListado();
}

function ocultarSugerenciasCatalogoListado() {
    const catalogSuggestions = document.getElementById('searchComunidadListadoSuggestions');
    if (catalogSuggestions) {
        catalogSuggestions.classList.remove('show');
        catalogSuggestions.innerHTML = '';
    }
    listadoCatalogState.filtered = [];
    listadoCatalogState.activeIndex = -1;
}

function renderBeneficiaryCommunityOptions(regionId, selectedComunidadId) {
    const comunidadSelect = document.getElementById('benef_comunidad_select');
    if (!comunidadSelect) return;
    
    // Limpiar opciones existentes (excepto la primera)
    while (comunidadSelect.options.length > 1) {
        comunidadSelect.remove(1);
    }
    
    // Si no hay regionId, mostrar todas las comunidades
    let comunidadesFiltradas = [];
    if (regionId) {
        comunidadesFiltradas = comunidadesList.filter(com => {
            const comRegionId = com.region && com.region.id != null
                ? com.region.id
                : (com.region_id != null ? com.region_id : null);
            return String(comRegionId) === String(regionId);
        });
    } else {
        // Si no hay región, mostrar todas las comunidades
        comunidadesFiltradas = comunidadesList;
    }
    
    // Ordenar comunidades alfabéticamente
    comunidadesFiltradas.sort((a, b) => {
        const nombreA = (a.nombre || '').toLowerCase();
        const nombreB = (b.nombre || '').toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
    });
    
    // Agregar opciones al select
    comunidadesFiltradas.forEach(comunidad => {
        const option = document.createElement('option');
        option.value = String(comunidad.id);
        option.textContent = comunidad.nombre;
        if (selectedComunidadId && String(comunidad.id) === String(selectedComunidadId)) {
            option.selected = true;
        }
        comunidadSelect.appendChild(option);
    });
    
    // Seleccionar la comunidad si se especificó
    if (selectedComunidadId) {
        const comunidadIdStr = String(selectedComunidadId);
        comunidadSelect.value = comunidadIdStr;
        
        // Verificar que la opción existe y está seleccionada
        if (comunidadSelect.value !== comunidadIdStr) {
            // Si no se seleccionó, intentar de nuevo después de un breve delay
            setTimeout(() => {
                comunidadSelect.value = comunidadIdStr;
                // Si aún no funciona, buscar la opción y seleccionarla manualmente
                if (comunidadSelect.value !== comunidadIdStr) {
                    const option = Array.from(comunidadSelect.options).find(opt => String(opt.value) === comunidadIdStr);
                    if (option) {
                        option.selected = true;
                    }
                }
            }, 100);
        }
    }
}

async function loadProyectos() {
    try {
        // Obtener proyectos accesibles al usuario
        const response = await fetch('/api/proyectos/usuario/');
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        const data = await response.json();
        
        if (data.success && Array.isArray(data.proyectos)) {
            proyectosData = data.proyectos.map(proyecto => ({
                id: proyecto.id,
                nombre: proyecto.nombre
            }));
            updateProjectsChecklist();
            updateSelectedProjectsCount();
        } else {
            console.error('Formato de respuesta inesperado:', data);
            proyectosData = [];
        }
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        proyectosData = [];
        const checklist = document.getElementById('projectsChecklist');
        if (checklist) {
            checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;"><p>Error al cargar proyectos</p></div>';
        }
    }
}

function updateSelectedProjectsCount() {
    // Actualizar el contador de proyectos seleccionados si existe el contenedor
    const container = document.getElementById('selectedProjectsContainer');
    if (container) {
        const count = selectedProjects.size;
        container.innerHTML = `<span class="selected-count">${count} proyecto${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}</span>`;
    }
}

function updateProjectsChecklist() {
    const checklist = document.getElementById('projectsChecklist');
    if (!checklist) return;
    
    if (proyectosData.length === 0) {
        checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;"><p>No hay proyectos disponibles</p></div>';
        return;
    }
    
    checklist.innerHTML = proyectosData.map(proyecto => `
        <label style="display: flex; align-items: center; gap: 8px; padding: 10px; cursor: pointer; border-radius: 6px; transition: background 0.2s;">
            <input type="checkbox" value="${proyecto.id}" ${selectedProjects.has(proyecto.id) ? 'checked' : ''} 
                   onchange="toggleProject('${proyecto.id}')" style="width: 18px; height: 18px; cursor: pointer;">
            <span style="color: #ffffff; font-size: 14px;">${proyecto.nombre}</span>
        </label>
    `).join('');
}

function toggleProject(projectId) {
    if (selectedProjects.has(projectId)) {
        selectedProjects.delete(projectId);
    } else {
        selectedProjects.add(projectId);
    }
    updateProjectsChecklist();
    updateSelectedProjectsCount();
}

function filterProjectsChecklist(query) {
    const checklist = document.getElementById('projectsChecklist');
    if (!checklist) return;
    
    if (!query || query.trim() === '') {
        // Si no hay búsqueda, mostrar todos los proyectos
        updateProjectsChecklist();
        return;
    }
    
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filtered = proyectosData.filter(p => 
        p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    );
    
    if (filtered.length === 0) {
        checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;"><p>No se encontraron proyectos</p></div>';
        return;
    }
    
    checklist.innerHTML = filtered.map(proyecto => `
        <label style="display: flex; align-items: center; gap: 8px; padding: 10px; cursor: pointer; border-radius: 6px; transition: background 0.2s;">
            <input type="checkbox" value="${proyecto.id}" ${selectedProjects.has(proyecto.id) ? 'checked' : ''} 
                   onchange="toggleProject('${proyecto.id}')" style="width: 18px; height: 18px; cursor: pointer;">
            <span style="color: #ffffff; font-size: 14px;">${proyecto.nombre}</span>
        </label>
    `).join('');
}

async function handleSaveBeneficiary() {
    const form = document.getElementById('beneficiaryForm');
    if (!form) {
        mostrarMensaje('error', 'Formulario no encontrado');
        return;
    }
    
    const tipo = document.getElementById('benef_tipo').value;
    if (!tipo) {
        mostrarMensaje('error', 'Por favor selecciona un tipo de beneficiario');
        return;
    }
    
    // Verificar si se está usando importación desde Excel
    const useExcelImport = document.getElementById('useExcelImportCheckbox');
    const isExcelMode = useExcelImport && useExcelImport.checked;
    
    // Si hay beneficiarios importados desde Excel, guardarlos todos
    if (isExcelMode && beneficiariosPendientesExcel.length > 0) {
        await guardarBeneficiariosExcel();
        return;
    }
    
    const regionId = document.getElementById('benef_region_select').value;
    const comunidadSelect = document.getElementById('benef_comunidad_select');
    const comunidadId = comunidadSelect ? comunidadSelect.value : '';
    
    if (!comunidadId) {
        mostrarMensaje('error', 'Por favor selecciona una comunidad');
        return;
    }
    
    // Remover required de campos ocultos antes de validar
    const allRequiredFields = form.querySelectorAll('[required]');
    const hiddenRequiredFields = [];
    allRequiredFields.forEach(field => {
        const fieldContainer = field.closest('[id^="campos_"]');
        if (fieldContainer && fieldContainer.style.display === 'none') {
            field.removeAttribute('required');
            hiddenRequiredFields.push(field);
        }
    });
    
    // Validar solo campos visibles
    if (!form.checkValidity()) {
        form.reportValidity();
        // Restaurar required a los campos ocultos
        hiddenRequiredFields.forEach(field => {
            field.setAttribute('required', 'required');
        });
        return;
    }
    
    // Restaurar required a los campos ocultos después de validar
    hiddenRequiredFields.forEach(field => {
        field.setAttribute('required', 'required');
    });
    
    // Construir datos según tipo
    let beneficiarioData = {
        tipo: tipo,
        comunidad_id: comunidadId,
        region_id: regionId
    };
    
    // Validar y obtener datos según tipo
    if (tipo === 'individual') {
        const nombre = document.getElementById('benef_ind_nombre').value.trim();
        const apellido = document.getElementById('benef_ind_apellido').value.trim();
        const genero = document.getElementById('benef_ind_genero').value;
        
        if (!nombre || !apellido || !genero) {
            mostrarMensaje('error', 'Por favor completa todos los campos requeridos para beneficiario individual');
            return;
        }
        
        beneficiarioData.nombre = nombre;
        beneficiarioData.apellido = apellido;
        beneficiarioData.dpi = document.getElementById('benef_ind_dpi').value.trim();
        beneficiarioData.fecha_nacimiento = document.getElementById('benef_ind_fecha_nac').value;
        beneficiarioData.edad = document.getElementById('benef_ind_edad').value;
        beneficiarioData.genero = genero;
        beneficiarioData.telefono = document.getElementById('benef_ind_telefono').value.trim();
    } else if (tipo === 'familia') {
        const nombreFamilia = document.getElementById('benef_fam_nombre').value.trim();
        const jefeFamilia = document.getElementById('benef_fam_jefe').value.trim();
        const numeroMiembros = document.getElementById('benef_fam_miembros').value;
        
        if (!nombreFamilia || !jefeFamilia || !numeroMiembros) {
            mostrarMensaje('error', 'Por favor completa todos los campos requeridos para beneficiario familia');
            return;
        }
        
        beneficiarioData.nombre_familia = nombreFamilia;
        beneficiarioData.jefe_familia = jefeFamilia;
        beneficiarioData.dpi_jefe_familia = document.getElementById('benef_fam_dpi').value.trim();
        beneficiarioData.telefono = document.getElementById('benef_fam_telefono').value.trim();
        beneficiarioData.numero_miembros = numeroMiembros;
    } else if (tipo === 'institución') {
        const nombreInstitucion = document.getElementById('benef_inst_nombre').value.trim();
        const representante = document.getElementById('benef_inst_representante').value.trim();
        
        if (!nombreInstitucion || !representante) {
            mostrarMensaje('error', 'Por favor completa todos los campos requeridos para beneficiario institución');
            return;
        }
        
        beneficiarioData.nombre_institucion = nombreInstitucion;
        beneficiarioData.tipo_institucion = document.getElementById('benef_inst_tipo').value || 'otro';
        beneficiarioData.representante_legal = representante;
        beneficiarioData.dpi_representante = document.getElementById('benef_inst_dpi_rep').value.trim();
        beneficiarioData.telefono = document.getElementById('benef_inst_telefono').value.trim();
        beneficiarioData.email = document.getElementById('benef_inst_email').value.trim();
        beneficiarioData.numero_beneficiarios_directos = document.getElementById('benef_inst_num_beneficiarios').value;
    } else if (tipo === 'otro') {
        const nombre = document.getElementById('benef_otro_nombre').value.trim();
        const tipoDesc = document.getElementById('benef_otro_tipo_desc').value.trim();
        const contacto = document.getElementById('benef_otro_contacto').value.trim();
        const descripcion = document.getElementById('benef_otro_descripcion').value.trim();
        
        if (!nombre || !tipoDesc || !contacto || !descripcion) {
            mostrarMensaje('error', 'Por favor completa todos los campos requeridos para beneficiario otro');
            return;
        }
        
        beneficiarioData.nombre = nombre;
        beneficiarioData.tipo_desc = tipoDesc;
        beneficiarioData.contacto = contacto;
        beneficiarioData.telefono = document.getElementById('benef_otro_telefono').value.trim();
        beneficiarioData.descripcion = descripcion;
    }
    
    // Guardar beneficiario
    try {
        const saveBtn = document.getElementById('saveBeneficiaryBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #ffffff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px;"></div> Guardando...';
        }
        
        // Agregar proyectos seleccionados a los datos
        if (selectedProjects.size > 0) {
            beneficiarioData.proyecto_ids = Array.from(selectedProjects);
        }
        
        console.log('Enviando datos del beneficiario:', beneficiarioData);
        
        const response = await fetch('/api/beneficiarios/crear/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(beneficiarioData)
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `Error HTTP: ${response.status}`);
        }
        
        if (data.success) {
            mostrarMensaje('success', data.message || 'Beneficiario guardado exitosamente');
            
            // Limpiar formulario usando la función de reset
            resetBeneficiaryForm();
            
            // Volver a vista principal
            setTimeout(() => {
                showView('mainView');
            }, 1000);
        } else {
            const errorMsg = data.error || data.message || 'Error al guardar el beneficiario';
            console.error('Error del servidor:', errorMsg);
            mostrarMensaje('error', errorMsg);
        }
    } catch (error) {
        console.error('Error al guardar beneficiario:', error);
        const errorMsg = error.message || 'Error al guardar el beneficiario. Por favor, verifica los datos e intenta nuevamente.';
        mostrarMensaje('error', errorMsg);
    } finally {
        const saveBtn = document.getElementById('saveBeneficiaryBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Guardar Beneficiario
            `;
        }
    }
}

// Función para actualizar un evento/proyecto (similar a actualizarEvento en gestioneseventos.js)
async function actualizarEventoDesdeBeneficiarios(eventoId) {
    try {
        // Obtener los datos actuales del evento desde la API
        // Usar un límite alto para beneficiarios para asegurar que se carguen todos
        const response = await fetch(`/api/evento/${eventoId}/?beneficiarios_limite=2000`);
        if (!response.ok) {
            console.error(`Error al obtener datos del evento ${eventoId}: ${response.status}`);
            return false;
        }
        
        const eventoData = await response.json();
        if (!eventoData.success || !eventoData.evento) {
            console.error(`No se pudo obtener datos del evento ${eventoId}:`, eventoData);
            return false;
        }
        
        const evento = eventoData.evento;
        
        // Crear FormData con los datos actuales del evento
        const formData = new FormData();
        
        // Campos básicos del evento
        formData.append('nombre', evento.nombre || '');
        formData.append('tipo_actividad_id', evento.tipo_id || '');
        if (evento.comunidad_id) {
            formData.append('comunidad_id', evento.comunidad_id);
        }
        if (evento.comunidades && Array.isArray(evento.comunidades)) {
            formData.append('comunidades_seleccionadas', JSON.stringify(evento.comunidades));
        }
        formData.append('fecha', evento.fecha || '');
        formData.append('estado', evento.estado || 'planificado');
        formData.append('descripcion', evento.descripcion || '');
        
        // Personal (si existe) - formatear correctamente
        if (evento.personal && Array.isArray(evento.personal)) {
            const personal_ids = evento.personal.map(p => {
                if (typeof p === 'object' && p.id) {
                    return {
                        id: String(p.id),
                        tipo: p.tipo || 'colaborador',
                        rol: p.rol || 'Colaborador'
                    };
                }
                return {
                    id: String(p),
                    tipo: 'colaborador',
                    rol: 'Colaborador'
                };
            });
            formData.append('personal_ids', JSON.stringify(personal_ids));
        }
        
        // Beneficiarios existentes (para mantenerlos y refrescar la lista)
        // Esto asegura que todos los beneficiarios, incluyendo los nuevos, se carguen correctamente
        if (evento.beneficiarios && Array.isArray(evento.beneficiarios)) {
            const beneficiariosExistentesIds = evento.beneficiarios.map(b => {
                // El beneficiario puede venir como objeto con id o directamente como id
                return typeof b === 'object' && b.id ? String(b.id) : String(b);
            });
            if (beneficiariosExistentesIds.length > 0) {
                formData.append('beneficiarios_existentes_agregar', JSON.stringify(beneficiariosExistentesIds));
            }
        }
        
        // Datos del proyecto (si existen)
        if (evento.tarjetas_datos && Array.isArray(evento.tarjetas_datos)) {
            const tarjetasActualizadas = evento.tarjetas_datos.map(t => ({
                id: t.id,
                titulo: t.titulo,
                valor: t.valor,
                icono: t.icono || null
            }));
            if (tarjetasActualizadas.length > 0) {
                formData.append('tarjetas_datos_actualizadas', JSON.stringify(tarjetasActualizadas));
            }
        }
        
        // CSRF token
        const csrftoken = getCookie('csrftoken');
        
        // Actualizar el evento
        const updateResponse = await fetch(`/api/evento/${eventoId}/actualizar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: formData
        });
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
            console.log(`✅ Evento ${eventoId} actualizado exitosamente`);
            return true;
        } else {
            console.error(`Error al actualizar evento ${eventoId}:`, updateData.error || updateData);
            return false;
        }
    } catch (error) {
        console.error(`Error al actualizar evento ${eventoId}:`, error);
        return false;
    }
}

async function guardarBeneficiariosExcel() {
    if (beneficiariosPendientesExcel.length === 0) {
        mostrarMensaje('error', 'No hay beneficiarios pendientes para guardar');
        return;
    }
    
    const saveBtn = document.getElementById('saveBeneficiaryBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `
            <div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #ffffff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px;"></div>
            Guardando beneficiarios...
        `;
    }
    
    try {
        // Obtener proyectos seleccionados
        const proyectoIds = Array.from(selectedProjects);
        
        if (proyectoIds.length > 0) {
            // Si hay proyectos seleccionados, usar guardar-pendientes para cada proyecto
            // Esto guarda los beneficiarios Y los vincula directamente al evento
            let proyectosExitosos = 0;
            let proyectosConError = 0;
            
            for (const proyectoId of proyectoIds) {
                try {
                    saveBtn.innerHTML = `
                        <div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #ffffff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px;"></div>
                        Guardando en proyecto ${proyectosExitosos + 1}/${proyectoIds.length}...
                    `;
                    
                    const response = await fetch('/api/beneficiarios/guardar-pendientes/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        body: JSON.stringify({
                            actividad_id: proyectoId,
                            beneficiarios_pendientes: beneficiariosPendientesExcel
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        proyectosExitosos++;
                        console.log(`✅ Beneficiarios guardados y vinculados al proyecto ${proyectoId}`);
                    } else {
                        proyectosConError++;
                        console.error(`❌ Error al guardar beneficiarios en proyecto ${proyectoId}:`, data.error);
                    }
                } catch (error) {
                    proyectosConError++;
                    console.error(`❌ Error al guardar beneficiarios en proyecto ${proyectoId}:`, error);
                }
            }
            
            // Mensaje final
            let mensaje = '';
            if (proyectosExitosos > 0) {
                mensaje = `Se guardaron ${beneficiariosPendientesExcel.length} beneficiario(s) y se vincularon a ${proyectosExitosos} proyecto(s) exitosamente.`;
            }
            if (proyectosConError > 0) {
                mensaje += ` ${proyectosConError} proyecto(s) tuvieron errores al vincular beneficiarios.`;
            }
            
            if (proyectosExitosos > 0) {
                mostrarMensaje('success', mensaje);
            } else {
                mostrarMensaje('error', 'Error al guardar los beneficiarios en los proyectos seleccionados.');
            }
        } else {
            // Si no hay proyectos seleccionados, solo guardar en la base de datos general
            const response = await fetch('/api/beneficiarios/guardar-general/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    beneficiarios_pendientes: beneficiariosPendientesExcel
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarMensaje('success', data.message || `Se guardaron ${beneficiariosPendientesExcel.length} beneficiario(s) exitosamente en la base de datos general.`);
            } else {
                mostrarMensaje('error', data.error || 'Error al guardar los beneficiarios');
            }
        }
        
        // Limpiar beneficiarios pendientes
        beneficiariosPendientesExcel = [];
        actualizarContadorPendientes();
        
        // Limpiar formulario
        resetBeneficiaryForm();
        
        // Volver a la vista principal
        setTimeout(() => {
            showView('mainView');
        }, 1500);
    } catch (error) {
        console.error('Error guardando beneficiarios Excel:', error);
        mostrarMensaje('error', 'Error al guardar los beneficiarios. Por favor, intente nuevamente.');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Guardar Beneficiario
            `;
        }
    }
}

async function agregarBeneficiarioAProyectos(beneficiarioId, proyectoIds) {
    try {
        const response = await fetch(`/api/beneficiario/${beneficiarioId}/agregar-proyectos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                proyecto_ids: proyectoIds
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.rechazados && data.rechazados.length > 0) {
                mostrarMensaje('warning', `${data.message}. ${data.rechazados.length} proyecto(s) rechazado(s) por falta de permisos.`);
            } else {
                mostrarMensaje('success', data.message || `Beneficiario agregado a ${proyectoIds.length} proyecto(s)`);
            }
        } else {
            mostrarMensaje('error', data.error || 'Error al agregar beneficiario a proyectos');
        }
    } catch (error) {
        console.error('Error agregando a proyectos:', error);
        mostrarMensaje('error', 'Error al agregar beneficiario a proyectos');
    }
}

async function importarBeneficiariosExcel(file) {
    const formData = new FormData();
    formData.append('excel_file', file);
    
    const excelImportStatus = document.getElementById('excelImportStatus');
    if (excelImportStatus) {
        excelImportStatus.style.display = 'block';
        excelImportStatus.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: rgba(0, 123, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 123, 255, 0.3);">
                <div class="spinner" style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #007bff; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
                <span style="color: #007bff;">Importando beneficiarios...</span>
            </div>
        `;
    }
    
    try {
        const response = await fetch('/api/beneficiarios/importar-excel/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Almacenar beneficiarios pendientes
            if (data.pendientes) {
                beneficiariosPendientesExcel = [
                    ...(data.pendientes.exitosos || []).map(item => item.datos),
                    ...(data.pendientes.advertencias || []).map(item => item.datos)
                ];
                actualizarContadorPendientes();
            }
            
            // Mostrar resultados detallados
            const resultados = data.resultados;
            let statusHTML = `
                <div style="padding: 16px; background: rgba(40, 167, 69, 0.1); border-radius: 8px; border: 1px solid rgba(40, 167, 69, 0.3);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #28a745;">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <strong style="color: #28a745;">${data.message}</strong>
                    </div>
                    <div style="color: #b8c5d1; font-size: 0.9rem; line-height: 1.6;">
                        <p style="margin: 0 0 8px 0;"><strong>Total procesados:</strong> ${resultados.total_procesados}</p>
                        ${resultados.total_exitosos > 0 ? `<p style="margin: 0 0 8px 0; color: #28a745;"><strong>Listos para agregar:</strong> ${resultados.total_exitosos}</p>` : ''}
                        ${resultados.total_advertencias > 0 ? `<p style="margin: 0 0 8px 0; color: #ffc107;"><strong>Listos para actualizar:</strong> ${resultados.total_advertencias}</p>` : ''}
                        ${resultados.total_errores > 0 ? `<p style="margin: 0; color: #dc3545;"><strong>Errores:</strong> ${resultados.total_errores}</p>` : ''}
                    </div>
                    ${(resultados.total_exitosos > 0 || resultados.total_advertencias > 0) ? `
                        <div style="margin-top: 12px; padding: 12px; background: rgba(0, 123, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 123, 255, 0.3);">
                            <p style="margin: 0; color: #007bff; font-size: 0.9rem;">
                                <strong>⚠️ Importante:</strong> Los beneficiarios están listos pero aún no se han guardado. 
                                Presiona "Guardar Beneficiario" para guardarlos en el sistema.
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            // Mostrar advertencias y errores
            if (resultados.advertencias && resultados.advertencias.length > 0) {
                statusHTML += `
                    <div style="margin-top: 12px; padding: 12px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; border: 1px solid rgba(255, 193, 7, 0.3);">
                        <strong style="color: #ffc107; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Advertencias (Beneficiarios a actualizar):
                        </strong>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #ffc107; font-size: 0.85rem;">
                `;
                resultados.advertencias.slice(0, 10).forEach(advertencia => {
                    statusHTML += `<li>Fila ${advertencia.fila}: ${advertencia.mensaje}</li>`;
                });
                if (resultados.advertencias.length > 10) {
                    statusHTML += `<li>... y ${resultados.advertencias.length - 10} advertencias más</li>`;
                }
                statusHTML += `</ul></div>`;
            }
            
            if (resultados.errores && resultados.errores.length > 0) {
                statusHTML += `
                    <div style="margin-top: 12px; padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border: 1px solid rgba(220, 53, 69, 0.3);">
                        <strong style="color: #dc3545; font-size: 0.9rem;">Errores encontrados:</strong>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #dc3545; font-size: 0.85rem;">
                `;
                resultados.errores.slice(0, 10).forEach(error => {
                    statusHTML += `<li>Fila ${error.fila}: ${error.error}</li>`;
                });
                if (resultados.errores.length > 10) {
                    statusHTML += `<li>... y ${resultados.errores.length - 10} errores más</li>`;
                }
                statusHTML += `</ul></div>`;
            }
            
            statusHTML += `</div>`;
            
            if (excelImportStatus) {
                excelImportStatus.innerHTML = statusHTML;
            }
        } else {
            // Mostrar error
            if (excelImportStatus) {
                excelImportStatus.innerHTML = `
                    <div style="padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border: 1px solid rgba(220, 53, 69, 0.3);">
                        <div style="display: flex; align-items: center; gap: 8px; color: #dc3545;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <strong>Error:</strong> ${data.error || 'Error al importar el archivo'}
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error:', error);
        if (excelImportStatus) {
            excelImportStatus.innerHTML = `
                <div style="padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border: 1px solid rgba(220, 53, 69, 0.3);">
                    <div style="display: flex; align-items: center; gap: 8px; color: #dc3545;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <strong>Error de conexión:</strong> No se pudo conectar con el servidor
                    </div>
                </div>
            `;
        }
        mostrarMensaje('error', 'Error al importar el archivo Excel. Por favor, intente nuevamente.');
    }
}

function actualizarContadorPendientes() {
    const excelPendingCount = document.getElementById('excelPendingCount');
    const excelPendingActions = document.getElementById('excelPendingActions');
    
    if (excelPendingCount) {
        excelPendingCount.textContent = beneficiariosPendientesExcel.length;
    }
    if (excelPendingActions) {
        excelPendingActions.style.display = beneficiariosPendientesExcel.length > 0 ? 'block' : 'none';
    }
}

// ======================================
// IMPORTACIÓN DE EXCEL GENERAL
// ======================================

function initializeImportExcelGeneral() {
    const openImportExcelBtn = document.getElementById('openImportExcelBtn');
    const importExcelModal = document.getElementById('importExcelModal');
    const closeImportExcelModal = document.getElementById('closeImportExcelModal');
    const downloadTemplateBtnGeneral = document.getElementById('downloadTemplateBtnGeneral');
    const excelFileInputGeneral = document.getElementById('excelFileInputGeneral');
    const excelFileInfoGeneral = document.getElementById('excelFileInfoGeneral');
    const excelFileNameGeneral = document.getElementById('excelFileNameGeneral');
    const removeExcelFileBtnGeneral = document.getElementById('removeExcelFileBtnGeneral');
    const excelImportStatusGeneral = document.getElementById('excelImportStatusGeneral');
    const excelPendingActionsGeneral = document.getElementById('excelPendingActionsGeneral');
    const excelPendingCountGeneral = document.getElementById('excelPendingCountGeneral');
    const ingresarBeneficiariosBDGeneralBtn = document.getElementById('ingresarBeneficiariosBDGeneralBtn');
    
    // Función para actualizar contador de beneficiarios pendientes (general)
    function actualizarContadorPendientesGeneral() {
        const total = beneficiariosPendientesExcelGeneral.length;
        if (excelPendingCountGeneral) {
            excelPendingCountGeneral.textContent = total;
        }
        if (excelPendingActionsGeneral) {
            excelPendingActionsGeneral.style.display = total > 0 ? 'block' : 'none';
        }
    }
    
    // Abrir modal de importación Excel general
    if (openImportExcelBtn) {
        openImportExcelBtn.addEventListener('click', function() {
            if (importExcelModal) {
                importExcelModal.style.display = 'flex';
                setTimeout(() => {
                    importExcelModal.classList.add('show');
                }, 10);
            }
        });
    }
    
    // Cerrar modal de importación Excel general
    function closeImportExcelModalFunc() {
        if (importExcelModal) {
            importExcelModal.classList.remove('show');
            setTimeout(() => {
                importExcelModal.style.display = 'none';
            }, 300);
            // Limpiar campos
            if (excelFileInputGeneral) excelFileInputGeneral.value = '';
            if (excelFileInfoGeneral) excelFileInfoGeneral.style.display = 'none';
            if (excelImportStatusGeneral) {
                excelImportStatusGeneral.style.display = 'none';
                excelImportStatusGeneral.innerHTML = '';
            }
            beneficiariosPendientesExcelGeneral = [];
            actualizarContadorPendientesGeneral();
        }
    }
    
    if (closeImportExcelModal) {
        closeImportExcelModal.addEventListener('click', closeImportExcelModalFunc);
    }
    
    // Cerrar modal al hacer click fuera
    if (importExcelModal) {
        importExcelModal.addEventListener('click', function(e) {
            if (e.target === importExcelModal) {
                closeImportExcelModalFunc();
            }
        });
    }
    
    // Descargar plantilla (general)
    if (downloadTemplateBtnGeneral) {
        downloadTemplateBtnGeneral.addEventListener('click', function() {
            window.location.href = '/api/beneficiarios/descargar-plantilla/';
        });
    }
    
    // Manejar selección de archivo Excel (general)
    if (excelFileInputGeneral) {
        excelFileInputGeneral.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validar extensión
                const validExtensions = ['.xlsx', '.xls'];
                const fileName = file.name.toLowerCase();
                const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
                
                if (!isValidExtension) {
                    mostrarMensaje('error', 'El archivo debe ser un Excel (.xlsx o .xls)');
                    this.value = '';
                    return;
                }
                
                // Mostrar información del archivo
                if (excelFileNameGeneral) {
                    excelFileNameGeneral.textContent = file.name;
                }
                if (excelFileInfoGeneral) {
                    excelFileInfoGeneral.style.display = 'block';
                }
                
                // Importar automáticamente
                importarBeneficiariosExcelGeneral(file);
            }
        });
    }
    
    // Remover archivo Excel (general)
    if (removeExcelFileBtnGeneral) {
        removeExcelFileBtnGeneral.addEventListener('click', function() {
            if (excelFileInputGeneral) {
                excelFileInputGeneral.value = '';
            }
            if (excelFileInfoGeneral) {
                excelFileInfoGeneral.style.display = 'none';
            }
            if (excelImportStatusGeneral) {
                excelImportStatusGeneral.style.display = 'none';
                excelImportStatusGeneral.innerHTML = '';
            }
            // Limpiar beneficiarios pendientes
            beneficiariosPendientesExcelGeneral = [];
            actualizarContadorPendientesGeneral();
        });
    }
    
    // Función para importar beneficiarios desde Excel (general)
    async function importarBeneficiariosExcelGeneral(file) {
        if (!file) return;
        
        const formData = new FormData();
        formData.append('excel_file', file);
        
        // Mostrar estado de carga
        if (excelImportStatusGeneral) {
            excelImportStatusGeneral.style.display = 'block';
            excelImportStatusGeneral.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: rgba(0, 123, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 123, 255, 0.3);">
                    <div class="spinner" style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #007bff; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
                    <span style="color: #007bff;">Importando beneficiarios...</span>
                </div>
            `;
        }
        
        try {
            const response = await fetch('/api/beneficiarios/importar-excel/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Almacenar beneficiarios pendientes (NO cerrar modal)
                if (data.pendientes) {
                    beneficiariosPendientesExcelGeneral = [
                        ...(data.pendientes.exitosos || []).map(item => item.datos),
                        ...(data.pendientes.advertencias || []).map(item => item.datos)
                    ];
                    actualizarContadorPendientesGeneral();
                }
                
                // Mostrar resultados
                const resultados = data.resultados;
                let statusHTML = `
                    <div style="padding: 16px; background: rgba(40, 167, 69, 0.1); border-radius: 8px; border: 1px solid rgba(40, 167, 69, 0.3);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #28a745;">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <strong style="color: #28a745;">${data.message}</strong>
                        </div>
                        <div style="color: #b8c5d1; font-size: 0.9rem; line-height: 1.6;">
                            <p style="margin: 0 0 8px 0;"><strong>Total procesados:</strong> ${resultados.total_procesados}</p>
                            ${resultados.total_exitosos > 0 ? `<p style="margin: 0 0 8px 0; color: #28a745;"><strong>Listos para agregar:</strong> ${resultados.total_exitosos}</p>` : ''}
                            ${resultados.total_advertencias > 0 ? `<p style="margin: 0 0 8px 0; color: #ffc107;"><strong>Listos para actualizar:</strong> ${resultados.total_advertencias}</p>` : ''}
                            ${resultados.total_errores > 0 ? `<p style="margin: 0; color: #dc3545;"><strong>Errores:</strong> ${resultados.total_errores}</p>` : ''}
                        </div>
                        ${(resultados.total_exitosos > 0 || resultados.total_advertencias > 0) ? `
                            <div style="margin-top: 12px; padding: 12px; background: rgba(0, 123, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 123, 255, 0.3);">
                                <p style="margin: 0; color: #007bff; font-size: 0.9rem;">
                                    <strong>⚠️ Importante:</strong> Los beneficiarios están listos pero aún no se han guardado. 
                                    Presiona "Añadir Beneficiarios a la Base de Datos General" para guardarlos.
                                </p>
                            </div>
                        ` : ''}
                `;
                
                // Mostrar advertencias y errores
                if (resultados.advertencias && resultados.advertencias.length > 0) {
                    statusHTML += `
                        <div style="margin-top: 12px; padding: 12px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; border: 1px solid rgba(255, 193, 7, 0.3);">
                            <strong style="color: #ffc107; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Advertencias (Beneficiarios a actualizar):
                            </strong>
                            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #ffc107; font-size: 0.85rem;">
                    `;
                    resultados.advertencias.slice(0, 10).forEach(advertencia => {
                        statusHTML += `<li>Fila ${advertencia.fila}: ${advertencia.mensaje}</li>`;
                    });
                    if (resultados.advertencias.length > 10) {
                        statusHTML += `<li>... y ${resultados.advertencias.length - 10} advertencias más</li>`;
                    }
                    statusHTML += `</ul></div>`;
                }
                
                if (resultados.errores && resultados.errores.length > 0) {
                    statusHTML += `
                        <div style="margin-top: 12px; padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border: 1px solid rgba(220, 53, 69, 0.3);">
                            <strong style="color: #dc3545; font-size: 0.9rem;">Errores encontrados:</strong>
                            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #dc3545; font-size: 0.85rem;">
                    `;
                    resultados.errores.slice(0, 10).forEach(error => {
                        statusHTML += `<li>Fila ${error.fila}: ${error.error}</li>`;
                    });
                    if (resultados.errores.length > 10) {
                        statusHTML += `<li>... y ${resultados.errores.length - 10} errores más</li>`;
                    }
                    statusHTML += `</ul></div>`;
                }
                
                statusHTML += `</div>`;
                
                if (excelImportStatusGeneral) {
                    excelImportStatusGeneral.innerHTML = statusHTML;
                }
            } else {
                // Mostrar error
                if (excelImportStatusGeneral) {
                    excelImportStatusGeneral.innerHTML = `
                        <div style="padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border: 1px solid rgba(220, 53, 69, 0.3);">
                            <div style="display: flex; align-items: center; gap: 8px; color: #dc3545;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <strong>Error:</strong> ${data.error || 'Error al importar el archivo'}
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            if (excelImportStatusGeneral) {
                excelImportStatusGeneral.innerHTML = `
                    <div style="padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border: 1px solid rgba(220, 53, 69, 0.3);">
                        <div style="display: flex; align-items: center; gap: 8px; color: #dc3545;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <strong>Error de conexión:</strong> No se pudo conectar con el servidor
                        </div>
                    </div>
                `;
            }
            mostrarMensaje('error', 'Error al importar el archivo Excel. Por favor, intente nuevamente.');
        }
    }
    
    // Botón para ingresar beneficiarios a la base de datos general
    if (ingresarBeneficiariosBDGeneralBtn) {
        ingresarBeneficiariosBDGeneralBtn.addEventListener('click', async function() {
            if (beneficiariosPendientesExcelGeneral.length === 0) {
                mostrarMensaje('error', 'No hay beneficiarios pendientes para agregar');
                return;
            }
            
            // Mostrar estado de carga
            ingresarBeneficiariosBDGeneralBtn.disabled = true;
            ingresarBeneficiariosBDGeneralBtn.innerHTML = `
                <div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #ffffff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px;"></div>
                Guardando...
            `;
            
            try {
                const response = await fetch('/api/beneficiarios/guardar-general/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        beneficiarios_pendientes: beneficiariosPendientesExcelGeneral
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('success', data.message);
                    
                    // Limpiar beneficiarios pendientes
                    beneficiariosPendientesExcelGeneral = [];
                    actualizarContadorPendientesGeneral();
                    
                    // Limpiar estado de importación
                    if (excelFileInputGeneral) excelFileInputGeneral.value = '';
                    if (excelFileInfoGeneral) excelFileInfoGeneral.style.display = 'none';
                    if (excelImportStatusGeneral) {
                        excelImportStatusGeneral.style.display = 'none';
                        excelImportStatusGeneral.innerHTML = '';
                    }
                    
                    // Cerrar modal
                    closeImportExcelModalFunc();
                } else {
                    mostrarMensaje('error', data.error || 'Error al guardar los beneficiarios');
                }
            } catch (error) {
                mostrarMensaje('error', 'Error al guardar los beneficiarios. Por favor, intente nuevamente.');
            } finally {
                ingresarBeneficiariosBDGeneralBtn.disabled = false;
                ingresarBeneficiariosBDGeneralBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Añadir Beneficiarios a la Base de Datos General
                `;
            }
        });
    }
}

let beneficiariosExistentesInitialized = false;

function initializeBeneficiariosExistentes() {
    // Solo inicializar una vez
    if (beneficiariosExistentesInitialized) {
        return;
    }
    
    const searchInput = document.getElementById('benef_search_input');
    const searchRegion = document.getElementById('benef_search_region');
    const searchComunidad = document.getElementById('benef_search_comunidad');
    const searchTipo = document.getElementById('benef_search_tipo');
    
    // Cargar regiones y comunidades para filtros
    loadRegionesForSearch();
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                buscarBeneficiariosExistentes();
            }, 300);
        });
    }
    
    if (searchRegion) {
        searchRegion.addEventListener('change', function() {
            loadComunidadesForSearch(this.value);
            buscarBeneficiariosExistentes();
        });
    }
    
    if (searchComunidad) {
        searchComunidad.addEventListener('change', () => buscarBeneficiariosExistentes());
    }
    
    if (searchTipo) {
        searchTipo.addEventListener('change', () => buscarBeneficiariosExistentes());
    }
    
    beneficiariosExistentesInitialized = true;
}

async function loadRegionesForSearch() {
    try {
        const response = await fetch('/api/regiones/');
        if (!response.ok) {
            throw new Error('Error al cargar regiones');
        }
        const data = await response.json();
        // La API devuelve un array directo
        if (Array.isArray(data)) {
            const regionSelect = document.getElementById('benef_search_region');
            if (regionSelect) {
                while (regionSelect.options.length > 1) {
                    regionSelect.remove(1);
                }
                data.forEach(region => {
                    const option = document.createElement('option');
                    option.value = region.id;
                    option.textContent = region.nombre;
                    regionSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando regiones:', error);
    }
}

async function loadComunidadesForSearch(regionId) {
    try {
        const url = regionId 
            ? `/api/comunidades/?region_id=${regionId}`
            : '/api/comunidades/';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al cargar comunidades');
        }
        const data = await response.json();
        // La API devuelve un array directo
        if (Array.isArray(data)) {
            const comunidadSelect = document.getElementById('benef_search_comunidad');
            if (comunidadSelect) {
                while (comunidadSelect.options.length > 1) {
                    comunidadSelect.remove(1);
                }
                data.forEach(comunidad => {
                    const option = document.createElement('option');
                    option.value = comunidad.id;
                    option.textContent = comunidad.nombre;
                    comunidadSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando comunidades:', error);
    }
}

async function buscarBeneficiariosExistentes() {
    const searchInput = document.getElementById('benef_search_input');
    const searchRegion = document.getElementById('benef_search_region');
    const searchComunidad = document.getElementById('benef_search_comunidad');
    const searchTipo = document.getElementById('benef_search_tipo');
    const resultsContainer = document.getElementById('benef_search_results');
    const statusEl = document.getElementById('benef_search_status');
    
    if (!resultsContainer) return;
    
    const query = searchInput ? searchInput.value.trim() : '';
    const regionId = searchRegion ? searchRegion.value : '';
    const comunidadId = searchComunidad ? searchComunidad.value : '';
    const tipo = searchTipo ? searchTipo.value : '';
    
    // Construir URL de búsqueda
    let url = '/api/beneficiarios/?';
    const params = [];
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (regionId) params.push(`region_id=${regionId}`);
    if (comunidadId) params.push(`comunidad_id=${comunidadId}`);
    if (tipo) params.push(`tipo=${encodeURIComponent(tipo)}`);
    url += params.join('&');
    
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = 'Buscando beneficiarios...';
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al buscar beneficiarios');
        }
        const data = await response.json();
        
        // La API devuelve un array directo, no un objeto con success
        if (Array.isArray(data)) {
            renderBeneficiariosBusqueda(data);
            if (statusEl) {
                statusEl.textContent = `${data.length} beneficiario(s) encontrado(s)`;
            }
        } else {
            if (statusEl) {
                statusEl.textContent = 'Error al buscar beneficiarios';
            }
            resultsContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Error:', error);
        if (statusEl) {
            statusEl.textContent = 'Error al buscar beneficiarios';
        }
        resultsContainer.innerHTML = '';
    }
}

function renderBeneficiariosBusqueda(beneficiarios) {
    const resultsContainer = document.getElementById('benef_search_results');
    if (!resultsContainer) return;
    
    // Mostrar el contenedor
    resultsContainer.style.display = 'grid';
    
    if (beneficiarios.length === 0) {
        resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No se encontraron beneficiarios</div>';
        return;
    }
    
    resultsContainer.innerHTML = beneficiarios.map(b => {
        const nombre = b.nombre || b.display_name || 'Sin nombre';
        const tipo = (b.tipo || '').toLowerCase();
        const tipoLabel = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        const detalles = b.detalles || {};
        
        // Construir información adicional según tipo
        let infoAdicional = '';
        if (tipo === 'individual' && detalles.dpi) {
            infoAdicional = `DPI: ${detalles.dpi}`;
        } else if (tipo === 'familia' && detalles.jefe_familia) {
            infoAdicional = `Jefe: ${detalles.jefe_familia}`;
        } else if (tipo === 'institución' && detalles.tipo_institucion) {
            infoAdicional = `Tipo: ${detalles.tipo_institucion}`;
        }
        
        return `
            <div class="beneficiary-item" style="cursor: pointer; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;" 
                 onclick="seleccionarBeneficiarioExistente('${b.id}')"
                 onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.2)';"
                 onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.1)';">
                <div class="beneficiary-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 class="beneficiary-name" style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${nombre}</h4>
                    <span class="beneficiary-type" style="padding: 4px 12px; background: rgba(0, 123, 255, 0.2); border-radius: 12px; font-size: 12px; color: #007bff; font-weight: 500;">${tipoLabel}</span>
                </div>
                <div style="color: #b8c5d1; font-size: 14px; margin-top: 4px;">
                    ${b.comunidad_nombre || 'Sin comunidad'}
                    ${b.region_nombre ? ` • ${b.region_nombre}` : ''}
                </div>
                ${infoAdicional ? `<div style="color: #6c757d; font-size: 12px; margin-top: 4px;">${infoAdicional}</div>` : ''}
            </div>
        `;
    }).join('');
}

function seleccionarBeneficiarioExistente(beneficiarioId) {
    // Agregar beneficiario seleccionado a proyectos si hay proyectos seleccionados
    if (selectedProjects.size > 0) {
        agregarBeneficiarioAProyectos(beneficiarioId, Array.from(selectedProjects));
        mostrarMensaje('success', 'Beneficiario agregado a proyecto(s)');
    } else {
        mostrarMensaje('info', 'Selecciona al menos un proyecto para agregar el beneficiario');
    }
}

// ======================================
// LISTADO DE BENEFICIARIOS
// ======================================

function initializeListado() {
    // Cargar comunidades para el buscador
    asegurarDatosRegionesComunidades();
    
    // Toggle de filtros - Ocultar por defecto
    const filtersToggle = document.getElementById('filtersToggle');
    const filtersContent = document.getElementById('filtersContent');
    
    if (filtersContent) {
        // Ocultar filtros por defecto
        filtersContent.style.display = 'none';
    }
    
    if (filtersToggle && filtersContent) {
        filtersToggle.addEventListener('click', function() {
            const isHidden = filtersContent.style.display === 'none';
            filtersContent.style.display = isHidden ? 'block' : 'none';
            
            // Rotar el ícono
            const icon = this.querySelector('svg');
            if (icon) {
                icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    }
    
    // Filtros
    const filterTipoCheckboxes = document.querySelectorAll('#filterTipoBeneficiario input[type="checkbox"]');
    filterTipoCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            updateTipoFilter();
        });
    });
    
    // Buscador de comunidad - Usar el mismo sistema de catálogo que en agregar beneficiario
    // Asegurar que los datos estén cargados antes de configurar el buscador
    asegurarDatosRegionesComunidades().then(() => {
        setupCatalogSearchListado();
    });
    
    // Buscador de eventos - Cargar eventos al inicializar
    const searchEvento = document.getElementById('searchEventoListado');
    if (searchEvento) {
        // Cargar eventos al inicializar
        loadEventosForFilter().then(() => {
            // Mostrar el contenedor después de cargar
            const eventosListadoContainer = document.getElementById('eventosListadoContainer');
            if (eventosListadoContainer && eventosData.length > 0) {
                eventosListadoContainer.style.display = 'block';
            }
        });
        
        let searchTimeout;
        searchEvento.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                populateEventosFilter();
            }, 300);
        });
    }
    
    // Toggle para mostrar/ocultar lista de eventos
    const toggleIconEventos = document.getElementById('toggleIconEventosListado');
    const eventosListadoContainer = document.getElementById('eventosListadoContainer');
    if (toggleIconEventos && eventosListadoContainer) {
        toggleIconEventos.addEventListener('click', function() {
            const isVisible = eventosListadoContainer.style.display !== 'none';
            eventosListadoContainer.style.display = isVisible ? 'none' : 'block';
            this.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';
        });
    }
    
    // Buscador principal
    const listSearch = document.getElementById('beneficiariesListSearch');
    const listSearchClear = document.getElementById('beneficiariesListSearchClear');
    
    if (listSearch) {
        let searchTimeout;
        listSearch.addEventListener('input', function() {
            searchQuery = this.value.trim();
            if (listSearchClear) {
                listSearchClear.style.display = searchQuery ? 'block' : 'none';
            }
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFiltersAndSort();
            }, 300);
        });
    }
    
    if (listSearchClear) {
        listSearchClear.addEventListener('click', function() {
            if (listSearch) {
                listSearch.value = '';
                searchQuery = '';
                this.style.display = 'none';
                applyFiltersAndSort();
            }
        });
    }
    
    // Ordenamiento
    const sortSelect = document.getElementById('sortBeneficiaries');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortOrder = this.value;
            applyFiltersAndSort();
        });
    }
    
    // Botones de filtros
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
}

async function loadBeneficiariosList() {
    const container = document.getElementById('beneficiariesList');
    if (!container) {
        console.error('Contenedor de beneficiarios no encontrado');
        return;
    }
    
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando beneficiarios...</p>
        </div>
    `;
    
    try {
        // Cargar beneficiarios completos con proyectos
        const response = await fetch('/api/beneficiarios/completo/');
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error HTTP:', response.status, errorText);
            throw new Error(`Error al cargar beneficiarios: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Respuesta de beneficiarios:', data);
        
        if (data.success && Array.isArray(data.beneficiarios)) {
            beneficiariosData = data.beneficiarios || [];
            console.log(`✅ Cargados ${beneficiariosData.length} beneficiarios`);
            
            // Cargar eventos para el filtro
            await loadEventosForFilter();
            
            // Aplicar filtros y ordenamiento
            applyFiltersAndSort();
        } else {
            console.error('Formato de respuesta inesperado:', data);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <div class="empty-state-title">Error al cargar beneficiarios</div>
                    <div class="empty-state-description">${data.error || 'Formato de respuesta inesperado'}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando beneficiarios:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">Error al cargar beneficiarios</div>
                <div class="empty-state-description">${error.message || 'No se pudo conectar con el servidor'}</div>
            </div>
        `;
    }
}

async function loadEventosForFilter() {
    try {
        const response = await fetch('/api/events-list/');
        if (!response.ok) {
            throw new Error('Error al cargar eventos');
        }
        const data = await response.json();
        // La API devuelve un array directo con {id, name}
        if (Array.isArray(data)) {
            eventosData = data.map(evento => ({
                id: evento.id,
                nombre: evento.name || evento.nombre || 'Sin nombre'
            }));
            populateEventosFilter();
        } else {
            console.error('Formato de respuesta inesperado para eventos:', data);
            eventosData = [];
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
        eventosData = [];
    }
}

let eventosFiltered = [];

function populateEventosFilter() {
    const eventosContainer = document.getElementById('filterEventosListado');
    const eventosListadoContainer = document.getElementById('eventosListadoContainer');
    
    if (!eventosContainer) {
        console.warn('Contenedor de eventos no encontrado');
        return;
    }
    
    // Mostrar el contenedor si hay eventos (solo si hay datos)
    if (eventosListadoContainer && eventosData.length > 0) {
        eventosListadoContainer.style.display = 'block';
    }
    
    // Si hay búsqueda, filtrar eventos
    const searchInput = document.getElementById('searchEventoListado');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (searchQuery) {
        eventosFiltered = eventosData.filter(e => 
            e.nombre && e.nombre.toLowerCase().includes(searchQuery)
        );
    } else {
        eventosFiltered = [...eventosData];
    }
    
    if (eventosFiltered.length > 0) {
        eventosContainer.innerHTML = eventosFiltered.map(evento => {
            const nombreEscapado = (evento.nombre || 'Sin nombre').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return `
                <label style="display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer; border-radius: 4px; transition: background 0.2s;">
                    <input type="checkbox" value="${evento.id}" 
                           ${filters.evento.includes(evento.id) ? 'checked' : ''}
                           onchange="toggleEventoFilter('${evento.id}')">
                    <span style="color: #ffffff; font-size: 14px;">${evento.nombre || 'Sin nombre'}</span>
                </label>
            `;
        }).join('');
    } else {
        eventosContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No se encontraron eventos</div>';
    }
}

function toggleEventoFilter(eventoId) {
    if (filters.evento.includes(eventoId)) {
        filters.evento = filters.evento.filter(id => id !== eventoId);
    } else {
        filters.evento.push(eventoId);
    }
    updateEventosTags();
    applyFiltersAndSort();
}

function updateEventosTags() {
    const tagsContainer = document.getElementById('selectedEventosListadoTags');
    if (!tagsContainer) return;
    
    if (filters.evento.length === 0) {
        tagsContainer.innerHTML = '';
        return;
    }
    
    tagsContainer.innerHTML = filters.evento.map(eventoId => {
        const evento = eventosData.find(e => e.id === eventoId);
        if (!evento) return '';
        return `
            <span class="selected-tag">
                ${evento.nombre}
                <button class="selected-tag-remove" onclick="removeEventoFilter('${eventoId}')">×</button>
            </span>
        `;
    }).join('');
}

function removeEventoFilter(eventoId) {
    filters.evento = filters.evento.filter(id => id !== eventoId);
    updateEventosTags();
    populateEventosFilter();
    applyFiltersAndSort();
}

function applyFiltersAndSort() {
    let filtered = [...beneficiariosData];
    
    // Filtrar por tipo
    if (filters.tipoBeneficiario.length > 0) {
        filtered = filtered.filter(b => {
            const tipo = (b.tipo || '').toLowerCase();
            return filters.tipoBeneficiario.includes(tipo);
        });
    }
    
    // Filtrar por comunidad (múltiple)
    if (filters.comunidad.length > 0) {
        filtered = filtered.filter(b => filters.comunidad.includes(b.comunidad_id));
    }
    
    // Filtrar por evento
    if (filters.evento.length > 0) {
        // Filtrar beneficiarios que están en los eventos seleccionados
        // Esto requeriría una llamada API adicional o que los datos ya incluyan las relaciones
        // Por ahora, aplicamos el filtro si los datos tienen la información de proyectos
        filtered = filtered.filter(b => {
            const proyectos = b.proyectos || [];
            return proyectos.some(p => filters.evento.includes(p.id));
        });
    }
    
    // Buscar por nombre, DPI o teléfono
    if (searchQuery) {
        const query = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        filtered = filtered.filter(b => {
            const nombre = (b.nombre || b.display_name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const detalles = b.detalles || {};
            const dpi = (detalles.dpi || detalles.dpi_jefe_familia || detalles.dpi_representante || '').toLowerCase();
            const telefono = (detalles.telefono || '').toLowerCase();
            return nombre.includes(query) || dpi.includes(query) || telefono.includes(query);
        });
    }
    
    // Ordenar
    if (sortOrder === 'reciente') {
        filtered.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
    } else if (sortOrder === 'alfabetico') {
        filtered.sort((a, b) => {
            const nameA = (a.nombre || a.display_name || '').toLowerCase();
            const nameB = (b.nombre || b.display_name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }
    
    renderBeneficiariosList(filtered);
}

function renderBeneficiariosList(beneficiarios) {
    const container = document.getElementById('beneficiariesList');
    const countEl = document.getElementById('beneficiariesCount');
    
    if (!container) return;
    
    if (countEl) {
        countEl.textContent = `${beneficiarios.length} beneficiario(s) encontrado(s)`;
    }
    
    if (beneficiarios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">No se encontraron beneficiarios</div>
                <div class="empty-state-description">Intenta ajustar los filtros de búsqueda</div>
            </div>
        `;
        return;
    }
    
    // Agrupar si es necesario
    if (sortOrder === 'comunidad') {
        renderGroupedByComunidad(beneficiarios);
    } else if (sortOrder === 'actividad') {
        renderGroupedByActividad(beneficiarios).then(() => {
            // Renderizado completado
        }).catch(() => {
            // Si falla, renderizar simple
            renderSimpleList(beneficiarios);
        });
    } else {
        renderSimpleList(beneficiarios);
    }
}

function renderSimpleList(beneficiarios) {
    const container = document.getElementById('beneficiariesList');
    if (!container) return;
    
    container.innerHTML = beneficiarios.map(b => createBeneficiaryCard(b)).join('');
    
    // Agregar event listeners para abrir modal de detalles
    container.querySelectorAll('.beneficiary-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            const beneficiarioId = this.getAttribute('data-beneficiario-id');
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            }
        });
    });
}

function renderGroupedByComunidad(beneficiarios) {
    const container = document.getElementById('beneficiariesList');
    if (!container) return;
    
    // Agrupar por comunidad
    const grouped = {};
    beneficiarios.forEach(b => {
        const comunidadId = b.comunidad_id || 'sin-comunidad';
        const comunidadNombre = b.comunidad_nombre || 'Sin comunidad';
        if (!grouped[comunidadId]) {
            grouped[comunidadId] = {
                nombre: comunidadNombre,
                beneficiarios: []
            };
        }
        grouped[comunidadId].beneficiarios.push(b);
    });
    
    container.innerHTML = Object.values(grouped).map(group => `
        <div class="comunidad-group">
            <h3 class="comunidad-group-title">${group.nombre}</h3>
            ${group.beneficiarios.map(b => createBeneficiaryCard(b)).join('')}
        </div>
    `).join('');
    
    // Agregar event listeners para abrir modal de detalles
    container.querySelectorAll('.beneficiary-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            const beneficiarioId = this.getAttribute('data-beneficiario-id');
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            }
        });
    });
}

async function renderGroupedByActividad(beneficiarios) {
    const container = document.getElementById('beneficiariesList');
    if (!container) return;
    
    // Agrupar por actividad usando los proyectos que ya vienen en los datos
    const grouped = {};
    
    for (const b of beneficiarios) {
        const proyectos = b.proyectos || [];
        
        if (proyectos.length === 0) {
            const key = 'sin-proyecto';
            if (!grouped[key]) {
                grouped[key] = {
                    nombre: 'Sin Proyecto',
                    beneficiarios: []
                };
            }
            grouped[key].beneficiarios.push(b);
        } else {
            proyectos.forEach(proyecto => {
                const proyectoId = proyecto.id || 'sin-id';
                if (!grouped[proyectoId]) {
                    grouped[proyectoId] = {
                        nombre: proyecto.nombre || 'Proyecto sin nombre',
                        beneficiarios: []
                    };
                }
                grouped[proyectoId].beneficiarios.push(b);
            });
        }
    }
    
    container.innerHTML = Object.values(grouped).map(group => `
        <div class="actividad-group">
            <h3 class="actividad-group-title">${group.nombre}</h3>
            ${group.beneficiarios.map(b => createBeneficiaryCard(b)).join('')}
        </div>
    `).join('');
    
    // Agregar event listeners para abrir modal de detalles
    container.querySelectorAll('.beneficiary-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            const beneficiarioId = this.getAttribute('data-beneficiario-id');
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            }
        });
    });
}

function createBeneficiaryCard(beneficiario) {
    const tipo = (beneficiario.tipo || '').toLowerCase();
    let nombre = beneficiario.nombre || beneficiario.display_name || 'Sin nombre';
    const detalles = beneficiario.detalles || {};
    
    // Construir nombre completo según tipo
    if (tipo === 'individual' && detalles.apellido) {
        nombre = `${detalles.nombre || beneficiario.nombre || ''} ${detalles.apellido || ''}`.trim();
    } else if (tipo === 'familia') {
        nombre = detalles.nombre_familia || nombre;
    } else if (tipo === 'institución') {
        nombre = detalles.nombre_institucion || nombre;
    }
    
    let tipoLabel = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    let infoItems = [];
    
    if (tipo === 'individual') {
        infoItems.push({ label: 'DPI', value: detalles.dpi || beneficiario.dpi || 'N/A' });
        infoItems.push({ label: 'Teléfono', value: detalles.telefono || beneficiario.telefono || 'N/A' });
        if (detalles.genero) {
            infoItems.push({ label: 'Género', value: detalles.genero });
        }
        if (detalles.fecha_nacimiento) {
            infoItems.push({ label: 'Fecha Nacimiento', value: new Date(detalles.fecha_nacimiento).toLocaleDateString('es-GT') });
        }
    } else if (tipo === 'familia') {
        infoItems.push({ label: 'Jefe de Familia', value: detalles.jefe_familia || 'N/A' });
        infoItems.push({ label: 'Miembros', value: detalles.numero_miembros || 'N/A' });
        infoItems.push({ label: 'Teléfono', value: detalles.telefono || beneficiario.telefono || 'N/A' });
        if (detalles.dpi_jefe_familia) {
            infoItems.push({ label: 'DPI Jefe', value: detalles.dpi_jefe_familia });
        }
    } else if (tipo === 'institución' || tipo === 'otro') {
        if (tipo === 'otro' || detalles.tipo_institucion === 'otro') {
            // Tipo "otro" - mostrar campos flexibles
            infoItems.push({ label: 'Nombre', value: detalles.nombre || nombre });
            if (detalles.tipo_descripcion) {
                infoItems.push({ label: 'Tipo/Descripción', value: detalles.tipo_descripcion });
            }
            if (detalles.contacto) {
                infoItems.push({ label: 'Contacto', value: detalles.contacto });
            }
            infoItems.push({ label: 'Teléfono', value: detalles.telefono || beneficiario.telefono || 'N/A' });
        } else {
            // Institución normal
            infoItems.push({ label: 'Tipo', value: detalles.tipo_institucion || 'N/A' });
            infoItems.push({ label: 'Representante', value: detalles.representante_legal || 'N/A' });
            infoItems.push({ label: 'Teléfono', value: detalles.telefono || beneficiario.telefono || 'N/A' });
            if (detalles.email) {
                infoItems.push({ label: 'Email', value: detalles.email });
            }
            if (detalles.numero_beneficiarios_directos) {
                infoItems.push({ label: 'Beneficiarios Directos', value: detalles.numero_beneficiarios_directos });
            }
        }
    }
    
    infoItems.push({ label: 'Comunidad', value: beneficiario.comunidad_nombre || 'N/A' });
    if (beneficiario.region_nombre) {
        infoItems.push({ label: 'Región', value: beneficiario.region_nombre });
    }
    
    const proyectos = beneficiario.proyectos || [];
    const proyectosHTML = proyectos.length > 0 
        ? proyectos.map(p => `<span class="project-tag">${p.nombre || p}</span>`).join('')
        : '<span style="color: #6c757d;">Sin proyectos vinculados</span>';
    
    return `
        <div class="beneficiary-item" data-beneficiario-id="${beneficiario.id}">
            <div class="beneficiary-header">
                <h4 class="beneficiary-name">${nombre}</h4>
                <span class="beneficiary-type">${tipoLabel}</span>
            </div>
            <div class="beneficiary-details">
                ${infoItems.map(item => `
                    <div class="detail-item">
                        <strong>${item.label}:</strong> <span>${item.value}</span>
                    </div>
                `).join('')}
            </div>
            ${proyectos.length > 0 ? `
            <div class="beneficiary-projects">
                <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: #6c757d;">Proyectos vinculados:</p>
                <div class="beneficiary-projects-list">
                    ${proyectos.map(p => `<span class="project-tag">${p.nombre || p}</span>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

async function openBeneficiaryDetailsModal(beneficiarioId) {
    const modal = document.getElementById('beneficiaryDetailsModal');
    const content = document.getElementById('beneficiaryDetailsContent');
    
    if (!modal || !content) return;
    
    modal.style.display = 'flex';
    content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6c757d;">
            <div class="spinner" style="border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>Cargando detalles del beneficiario...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/beneficiario/${beneficiarioId}/detalle/`);
        if (!response.ok) {
            throw new Error('Error al cargar detalles');
        }
        const data = await response.json();
        
        if (data.success) {
            const b = data.beneficiario;
            const detalles = b.detalles || {};
            const proyectos = b.proyectos || [];
            
            let nombre = b.nombre || 'Sin nombre';
            const tipo = (b.tipo || '').toLowerCase();
            
            let detallesHTML = '';
            if (tipo === 'individual') {
                detallesHTML = `
                    <div class="detail-section">
                        <h4 class="section-title">Información Personal</h4>
                        <div class="detail-grid">
                            <div class="detail-item"><strong>Nombre:</strong> <span>${detalles.nombre || ''}</span></div>
                            <div class="detail-item"><strong>Apellido:</strong> <span>${detalles.apellido || ''}</span></div>
                            <div class="detail-item"><strong>DPI:</strong> <span>${detalles.dpi || 'N/A'}</span></div>
                            <div class="detail-item"><strong>Teléfono:</strong> <span>${detalles.telefono || 'N/A'}</span></div>
                            <div class="detail-item"><strong>Género:</strong> <span>${detalles.genero || 'N/A'}</span></div>
                            ${detalles.fecha_nacimiento ? `<div class="detail-item"><strong>Fecha de Nacimiento:</strong> <span>${new Date(detalles.fecha_nacimiento).toLocaleDateString('es-GT')}</span></div>` : ''}
                        </div>
                    </div>
                `;
            } else if (tipo === 'familia') {
                detallesHTML = `
                    <div class="detail-section">
                        <h4 class="section-title">Información de la Familia</h4>
                        <div class="detail-grid">
                            <div class="detail-item"><strong>Nombre de la Familia:</strong> <span>${detalles.nombre_familia || ''}</span></div>
                            <div class="detail-item"><strong>Jefe de Familia:</strong> <span>${detalles.jefe_familia || 'N/A'}</span></div>
                            <div class="detail-item"><strong>DPI del Jefe:</strong> <span>${detalles.dpi_jefe_familia || 'N/A'}</span></div>
                            <div class="detail-item"><strong>Teléfono:</strong> <span>${detalles.telefono || 'N/A'}</span></div>
                            <div class="detail-item"><strong>Número de Miembros:</strong> <span>${detalles.numero_miembros || 'N/A'}</span></div>
                        </div>
                    </div>
                `;
            } else if (tipo === 'institución' || tipo === 'otro') {
                if (tipo === 'otro' || detalles.tipo_institucion === 'otro') {
                    detallesHTML = `
                        <div class="detail-section">
                            <h4 class="section-title">Información</h4>
                            <div class="detail-grid">
                                <div class="detail-item"><strong>Nombre:</strong> <span>${detalles.nombre || nombre}</span></div>
                                ${detalles.tipo_descripcion ? `<div class="detail-item"><strong>Tipo/Descripción:</strong> <span>${detalles.tipo_descripcion}</span></div>` : ''}
                                ${detalles.contacto ? `<div class="detail-item"><strong>Contacto:</strong> <span>${detalles.contacto}</span></div>` : ''}
                                <div class="detail-item"><strong>Teléfono:</strong> <span>${detalles.telefono || 'N/A'}</span></div>
                            </div>
                        </div>
                    `;
                } else {
                    detallesHTML = `
                        <div class="detail-section">
                            <h4 class="section-title">Información de la Institución</h4>
                            <div class="detail-grid">
                                <div class="detail-item"><strong>Nombre:</strong> <span>${detalles.nombre_institucion || ''}</span></div>
                                <div class="detail-item"><strong>Tipo:</strong> <span>${detalles.tipo_institucion || 'N/A'}</span></div>
                                <div class="detail-item"><strong>Representante Legal:</strong> <span>${detalles.representante_legal || 'N/A'}</span></div>
                                <div class="detail-item"><strong>DPI Representante:</strong> <span>${detalles.dpi_representante || 'N/A'}</span></div>
                                <div class="detail-item"><strong>Teléfono:</strong> <span>${detalles.telefono || 'N/A'}</span></div>
                                ${detalles.email ? `<div class="detail-item"><strong>Email:</strong> <span>${detalles.email}</span></div>` : ''}
                                <div class="detail-item"><strong>Beneficiarios Directos:</strong> <span>${detalles.numero_beneficiarios_directos || 'N/A'}</span></div>
                            </div>
                        </div>
                    `;
                }
            }
            
            content.innerHTML = `
                <div class="detail-section">
                    <h4 class="section-title">Información General</h4>
                    <div class="detail-grid">
                        <div class="detail-item"><strong>Tipo:</strong> <span>${b.tipo_display || tipo}</span></div>
                        <div class="detail-item"><strong>Comunidad:</strong> <span>${b.comunidad_nombre || 'N/A'}</span></div>
                        ${b.region_nombre ? `<div class="detail-item"><strong>Región:</strong> <span>${b.region_nombre}</span></div>` : ''}
                        ${b.creado_en ? `<div class="detail-item"><strong>Creado:</strong> <span>${new Date(b.creado_en).toLocaleString('es-GT')}</span></div>` : ''}
                    </div>
                </div>
                ${detallesHTML}
                ${proyectos.length > 0 ? `
                <div class="detail-section">
                    <h4 class="section-title">Proyectos Vinculados (${proyectos.length})</h4>
                    <ul class="project-list-detail">
                        ${proyectos.map(p => `
                            <li>${p.nombre}${p.fecha ? ` - ${new Date(p.fecha).toLocaleDateString('es-GT')}` : ''}${p.tipo ? ` (${p.tipo})` : ''}</li>
                        `).join('')}
                    </ul>
                </div>
                ` : '<div class="detail-section"><p style="color: #6c757d;">Este beneficiario no está vinculado a ningún proyecto.</p></div>'}
            `;
        } else {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <p>Error al cargar detalles: ${data.error || 'Error desconocido'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc3545;">
                <p>Error al cargar detalles del beneficiario</p>
            </div>
        `;
    }
}

function closeBeneficiaryDetailsModal() {
    const modal = document.getElementById('beneficiaryDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateTipoFilter() {
    const checkboxes = document.querySelectorAll('#filterTipoBeneficiario input[type="checkbox"]:checked');
    filters.tipoBeneficiario = Array.from(checkboxes).map(cb => cb.value);
    applyFiltersAndSort();
}

async function searchComunidadAutocomplete(query) {
    const searchResults = document.getElementById('searchResultsComunidadListado');
    if (!searchResults) return;
    
    // Si la consulta está vacía o es muy corta, ocultar resultados
    if (!query || query.trim().length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const searchQuery = query.trim().toLowerCase();
    
    try {
        // Cargar todas las comunidades si no están cargadas
        if (allComunidades.length === 0) {
            await asegurarDatosRegionesComunidades();
        }
        
        // Filtrar comunidades localmente
        const comunidadesFiltradas = allComunidades.filter(c => {
            const nombreMatch = c.nombre.toLowerCase().includes(searchQuery);
            const regionMatch = c.region_nombre && c.region_nombre.toLowerCase().includes(searchQuery);
            return nombreMatch || regionMatch;
        });
        
        if (comunidadesFiltradas.length > 0) {
            searchResults.innerHTML = comunidadesFiltradas.slice(0, 10).map(c => {
                const nombreEscapado = c.nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                return `
                    <div class="search-result-item" onclick="selectComunidadFilter('${c.id}', '${nombreEscapado}')">
                        <strong>${c.nombre}</strong>
                        ${c.region_nombre ? `<span style="color: #6c757d; font-size: 12px;"> - ${c.region_nombre}</span>` : ''}
                    </div>
                `;
            }).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div style="padding: 12px; color: #6c757d; text-align: center;">No se encontraron comunidades</div>';
            searchResults.style.display = 'block';
        }
    } catch (error) {
        console.error('Error en búsqueda de comunidades:', error);
        if (searchResults) searchResults.style.display = 'none';
    }
}

function selectComunidadFilter(comunidadId, comunidadNombre) {
    if (!filters.comunidad.includes(comunidadId)) {
        filters.comunidad.push(comunidadId);
    }
    updateComunidadTags();
    const searchInput = document.getElementById('searchComunidadListado');
    if (searchInput) {
        searchInput.value = '';
    }
    const searchResults = document.getElementById('searchResultsComunidadListado');
    if (searchResults) searchResults.style.display = 'none';
    applyFiltersAndSort();
}

function updateComunidadTags() {
    const container = document.getElementById('selectedComunidadesTags');
    if (!container) return;
    
    if (filters.comunidad.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Obtener nombres de comunidades desde beneficiariosData o hacer fetch
    const tags = filters.comunidad.map(comunidadId => {
        // Buscar en los beneficiarios cargados
        const beneficiario = beneficiariosData.find(b => b.comunidad_id === comunidadId);
        return {
            id: comunidadId,
            nombre: beneficiario ? beneficiario.comunidad_nombre : 'Comunidad desconocida'
        };
    });
    
    container.innerHTML = tags.map(tag => `
        <span class="selected-tag">
            ${tag.nombre}
            <button class="selected-tag-remove" onclick="removeComunidadFilter('${tag.id}')">×</button>
        </span>
    `).join('');
}

function removeComunidadFilter(comunidadId) {
    filters.comunidad = filters.comunidad.filter(id => id !== comunidadId);
    updateComunidadTags();
    applyFiltersAndSort();
}

function resetFilters() {
    filters = {
        tipoBeneficiario: ['individual', 'familia', 'institución', 'otro'],
        comunidad: [],
        evento: []
    };
    
    // Resetear checkboxes
    document.querySelectorAll('#filterTipoBeneficiario input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
    
    // Resetear inputs
    const searchComunidad = document.getElementById('searchComunidadListado');
    if (searchComunidad) {
        searchComunidad.value = '';
        const searchResults = document.getElementById('searchResultsComunidadListado');
        if (searchResults) searchResults.style.display = 'none';
    }
    
    // Resetear eventos
    updateEventosTags();
    populateEventosFilter();
    
    // Resetear ordenamiento
    const sortSelect = document.getElementById('sortBeneficiaries');
    if (sortSelect) {
        sortSelect.value = 'reciente';
        sortOrder = 'reciente';
    }
    
    // Resetear búsqueda
    const listSearch = document.getElementById('beneficiariesListSearch');
    if (listSearch) {
        listSearch.value = '';
        searchQuery = '';
        const listSearchClear = document.getElementById('beneficiariesListSearchClear');
        if (listSearchClear) listSearchClear.style.display = 'none';
    }
    
    applyFiltersAndSort();
}

function applyFilters() {
    applyFiltersAndSort();
}

// Función global para toggle de checklist (usada en HTML)
function toggleChecklistBeneficiarios(id) {
    const container = document.getElementById(id + 'Container');
    const iconId = 'toggleIcon' + id.charAt(0).toUpperCase() + id.slice(1);
    const icon = document.getElementById(iconId);
    
    if (container && icon) {
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
        icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';
    }
}

// Hacer la función disponible globalmente
window.toggleChecklistBeneficiarios = toggleChecklistBeneficiarios;

// Función para sincronización fecha-edad (similar a gestioneseventos.js)
function configurarSincronizacionFechaEdad() {
    const fechaNacInput = document.getElementById('benef_ind_fecha_nac');
    const edadInput = document.getElementById('benef_ind_edad');
    const edadDisplay = document.getElementById('benef_ind_edad_display');
    
    if (fechaNacInput && edadInput) {
        fechaNacInput.addEventListener('change', function() {
            const fecha = this.value;
            if (fecha) {
                const edad = calcularEdadDesdeFecha(fecha);
                if (edad !== null) {
                    edadInput.value = edad;
                    if (edadDisplay) {
                        edadDisplay.textContent = `(${edad} años)`;
                    }
                }
            } else {
                edadInput.value = '';
                if (edadDisplay) {
                    edadDisplay.textContent = '';
                }
            }
        });
        
        edadInput.addEventListener('input', function() {
            if (edadDisplay && this.value) {
                edadDisplay.textContent = `(${this.value} años)`;
            } else if (edadDisplay) {
                edadDisplay.textContent = '';
            }
        });
    }
}

function calcularEdadDesdeFecha(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    return edad;
}

// Inicializar sincronización cuando se muestra el formulario individual
document.addEventListener('DOMContentLoaded', function() {
    const tipoSelect = document.getElementById('benef_tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            if (this.value === 'individual') {
                setTimeout(() => configurarSincronizacionFechaEdad(), 100);
            }
        });
    }
});

