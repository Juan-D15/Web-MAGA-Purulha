// ======================================
// GESTIÓN DE EVENTOS - MAGA PURULHÁ
// VERSIÓN 44 - Validaciones de formularios (DPI, teléfono, email, nombres)
// ======================================

// Funciones de validación
function validarDPI(dpi) {
    if (!dpi) return { valido: false, mensaje: 'El DPI es obligatorio' };
    const dpiLimpio = dpi.replace(/\D/g, ''); // Solo números
    if (dpiLimpio.length !== 13) {
        return { valido: false, mensaje: 'El DPI debe tener exactamente 13 números' };
    }
    return { valido: true, mensaje: '' };
}

function validarTelefono(telefono) {
    if (!telefono) return { valido: false, mensaje: 'El teléfono es obligatorio' };
    const telefonoLimpio = telefono.replace(/\D/g, ''); // Solo números
    if (telefonoLimpio.length !== 8) {
        return { valido: false, mensaje: 'El teléfono debe tener exactamente 8 números' };
    }
    return { valido: true, mensaje: '' };
}

function validarEmail(email) {
    if (!email) return { valido: false, mensaje: 'El email es obligatorio' };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { valido: false, mensaje: 'Formato de email inválido. Debe ser: ejemplo@dominio.com' };
    }
    return { valido: true, mensaje: '' };
}

function validarNombre(nombre) {
    if (!nombre) return { valido: false, mensaje: 'Este campo es obligatorio' };
    const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!nombreRegex.test(nombre)) {
        return { valido: false, mensaje: 'Solo se permiten letras y espacios (no se permiten números)' };
    }
    return { valido: true, mensaje: '' };
}

function validarNumeroPositivo(numero, min = 1, max = null) {
    if (!numero) return { valido: true, mensaje: '' }; // Opcional
    const num = parseInt(numero);
    if (isNaN(num) || num < min) {
        return { valido: false, mensaje: `Debe ser un número mayor o igual a ${min}` };
    }
    if (max !== null && num > max) {
        return { valido: false, mensaje: `Debe ser un número menor o igual a ${max}` };
    }
    return { valido: true, mensaje: '' };
}

function normalizarTexto(texto) {
    if (!texto) return '';
    return texto
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function mostrarErrorCampo(input, mensaje) {
    input.style.borderColor = '#dc3545';
    input.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
    let errorMsg = input.parentElement.querySelector('.error-message');
    if (!errorMsg) {
        errorMsg = document.createElement('small');
        errorMsg.className = 'error-message';
        errorMsg.style.color = '#dc3545';
        errorMsg.style.display = 'block';
        errorMsg.style.marginTop = '4px';
        input.parentElement.appendChild(errorMsg);
    }
    errorMsg.textContent = mensaje;
}

function limpiarErrorCampo(input) {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
    const errorMsg = input.parentElement.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.remove();
    }
}

    function aplicarValidacionTiempoReal(input, tipoValidacion, params = {}) {
    // Evitar agregar listeners duplicados usando una marca
    if (input.dataset.validacionAplicada === 'true') {
        return; // Ya tiene validaciones aplicadas
    }
    input.dataset.validacionAplicada = 'true';
        const esOpcional = params.optional === true;
    
    const handlerInput = function() {
        let resultado = { valido: true, mensaje: '' };
            const valorActual = this.value ? this.value.trim() : '';
    
            if (esOpcional && valorActual === '') {
                limpiarErrorCampo(this);
                return;
            }
        
        if (tipoValidacion === 'dpi') {
            resultado = validarDPI(this.value);
        } else if (tipoValidacion === 'telefono') {
            resultado = validarTelefono(this.value);
        } else if (tipoValidacion === 'email') {
            resultado = validarEmail(this.value);
        } else if (tipoValidacion === 'nombre') {
            resultado = validarNombre(this.value);
        } else if (tipoValidacion === 'numero') {
            resultado = validarNumeroPositivo(this.value, params.min, params.max);
        }
        
        if (!resultado.valido) {
            mostrarErrorCampo(this, resultado.mensaje);
        } else {
            limpiarErrorCampo(this);
        }
    };
    
    input.addEventListener('input', handlerInput);
    
    // Bloquear números para campos de nombre
    if (tipoValidacion === 'nombre') {
        const handlerKeypress = function(e) {
            // Permitir letras, espacios, teclas de control y caracteres especiales (á, é, í, ó, ú, ñ)
            const esLetra = /[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.key);
            const esTeclaControl = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key);
            if (!esLetra && !esTeclaControl) {
                e.preventDefault();
            }
        };
        
        const handlerPaste = function(e) {
            e.preventDefault();
            const texto = (e.clipboardData || window.clipboardData).getData('text');
            // Solo permitir letras, espacios y caracteres especiales
            const soloLetras = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            this.value = soloLetras;
            this.dispatchEvent(new Event('input'));
        };
        
        input.addEventListener('keypress', handlerKeypress);
        input.addEventListener('paste', handlerPaste);
    }
    
    // También validar solo números para DPI y teléfono
    if (tipoValidacion === 'dpi' || tipoValidacion === 'telefono') {
        const handlerKeypress = function(e) {
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        };
        
        const handlerPaste = function(e) {
            e.preventDefault();
            const texto = (e.clipboardData || window.clipboardData).getData('text');
            const soloNumeros = texto.replace(/\D/g, '');
            this.value = soloNumeros;
            this.dispatchEvent(new Event('input'));
        };
        
        input.addEventListener('keypress', handlerKeypress);
        input.addEventListener('paste', handlerPaste);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Variable para guardar la función de cargar evento (se asignará después de definirla)
    let cargarEventoDesdeHash = null;
    
    // ===== VARIABLES GLOBALES =====
    let comunidadesList = [];
    let regionesList = [];
    let personalList = [];
    let beneficiariosList = [];
    let selectedCommunitiesList = [];
    let pendingCommunitySelections = new Map();
    let selectedPersonnelList = [];
    let personalSearchTerm = '';
    let selectedBeneficiariosList = [];
    let accumulatedFiles = []; // Archivos acumulados
    let beneficiariosNuevos = []; // Beneficiarios a crear
    let beneficiariosPendientesExcel = []; // Beneficiarios importados de Excel pendientes de guardar
    let beneficiariosPendientesExcelGeneral = []; // Beneficiarios importados de Excel pendientes de guardar (modal general)
    let eventoEnEdicion = null;
    let lastEditedEventId = sessionStorage.getItem('lastEditedEventId') || null;
    
    // ===== ELEMENTOS DEL DOM =====
    const mainView = document.getElementById('mainView');
    const createEventView = document.getElementById('createEventView');
    const manageEventView = document.getElementById('manageEventView');
    
    // Botones de navegaci├│n
    const openCreateEventBtn = document.getElementById('openCreateEventBtn');
    const openManageEventBtn = document.getElementById('openManageEventBtn');
    const backFromCreateBtn = document.getElementById('backFromCreateBtn');
    const backFromManageBtn = document.getElementById('backFromManageBtn');
    
    // Formulario
    const eventForm = document.getElementById('eventForm');
    const fileInput = document.getElementById('evidences');
    const filePreview = document.getElementById('filePreview');
    const evidencesWrapper = document.getElementById('evidencesContainerWrapper');
    const evidencesToggleBtn = document.getElementById('toggleEvidencesListBtn');
    const beneficiariesFilterTypeSelect = document.getElementById('beneficiariesFilterType');
    const beneficiariesFilterRegionSelect = document.getElementById('beneficiariesFilterRegion');
    const beneficiariesFilterCommunitySelect = document.getElementById('beneficiariesFilterCommunity');
    const personnelSearchInput = document.getElementById('personnelSearch');
    
    // ===== FUNCIONES DE NAVEGACI├ôN =====
    function showMainView() {
        mainView.style.display = 'block';
        createEventView.style.display = 'none';
        manageEventView.style.display = 'none';
    }
    
    function resetQuickDataState() {
        projectDataExisting = [];
        projectDataNew = [];
        projectDataUpdated = [];
        projectDataDeleted = [];
        renderProjectDataCards();
    }

    function resetBeneficiariesState() {
        beneficiariosNuevos = [];
        beneficiariosExistentes = [];
        beneficiariosExistentesOriginales = [];
        beneficiariosModificados = [];
        beneficiariosEliminados = [];
        beneficiarioEnEdicion = null;
        beneficiariesCardId = null; // Limpiar ID de tarjeta de Beneficiarios
        if (beneficiariesFilterTypeSelect) {
            beneficiariesFilterTypeSelect.value = '';
        }
        if (beneficiariesFilterRegionSelect) {
            beneficiariesFilterRegionSelect.value = '';
        }
        renderBeneficiaryFiltersRegionOptions('');
        renderBeneficiaryFiltersCommunityOptions('');
        if (beneficiariesFilterCommunitySelect) {
            beneficiariesFilterCommunitySelect.value = '';
        }
        renderBeneficiariosExistentes();
        updateBeneficiariesCard(); // Actualizar tarjeta (debería eliminarla si no hay beneficiarios)
    }

    function resetPersonnelState() {
        selectedPersonnelList = [];
        renderPersonalList();
        updateSelectedPersonnelDisplay();
    }

    function resetCommunitiesState() {
        selectedCommunitiesList = [];
        pendingCommunitySelections.clear();
        renderSelectedCommunities();
    }

    function resetEventForm() {
        if (eventForm) eventForm.reset();
        accumulatedFiles = [];
        evidenciasExistentes = [];
        evidenciasEliminadas = [];
        updateFilePreview();
        resetCoverSelection();
        resetBeneficiaryLocation();
    }

    function resetFormHeader(isEditing = false, eventName = '') {
        const formTitle = document.querySelector('.view-title');
        if (formTitle) {
            formTitle.textContent = isEditing ? 'Editar Evento' : 'Crear Nuevo Evento';
        }
        const submitBtn = document.querySelector('.btn-create-event');
        if (submitBtn) {
            submitBtn.innerHTML = isEditing
                ? `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Actualizar Evento
                `
                : `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Crear Evento
                `;
        }
    }

    function resetFormStateForCreation() {
        eventoEnEdicion = null;
        resetQuickDataState();
        resetBeneficiariesState();
        resetPersonnelState();
        resetCommunitiesState();
        resetEventForm();
        resetFormHeader(false);
    }

    function showCreateEventView(isEditing = false) {
        mainView.style.display = 'none';
        createEventView.style.display = 'block';
        manageEventView.style.display = 'none';

        if (!isEditing) {
            resetFormStateForCreation();
        } else {
            resetFormHeader(true);
        }
    }
    
    function showManageEventView() {
        mainView.style.display = 'none';
        createEventView.style.display = 'none';
        manageEventView.style.display = 'block';
        
        // Limpiar el buscador cuando se muestra la vista
        const eventSearchInput = document.getElementById('eventSearchInput');
        const eventSearchClearBtn = document.getElementById('eventSearchClearBtn');
        if (eventSearchInput) {
            eventSearchInput.value = '';
        }
        if (eventSearchClearBtn) {
            eventSearchClearBtn.style.display = 'none';
        }

        cargarEventos();
    }
    
    if (personnelSearchInput) {
        personnelSearchInput.addEventListener('input', function(e) {
            personalSearchTerm = e.target.value || '';
            renderPersonalList();
        });
        personnelSearchInput.addEventListener('search', function(e) {
            personalSearchTerm = e.target.value || '';
            renderPersonalList();
        });
    }
    
    // Event listeners de navegación
    if (openCreateEventBtn) {
        openCreateEventBtn.addEventListener('click', () => showCreateEventView(false));
    }
    
    if (openManageEventBtn) {
        openManageEventBtn.addEventListener('click', showManageEventView);
    }
    
    // Detectar hash en la URL al cargar la página para mostrar la vista correspondiente
    // Esto debe ejecutarse inmediatamente después de que las funciones estén definidas
    function checkHashAndShowView() {
        let hash = window.location.hash;
        
        // Extraer parámetros del hash PRIMERO (ej: #createEventView&evento=123)
        let eventoId = null;
        let hashBasico = hash;
        if (hash.includes('&evento=')) {
            const partes = hash.split('&evento=');
            hashBasico = partes[0]; // Solo el hash sin parámetros
            eventoId = partes[1]; // ID del evento
        }
        
        // Si hay un eventoId, NO mostrar ninguna vista todavía - cargar directamente
        if (eventoId) {
            const cargarFuncion = cargarEventoDesdeHash || cargarEventoParaEditar;
            if (typeof cargarFuncion === 'function') {
                cargarFuncion(eventoId);
                return; // Importante: salir aquí para no mostrar otras vistas
            } else {
                // Reintentar después de un tiempo más largo
                setTimeout(() => {
                    const cargarFuncionRetry = cargarEventoDesdeHash || cargarEventoParaEditar;
                    if (typeof cargarFuncionRetry === 'function') {
                        cargarFuncionRetry(eventoId);
                    } else {
                    }
                }, 1500);
                return; // Salir aquí también para no mostrar otras vistas
            }
        }
        
        // Si no hay hash en la URL, verificar sessionStorage por si viene de un login
        if (!hashBasico || hashBasico === '') {
            const savedAction = sessionStorage.getItem('gestionesAction');
            if (savedAction) {
                hashBasico = '#' + savedAction;
                sessionStorage.removeItem('gestionesAction'); // Limpiar después de usar
                // Actualizar la URL sin recargar la página
                window.history.replaceState(null, '', window.location.pathname + hashBasico);
            }
        }
        
        // Mostrar la vista correspondiente según el hash (solo si no había eventoId)
        if (hashBasico === '#createEventView') {
            showCreateEventView(false);
        } else if (hashBasico === '#manageEventView') {
            showManageEventView();
        } else if (hashBasico === '#createReport') {
            // Redirigir a la página de reportes
            if (window.DJANGO_URLS && window.DJANGO_URLS.reportes) {
                window.location.href = window.DJANGO_URLS.reportes;
                return;
            }
        } else {
            // Si no hay hash, mostrar la vista principal
            showMainView();
        }
    }
    
    // Ejecutar la verificación del hash DESPUÉS de que todas las funciones estén definidas
    // Primero ocultar todas las vistas para evitar parpadeo
    // IMPORTANTE: Si hay eventoId en el hash, mantener todas las vistas ocultas hasta que se cargue el evento
    const hashActual = window.location.hash;
    const tieneEventoId = hashActual.includes('&evento=');
    
    if (!tieneEventoId) {
        // Si NO hay eventoId, ocultar todas las vistas normalmente
        if (mainView) mainView.style.display = 'none';
        if (createEventView) createEventView.style.display = 'none';
        if (manageEventView) manageEventView.style.display = 'none';
    } else {
        // Si hay eventoId, mantener todas las vistas ocultas hasta que se cargue el evento
        if (mainView) mainView.style.display = 'none';
        if (createEventView) createEventView.style.display = 'none';
        if (manageEventView) manageEventView.style.display = 'none';
    }
    
    if (backFromCreateBtn) {
        backFromCreateBtn.addEventListener('click', () => {
            const estabaEditando = Boolean(eventoEnEdicion);
            resetFormStateForCreation();
            if (estabaEditando) {
                showManageEventView();
                cargarEventos();
            } else {
                showMainView();
            }
        });
    }
    
    if (backFromManageBtn) {
        backFromManageBtn.addEventListener('click', showMainView);
    }
    
    // ===== CARGAR DATOS DESDE LA API =====
    async function cargarDatos() {
        try {
            // Cargar comunidades
            const responseComunidades = await fetch('/api/comunidades/');
            if (responseComunidades.ok) {
                const dataComunidades = await responseComunidades.json();
                comunidadesList = dataComunidades;
                renderBeneficiaryCommunityOptions(benefRegionSelect ? benefRegionSelect.value : '', benefCommunitySelect ? benefCommunitySelect.value : '');
                renderBeneficiaryFiltersCommunityOptions(beneficiariesFilterRegionSelect ? beneficiariesFilterRegionSelect.value : '');
            }
            
            // Cargar regiones
            const responseRegiones = await fetch('/api/regiones/');
            if (responseRegiones.ok) {
                regionesList = await responseRegiones.json();
                regionesList.sort((a, b) => {
                    const codeA = parseInt(a.codigo, 10);
                    const codeB = parseInt(b.codigo, 10);
                    const hasCodeA = !Number.isNaN(codeA);
                    const hasCodeB = !Number.isNaN(codeB);

                    if (hasCodeA && hasCodeB && codeA !== codeB) {
                        return codeA - codeB;
                    }
                    if (hasCodeA && !hasCodeB) {
                        return -1;
                    }
                    if (!hasCodeA && hasCodeB) {
                        return 1;
                    }

                    const nombreA = (a.nombre || '').toString();
                    const nombreB = (b.nombre || '').toString();
                    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base', numeric: true });
                });
                renderBeneficiaryRegionOptions(benefRegionSelect ? benefRegionSelect.value : '');
                renderBeneficiaryCommunityOptions(benefRegionSelect ? benefRegionSelect.value : '', benefCommunitySelect ? benefCommunitySelect.value : '');
                renderBeneficiaryFiltersRegionOptions(beneficiariesFilterRegionSelect ? beneficiariesFilterRegionSelect.value : '');
                renderBeneficiaryFiltersCommunityOptions(beneficiariesFilterRegionSelect ? beneficiariesFilterRegionSelect.value : '', beneficiariesFilterCommunitySelect ? beneficiariesFilterCommunitySelect.value : '');
            }
            
            // Cargar personal
            const responsePersonal = await fetch('/api/personal/');
            if (responsePersonal.ok) {
                const dataPersonal = await responsePersonal.json();
                personalList = dataPersonal;
                renderPersonalList();
            }
            
            // Ya no cargamos beneficiarios de la API (se crean en el formulario)
            
        } catch (error) {
        }
    }
    
    // Cargar datos al iniciar
    cargarDatos();
    
    // Cargar cambios recientes
    cargarCambiosRecientes();
    
    // ===== RENDERIZAR LISTA DE PERSONAL =====
    function renderPersonalList() {
        const personnelListContainer = document.getElementById('personnelList');
        if (!personnelListContainer) return;
        
        personnelListContainer.innerHTML = '';

        const terminoBusqueda = normalizarTexto(personalSearchTerm);
        const personalFiltrado = personalList.filter(persona => {
            if (!terminoBusqueda) return true;
            const nombre = normalizarTexto(persona.nombre || '');
            const usuario = normalizarTexto(persona.username || '');
            return nombre.includes(terminoBusqueda) || usuario.includes(terminoBusqueda);
        });
        
        if (personalFiltrado.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'personnel-empty-state';
            emptyMessage.style.color = '#b8c5d1';
            emptyMessage.style.padding = '16px';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.fontSize = '0.9rem';
            emptyMessage.textContent = terminoBusqueda
                ? `No se encontró personal que coincida con "${personalSearchTerm.trim()}".`
                : 'No hay personal disponible.';
            personnelListContainer.appendChild(emptyMessage);
            return;
        }
        
        personalFiltrado.forEach(persona => {
            const item = document.createElement('div');
            item.className = 'personnel-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `personal-${persona.id}`;
            checkbox.value = persona.id;
            
            // Verificar si el ID está en la lista preseleccionada
            // Comparar como strings para asegurar coincidencia
            const personaIdStr = String(persona.id);
            const isSelected = selectedPersonnelList.some(p => {
                if (typeof p === 'object') {
                    return String(p.id) === personaIdStr;
                } else {
                    return String(p) === personaIdStr;
                }
            });
            
            checkbox.checked = isSelected;
            
            if (isSelected) {
            }
            
            checkbox.addEventListener('change', function() {
                const personaIdStr = String(persona.id);
                if (this.checked) {
                    // Agregar como objeto
                    if (!selectedPersonnelList.some(p => {
                        const pId = typeof p === 'object' ? String(p.id) : String(p);
                        return pId === personaIdStr;
                    })) {
                        selectedPersonnelList.push({
                            id: personaIdStr, // Guardar como string
                            username: persona.username,
                            nombre: persona.nombre,  // Incluir nombre completo
                            rol: persona.rol_display || persona.rol || 'Colaborador',
                            tipo: persona.tipo || 'colaborador'
                        });
                        const displayName = persona.nombre || persona.username;
                    }
                } else {
                    // Filtrar el personal removido
                    selectedPersonnelList = selectedPersonnelList.filter(p => {
                        const pId = typeof p === 'object' ? String(p.id) : String(p);
                        return pId !== personaIdStr;
                    });
                    const displayName = persona.nombre || persona.username;
                }
                updateSelectedPersonnelDisplay();
            });
            
            const label = document.createElement('label');
            label.htmlFor = `personal-${persona.id}`;
            
            // Crear estructura mejorada para mostrar nombre, puesto y rol
            const nombreDisplay = persona.nombre || persona.username;  // Usar nombre completo o username
            const puestoInfo = persona.puesto || 'Sin puesto asignado';
            const rolInfo = persona.rol_display || persona.rol || 'Personal';
            
            label.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: 600; color: #f8f9fa; font-size: 0.95rem;">${nombreDisplay}</span>
                    <span style="font-size: 0.85rem; color: #007bff; font-weight: 500;">${puestoInfo}</span>
                    <span style="font-size: 0.8rem; color: #b8c5d1; text-transform: capitalize;">${rolInfo}</span>
                </div>
            `;
            
            item.appendChild(checkbox);
            item.appendChild(label);
            personnelListContainer.appendChild(item);
        });
        
    }
    
    function updateSelectedPersonnelDisplay() {
        const selectedPersonnel = document.getElementById('selectedPersonnel');
        if (!selectedPersonnel) return;
        
        const count = selectedPersonnelList.length;
        const icon = count > 0 ? '✅' : '';
        const text = count === 1 ? '1 persona seleccionada' : `${count} personas seleccionadas`;
        
        selectedPersonnel.innerHTML = `
            <span class="selected-count" style="display: flex; align-items: center; gap: 6px;">
                ${count > 0 ? `<span style="color: #28a745; font-size: 16px;">${icon}</span>` : ''}
                ${text}
            </span>
        `;
    }
    
    // ===== GESTIÓN DE COMUNIDADES =====
    const addCommunityBtn = document.getElementById('addCommunityBtn');
    const communitiesSection = document.getElementById('communitiesSection');
    const communitiesContainer = document.getElementById('communitiesContainer');
    const communityCount = document.getElementById('communityCount');
    const addCommunityModal = document.getElementById('addCommunityModal');
    const closeCommunityModalBtn = document.getElementById('closeCommunityModal');
    const cancelCommunityBtn = document.getElementById('cancelCommunityBtn');
    const confirmCommunityBtn = document.getElementById('confirmCommunityBtn');
    const communityRegionSelect = document.getElementById('community_region_select');
    const communityRegionLabel = document.querySelector('.community-region-label');
    const editCommunityDateModal = document.getElementById('editCommunityDateModal');
    const closeEditCommunityDateModalBtn = document.getElementById('closeEditCommunityDateModal');
    const cancelEditCommunityDateBtn = document.getElementById('cancelEditCommunityDateBtn');
    const confirmEditCommunityDateBtn = document.getElementById('confirmEditCommunityDateBtn');
    const communityDateInput = document.getElementById('community_date_input');

    function hideElementForModal(element) {
        if (!element) return;
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.width = '1px';
        element.style.height = '1px';
        element.style.clip = 'rect(0 0 0 0)';
        element.style.margin = '0';
        element.style.padding = '0';
    }

    function showElementForModal(element) {
        if (!element) return;
        element.style.removeProperty('display');
        element.style.removeProperty('visibility');
        element.style.removeProperty('opacity');
        element.style.removeProperty('position');
        element.style.removeProperty('pointer-events');
        element.style.removeProperty('width');
        element.style.removeProperty('height');
        element.style.removeProperty('clip');
        element.style.removeProperty('margin');
        element.style.removeProperty('padding');
    }

    if (communityRegionSelect) {
        hideElementForModal(communityRegionSelect);
    }
    if (communityRegionLabel) {
        hideElementForModal(communityRegionLabel);
    }
    const communitySearchInput = document.getElementById('community_search_input');
    const communityListContainer = document.getElementById('community_list_container');
    const coverFileInput = document.getElementById('coverFileInput');
    const coverRemoveBtn = document.getElementById('coverRemoveBtn');
    const coverImagePreview = document.getElementById('coverImagePreview');
    const coverPreviewWrapper = document.getElementById('coverPreviewWrapper');
    
    const quickDataAddArea = document.querySelector('.beneficiary-upload');
    const addQuickDataBtn = document.getElementById('addQuickDataBtn');
    const quickDataSection = document.getElementById('quickDataSection');
    const quickDataContainer = document.getElementById('quickDataContainer');
    const quickDataCount = document.getElementById('quickDataCount');
    const quickDataModal = document.getElementById('quickDataModal');
    const closeQuickDataModal = document.getElementById('closeQuickDataModal');
    const cancelQuickDataBtn = document.getElementById('cancelQuickDataBtn');
    const saveQuickDataBtn = document.getElementById('saveQuickDataBtn');
    // Estos campos ya no existen, se eliminaron al cambiar al nuevo modal de tarjetas
    // const quickDataEmojiInput = document.getElementById('quickDataEmoji');
    // const quickDataTitleInput = document.getElementById('quickDataTitle');
    // const quickDataDescriptionInput = document.getElementById('quickDataDescription');
    const benefRegionSelect = document.getElementById('benef_region_select');
    const benefCommunitySelect = document.getElementById('benef_comunidad_select');
    const benefNuevoCatalogSearchInput = document.getElementById('benef_nuevo_catalog_input');
    const benefNuevoCatalogSuggestions = document.getElementById('benef_nuevo_catalog_suggestions');

    if (benefRegionSelect) {
        hideElementForModal(benefRegionSelect);
    }
    if (benefCommunitySelect) {
        hideElementForModal(benefCommunitySelect);
    }

    function showCommunityRegionSelector() {
        showElementForModal(communityRegionLabel);
        showElementForModal(communityRegionSelect);
    }

    function hideCommunityRegionSelector() {
        hideElementForModal(communityRegionSelect);
        hideElementForModal(communityRegionLabel);
    }

    function showBeneficiarySelectors() {
        if (benefRegionSelect) {
            showElementForModal(benefRegionSelect);
        }
        if (benefCommunitySelect) {
            showElementForModal(benefCommunitySelect);
        }
    }

    function hideBeneficiarySelectors() {
        if (benefRegionSelect) {
            hideElementForModal(benefRegionSelect);
        }
        if (benefCommunitySelect) {
            hideElementForModal(benefCommunitySelect);
        }
    }
    
    let beneficiariosExistentes = []; // Beneficiarios ya asociados al evento (en modo edición)
    let beneficiariosExistentesOriginales = []; // IDs originales para detectar nuevos en modo edición
    let beneficiariosBusquedaResultados = [];
    let beneficiariosCatalogo = [];
    let beneficiariosCatalogoPromise = null;
    let benefCatalogItems = [];
    const benefCatalogStates = {
        existente: { filtered: [], activeIndex: -1 },
        nuevo: { filtered: [], activeIndex: -1 },
    };
    let beneficiarioModo = 'nuevo';
    let benefSearchTimeout = null;
    let coverImageFile = null;
    let coverImageData = null;
    let coverImageRemoved = false;
    let coverImageObjectUrl = null;
    let beneficiariosEliminados = []; // IDs de beneficiarios a eliminar
    let beneficiariosModificados = []; // Beneficiarios existentes que fueron modificados
    let evidenciasExistentes = []; // Evidencias ya asociadas al evento
    let evidenciasEliminadas = []; // IDs de evidencias a eliminar
    let beneficiarioEnEdicion = null; // Beneficiario que se está editando (puede ser nuevo o existente)
    let projectDataExisting = [];
    let projectDataNew = [];
    let projectDataUpdated = [];
    let projectDataDeleted = [];
    let quickDataEditing = null;
    
    // Variables para tarjetas predefinidas en el modal de eventos
    const predefinedCardsEvent = [
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
    let selectedCardsEvent = [];
    let beneficiariesCardId = null; // ID de la tarjeta de Beneficiarios automática
    let tabsInitialized = false; // Flag para saber si las pestañas ya están inicializadas
    
    function normalizeDpiValue(value) {
        if (!value) return '';
        return value.toString().replace(/\D/g, '');
    }

    function getBeneficiaryDpiValue(beneficiario) {
        if (!beneficiario) return '';
        const detalles = beneficiario.detalles || {};
        const tipo = (beneficiario.tipo || '').toLowerCase();
        if (tipo === 'individual') {
            return normalizeDpiValue(beneficiario.dpi || detalles.dpi || '');
        }
        if (tipo === 'familia') {
            return normalizeDpiValue(beneficiario.dpi_jefe_familia || detalles.dpi_jefe_familia || '');
        }
        if (tipo === 'institucion' || tipo === 'institución') {
            return normalizeDpiValue(beneficiario.dpi_representante || detalles.dpi_representante || '');
        }
        return '';
    }

    function describeBeneficiary(beneficiario) {
        if (!beneficiario) return 'otro beneficiario';
        const detalles = beneficiario.detalles || {};
        return beneficiario.display_name
            || detalles.display_name
            || beneficiario.nombre
            || detalles.nombre
            || beneficiario.nombre_familia
            || detalles.nombre_familia
            || beneficiario.nombre_institucion
            || detalles.nombre_institucion
            || 'otro beneficiario';
    }

    function findExistingBeneficiaryByDpi(dpiNormalizado, opciones = {}) {
        if (!dpiNormalizado) return null;
        const excludeId = opciones.excludeId ? String(opciones.excludeId) : null;
        const excludeTempId = opciones.excludeTempId || null;

        for (const benef of beneficiariosExistentes) {
            if (!benef) continue;
            if (excludeId && String(benef.id) === excludeId) continue;
            const candidateDpi = getBeneficiaryDpiValue(benef);
            if (candidateDpi && candidateDpi === dpiNormalizado) {
                return { origen: 'existente', item: benef };
            }
        }

        for (const benef of beneficiariosNuevos) {
            if (!benef) continue;
            if (excludeTempId && benef.temporal_id === excludeTempId) continue;
            const candidateDpi = getBeneficiaryDpiValue(benef);
            if (candidateDpi && candidateDpi === dpiNormalizado) {
                return { origen: 'nuevo', item: benef };
            }
        }

        return null;
    }
    
    function openModalElement(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'flex';
        requestAnimationFrame(() => {
            modalElement.classList.add('show');
        });
    }

    function closeModalElement(modalElement) {
        if (!modalElement) return;
        modalElement.classList.remove('show');
        setTimeout(() => {
            modalElement.style.display = 'none';
        }, 200);
    }

    // Función para verificar si el usuario es admin
    function isUserAdmin() {
        // Verificar desde window.USER_AUTH si está disponible
        if (window.USER_AUTH && window.USER_AUTH.isAuthenticated) {
            return window.USER_AUTH.isAdmin === true;
        }
        
        // Verificar desde variable global usuario_maga si está disponible
        if (typeof usuario_maga !== 'undefined' && usuario_maga) {
            return usuario_maga.es_admin === true;
        }
        
        // Verificar desde elementos del DOM
        const userPermissions = document.getElementById('userPermissions');
        if (userPermissions) {
            return userPermissions.dataset.isAdmin === 'true';
        }
        
        return false;
    }
    
    function renderSelectedCommunities() {
        if (!communitiesContainer || !communitiesSection) return;

        communitiesContainer.innerHTML = '';

        if (selectedCommunitiesList.length === 0) {
            communitiesSection.style.display = 'none';
            if (communityCount) {
                communityCount.textContent = '';
            }
            return;
        }

        communitiesSection.style.display = 'block';
        if (communityCount) {
            communityCount.textContent = selectedCommunitiesList.length === 1
                ? '1 comunidad'
                : `${selectedCommunitiesList.length} comunidades`;
        }

        selectedCommunitiesList.forEach((item, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);';

            const regionInfo = item.region_nombre ? `${item.region_nombre}${item.region_sede ? ` — ${item.region_sede}` : ''}` : 'Sin región';
            const fechaAgregada = item.agregado_en ? new Date(item.agregado_en) : null;
            const fechaTexto = fechaAgregada
                ? fechaAgregada.toLocaleDateString('es-GT', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                })
                : null;

            wrapper.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-weight: 600; color: #f5f7fa; font-size: 0.95rem;">${item.comunidad_nombre || 'Comunidad'}</span>
                    <span style="font-size: 0.85rem; color: #b8c5d1;">${regionInfo}</span>
                    <span style="font-size: 0.75rem; color: #94a3b8;">
                        ${fechaTexto ? `Agregada el <span class="community-date-display">${fechaTexto}</span>` : '<span class="community-date-display">Fecha no registrada</span>'}
                    </span>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button type="button" class="btn-edit-community-date" data-index="${index}" style="background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.4); padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Editar fecha</button>
                    <button type="button" class="btn-remove-community" data-index="${index}" style="background: #dc3545; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">× Quitar</button>
                </div>
            `;

            const removeBtn = wrapper.querySelector('.btn-remove-community');
            removeBtn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'), 10);
                selectedCommunitiesList.splice(idx, 1);
                renderSelectedCommunities();
            });

            const editDateBtn = wrapper.querySelector('.btn-edit-community-date');
            editDateBtn.addEventListener('click', () => {
                const idx = parseInt(editDateBtn.getAttribute('data-index'), 10);
                const comunidad = selectedCommunitiesList[idx];
                if (!comunidad) return;
                showEditCommunityDateModal(idx, comunidad.agregado_en);
            });

            communitiesContainer.appendChild(wrapper);
        });
    }

    function showEditCommunityDateModal(index, fechaISO) {
        const modal = document.getElementById('editCommunityDateModal');
        const input = document.getElementById('community_date_input');
        if (!modal || !input) return;

        const fecha = fechaISO ? new Date(fechaISO) : new Date();
        input.value = !Number.isNaN(fecha.getTime()) ? fecha.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        modal.dataset.communityIndex = index;

        openModalElement(modal);
    }

    function closeEditCommunityDateModal() {
        const modal = document.getElementById('editCommunityDateModal');
        if (!modal) return;
        delete modal.dataset.communityIndex;
        closeModalElement(modal);
    }

    function closeCommunityModal() {
        if (!addCommunityModal) return;
        addCommunityModal.classList.remove('show');
        setTimeout(() => {
            addCommunityModal.style.display = 'none';
        }, 300);
        if (communitySearchInput) {
            communitySearchInput.value = '';
        }
        // Limpiar selección de región al cerrar
        if (communityRegionSelect) {
            communityRegionSelect.value = '';
            hideCommunityRegionSelector();
        }
        // Limpiar lista de comunidades
        if (communityListContainer) {
            communityListContainer.innerHTML = '';
        }
        pendingCommunitySelections.clear();
    }
    
    // Cerrar modal al hacer click fuera (usando flag para evitar duplicados)
    if (addCommunityModal && !addCommunityModal.dataset.closeListenerAdded) {
        addCommunityModal.addEventListener('click', function(e) {
            if (e.target === addCommunityModal) {
                e.stopPropagation();
                closeCommunityModal();
            }
        });
        addCommunityModal.dataset.closeListenerAdded = 'true';
    }

    function renderCommunityOptions(regionId, searchTerm = '') {
        if (!communityListContainer) return;
        communityListContainer.innerHTML = '';

        let comunidadesFiltradas = comunidadesList;
        if (regionId) {
            // Convertir ambos IDs a string para comparación correcta
            const regionIdStr = String(regionId);
            comunidadesFiltradas = comunidadesFiltradas.filter(c => {
                if (!c.region || !c.region.id) return false;
                return String(c.region.id) === regionIdStr;
            });
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            comunidadesFiltradas = comunidadesFiltradas.filter(c =>
                (c.nombre && c.nombre.toLowerCase().includes(term)) ||
                (c.codigo && c.codigo.toLowerCase().includes(term))
            );
        }

        const comunidadesOrdenadas = [...comunidadesFiltradas].sort((a, b) => {
            const regionCodigoA = a.region && a.region.codigo ? parseInt(a.region.codigo, 10) : NaN;
            const regionCodigoB = b.region && b.region.codigo ? parseInt(b.region.codigo, 10) : NaN;
            const regionTieneCodigoA = !Number.isNaN(regionCodigoA);
            const regionTieneCodigoB = !Number.isNaN(regionCodigoB);

            if (regionTieneCodigoA && regionTieneCodigoB && regionCodigoA !== regionCodigoB) {
                return regionCodigoA - regionCodigoB;
            }
            if (regionTieneCodigoA && !regionTieneCodigoB) {
                return -1;
            }
            if (!regionTieneCodigoA && regionTieneCodigoB) {
                return 1;
            }

            const regionNombreA = a.region && a.region.nombre ? a.region.nombre.toLowerCase() : '';
            const regionNombreB = b.region && b.region.nombre ? b.region.nombre.toLowerCase() : '';
            const compareRegionNombre = regionNombreA.localeCompare(regionNombreB, 'es', { sensitivity: 'base', numeric: true });
            if (compareRegionNombre !== 0) return compareRegionNombre;

            const nombreA = (a.nombre || '').toLowerCase();
            const nombreB = (b.nombre || '').toLowerCase();
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base', numeric: true });
        });

        if (comunidadesOrdenadas.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'padding: 12px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; color: #b8c5d1; text-align: center;';
            emptyMsg.textContent = 'No se encontraron comunidades para los filtros seleccionados.';
            communityListContainer.appendChild(emptyMsg);
            return;
        }

        comunidadesOrdenadas.forEach(comunidad => {
            const item = document.createElement('label');
            item.className = 'community-modal-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'community-option';
            const comunidadIdStr = String(comunidad.id);
            checkbox.value = comunidadIdStr;
            checkbox.dataset.regionId = comunidad.region ? String(comunidad.region.id) : '';
            checkbox.dataset.comunidadNombre = comunidad.nombre || 'Comunidad';

            const regionInfo = regionesList.find(r => String(r.id) === checkbox.dataset.regionId);
            checkbox.dataset.regionNombre = regionInfo ? regionInfo.nombre : (comunidad.region ? comunidad.region.nombre : '');
            checkbox.dataset.regionSede = regionInfo ? (regionInfo.comunidad_sede || '') : '';

            const yaSeleccionada = selectedCommunitiesList.some(sc => sc.comunidad_id === comunidadIdStr);
            const pendienteSeleccion = pendingCommunitySelections.has(comunidadIdStr);
            if (yaSeleccionada) {
                checkbox.checked = true;
                checkbox.disabled = true;
                checkbox.dataset.preselected = 'true';
            } else if (pendienteSeleccion) {
                checkbox.checked = true;
            }

            const infoDiv = document.createElement('div');
            infoDiv.className = 'community-modal-info';
            infoDiv.innerHTML = `
                <span class="community-modal-name">${comunidad.nombre}</span>
                <span class="community-modal-region">${checkbox.dataset.regionNombre || 'Sin región'}</span>
            `;

            item.appendChild(checkbox);
            item.appendChild(infoDiv);
            communityListContainer.appendChild(item);

            if (!yaSeleccionada) {
                checkbox.addEventListener('change', function() {
                    const id = this.value;
                    if (this.checked) {
                        pendingCommunitySelections.set(id, {
                            comunidad_id: id,
                            comunidad_nombre: this.dataset.comunidadNombre || 'Comunidad',
                            region_id: this.dataset.regionId || null,
                            region_nombre: this.dataset.regionNombre || '',
                            region_sede: this.dataset.regionSede || ''
                        });
                    } else {
                        pendingCommunitySelections.delete(id);
                    }
                });
            }
        });
    }

    async function openCommunityModal() {
        if (!addCommunityModal) return;
        
        // Asegurar que los datos estén cargados antes de abrir el modal
        if (regionesList.length === 0 || comunidadesList.length === 0) {
            try {
                // Cargar comunidades
                const responseComunidades = await fetch('/api/comunidades/');
                if (responseComunidades.ok) {
                    const dataComunidades = await responseComunidades.json();
                    comunidadesList = dataComunidades;
                }
                
                // Cargar regiones
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
                }
            } catch (error) {
                mostrarMensaje('error', 'Error al cargar las regiones y comunidades. Por favor, recarga la página.');
                return;
            }
        }
        
        // Abrir el modal
        addCommunityModal.style.display = 'flex';
        setTimeout(() => {
            addCommunityModal.classList.add('show');
        }, 10);

        // Configurar selector de región (sin selección por defecto)
        if (communityRegionSelect) {
            communityRegionSelect.innerHTML = '<option value="">Todas las regiones</option>';
            regionesList.forEach(region => {
                const option = document.createElement('option');
                option.value = String(region.id);
                option.textContent = region.comunidad_sede ? `${region.nombre} — ${region.comunidad_sede}` : region.nombre;
                communityRegionSelect.appendChild(option);
            });
            communityRegionSelect.value = '';
            showCommunityRegionSelector();
        }

        // Limpiar campo de búsqueda
        if (communitySearchInput) {
            communitySearchInput.value = '';
            // Asegurar que el input sea visible
            communitySearchInput.style.display = 'block';
            communitySearchInput.style.visibility = 'visible';
            communitySearchInput.style.opacity = '1';
        }
        
        // Asegurar que los form-group sean visibles
        const formGroups = addCommunityModal.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.display = 'flex';
            group.style.flexDirection = 'column';
            group.style.gap = '8px';
            group.style.width = '100%';
            group.style.visibility = 'visible';
            group.style.opacity = '1';
        });

        // Renderizar todas las comunidades (sin filtro de región)
        renderCommunityOptions('', '');
    }

    // Event listeners para el modal de comunidades (usando flags para evitar duplicados)
    if (addCommunityBtn && !addCommunityBtn.dataset.listenerAdded) {
        addCommunityBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openCommunityModal();
        });
        addCommunityBtn.dataset.listenerAdded = 'true';
    }

    if (closeCommunityModalBtn && !closeCommunityModalBtn.dataset.listenerAdded) {
        closeCommunityModalBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeCommunityModal();
        });
        closeCommunityModalBtn.dataset.listenerAdded = 'true';
    }

    if (cancelCommunityBtn && !cancelCommunityBtn.dataset.listenerAdded) {
        cancelCommunityBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeCommunityModal();
        });
        cancelCommunityBtn.dataset.listenerAdded = 'true';
    }

    // Event listeners para filtros y búsqueda (usando flags para evitar duplicados)
    if (communityRegionSelect && !communityRegionSelect.dataset.listenerAdded) {
        communityRegionSelect.addEventListener('change', function() {
            const searchTerm = communitySearchInput ? communitySearchInput.value.trim() : '';
            renderCommunityOptions(this.value, searchTerm);
        });
        communityRegionSelect.dataset.listenerAdded = 'true';
    }

    if (communitySearchInput && !communitySearchInput.dataset.listenerAdded) {
        let communitySearchTimeout = null;
        communitySearchInput.addEventListener('input', function() {
            clearTimeout(communitySearchTimeout);
            communitySearchTimeout = setTimeout(() => {
                const regionId = communityRegionSelect ? communityRegionSelect.value : '';
                renderCommunityOptions(regionId, this.value.trim());
            }, 300); // Debounce para mejorar rendimiento
        });
        communitySearchInput.dataset.listenerAdded = 'true';
    }

    if (confirmCommunityBtn && !confirmCommunityBtn.dataset.listenerAdded) {
        confirmCommunityBtn.addEventListener('click', function(e) {
            e.stopPropagation();

            if (pendingCommunitySelections.size === 0) {
                mostrarMensaje('info', 'Selecciona al menos una comunidad de la lista.');
                return;
            }

            pendingCommunitySelections.forEach(item => {
                if (selectedCommunitiesList.some(existing => existing.comunidad_id === item.comunidad_id)) {
                    return;
                }
                selectedCommunitiesList.push({
                    comunidad_id: item.comunidad_id,
                    comunidad_nombre: item.comunidad_nombre,
                    region_id: item.region_id,
                    region_nombre: item.region_nombre,
                    region_sede: item.region_sede,
                    agregado_en: new Date().toISOString()
                });
            });

            pendingCommunitySelections.clear();
            renderSelectedCommunities();
            closeCommunityModal();
        });
        confirmCommunityBtn.dataset.listenerAdded = 'true';
    }

    if (closeEditCommunityDateModalBtn && !closeEditCommunityDateModalBtn.dataset.listenerAdded) {
        closeEditCommunityDateModalBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeEditCommunityDateModal();
        });
        closeEditCommunityDateModalBtn.dataset.listenerAdded = 'true';
    }

    if (cancelEditCommunityDateBtn && !cancelEditCommunityDateBtn.dataset.listenerAdded) {
        cancelEditCommunityDateBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeEditCommunityDateModal();
        });
        cancelEditCommunityDateBtn.dataset.listenerAdded = 'true';
    }

    if (confirmEditCommunityDateBtn && !confirmEditCommunityDateBtn.dataset.listenerAdded) {
        confirmEditCommunityDateBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!editCommunityDateModal || !communityDateInput) return;
            const indexStr = editCommunityDateModal.dataset.communityIndex;
            if (typeof indexStr === 'undefined') {
                closeEditCommunityDateModal();
                return;
            }

            const idx = parseInt(indexStr, 10);
            if (Number.isNaN(idx) || !selectedCommunitiesList[idx]) {
                closeEditCommunityDateModal();
                return;
            }

            const value = (communityDateInput.value || '').trim();
            if (!value) {
                mostrarMensaje('info', 'Selecciona una fecha válida.');
                return;
            }

            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                mostrarMensaje('error', 'Formato inválido: usa YYYY-MM-DD.');
                return;
            }

            const nuevaFecha = new Date(`${value}T00:00:00`);
            if (Number.isNaN(nuevaFecha.getTime())) {
                mostrarMensaje('error', 'La fecha ingresada no es válida.');
                return;
            }

            selectedCommunitiesList[idx].agregado_en = nuevaFecha.toISOString();
            renderSelectedCommunities();
            closeEditCommunityDateModal();
        });
        confirmEditCommunityDateBtn.dataset.listenerAdded = 'true';
    }

    if (editCommunityDateModal && !editCommunityDateModal.dataset.listenerAdded) {
        editCommunityDateModal.addEventListener('click', function(e) {
            if (e.target === editCommunityDateModal) {
                closeEditCommunityDateModal();
            }
        });
        editCommunityDateModal.dataset.listenerAdded = 'true';
    }
    
    renderSelectedCommunities();
    
    function revokeCoverObjectUrl() {
        if (coverImageObjectUrl) {
            URL.revokeObjectURL(coverImageObjectUrl);
            coverImageObjectUrl = null;
        }
    }
    
    function renderCoverPreview() {
        if (!coverImagePreview || !coverPreviewWrapper || !coverRemoveBtn) return;
    
        if (coverImageFile) {
            revokeCoverObjectUrl();
            coverImageObjectUrl = URL.createObjectURL(coverImageFile);
            coverImagePreview.src = coverImageObjectUrl;
            coverPreviewWrapper.style.display = 'flex';
            coverRemoveBtn.style.display = 'inline-flex';
        } else if (coverImageData && coverImageData.url) {
            revokeCoverObjectUrl();
            coverImagePreview.src = coverImageData.url;
            coverPreviewWrapper.style.display = 'flex';
            coverRemoveBtn.style.display = 'inline-flex';
        } else {
            revokeCoverObjectUrl();
            coverPreviewWrapper.style.display = 'none';
            coverRemoveBtn.style.display = 'none';
        }
    }
    
    function resetCoverSelection() {
        revokeCoverObjectUrl();
        coverImageFile = null;
        coverImageData = null;
        coverImageRemoved = false;
        renderCoverPreview();
    }
    
    if (coverFileInput) {
        coverFileInput.addEventListener('change', function() {
            const file = this.files && this.files[0] ? this.files[0] : null;
            this.value = '';
    
            if (!file) {
                return;
            }
    
            if (!file.type || !file.type.startsWith('image/')) {
                mostrarMensaje('error', 'Selecciona un archivo de imagen válido (PNG, JPG, etc.).');
                return;
            }
    
            coverImageFile = file;
            coverImageData = null;
            coverImageRemoved = false;
            renderCoverPreview();
        });
    }
    
    if (coverRemoveBtn) {
        coverRemoveBtn.addEventListener('click', () => {
            const teniaPortadaPrev = Boolean(coverImageData && coverImageData.url);
            coverImageFile = null;
            if (teniaPortadaPrev) {
                coverImageData = null;
                coverImageRemoved = true;
            } else {
                coverImageData = null;
                coverImageRemoved = false;
            }
            renderCoverPreview();
        });
    }
    
    renderCoverPreview();
    
    // ===== GESTIÓN DE BENEFICIARIOS =====
    const addBeneficiaryBtn = document.getElementById('addBeneficiaryBtn');
    const addBeneficiaryModal = document.getElementById('addBeneficiaryModal');
    const closeBeneficiaryModalBtn = document.getElementById('closeBeneficiaryModal');
    const cancelBeneficiaryBtn = document.getElementById('cancelBeneficiaryBtn');
    const saveBeneficiaryBtn = document.getElementById('saveBeneficiaryBtn');
    const beneficiaryForm = document.getElementById('beneficiaryForm');
    const benefTipoSelect = document.getElementById('benef_tipo');
    const beneficiariesContainer = document.getElementById('beneficiariesContainer');
    const benefModeButtons = document.querySelectorAll('.benef-mode-btn');
    const benefNuevoSection = document.getElementById('benef_nuevo_section');
    const benefExistenteSection = document.getElementById('benef_existente_section');
    const benefSearchInput = document.getElementById('benef_search_input');
    const benefSearchResults = document.getElementById('benef_search_results');
    const benefSearchStatus = document.getElementById('benef_search_status');
    const benefSearchRegionSelect = document.getElementById('benef_search_region');
    const benefSearchCommunitySelect = document.getElementById('benef_search_comunidad');
    const benefSearchTipoSelect = document.getElementById('benef_search_tipo');
    const benefCatalogSearchInput = document.getElementById('benef_search_catalog_input');
    const benefCatalogSuggestions = document.getElementById('benef_search_catalog_suggestions');
    const benefNuevoCatalogClear = document.getElementById('benef_nuevo_catalog_clear');
    const benefCatalogContexts = {
        existente: {
            input: benefCatalogSearchInput,
            suggestions: benefCatalogSuggestions,
            regionSelect: benefSearchRegionSelect,
            communitySelect: benefSearchCommunitySelect,
            searchCallback: () => buscarBeneficiarios(benefSearchInput ? benefSearchInput.value.trim() : '')
        },
        nuevo: {
            input: benefNuevoCatalogSearchInput,
            suggestions: benefNuevoCatalogSuggestions,
            clearBtn: benefNuevoCatalogClear,
            regionSelect: benefRegionSelect,
            communitySelect: benefCommunitySelect,
            searchCallback: null
        }
    };
    
    // Ocultar modal al inicio
    if (addBeneficiaryModal) {
        addBeneficiaryModal.classList.remove('show');
        addBeneficiaryModal.style.display = 'none';
    }
    
    // Abrir modal (usando flag para evitar duplicados)
    if (addBeneficiaryBtn && !addBeneficiaryBtn.dataset.listenerAdded) {
        addBeneficiaryBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            beneficiarioEnEdicion = null; // Resetear edición
            addBeneficiaryModal.style.display = 'flex';
            setTimeout(() => {
                addBeneficiaryModal.classList.add('show');
            }, 10);
            beneficiaryForm.reset();
            resetBeneficiaryLocation();
            hideAllBeneficiaryFields();
            configurarValidacionesBeneficiarios(); // Configurar validaciones
            showBeneficiarySelectors();
            inicializarFiltrosBeneficiariosExistentes()
                .then(() => {
                    const initialQuery = benefSearchInput ? benefSearchInput.value.trim() : '';
                    return buscarBeneficiarios(initialQuery);
                })
                .catch(error => {
                });
            
            // Cambiar título del modal
            const modalTitle = document.querySelector('#addBeneficiaryModal .modal-title');
            if (modalTitle) modalTitle.textContent = 'Agregar Beneficiario';
            
            // Cambiar texto del botón
            if (saveBeneficiaryBtn) saveBeneficiaryBtn.textContent = 'Agregar Beneficiario';
        });
        addBeneficiaryBtn.dataset.listenerAdded = 'true';
    }
    
    // Cerrar modal
    function closeBeneficiaryModal() {
        // Limpiar campo de edad y display
        const edadInput = document.getElementById('benef_ind_edad');
        const edadDisplay = document.getElementById('benef_ind_edad_display');
        if (edadInput) edadInput.value = '';
        if (edadDisplay) edadDisplay.textContent = '';
        addBeneficiaryModal.classList.remove('show');
        setTimeout(() => {
            addBeneficiaryModal.style.display = 'none';
        }, 300);
        beneficiaryForm.reset();
        hideAllBeneficiaryFields();
        resetBeneficiaryLocation();
        hideBeneficiarySelectors();
    }
    
    // Event listeners para cerrar modal de beneficiarios (usando flags para evitar duplicados)
    if (closeBeneficiaryModalBtn && !closeBeneficiaryModalBtn.dataset.listenerAdded) {
        closeBeneficiaryModalBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeBeneficiaryModal();
        });
        closeBeneficiaryModalBtn.dataset.listenerAdded = 'true';
    }
    
    if (cancelBeneficiaryBtn && !cancelBeneficiaryBtn.dataset.listenerAdded) {
        cancelBeneficiaryBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeBeneficiaryModal();
        });
        cancelBeneficiaryBtn.dataset.listenerAdded = 'true';
    }
    
    // Cerrar modal al hacer click fuera (usando flag para evitar duplicados)
    if (addBeneficiaryModal && !addBeneficiaryModal.dataset.closeListenerAdded) {
        addBeneficiaryModal.addEventListener('click', function(e) {
            if (e.target === addBeneficiaryModal) {
                e.stopPropagation();
                closeBeneficiaryModal();
            }
        });
        addBeneficiaryModal.dataset.closeListenerAdded = 'true';
    }
    
    // Cambiar campos según tipo
    if (benefTipoSelect) {
        benefTipoSelect.addEventListener('change', function() {
            hideAllBeneficiaryFields();
            const tipo = this.value;
            
            // Mostrar/ocultar sección de importación Excel (solo para individual)
            const excelImportSection = document.getElementById('excel_import_section');
            if (excelImportSection) {
                if (tipo === 'individual') {
                    excelImportSection.style.display = 'block';
                } else {
                    excelImportSection.style.display = 'none';
                    // Limpiar archivo seleccionado si cambia de tipo
                    const excelFileInput = document.getElementById('excelFileInput');
                    if (excelFileInput) {
                        excelFileInput.value = '';
                        const excelFileInfo = document.getElementById('excelFileInfo');
                        if (excelFileInfo) excelFileInfo.style.display = 'none';
                        const excelImportStatus = document.getElementById('excelImportStatus');
                        if (excelImportStatus) {
                            excelImportStatus.style.display = 'none';
                            excelImportStatus.innerHTML = '';
                        }
                        // Limpiar beneficiarios pendientes cuando cambia el tipo
                        beneficiariosPendientesExcel = [];
                        actualizarContadorPendientes();
                    }
                }
            }
            
        if (tipo === 'individual') {
            document.getElementById('campos_individual').style.display = 'block';
            // Configurar sincronización fecha-edad cuando se muestra el formulario individual
            setTimeout(() => configurarSincronizacionFechaEdad(), 100);
        } else if (tipo === 'familia') {
            document.getElementById('campos_familia').style.display = 'block';
        } else if (tipo === 'institución') {
            document.getElementById('campos_institucion').style.display = 'block';
        } else if (tipo === 'otro') {
            document.getElementById('campos_otro').style.display = 'block';
        }
        configurarValidacionesBeneficiarios(); // Reconfigurar validaciones cuando cambia el tipo
        });
    }
    
    // ===== GESTIÓN DE IMPORTACIÓN EXCEL =====
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const excelFileInput = document.getElementById('excelFileInput');
    const excelFileInfo = document.getElementById('excelFileInfo');
    const excelFileName = document.getElementById('excelFileName');
    const removeExcelFileBtn = document.getElementById('removeExcelFileBtn');
    const excelImportStatus = document.getElementById('excelImportStatus');
    const excelPendingActions = document.getElementById('excelPendingActions');
    const excelPendingCount = document.getElementById('excelPendingCount');
    const ingresarBeneficiariosProyectoBtn = document.getElementById('ingresarBeneficiariosProyectoBtn');
    
    // Función para actualizar contador de beneficiarios pendientes
    function actualizarContadorPendientes() {
        const total = beneficiariosPendientesExcel.length;
        if (excelPendingCount) {
            excelPendingCount.textContent = total;
        }
        if (excelPendingActions) {
            excelPendingActions.style.display = total > 0 ? 'block' : 'none';
        }
    }
    
    // Descargar plantilla
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', function() {
            window.location.href = '/api/beneficiarios/descargar-plantilla/';
        });
    }
    
    // Manejar selección de archivo Excel
    if (excelFileInput) {
        excelFileInput.addEventListener('change', function(e) {
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
                if (excelFileName) {
                    excelFileName.textContent = file.name;
                }
                if (excelFileInfo) {
                    excelFileInfo.style.display = 'block';
                }
                
                // Importar automáticamente
                importarBeneficiariosExcel(file);
            }
        });
    }
    
    // Remover archivo Excel
    if (removeExcelFileBtn) {
        removeExcelFileBtn.addEventListener('click', function() {
            if (excelFileInput) {
                excelFileInput.value = '';
            }
            if (excelFileInfo) {
                excelFileInfo.style.display = 'none';
            }
            if (excelImportStatus) {
                excelImportStatus.style.display = 'none';
                excelImportStatus.innerHTML = '';
            }
            // Limpiar beneficiarios pendientes
            beneficiariosPendientesExcel = [];
            actualizarContadorPendientes();
        });
    }
    
    // Función para importar beneficiarios desde Excel
    async function importarBeneficiariosExcel(file) {
        if (!file) return;
        
        const formData = new FormData();
        formData.append('excel_file', file);
        
        // Mostrar estado de carga
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
                // Almacenar beneficiarios pendientes (NO cerrar modal)
                if (data.pendientes) {
                    beneficiariosPendientesExcel = [
                        ...(data.pendientes.exitosos || []).map(item => item.datos),
                        ...(data.pendientes.advertencias || []).map(item => item.datos)
                    ];
                    actualizarContadorPendientes();
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
                                    Presiona "Ingresar Beneficiarios al Proyecto" para guardarlos y vincularlos al evento.
                                </p>
                            </div>
                        ` : ''}
                `;
                
                // Mostrar advertencias (actualizaciones) si las hay
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
                
                // Mostrar errores si los hay
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
                mostrarMensaje('error', data.error || 'Error al importar el archivo Excel');
            }
        } catch (error) {
            if (excelImportStatus) {
                excelImportStatus.innerHTML = `
                    <div style="padding: 12px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border: 1px solid rgba(220, 53, 69, 0.3);">
                        <div style="display: flex; align-items: center; gap: 8px; color: #dc3545;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <strong>Error:</strong> No se pudo conectar con el servidor
                        </div>
                    </div>
                `;
            }
            mostrarMensaje('error', 'Error al importar el archivo Excel. Por favor, intente nuevamente.');
        }
    }
    
    // Botón para ingresar beneficiarios al proyecto
    if (ingresarBeneficiariosProyectoBtn) {
        ingresarBeneficiariosProyectoBtn.addEventListener('click', async function() {
            if (beneficiariosPendientesExcel.length === 0) {
                mostrarMensaje('error', 'No hay beneficiarios pendientes para agregar');
                return;
            }
            
            // Obtener ID del evento (si está en edición o creación)
            let actividadId = null;
            
            // Si estamos editando un evento
            if (eventoEnEdicion && eventoEnEdicion.id) {
                actividadId = eventoEnEdicion.id;
            } else {
                // Si estamos creando, verificar si hay un evento en el hash de la URL
                const hashActual = window.location.hash;
                const matchEvento = hashActual.match(/[&?]evento=([^&]+)/);
                if (matchEvento) {
                    actividadId = matchEvento[1];
                } else {
                    mostrarMensaje('error', 'Debes crear o seleccionar un evento primero. Los beneficiarios se guardarán automáticamente cuando crees el evento.');
                    return;
                }
            }
            
            if (!actividadId) {
                mostrarMensaje('error', 'No se pudo determinar el evento. Por favor, crea o selecciona un evento primero.');
                return;
            }
            
            // Mostrar estado de carga
            ingresarBeneficiariosProyectoBtn.disabled = true;
            ingresarBeneficiariosProyectoBtn.innerHTML = `
                <div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #ffffff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px;"></div>
                Guardando...
            `;
            
            try {
                const response = await fetch('/api/beneficiarios/guardar-pendientes/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        actividad_id: actividadId,
                        beneficiarios_pendientes: beneficiariosPendientesExcel
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('success', data.message);
                    
                    // Limpiar beneficiarios pendientes
                    beneficiariosPendientesExcel = [];
                    actualizarContadorPendientes();
                    
                    // Limpiar estado de importación
                    if (excelFileInput) excelFileInput.value = '';
                    if (excelFileInfo) excelFileInfo.style.display = 'none';
                    if (excelImportStatus) {
                        excelImportStatus.style.display = 'none';
                        excelImportStatus.innerHTML = '';
                    }
                    
                    // Cerrar modal de beneficiarios
                    closeBeneficiaryModal();
                    
                    // Recargar beneficiarios del evento
                    if (beneficiariesContainer) {
                        const event = new CustomEvent('beneficiariosActualizados');
                        document.dispatchEvent(event);
                    }
                } else {
                    mostrarMensaje('error', data.error || 'Error al guardar los beneficiarios');
                }
            } catch (error) {
                mostrarMensaje('error', 'Error al guardar los beneficiarios. Por favor, intente nuevamente.');
            } finally {
                ingresarBeneficiariosProyectoBtn.disabled = false;
                ingresarBeneficiariosProyectoBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Ingresar Beneficiarios al Proyecto
                `;
            }
        });
    }
    
    // Función auxiliar para obtener cookie CSRF
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
    
    function hideAllBeneficiaryFields() {
        document.getElementById('campos_individual').style.display = 'none';
        document.getElementById('campos_familia').style.display = 'none';
        document.getElementById('campos_institucion').style.display = 'none';
        document.getElementById('campos_otro').style.display = 'none';
    }
    
    // ===== SINCRONIZACIÓN FECHA DE NACIMIENTO Y EDAD =====
    function calcularEdadDesdeFecha(fechaNacimiento) {
        if (!fechaNacimiento) return null;
        const fechaNac = new Date(fechaNacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }
        return edad >= 0 ? edad : null;
    }
    
    function calcularFechaDesdeEdad(edad) {
        if (!edad || edad < 0 || edad > 150) return null;
        const hoy = new Date();
        const añoNacimiento = hoy.getFullYear() - edad;
        // Usar 01/01 del año calculado
        return `${añoNacimiento}-01-01`;
    }
    
    function actualizarEdadDesdeFecha() {
        const fechaInput = document.getElementById('benef_ind_fecha_nac');
        const edadInput = document.getElementById('benef_ind_edad');
        const edadDisplay = document.getElementById('benef_ind_edad_display');
        
        if (!fechaInput || !edadInput || !edadDisplay) return;
        
        const fechaNac = fechaInput.value;
        if (fechaNac) {
            const edad = calcularEdadDesdeFecha(fechaNac);
            if (edad !== null) {
                edadInput.value = edad;
                edadDisplay.textContent = `(Edad: ${edad} años)`;
            } else {
                edadInput.value = '';
                edadDisplay.textContent = '';
            }
        } else {
            edadDisplay.textContent = '';
        }
    }
    
    function actualizarFechaDesdeEdad() {
        const fechaInput = document.getElementById('benef_ind_fecha_nac');
        const edadInput = document.getElementById('benef_ind_edad');
        const edadDisplay = document.getElementById('benef_ind_edad_display');
        
        if (!fechaInput || !edadInput || !edadDisplay) return;
        
        const edad = parseInt(edadInput.value);
        if (!isNaN(edad) && edad >= 0 && edad <= 150) {
            const fechaNac = calcularFechaDesdeEdad(edad);
            if (fechaNac) {
                fechaInput.value = fechaNac;
                edadDisplay.textContent = `(Edad: ${edad} años)`;
            }
        } else if (edadInput.value === '') {
            edadDisplay.textContent = '';
        }
    }
    
    // Configurar event listeners para sincronización
    let sincronizacionFechaEdadConfigurada = false;
    function configurarSincronizacionFechaEdad() {
        const fechaInput = document.getElementById('benef_ind_fecha_nac');
        const edadInput = document.getElementById('benef_ind_edad');
        
        if (!fechaInput || !edadInput) return;
        
        // Solo configurar una vez usando una propiedad del elemento
        if (fechaInput.dataset.sincronizacionConfigurada === 'true') return;
        
        // Marcar como configurado
        fechaInput.dataset.sincronizacionConfigurada = 'true';
        edadInput.dataset.sincronizacionConfigurada = 'true';
        
        // Event listeners para fecha de nacimiento
        fechaInput.addEventListener('change', actualizarEdadDesdeFecha);
        fechaInput.addEventListener('input', actualizarEdadDesdeFecha);
        
        // Event listeners para edad
        edadInput.addEventListener('input', function(e) {
            // Remover cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Si hay un valor válido, actualizar fecha
            if (this.value !== '') {
                actualizarFechaDesdeEdad();
            } else {
                const edadDisplay = document.getElementById('benef_ind_edad_display');
                if (edadDisplay) edadDisplay.textContent = '';
            }
        });
        
        // Prevenir entrada de caracteres no numéricos
        edadInput.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) {
                e.preventDefault();
            }
        });
        
        // Actualizar cuando se pega texto
        edadInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value !== '') {
                    actualizarFechaDesdeEdad();
                }
            }, 0);
        });
    }
    
    function configurarValidacionesBeneficiarios() {
        // Limpiar errores previos
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('#benef_nuevo_section input, #benef_nuevo_section select').forEach(input => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
            input.dataset.validacionAplicada = 'false'; // Permitir reconfigurar validaciones
        });
        
        // Validaciones para Individual
        const benefIndDPI = document.getElementById('benef_ind_dpi');
        const benefIndTelefono = document.getElementById('benef_ind_telefono');
        const benefIndNombre = document.getElementById('benef_ind_nombre');
        const benefIndApellido = document.getElementById('benef_ind_apellido');
        
        if (benefIndDPI) aplicarValidacionTiempoReal(benefIndDPI, 'dpi', { optional: true });
        if (benefIndTelefono) aplicarValidacionTiempoReal(benefIndTelefono, 'telefono', { optional: true });
        if (benefIndNombre) aplicarValidacionTiempoReal(benefIndNombre, 'nombre');
        if (benefIndApellido) aplicarValidacionTiempoReal(benefIndApellido, 'nombre');
        
        // Validaciones para Familia
        const benefFamDPI = document.getElementById('benef_fam_dpi');
        const benefFamTelefono = document.getElementById('benef_fam_telefono');
        const benefFamJefe = document.getElementById('benef_fam_jefe');
        const benefFamMiembros = document.getElementById('benef_fam_miembros');
        
        if (benefFamDPI) aplicarValidacionTiempoReal(benefFamDPI, 'dpi', { optional: true });
        if (benefFamTelefono) aplicarValidacionTiempoReal(benefFamTelefono, 'telefono', { optional: true });
        if (benefFamJefe) aplicarValidacionTiempoReal(benefFamJefe, 'nombre');
        if (benefFamMiembros) aplicarValidacionTiempoReal(benefFamMiembros, 'numero', { min: 1, max: 999 });
        
        // Validaciones para Institución
        const benefInstDPI = document.getElementById('benef_inst_dpi_rep');
        const benefInstTelefono = document.getElementById('benef_inst_telefono');
        const benefInstEmail = document.getElementById('benef_inst_email');
        const benefInstRepresentante = document.getElementById('benef_inst_representante');
        const benefInstNumBenef = document.getElementById('benef_inst_num_beneficiarios');
        
        if (benefInstDPI) aplicarValidacionTiempoReal(benefInstDPI, 'dpi', { optional: true });
        if (benefInstTelefono) aplicarValidacionTiempoReal(benefInstTelefono, 'telefono', { optional: true });
        if (benefInstEmail) aplicarValidacionTiempoReal(benefInstEmail, 'email', { optional: true });
        if (benefInstRepresentante) aplicarValidacionTiempoReal(benefInstRepresentante, 'nombre');
        if (benefInstNumBenef) aplicarValidacionTiempoReal(benefInstNumBenef, 'numero', { min: 1, max: 99999 });
        
        // Validaciones para Otro
        const benefOtroTelefono = document.getElementById('benef_otro_telefono');
        
        if (benefOtroTelefono) aplicarValidacionTiempoReal(benefOtroTelefono, 'telefono', { optional: true });
    }
    
    function setBeneficiarioModo(mode) {
        beneficiarioModo = mode;
        benefModeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
                btn.style.background = 'rgba(76, 175, 80, 0.2)';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'rgba(255, 255, 255, 0.05)';
            }
        });

        if (mode === 'nuevo') {
            if (benefNuevoSection) benefNuevoSection.style.display = 'block';
            if (benefExistenteSection) benefExistenteSection.style.display = 'none';
            if (saveBeneficiaryBtn) {
                saveBeneficiaryBtn.style.display = 'inline-flex';
            }
            if (!beneficiarioEnEdicion) {
                resetBeneficiaryLocation();
            }
            if (benefSearchRegionSelect) benefSearchRegionSelect.value = '';
            actualizarComunidadesFiltro('', '');
            if (benefSearchTipoSelect) benefSearchTipoSelect.value = '';
            if (benefCatalogSearchInput) benefCatalogSearchInput.value = '';
        ocultarSugerenciasCatalogo();
        } else {
            if (benefNuevoSection) benefNuevoSection.style.display = 'none';
            if (benefExistenteSection) benefExistenteSection.style.display = 'block';
            // Cargar todos los beneficiarios al cambiar al modo "Buscar existente"
            if (benefSearchInput) {
                benefSearchInput.value = '';
            }
            inicializarFiltrosBeneficiariosExistentes()
                .then(() => buscarBeneficiarios(''))
                .catch(error => (() => {})());
            if (saveBeneficiaryBtn) {
                saveBeneficiaryBtn.style.display = 'none';
            }
        }
    }

    function limpiarBusquedaBeneficiarios() {
        beneficiariosBusquedaResultados = [];
        if (benefSearchResults) benefSearchResults.innerHTML = '';
        if (benefSearchStatus) benefSearchStatus.style.display = 'none';
        if (benefSearchRegionSelect) benefSearchRegionSelect.value = '';
        actualizarComunidadesFiltro('', '');
        if (benefSearchTipoSelect) benefSearchTipoSelect.value = '';
        if (benefCatalogSearchInput) benefCatalogSearchInput.value = '';
        ocultarSugerenciasCatalogo();
    }

    function renderBeneficiariosBusqueda(resultados, query) {
        if (!benefSearchResults) return;
        benefSearchResults.innerHTML = '';

        if (!resultados || resultados.length === 0) {
            const queryText = (query || '').trim();
            const mensaje = queryText
                ? `No se encontraron beneficiarios para "${queryText}".`
                : 'No se encontraron beneficiarios con los filtros seleccionados.';
            benefSearchResults.innerHTML = `<div style="padding:12px; border:1px dashed rgba(255,255,255,0.2); border-radius:8px; color:#b8c5d1; text-align:center;">${mensaje}</div>`;
            return;
        }

        resultados.forEach(benef => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05);';

            const nombreDisplay = benef.display_name || benef.nombre;
            const tipoDisplay = benef.tipo_display || benef.tipo;
            const comunidadNombre = benef.comunidad_nombre || benef.comunidad || 'Sin comunidad asignada';
            const regionPart = benef.region_nombre ? ` — ${benef.region_nombre}` : '';
            const comunidad = `<span style="color:#b8c5d1; font-size:0.8rem;">${comunidadNombre}${regionPart}</span>`;

            item.innerHTML = `
                <div style="flex:1;">
                    <div style="font-weight:600; color:#f5f7fa;">${nombreDisplay}</div>
                    <div style="color:#a8b2c2; font-size:0.85rem; text-transform:capitalize;">${tipoDisplay}</div>
                    ${comunidad}
                </div>
                <button type="button" class="btn-add-existing-benef" data-id="${benef.id}" style="background:#12b76a; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;">Agregar</button>
            `;

            const alreadySelected = beneficiariosExistentes.some(b => b.id === benef.id) || beneficiariosNuevos.some(b => b.id === benef.id);
            if (alreadySelected) {
                const btn = item.querySelector('.btn-add-existing-benef');
                btn.disabled = true;
                btn.textContent = 'Seleccionado';
                btn.style.background = '#6c757d';
            }

            benefSearchResults.appendChild(item);

            const addBtn = item.querySelector('.btn-add-existing-benef');
            addBtn.addEventListener('click', () => {
                seleccionarBeneficiarioExistente(benef);
                addBtn.disabled = true;
                addBtn.textContent = 'Seleccionado';
                addBtn.style.background = '#6c757d';
            });
        });
    }

    async function buscarBeneficiarios(query) {
        if (!benefSearchResults) return;
        if (benefSearchStatus) {
            benefSearchStatus.style.display = 'block';
            benefSearchStatus.textContent = 'Cargando beneficiarios...';
        }
        benefSearchResults.innerHTML = '';

        try {
            // Si hay query de búsqueda, hacer nueva llamada al API con parámetro q
            // para buscar en TODA la base de datos, no solo en los 50 cargados
            let catalogo;
            const queryLower = (query || '').trim().toLowerCase();
            
            if (queryLower) {
                // Con búsqueda: llamar al API con parámetro q para buscar en TODA la BD
                const response = await fetch(`/api/beneficiarios/?q=${encodeURIComponent(query.trim())}`);
                if (!response.ok) {
                    throw new Error('Error al buscar beneficiarios');
                }
                catalogo = await response.json();
                catalogo = Array.isArray(catalogo) ? catalogo : [];
            } else {
                // Sin búsqueda: usar catálogo inicial (50 beneficiarios)
                catalogo = await obtenerBeneficiariosCatalogo();
            }

            const seleccionadosIds = new Set([
                ...beneficiariosExistentes.map(b => b.id),
                ...beneficiariosNuevos.map(b => b.id)
            ]);

            const regionFiltro = benefSearchRegionSelect ? benefSearchRegionSelect.value : '';
            const comunidadFiltro = benefSearchCommunitySelect ? benefSearchCommunitySelect.value : '';
            const tipoFiltro = benefSearchTipoSelect ? (benefSearchTipoSelect.value || '').toLowerCase() : '';
            // queryLower ya está declarado arriba, no redeclarar
            const busquedaEnServidor = queryLower.length > 0; // Si hay búsqueda, ya se hizo en el servidor

            const filtrados = catalogo.filter(b => {
                if (!b || !b.id) {
                    return false;
                }

                if (seleccionadosIds.has(b.id)) {
                    return false;
                }

                const detalles = b.detalles || {};
                const regionBenef = b.region_id ?? detalles.region_id;
                const comunidadBenef = b.comunidad_id ?? detalles.comunidad_id;
                const tipoBenef = (b.tipo || b.tipo_display || '').toLowerCase();

                if (regionFiltro && String(regionBenef) !== String(regionFiltro)) {
                    return false;
                }

                if (comunidadFiltro && String(comunidadBenef) !== String(comunidadFiltro)) {
                    return false;
                }

                if (tipoFiltro && tipoBenef !== tipoFiltro) {
                    return false;
                }

                // Si la búsqueda ya se hizo en el servidor, no volver a filtrar por texto localmente
                // El servidor ya retornó todos los resultados que coinciden con la búsqueda
                if (busquedaEnServidor) {
                    return true;
                }

                // Solo filtrar localmente si no hay búsqueda en servidor (sin query)
                if (!queryLower) {
                    return true;
                }

                const nombre = (b.display_name || b.nombre || detalles.nombre || '').toLowerCase();
                const apellido = (b.apellido || detalles.apellido || '').toLowerCase();
                const tipoTexto = (b.tipo_display || b.tipo || '').toLowerCase();
                const comunidadNombre = (b.comunidad_nombre || detalles.comunidad_nombre || '').toLowerCase();
                const regionNombre = (b.region_nombre || detalles.region_nombre || '').toLowerCase();
                const dpi = (
                    detalles.dpi ||
                    b.dpi ||
                    detalles.dpi_jefe_familia ||
                    detalles.dpi_representante ||
                    ''
                ).toLowerCase();

                return (
                    nombre.includes(queryLower) ||
                    apellido.includes(queryLower) ||
                    tipoTexto.includes(queryLower) ||
                    comunidadNombre.includes(queryLower) ||
                    regionNombre.includes(queryLower) ||
                    dpi.includes(queryLower)
                );
            });

            beneficiariosBusquedaResultados = filtrados;

            renderBeneficiariosBusqueda(beneficiariosBusquedaResultados, query);

            if (benefSearchStatus) {
                const totalResultados = beneficiariosBusquedaResultados.length;
                const totalCatalogo = catalogo.length;
                benefSearchStatus.style.display = 'block';
                if (totalResultados === 0) {
                    if (totalCatalogo === 0) {
                        benefSearchStatus.textContent = 'No hay beneficiarios registrados en el sistema.';
                    } else if (!regionFiltro && !comunidadFiltro && !tipoFiltro && !queryLower) {
                        benefSearchStatus.textContent = 'Todos los beneficiarios ya están seleccionados.';
                    } else {
                        benefSearchStatus.textContent = 'No se encontraron beneficiarios con los filtros aplicados.';
                    }
                } else {
                    const criterios = [];
                    if (regionFiltro) criterios.push('región');
                    if (comunidadFiltro) criterios.push('comunidad');
                    if (tipoFiltro) criterios.push('tipo');
                    if (queryLower) criterios.push('búsqueda');
                    if (criterios.length > 0) {
                        benefSearchStatus.textContent = `${totalResultados} resultado(s) usando ${criterios.join(', ')}.`;
                    } else {
                        benefSearchStatus.textContent = `${totalResultados} beneficiario(s) disponible(s)`;
                    }
                }
            }
        } catch (error) {
            benefSearchResults.innerHTML = '<div style="padding:12px; border:1px dashed rgba(255,255,255,0.2); border-radius:8px; color:#f87171; text-align:center;">Error al buscar beneficiarios. Intenta de nuevo.</div>';
            if (benefSearchStatus) {
                benefSearchStatus.style.display = 'block';
                benefSearchStatus.textContent = 'Ocurrió un error en la búsqueda.';
            }
        }
    }

    function seleccionarBeneficiarioExistente(benef) {
        if (!benef || !benef.id) return;

        const yaExiste = beneficiariosExistentes.some(b => b.id === benef.id);
        if (yaExiste) {
            mostrarMensaje('info', 'Este beneficiario ya está seleccionado.');
            return;
        }

        const beneficiario = {
            id: benef.id,
            nombre: benef.display_name || benef.nombre,
            display_name: benef.display_name || benef.nombre,
            tipo: benef.tipo,
            tipo_display: benef.tipo_display || benef.tipo,
            comunidad_id: benef.comunidad_id || (benef.detalles && benef.detalles.comunidad_id) ? String(benef.comunidad_id || (benef.detalles && benef.detalles.comunidad_id)) : null,
            comunidad_nombre: benef.comunidad_nombre || benef.comunidad || (benef.detalles && benef.detalles.comunidad_nombre) || null,
            region_id: benef.region_id || (benef.detalles && benef.detalles.region_id) ? String(benef.region_id || (benef.detalles && benef.detalles.region_id)) : null,
            region_nombre: benef.region_nombre || (benef.detalles && benef.detalles.region_nombre) || null,
            region_sede: benef.region_sede || (benef.detalles && benef.detalles.region_sede) || null,
            comunidad_codigo: benef.comunidad_codigo || (benef.detalles && benef.detalles.comunidad_codigo) || (benef.comunidad && benef.comunidad.codigo) || null,
            region_codigo: benef.region_codigo || (benef.detalles && benef.detalles.region_codigo) || (benef.region && benef.region.codigo) || null,
            info_adicional: benef.info_adicional,
            detalles: {
                ...(benef.detalles || {}),
                comunidad_id: benef.comunidad_id || (benef.detalles && benef.detalles.comunidad_id) ? String(benef.comunidad_id || (benef.detalles && benef.detalles.comunidad_id)) : null,
                comunidad_nombre: benef.comunidad_nombre || benef.comunidad || (benef.detalles && benef.detalles.comunidad_nombre) || null,
                comunidad_codigo: benef.comunidad_codigo || (benef.detalles && benef.detalles.comunidad_codigo) || (benef.comunidad && benef.comunidad.codigo) || null,
                region_id: benef.region_id || (benef.detalles && benef.detalles.region_id) ? String(benef.region_id || (benef.detalles && benef.detalles.region_id)) : null,
                region_nombre: benef.region_nombre || (benef.detalles && benef.detalles.region_nombre) || null,
                region_sede: benef.region_sede || (benef.detalles && benef.detalles.region_sede) || null,
                region_codigo: benef.region_codigo || (benef.detalles && benef.detalles.region_codigo) || (benef.region && benef.region.codigo) || null,
                display_name: benef.display_name || benef.nombre
            },
            esNuevoAsignado: true
        };

        beneficiariosExistentes.push(beneficiario);
        if (beneficiariosEliminados.includes(benef.id)) {
            beneficiariosEliminados = beneficiariosEliminados.filter(id => id !== benef.id);
        }
        beneficiariosExistentes = [...beneficiariosExistentes];
        renderBeneficiariosExistentes();
        updateBeneficiariesCard();
        mostrarMensaje('success', 'Beneficiario agregado al evento.');
    }

    benefModeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setBeneficiarioModo(btn.dataset.mode);
        });
    });

    if (benefModeButtons.length > 0) {
        setBeneficiarioModo('nuevo');
    }

    if (benefSearchInput) {
        benefSearchInput.addEventListener('input', function() {
            const query = this.value.trim();
            if (benefSearchStatus) benefSearchStatus.style.display = 'none';
            clearTimeout(benefSearchTimeout);
            benefSearchTimeout = setTimeout(() => {
                // Si la query está vacía, mostrar todos los beneficiarios
                // Si tiene al menos 2 caracteres, buscar con filtro
                buscarBeneficiarios(query);
            }, 350);
        });
    }

    if (benefCatalogSearchInput) {
        benefCatalogSearchInput.addEventListener('input', function() {
            mostrarSugerenciasCatalogo(this.value, 'existente');
        });

        benefCatalogSearchInput.addEventListener('keydown', function(e) {
            const state = getCatalogState('existente');
            if (e.key === 'ArrowDown') {
                moverSeleccionCatalogo(1, 'existente');
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                moverSeleccionCatalogo(-1, 'existente');
                e.preventDefault();
            } else if (e.key === 'Enter') {
                if (state && state.activeIndex >= 0 && state.filtered[state.activeIndex]) {
                    e.preventDefault();
                    seleccionarSugerenciaCatalogo(state.filtered[state.activeIndex], 'existente');
                } else {
                    ocultarSugerenciasCatalogo('existente');
                }
            } else if (e.key === 'Escape') {
                ocultarSugerenciasCatalogo('existente');
            }
        });

        benefCatalogSearchInput.addEventListener('blur', function() {
            setTimeout(() => ocultarSugerenciasCatalogo('existente'), 120);
            const ctx = getCatalogContext('existente');
            if (ctx && ctx.clearBtn) {
                ctx.clearBtn.style.display = this.value.trim() ? 'flex' : 'none';
            }
        });
    }

    if (benefNuevoCatalogClear) {
        benefNuevoCatalogClear.addEventListener('click', () => {
            if (benefNuevoCatalogSearchInput) {
                benefNuevoCatalogSearchInput.value = '';
            }
            ocultarSugerenciasCatalogo('nuevo');
        });
    }

    if (benefNuevoCatalogSearchInput) {
        benefNuevoCatalogSearchInput.addEventListener('input', function() {
            mostrarSugerenciasCatalogo(this.value, 'nuevo');
            if (benefNuevoCatalogClear) {
                benefNuevoCatalogClear.style.display = this.value.trim() ? 'flex' : 'none';
            }
        });

        benefNuevoCatalogSearchInput.addEventListener('keydown', function(e) {
            const state = getCatalogState('nuevo');
            if (e.key === 'ArrowDown') {
                moverSeleccionCatalogo(1, 'nuevo');
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                moverSeleccionCatalogo(-1, 'nuevo');
                e.preventDefault();
            } else if (e.key === 'Enter') {
                if (state && state.activeIndex >= 0 && state.filtered[state.activeIndex]) {
                    e.preventDefault();
                    seleccionarSugerenciaCatalogo(state.filtered[state.activeIndex], 'nuevo');
                } else {
                    ocultarSugerenciasCatalogo('nuevo');
                }
            } else if (e.key === 'Escape') {
                ocultarSugerenciasCatalogo('nuevo');
            }
        });

        benefNuevoCatalogSearchInput.addEventListener('blur', function() {
            setTimeout(() => ocultarSugerenciasCatalogo('nuevo'), 120);
            if (benefNuevoCatalogClear) {
                benefNuevoCatalogClear.style.display = this.value.trim() ? 'flex' : 'none';
            }
        });
    }
    
    // Guardar beneficiario (usando flag para evitar duplicados)
    if (saveBeneficiaryBtn && !saveBeneficiaryBtn.dataset.listenerAdded) {
        saveBeneficiaryBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tipo = benefTipoSelect.value;
            const selectedCommunityId = benefCommunitySelect ? benefCommunitySelect.value : '';
            const selectedRegionId = benefRegionSelect ? benefRegionSelect.value : '';
            const communityObj = comunidadesList.find(c => String(c.id) === String(selectedCommunityId));
            const regionObj = selectedRegionId ? regionesList.find(r => String(r.id) === String(selectedRegionId)) : (communityObj && communityObj.region ? communityObj.region : null);

            if (!selectedCommunityId || !communityObj) {
                mostrarMensaje('info', 'Selecciona la comunidad a la que pertenece el beneficiario.');
                return;
            }

            const resolvedRegionId = regionObj && regionObj.id ? String(regionObj.id) : '';
            const resolvedRegionNombre = regionObj && regionObj.nombre ? regionObj.nombre : (communityObj && communityObj.region && communityObj.region.nombre ? communityObj.region.nombre : '');
            const resolvedRegionSede = regionObj && regionObj.comunidad_sede ? regionObj.comunidad_sede : (communityObj && communityObj.region && communityObj.region.comunidad_sede ? communityObj.region.comunidad_sede : '');
            const resolvedCommunityId = String(selectedCommunityId);
            const resolvedCommunityNombre = communityObj.nombre || 'Sin comunidad';
            const resolvedRegionCodigo = regionObj && regionObj.codigo
                ? regionObj.codigo
                : (communityObj && communityObj.region && communityObj.region.codigo ? communityObj.region.codigo : '');
            const resolvedCommunityCodigo = communityObj.codigo || '';
             
            if (!tipo) {
                alert('Por favor, selecciona un tipo de beneficiario');
                return;
            }
            
            let beneficiario = {
                tipo: tipo,
                temporal_id: Date.now(), // ID temporal para identificarlo en el frontend
                comunidad_id: resolvedCommunityId,
                comunidad_nombre: resolvedCommunityNombre,
                region_id: resolvedRegionId || null,
                region_nombre: resolvedRegionNombre || null,
                region_sede: resolvedRegionSede || null,
                region_codigo: resolvedRegionCodigo || null,
                comunidad_codigo: resolvedCommunityCodigo || null
            };
            beneficiario.modificado = false;
            beneficiario.esNuevoAsignado = false;
            
            let detallesPayload = {
                region_id: beneficiario.region_id,
                region_nombre: beneficiario.region_nombre,
                region_sede: beneficiario.region_sede,
                region_codigo: beneficiario.region_codigo,
                comunidad_id: beneficiario.comunidad_id,
                comunidad_nombre: beneficiario.comunidad_nombre,
                comunidad_codigo: beneficiario.comunidad_codigo
            };
 
            const tipoLabelMap = {
                'individual': 'Individual',
                'familia': 'Familia',
                'institución': 'Institución',
                'institucion': 'Institución',
                'otro': 'Otro'
            };
            beneficiario.tipo_display = tipoLabelMap[tipo] || tipo;
            
            // Recopilar datos según tipo
            if (tipo === 'individual') {
                const nombre = document.getElementById('benef_ind_nombre').value.trim();
                const apellido = document.getElementById('benef_ind_apellido').value.trim();
                const dpi = document.getElementById('benef_ind_dpi').value.trim();
                const fechaNac = document.getElementById('benef_ind_fecha_nac').value;
                const genero = document.getElementById('benef_ind_genero').value;
                const telefono = document.getElementById('benef_ind_telefono').value.trim();
                
                if (!nombre || !apellido || !genero) {
                    alert('Por favor, completa todos los campos obligatorios');
                    return;
                }
                
                // Validar nombre y apellido
                const validacionNombre = validarNombre(nombre);
                const validacionApellido = validarNombre(apellido);
                if (!validacionNombre.valido) {
                    mostrarErrorCampo(document.getElementById('benef_ind_nombre'), validacionNombre.mensaje);
                    return;
                }
                if (!validacionApellido.valido) {
                    mostrarErrorCampo(document.getElementById('benef_ind_apellido'), validacionApellido.mensaje);
                    return;
                }
                
                beneficiario.nombre = nombre;
                beneficiario.apellido = apellido;
                beneficiario.dpi = dpi || null;
                beneficiario.fecha_nacimiento = document.getElementById('benef_ind_fecha_nac').value || null;
                beneficiario.genero = document.getElementById('benef_ind_genero').value || null;
                beneficiario.telefono = telefono || null;
                beneficiario.display_name = `${nombre} ${apellido}`;
                detallesPayload = {
                    ...detallesPayload,
                    nombre,
                    apellido,
                    dpi: beneficiario.dpi,
                    fecha_nacimiento: beneficiario.fecha_nacimiento,
                    genero: beneficiario.genero,
                    telefono: beneficiario.telefono
                };
                
                if (dpi) {
                    const validacionDPI = validarDPI(dpi);
                    if (!validacionDPI.valido) {
                        mostrarErrorCampo(document.getElementById('benef_ind_dpi'), validacionDPI.mensaje);
                        return;
                    }
                }
                
                if (telefono) {
                    const validacionTelefono = validarTelefono(telefono);
                    if (!validacionTelefono.valido) {
                        mostrarErrorCampo(document.getElementById('benef_ind_telefono'), validacionTelefono.mensaje);
                        return;
                    }
                }
                
                if (fechaNac) {
                    const fechaValida = !Number.isNaN(Date.parse(fechaNac));
                    if (!fechaValida) {
                        mostrarErrorCampo(document.getElementById('benef_ind_fecha_nac'), 'Fecha inválida');
                        return;
                    }
                }
                
            } else if (tipo === 'familia') {
                const nombreFamilia = document.getElementById('benef_fam_nombre').value.trim();
                const jefeFamilia = document.getElementById('benef_fam_jefe').value.trim();
                const dpiJefe = document.getElementById('benef_fam_dpi').value.trim();
                const telefono = document.getElementById('benef_fam_telefono').value.trim();
                const numMiembros = document.getElementById('benef_fam_miembros').value.trim();
                
                if (!nombreFamilia || !jefeFamilia || !numMiembros) {
                    alert('Por favor, completa todos los campos obligatorios');
                    return;
                }
                
                // Validar jefe de familia
                const validacionJefe = validarNombre(jefeFamilia);
                if (!validacionJefe.valido) {
                    mostrarErrorCampo(document.getElementById('benef_fam_jefe'), validacionJefe.mensaje);
                    return;
                }
                
                // Validar número de miembros (obligatorio)
                const validacionMiembros = validarNumeroPositivo(numMiembros, 1, 999);
                if (!validacionMiembros.valido) {
                    mostrarErrorCampo(document.getElementById('benef_fam_miembros'), validacionMiembros.mensaje);
                    return;
                }
                
                beneficiario.nombre_familia = nombreFamilia;
                beneficiario.jefe_familia = jefeFamilia;
                beneficiario.dpi_jefe_familia = dpiJefe || null;
                beneficiario.telefono = telefono || null;
                beneficiario.numero_miembros = numMiembros || null;
                beneficiario.display_name = `${nombreFamilia} (${jefeFamilia})`;
                detallesPayload = {
                    ...detallesPayload,
                    nombre_familia: nombreFamilia,
                    jefe_familia: jefeFamilia,
                    dpi_jefe_familia: beneficiario.dpi_jefe_familia,
                    telefono: beneficiario.telefono,
                    numero_miembros: beneficiario.numero_miembros
                };
                
                if (dpiJefe) {
                    const validacionDPI = validarDPI(dpiJefe);
                    if (!validacionDPI.valido) {
                        mostrarErrorCampo(document.getElementById('benef_fam_dpi'), validacionDPI.mensaje);
                        return;
                    }
                }
                
                if (telefono) {
                    const validacionTelefono = validarTelefono(telefono);
                    if (!validacionTelefono.valido) {
                        mostrarErrorCampo(document.getElementById('benef_fam_telefono'), validacionTelefono.mensaje);
                        return;
                    }
                }
                
            } else if (tipo === 'institución') {
                const nombreInst = document.getElementById('benef_inst_nombre').value.trim();
                const tipoInst = document.getElementById('benef_inst_tipo').value;
                const representante = document.getElementById('benef_inst_representante').value.trim();
                const dpiRep = document.getElementById('benef_inst_dpi_rep').value.trim();
                const telefono = document.getElementById('benef_inst_telefono').value.trim();
                const email = document.getElementById('benef_inst_email').value.trim();
                const numBenef = document.getElementById('benef_inst_num_beneficiarios').value.trim();
                
                if (!nombreInst || !tipoInst || !representante || !numBenef) {
                    alert('Por favor, completa todos los campos obligatorios');
                    return;
                }
                
                // Validar representante legal (obligatorio)
                const validacionRep = validarNombre(representante);
                if (!validacionRep.valido) {
                    mostrarErrorCampo(document.getElementById('benef_inst_representante'), validacionRep.mensaje);
                    return;
                }
                
                // Validar número de beneficiarios (obligatorio)
                const validacionNum = validarNumeroPositivo(numBenef, 1, 99999);
                if (!validacionNum.valido) {
                    mostrarErrorCampo(document.getElementById('benef_inst_num_beneficiarios'), validacionNum.mensaje);
                    return;
                }
                
                beneficiario.nombre_institucion = nombreInst;
                beneficiario.tipo_institucion = tipoInst;
                beneficiario.representante_legal = representante || null;
                beneficiario.dpi_representante = dpiRep || null;
                beneficiario.telefono = telefono || null;
                beneficiario.email = email || null;
                beneficiario.numero_beneficiarios_directos = numBenef || null;
                beneficiario.display_name = `${nombreInst} (${tipoInst})`;
                detallesPayload = {
                    ...detallesPayload,
                    nombre_institucion: nombreInst,
                    tipo_institucion: tipoInst,
                    representante_legal: beneficiario.representante_legal,
                    dpi_representante: beneficiario.dpi_representante,
                    telefono: beneficiario.telefono,
                    email: beneficiario.email,
                    numero_beneficiarios_directos: beneficiario.numero_beneficiarios_directos
                };
                
                if (dpiRep) {
                    const validacionDPI = validarDPI(dpiRep);
                    if (!validacionDPI.valido) {
                        mostrarErrorCampo(document.getElementById('benef_inst_dpi_rep'), validacionDPI.mensaje);
                        return;
                    }
                }
                
                if (telefono) {
                    const validacionTelefono = validarTelefono(telefono);
                    if (!validacionTelefono.valido) {
                        mostrarErrorCampo(document.getElementById('benef_inst_telefono'), validacionTelefono.mensaje);
                        return;
                    }
                }
                
                if (email) {
                    const validacionEmail = validarEmail(email);
                    if (!validacionEmail.valido) {
                        mostrarErrorCampo(document.getElementById('benef_inst_email'), validacionEmail.mensaje);
                        return;
                    }
                }
                
            } else if (tipo === 'otro') {
                const nombre = document.getElementById('benef_otro_nombre').value.trim();
                const tipoDesc = document.getElementById('benef_otro_tipo_desc').value.trim();
                const contacto = document.getElementById('benef_otro_contacto').value.trim();
                const telefono = document.getElementById('benef_otro_telefono').value.trim();
                const descripcion = document.getElementById('benef_otro_descripcion').value.trim();
                
                if (!nombre || !tipoDesc || !contacto || !descripcion) {
                    alert('Por favor, completa todos los campos obligatorios');
                    return;
                }
                
                // Validar contacto (obligatorio)
                const validacionContacto = validarNombre(contacto);
                if (!validacionContacto.valido) {
                    mostrarErrorCampo(document.getElementById('benef_otro_contacto'), validacionContacto.mensaje);
                    return;
                }
                
                beneficiario.nombre = nombre;
                beneficiario.tipo_descripcion = document.getElementById('benef_otro_tipo_desc').value || null;
                beneficiario.contacto = document.getElementById('benef_otro_contacto').value || null;
                beneficiario.telefono = telefono || null;
                beneficiario.descripcion = document.getElementById('benef_otro_descripcion').value || null;
                beneficiario.display_name = `${nombre}${beneficiario.tipo_descripcion ? ' - ' + beneficiario.tipo_descripcion : ''}`;
                detallesPayload = {
                    ...detallesPayload,
                    nombre,
                    tipo_descripcion: beneficiario.tipo_descripcion,
                    contacto: beneficiario.contacto,
                    telefono: beneficiario.telefono,
                    descripcion: beneficiario.descripcion
                };
                
                if (telefono) {
                    const validacionTelefono = validarTelefono(telefono);
                    if (!validacionTelefono.valido) {
                        mostrarErrorCampo(document.getElementById('benef_otro_telefono'), validacionTelefono.mensaje);
                        return;
                    }
                }
            }
            
            beneficiario.detalles = {
                ...detallesPayload,
                display_name: beneficiario.display_name || '',
                comunidad_id: resolvedCommunityId,
                comunidad_nombre: resolvedCommunityNombre,
                comunidad_codigo: resolvedCommunityCodigo,
                region_id: resolvedRegionId,
                region_nombre: resolvedRegionNombre,
                region_codigo: resolvedRegionCodigo,
                region_sede: resolvedRegionSede
            };

            const tipoNormalizado = (tipo || '').toLowerCase();
            let dpiParaValidacion = '';
            if (tipoNormalizado === 'individual') {
                dpiParaValidacion = normalizeDpiValue(beneficiario.dpi);
            } else if (tipoNormalizado === 'familia') {
                dpiParaValidacion = normalizeDpiValue(beneficiario.dpi_jefe_familia);
            } else if (tipoNormalizado === 'institucion' || tipoNormalizado === 'institución') {
                dpiParaValidacion = normalizeDpiValue(beneficiario.dpi_representante);
            }

            if (dpiParaValidacion) {
                const opcionesExclusion = {};
                if (beneficiarioEnEdicion) {
                    if (beneficiarioEnEdicion.esExistente) {
                        const actual = beneficiariosExistentes[beneficiarioEnEdicion.index];
                        if (actual && actual.id) {
                            opcionesExclusion.excludeId = actual.id;
                        }
                    } else {
                        const actual = beneficiariosNuevos[beneficiarioEnEdicion.index];
                        if (actual && actual.temporal_id) {
                            opcionesExclusion.excludeTempId = actual.temporal_id;
                        }
                    }
                }
                const duplicado = findExistingBeneficiaryByDpi(dpiParaValidacion, opcionesExclusion);
                if (duplicado) {
                    const nombreDuplicado = describeBeneficiary(duplicado.item);
                    mostrarMensaje('error', `El DPI ingresado ya está asignado a ${nombreDuplicado}.`);
                    return;
                }
            }
            
            // Agregar o actualizar según el modo
            if (beneficiarioEnEdicion) {
                if (beneficiarioEnEdicion.esExistente) {
                    // Actualizar beneficiario existente (de la DB)
                    beneficiariosExistentes[beneficiarioEnEdicion.index] = {
                        ...beneficiariosExistentes[beneficiarioEnEdicion.index],
                        tipo: beneficiario.tipo,
                        tipo_display: beneficiario.tipo_display,
                        nombre: beneficiario.display_name || beneficiariosExistentes[beneficiarioEnEdicion.index].nombre,
                        display_name: beneficiario.display_name || beneficiariosExistentes[beneficiarioEnEdicion.index].display_name,
                        comunidad_id: resolvedCommunityId,
                        comunidad_nombre: resolvedCommunityNombre,
                        comunidad_codigo: resolvedCommunityCodigo || beneficiariosExistentes[beneficiarioEnEdicion.index].comunidad_codigo,
                        region_id: resolvedRegionId,
                        region_nombre: resolvedRegionNombre,
                        region_codigo: resolvedRegionCodigo || beneficiariosExistentes[beneficiarioEnEdicion.index].region_codigo,
                        region_sede: resolvedRegionSede,
                        detalles: {
                            ...beneficiario.detalles
                        },
                        modificado: true // Marcar como modificado
                    };
                    
                    // Agregar a la lista de modificados (para enviar al backend)
                    const existenteModIndex = beneficiariosModificados.findIndex(b => b.id === beneficiariosExistentes[beneficiarioEnEdicion.index].id);
                    const { temporal_id: _tempIdDiscarded, ...payloadMod } = beneficiario;
                    const payloadModificado = {
                        id: beneficiariosExistentes[beneficiarioEnEdicion.index].id,
                        tipo: beneficiario.tipo,
                        ...payloadMod,
                        comunidad_id: resolvedCommunityId,
                        comunidad_codigo: resolvedCommunityCodigo,
                        region_id: resolvedRegionId,
                        region_codigo: resolvedRegionCodigo
                    };
                    if (existenteModIndex === -1) {
                        beneficiariosModificados.push(payloadModificado);
                    } else {
                        beneficiariosModificados[existenteModIndex] = payloadModificado;
                    }
                    
                } else {
                    // Actualizar beneficiario nuevo (aún no en DB)
                    beneficiariosNuevos[beneficiarioEnEdicion.index] = beneficiario;
                }
            } else {
                // Agregar nuevo beneficiario
                beneficiariosNuevos.push(beneficiario);
            }
            
            // Actualizar vista (usar función apropiada según el modo)
            if (eventoEnEdicion) {
                renderBeneficiariosExistentes();
            } else {
                renderBeneficiarios();
            }
            
            // Actualizar tarjeta de Beneficiarios automática
            updateBeneficiariesCard();
            
            // Cerrar modal
            closeBeneficiaryModal();
        });
        saveBeneficiaryBtn.dataset.listenerAdded = 'true';
    }
    
    function normalizeFilterValue(value) {
        return (value || '')
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function normalizeText(value) {
        return (value || '')
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function renderBeneficiaryFiltersRegionOptions(presetValue = null) {
        if (!beneficiariesFilterRegionSelect) {
            return;
        }

        const previousValue = presetValue !== null && presetValue !== undefined
            ? String(presetValue)
            : beneficiariesFilterRegionSelect.value;

        const fragment = document.createDocumentFragment();
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Todas las regiones';
        fragment.appendChild(defaultOption);

        if (Array.isArray(regionesList) && regionesList.length > 0) {
            regionesList.forEach(region => {
                if (!region) return;
                const option = document.createElement('option');
                option.value = String(region.id);
                const codigoTexto = region.codigo || region.nombre || 'Región';
                const sedeTexto = region.comunidad_sede ? ` — ${region.comunidad_sede}` : (region.nombre && region.nombre !== codigoTexto ? ` — ${region.nombre}` : '');
                option.textContent = `${codigoTexto}${sedeTexto}`;
                option.dataset.regionNombre = region.nombre || '';
                option.dataset.regionCodigo = region.codigo || '';
                option.dataset.regionSede = region.comunidad_sede || '';
                fragment.appendChild(option);
            });
        }

        beneficiariesFilterRegionSelect.innerHTML = '';
        beneficiariesFilterRegionSelect.appendChild(fragment);

        if (previousValue && Array.from(beneficiariesFilterRegionSelect.options).some(opt => opt.value === previousValue)) {
            beneficiariesFilterRegionSelect.value = previousValue;
        } else {
            beneficiariesFilterRegionSelect.value = '';
        }
    }

    function renderBeneficiaryFiltersCommunityOptions(regionId = null, presetValue = null) {
        if (!beneficiariesFilterCommunitySelect) {
            return;
        }

        const normalizedRegionId = regionId ? String(regionId) : '';
        const previousValue = presetValue !== null && presetValue !== undefined
            ? String(presetValue)
            : beneficiariesFilterCommunitySelect.value;

        const fragment = document.createDocumentFragment();
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = normalizedRegionId ? 'Todas las comunidades de la región' : 'Todas las comunidades';
        fragment.appendChild(defaultOption);

        const comunidadesFuente = Array.isArray(comunidadesList) ? comunidadesList : [];
        comunidadesFuente
            .filter(comunidad => {
                if (!normalizedRegionId) return true;
                const comunidadRegionId = comunidad.region && comunidad.region.id
                    ? String(comunidad.region.id)
                    : (comunidad.region_id ? String(comunidad.region_id) : null);
                return comunidadRegionId === normalizedRegionId;
            })
            .forEach(comunidad => {
                const option = document.createElement('option');
                option.value = String(comunidad.id);
                option.textContent = comunidad.nombre || 'Sin nombre';
                fragment.appendChild(option);
            });

        beneficiariesFilterCommunitySelect.innerHTML = '';
        beneficiariesFilterCommunitySelect.appendChild(fragment);

        if (previousValue && Array.from(beneficiariesFilterCommunitySelect.options).some(opt => opt.value === previousValue)) {
            beneficiariesFilterCommunitySelect.value = previousValue;
        } else {
            beneficiariesFilterCommunitySelect.value = '';
        }
    }

    // Renderizar beneficiarios existentes (en modo edición)
    // VERSIÓN 42: Layout horizontal con todos los datos detallados
    function renderBeneficiariosExistentes() {
        const container = document.getElementById('beneficiariesContainer');
        const beneficiariesSection = document.getElementById('beneficiariesSection');
        const beneficiaryCount = document.getElementById('beneficiaryCount');

        if (!container) return;

        const total = beneficiariosExistentes.length + beneficiariosNuevos.length;
        if (total === 0) {
            if (beneficiariesSection) {
                beneficiariesSection.style.display = 'none';
            }
            container.innerHTML = '';
            return;
        }

        if (beneficiariesSection) {
            beneficiariesSection.style.display = 'block';
        }

        if (beneficiaryCount) {
            beneficiaryCount.textContent = total === 1 ? '1 beneficiario' : `${total} beneficiarios`;
        }
        
        container.innerHTML = '';
        
        const combinedList = [
            ...beneficiariosExistentes.map((benef, index) => ({ ...benef, origen: 'existente', index })),
            ...beneficiariosNuevos.map((benef, index) => ({ ...benef, origen: 'nuevo', index }))
        ];

        const typeFilterNormalized = beneficiariesFilterTypeSelect
            ? normalizeFilterValue(beneficiariesFilterTypeSelect.value)
            : '';
        const regionFilterValue = beneficiariesFilterRegionSelect ? beneficiariesFilterRegionSelect.value : '';
        const communityFilterValue = beneficiariesFilterCommunitySelect ? beneficiariesFilterCommunitySelect.value : '';

        // Obtener término de búsqueda
        const searchInput = document.getElementById('beneficiariesSearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Filtrar beneficiarios según el término de búsqueda
        let filteredList = combinedList;

        if (typeFilterNormalized) {
            filteredList = filteredList.filter(item => normalizeFilterValue(item.tipo || item.tipo_display) === typeFilterNormalized);
        }

        if (regionFilterValue) {
            filteredList = filteredList.filter(item => {
                const regionId = item.region_id || (item.detalles && item.detalles.region_id);
                return regionId && String(regionId) === String(regionFilterValue);
            });
        }

        if (communityFilterValue) {
            filteredList = filteredList.filter(item => {
                const comunidadId = item.comunidad_id || (item.detalles && item.detalles.comunidad_id);
                return comunidadId && String(comunidadId) === String(communityFilterValue);
            });
        }

        const normalizedSearchTerm = normalizeText(searchTerm);
        if (normalizedSearchTerm) {
            filteredList = filteredList.filter(item => {
                const detalles = item.detalles || {};
                const tipoLower = (item.tipo || '').toLowerCase();
                
                // Buscar en nombre
                let nombre = '';
                if (tipoLower === 'individual') {
                    nombre = `${detalles.nombre || item.nombre || ''} ${detalles.apellido || item.apellido || ''}`.toLowerCase();
                } else if (tipoLower === 'familia') {
                    nombre = (detalles.nombre_familia || item.nombre_familia || '').toLowerCase();
                } else if (tipoLower === 'institución' || tipoLower === 'institucion') {
                    nombre = (detalles.nombre_institucion || item.nombre_institucion || '').toLowerCase();
                } else {
                    nombre = (item.display_name || item.nombre || '').toLowerCase();
                }
                
                // Buscar en DPI
                let dpi = '';
                if (tipoLower === 'individual') {
                    dpi = (detalles.dpi || item.dpi || '').toLowerCase();
                } else if (tipoLower === 'familia') {
                    dpi = (detalles.dpi_jefe_familia || item.dpi_jefe_familia || '').toLowerCase();
                } else if (tipoLower === 'institución' || tipoLower === 'institucion') {
                    dpi = (detalles.dpi_representante || item.dpi_representante || '').toLowerCase();
                }
                
                // Buscar en teléfono
                const telefono = (detalles.telefono || item.telefono || '').toLowerCase();
                const regionNombre = normalizeText(
                    item.region_nombre ||
                    detalles.region_nombre ||
                    (item.region && item.region.nombre) ||
                    ''
                );
                const regionCodigo = normalizeText(
                    item.region_codigo ||
                    detalles.region_codigo ||
                    (item.region && item.region.codigo) ||
                    ''
                );
                const regionSede = normalizeText(
                    item.region_sede ||
                    detalles.region_sede ||
                    ''
                );
                const comunidadNombre = normalizeText(
                    item.comunidad_nombre ||
                    (detalles.comunidad_nombre) ||
                    (item.comunidad && item.comunidad.nombre) ||
                    ''
                );
                const comunidadCodigo = normalizeText(
                    item.comunidad_codigo ||
                    detalles.comunidad_codigo ||
                    ''
                );
                
                return normalizeText(nombre).includes(normalizedSearchTerm) ||
                    normalizeText(dpi).includes(normalizedSearchTerm) ||
                    normalizeText(telefono).includes(normalizedSearchTerm) ||
                    regionNombre.includes(normalizedSearchTerm) ||
                    regionCodigo.includes(normalizedSearchTerm) ||
                    regionSede.includes(normalizedSearchTerm) ||
                    comunidadNombre.includes(normalizedSearchTerm) ||
                    comunidadCodigo.includes(normalizedSearchTerm);
            });
        }

        // OPTIMIZACIÓN: Paginación para eventos con muchos beneficiarios (1000+)
        // Renderizar solo los primeros beneficiarios inicialmente para mejorar rendimiento
        const BENEFICIARIOS_POR_PAGINA = 100; // Renderizar 100 a la vez
        let beneficiariosRenderizados = 0;
        let mostrarTodos = false; // Flag para mostrar todos si hay pocos
        
        // Si hay menos de 200 beneficiarios, mostrar todos de una vez
        if (filteredList.length <= 200) {
            mostrarTodos = true;
        }
        
        // Renderizar beneficiarios con paginación
        const beneficiariosARenderizar = mostrarTodos ? filteredList : filteredList.slice(0, BENEFICIARIOS_POR_PAGINA);
        beneficiariosRenderizados = beneficiariosARenderizar.length;
        
        beneficiariosARenderizar.forEach(item => {
            const card = document.createElement('div');
            card.className = 'beneficiary-card';
            if (item.id && item.origen === 'existente') {
                card.style.cursor = 'pointer';
            }

            const badge = item.origen === 'nuevo'
                ? '<span class="card-badge" style="background: rgba(76,175,80,0.18); color: #4CAF50;">Nuevo</span>'
                : (item.modificado ? '<span class="card-badge" style="background: rgba(255,193,7,0.18); color: #FFC107;">Editado</span>' : (item.esNuevoAsignado ? '<span class="card-badge" style="background: rgba(13,110,253,0.15); color: #0d6efd;">Asociado</span>' : '<span class="card-badge" style="background: rgba(148,163,184,0.18); color: #cbd5f5;">Registrado</span>'));

            const tipoLowerCard = (item.tipo || '').toLowerCase();
            let tipoIcon = '👤';
            if (tipoLowerCard === 'familia') tipoIcon = '👨‍👩‍👧‍👦';
            else if (tipoLowerCard === 'institución' || tipoLowerCard === 'institucion') tipoIcon = '🏢';
            else if (tipoLowerCard === 'otro') tipoIcon = '📋';

            const displayName = item.display_name || item.nombre || (item.detalles && item.detalles.display_name) || 'Beneficiario';
            const tipoTexto = item.tipo_display || item.tipo || 'Sin tipo';
            const locationText = item.comunidad_nombre ? `${item.comunidad_nombre}${item.region_nombre ? ' — ' + item.region_nombre : ''}` : 'Sin comunidad asignada';
            
            // Obtener detalles específicos según el tipo
            const detalles = item.detalles || {};
            let datosDetallados = '';
            
            if (tipoLowerCard === 'individual') {
                const nombre = detalles.nombre || item.nombre || '';
                const apellido = detalles.apellido || item.apellido || '';
                const dpi = detalles.dpi || item.dpi || 'N/A';
                const telefono = detalles.telefono || item.telefono || 'N/A';
                const genero = detalles.genero || item.genero || 'N/A';
                const fechaNac = detalles.fecha_nacimiento || item.fecha_nacimiento || null;
                
                // Calcular edad desde fecha de nacimiento
                let edadDisplay = 'N/A';
                if (fechaNac && fechaNac !== 'N/A') {
                    const edad = calcularEdadDesdeFecha(fechaNac);
                    if (edad !== null && edad >= 0) {
                        edadDisplay = `${edad} años`;
                    }
                }
                
                datosDetallados = `
                    <div class="card-field-row">
                        <div class="card-field">
                            <span class="card-field-label">Nombre</span>
                            <span class="card-field-value">${nombre} ${apellido}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">DPI</span>
                            <span class="card-field-value-secondary">${dpi}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Teléfono</span>
                            <span class="card-field-value-secondary">${telefono}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Género</span>
                            <span class="card-field-value-secondary" style="text-transform: capitalize;">${genero}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Edad</span>
                            <span class="card-field-value-secondary">${edadDisplay}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Ubicación</span>
                            <span class="card-field-value-secondary">${locationText}</span>
                        </div>
                    </div>
                `;
            } else if (tipoLowerCard === 'familia') {
                const nombreFamilia = detalles.nombre_familia || item.nombre_familia || '';
                const jefeFamilia = detalles.jefe_familia || item.jefe_familia || 'N/A';
                const dpiJefe = detalles.dpi_jefe_familia || item.dpi_jefe_familia || 'N/A';
                const telefono = detalles.telefono || item.telefono || 'N/A';
                const numMiembros = detalles.numero_miembros || item.numero_miembros || 'N/A';
                
                datosDetallados = `
                    <div class="card-field-row">
                        <div class="card-field">
                            <span class="card-field-label">Familia</span>
                            <span class="card-field-value">${nombreFamilia}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Jefe de Familia</span>
                            <span class="card-field-value-secondary">${jefeFamilia}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">DPI Jefe</span>
                            <span class="card-field-value-secondary">${dpiJefe}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Teléfono</span>
                            <span class="card-field-value-secondary">${telefono}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Miembros</span>
                            <span class="card-field-value-secondary">${numMiembros}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Ubicación</span>
                            <span class="card-field-value-secondary">${locationText}</span>
                        </div>
                    </div>
                `;
            } else if (tipoLowerCard === 'institución' || tipoLowerCard === 'institucion') {
                const nombreInst = detalles.nombre_institucion || item.nombre_institucion || '';
                const tipoInst = detalles.tipo_institucion || item.tipo_institucion || 'N/A';
                const representante = detalles.representante_legal || item.representante_legal || 'N/A';
                const dpiRep = detalles.dpi_representante || item.dpi_representante || 'N/A';
                const telefono = detalles.telefono || item.telefono || 'N/A';
                const email = detalles.email || item.email || 'N/A';
                const numBenef = detalles.numero_beneficiarios_directos || item.numero_beneficiarios_directos || 'N/A';
                
                datosDetallados = `
                    <div class="card-field-row">
                        <div class="card-field">
                            <span class="card-field-label">Institución</span>
                            <span class="card-field-value">${nombreInst}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Tipo</span>
                            <span class="card-field-value-secondary" style="text-transform: capitalize;">${tipoInst}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Representante</span>
                            <span class="card-field-value-secondary">${representante}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">DPI Rep.</span>
                            <span class="card-field-value-secondary">${dpiRep}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Teléfono</span>
                            <span class="card-field-value-secondary">${telefono}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Email</span>
                            <span class="card-field-value-secondary">${email}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Beneficiarios</span>
                            <span class="card-field-value-secondary">${numBenef}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Ubicación</span>
                            <span class="card-field-value-secondary">${locationText}</span>
                        </div>
                    </div>
                `;
            } else if (tipoLowerCard === 'otro') {
                const nombre = detalles.nombre || item.nombre || '';
                const tipoDesc = detalles.tipo_descripcion || item.tipo_descripcion || 'N/A';
                const contacto = detalles.contacto || item.contacto || 'N/A';
                const telefono = detalles.telefono || item.telefono || 'N/A';
                
                datosDetallados = `
                    <div class="card-field-row">
                        <div class="card-field">
                            <span class="card-field-label">Nombre</span>
                            <span class="card-field-value">${nombre}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Tipo/Descripción</span>
                            <span class="card-field-value-secondary">${tipoDesc}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Contacto</span>
                            <span class="card-field-value-secondary">${contacto}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Teléfono</span>
                            <span class="card-field-value-secondary">${telefono}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Ubicación</span>
                            <span class="card-field-value-secondary">${locationText}</span>
                        </div>
                    </div>
                `;
            } else {
                // Fallback para tipos desconocidos
                datosDetallados = `
                    <div class="card-field-row">
                        <div class="card-field">
                            <span class="card-field-label">Nombre</span>
                            <span class="card-field-value">${displayName}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Tipo</span>
                            <span class="card-field-value-secondary" style="text-transform: capitalize;">${tipoTexto}</span>
                        </div>
                        <div class="card-field">
                            <span class="card-field-label">Ubicación</span>
                            <span class="card-field-value-secondary">${locationText}</span>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-content">
                    <div class="card-header">
                        <span class="card-icon-wrapper" style="font-size: 1.6rem; line-height: 1;">${tipoIcon}</span>
                        <div class="card-fields">
                            ${datosDetallados}
                        </div>
                    </div>
                    <div class="card-actions">
                        <div>
                            ${badge}
                        </div>
                        <div class="card-buttons">
                            <button type="button" class="btn-benef-edit btn-primary" data-origen="${item.origen}" data-index="${item.index}" onclick="event.stopPropagation();">
                                <span style="font-size: 1rem;">✏️</span> Editar
                            </button>
                            <button type="button" class="btn-benef-remove btn-danger" data-origen="${item.origen}" data-index="${item.index}" data-benef-id="${item.id || ''}" onclick="event.stopPropagation();">
                                <span style="font-size: 1rem;">✖</span> Quitar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Agregar evento click a la tarjeta para mostrar detalles (solo si tiene ID y es existente)
            if (item.id && item.origen === 'existente') {
                card.addEventListener('click', (e) => {
                    // No abrir detalles si se hace click en los botones de acción
                    if (e.target.closest('.btn-benef-edit') || e.target.closest('.btn-benef-remove')) {
                        return;
                    }
                    mostrarDetallesBeneficiario(item.id);
                });
            }

            container.appendChild(card);
        });
        
        // Agregar botón "Cargar más" si hay más beneficiarios por mostrar
        if (!mostrarTodos && beneficiariosRenderizados < filteredList.length) {
            // Eliminar botón anterior si existe
            const existingLoadMoreBtn = container.querySelector('.btn-load-more-beneficiarios');
            if (existingLoadMoreBtn) {
                existingLoadMoreBtn.remove();
            }
            
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn-load-more-beneficiarios';
            loadMoreBtn.style.cssText = `
                width: 100%;
                padding: 12px;
                margin-top: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            `;
            const restantes = filteredList.length - beneficiariosRenderizados;
            loadMoreBtn.textContent = `Cargar ${Math.min(restantes, BENEFICIARIOS_POR_PAGINA)} beneficiarios más (${restantes} restantes)`;
            
            loadMoreBtn.addEventListener('mouseenter', () => {
                loadMoreBtn.style.transform = 'translateY(-2px)';
                loadMoreBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            });
            loadMoreBtn.addEventListener('mouseleave', () => {
                loadMoreBtn.style.transform = 'translateY(0)';
                loadMoreBtn.style.boxShadow = 'none';
            });
            
            loadMoreBtn.addEventListener('click', () => {
                const siguientePagina = filteredList.slice(beneficiariosRenderizados, beneficiariosRenderizados + BENEFICIARIOS_POR_PAGINA);
                const siguienteIndice = beneficiariosRenderizados;
                
                siguientePagina.forEach((item, idx) => {
                    const card = document.createElement('div');
                    card.className = 'beneficiary-card';
                    if (item.id && item.origen === 'existente') {
                        card.style.cursor = 'pointer';
                    }

                    const badge = item.origen === 'nuevo'
                        ? '<span class="card-badge" style="background: rgba(76,175,80,0.18); color: #4CAF50;">Nuevo</span>'
                        : (item.modificado ? '<span class="card-badge" style="background: rgba(255,193,7,0.18); color: #FFC107;">Editado</span>' : (item.esNuevoAsignado ? '<span class="card-badge" style="background: rgba(13,110,253,0.15); color: #0d6efd;">Asociado</span>' : '<span class="card-badge" style="background: rgba(148,163,184,0.18); color: #cbd5f5;">Registrado</span>'));

                    const tipoLowerCard = (item.tipo || '').toLowerCase();
                    let tipoIcon = '👤';
                    if (tipoLowerCard === 'familia') tipoIcon = '👨‍👩‍👧‍👦';
                    else if (tipoLowerCard === 'institución' || tipoLowerCard === 'institucion') tipoIcon = '🏢';
                    else if (tipoLowerCard === 'otro') tipoIcon = '📋';

                    const displayName = item.display_name || item.nombre || (item.detalles && item.detalles.display_name) || 'Beneficiario';
                    const tipoTexto = item.tipo_display || item.tipo || 'Sin tipo';
                    const locationText = item.comunidad_nombre ? `${item.comunidad_nombre}${item.region_nombre ? ' — ' + item.region_nombre : ''}` : 'Sin comunidad asignada';
                    
                    const detalles = item.detalles || {};
                    let datosDetallados = '';
                    
                    if (tipoLowerCard === 'individual') {
                        const nombre = detalles.nombre || item.nombre || '';
                        const apellido = detalles.apellido || item.apellido || '';
                        const dpi = detalles.dpi || item.dpi || 'N/A';
                        const telefono = detalles.telefono || item.telefono || 'N/A';
                        const genero = detalles.genero || item.genero || 'N/A';
                        const fechaNac = detalles.fecha_nacimiento || item.fecha_nacimiento || null;
                        
                        let edadDisplay = 'N/A';
                        if (fechaNac && fechaNac !== 'N/A') {
                            const edad = calcularEdadDesdeFecha(fechaNac);
                            if (edad !== null && edad >= 0) {
                                edadDisplay = `${edad} años`;
                            }
                        }
                        
                        datosDetallados = `
                            <div class="card-field-row">
                                <div class="card-field">
                                    <span class="card-field-label">Nombre</span>
                                    <span class="card-field-value">${nombre} ${apellido}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">DPI</span>
                                    <span class="card-field-value-secondary">${dpi}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Teléfono</span>
                                    <span class="card-field-value-secondary">${telefono}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Género</span>
                                    <span class="card-field-value-secondary" style="text-transform: capitalize;">${genero}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Edad</span>
                                    <span class="card-field-value-secondary">${edadDisplay}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Ubicación</span>
                                    <span class="card-field-value-secondary">${locationText}</span>
                                </div>
                            </div>
                        `;
                    } else if (tipoLowerCard === 'familia') {
                        const nombreFamilia = detalles.nombre_familia || item.nombre_familia || 'N/A';
                        const jefeFamilia = detalles.jefe_familia || item.jefe_familia || 'N/A';
                        const dpiJefe = detalles.dpi_jefe_familia || item.dpi_jefe_familia || 'N/A';
                        const telefono = detalles.telefono || item.telefono || 'N/A';
                        const numMiembros = detalles.numero_miembros || item.numero_miembros || 'N/A';
                        
                        datosDetallados = `
                            <div class="card-field-row">
                                <div class="card-field">
                                    <span class="card-field-label">Nombre Familia</span>
                                    <span class="card-field-value">${nombreFamilia}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Jefe de Familia</span>
                                    <span class="card-field-value">${jefeFamilia}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">DPI Jefe</span>
                                    <span class="card-field-value-secondary">${dpiJefe}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Teléfono</span>
                                    <span class="card-field-value-secondary">${telefono}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Miembros</span>
                                    <span class="card-field-value-secondary">${numMiembros}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Ubicación</span>
                                    <span class="card-field-value-secondary">${locationText}</span>
                                </div>
                            </div>
                        `;
                    } else if (tipoLowerCard === 'institución' || tipoLowerCard === 'institucion') {
                        const nombreInstitucion = detalles.nombre_institucion || item.nombre_institucion || 'N/A';
                        const representante = detalles.representante_legal || item.representante_legal || 'N/A';
                        const dpiRepresentante = detalles.dpi_representante || item.dpi_representante || 'N/A';
                        const telefono = detalles.telefono || item.telefono || 'N/A';
                        const email = detalles.email || item.email || 'N/A';
                        const numBeneficiarios = detalles.numero_beneficiarios_directos || item.numero_beneficiarios_directos || 'N/A';
                        
                        datosDetallados = `
                            <div class="card-field-row">
                                <div class="card-field">
                                    <span class="card-field-label">Institución</span>
                                    <span class="card-field-value">${nombreInstitucion}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Representante</span>
                                    <span class="card-field-value">${representante}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">DPI Representante</span>
                                    <span class="card-field-value-secondary">${dpiRepresentante}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Teléfono</span>
                                    <span class="card-field-value-secondary">${telefono}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Email</span>
                                    <span class="card-field-value-secondary">${email}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Beneficiarios Directos</span>
                                    <span class="card-field-value-secondary">${numBeneficiarios}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Ubicación</span>
                                    <span class="card-field-value-secondary">${locationText}</span>
                                </div>
                            </div>
                        `;
                    }
                    
                    card.innerHTML = `
                        <div class="card-header">
                            <div class="card-header-left">
                                <span class="card-icon">${tipoIcon}</span>
                                <div class="card-info">
                                    <h4 class="card-title">${displayName}</h4>
                                    <p class="card-subtitle">${tipoTexto} • ${locationText}</p>
                                </div>
                            </div>
                            <div class="card-header-right">
                                ${badge}
                                <div class="card-actions">
                                    <button class="btn-benef-edit" data-origen="${item.origen}" data-index="${siguienteIndice + idx}" title="Editar">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="btn-benef-remove" data-origen="${item.origen}" data-index="${siguienteIndice + idx}" title="Eliminar">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        ${datosDetallados}
                    `;
                    
                    if (item.id && item.origen === 'existente') {
                        card.addEventListener('click', (e) => {
                            if (e.target.closest('.btn-benef-edit') || e.target.closest('.btn-benef-remove')) {
                                return;
                            }
                            mostrarDetallesBeneficiario(item.id);
                        });
                    }
                    
                    container.insertBefore(card, loadMoreBtn);
                });
                
                beneficiariosRenderizados += siguientePagina.length;
                
                // Actualizar o eliminar botón
                if (beneficiariosRenderizados >= filteredList.length) {
                    loadMoreBtn.remove();
                } else {
                    const restantes = filteredList.length - beneficiariosRenderizados;
                    loadMoreBtn.textContent = `Cargar ${Math.min(restantes, BENEFICIARIOS_POR_PAGINA)} beneficiarios más (${restantes} restantes)`;
                }
                
                // Agregar event listeners a los nuevos botones
                container.querySelectorAll('.btn-benef-edit').forEach(btn => {
                    const origen = btn.getAttribute('data-origen');
                    const index = parseInt(btn.getAttribute('data-index'), 10);
                    if (origen === 'existente') {
                        btn.addEventListener('click', () => editarBeneficiarioExistente(index));
                    } else {
                        btn.addEventListener('click', () => editarBeneficiarioNuevo(index));
                    }
                });
                
                container.querySelectorAll('.btn-benef-remove').forEach(btn => {
                    const origen = btn.getAttribute('data-origen');
                    const index = parseInt(btn.getAttribute('data-index'), 10);
                    if (origen === 'existente') {
                        btn.addEventListener('click', () => eliminarBeneficiarioExistente(index));
                    } else {
                        btn.addEventListener('click', () => eliminarBeneficiarioNuevo(index));
                    }
                });
            });
            
            container.appendChild(loadMoreBtn);
        }
        
        // El scroll está siempre activo por defecto en CSS, no necesitamos lógica condicional

        container.querySelectorAll('.btn-benef-edit').forEach(btn => {
            const origen = btn.getAttribute('data-origen');
            const index = parseInt(btn.getAttribute('data-index'), 10);
            if (origen === 'existente') {
                btn.addEventListener('click', () => editarBeneficiarioExistente(index));
            } else {
                btn.addEventListener('click', () => editarBeneficiarioNuevo(index));
            }
        });

        container.querySelectorAll('.btn-benef-remove').forEach(btn => {
            const origen = btn.getAttribute('data-origen');
            const index = parseInt(btn.getAttribute('data-index'), 10);
            const benefId = btn.getAttribute('data-benef-id');
            if (origen === 'existente') {
                btn.addEventListener('click', () => eliminarBeneficiarioExistente(benefId));
            } else {
                btn.addEventListener('click', () => {
                    beneficiariosNuevos.splice(index, 1);
                    renderBeneficiariosExistentes();
                    updateBeneficiariesCard();
                });
            }
        });
    }

    function renderBeneficiarios() {
        renderBeneficiariosExistentes();
    }
    
    // Función para filtrar beneficiarios
    function filterBeneficiarios() {
        renderBeneficiariosExistentes();
        
        // Mostrar/ocultar botón de limpiar búsqueda
        const searchInput = document.getElementById('beneficiariesSearchInput');
        const clearBtn = document.getElementById('beneficiariesSearchClearBtn');
        if (searchInput && clearBtn) {
            if (searchInput.value.trim() !== '') {
                clearBtn.style.display = 'flex';
            } else {
                clearBtn.style.display = 'none';
            }
        }
    }
    
    // Función para toggle de mostrar/ocultar lista de beneficiarios
    function toggleBeneficiariesList() {
        const wrapper = document.getElementById('beneficiariesContainerWrapper');
        const toggleBtn = document.getElementById('toggleBeneficiariesListBtn');
        
        if (wrapper && toggleBtn) {
            // Usar getComputedStyle para obtener el estado actual real
            const computedStyle = window.getComputedStyle(wrapper);
            const isHidden = computedStyle.display === 'none' || wrapper.style.display === 'none';
            wrapper.style.display = isHidden ? 'block' : 'none';
            
            // Rotar el ícono
            const icon = toggleBtn.querySelector('svg');
            if (icon) {
                icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        }
    }
    
    // Función para toggle de mostrar/ocultar lista de datos del proyecto
    function toggleProjectDataList() {
        const wrapper = document.getElementById('projectDataContainerWrapper');
        const toggleBtn = document.getElementById('toggleProjectDataListBtn');
        
        if (wrapper && toggleBtn) {
            // Usar getComputedStyle para obtener el estado actual real
            const computedStyle = window.getComputedStyle(wrapper);
            const isHidden = computedStyle.display === 'none' || wrapper.style.display === 'none';
            wrapper.style.display = isHidden ? 'block' : 'none';
            
            // Rotar el ícono
            const icon = toggleBtn.querySelector('svg');
            if (icon) {
                icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        }
    }
    
    // Función para toggle de mostrar/ocultar lista de comunidades
    function toggleCommunitiesList() {
        const wrapper = document.getElementById('communitiesContainerWrapper');
        const toggleBtn = document.getElementById('toggleCommunitiesListBtn');
        
        if (wrapper && toggleBtn) {
            // Usar getComputedStyle para obtener el estado actual real
            const computedStyle = window.getComputedStyle(wrapper);
            const isHidden = computedStyle.display === 'none' || wrapper.style.display === 'none';
            wrapper.style.display = isHidden ? 'block' : 'none';
            
            // Rotar el ícono
            const icon = toggleBtn.querySelector('svg');
            if (icon) {
                icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        }
    }
    
    // Función para toggle de mostrar/ocultar lista de evidencias
    function toggleEvidencesList() {
        const wrapper = document.getElementById('evidencesContainerWrapper');
        const toggleBtn = document.getElementById('toggleEvidencesListBtn');
        
        if (wrapper && toggleBtn) {
            // Usar getComputedStyle para obtener el estado actual real
            const computedStyle = window.getComputedStyle(wrapper);
            const isHidden = computedStyle.display === 'none' || wrapper.style.display === 'none';
            wrapper.style.display = isHidden ? 'block' : 'none';
            
            // Rotar el ícono
            const icon = toggleBtn.querySelector('svg');
            if (icon) {
                icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        }
    }
    
    // Event listeners para el buscador y toggle de beneficiarios (usando delegación de eventos)
    document.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'beneficiariesSearchInput') {
            filterBeneficiarios();
        }
    });

    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'beneficiariesFilterType') {
            filterBeneficiarios();
        }
        if (e.target && e.target.id === 'beneficiariesFilterRegion') {
            const regionValue = e.target.value || '';
            renderBeneficiaryFiltersCommunityOptions(regionValue);
            if (beneficiariesFilterCommunitySelect) {
                beneficiariesFilterCommunitySelect.value = '';
            }
            filterBeneficiarios();
        }
        if (e.target && e.target.id === 'beneficiariesFilterCommunity') {
            filterBeneficiarios();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'beneficiariesSearchClearBtn') {
            const searchInput = document.getElementById('beneficiariesSearchInput');
            if (searchInput) {
                searchInput.value = '';
                e.target.style.display = 'none';
                filterBeneficiarios();
            }
        }
        
        // Toggle de beneficiarios (usar closest para detectar clics en el botón o sus hijos)
        const toggleBenefBtn = e.target.closest('#toggleBeneficiariesListBtn');
        if (toggleBenefBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleBeneficiariesList();
            return;
        }
        
        // Toggle de datos del proyecto
        const toggleProjectBtn = e.target.closest('#toggleProjectDataListBtn');
        if (toggleProjectBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleProjectDataList();
            return;
        }
        
        // Toggle de comunidades
        const toggleCommunitiesBtn = e.target.closest('#toggleCommunitiesListBtn');
        if (toggleCommunitiesBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleCommunitiesList();
            return;
        }
        
        // Toggle de evidencias
        const toggleEvidencesBtn = e.target.closest('#toggleEvidencesListBtn');
        if (toggleEvidencesBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleEvidencesList();
            return;
        }
    });
    
    function editarBeneficiarioExistente(index) {
        const benef = beneficiariosExistentes[index];
        
        // Marcar que estamos editando un beneficiario existente
        beneficiarioEnEdicion = { 
            index: index, 
            data: benef,
            esExistente: true // Flag para saber que es de la DB
        };
        
        // Abrir modal
        addBeneficiaryModal.style.display = 'flex';
        setTimeout(() => {
            addBeneficiaryModal.classList.add('show');
        }, 10);
        showBeneficiarySelectors();
        
        // Cambiar título y botón
        const modalTitle = document.querySelector('#addBeneficiaryModal .modal-title');
        if (modalTitle) modalTitle.textContent = 'Editar Beneficiario';
        if (saveBeneficiaryBtn) saveBeneficiaryBtn.textContent = 'Actualizar Beneficiario';
        
        // Pre-llenar formulario según el tipo
        benefTipoSelect.value = benef.tipo;
        hideAllBeneficiaryFields();
        
        // Obtener IDs de región y comunidad del beneficiario
        const regionIdExistente = benef.region_id || (benef.detalles && benef.detalles.region_id) || (benef.region && benef.region.id) || (benef.comunidad && benef.comunidad.region && benef.comunidad.region.id) || '';
        const comunidadIdExistente = benef.comunidad_id || (benef.detalles && benef.detalles.comunidad_id) || (benef.comunidad && benef.comunidad.id) || '';

        // Renderizar opciones de región primero
        renderBeneficiaryRegionOptions(regionIdExistente || '');
        
        // Esperar un momento para que se rendericen las opciones antes de establecer comunidad
        setTimeout(() => {
            // Renderizar opciones de comunidad con la región seleccionada
            renderBeneficiaryCommunityOptions(regionIdExistente || '', comunidadIdExistente || '');
            
            // Asegurar que los valores estén establecidos después de renderizar
            if (benefRegionSelect && regionIdExistente) {
                benefRegionSelect.value = String(regionIdExistente);
            }
            if (benefCommunitySelect && comunidadIdExistente) {
                benefCommunitySelect.value = String(comunidadIdExistente);
            }
        }, 50);
        
        // Cargar datos según el tipo
        const tipoLowerExistente = (benef.tipo || '').toLowerCase();
        
        if (tipoLowerExistente === 'individual') {
            const campos = document.getElementById('campos_individual');
            campos.style.display = 'block';
            
            document.getElementById('benef_ind_nombre').value = benef.detalles?.nombre || '';
            document.getElementById('benef_ind_apellido').value = benef.detalles?.apellido || '';
            document.getElementById('benef_ind_dpi').value = benef.detalles?.dpi || '';
            document.getElementById('benef_ind_fecha_nac').value = benef.detalles?.fecha_nacimiento || '';
            document.getElementById('benef_ind_genero').value = benef.detalles?.genero || '';
            document.getElementById('benef_ind_telefono').value = benef.detalles?.telefono || '';
            
            // Configurar sincronización fecha-edad y actualizar edad si hay fecha
            setTimeout(() => {
                configurarSincronizacionFechaEdad();
                actualizarEdadDesdeFecha();
            }, 100);
            
        } else if (tipoLowerExistente === 'familia') {
            const campos = document.getElementById('campos_familia');
            campos.style.display = 'block';
            
            document.getElementById('benef_fam_nombre').value = benef.detalles?.nombre_familia || '';
            document.getElementById('benef_fam_jefe').value = benef.detalles?.jefe_familia || '';
            document.getElementById('benef_fam_dpi').value = benef.detalles?.dpi_jefe_familia || '';
            document.getElementById('benef_fam_telefono').value = benef.detalles?.telefono || '';
            document.getElementById('benef_fam_miembros').value = benef.detalles?.numero_miembros || '';
            
        } else if (tipoLowerExistente === 'institución' || tipoLowerExistente === 'institucion') {
            const campos = document.getElementById('campos_institucion');
            campos.style.display = 'block';
            
            document.getElementById('benef_inst_nombre').value = benef.detalles?.nombre_institucion || '';
            document.getElementById('benef_inst_tipo').value = benef.detalles?.tipo_institucion || '';
            document.getElementById('benef_inst_representante').value = benef.detalles?.representante_legal || '';
            document.getElementById('benef_inst_dpi_rep').value = benef.detalles?.dpi_representante || '';
            document.getElementById('benef_inst_telefono').value = benef.detalles?.telefono || '';
            document.getElementById('benef_inst_email').value = benef.detalles?.email || '';
            document.getElementById('benef_inst_num_beneficiarios').value = benef.detalles?.numero_beneficiarios_directos || '';
            
        } else if (tipoLowerExistente === 'otro') {
            const campos = document.getElementById('campos_otro');
            campos.style.display = 'block';

            document.getElementById('benef_otro_nombre').value = benef.detalles?.nombre || '';
            document.getElementById('benef_otro_tipo_desc').value = benef.detalles?.tipo_descripcion || '';
            document.getElementById('benef_otro_contacto').value = benef.detalles?.contacto || '';
            document.getElementById('benef_otro_telefono').value = benef.detalles?.telefono || '';
            document.getElementById('benef_otro_descripcion').value = benef.detalles?.descripcion || '';
        } else {
        }
    }
    
    function editarBeneficiarioNuevo(index) {
        const benef = beneficiariosNuevos[index];
        
        beneficiarioEnEdicion = { index: index, data: benef };
        
        // Abrir modal
        addBeneficiaryModal.style.display = 'flex';
        setTimeout(() => {
            addBeneficiaryModal.classList.add('show');
        }, 10);
        showBeneficiarySelectors();
        
        // Cambiar título y botón
        const modalTitle = document.querySelector('#addBeneficiaryModal .modal-title');
        if (modalTitle) modalTitle.textContent = 'Editar Beneficiario';
        if (saveBeneficiaryBtn) saveBeneficiaryBtn.textContent = 'Actualizar Beneficiario';
        
        // Pre-llenar formulario
        benefTipoSelect.value = benef.tipo;
        hideAllBeneficiaryFields();
        
        // Obtener IDs de región y comunidad del beneficiario nuevo
        const regionIdNuevo = benef.region_id || (benef.detalles && benef.detalles.region_id) || (benef.region && benef.region.id) || (benef.comunidad && benef.comunidad.region && benef.comunidad.region.id) || '';
        const comunidadIdNuevo = benef.comunidad_id || (benef.detalles && benef.detalles.comunidad_id) || (benef.comunidad && benef.comunidad.id) || '';

        // Renderizar opciones de región primero
        renderBeneficiaryRegionOptions(regionIdNuevo || '');
        
        // Esperar un momento para que se rendericen las opciones antes de establecer comunidad
        setTimeout(() => {
            // Renderizar opciones de comunidad con la región seleccionada
            renderBeneficiaryCommunityOptions(regionIdNuevo || '', comunidadIdNuevo || '');
            
            // Asegurar que los valores estén establecidos después de renderizar
            if (benefRegionSelect && regionIdNuevo) {
                benefRegionSelect.value = String(regionIdNuevo);
            }
            if (benefCommunitySelect && comunidadIdNuevo) {
                benefCommunitySelect.value = String(comunidadIdNuevo);
            }
        }, 50);
        
        const tipoLowerNuevo = (benef.tipo || '').toLowerCase();

        if (tipoLowerNuevo === 'individual') {
            document.getElementById('campos_individual').style.display = 'block';
            document.getElementById('benef_ind_nombre').value = benef.nombre || '';
            document.getElementById('benef_ind_apellido').value = benef.apellido || '';
            document.getElementById('benef_ind_dpi').value = benef.dpi || '';
            document.getElementById('benef_ind_fecha_nac').value = benef.fecha_nacimiento || '';
            document.getElementById('benef_ind_genero').value = benef.genero || '';
            document.getElementById('benef_ind_telefono').value = benef.telefono || '';
            
            // Actualizar edad si hay fecha de nacimiento
            setTimeout(() => {
                configurarSincronizacionFechaEdad();
                actualizarEdadDesdeFecha();
            }, 100);
        } else if (tipoLowerNuevo === 'familia') {
            document.getElementById('campos_familia').style.display = 'block';
            document.getElementById('benef_fam_nombre').value = benef.nombre_familia || '';
            document.getElementById('benef_fam_jefe').value = benef.jefe_familia || '';
            document.getElementById('benef_fam_dpi').value = benef.dpi_jefe_familia || '';
            document.getElementById('benef_fam_telefono').value = benef.telefono || '';
            document.getElementById('benef_fam_miembros').value = benef.numero_miembros || '';
        } else if (tipoLowerNuevo === 'institución' || tipoLowerNuevo === 'institucion') {
            document.getElementById('campos_institucion').style.display = 'block';
            document.getElementById('benef_inst_nombre').value = benef.nombre_institucion || '';
            document.getElementById('benef_inst_tipo').value = benef.tipo_institucion || '';
            document.getElementById('benef_inst_representante').value = benef.representante_legal || '';
            document.getElementById('benef_inst_dpi_rep').value = benef.dpi_representante || '';
            document.getElementById('benef_inst_telefono').value = benef.telefono || '';
            document.getElementById('benef_inst_email').value = benef.email || '';
            document.getElementById('benef_inst_num_beneficiarios').value = benef.numero_beneficiarios_directos || '';
        } else if (tipoLowerNuevo === 'otro') {
            document.getElementById('campos_otro').style.display = 'block';
            document.getElementById('benef_otro_nombre').value = benef.nombre || '';
            document.getElementById('benef_otro_tipo_desc').value = benef.tipo_descripcion || '';
            document.getElementById('benef_otro_contacto').value = benef.contacto || '';
            document.getElementById('benef_otro_telefono').value = benef.telefono || '';
            document.getElementById('benef_otro_descripcion').value = benef.descripcion || '';
        } else {
        }
    }
    
    function eliminarBeneficiarioExistente(benefId) {
        if (confirm('¿Estás seguro de que deseas eliminar este beneficiario del evento?')) {
            const index = beneficiariosExistentes.findIndex(b => b.id === benefId);
            if (index !== -1) {
                const benef = beneficiariosExistentes[index];
                beneficiariosExistentes.splice(index, 1);
                if (benef.esNuevoAsignado) {
                } else {
                    if (benefId) {
                        if (!beneficiariosEliminados.includes(benefId)) {
                            beneficiariosEliminados.push(benefId);
                        } else {
                        }
                    } else {
                    }
                }
                renderBeneficiariosExistentes();
                updateBeneficiariesCard();

                // Re-renderizar la lista de beneficiarios disponibles para permitir volver a agregarlos
                if (typeof buscarBeneficiarios === 'function') {
                    const currentQuery = benefSearchInput ? benefSearchInput.value.trim() : '';
                    buscarBeneficiarios(currentQuery);
                } else if (typeof renderBeneficiariosBusqueda === 'function') {
                    const currentQuery = benefSearchInput ? benefSearchInput.value.trim() : '';
                    renderBeneficiariosBusqueda(beneficiariosBusquedaResultados, currentQuery);
                }
            }
        }
    }
    
    // ===== PREVIEW DE ARCHIVOS (CON ACUMULACIÓN) =====
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const filesArray = Array.from(this.files);
            
            if (filesArray.length > 0) {
                // ACUMULAR archivos en lugar de reemplazar
                filesArray.forEach(file => {
                    // Verificar que no exista un archivo con el mismo nombre
                    const exists = accumulatedFiles.some(f => f.name === file.name && f.size === file.size);
                    if (!exists) {
                        accumulatedFiles.push(file);
                    } else {
                    }
                });
                
                // Actualizar preview (si estamos en modo edición, usar función especial)
                if (eventoEnEdicion) {
                    renderEvidenciasExistentes();
                } else {
                    updateFilePreview();
                }
                
                // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
                this.value = '';
            }
        });
    }
    
    // Prevenir que clicks en el preview disparen el label del input
    const filesSection = document.getElementById('filesSection');
    
    if (filePreview) {
        filePreview.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    if (filesSection) {
        filesSection.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    if (evidencesToggleBtn && evidencesWrapper) {
        evidencesToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleEvidencesList();
        });
    }
    
    // Función para actualizar el preview de archivos
    function updateFilePreview() {
        const fileCountDiv = document.getElementById('fileCount');
        const filesSection = document.getElementById('filesSection');
        filePreview.innerHTML = '';
        filePreview.classList.add('evidence-card-list');
        
        const totalFiles = accumulatedFiles.length;

        if (totalFiles > 0) {
            // Mostrar la sección de archivos
            if (filesSection) {
                filesSection.style.display = 'block';
            }
            
            // Mostrar contador
            if (fileCountDiv) {
                fileCountDiv.innerHTML = `${totalFiles} archivo${totalFiles > 1 ? 's' : ''}`;
            }
            
            accumulatedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'evidence-card';

                const extension = getFileExtension(file.name);
                const metaInfo = buildEvidenceMeta(
                    extension,
                    formatFileSize(file.size),
                    'Pendiente de carga'
                );
                const subtitle = getEvidenceSubtitle({ extension, isNew: true });

                fileItem.innerHTML = `
                    <div class="evidence-card-info">
                        <div class="evidence-card-details">
                            <div class="evidence-card-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                            ${subtitle ? `<div class="evidence-card-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                            ${metaInfo}
                        </div>
                    </div>
                    <div class="evidence-card-actions">
                        <button type="button" class="btn-evidence-card btn-evidence-card-view btn-view-file" data-index="${index}" title="Ver archivo">
                            Ver
                        </button>
                        <button type="button" class="btn-evidence-card btn-evidence-card-remove btn-remove-file" data-index="${index}" title="Eliminar archivo">
                            Eliminar
                        </button>
                    </div>
                `;

                filePreview.appendChild(fileItem);

                const viewBtn = fileItem.querySelector('.btn-view-file');
                if (viewBtn) {
                    viewBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const objectUrl = URL.createObjectURL(file);
                        window.open(objectUrl, '_blank', 'noopener');
                        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
                    });
                }

                const removeBtn = fileItem.querySelector('.btn-remove-file');
                removeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFile(index);
                });
            });
        } else {
            // Ocultar la sección si no hay archivos
            if (filesSection) {
                filesSection.style.display = 'none';
            }
            if (fileCountDiv) {
                fileCountDiv.innerHTML = '';
            }
        }
    }
    
    // Función para eliminar un archivo de la lista
    function removeFile(index) {
        const removedFile = accumulatedFiles[index];
        accumulatedFiles.splice(index, 1);
        
        // Si estamos en modo edición, usar función especial
        if (eventoEnEdicion) {
            renderEvidenciasExistentes();
        } else {
            updateFilePreview();
        }
    }
    
    // ===== ENVÍO DEL FORMULARIO =====
    if (eventForm) {
        eventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Detectar si estamos en modo edición
            if (eventoEnEdicion) {
                await actualizarEvento(eventoEnEdicion.id);
                return;
            }
            
            // Modo creación normal
            
            if (selectedCommunitiesList.length === 0) {
                mostrarMensaje('info', 'Selecciona al menos una comunidad para el evento.');
                return;
            }
            
            // Crear FormData
            const formData = new FormData(this);
            
            // ⚠️ IMPORTANTE: Eliminar el campo 'evidences' del FormData automático
            // porque solo captura un archivo, y agregarlo manualmente con todos los archivos
            formData.delete('evidences');
            
            // Agregar TODOS los archivos acumulados manualmente
            if (accumulatedFiles.length > 0) {
                const totalFiles = accumulatedFiles.length;
                
                accumulatedFiles.forEach((file, index) => {
                    formData.append('evidences', file);
                });
                
            } else {
            }
            
            // Agregar datos adicionales
            const comunidadPrincipal = selectedCommunitiesList[0];
            if (comunidadPrincipal && comunidadPrincipal.comunidad_id) {
                formData.append('comunidad_id', comunidadPrincipal.comunidad_id);
            }
            formData.append('comunidades_seleccionadas', JSON.stringify(selectedCommunitiesList));
            const personalPayload = selectedPersonnelList.map(p => {
                if (typeof p === 'object') {
                    return {
                        id: p.id,
                        tipo: p.tipo || 'colaborador',
                        rol: p.rol || 'Colaborador'
                    };
                }
                return { id: p, tipo: 'colaborador', rol: 'Colaborador' };
            });
            formData.append('personal_ids', JSON.stringify(personalPayload));
            formData.append('beneficiarios_nuevos', JSON.stringify(beneficiariosNuevos));
            if (beneficiariosExistentes.length > 0) {
                const beneficiariosExistentesIds = beneficiariosExistentes.map(b => b.id);
                formData.append('beneficiarios_existentes', JSON.stringify(beneficiariosExistentesIds));
            }
            if (beneficiariosModificados.length > 0) {
                formData.append('beneficiarios_modificados', JSON.stringify(beneficiariosModificados));
            }
            
            // Agregar tarjetas de datos (solo nuevas al crear)
            if (projectDataNew.length > 0) {
                const payloadNuevas = projectDataNew.map(item => ({
                    titulo: item.titulo,
                    valor: item.valor,
                    icono: item.icono || null
                }));
                formData.append('tarjetas_datos_nuevas', JSON.stringify(payloadNuevas));
            }
            
            if (coverImageFile) {
                formData.append('portada_evento', coverImageFile);
            }
            
            // Obtener CSRF token
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            try {
                // Enviar datos a la API
                const response = await fetch('/api/evento/crear/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': csrftoken
                    }
                });
                
                const data = await response.json();

                if (response.ok && data.success) {
                    
                    // Guardar ID del evento creado
                    const eventoIdCreado = data.id || data.evento_id;
                    if (eventoIdCreado) {
                        // Si hay beneficiarios pendientes de Excel, guardarlos automáticamente
                        if (beneficiariosPendientesExcel.length > 0) {
                            try {
                                const responseBenef = await fetch('/api/beneficiarios/guardar-pendientes/', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': getCookie('csrftoken')
                                    },
                                    body: JSON.stringify({
                                        actividad_id: eventoIdCreado,
                                        beneficiarios_pendientes: beneficiariosPendientesExcel
                                    })
                                });
                                
                                const dataBenef = await responseBenef.json();
                                if (dataBenef.success) {
                                    beneficiariosPendientesExcel = [];
                                    actualizarContadorPendientes();
                                }
                            } catch (error) {
                            }
                        }
                    }
                    
                    // Mostrar mensaje de éxito con información de archivos
                    let mensaje = data.message || 'Evento creado exitosamente';
                    if (data.total_archivos > 0) {
                        mensaje += ` (${data.total_archivos} archivo${data.total_archivos > 1 ? 's' : ''} guardado${data.total_archivos > 1 ? 's' : ''})`;
                    }
                    mostrarMensaje('success', mensaje);
                    
                    // Limpiar formulario
                    eventForm.reset();
                    selectedPersonnelList = [];
                    selectedCommunitiesList = [];
                    beneficiariosNuevos = []; // Limpiar beneficiarios
                    beneficiariosExistentes = [];
                    beneficiariosExistentesOriginales = [];
                    beneficiariosModificados = [];
                    beneficiariosEliminados = [];
                    accumulatedFiles = []; // Limpiar archivos acumulados
                    updateFilePreview(); // Actualizar preview vacío
                    renderBeneficiariosExistentes(); // Actualizar vista de beneficiarios
                    resetQuickDataState(); // Limpiar tarjetas de datos
                    resetCoverSelection();
                    
                    // Limpiar beneficiarios pendientes de Excel
                    beneficiariosPendientesExcel = [];
                    actualizarContadorPendientes();
                    
                    // Volver a la vista principal
                    setTimeout(() => {
                        showMainView();
                    }, 2000);
                    
                } else {
                    mostrarMensaje('error', data.error || 'Error al crear el evento');
                }
                
            } catch (error) {
                mostrarMensaje('error', 'Error de conexión. Por favor, intenta de nuevo.');
            }
        });
    }
    
    // ===== FUNCIÓN PARA MOSTRAR MENSAJES =====
    function mostrarMensaje(tipo, mensaje) {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-alert message-${tipo}`;
        messageDiv.textContent = mensaje;
        
        let backgroundColor;
        switch(tipo) {
            case 'success':
                backgroundColor = '#4CAF50';
                break;
            case 'error':
                backgroundColor = '#f44336';
                break;
            case 'info':
                backgroundColor = '#2196F3';
                break;
            default:
                backgroundColor = '#6c757d';
        }
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background-color: ${backgroundColor};
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 5000);
    }
    
    // ===== GESTIÓN DE EVENTOS EXISTENTES =====
    let eventosData = [];
    let eventosDataOriginal = []; // Guardar la lista original para el filtrado
    
    // Cargar eventos cuando se abre la vista de gestión
    if (openManageEventBtn) {
        openManageEventBtn.addEventListener('click', showManageEventView);
    }
    
    async function cargarEventos() {
        try {
            const response = await fetch('/api/eventos/');
            
            if (!response.ok) {
                throw new Error('Error al cargar eventos');
            }
            
            const data = await response.json();
            
            if (data.success) {
                const eventosCargados = Array.isArray(data.eventos) ? data.eventos : [];
                eventosData = [...eventosCargados];
                eventosDataOriginal = [...eventosCargados]; // Guardar copia original
                renderEventos();
            } else {
                mostrarMensaje('error', 'Error al cargar eventos');
            }
            
        } catch (error) {
            mostrarMensaje('error', 'Error al cargar eventos');
        }
    }
    
    function renderEventos(eventosAFiltrar = null) {
        const eventsList = document.getElementById('eventsList');
        
        if (!eventsList) return;
        
        // Usar eventos filtrados si se proporcionan, sino usar eventosData
        const fuenteEventos = eventosAFiltrar !== null ? eventosAFiltrar : eventosData;
        const eventosParaRenderizar = Array.isArray(fuenteEventos) ? [...fuenteEventos] : [];

        if (lastEditedEventId) {
            const idx = eventosParaRenderizar.findIndex(evento => String(evento.id) === String(lastEditedEventId));
            if (idx > 0) {
                const [eventoDestacado] = eventosParaRenderizar.splice(idx, 1);
                eventosParaRenderizar.unshift(eventoDestacado);
            }
        }
        
        if (eventosParaRenderizar.length === 0) {
            eventsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    <p style="font-size: 1.1rem; margin: 0;">No hay eventos creados aún</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Crea tu primer evento desde la opción "Crear Evento"</p>
                </div>
            `;
            return;
        }
        
        eventsList.innerHTML = '';
        
        eventosParaRenderizar.forEach(evento => {
            const estadoColor = {
                'planificado': '#ffc107',
                'en_progreso': '#17a2b8',
                'completado': '#28a745',
                'cancelado': '#dc3545'
            }[evento.estado] || '#6c757d';
            
            // Función para formatear el estado: reemplazar guiones bajos con espacios y capitalizar
            const formatearEstado = (estado) => {
                if (!estado) return '';
                return estado.split('_').map(palabra => 
                    palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
                ).join(' ');
            };
            
            const estadoFormateado = formatearEstado(evento.estado);
            
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 16px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);';
            
            eventItem.innerHTML = `
                <div class="event-info" style="flex: 1;">
                    <h3 class="event-name" style="margin: 0 0 8px 0; font-size: 1.2rem; color: #b8c5d1;">${evento.nombre}</h3>
                    <p class="event-type" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Tipo:</strong> ${evento.tipo}
                    </p>
                    <p class="event-communities" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Comunidades:</strong> ${evento.comunidades_resumen || evento.comunidad || 'Sin comunidades'}
                     </p>
                    <p class="event-personnel" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Personal:</strong> ${evento.personal_nombres} (${evento.personal_count})
                    </p>
                    <p class="event-beneficiaries" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Beneficiarios:</strong> ${evento.beneficiarios_count}
                    </p>
                    <p class="event-date" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Fecha:</strong> ${evento.fecha} | <strong>Estado:</strong> <span style="color: ${estadoColor}; font-weight: 600;">${estadoFormateado}</span>
                    </p>
                    <p class="event-created" style="margin: 4px 0; color: #6c757d; font-size: 0.85rem;">
                        Creado: ${evento.creado_en}
                    </p>
                </div>
                <div class="event-actions" style="display: flex; gap: 8px; flex-direction: column; min-width: 120px;">
                    <button type="button" class="btn-edit-event" data-event-id="${evento.id}" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                    </button>
                    <button type="button" class="btn-delete-event-item" data-event-id="${evento.id}" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar
                    </button>
                </div>
            `;
            
            eventsList.appendChild(eventItem);
            
            // Agregar eventos de click
            const editBtn = eventItem.querySelector('.btn-edit-event');
            const deleteBtn = eventItem.querySelector('.btn-delete-event-item');
            
            editBtn.addEventListener('click', function() {
                const eventoId = this.getAttribute('data-event-id');
                cargarEventoParaEditar(eventoId);
            });
            
            deleteBtn.addEventListener('click', function() {
                const eventoId = this.getAttribute('data-event-id');
                confirmarEliminarEvento(eventoId);
            });
        });
    }
    
    // Función para filtrar eventos por nombre
    function filtrarEventosPorNombre(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            eventosData = [...eventosDataOriginal];
            renderEventos();
            return;
        }
        
        const terminoBusqueda = searchTerm.toLowerCase().trim();
        const eventosFiltrados = eventosDataOriginal.filter(evento => {
            const nombreEvento = (evento.nombre || '').toLowerCase();
            return nombreEvento.includes(terminoBusqueda);
        });
        
        eventosData = [...eventosFiltrados];
        renderEventos();
    }
    
    // Event listeners para el buscador de eventos
    const eventSearchInput = document.getElementById('eventSearchInput');
    const eventSearchClearBtn = document.getElementById('eventSearchClearBtn');
    
    if (eventSearchInput) {
        eventSearchInput.addEventListener('input', function() {
            const searchTerm = this.value;
            
            // Mostrar/ocultar botón de limpiar
            if (searchTerm.trim() !== '') {
                if (eventSearchClearBtn) {
                    eventSearchClearBtn.style.display = 'flex';
                }
            } else {
                if (eventSearchClearBtn) {
                    eventSearchClearBtn.style.display = 'none';
                }
            }
            
            // Filtrar eventos
            filtrarEventosPorNombre(searchTerm);
        });
    }
    
    if (eventSearchClearBtn) {
        eventSearchClearBtn.addEventListener('click', function() {
            if (eventSearchInput) {
                eventSearchInput.value = '';
                this.style.display = 'none';
                filtrarEventosPorNombre('');
            }
        });
    }
    
    // Variable global para guardar el ID del evento a eliminar
    let eventoIdParaEliminar = null;
    
    function confirmarEliminarEvento(eventoId) {
        const evento = eventosData.find(e => e.id === eventoId);
        
        if (!evento) {
            mostrarMensaje('error', 'Evento no encontrado');
            return;
        }
        
        // Guardar el ID del evento
        eventoIdParaEliminar = eventoId;
        
        // Mostrar el nombre del evento en el modal
        document.getElementById('deleteEventName').textContent = evento.nombre;
        
        // Limpiar el formulario y restablecer estado
        resetDeleteModalState();
        
        // Mostrar el modal
        const modal = document.getElementById('confirmDeleteModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
    
    async function eliminarEvento(eventoId) {
        try {
            
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            const response = await fetch(`/api/evento/${eventoId}/eliminar/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrftoken
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                mostrarMensaje('success', 'Evento eliminado exitosamente');
                
                if (lastEditedEventId && String(eventoId) === String(lastEditedEventId)) {
                    lastEditedEventId = null;
                    sessionStorage.removeItem('lastEditedEventId');
                }
                
                // Recargar la lista de eventos y cambios recientes
                cargarEventos();
                cargarCambiosRecientes();
            } else {
                mostrarMensaje('error', data.error || 'Error al eliminar el evento');
            }
            
        } catch (error) {
            mostrarMensaje('error', 'Error al eliminar el evento');
        }
    }
    
    // ===== EDICIÓN DE EVENTOS =====
    async function cargarEventoParaEditar(eventoId) {
        try {
            
            const response = await fetch(`/api/evento/${eventoId}/`);
            
            if (!response.ok) {
                throw new Error('Error al cargar evento');
            }
            
            const data = await response.json();
            
            if (data.success) {
                eventoEnEdicion = data.evento;
                lastEditedEventId = String(data.evento.id || eventoId);
                sessionStorage.setItem('lastEditedEventId', lastEditedEventId);
                showCreateEventView(true);
                prellenarFormularioConEvento(data.evento);
                mostrarMensaje('info', 'Editando evento: ' + data.evento.nombre);
            } else {
                mostrarMensaje('error', 'Error al cargar evento');
            }
            
        } catch (error) {
            mostrarMensaje('error', 'Error al cargar evento');
        }
    }
    
    // Guardar referencia a la función para uso en checkHashAndShowView
    cargarEventoDesdeHash = cargarEventoParaEditar;
    
    // AHORA ejecutar checkHashAndShowView después de que cargarEventoParaEditar esté definida
    setTimeout(() => {
        checkHashAndShowView();
    }, 100);
    
    function prellenarFormularioConEvento(evento) {
        
        // Cambiar título del formulario
        const formTitle = document.querySelector('.view-title');
        if (formTitle) {
            formTitle.textContent = 'Editar Evento';
        }
        
        // Cambiar texto del botón submit
        const submitBtn = document.querySelector('.btn-create-event');
        if (submitBtn) {
            submitBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Actualizar Evento
            `;
        }
        
        // Campos básicos - CORREGIDO: usar IDs correctos del HTML
        const eventNameField = document.getElementById('eventName');
        const eventTypeField = document.getElementById('eventType');
        const fechaField = document.getElementById('fecha');
        const estadoField = document.getElementById('estado');
        const eventDescField = document.getElementById('eventDescription');
        if (eventNameField) eventNameField.value = evento.nombre || '';
        if (eventTypeField) eventTypeField.value = evento.tipo_id || '';
        if (fechaField) fechaField.value = evento.fecha || '';
        if (estadoField) estadoField.value = evento.estado || 'planificado';
        if (eventDescField) eventDescField.value = evento.descripcion || '';
        
        // Pre-seleccionar personal (asegurar que los IDs sean strings para comparación)
        selectedPersonnelList = (evento.personal || []).map(p => ({
            id: String(p.id), // Convertir a string para comparación consistente
            username: p.username || '',
            nombre: p.nombre || p.username || '',
            rol: p.rol || 'Colaborador',
            tipo: p.tipo || 'colaborador'
        }));
        
        // Re-renderizar personal con checkboxes marcados
        // Asegurar que el personal esté cargado antes de renderizar
        if (personalList.length > 0) {
            renderPersonalList();
        } else {
            // Si aún no se ha cargado el personal, cargar datos primero
            setTimeout(async () => {
                await cargarDatos();
                // Esperar un poco más para asegurar que personalList esté poblado
                setTimeout(() => {
                    renderPersonalList();
                }, 50);
            }, 100);
        }
        
        // Cargar beneficiarios existentes (editables)
        beneficiariosExistentes = (evento.beneficiarios || []).map(benef => {
            // Obtener comunidad_id desde múltiples fuentes posibles
            const comunidadId = benef.comunidad_id 
                ? String(benef.comunidad_id) 
                : (benef.detalles && benef.detalles.comunidad_id 
                    ? String(benef.detalles.comunidad_id) 
                    : (benef.comunidad && benef.comunidad.id 
                        ? String(benef.comunidad.id) 
                        : null));
            
            // Obtener region_id desde múltiples fuentes posibles
            const regionId = benef.region_id 
                ? String(benef.region_id) 
                : (benef.detalles && benef.detalles.region_id 
                    ? String(benef.detalles.region_id) 
                    : (benef.region && benef.region.id 
                        ? String(benef.region.id) 
                        : (benef.comunidad && benef.comunidad.region && benef.comunidad.region.id 
                            ? String(benef.comunidad.region.id) 
                            : null)));
            const regionCodigo = benef.region_codigo
                || (benef.detalles && benef.detalles.region_codigo)
                || (benef.region && benef.region.codigo)
                || (benef.comunidad && benef.comunidad.region && benef.comunidad.region.codigo)
                || '';
            const comunidadCodigo = benef.comunidad_codigo
                || (benef.detalles && benef.detalles.comunidad_codigo)
                || (benef.comunidad && benef.comunidad.codigo)
                || '';
            
            return {
                id: benef.id,
                tipo: benef.tipo,
                tipo_display: benef.tipo_display || benef.tipo,
                display_name: benef.detalles?.display_name || benef.nombre,
                detalles: benef.detalles || {},
                comunidad_id: comunidadId,
                comunidad_codigo: comunidadCodigo,
                comunidad_nombre: benef.comunidad_nombre 
                    || (benef.detalles ? benef.detalles.comunidad_nombre : null)
                    || (benef.comunidad && benef.comunidad.nombre ? benef.comunidad.nombre : null),
                region_id: regionId,
                region_codigo: regionCodigo,
                region_nombre: benef.region_nombre 
                    || (benef.detalles ? benef.detalles.region_nombre : null)
                    || (benef.region && benef.region.nombre ? benef.region.nombre : null)
                    || (benef.comunidad && benef.comunidad.region && benef.comunidad.region.nombre ? benef.comunidad.region.nombre : null),
                region_sede: benef.region_sede 
                    || (benef.detalles ? benef.detalles.region_sede : null)
                    || (benef.region && benef.region.comunidad_sede ? benef.region.comunidad_sede : null),
                comunidad: benef.comunidad || null, // Guardar objeto completo para referencia
                region: benef.region || null, // Guardar objeto completo para referencia
                info_adicional: benef.info_adicional || '',
                esNuevoAsignado: false,
                modificado: false
            };
        });
        beneficiariosExistentesOriginales = beneficiariosExistentes.map(b => b.id);
        beneficiariosEliminados = []; // Array para rastrear beneficiarios a eliminar
        
        selectedCommunitiesList = (evento.comunidades || []).map(com => ({
            comunidad_id: com.comunidad_id,
            comunidad_nombre: com.comunidad_nombre,
            region_id: com.region_id || null,
            region_nombre: com.region_nombre || '',
            region_sede: com.region_sede || '',
            agregado_en: com.agregado_en || com.creado_en || null
        }));

        projectDataExisting = (evento.tarjetas_datos || []).map((card, index) => ({
            id: card.id,
            titulo: card.titulo,
            valor: card.valor,
            icono: card.icono,
            orden: typeof card.orden === 'number' ? card.orden : index,
            isAutoGenerated: card.titulo === 'Beneficiarios' && card.icono === '👨‍👩‍👧‍👦'
        }));
        projectDataNew = [];
        projectDataUpdated = [];
        projectDataDeleted = [];
        
        // Verificar si ya existe una tarjeta de Beneficiarios en los datos existentes
        const existingBeneficiariesCard = projectDataExisting.find(card => 
            card.titulo === 'Beneficiarios' && card.icono === '👨‍👩‍👧‍👦'
        );
        if (existingBeneficiariesCard) {
            beneficiariesCardId = existingBeneficiariesCard.id;
        }
        
        renderProjectDataCards();

        if (selectedCommunitiesList.length === 0 && evento.comunidad_id) {
            const comunidadFallback = comunidadesList.find(c => c.id === evento.comunidad_id);
            selectedCommunitiesList = [{
                comunidad_id: evento.comunidad_id,
                comunidad_nombre: comunidadFallback ? comunidadFallback.nombre : 'Comunidad principal',
                region_id: comunidadFallback && comunidadFallback.region ? comunidadFallback.region.id : null,
                region_nombre: comunidadFallback && comunidadFallback.region ? comunidadFallback.region.nombre : '',
                region_sede: ''
            }];
        }

        renderSelectedCommunities();

        coverImageFile = null;
        coverImageRemoved = false;
        coverImageData = evento.portada || null;
        renderCoverPreview();
 
        // Actualizar tarjeta de Beneficiarios automática al cargar evento
        updateBeneficiariesCard();
        
        if (beneficiariosExistentes.length > 0) {
            renderBeneficiariosExistentes();
        } else {
            const benefContainer = document.getElementById('beneficiariesContainer');
            if (benefContainer) {
                benefContainer.innerHTML = `
                    <p style="color: #6c757d; font-style: italic; text-align: center; padding: 20px 0;">
                        No hay beneficiarios asociados. Usa el botón "Agregar Beneficiario" para registrar uno.
                    </p>
                `;
            }
        }
        
        // Mostrar evidencias existentes (almacenarlas en variable para mantener referencia)
        evidenciasExistentes = (evento.evidencias || []).filter(e => {
            const url = e.url || e.url_almacenamiento || '';
            const lower = url.toLowerCase();
            if (!lower) return false;
            // Incluir solo archivos guardados como evidencias reales
            if (lower.includes('/media/evidencias/')) {
                return true;
            }
            // Excluir rutas de galería o cambios si vienen en el payload
            if (lower.includes('/media/galeria_img/')) {
                return false;
            }
            if (lower.includes('/media/eventos_portada_img/')) {
                return false;
            }
            // Resto: incluir solo si el backend marca explicitamente es_evidencia true
            return e.es_evidencia === true;
        });
        evidenciasEliminadas = [];
        renderEvidenciasExistentes();
        
        // Limpiar archivo seleccionado
        const fileInput = document.getElementById('evidences');
        if (fileInput) {
            fileInput.value = '';
        }
        accumulatedFiles = [];
        
    }
    
    // Función para obtener el icono según el tipo de archivo
    function getFileIconFromType(fileType, fileName) {
        if (!fileType && fileName) {
            const extension = fileName.split('.').pop()?.toLowerCase() || '';
            const extensionMap = {
                'pdf': '📄',
                'doc': '📝',
                'docx': '📝',
                'xls': '📊',
                'xlsx': '📊',
                'ppt': '📋',
                'pptx': '📋',
                'txt': '📄',
                'jpg': '🖼️',
                'jpeg': '🖼️',
                'png': '🖼️',
                'gif': '🖼️',
                'bmp': '🖼️',
                'svg': '🖼️',
                'webp': '🖼️',
                'zip': '📦',
                'rar': '📦',
                '7z': '📦',
                'mp4': '🎥',
                'avi': '🎥',
                'mov': '🎥',
                'mp3': '🎵',
                'wav': '🎵'
            };
            return extensionMap[extension] || '📁';
        }
        
        if (fileType) {
            if (fileType.startsWith('image/')) {
                return '🖼️';
            } else if (fileType === 'application/pdf') {
                return '📄';
            } else if (fileType.includes('word') || fileType.includes('document')) {
                return '📝';
            } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
                return '📊';
            } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
                return '📋';
            } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) {
                return '📦';
            } else if (fileType.startsWith('video/')) {
                return '🎥';
            } else if (fileType.startsWith('audio/')) {
                return '🎵';
            }
        }
        
        return '📁';
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        const div = document.createElement('div');
        div.textContent = String(value);
        return div.innerHTML;
    }

    function getFileExtension(fileName) {
        if (!fileName || typeof fileName !== 'string') return '';
        const parts = fileName.split('.');
        if (parts.length < 2) return '';
        const ext = parts.pop();
        return ext ? ext.toUpperCase() : '';
    }

    function formatFileSize(bytes) {
        if (!bytes || isNaN(bytes)) return '';
        const value = Number(bytes);
        if (value <= 0) return '';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
        const formatted = (value / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1);
        return `${formatted} ${units[exponent]}`;
    }

    function buildEvidenceMeta(...metaParts) {
        const parts = metaParts.filter(Boolean).map(part => escapeHtml(part));
        if (!parts.length) {
            return '';
        }
        return `
            <div class="evidence-card-meta">
                ${parts.map((part, index) => {
                    const isLast = index === parts.length - 1;
                    const classes = ['evidence-card-meta-text'];
                    if (index === 0) {
                        classes.push('evidence-card-badge');
                    }
                    return `<span class="${classes.join(' ').trim()}">${part}</span>${!isLast ? '<span class="evidence-card-meta-divider">•</span>' : ''}`;
                }).join('')}
            </div>
        `;
    }

    function formatEvidenceDate(dateValue) {
        if (!dateValue) return '';
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return '';
        try {
            const formatted = parsed.toLocaleDateString('es-GT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            return `Agregada el ${formatted}`;
        } catch (error) {
            return '';
        }
    }

    function getEvidenceSubtitle(options = {}) {
        const { tipo, extension, isNew } = options;
        if (isNew) {
            return 'Evidencia nueva';
        }
        if (tipo) {
            const text = String(tipo);
            if (text.includes('/')) {
                const normalized = text.split('/').pop().replace(/[._-]+/g, ' ');
                return normalized.toUpperCase();
            }
            return text.toUpperCase();
        }
        if (extension) {
            return String(extension).toUpperCase();
        }
        return '';
    }
    
    // Renderizar evidencias existentes en modo edición
    function renderEvidenciasExistentes() {
        const filesSection = document.getElementById('filesSection');
        const filePreview = document.getElementById('filePreview');
        const fileCount = document.getElementById('fileCount');
        
        if (!filesSection || !filePreview || !fileCount) return;

        filesSection.style.display = 'block';
        filePreview.innerHTML = '';
        filePreview.classList.add('evidence-card-list');
        
        let totalArchivos = 0;
        
        // Mostrar evidencias existentes
        if (evidenciasExistentes.length > 0) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'evidence-header evidence-header-current';
            headerDiv.innerHTML = '<p class="evidence-header-text evidence-header-text-current">📁 ' + evidenciasExistentes.length + ' evidencias actuales</p>';
            filePreview.appendChild(headerDiv);
            
            evidenciasExistentes.forEach((evidencia, index) => {
                
                const fileItem = document.createElement('div');
                fileItem.className = 'evidence-card';
                
                // Usar archivo_nombre si nombre no existe (compatibilidad con backend)
                const nombreArchivo = evidencia.nombre || evidencia.archivo_nombre || 'Archivo sin nombre';
                const tipoArchivo = evidencia.tipo || evidencia.archivo_tipo || '';
                const urlArchivo = evidencia.url || evidencia.url_almacenamiento || '#';
                const tamanioArchivo = evidencia.tamanio || evidencia.archivo_tamanio || evidencia.size || '';
                const extension = getFileExtension(nombreArchivo);
                const fechaLabel = formatEvidenceDate(
                    evidencia.creado_en ||
                    evidencia.actualizado_en ||
                    evidencia.fecha ||
                    evidencia.fecha_creado ||
                    evidencia.fecha_modificado
                );
                const metaInfo = buildEvidenceMeta(
                    extension,
                    formatFileSize(tamanioArchivo),
                    fechaLabel
                );
                const subtitle = getEvidenceSubtitle({ tipo: tipoArchivo, extension });

                fileItem.innerHTML = `
                    <div class="evidence-card-info">
                        <div class="evidence-card-details">
                            <div class="evidence-card-name" title="${escapeHtml(nombreArchivo)}">${escapeHtml(nombreArchivo)}</div>
                            ${subtitle ? `<div class="evidence-card-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                            ${metaInfo}
                        </div>
                    </div>
                    <div class="evidence-card-actions">
                        <a href="${urlArchivo}" target="_blank" rel="noopener noreferrer" class="btn-evidence-card btn-evidence-card-view">Ver</a>
                        <button type="button" class="btn-evidence-card btn-evidence-card-remove btn-remove-evidencia-existente" data-evidencia-id="${evidencia.id}">Eliminar</button>
                    </div>
                `;
                
                filePreview.appendChild(fileItem);
                
                // Agregar event listener al botón de eliminar
                const removeBtn = fileItem.querySelector('.btn-remove-evidencia-existente');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        eliminarEvidenciaExistente(this.getAttribute('data-evidencia-id'));
                    });
                }
            });
            
            totalArchivos += evidenciasExistentes.length;
        }
        
        // Mostrar evidencias nuevas (acumuladas)
        if (accumulatedFiles.length > 0) {
            const newHeaderDiv = document.createElement('div');
            newHeaderDiv.className = 'evidence-header evidence-header-new';
            newHeaderDiv.innerHTML = '<p class="evidence-header-text evidence-header-text-new">➕ ' + accumulatedFiles.length + ' nuevas evidencias (se subirán al guardar)</p>';
            filePreview.appendChild(newHeaderDiv);
            
            accumulatedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'evidence-card';
                
                const extension = getFileExtension(file.name);
                const metaInfo = buildEvidenceMeta(
                    extension,
                    formatFileSize(file.size),
                    'Pendiente de carga'
                );
                const subtitle = getEvidenceSubtitle({ extension, isNew: true });
                
                fileItem.innerHTML = `
                    <div class="evidence-card-info">
                        <div class="evidence-card-details">
                            <div class="evidence-card-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                            ${subtitle ? `<div class="evidence-card-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                            ${metaInfo}
                        </div>
                    </div>
                    <div class="evidence-card-actions">
                        <button type="button" class="btn-evidence-card btn-evidence-card-view btn-view-file" data-index="${index}">Ver</button>
                        <button type="button" class="btn-evidence-card btn-evidence-card-remove btn-cover-remove" data-index="${index}">Eliminar</button>
                    </div>
                `;
                
                filePreview.appendChild(fileItem);
                
                const viewBtn = fileItem.querySelector('.btn-view-file');
                if (viewBtn) {
                    viewBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const objectUrl = URL.createObjectURL(file);
                        window.open(objectUrl, '_blank', 'noopener');
                        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
                    });
                }
                
                const removeBtn = fileItem.querySelector('.btn-cover-remove');
                removeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const idx = parseInt(this.getAttribute('data-index'));
                    removeFile(idx);
                });
            });
            
            totalArchivos += accumulatedFiles.length;
        }
        
        // Actualizar contador
        fileCount.textContent = totalArchivos + ' archivo' + (totalArchivos !== 1 ? 's' : '');
        
        // Si no hay archivos, ocultar sección
        if (totalArchivos === 0) {
            filesSection.style.display = 'none';
        }
    }
    
    function eliminarEvidenciaExistente(evidenciaId) {
        if (confirm('┬┐Estás seguro de que deseas eliminar esta evidencia?')) {
            const index = evidenciasExistentes.findIndex(e => e.id === evidenciaId);
            if (index !== -1) {
                evidenciasExistentes.splice(index, 1);
                evidenciasEliminadas.push(evidenciaId);
                renderEvidenciasExistentes();
            }
        }
    }
    
    async function actualizarEvento(eventoId) {
        try {
            
            if (selectedCommunitiesList.length === 0) {
                mostrarMensaje('info', 'Selecciona al menos una comunidad para el evento.');
                return;
            }
            
            const formData = new FormData();
            
            // Campos básicos - CORREGIDO: usar IDs correctos del HTML
            formData.append('nombre', document.getElementById('eventName').value);
            formData.append('tipo_actividad_id', document.getElementById('eventType').value);
            const comunidadPrincipal = selectedCommunitiesList[0];
            if (comunidadPrincipal && comunidadPrincipal.comunidad_id) {
                formData.append('comunidad_id', comunidadPrincipal.comunidad_id);
            }
            formData.append('comunidades_seleccionadas', JSON.stringify(selectedCommunitiesList));
            formData.append('fecha', document.getElementById('fecha').value);
            formData.append('estado', document.getElementById('estado').value);
            formData.append('descripcion', document.getElementById('eventDescription').value);
            
            if (coverImageFile) {
                formData.append('portada_evento', coverImageFile);
            }
            if (coverImageRemoved && !coverImageFile) {
                formData.append('portada_eliminar', 'true');
            }
            
            // Personal (JSON) - extraer IDs si son objetos y formatear correctamente
            if (selectedPersonnelList.length > 0) {
                const personal_ids = selectedPersonnelList.map(p => {
                    if (typeof p === 'object') {
                        return {
                            id: p.id,
                            tipo: p.tipo || 'colaborador',
                            rol: p.rol || 'Colaborador'
                        };
                    } else {
                        // Si es solo un ID, buscar en personalList para obtener tipo
                        const persona = personalList.find(pl => String(pl.id) === String(p));
                        return {
                            id: String(p),
                            tipo: persona ? (persona.tipo || 'colaborador') : 'colaborador',
                            rol: 'Colaborador'
                        };
                    }
                });
                formData.append('personal_ids', JSON.stringify(personal_ids));
            }
            
            // Beneficiarios nuevos (si hay)
            if (beneficiariosNuevos.length > 0) {
                formData.append('beneficiarios_nuevos', JSON.stringify(beneficiariosNuevos));
            }
            
            const beneficiariosParaAgregar = beneficiariosExistentes
                .filter(benef => benef.esNuevoAsignado || !beneficiariosExistentesOriginales.includes(benef.id))
                .map(benef => benef.id);
            if (beneficiariosParaAgregar.length > 0) {
                formData.append('beneficiarios_existentes_agregar', JSON.stringify(beneficiariosParaAgregar));
            }
             
            // Beneficiarios a eliminar (si hay)
            if (beneficiariosEliminados.length > 0) {
                formData.append('beneficiarios_eliminados', JSON.stringify(beneficiariosEliminados));
            }
            
            // Beneficiarios modificados (si hay)
            if (beneficiariosModificados.length > 0) {
                formData.append('beneficiarios_modificados', JSON.stringify(beneficiariosModificados));
            }
            
            if (projectDataNew.length > 0) {
                const payloadNuevas = projectDataNew.map(item => ({
                    titulo: item.titulo,
                    valor: item.valor,
                    icono: item.icono || null
                }));
                formData.append('tarjetas_datos_nuevas', JSON.stringify(payloadNuevas));
            }

            if (projectDataUpdated.length > 0) {
                formData.append('tarjetas_datos_actualizadas', JSON.stringify(projectDataUpdated));
            }

            if (projectDataDeleted.length > 0) {
                formData.append('tarjetas_datos_eliminadas', JSON.stringify(projectDataDeleted));
            }
            
            // Evidencias a eliminar (si hay)
            if (evidenciasEliminadas.length > 0) {
                formData.append('evidencias_eliminadas', JSON.stringify(evidenciasEliminadas));
            }
            
            // Evidencias nuevas
            if (accumulatedFiles.length > 0) {
                accumulatedFiles.forEach(file => {
                    formData.append('evidencias_nuevas', file);
                });
            }
            
            // CSRF token
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            const response = await fetch(`/api/evento/${eventoId}/actualizar/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken
                },
                body: formData
            });
            
        const data = await response.json();
            
            if (response.ok && data.success) {
                lastEditedEventId = String(eventoId);
                sessionStorage.setItem('lastEditedEventId', lastEditedEventId);
                mostrarMensaje('success', data.message || 'Evento actualizado exitosamente');
                
                // Resetear modo edición
                eventoEnEdicion = null;
                beneficiariosExistentes = [];
                beneficiariosEliminados = [];
                beneficiariosModificados = [];
                evidenciasExistentes = [];
                evidenciasEliminadas = [];
                
                // Resetear formulario
                eventForm.reset();
                selectedPersonnelList = [];
                beneficiariosNuevos = [];
                accumulatedFiles = [];
                renderBeneficiariosExistentes();
                updateFilePreview();
                
                // Restaurar título y botón
                const formTitle = document.querySelector('.view-title');
                if (formTitle) {
                    formTitle.textContent = 'Crear Nuevo Evento';
                }
                
                const submitBtn = document.querySelector('.btn-create-event');
                if (submitBtn) {
                    submitBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Crear Evento
                    `;
                }
                
                // Volver a la lista de eventos
                setTimeout(() => {
                    showManageEventView();
                    cargarEventos();
                    cargarCambiosRecientes();
                }, 1500);
                
            } else {
                mostrarMensaje('error', data.error || 'Error al actualizar el evento');
            }
            
        } catch (error) {
            mostrarMensaje('error', 'Error al actualizar el evento');
        }
    }
    
    // Cancelar edición al volver
    
    // ===== CARGAR CAMBIOS RECIENTES =====
    async function cargarCambiosRecientes() {
        try {
            
            const response = await fetch('/api/cambios-recientes/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                renderCambiosRecientes(data.cambios);
            } else {
                mostrarErrorCambios('No se pudieron cargar los cambios recientes');
            }
            
        } catch (error) {
            mostrarErrorCambios('Error de conexión al cargar cambios');
        }
    }
    
    // Función para crear descripción corta
    function crearDescripcionCorta(descripcionCompleta) {
        if (!descripcionCompleta) return 'Sin descripción';
        
        // Limitar a 80 caracteres y agregar puntos suspensivos si es necesario
        if (descripcionCompleta.length <= 80) {
            return descripcionCompleta;
        }
        
        // Buscar el último espacio antes del límite para no cortar palabras
        const textoCortado = descripcionCompleta.substring(0, 80);
        const ultimoEspacio = textoCortado.lastIndexOf(' ');
        
        if (ultimoEspacio > 50) {
            return textoCortado.substring(0, ultimoEspacio) + '...';
        }
        
        return textoCortado + '...';
    }
    
    // Función para mostrar modal de detalles del cambio
    function mostrarDetallesCambio(cambio) {
        const modal = document.getElementById('changeDetailsModal');
        if (!modal) {
            return;
        }
        
        // Llenar el modal con los datos del cambio
        document.getElementById('changeDetailsTitle').textContent = cambio.actividad_nombre || 'Cambio';
        document.getElementById('changeDetailsDate').textContent = cambio.fecha || 'Sin fecha';
        document.getElementById('changeDetailsResponsible').textContent = cambio.responsable || 'Sistema';
        document.getElementById('changeDetailsDescription').textContent = cambio.descripcion || 'Sin descripción';
        
        // Mostrar u ocultar etiqueta de eliminado
        const eliminadoLabel = document.getElementById('changeDetailsEliminado');
        if (cambio.evento_eliminado) {
            eliminadoLabel.style.display = 'inline-block';
        } else {
            eliminadoLabel.style.display = 'none';
        }
        
        // Mostrar modal
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
    
    // Función para cerrar modal de detalles (disponible globalmente)
    window.cerrarDetallesCambio = function() {
        const modal = document.getElementById('changeDetailsModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };
    
    // Event listeners para cerrar modal de detalles
    document.addEventListener('DOMContentLoaded', function() {
        const changeDetailsModal = document.getElementById('changeDetailsModal');
        if (changeDetailsModal) {
            // Cerrar al hacer clic fuera del modal
            changeDetailsModal.addEventListener('click', function(e) {
                if (e.target === changeDetailsModal) {
                    window.cerrarDetallesCambio();
                }
            });
            
            // Cerrar con ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && changeDetailsModal.classList.contains('show')) {
                    window.cerrarDetallesCambio();
                }
            });
        }
    });
    
    function renderCambiosRecientes(cambios) {
        const changesLog = document.getElementById('changesLog');
        if (!changesLog) return;
        
        changesLog.innerHTML = '';
        
        if (cambios.length === 0) {
            changesLog.innerHTML = `
                <div class="change-item" style="text-align: center; color: #6c757d; padding: 30px; cursor: default;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 10px; opacity: 0.5;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <p>No hay cambios recientes</p>
                </div>
            `;
            return;
        }
        
        cambios.forEach(cambio => {
            const changeItem = document.createElement('div');
            changeItem.className = 'change-item';
            
            // Si el evento está eliminado, agregar clase especial
            if (cambio.evento_eliminado) {
                changeItem.classList.add('evento-eliminado');
            }
            
            // Guardar datos completos en el elemento para el modal
            changeItem.setAttribute('data-cambio-id', cambio.id);
            changeItem.setAttribute('data-cambio-completo', JSON.stringify(cambio));
            
            // Crear header con fecha y etiqueta (si está eliminado)
            const changeHeader = document.createElement('div');
            changeHeader.className = 'change-header';
            changeHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;';
            
            // Crear elemento de tiempo con icono
            const changeTime = document.createElement('div');
            changeTime.className = 'change-time';
            changeTime.style.cssText = 'display: flex; align-items: center; gap: 6px;';
            changeTime.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${cambio.fecha}</span>
            `;
            
            changeHeader.appendChild(changeTime);
            
            // Si está eliminado, agregar etiqueta mejorada
            if (cambio.evento_eliminado) {
                const labelEliminado = document.createElement('span');
                labelEliminado.className = 'label-eliminado';
                labelEliminado.textContent = 'ELIMINADO';
                changeHeader.appendChild(labelEliminado);
            }
            
            // Crear descripción corta
            const changeDesc = document.createElement('div');
            changeDesc.className = 'change-description';
            changeDesc.textContent = crearDescripcionCorta(cambio.descripcion);
            changeDesc.style.cssText = 'line-height: 1.5; font-size: 14px; color: var(--text-primary);';
            
            // Agregar indicador de que hay más información
            if (cambio.descripcion && cambio.descripcion.length > 80) {
                const verMas = document.createElement('span');
                verMas.textContent = ' (clic para ver más)';
                verMas.style.cssText = 'color: var(--text-accent); font-size: 0.85rem; font-style: italic;';
                changeDesc.appendChild(verMas);
            }
            
            changeItem.appendChild(changeHeader);
            changeItem.appendChild(changeDesc);
            
            // Agregar event listener para mostrar detalles
            changeItem.addEventListener('click', function() {
                mostrarDetallesCambio(cambio);
            });
            
            changesLog.appendChild(changeItem);
        });
    }
    
    function mostrarErrorCambios(mensaje) {
        const changesLog = document.getElementById('changesLog');
        if (!changesLog) return;
        
        changesLog.innerHTML = `
            <div class="change-item" style="text-align: center; color: #dc3545; padding: 20px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 10px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p>${mensaje}</p>
            </div>
        `;
    }
    
    // Llamar a cargar cambios recientes
    cargarCambiosRecientes();
    
    // ===== MANEJO DEL MODAL DE CONFIRMACIÓN DE ELIMINACIÓN =====
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const closeConfirmDeleteBtn = document.getElementById('closeConfirmDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const executeDeleteBtn = document.getElementById('executeDeleteBtn');
    const deleteErrorMessage = document.getElementById('deleteErrorMessage');
    const deleteUsernameInput = document.getElementById('delete_username');
    const deletePasswordInput = document.getElementById('delete_password');
    const executeDeleteBtnDefaultHTML = executeDeleteBtn ? executeDeleteBtn.innerHTML : '';

    function restoreDeleteButton() {
        if (!executeDeleteBtn) return;
        executeDeleteBtn.disabled = false;
        if (executeDeleteBtnDefaultHTML) {
            executeDeleteBtn.innerHTML = executeDeleteBtnDefaultHTML;
        } else {
            executeDeleteBtn.textContent = 'Eliminar Evento';
        }
    }

    function resetDeleteModalState({ clearInputs = true } = {}) {
        if (!executeDeleteBtn) return;
        restoreDeleteButton();

        if (deleteErrorMessage) {
            deleteErrorMessage.style.display = 'none';
            deleteErrorMessage.textContent = '';
        }

        if (clearInputs) {
            if (deleteUsernameInput) deleteUsernameInput.value = '';
            if (deletePasswordInput) deletePasswordInput.value = '';
        }
    }
    
    // Cerrar modal
    function cerrarModalEliminar() {
        confirmDeleteModal.classList.remove('show');
        setTimeout(() => {
            confirmDeleteModal.style.display = 'none';
            resetDeleteModalState();
        }, 300);
        eventoIdParaEliminar = null;
    }
    
    closeConfirmDeleteBtn.addEventListener('click', cerrarModalEliminar);
    cancelDeleteBtn.addEventListener('click', cerrarModalEliminar);
    
    // Click fuera del modal para cerrar
    confirmDeleteModal.addEventListener('click', (e) => {
        if (e.target === confirmDeleteModal) {
            cerrarModalEliminar();
        }
    });
    
    // Ejecutar eliminación con verificación de credenciales
    executeDeleteBtn.addEventListener('click', async () => {
        const username = deleteUsernameInput ? deleteUsernameInput.value.trim() : '';
        const password = deletePasswordInput ? deletePasswordInput.value : '';
        
        if (!username || !password) {
            if (deleteErrorMessage) {
                deleteErrorMessage.textContent = 'Por favor, ingresa tu usuario y contraseña.';
                deleteErrorMessage.style.display = 'block';
            }
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        executeDeleteBtn.disabled = true;
        executeDeleteBtn.textContent = 'Verificando...';
        
        try {
            // Primero verificar las credenciales
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            const verifyResponse = await fetch('/api/verificar-admin/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const verifyData = await verifyResponse.json();
            
            if (!verifyResponse.ok || !verifyData.success) {
                if (deleteErrorMessage) {
                    deleteErrorMessage.textContent = verifyData.error || 'Credenciales inválidas o no eres administrador.';
                    deleteErrorMessage.style.display = 'block';
                }
                restoreDeleteButton();
                return;
            }
            
            // Si las credenciales son válidas, proceder con la eliminación
            
            // Guardar el ID antes de cerrar el modal (ya que cerrarModalEliminar lo pone en null)
            const eventoId = eventoIdParaEliminar;
            cerrarModalEliminar();
            await eliminarEvento(eventoId);
            
        } catch (error) {
            if (deleteErrorMessage) {
                deleteErrorMessage.textContent = 'Error de conexión. Por favor, intenta de nuevo.';
                deleteErrorMessage.style.display = 'block';
            }
            restoreDeleteButton();
        }
    });

    // ===== DATOS RÁPIDOS DEL PROYECTO =====
    function generarTempId(prefix = 'tmp') {
        return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    }

    function resetQuickDataModal() {
        // Limpiar campos del formulario personalizado si existen
        const customIconEvent = document.getElementById('customIconEvent');
        const customLabelEvent = document.getElementById('customLabelEvent');
        const customValueEvent = document.getElementById('customValueEvent');
        if (customIconEvent) customIconEvent.value = '';
        if (customLabelEvent) customLabelEvent.value = '';
        if (customValueEvent) customValueEvent.value = '';
        quickDataEditing = null;
        const modalTitle = quickDataModal ? quickDataModal.querySelector('.modal-title') : null;
        if (modalTitle) modalTitle.textContent = 'Editar Datos del Proyecto';
        if (saveQuickDataBtn) saveQuickDataBtn.textContent = 'Guardar Cambios';
    }

    function closeQuickDataModalFn() {
        if (!quickDataModal) return;
        quickDataModal.classList.remove('show');
        setTimeout(() => {
            quickDataModal.style.display = 'none';
            resetQuickDataModal();
        }, 280);
    }

    // Función para cargar tarjetas predefinidas en el modal de eventos
    function loadPredefinedCardsEvent() {
        const grid = document.getElementById('predefinedCardsGridEvent');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const searchTerm = (document.getElementById('cardSearchEvent')?.value || '').toLowerCase();
        const categoryFilter = document.getElementById('categoryFilterEvent')?.value || '';
        
        predefinedCardsEvent.forEach(card => {
            // Filtrar por búsqueda y categoría
            const matchesSearch = !searchTerm || card.label.toLowerCase().includes(searchTerm) || card.category.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || card.category === categoryFilter;
            
            if (!matchesSearch || !matchesCategory) return;
            
            const cardElement = document.createElement('div');
            cardElement.className = 'predefined-card';
            cardElement.dataset.cardId = card.id;
            
            // Verificar si ya está seleccionada
            const isSelected = selectedCardsEvent.some(selected => 
                selected.predefinedCardId === card.id || 
                (selected.label === card.label && !selected.isCustom)
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
            
            cardElement.addEventListener('click', () => togglePredefinedCardEvent(card));
            grid.appendChild(cardElement);
        });
    }
    
    // Función para alternar selección de tarjeta predefinida en eventos
    function togglePredefinedCardEvent(card) {
        // Si es la tarjeta de Beneficiarios, no permitir agregarla manualmente
        if (card.id === 'beneficiaries') {
            mostrarMensaje('info', 'La tarjeta de Beneficiarios se crea automáticamente según la cantidad de beneficiarios agregados.');
            return;
        }
        
        const cardElement = document.querySelector(`#predefinedCardsGridEvent [data-card-id="${card.id}"]`);
        const existingIndex = selectedCardsEvent.findIndex(selected => 
            selected.predefinedCardId === card.id
        );
        
        if (existingIndex !== -1) {
            // Remover de seleccionadas
            selectedCardsEvent.splice(existingIndex, 1);
            if (cardElement) cardElement.classList.remove('selected');
        } else {
            // Verificar si ya existe una tarjeta con el mismo label
            const duplicateLabel = selectedCardsEvent.some(selected => selected.label === card.label);
            if (duplicateLabel) {
                mostrarMensaje('info', `Ya existe una tarjeta con el título "${card.label}"`);
                return;
            }
            
            // Agregar a seleccionadas
            selectedCardsEvent.push({
                tempId: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                predefinedCardId: card.id,
                icon: card.icon,
                label: card.label,
                value: '',
                isCustom: false
            });
            if (cardElement) cardElement.classList.add('selected');
        }
        
        loadSelectedCardsEvent();
    }
    
    // Función para cargar tarjetas seleccionadas en el modal de eventos
    function loadSelectedCardsEvent() {
        const container = document.getElementById('selectedCardsContainerEvent');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (selectedCardsEvent.length === 0) {
            container.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No hay tarjetas seleccionadas. Selecciona tarjetas predefinidas o crea una personalizada.</p>';
            return;
        }
        
        selectedCardsEvent.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'selected-card';
            cardElement.dataset.index = index;
            
            const icon = card.icon || '📊';
            const label = (card.label || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const value = (card.value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            // Determinar si es la tarjeta de Beneficiarios automática
            // Verificar múltiples formas de identificar la tarjeta de Beneficiarios
            const isBeneficiariesCard = card.predefinedCardId === 'beneficiaries' 
                || card.isAutoGenerated 
                || beneficiariesCardId === card.tempId 
                || (card.label === 'Beneficiarios' && card.icon === '👨‍👩‍👧‍👦')
                || (card.existingId && beneficiariesCardId === card.existingId);
            const isReadOnly = isBeneficiariesCard; // Siempre readonly para Beneficiarios
            const isAdmin = isUserAdmin();
            
            // Solo mostrar botón de eliminar si:
            // - No es la tarjeta de Beneficiarios, O
            // - Es la tarjeta de Beneficiarios Y el usuario es admin
            const showDeleteButton = !isBeneficiariesCard || (isBeneficiariesCard && isAdmin);
            
            cardElement.innerHTML = `
                <div class="selected-card-icon">
                    <input type="text" value="${icon}" placeholder="📊" class="card-icon-input" data-index="${index}" maxlength="2" style="width: 40px; text-align: center; font-size: 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 4px; ${isReadOnly ? 'cursor: not-allowed; opacity: 0.7;' : ''}" ${isReadOnly ? 'readonly disabled' : ''}>
                </div>
                <div class="selected-card-info">
                    <div class="selected-card-label">
                        <input type="text" value="${label}" placeholder="Título de la tarjeta..." class="card-label-input" data-index="${index}" style="${isReadOnly ? 'cursor: not-allowed; opacity: 0.7;' : ''}" ${isReadOnly ? 'readonly disabled' : ''}>
                    </div>
                    <div class="selected-card-value">
                        <input type="text" value="${value}" placeholder="Ingresa el valor..." class="card-value-input" data-index="${index}" style="${isReadOnly ? 'cursor: not-allowed; opacity: 0.7;' : ''}" ${isReadOnly ? 'readonly disabled' : ''}>
                    </div>
                </div>
                ${showDeleteButton ? `<button class="remove-card-btn" data-index="${index}" data-is-beneficiaries="${isBeneficiariesCard}" title="Eliminar tarjeta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>` : ''}
            `;
            
            container.appendChild(cardElement);
        });
        
        // Agregar event listeners para inputs (solo si no son readonly)
        container.querySelectorAll('.card-icon-input').forEach(input => {
            // Prevenir cualquier edición si el campo es readonly o si es la tarjeta de Beneficiarios
            const index = parseInt(input.dataset.index);
            const card = selectedCardsEvent[index];
            const isBeneficiariesCard = card && (
                card.predefinedCardId === 'beneficiaries' 
                || card.isAutoGenerated 
                || beneficiariesCardId === card.tempId 
                || beneficiariesCardId === card.existingId
                || (card.label === 'Beneficiarios' && card.icon === '👨‍👩‍👧‍👦')
            );
            
            if (input.hasAttribute('readonly') || isBeneficiariesCard) {
                // Prevenir cualquier modificación
                input.addEventListener('input', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Restaurar valor original
                    input.value = card ? (card.icon || '📊') : '📊';
                });
                input.addEventListener('keydown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            } else {
                input.addEventListener('input', (e) => {
                    if (selectedCardsEvent[index]) {
                        selectedCardsEvent[index].icon = e.target.value || '📊';
                    }
                });
            }
        });
        
        container.querySelectorAll('.card-label-input').forEach(input => {
            // Prevenir cualquier edición si el campo es readonly o si es la tarjeta de Beneficiarios
            const index = parseInt(input.dataset.index);
            const card = selectedCardsEvent[index];
            const isBeneficiariesCard = card && (
                card.predefinedCardId === 'beneficiaries' 
                || card.isAutoGenerated 
                || beneficiariesCardId === card.tempId 
                || beneficiariesCardId === card.existingId
                || (card.label === 'Beneficiarios' && card.icon === '👨‍👩‍👧‍👦')
            );
            
            if (input.hasAttribute('readonly') || isBeneficiariesCard) {
                // Prevenir cualquier modificación
                input.addEventListener('input', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Restaurar valor original
                    input.value = card ? (card.label || '') : '';
                });
                input.addEventListener('keydown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            } else {
                input.addEventListener('input', (e) => {
                    if (selectedCardsEvent[index]) {
                        selectedCardsEvent[index].label = e.target.value;
                    }
                });
            }
        });
        
        container.querySelectorAll('.card-value-input').forEach(input => {
            // Prevenir cualquier edición si el campo es readonly o si es la tarjeta de Beneficiarios
            const index = parseInt(input.dataset.index);
            const card = selectedCardsEvent[index];
            const isBeneficiariesCard = card && (
                card.predefinedCardId === 'beneficiaries' 
                || card.isAutoGenerated 
                || beneficiariesCardId === card.tempId 
                || beneficiariesCardId === card.existingId
                || (card.label === 'Beneficiarios' && card.icon === '👨‍👩‍👧‍👦')
            );
            
            if (input.hasAttribute('readonly') || isBeneficiariesCard) {
                // Prevenir cualquier modificación
                input.addEventListener('input', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Restaurar valor original
                    input.value = card ? (card.value || '') : '';
                });
                input.addEventListener('keydown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            } else {
                input.addEventListener('input', (e) => {
                    if (selectedCardsEvent[index]) {
                        selectedCardsEvent[index].value = e.target.value;
                    }
                });
            }
        });
        
        // Agregar event listeners para botones de eliminar
        container.querySelectorAll('.remove-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const removeBtn = e.target.closest('.remove-card-btn');
                if (!removeBtn) return;
                
                const index = parseInt(removeBtn.dataset.index);
                const isBeneficiaries = removeBtn.dataset.isBeneficiaries === 'true';
                
                // Verificar la tarjeta en selectedCardsEvent
                const card = selectedCardsEvent[index];
                const isBeneficiariesCard = card && (
                    card.predefinedCardId === 'beneficiaries' 
                    || card.isAutoGenerated 
                    || beneficiariesCardId === card.tempId 
                    || beneficiariesCardId === card.existingId
                    || (card.label === 'Beneficiarios' && card.icon === '👨‍👩‍👧‍👦')
                );
                
                // Si es la tarjeta de Beneficiarios, verificar que sea admin
                if ((isBeneficiaries || isBeneficiariesCard) && !isUserAdmin()) {
                    mostrarMensaje('info', 'Solo los administradores pueden eliminar la tarjeta de Beneficiarios.');
                    return;
                }
                
                // Si es la tarjeta de Beneficiarios, limpiar el ID
                if (isBeneficiaries || isBeneficiariesCard) {
                    beneficiariesCardId = null;
                }
                
                selectedCardsEvent.splice(index, 1);
                loadSelectedCardsEvent();
                loadPredefinedCardsEvent();
            });
        });
    }
    
    // Función para actualizar la tarjeta de Beneficiarios automáticamente
    function updateBeneficiariesCard() {
        const totalBeneficiarios = (beneficiariosExistentes || []).length + (beneficiariosNuevos || []).length;
        
        if (totalBeneficiarios > 0) {
            // Buscar la tarjeta de Beneficiarios
            let beneficiariesCard = selectedCardsEvent.find(card => 
                card.predefinedCardId === 'beneficiaries' || beneficiariesCardId === card.tempId
            );
            
            if (!beneficiariesCard) {
                // Crear la tarjeta de Beneficiarios si no existe
                beneficiariesCard = {
                    tempId: 'beneficiaries_' + Date.now(),
                    predefinedCardId: 'beneficiaries',
                    icon: '👨‍👩‍👧‍👦',
                    label: 'Beneficiarios',
                    value: `${totalBeneficiarios}`, // Solo el número, sin texto adicional
                    isCustom: false,
                    isAutoGenerated: true
                };
                selectedCardsEvent.push(beneficiariesCard);
                beneficiariesCardId = beneficiariesCard.tempId;
            } else {
                // Actualizar el valor (solo el número)
                beneficiariesCard.value = `${totalBeneficiarios}`;
            }
            
            // Recargar las tarjetas seleccionadas si el modal está abierto
            const container = document.getElementById('selectedCardsContainerEvent');
            if (container && container.offsetParent !== null) {
                loadSelectedCardsEvent();
            }
        } else {
            // Eliminar la tarjeta si no hay beneficiarios
            const index = selectedCardsEvent.findIndex(card => 
                card.predefinedCardId === 'beneficiaries' || beneficiariesCardId === card.tempId
            );
            if (index !== -1) {
                selectedCardsEvent.splice(index, 1);
                beneficiariesCardId = null;
                
                // Recargar si el modal está abierto
                const container = document.getElementById('selectedCardsContainerEvent');
                if (container && container.offsetParent !== null) {
                    loadSelectedCardsEvent();
                }
            }
        }
        
        // Actualizar también en projectDataExisting o projectDataNew
        if (totalBeneficiarios > 0) {
            // Primero buscar en projectDataExisting (eventos existentes)
            const existingBeneficiariesCardInDB = projectDataExisting.find(card => 
                card.id === beneficiariesCardId || (card.titulo === 'Beneficiarios' && card.icono === '👨‍👩‍👧‍👦')
            );
            
            if (existingBeneficiariesCardInDB) {
                // Actualizar tarjeta existente en la base de datos (solo el número)
                existingBeneficiariesCardInDB.valor = `${totalBeneficiarios}`;
                existingBeneficiariesCardInDB.modificado = true;
                
                // Agregar a projectDataUpdated para que se guarde
                const updatePayload = {
                    id: existingBeneficiariesCardInDB.id,
                    titulo: existingBeneficiariesCardInDB.titulo,
                    valor: existingBeneficiariesCardInDB.valor,
                    icono: existingBeneficiariesCardInDB.icono
                };
                const idx = projectDataUpdated.findIndex(d => d.id === existingBeneficiariesCardInDB.id);
                if (idx === -1) {
                    projectDataUpdated.push(updatePayload);
                } else {
                    projectDataUpdated[idx] = updatePayload;
                }
            } else {
                // Buscar en projectDataNew (nuevas tarjetas)
                const existingBeneficiariesCardNew = projectDataNew.find(card => 
                    card.tempId === beneficiariesCardId || (card.titulo === 'Beneficiarios' && card.isAutoGenerated)
                );
                
                if (existingBeneficiariesCardNew) {
                    // Actualizar tarjeta nueva (solo el número)
                    existingBeneficiariesCardNew.valor = `${totalBeneficiarios}`;
                } else {
                    // Crear tarjeta en projectDataNew si no existe (solo el número)
                    const newCardId = beneficiariesCardId || ('beneficiaries_' + Date.now());
                    projectDataNew.push({
                        tempId: newCardId,
                        titulo: 'Beneficiarios',
                        valor: `${totalBeneficiarios}`, // Solo el número, sin texto adicional
                        icono: '👨‍👩‍👧‍👦',
                        isAutoGenerated: true
                    });
                    // Asegurar que el ID se guarde
                    if (!beneficiariesCardId) {
                        beneficiariesCardId = newCardId;
                    }
                }
            }
        } else {
            // Eliminar tarjeta si no hay beneficiarios
            // Primero buscar en projectDataExisting
            const indexExisting = projectDataExisting.findIndex(card => 
                card.id === beneficiariesCardId || (card.titulo === 'Beneficiarios' && card.icono === '👨‍👩‍👧‍👦')
            );
            if (indexExisting !== -1) {
                // Marcar para eliminar
                if (projectDataExisting[indexExisting].id) {
                    projectDataDeleted.push(projectDataExisting[indexExisting].id);
                }
            } else {
                // Buscar en projectDataNew
                const indexNew = projectDataNew.findIndex(card => 
                    card.tempId === beneficiariesCardId || (card.titulo === 'Beneficiarios' && card.isAutoGenerated)
                );
                if (indexNew !== -1) {
                    projectDataNew.splice(indexNew, 1);
                }
            }
            beneficiariesCardId = null;
        }
        
        renderProjectDataCards();
    }

    function openQuickDataModal(data = null, origen = 'nuevo', index = null) {
        if (!quickDataModal) return;
        
        // Cargar tarjetas seleccionadas desde projectDataExisting y projectDataNew
        selectedCardsEvent = [];
        
        // Cargar desde existentes
        projectDataExisting.forEach(item => {
            if (!projectDataDeleted.includes(item.id)) {
                const isBeneficiariesCard = (item.titulo === 'Beneficiarios' && item.icono === '👨‍👩‍👧‍👦') || item.isAutoGenerated;
                selectedCardsEvent.push({
                    tempId: item.id,
                    icon: item.icono || '📊',
                    label: item.titulo || '',
                    value: item.valor || '',
                    isCustom: true,
                    isExisting: true,
                    existingId: item.id,
                    predefinedCardId: isBeneficiariesCard ? 'beneficiaries' : null,
                    isAutoGenerated: isBeneficiariesCard
                });
                // Si es la tarjeta de Beneficiarios, asegurar que el ID esté configurado
                if (isBeneficiariesCard && !beneficiariesCardId) {
                    beneficiariesCardId = item.id;
                }
            }
        });
        
        // Cargar desde nuevas
        projectDataNew.forEach(item => {
            // Incluir todas las tarjetas, incluyendo la de Beneficiarios automática
            const isBeneficiariesCard = item.titulo === 'Beneficiarios' && item.icono === '👨‍👩‍👧‍👦';
            selectedCardsEvent.push({
                tempId: item.tempId,
                icon: item.icono || '📊',
                label: item.titulo || '',
                value: item.valor || '',
                isCustom: true,
                predefinedCardId: isBeneficiariesCard ? 'beneficiaries' : null,
                isAutoGenerated: isBeneficiariesCard
            });
            // Si es la tarjeta de Beneficiarios, actualizar el ID
            if (isBeneficiariesCard) {
                beneficiariesCardId = item.tempId;
            }
        });
        
        // Asegurar que la tarjeta de Beneficiarios esté presente si hay beneficiarios
        updateBeneficiariesCard();
        
        // Cargar tarjetas predefinidas y seleccionadas
        loadPredefinedCardsEvent();
        loadSelectedCardsEvent();
        
        // Configurar pestañas (solo una vez)
        if (!tabsInitialized) {
            const tabBtns = quickDataModal.querySelectorAll('.tab-btn');
            const tabContents = quickDataModal.querySelectorAll('.tab-content');
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    const predefinedTab = document.getElementById('predefined-tab-event');
                    const customTab = document.getElementById('custom-tab-event');
                    
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(t => t.classList.remove('active'));
                    btn.classList.add('active');
                    
                    if (tab === 'predefined') {
                        if (predefinedTab) predefinedTab.classList.add('active');
                    } else if (tab === 'custom') {
                        if (customTab) customTab.classList.add('active');
                    }
                });
            });
            
            tabsInitialized = true;
        }
        
        // Asegurar que solo la pestaña "predefined" esté activa al abrir
        const tabBtns = quickDataModal.querySelectorAll('.tab-btn');
        const tabContents = quickDataModal.querySelectorAll('.tab-content');
        const predefinedTab = document.getElementById('predefined-tab-event');
        const customTab = document.getElementById('custom-tab-event');
        
        tabContents.forEach(t => t.classList.remove('active'));
        tabBtns.forEach(btn => btn.classList.remove('active'));
        
        if (predefinedTab) predefinedTab.classList.add('active');
        const predefinedBtn = Array.from(tabBtns).find(btn => btn.dataset.tab === 'predefined');
        if (predefinedBtn) predefinedBtn.classList.add('active');
        
        // Configurar búsqueda y filtro
        const cardSearchEvent = document.getElementById('cardSearchEvent');
        const categoryFilterEvent = document.getElementById('categoryFilterEvent');
        
        if (cardSearchEvent) {
            cardSearchEvent.addEventListener('input', () => loadPredefinedCardsEvent());
        }
        
        if (categoryFilterEvent) {
            categoryFilterEvent.addEventListener('change', () => loadPredefinedCardsEvent());
        }
        
        // Configurar botón de tarjeta personalizada
        const addCustomCardBtnEvent = document.getElementById('addCustomCardBtnEvent');
        if (addCustomCardBtnEvent) {
            addCustomCardBtnEvent.onclick = () => {
                const icon = document.getElementById('customIconEvent')?.value.trim() || '📊';
                const label = document.getElementById('customLabelEvent')?.value.trim();
                const value = document.getElementById('customValueEvent')?.value.trim();
                
                if (!label) {
                    mostrarMensaje('info', 'Ingresa un título para la tarjeta.');
                    return;
                }
                
                // Verificar duplicados
                const duplicate = selectedCardsEvent.some(card => card.label === label);
                if (duplicate) {
                    mostrarMensaje('info', `Ya existe una tarjeta con el título "${label}"`);
                    return;
                }
                
                selectedCardsEvent.push({
                    tempId: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    icon: icon,
                    label: label,
                    value: value || '',
                    isCustom: true
                });
                
                document.getElementById('customIconEvent').value = '';
                document.getElementById('customLabelEvent').value = '';
                document.getElementById('customValueEvent').value = '';
                
                loadSelectedCardsEvent();
                loadPredefinedCardsEvent();
            };
        }

        quickDataModal.style.display = 'flex';
        setTimeout(() => quickDataModal.classList.add('show'), 20);
    }

    function renderProjectDataCards() {
        if (!quickDataContainer || !quickDataSection) return;

        const eliminadosSet = new Set(projectDataDeleted);
        const tarjetas = [];

        projectDataExisting.forEach((item, index) => {
            if (!item || !item.id || eliminadosSet.has(item.id)) return;
            tarjetas.push({ ...item, origen: 'existente', index });
        });

        projectDataNew.forEach((item, index) => {
            if (!item) return;
            tarjetas.push({ ...item, origen: 'nuevo', index });
        });

        if (tarjetas.length === 0) {
            quickDataSection.style.display = 'none';
            quickDataContainer.innerHTML = '';
            if (quickDataCount) quickDataCount.textContent = '';
            return;
        }

        quickDataSection.style.display = 'block';
        if (quickDataCount) {
            quickDataCount.textContent = tarjetas.length === 1 ? '1 dato' : `${tarjetas.length} datos`;
        }

        quickDataContainer.innerHTML = '';

        tarjetas.forEach(item => {
            const card = document.createElement('div');
            card.className = 'data-card';
            
            // Verificar si es la tarjeta de Beneficiarios automática
            const isBeneficiariesCard = item.isAutoGenerated || (item.titulo === 'Beneficiarios' && item.icono === '👨‍👩‍👧‍👦');
            const isAdmin = isUserAdmin();
            
            const badge = item.origen === 'nuevo'
                ? '<span class="card-badge" style="background: rgba(76,175,80,0.18); color: #4CAF50;">Nuevo</span>'
                : (item.modificado ? '<span class="card-badge" style="background: rgba(255,193,7,0.18); color: #FFC107;">Editado</span>' : '<span class="card-badge" style="background: rgba(148,163,184,0.18); color: #cbd5f5;">Registrado</span>');

            const iconDisplay = item.icono ? `<span class="card-icon-wrapper" style="font-size: 1.6rem; line-height: 1;">${item.icono}</span>` : '<span class="card-icon-wrapper" style="font-size: 1.6rem; line-height: 1;">📌</span>';
            
            const titulo = item.titulo || 'Sin título';
            const valor = item.valor || 'Sin valor';
            
            // Para la tarjeta de Beneficiarios: no mostrar botón de editar, solo eliminar si es admin
            let actionButtons = '';
            if (isBeneficiariesCard) {
                // Solo admin puede eliminar la tarjeta de Beneficiarios
                if (isAdmin) {
                    actionButtons = `
                        <button type="button" class="btn-quickdata-delete btn-danger" data-origen="${item.origen}" data-index="${item.index}" data-id="${item.id || ''}" data-is-beneficiaries="true" onclick="event.stopPropagation();">
                            <span style="font-size: 1rem;">✖</span> Eliminar
                        </button>
                    `;
                }
            } else {
                // Para otras tarjetas: mostrar editar y eliminar normalmente
                actionButtons = `
                    <button type="button" class="btn-quickdata-edit btn-primary" data-origen="${item.origen}" data-index="${item.index}" onclick="event.stopPropagation();">
                        <span style="font-size: 1rem;">✏️</span> Editar
                    </button>
                    <button type="button" class="btn-quickdata-delete btn-danger" data-origen="${item.origen}" data-index="${item.index}" data-id="${item.id || ''}" onclick="event.stopPropagation();">
                        <span style="font-size: 1rem;">✖</span> Quitar
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="card-content">
                    <div class="card-header">
                        ${iconDisplay}
                        <div class="card-fields">
                            <div class="card-field-row">
                                <div class="card-field">
                                    <span class="card-field-label">Título</span>
                                    <span class="card-field-value">${titulo}</span>
                                </div>
                                <div class="card-field">
                                    <span class="card-field-label">Valor / Descripción</span>
                                    <span class="card-field-value-secondary">${valor}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <div>
                            ${badge}
                            ${isBeneficiariesCard ? '<span class="card-badge" style="background: rgba(33,150,243,0.18); color: #2196F3; margin-left: 6px;">Automática</span>' : ''}
                        </div>
                        <div class="card-buttons">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            `;

            quickDataContainer.appendChild(card);
        });

        quickDataContainer.querySelectorAll('.btn-quickdata-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const origen = btn.getAttribute('data-origen');
                const index = parseInt(btn.getAttribute('data-index'), 10);
                
                let data = null;
                if (origen === 'existente') {
                    data = projectDataExisting[index];
                } else {
                    data = projectDataNew[index];
                }
                
                // Verificar si es la tarjeta de Beneficiarios y bloquear edición
                if (data && ((data.titulo === 'Beneficiarios' && data.icono === '👨‍👩‍👧‍👦') || data.isAutoGenerated)) {
                    mostrarMensaje('info', 'La tarjeta de Beneficiarios no se puede editar. Su valor se actualiza automáticamente.');
                    return;
                }
                
                if (data) {
                    openQuickDataModal(data, origen, index);
                }
            });
        });

        quickDataContainer.querySelectorAll('.btn-quickdata-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const origen = btn.getAttribute('data-origen');
                const index = parseInt(btn.getAttribute('data-index'), 10);
                const isBeneficiaries = btn.getAttribute('data-is-beneficiaries') === 'true';
                
                // Si es la tarjeta de Beneficiarios, verificar que sea admin
                if (isBeneficiaries && !isUserAdmin()) {
                    mostrarMensaje('info', 'Solo los administradores pueden eliminar la tarjeta de Beneficiarios.');
                    return;
                }
                
                if (origen === 'existente') {
                    const data = projectDataExisting[index];
                    if (data && data.id) {
                        // Si es la tarjeta de Beneficiarios, también limpiar el ID
                        if (isBeneficiaries) {
                            beneficiariesCardId = null;
                        }
                        if (!projectDataDeleted.includes(data.id)) {
                            projectDataDeleted.push(data.id);
                        }
                        projectDataUpdated = projectDataUpdated.filter(item => item.id !== data.id);
                    }
                } else {
                    const data = projectDataNew[index];
                    // Si es la tarjeta de Beneficiarios, limpiar el ID
                    if (isBeneficiaries || (data && data.isAutoGenerated)) {
                        beneficiariesCardId = null;
                    }
                    projectDataNew.splice(index, 1);
                }
                renderProjectDataCards();
            });
        });
    }

    if (addQuickDataBtn) {
        addQuickDataBtn.addEventListener('click', () => {
            openQuickDataModal();
        });
        addQuickDataBtn.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openQuickDataModal();
            }
        });
    }

    // Event listeners para cerrar modal (usando flags para evitar duplicados)
    if (closeQuickDataModal && !closeQuickDataModal.dataset.listenerAdded) {
        closeQuickDataModal.addEventListener('click', function(e) {
            e.stopPropagation();
            closeQuickDataModalFn();
        });
        closeQuickDataModal.dataset.listenerAdded = 'true';
    }

    if (cancelQuickDataBtn && !cancelQuickDataBtn.dataset.listenerAdded) {
        cancelQuickDataBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeQuickDataModalFn();
        });
        cancelQuickDataBtn.dataset.listenerAdded = 'true';
    }

    // Event listener para cerrar modal al hacer click fuera (usando delegación de eventos para evitar duplicados)
    if (quickDataModal && !quickDataModal.dataset.closeListenerAdded) {
        quickDataModal.addEventListener('click', function(evt) {
            if (evt.target === quickDataModal) {
                evt.stopPropagation();
                closeQuickDataModalFn();
            }
        });
        quickDataModal.dataset.closeListenerAdded = 'true';
    }

    // Event listener para guardar datos (usando flag para evitar duplicados)
    if (saveQuickDataBtn && !saveQuickDataBtn.dataset.listenerAdded) {
        saveQuickDataBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Guardar tarjetas seleccionadas
            // Separar tarjetas existentes de nuevas
            const tarjetasExistentesActualizadas = [];
            const tarjetasNuevas = [];
            
            selectedCardsEvent.forEach(card => {
                // No incluir la tarjeta de Beneficiarios automática aquí, se maneja por separado
                if (card.isAutoGenerated) return;
                
                if (card.isExisting && card.existingId) {
                    // Es una tarjeta existente
                    const existingItem = projectDataExisting.find(item => item.id === card.existingId);
                    if (existingItem) {
                        // Verificar si cambió
                        if (existingItem.titulo !== card.label || existingItem.valor !== card.value || existingItem.icono !== card.icon) {
                            existingItem.titulo = card.label;
                            existingItem.valor = card.value;
                            existingItem.icono = card.icon;
                            existingItem.modificado = true;
                            
                            const payload = {
                                id: existingItem.id,
                                titulo: card.label,
                                valor: card.value,
                                icono: card.icon
                            };
                            const idx = projectDataUpdated.findIndex(d => d.id === existingItem.id);
                            if (idx === -1) {
                                projectDataUpdated.push(payload);
                            } else {
                                projectDataUpdated[idx] = payload;
                            }
                        }
                    }
                } else {
                    // Es una tarjeta nueva
                    tarjetasNuevas.push({
                        tempId: card.tempId,
                        titulo: card.label,
                        valor: card.value,
                        icono: card.icon
                    });
                }
            });
            
            // Actualizar projectDataNew con las tarjetas nuevas (sin la de Beneficiarios automática por ahora)
            projectDataNew = tarjetasNuevas.filter(card => !card.isAutoGenerated);
            
            // Asegurar que la tarjeta de Beneficiarios esté presente y actualizada
            const totalBeneficiarios = (beneficiariosExistentes || []).length + (beneficiariosNuevos || []).length;
            if (totalBeneficiarios > 0) {
                // Buscar la tarjeta de Beneficiarios en projectDataExisting
                const existingBeneficiariesCardInDB = projectDataExisting.find(card => 
                    card.id === beneficiariesCardId || (card.titulo === 'Beneficiarios' && card.icono === '👨‍👩‍👧‍👦')
                );
                
                if (existingBeneficiariesCardInDB) {
                    // Actualizar tarjeta existente en la base de datos
                    existingBeneficiariesCardInDB.valor = `${totalBeneficiarios}`;
                    existingBeneficiariesCardInDB.modificado = true;
                    
                    // Agregar a projectDataUpdated para que se guarde
                    const updatePayload = {
                        id: existingBeneficiariesCardInDB.id,
                        titulo: existingBeneficiariesCardInDB.titulo,
                        valor: existingBeneficiariesCardInDB.valor,
                        icono: existingBeneficiariesCardInDB.icono
                    };
                    const idx = projectDataUpdated.findIndex(d => d.id === existingBeneficiariesCardInDB.id);
                    if (idx === -1) {
                        projectDataUpdated.push(updatePayload);
                    } else {
                        projectDataUpdated[idx] = updatePayload;
                    }
                } else {
                    // Buscar en projectDataNew
                    const existingBeneficiariesCardNew = projectDataNew.find(card => 
                        card.tempId === beneficiariesCardId || (card.titulo === 'Beneficiarios' && card.isAutoGenerated)
                    );
                    
                    if (existingBeneficiariesCardNew) {
                        // Actualizar tarjeta nueva
                        existingBeneficiariesCardNew.valor = `${totalBeneficiarios}`;
                    } else {
                        // Crear tarjeta nueva si no existe
                        const newCardId = beneficiariesCardId || ('beneficiaries_' + Date.now());
                        projectDataNew.push({
                            tempId: newCardId,
                            titulo: 'Beneficiarios',
                            valor: `${totalBeneficiarios}`, // Solo el número
                            icono: '👨‍👩‍👧‍👦',
                            isAutoGenerated: true
                        });
                        // Asegurar que el ID se guarde
                        if (!beneficiariesCardId) {
                            beneficiariesCardId = newCardId;
                        }
                    }
                }
            }

            renderProjectDataCards();
            closeQuickDataModalFn();
        });
        saveQuickDataBtn.dataset.listenerAdded = 'true';
    }

    renderProjectDataCards();

    if (benefRegionSelect) {
        renderBeneficiaryRegionOptions(benefRegionSelect.value || '');
    }
    if (benefCommunitySelect) {
        renderBeneficiaryCommunityOptions(benefRegionSelect ? benefRegionSelect.value : '', benefCommunitySelect.value || '');
    }

    resetBeneficiaryLocation();

    if (benefRegionSelect) {
        benefRegionSelect.addEventListener('change', event => {
            renderBeneficiaryCommunityOptions(event.target.value, '');
        });
    }

    if (benefCommunitySelect) {
        benefCommunitySelect.addEventListener('change', () => {
            // No action needed but anchoring event prevents errors if future logic requiere
        });
    }

    function renderBeneficiaryRegionOptions(selectedRegionId = '') {
        if (!benefRegionSelect) {
            return;
        }

        const options = ['<option value="">Seleccione una región</option>'];
        const regionesOrdenadas = [...regionesList].sort((a, b) => {
            const codeA = parseInt(a.codigo, 10);
            const codeB = parseInt(b.codigo, 10);
            const hasCodeA = !Number.isNaN(codeA);
            const hasCodeB = !Number.isNaN(codeB);
            if (hasCodeA && hasCodeB && codeA !== codeB) {
                return codeA - codeB;
            }
            if (hasCodeA && !hasCodeB) {
                return -1;
            }
            if (!hasCodeA && hasCodeB) {
                return 1;
            }
            const nombreA = (a.nombre || '').toString();
            const nombreB = (b.nombre || '').toString();
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base', numeric: true });
        });

        regionesOrdenadas.forEach(region => {
            const label = `${region.nombre || 'Región'}${region.comunidad_sede ? ` — ${region.comunidad_sede}` : ''}`;
            options.push(`<option value="${region.id}">${label}</option>`);
        });

        benefRegionSelect.innerHTML = options.join('');
        if (selectedRegionId) {
            // Intentar establecer el valor múltiples veces para asegurar que se establezca
            benefRegionSelect.value = String(selectedRegionId);
            // Verificar que el valor se estableció correctamente
            if (benefRegionSelect.value !== String(selectedRegionId)) {
                setTimeout(() => {
                    benefRegionSelect.value = String(selectedRegionId);
                    // Disparar evento change para actualizar comunidades si es necesario
                    const changeEvent = new Event('change', { bubbles: true });
                    benefRegionSelect.dispatchEvent(changeEvent);
                }, 10);
            } else {
            }
        }
    }

    function renderBeneficiaryCommunityOptions(regionId = '', selectedCommunityId = '') {
        if (!benefCommunitySelect) {
            return;
        }

        let comunidadesFiltradas = [...comunidadesList];
        if (regionId) {
            comunidadesFiltradas = comunidadesFiltradas.filter(c => c.region && String(c.region.id) === String(regionId));
        }

        comunidadesFiltradas.sort((a, b) => {
            const regionNombreA = a.region && a.region.nombre ? a.region.nombre.toLowerCase() : '';
            const regionNombreB = b.region && b.region.nombre ? b.region.nombre.toLowerCase() : '';
            const compareRegion = regionNombreA.localeCompare(regionNombreB, 'es', { sensitivity: 'base', numeric: true });
            if (compareRegion !== 0) return compareRegion;
            const nombreA = (a.nombre || '').toLowerCase();
            const nombreB = (b.nombre || '').toLowerCase();
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base', numeric: true });
        });

        const options = ['<option value="">Seleccione una comunidad</option>'];
        comunidadesFiltradas.forEach(comunidad => {
            const regionLabel = comunidad.region && comunidad.region.nombre ? comunidad.region.nombre : 'Sin región';
            options.push(`<option value="${comunidad.id}">${comunidad.nombre} — ${regionLabel}</option>`);
        });

        benefCommunitySelect.innerHTML = options.join('');
        if (selectedCommunityId) {
            // Intentar establecer el valor múltiples veces para asegurar que se establezca
            benefCommunitySelect.value = String(selectedCommunityId);
            // Verificar que el valor se estableció correctamente
            if (benefCommunitySelect.value !== String(selectedCommunityId)) {
                setTimeout(() => {
                    benefCommunitySelect.value = String(selectedCommunityId);
                }, 10);
            } else {
            }
        }
    }

    function resetBeneficiaryLocation() {
        if (!benefRegionSelect || !benefCommunitySelect) {
            return;
        }
        renderBeneficiaryRegionOptions('');
        renderBeneficiaryCommunityOptions('', '');
        benefRegionSelect.value = '';
        benefCommunitySelect.value = '';
        if (benefNuevoCatalogSearchInput) {
            benefNuevoCatalogSearchInput.value = '';
        }
        ocultarSugerenciasCatalogo('nuevo');
    }

    async function asegurarDatosRegionesComunidades() {
        if (regionesList.length > 0 && comunidadesList.length > 0) {
            reconstruirCatalogoBusquedaBeneficiarios();
            return;
        }
        try {
            if (comunidadesList.length === 0) {
                const responseComunidades = await fetch('/api/comunidades/');
                if (responseComunidades.ok) {
                    comunidadesList = await responseComunidades.json();
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
                }
            }
            reconstruirCatalogoBusquedaBeneficiarios();
            if (benefSearchCommunitySelect) {
                const regionActual = benefSearchRegionSelect ? benefSearchRegionSelect.value : '';
                const comunidadActual = benefSearchCommunitySelect.value || '';
                actualizarComunidadesFiltro(regionActual, comunidadActual);
            }
        } catch (error) {
        }
    }

    async function inicializarFiltrosBeneficiariosExistentes() {
        await asegurarDatosRegionesComunidades();

        if (!benefSearchRegionSelect || !benefSearchCommunitySelect || !benefSearchTipoSelect) {
            return;
        }

        reconstruirCatalogoBusquedaBeneficiarios();

        if (benefSearchRegionSelect.dataset.initialized === 'true') {
            benefSearchRegionSelect.value = '';
            actualizarComunidadesFiltro('');
            benefSearchCommunitySelect.value = '';
            benefSearchTipoSelect.value = '';
            return;
        }

        benefSearchRegionSelect.innerHTML = '<option value="">Todas las regiones</option>';
        regionesList.forEach(region => {
            const option = document.createElement('option');
            option.value = String(region.id);
            option.textContent = region.comunidad_sede
                ? `${region.nombre} — ${region.comunidad_sede}`
                : region.nombre;
            benefSearchRegionSelect.appendChild(option);
        });

        actualizarComunidadesFiltro('');
        reconstruirCatalogoBusquedaBeneficiarios();

        benefSearchRegionSelect.dataset.initialized = 'true';
        benefSearchCommunitySelect.dataset.initialized = 'true';
        benefSearchTipoSelect.dataset.initialized = 'true';

        benefSearchRegionSelect.addEventListener('change', () => {
            const regionId = benefSearchRegionSelect.value;
            actualizarComunidadesFiltro(regionId);
            ejecutarBusquedaBeneficiariosExistentes();
        });

        benefSearchCommunitySelect.addEventListener('change', () => {
            ejecutarBusquedaBeneficiariosExistentes();
        });

        benefSearchTipoSelect.addEventListener('change', () => {
            ejecutarBusquedaBeneficiariosExistentes();
        });
    }

    function actualizarComunidadesFiltro(regionId, selectedCommunityId = '') {
        if (!benefSearchCommunitySelect) return;

        benefSearchCommunitySelect.innerHTML = '<option value="">Todas las comunidades</option>';

        let comunidadesFiltradas = comunidadesList;
        if (regionId) {
            comunidadesFiltradas = comunidadesFiltradas.filter(comunidad => {
                if (!comunidad.region || comunidad.region.id === undefined || comunidad.region.id === null) {
                    return false;
                }
                return String(comunidad.region.id) === String(regionId);
            });
        }

        comunidadesFiltradas.sort((a, b) => {
            const nombreA = (a.nombre || '').toLowerCase();
            const nombreB = (b.nombre || '').toLowerCase();
            return nombreA.localeCompare(nombreB, 'es');
        });

        comunidadesFiltradas.forEach(comunidad => {
            const option = document.createElement('option');
            option.value = String(comunidad.id);
            option.textContent = comunidad.nombre || 'Comunidad';
            benefSearchCommunitySelect.appendChild(option);
        });

        if (selectedCommunityId) {
            const valueStr = String(selectedCommunityId);
            const optionExiste = Array.from(benefSearchCommunitySelect.options).some(opt => opt.value === valueStr);
            benefSearchCommunitySelect.value = optionExiste ? valueStr : '';
        } else {
            benefSearchCommunitySelect.value = '';
        }
    }

    function reconstruirCatalogoBusquedaBeneficiarios() {
        benefCatalogItems = [];
        Object.keys(benefCatalogStates).forEach(key => {
            const state = benefCatalogStates[key];
            if (state) {
                state.filtered = [];
                state.activeIndex = -1;
            }
            const ctx = getCatalogContext(key);
            if (ctx && ctx.suggestions) {
                ctx.suggestions.classList.remove('show');
                ctx.suggestions.innerHTML = '';
            }
        });

        regionesList.forEach(region => {
            if (!region || region.id == null) {
                return;
            }

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

        comunidadesList.forEach(comunidad => {
            if (!comunidad || comunidad.id == null) {
                return;
            }

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

    function getCatalogContext(contextKey = 'existente') {
        return benefCatalogContexts[contextKey] || benefCatalogContexts.existente;
    }

    function getCatalogState(contextKey = 'existente') {
        return benefCatalogStates[contextKey] || benefCatalogStates.existente;
    }

    function ocultarSugerenciasCatalogo(contextKey = 'existente') {
        if (contextKey === 'todos') {
            Object.keys(benefCatalogContexts).forEach(key => ocultarSugerenciasCatalogo(key));
            return;
        }

        const ctx = getCatalogContext(contextKey);
        const state = getCatalogState(contextKey);

        if (ctx && ctx.suggestions) {
            ctx.suggestions.classList.remove('show');
            ctx.suggestions.innerHTML = '';
        }

        if (ctx && ctx.clearBtn && ctx.input) {
            if (ctx.input.value.trim() !== '') {
            ctx.clearBtn.style.display = 'flex';
            } else {
            ctx.clearBtn.style.display = 'none';
            }
        }

        if (state) {
            state.filtered = [];
            state.activeIndex = -1;
        }
    }

    function mostrarSugerenciasCatalogo(term, contextKey = 'existente') {
        const ctx = getCatalogContext(contextKey);
        const state = getCatalogState(contextKey);

        if (!ctx || !ctx.suggestions || !state) return;

        const consulta = (term || '').trim().toLowerCase();
        ctx.suggestions.innerHTML = '';
        state.filtered = [];
        state.activeIndex = -1;

        if (consulta.length < 2) {
            ctx.suggestions.classList.remove('show');
            if (ctx.clearBtn) {
                ctx.clearBtn.style.display = consulta ? 'flex' : 'none';
            }
            return;
        }

        state.filtered = benefCatalogItems
            .filter(item => item.searchIndex.includes(consulta))
            .slice(0, 10);

        if (state.filtered.length === 0) {
            ctx.suggestions.classList.remove('show');
            if (ctx.clearBtn) {
                ctx.clearBtn.style.display = 'flex';
            }
            return;
        }

        const fragment = document.createDocumentFragment();
        state.filtered.forEach((item, index) => {
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
                seleccionarSugerenciaCatalogo(item, contextKey);
            });
            fragment.appendChild(li);
        });

        ctx.suggestions.appendChild(fragment);
        ctx.suggestions.classList.add('show');
        state.activeIndex = 0;
        const items = Array.from(ctx.suggestions.querySelectorAll('.input-suggestion-item'));
        if (items[0]) {
            items[0].classList.add('active');
        }

        if (ctx.clearBtn) {
            ctx.clearBtn.style.display = 'flex';
        }
    }

    function moverSeleccionCatalogo(direction, contextKey = 'existente') {
        const ctx = getCatalogContext(contextKey);
        const state = getCatalogState(contextKey);

        if (!ctx || !ctx.suggestions || !state || state.filtered.length === 0) {
            return;
        }

        const items = Array.from(ctx.suggestions.querySelectorAll('.input-suggestion-item'));
        if (items.length === 0) return;

        state.activeIndex += direction;
        if (state.activeIndex < 0) {
            state.activeIndex = items.length - 1;
        } else if (state.activeIndex >= items.length) {
            state.activeIndex = 0;
        }

        items.forEach(item => item.classList.remove('active'));
        const activeItem = items[state.activeIndex];
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }

    function seleccionarSugerenciaCatalogo(item, contextKey = 'existente') {
        if (!item) return;

        const ctx = getCatalogContext(contextKey);

        if (ctx && ctx.input) {
            ctx.input.value = item.label;
        }

        const regionSelect = ctx ? ctx.regionSelect : null;
        const communitySelect = ctx ? ctx.communitySelect : null;

        if (item.type === 'region') {
            if (regionSelect) {
                regionSelect.value = item.id;
            }
            if (contextKey === 'existente') {
                actualizarComunidadesFiltro(item.id, '');
            } else {
                renderBeneficiaryCommunityOptions(item.id, '');
            }
        } else if (item.type === 'community') {
            const regionId = item.regionId || '';
            if (regionSelect) {
                regionSelect.value = regionId;
            }
            if (contextKey === 'existente') {
                actualizarComunidadesFiltro(regionId, item.id);
            } else {
                renderBeneficiaryCommunityOptions(regionId, item.id);
            }
        }

        ocultarSugerenciasCatalogo(contextKey);

        if (ctx && typeof ctx.searchCallback === 'function') {
            ctx.searchCallback();
        }
    }

    function ejecutarBusquedaBeneficiariosExistentes() {
        const query = benefSearchInput ? benefSearchInput.value.trim() : '';
        buscarBeneficiarios(query);
    }

    async function obtenerBeneficiariosCatalogo() {
        if (beneficiariosCatalogo.length > 0) {
            return beneficiariosCatalogo;
        }
        if (beneficiariosCatalogoPromise) {
            return beneficiariosCatalogoPromise;
        }
        beneficiariosCatalogoPromise = fetch('/api/beneficiarios/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener beneficiarios');
                }
                return response.json();
            })
            .then(data => {
                beneficiariosCatalogo = Array.isArray(data) ? data : [];
                return beneficiariosCatalogo;
            })
            .catch(error => {
                beneficiariosCatalogo = [];
                return beneficiariosCatalogo;
            })
            .finally(() => {
                beneficiariosCatalogoPromise = null;
            });

        return beneficiariosCatalogoPromise;
    }

    // ===== FUNCIONES PARA MOSTRAR DETALLES DEL BENEFICIARIO =====

    /**
     * Función para obtener y mostrar los detalles completos de un beneficiario
     */
    async function mostrarDetallesBeneficiario(beneficiarioId) {
        if (!beneficiarioId) {
            return;
        }

        const modal = document.getElementById('beneficiaryDetailsModal');
        const contentContainer = document.getElementById('beneficiaryDetailsContent');

        if (!modal || !contentContainer) {
            return;
        }

        // Mostrar modal con estado de carga
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        contentContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
                <div style="margin-bottom: 16px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <p>Cargando detalles del beneficiario...</p>
            </div>
        `;

        try {
            const response = await fetch(`/api/beneficiario/${beneficiarioId}/`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al cargar los detalles del beneficiario');
            }

            const beneficiario = data.beneficiario;
            renderBeneficiaryDetailsTable(beneficiario);

        } catch (error) {
            contentContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <div style="margin-bottom: 16px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                    </div>
                    <p style="font-weight: 600; margin-bottom: 8px;">Error al cargar los detalles</p>
                    <p style="font-size: 0.9rem; color: #6c757d;">${error.message || 'No se pudieron cargar los detalles del beneficiario'}</p>
                </div>
            `;
        }
    }

    /**
     * Función para renderizar una tabla con todos los detalles del beneficiario
     */
    function renderBeneficiaryDetailsTable(beneficiario) {
        const contentContainer = document.getElementById('beneficiaryDetailsContent');
        if (!contentContainer) return;

        const tipoLower = (beneficiario.tipo || '').toLowerCase();
        let tipoIcon = '👤';
        if (tipoLower === 'familia') tipoIcon = '👨‍👩‍👧‍👦';
        else if (tipoLower === 'institución' || tipoLower === 'institucion') tipoIcon = '🏢';
        else if (tipoLower === 'otro') tipoIcon = '📋';

        const detalles = beneficiario.detalles || {};
        let tablaHTML = '';

        // Determinar qué campos mostrar según el tipo
        if (tipoLower === 'individual') {
            tablaHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Nombre</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.nombre || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Apellido</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.apellido || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">DPI</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.dpi || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Fecha de Nacimiento</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.fecha_nacimiento || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Género</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.genero ? detalles.genero.charAt(0).toUpperCase() + detalles.genero.slice(1) : 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Teléfono</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.telefono || 'N/A'}</td>
                    </tr>
                </table>
            `;
        } else if (tipoLower === 'familia') {
            tablaHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Nombre de la Familia</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.nombre_familia || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Jefe de Familia</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.jefe_familia || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">DPI del Jefe de Familia</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.dpi_jefe_familia || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Teléfono</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.telefono || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Número de Miembros</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.numero_miembros || 'N/A'}</td>
                    </tr>
                </table>
            `;
        } else if (tipoLower === 'institución' || tipoLower === 'institucion') {
            tablaHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Nombre de la Institución</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.nombre_institucion || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Tipo de Institución</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.tipo_institucion ? detalles.tipo_institucion.charAt(0).toUpperCase() + detalles.tipo_institucion.slice(1) : 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Representante Legal</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.representante_legal || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">DPI del Representante</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.dpi_representante || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Teléfono</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.telefono || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Email</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.email || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Número de Beneficiarios Directos</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.numero_beneficiarios_directos || 'N/A'}</td>
                    </tr>
                </table>
            `;
        } else {
            // Tipo "otro"
            tablaHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Nombre/Descripción</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.nombre || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Tipo/Descripción</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.tipo_descripcion || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Contacto</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.contacto || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Teléfono</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${detalles.telefono || 'N/A'}</td>
                    </tr>
                </table>
            `;
        }

        // Información común a todos los tipos
        const infoComunHTML = `
            <div style="background: rgba(13, 110, 253, 0.1); border-left: 4px solid #0d6efd; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <span style="font-size: 2rem;">${tipoIcon}</span>
                    <div>
                        <h3 style="margin: 0; color: #f5f7fa; font-size: 1.25rem; font-weight: 600;">${beneficiario.display_name || beneficiario.nombre || 'Beneficiario'}</h3>
                        <p style="margin: 4px 0 0 0; color: #b8c5d1; font-size: 0.9rem; text-transform: capitalize;">${beneficiario.tipo_display || beneficiario.tipo || 'Sin tipo'}</p>
                    </div>
                </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <div style="background: rgba(255, 255, 255, 0.05); padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="margin: 0; color: #f5f7fa; font-size: 1rem; font-weight: 600;">Información General</h4>
                </div>
                ${tablaHTML}
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <div style="background: rgba(255, 255, 255, 0.05); padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="margin: 0; color: #f5f7fa; font-size: 1rem; font-weight: 600;">Ubicación</h4>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Comunidad</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${beneficiario.comunidad_nombre || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Región</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${beneficiario.region_nombre || 'N/A'}</td>
                    </tr>
                    ${beneficiario.region_sede ? `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Sede de la Región</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${beneficiario.region_sede}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            ${beneficiario.creado_en || beneficiario.actualizado_en ? `
            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; overflow: hidden;">
                <div style="background: rgba(255, 255, 255, 0.05); padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="margin: 0; color: #f5f7fa; font-size: 1rem; font-weight: 600;">Información del Sistema</h4>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    ${beneficiario.creado_en ? `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Fecha de Creación</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${new Date(beneficiario.creado_en).toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' })}</td>
                    </tr>
                    ` : ''}
                    ${beneficiario.actualizado_en ? `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 12px 16px; font-weight: 600; color: #b8c5d1; width: 40%; vertical-align: top;">Última Actualización</td>
                        <td style="padding: 12px 16px; color: #f5f7fa;">${new Date(beneficiario.actualizado_en).toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' })}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            ` : ''}
        `;

        contentContainer.innerHTML = infoComunHTML;
    }

    // Event listeners para el modal de detalles del beneficiario
    const closeBeneficiaryDetailsModal = document.getElementById('closeBeneficiaryDetailsModal');
    const closeBeneficiaryDetailsBtn = document.getElementById('closeBeneficiaryDetailsBtn');

    function cerrarModalDetallesBeneficiario() {
        const modal = document.getElementById('beneficiaryDetailsModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    if (closeBeneficiaryDetailsModal) {
        closeBeneficiaryDetailsModal.addEventListener('click', cerrarModalDetallesBeneficiario);
    }

    if (closeBeneficiaryDetailsBtn) {
        closeBeneficiaryDetailsBtn.addEventListener('click', cerrarModalDetallesBeneficiario);
    }

    // Cerrar modal al hacer clic fuera de él
    const beneficiaryDetailsModal = document.getElementById('beneficiaryDetailsModal');
    if (beneficiaryDetailsModal) {
        beneficiaryDetailsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModalDetallesBeneficiario();
            }
        });
    }
    
    // Escuchar cambios en el hash para navegación del navegador (atrás/adelante)
    window.addEventListener('hashchange', function() {
        const newHash = window.location.hash;
        
        // Extraer parámetros del hash (ej: #createEventView&evento=123)
        let eventoId = null;
        let hashBasico = newHash;
        if (newHash.includes('&evento=')) {
            const partes = newHash.split('&evento=');
            hashBasico = partes[0]; // Solo el hash sin parámetros
            eventoId = partes[1]; // ID del evento
        }
        
        if (hashBasico === '#createEventView') {
            // Si hay un eventoId en el hash, cargar el evento directamente sin mostrar vistas intermedias
            if (eventoId) {
                // NO mostrar ninguna vista todavía - solo cargar el evento directamente
                const cargarFuncion = cargarEventoDesdeHash || cargarEventoParaEditar;
                if (typeof cargarFuncion === 'function') {
                    cargarFuncion(eventoId);
                } else {
                    setTimeout(() => {
                        const cargarFuncionRetry = cargarEventoDesdeHash || cargarEventoParaEditar;
                        if (typeof cargarFuncionRetry === 'function') {
                            cargarFuncionRetry(eventoId);
                        }
                    }, 1500);
                }
            } else {
                showCreateEventView(false);
            }
        } else if (hashBasico === '#manageEventView') {
            showManageEventView();
        } else if (newHash === '' || newHash === '#') {
            showMainView();
        }
    });
    
    // ===== GESTIÓN DE IMPORTACIÓN EXCEL GENERAL (FUERA DE EVENTOS) =====
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
                
                // Mostrar resultados (misma lógica que el modal de eventos)
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
                
                // Mostrar advertencias y errores (misma lógica)
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
    
    // =====================================================
    // LAZY LOADING DE IMÁGENES (Optimización de rendimiento)
    // =====================================================
    
    /**
     * Implementa lazy loading para imágenes usando Intersection Observer
     * Carga las imágenes solo cuando están a punto de ser visibles en el viewport
     */
    function initLazyLoading() {
        // Verificar si el navegador soporta IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            // Fallback: cargar todas las imágenes inmediatamente
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
            return;
        }
        
        // Configurar el observer
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Cargar la imagen
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        
                        // Opcional: agregar clase para animación de fade-in
                        img.classList.add('lazy-loaded');
                    }
                    
                    // Dejar de observar esta imagen
                    observer.unobserve(img);
                }
            });
        }, {
            // Cargar imágenes 200px antes de que sean visibles
            rootMargin: '200px 0px',
            threshold: 0.01
        });
        
        // Observar todas las imágenes con data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    /**
     * Convierte imágenes existentes a lazy loading
     * Útil para contenido dinámico cargado después del DOM
     */
    function convertToLazyLoad(container) {
        if (!container) return;
        
        const images = container.querySelectorAll('img:not([data-src])');
        images.forEach(img => {
            if (img.src && !img.dataset.src) {
                img.dataset.src = img.src;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ECargando...%3C/text%3E%3C/svg%3E';
            }
        });
        
        initLazyLoading();
    }
    
    // Inicializar lazy loading al cargar la página
    initLazyLoading();
    
    // Exportar funciones para uso en otras partes del código
    window.initLazyLoading = initLazyLoading;
    window.convertToLazyLoad = convertToLazyLoad;
    
});
