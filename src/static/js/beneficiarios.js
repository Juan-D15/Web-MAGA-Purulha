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
    evento: [],
    soloConHabilidades: false
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
    
    // Obtener todas las vistas posibles
    const allViews = [
        'mainView',
        'addBeneficiaryView',
        'listBeneficiariesView',
        'comparisonsReportsView',
        'generateComparisonView',
        'comparisonResultsView'
    ];
    
    // Ocultar todas las vistas primero
    allViews.forEach(viewId => {
        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            viewElement.style.display = 'none';
        }
    });
    
    // Mostrar la vista seleccionada
    const targetView = document.getElementById(viewName);
    if (!targetView) {
        console.error('Vista no encontrada:', viewName);
        // Si no se encuentra la vista, mostrar la principal como fallback
        const mainView = document.getElementById('mainView');
        if (mainView) {
            mainView.style.display = 'block';
            mainView.style.animation = 'slideInFromRight 0.4s ease-out';
            currentView = 'mainView';
        }
        return;
    }
    
    // Mostrar la vista seleccionada con animación
    targetView.style.display = 'block';
    
    // Aplicar animación según el tipo de vista
    if (viewName === 'mainView') {
        targetView.style.animation = 'slideInFromRight 0.4s ease-out';
        console.log('Mostrando vista principal');
    } else {
        targetView.style.animation = 'slideInFromLeft 0.4s ease-out';
        
        // Inicializar vistas específicas
        if (viewName === 'addBeneficiaryView') {
            console.log('Mostrando vista de agregar beneficiario');
            setTimeout(() => initializeAddView(), 100);
        } else if (viewName === 'listBeneficiariesView') {
            console.log('Mostrando vista de listado');
            setTimeout(() => loadBeneficiariosList(), 100);
        } else if (viewName === 'comparisonsReportsView') {
            console.log('Mostrando vista de comparaciones y reportes');
        } else if (viewName === 'generateComparisonView') {
            console.log('Mostrando vista de generar comparativa');
            setTimeout(() => initializeComparisonForm(), 100);
        } else if (viewName === 'comparisonResultsView') {
            console.log('Mostrando resultados de comparativa');
        } else if (viewName === 'mainView') {
            // Cargar dashboard de estadísticas cuando se muestra la vista principal
            setTimeout(() => loadStatisticsDashboard(), 100);
        }
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
        setupInputValidation(); // Configurar validación de entrada
    }, 100);
    
    // Limpiar selección de proyectos
    selectedProjects.clear();
    updateProjectsChecklist();
    updateSelectedProjectsCount();
}

// Función para separar nombres (máximo 3)
function separarNombres(nombresTexto) {
    const nombres = nombresTexto.trim().split(/\s+/).filter(n => n.length > 0);
    return {
        primer_nombre: nombres[0] || '',
        segundo_nombre: nombres[1] || null,
        tercer_nombre: nombres[2] || null
    };
}

// Función para separar apellidos (máximo 2)
function separarApellidos(apellidosTexto) {
    const apellidos = apellidosTexto.trim().split(/\s+/).filter(a => a.length > 0);
    return {
        primer_apellido: apellidos[0] || '',
        segundo_apellido: apellidos[1] || null
    };
}

// Función para validar y limitar palabras en un campo
function limitarPalabras(campo, maxPalabras) {
    campo.addEventListener('input', function() {
        const palabras = this.value.trim().split(/\s+/).filter(p => p.length > 0);
        if (palabras.length > maxPalabras) {
            this.value = palabras.slice(0, maxPalabras).join(' ');
        }
    });
}

// Función para validar DPI existente
let dpiValidationTimeout = null;
let beneficiarioExistente = null;
let dpiValidando = false;
let editandoBeneficiarioId = null; // ID del beneficiario que se está editando

async function validarDPIExistente(dpi, mostrarLoading = true) {
    if (!dpi || dpi.length !== 13) {
        beneficiarioExistente = null;
        resetDPIStatus();
        return;
    }
    
    // Si estamos editando un beneficiario, verificar si el DPI pertenece al mismo
    if (editandoBeneficiarioId) {
        try {
            const response = await fetch(`/api/beneficiarios/buscar-por-dpi/?dpi=${dpi}`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.existe && data.beneficiario && data.beneficiario.id === editandoBeneficiarioId) {
                    // Es el mismo beneficiario, no mostrar advertencia
                    beneficiarioExistente = null;
                    mostrarDPISuccess();
                    return;
                }
            }
        } catch (error) {
            console.error('Error al validar DPI:', error);
        }
    }
    
    // Mostrar loading
    if (mostrarLoading) {
        mostrarDPILoading();
    }
    
    try {
        const response = await fetch(`/api/beneficiarios/buscar-por-dpi/?dpi=${dpi}`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.existe) {
                // Si estamos editando y es el mismo beneficiario, no mostrar advertencia
                if (editandoBeneficiarioId && data.beneficiario && data.beneficiario.id === editandoBeneficiarioId) {
                    beneficiarioExistente = null;
                    mostrarDPISuccess();
                } else {
                    beneficiarioExistente = data.beneficiario;
                    mostrarAdvertenciaDPI(data.beneficiario);
                }
            } else {
                beneficiarioExistente = null;
                mostrarDPISuccess();
            }
        } else {
            beneficiarioExistente = null;
            resetDPIStatus();
        }
    } catch (error) {
        console.error('Error al validar DPI:', error);
        beneficiarioExistente = null;
        resetDPIStatus();
    } finally {
        if (mostrarLoading) {
            ocultarDPILoading();
        }
    }
}

function mostrarDPILoading() {
    const dpiInput = document.getElementById('benef_ind_dpi');
    const statusIcon = document.getElementById('benef_ind_dpi_status');
    const loadingIcon = document.getElementById('benef_ind_dpi_warning');
    const successIcon = document.getElementById('benef_ind_dpi_success');
    const loadingSpinner = document.getElementById('benef_ind_dpi_loading');
    const message = document.getElementById('benef_ind_dpi_message');
    
    if (statusIcon) statusIcon.style.display = 'none';
    if (loadingIcon) loadingIcon.style.display = 'none';
    if (successIcon) successIcon.style.display = 'none';
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (message) {
        message.textContent = 'Verificando DPI...';
        message.style.color = '#007bff';
    }
    if (dpiInput) {
        dpiInput.style.borderColor = '#007bff';
        dpiInput.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
    }
}

function ocultarDPILoading() {
    const loadingSpinner = document.getElementById('benef_ind_dpi_loading');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}

function mostrarDPISuccess() {
    const dpiInput = document.getElementById('benef_ind_dpi');
    const statusIcon = document.getElementById('benef_ind_dpi_status');
    const successIcon = document.getElementById('benef_ind_dpi_success');
    const warning = document.getElementById('benef_ind_dpi_warning');
    const infoDiv = document.getElementById('benef_ind_dpi_existente_info');
    const message = document.getElementById('benef_ind_dpi_message');
    
    if (dpiInput) {
        dpiInput.style.borderColor = '#28a745';
        dpiInput.style.backgroundColor = 'rgba(40, 167, 69, 0.05)';
    }
    
    if (statusIcon) statusIcon.style.display = 'block';
    if (successIcon) successIcon.style.display = 'block';
    if (warning) warning.style.display = 'none';
    if (infoDiv) infoDiv.style.display = 'none';
    
    if (message) {
        message.textContent = '✓ DPI válido y disponible';
        message.style.color = '#28a745';
    }
}

function mostrarAdvertenciaDPI(beneficiario) {
    const dpiInput = document.getElementById('benef_ind_dpi');
    const statusIcon = document.getElementById('benef_ind_dpi_status');
    const warningIcon = document.getElementById('benef_ind_dpi_warning');
    const successIcon = document.getElementById('benef_ind_dpi_success');
    const infoDiv = document.getElementById('benef_ind_dpi_existente_info');
    const datosDiv = document.getElementById('benef_ind_dpi_existente_datos');
    const message = document.getElementById('benef_ind_dpi_message');
    
    if (dpiInput) {
        dpiInput.style.borderColor = '#dc3545';
        dpiInput.style.backgroundColor = 'rgba(220, 53, 69, 0.05)';
    }
    
    if (statusIcon) statusIcon.style.display = 'block';
    if (warningIcon) warningIcon.style.display = 'block';
    if (successIcon) successIcon.style.display = 'none';
    if (infoDiv) infoDiv.style.display = 'block';
    
    if (message) {
        message.textContent = '⚠ Este DPI ya existe en el sistema';
        message.style.color = '#dc3545';
    }
    
    if (datosDiv && beneficiario) {
        const nombreCompleto = beneficiario.primer_nombre || beneficiario.nombre || '';
        const apellidoCompleto = beneficiario.primer_apellido || beneficiario.apellido || '';
        const comunidad = beneficiario.comunidad_nombre || 'N/A';
        const fechaCreacion = beneficiario.creado_en ? new Date(beneficiario.creado_en).toLocaleDateString('es-GT') : 'N/A';
        const fechaActualizacion = beneficiario.actualizado_en ? new Date(beneficiario.actualizado_en).toLocaleDateString('es-GT') : 'N/A';
        
        datosDiv.innerHTML = `
            <div style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <div style="margin-bottom: 6px;"><strong style="color: #ffffff;">Nombre:</strong> <span style="color: #b8c5d1;">${nombreCompleto} ${apellidoCompleto}</span></div>
                <div style="margin-bottom: 6px;"><strong style="color: #ffffff;">Comunidad:</strong> <span style="color: #b8c5d1;">${comunidad}</span></div>
                <div style="margin-bottom: 6px;"><strong style="color: #ffffff;">Fecha de registro:</strong> <span style="color: #b8c5d1;">${fechaCreacion}</span></div>
                <div style="margin-bottom: 6px;"><strong style="color: #ffffff;">Última actualización:</strong> <span style="color: #b8c5d1;">${fechaActualizacion}</span></div>
                ${beneficiario.telefono ? `<div><strong style="color: #ffffff;">Teléfono:</strong> <span style="color: #b8c5d1;">${beneficiario.telefono}</span></div>` : ''}
            </div>
        `;
    }
}

function resetDPIStatus() {
    const dpiInput = document.getElementById('benef_ind_dpi');
    const statusIcon = document.getElementById('benef_ind_dpi_status');
    const warningIcon = document.getElementById('benef_ind_dpi_warning');
    const successIcon = document.getElementById('benef_ind_dpi_success');
    const infoDiv = document.getElementById('benef_ind_dpi_existente_info');
    const message = document.getElementById('benef_ind_dpi_message');
    
    if (dpiInput) {
        dpiInput.style.borderColor = '';
        dpiInput.style.backgroundColor = '';
    }
    
    if (statusIcon) statusIcon.style.display = 'none';
    if (warningIcon) warningIcon.style.display = 'none';
    if (successIcon) successIcon.style.display = 'none';
    if (infoDiv) infoDiv.style.display = 'none';
    
    if (message) {
        message.textContent = 'Debe tener exactamente 13 números. Se verificará automáticamente al salir del campo.';
        message.style.color = '#6c757d';
    }
    
    beneficiarioExistente = null;
}

function ocultarAdvertenciaDPI() {
    resetDPIStatus();
}

function setupInputValidation() {
    // Validación para campos de solo letras (Nombre, Apellido, Apellido de Casada, Jefe de Familia, Representante Legal, Persona de Contacto)
    const letrasOnlyFields = [
        'benef_ind_nombre',
        'benef_ind_apellido',
        'benef_ind_apellido_casada',
        'benef_fam_jefe',
        'benef_inst_representante',
        'benef_otro_contacto'
    ];
    
    letrasOnlyFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Prevenir entrada de números y caracteres especiales
            field.addEventListener('keypress', function(e) {
                const char = String.fromCharCode(e.which);
                // Permitir letras (incluyendo acentos y ñ), espacios y teclas de control
                if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]$/.test(char) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
            });
            
            // Validar al pegar texto
            field.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                // Filtrar solo letras y espacios
                const filtered = pastedText.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, '');
                this.value = filtered;
            });
            
            // Validar al escribir (input event)
            field.addEventListener('input', function() {
                // Remover cualquier carácter que no sea letra o espacio
                this.value = this.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, '');
            });
            
            // Limitar palabras según el campo
            if (fieldId === 'benef_ind_nombre') {
                limitarPalabras(field, 3); // Máximo 3 nombres
            } else if (fieldId === 'benef_ind_apellido') {
                limitarPalabras(field, 2); // Máximo 2 apellidos
            } else if (fieldId === 'benef_ind_apellido_casada') {
                limitarPalabras(field, 3); // Máximo 3 palabras
            }
        }
    });
    
    // Validación de DPI con verificación en tiempo real
    const dpiField = document.getElementById('benef_ind_dpi');
    if (dpiField && !dpiField.hasAttribute('data-dpi-listener-attached')) {
        dpiField.setAttribute('data-dpi-listener-attached', 'true');
        
        // Validación en tiempo real mientras el usuario escribe
        dpiField.addEventListener('input', function() {
            const dpi = this.value.trim();
            // Limpiar timeout anterior
            if (dpiValidationTimeout) {
                clearTimeout(dpiValidationTimeout);
            }
            
            // Si el DPI está completo (13 dígitos), validar automáticamente después de un breve delay
            if (dpi.length === 13) {
                // Validar automáticamente después de 500ms de inactividad
                dpiValidationTimeout = setTimeout(() => {
                    validarDPIExistente(dpi, true);
                }, 500);
            } else if (dpi.length > 0 && dpi.length < 13) {
                // DPI incompleto - mostrar mensaje informativo
                resetDPIStatus();
                const message = document.getElementById('benef_ind_dpi_message');
                if (message) {
                    message.textContent = `Ingresando DPI... (${dpi.length}/13 dígitos)`;
                    message.style.color = '#6c757d';
                }
            } else if (dpi.length === 0) {
                // Campo vacío - limpiar estado
                resetDPIStatus();
            } else if (dpi.length > 13) {
                // DPI demasiado largo - mostrar error
                resetDPIStatus();
                const message = document.getElementById('benef_ind_dpi_message');
                if (message) {
                    message.textContent = '⚠ El DPI no puede tener más de 13 números';
                    message.style.color = '#ffc107';
                }
            }
        });
        
        // También validar cuando el usuario sale del campo (blur) como respaldo
        dpiField.addEventListener('blur', function() {
            const dpi = this.value.trim();
            // Limpiar timeout de input si existe
            if (dpiValidationTimeout) {
                clearTimeout(dpiValidationTimeout);
            }
            
            if (dpi.length === 13) {
                validarDPIExistente(dpi, true);
            } else if (dpi.length > 0 && dpi.length !== 13) {
                // DPI incompleto
                const message = document.getElementById('benef_ind_dpi_message');
                if (message) {
                    message.textContent = '⚠ El DPI debe tener exactamente 13 números';
                    message.style.color = '#ffc107';
                }
                resetDPIStatus();
            } else {
                resetDPIStatus();
            }
        });
    }
    
    // Mostrar advertencia al hacer clic en el ícono de advertencia
    const warningIcon = document.getElementById('benef_ind_dpi_warning');
    if (warningIcon) {
        warningIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (beneficiarioExistente) {
                // Scroll suave hacia la información del beneficiario
                const infoDiv = document.getElementById('benef_ind_dpi_existente_info');
                if (infoDiv) {
                    infoDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    // Resaltar brevemente
                    infoDiv.style.animation = 'pulse 0.5s ease-in-out';
                    setTimeout(() => {
                        infoDiv.style.animation = '';
                    }, 500);
                }
            }
        });
    }
    
    // Manejar checkbox de actualizar fecha
    const actualizarFechaCheck = document.getElementById('benef_ind_actualizar_fecha_check');
    const fechaActualizacionContainer = document.getElementById('benef_ind_fecha_actualizacion_container');
    if (actualizarFechaCheck && fechaActualizacionContainer) {
        actualizarFechaCheck.addEventListener('change', function() {
            fechaActualizacionContainer.style.display = this.checked ? 'block' : 'none';
            if (this.checked) {
                // Establecer fecha actual por defecto
                const fechaInput = document.getElementById('benef_ind_fecha_actualizacion');
                if (fechaInput && !fechaInput.value) {
                    const hoy = new Date().toISOString().split('T')[0];
                    fechaInput.value = hoy;
                }
            }
        });
    }
    
    // Manejar botón "Actualizar Fecha"
    const btnActualizarFecha = document.getElementById('benef_ind_btn_actualizar_fecha');
    if (btnActualizarFecha) {
        btnActualizarFecha.addEventListener('click', async function() {
            await actualizarSoloFechaBeneficiario();
        });
    }
    
    // Validación para campos de solo números (DPI, Teléfono)
    const numerosOnlyFields = [
        'benef_ind_dpi',
        'benef_fam_dpi',
        'benef_inst_dpi_rep',
        'benef_ind_telefono',
        'benef_fam_telefono',
        'benef_inst_telefono',
        'benef_otro_telefono'
    ];
    
    numerosOnlyFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Prevenir entrada de letras y caracteres especiales
            field.addEventListener('keypress', function(e) {
                const char = String.fromCharCode(e.which);
                // Permitir solo números y teclas de control
                if (!/^[0-9]$/.test(char) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
            });
            
            // Validar al pegar texto
            field.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                // Filtrar solo números
                const filtered = pastedText.replace(/[^0-9]/g, '');
                this.value = filtered;
            });
            
            // Validar al escribir (input event)
            field.addEventListener('input', function() {
                // Remover cualquier carácter que no sea número
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }
    });
    
    // Validación para campo de Edad (ya es type="number", pero agregamos validación adicional)
    const edadField = document.getElementById('benef_ind_edad');
    if (edadField) {
        // Prevenir entrada de caracteres no numéricos
        edadField.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            // Permitir solo números, punto decimal (para casos especiales), y teclas de control
            if (!/^[0-9.]$/.test(char) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });
        
        // Validar al pegar texto
        edadField.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            // Filtrar solo números
            const filtered = pastedText.replace(/[^0-9]/g, '');
            this.value = filtered;
        });
        
        // Validar al escribir (input event) - asegurar que sea solo números enteros
        edadField.addEventListener('input', function() {
            // Remover cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Validación para Número de Miembros (ya es type="number")
    const miembrosField = document.getElementById('benef_fam_miembros');
    if (miembrosField) {
        // Prevenir entrada de caracteres no numéricos
        miembrosField.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            // Permitir solo números y teclas de control
            if (!/^[0-9]$/.test(char) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });
        
        // Validar al pegar texto
        miembrosField.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            // Filtrar solo números
            const filtered = pastedText.replace(/[^0-9]/g, '');
            this.value = filtered;
        });
        
        // Validar al escribir (input event)
        miembrosField.addEventListener('input', function() {
            // Remover cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Validación para Número de Beneficiarios Directos (Institución)
    const numBeneficiariosField = document.getElementById('benef_inst_num_beneficiarios');
    if (numBeneficiariosField) {
        // Prevenir entrada de caracteres no numéricos
        numBeneficiariosField.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            // Permitir solo números y teclas de control
            if (!/^[0-9]$/.test(char) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });
        
        // Validar al pegar texto
        numBeneficiariosField.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            // Filtrar solo números
            const filtered = pastedText.replace(/[^0-9]/g, '');
            this.value = filtered;
        });
        
        // Validar al escribir (input event)
        numBeneficiariosField.addEventListener('input', function() {
            // Remover cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Beneficiarios: Inicializando módulo...');
    
    // Cargar estadísticas al iniciar la página
    setTimeout(() => {
        loadStatisticsDashboard();
    }, 500);
    
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

    // Botones del módulo de comparaciones y reportes usando event delegation para mayor robustez
    document.addEventListener('click', function(e) {
        // Botón principal para abrir el módulo
        if (e.target.closest('#openComparisonsReportsBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Click en Comparativas de Beneficiarios');
            showView('generateComparisonView');
            return;
        }

        // Botones de volver
        if (e.target.closest('#backFromComparisonsReportsBtn')) {
            e.preventDefault();
            e.stopPropagation();
            showView('mainView');
            return;
        }
        
        if (e.target.closest('#backFromComparisonFormBtn')) {
            e.preventDefault();
            e.stopPropagation();
            showView('mainView');
            return;
        }

        if (e.target.closest('#backFromComparisonFormBtn')) {
            e.preventDefault();
            e.stopPropagation();
            showView('comparisonsReportsView');
            return;
        }

        if (e.target.closest('#backFromComparisonResultsBtn')) {
            e.preventDefault();
            e.stopPropagation();
            showView('generateComparisonView');
            return;
        }


        // Botones de acción
        if (e.target.closest('#generateComparisonBtn')) {
            e.preventDefault();
            e.stopPropagation();
            handleGenerateComparison();
            return;
        }

        if (e.target.closest('#cancelComparisonBtn')) {
            e.preventDefault();
            e.stopPropagation();
            showView('comparisonsReportsView');
            return;
        }

        if (e.target.closest('#generateReportBtn')) {
            e.preventDefault();
            e.stopPropagation();
            mostrarMensaje('info', 'La funcionalidad de generar reporte estará disponible próximamente');
            return;
        }
    });
    
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
    
    // Inicializar modales de edición
    inicializarModalesEdicion();
    inicializarModalAgregarProyecto();
    inicializarModalAgregarAtributo();
}

// Función para inicializar modales de edición
function inicializarModalesEdicion() {
    const modal = document.getElementById('editBeneficiaryOptionsModal');
    const closeBtn = document.getElementById('closeEditOptionsModal');
    const btnEditInfo = document.getElementById('btnEditInfoBeneficiario');
    const btnAddToProject = document.getElementById('btnAddToProjectBeneficiario');
    
    // Cerrar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarOpcionesEdicion);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarOpcionesEdicion();
            }
        });
    }
    
    // Botón editar información
    if (btnEditInfo) {
        btnEditInfo.addEventListener('click', async function() {
            const beneficiarioId = beneficiarioEditando;
            if (beneficiarioId) {
                cerrarOpcionesEdicion();
                // Cambiar a la vista de agregar beneficiario
                showView('addBeneficiaryView');
                // Esperar un poco para que la vista se muestre
                setTimeout(async () => {
                    await cargarDatosBeneficiarioParaEditar(beneficiarioId);
                }, 100);
            }
        });
    }
    
    // Botón agregar a proyecto
    if (btnAddToProject) {
        btnAddToProject.addEventListener('click', function() {
            const beneficiarioId = beneficiarioEditando;
            if (beneficiarioId) {
                cerrarOpcionesEdicion();
                mostrarModalAgregarProyecto(beneficiarioId);
            }
        });
    }
    
    // Botón agregar atributo
    const btnAddAtributo = document.getElementById('btnAddAtributoBeneficiario');
    if (btnAddAtributo) {
        btnAddAtributo.addEventListener('click', function() {
            const beneficiarioId = beneficiarioEditando;
            if (beneficiarioId) {
                cerrarOpcionesEdicion();
                abrirModalAgregarAtributo(beneficiarioId);
            }
        });
    }
    
    const btnReinscribirProyecto = document.getElementById('btnReinscribirProyecto');
    if (btnReinscribirProyecto) {
        btnReinscribirProyecto.addEventListener('click', function() {
            const beneficiarioId = beneficiarioEditando;
            if (beneficiarioId) {
                cerrarOpcionesEdicion();
                abrirModalReinscribirProyecto(beneficiarioId);
            }
        });
    }
    
    // Cerrar modal de reinscripción
    const closeReinscribirModal = document.getElementById('closeReinscribirProyectoModal');
    const cancelReinscribirBtn = document.getElementById('cancelReinscribirProyectoBtn');
    if (closeReinscribirModal) {
        closeReinscribirModal.addEventListener('click', cerrarModalReinscribirProyecto);
    }
    if (cancelReinscribirBtn) {
        cancelReinscribirBtn.addEventListener('click', cerrarModalReinscribirProyecto);
    }
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
    const projectFechaAgregacion = document.getElementById('projectFechaAgregacion');
    if (projectFechaAgregacion) projectFechaAgregacion.value = '';
    const projectFechaAgregacionContainer = document.getElementById('projectFechaAgregacionContainer');
    if (projectFechaAgregacionContainer) projectFechaAgregacionContainer.style.display = 'none';
    
    // Limpiar advertencia de DPI y estados
    resetDPIStatus();
    beneficiarioExistente = null;
    editandoBeneficiarioId = null;
    
    // Remover atributo de listener del DPI para que se reconfigure
    const dpiField = document.getElementById('benef_ind_dpi');
    if (dpiField) {
        dpiField.removeAttribute('data-dpi-listener-attached');
    }
    const actualizarFechaCheck = document.getElementById('benef_ind_actualizar_fecha_check');
    if (actualizarFechaCheck) actualizarFechaCheck.checked = false;
    const fechaActualizacionContainer = document.getElementById('benef_ind_fecha_actualizacion_container');
    if (fechaActualizacionContainer) fechaActualizacionContainer.style.display = 'none';
    const fechaActualizacion = document.getElementById('benef_ind_fecha_actualizacion');
    if (fechaActualizacion) fechaActualizacion.value = '';
    
    // Limpiar estilos de campos autocompletados (amarillo)
    const camposAutocompletados = document.querySelectorAll('[style*="rgba(255, 255, 255, 0.25)"]');
    camposAutocompletados.forEach(campo => {
        campo.style.backgroundColor = '';
    });
    
    // Limpiar checklist de proyectos
    const projectsChecklist = document.getElementById('projectsChecklist');
    if (projectsChecklist) {
        projectsChecklist.innerHTML = '';
    }
    
    // Limpiar foto
    const fotoInput = document.getElementById('benef_ind_foto');
    const fotoPreview = document.getElementById('benef_ind_foto_preview');
    const fotoPreviewImg = document.getElementById('benef_ind_foto_preview_img');
    if (fotoInput) fotoInput.value = '';
    if (fotoPreview) fotoPreview.style.display = 'none';
    if (fotoPreviewImg) fotoPreviewImg.src = '';
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
    
    // Mostrar/ocultar campo de fecha de agregación al proyecto
    const fechaContainer = document.getElementById('projectFechaAgregacionContainer');
    if (fechaContainer) {
        fechaContainer.style.display = selectedProjects.size > 0 ? 'block' : 'none';
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
    
    // Verificar si estamos editando (si hay un beneficiario cargado para editar)
    const esModoEdicion = editandoBeneficiarioId !== null;
    
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
        const nombreTexto = document.getElementById('benef_ind_nombre').value.trim();
        const apellidoTexto = document.getElementById('benef_ind_apellido').value.trim();
        const genero = document.getElementById('benef_ind_genero').value;
        
        // Separar nombres y apellidos
        const nombres = separarNombres(nombreTexto);
        const apellidos = separarApellidos(apellidoTexto);
        
        // Validar que al menos primer nombre y primer apellido existan
        if (!nombres.primer_nombre || !apellidos.primer_apellido || !genero) {
            mostrarMensaje('error', 'Por favor completa todos los campos requeridos para beneficiario individual');
            return;
        }
        
        // Validar límite de nombres (máximo 3)
        const nombresArray = nombreTexto.split(/\s+/).filter(n => n.length > 0);
        if (nombresArray.length > 3) {
            mostrarMensaje('error', 'El campo nombre solo puede contener máximo 3 nombres separados por espacios');
            return;
        }
        
        // Validar límite de apellidos (máximo 2)
        const apellidosArray = apellidoTexto.split(/\s+/).filter(a => a.length > 0);
        if (apellidosArray.length > 2) {
            mostrarMensaje('error', 'El campo apellido solo puede contener máximo 2 apellidos separados por espacios');
            return;
        }
        
        // Agregar nombres separados
        beneficiarioData.primer_nombre = nombres.primer_nombre;
        beneficiarioData.segundo_nombre = nombres.segundo_nombre;
        beneficiarioData.tercer_nombre = nombres.tercer_nombre;
        
        // Agregar apellidos separados
        beneficiarioData.primer_apellido = apellidos.primer_apellido;
        beneficiarioData.segundo_apellido = apellidos.segundo_apellido;
        
        // Mantener compatibilidad con campos antiguos
        beneficiarioData.nombre = nombres.primer_nombre;
        beneficiarioData.apellido = apellidos.primer_apellido;
        
        // Apellido de casada
        const apellidoCasadaTexto = document.getElementById('benef_ind_apellido_casada').value.trim();
        if (apellidoCasadaTexto) {
            const palabrasCasada = apellidoCasadaTexto.split(/\s+/).filter(p => p.length > 0);
            if (palabrasCasada.length > 3) {
                mostrarMensaje('error', 'El apellido de casada solo puede contener máximo 3 palabras separadas por espacios');
                return;
            }
            beneficiarioData.apellido_casada = apellidoCasadaTexto;
        }
        
        // DPI
        const dpi = document.getElementById('benef_ind_dpi').value.trim();
        beneficiarioData.dpi = dpi || null;
        
        // Si el DPI existe, actualizar el beneficiario existente en lugar de crear uno nuevo
        if (beneficiarioExistente && dpi && dpi.length === 13) {
            // Marcar que se debe actualizar el beneficiario existente
            beneficiarioData.actualizar_beneficiario_existente = true;
            beneficiarioData.beneficiario_existente_id = beneficiarioExistente.id;
            
            // Si hay fecha de actualización seleccionada, incluirla
            const actualizarFechaCheck = document.getElementById('benef_ind_actualizar_fecha_check');
            if (actualizarFechaCheck && actualizarFechaCheck.checked) {
                const fechaActualizacion = document.getElementById('benef_ind_fecha_actualizacion').value;
                if (fechaActualizacion) {
                    beneficiarioData.actualizar_fecha_existente = true;
                    beneficiarioData.fecha_actualizacion = fechaActualizacion;
                }
            }
        }
        
        // Comunidad lingüística
        const comunidadLinguistica = document.getElementById('benef_ind_comunidad_linguistica').value;
        if (comunidadLinguistica) {
            beneficiarioData.comunidad_linguistica = comunidadLinguistica;
        }
        
        // Fecha de registro
        const fechaRegistro = document.getElementById('benef_ind_fecha_registro').value;
        if (fechaRegistro) {
            beneficiarioData.fecha_registro = fechaRegistro;
        }
        
        // Foto (solo si hay archivo seleccionado)
        const fotoInput = document.getElementById('benef_ind_foto');
        if (fotoInput && fotoInput.files && fotoInput.files.length > 0) {
            beneficiarioData.foto_file = fotoInput.files[0];
        }
        
        // Otros campos
        beneficiarioData.fecha_nacimiento = document.getElementById('benef_ind_fecha_nac').value || null;
        beneficiarioData.edad = document.getElementById('benef_ind_edad').value || null;
        beneficiarioData.genero = genero;
        beneficiarioData.telefono = document.getElementById('benef_ind_telefono').value.trim() || null;
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
            // Agregar fecha de agregación al proyecto si se especificó
            const fechaAgregacion = document.getElementById('projectFechaAgregacion');
            if (fechaAgregacion && fechaAgregacion.value) {
                beneficiarioData.fecha_agregacion_proyecto = fechaAgregacion.value;
            }
        }
        
        console.log('Enviando datos del beneficiario:', beneficiarioData);
        
        // Determinar endpoint y método según si estamos editando o creando
        let endpoint, method;
        if (esModoEdicion && editandoBeneficiarioId) {
            // Modo edición
            endpoint = `/api/beneficiarios/actualizar/${editandoBeneficiarioId}/`;
            method = 'PUT';
            beneficiarioData.beneficiario_existente_id = editandoBeneficiarioId;
        } else if (beneficiarioData.actualizar_beneficiario_existente && beneficiarioData.beneficiario_existente_id) {
            // DPI existente - actualizar
            endpoint = `/api/beneficiarios/actualizar/${beneficiarioData.beneficiario_existente_id}/`;
            method = 'PUT';
        } else {
            // Crear nuevo
            endpoint = '/api/beneficiarios/crear/';
            method = 'POST';
        }
        
        // Preparar FormData si hay foto
        let requestBody;
        let headers = {
            'X-CSRFToken': getCookie('csrftoken')
        };
        
        if (beneficiarioData.foto_file) {
            // Usar FormData para enviar archivo
            const formData = new FormData();
            formData.append('foto', beneficiarioData.foto_file);
            delete beneficiarioData.foto_file; // Remover del objeto JSON
            
            // Agregar todos los demás campos como JSON string
            formData.append('data', JSON.stringify(beneficiarioData));
            
            requestBody = formData;
            // No establecer Content-Type, el navegador lo hará automáticamente con el boundary
        } else {
            // Enviar como JSON normal
            headers['Content-Type'] = 'application/json';
            requestBody = JSON.stringify(beneficiarioData);
        }
        
        const response = await fetch(endpoint, {
            method: method,
            headers: headers,
            body: requestBody
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `Error HTTP: ${response.status}`);
        }
        
        if (data.success) {
            const mensaje = (esModoEdicion || beneficiarioData.actualizar_beneficiario_existente)
                ? (data.message || 'Beneficiario actualizado exitosamente')
                : (data.message || 'Beneficiario guardado exitosamente');
            mostrarMensaje('success', mensaje);
            
            // Limpiar formulario usando la función de reset
            resetBeneficiaryForm();
            editandoBeneficiarioId = null;
            
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

// Función para actualizar solo la fecha de actualización del beneficiario
async function actualizarSoloFechaBeneficiario() {
    if (!beneficiarioExistente) {
        mostrarMensaje('error', 'No hay un beneficiario existente para actualizar');
        return;
    }
    
    const fechaActualizacion = document.getElementById('benef_ind_fecha_actualizacion').value;
    if (!fechaActualizacion) {
        mostrarMensaje('error', 'Por favor selecciona una fecha de actualización');
        return;
    }
    
    const btnActualizarFecha = document.getElementById('benef_ind_btn_actualizar_fecha');
    const btnOriginalHTML = btnActualizarFecha ? btnActualizarFecha.innerHTML : '';
    
    try {
        if (btnActualizarFecha) {
            btnActualizarFecha.disabled = true;
            btnActualizarFecha.innerHTML = '<div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #ffffff; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; display: inline-block; margin-right: 6px;"></div> Actualizando...';
        }
        
        const response = await fetch(`/api/beneficiarios/actualizar-fecha/${beneficiarioExistente.id}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                fecha_actualizacion: fechaActualizacion
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Error HTTP: ${response.status}`);
        }
        
        if (data.success) {
            mostrarMensaje('success', data.message || 'Fecha de actualización guardada exitosamente');
            
            // Limpiar el campo de fecha
            const fechaInput = document.getElementById('benef_ind_fecha_actualizacion');
            if (fechaInput) fechaInput.value = '';
            
            // Actualizar la información mostrada del beneficiario
            if (data.fecha_actualizada) {
                beneficiarioExistente.actualizado_en = data.fecha_actualizada;
                // Refrescar la visualización si es necesario
                if (document.getElementById('benef_ind_dpi_existente_info').style.display !== 'none') {
                    mostrarAdvertenciaDPI(beneficiarioExistente);
                }
            }
        } else {
            const errorMsg = data.error || data.message || 'Error al actualizar la fecha';
            mostrarMensaje('error', errorMsg);
        }
    } catch (error) {
        console.error('Error al actualizar fecha:', error);
        const errorMsg = error.message || 'Error al actualizar la fecha. Por favor, intenta nuevamente.';
        mostrarMensaje('error', errorMsg);
    } finally {
        if (btnActualizarFecha) {
            btnActualizarFecha.disabled = false;
            btnActualizarFecha.innerHTML = btnOriginalHTML;
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
                statusEl.textContent = 'beneficiarios del sistema';
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

// Función para formatear nombre completo en mayúsculas
function formatearNombreCompleto(beneficiario) {
    const detalles = beneficiario.detalles || {};
    const tipo = (beneficiario.tipo || '').toLowerCase();
    
    if (tipo === 'individual') {
        const nombres = [
            detalles.primer_nombre || detalles.nombre || '',
            detalles.segundo_nombre || '',
            detalles.tercer_nombre || ''
        ].filter(n => n).join(' ');
        
        const apellidos = [
            detalles.primer_apellido || detalles.apellido || '',
            detalles.segundo_apellido || ''
        ].filter(a => a).join(' ');
        
        return `${nombres} ${apellidos}`.trim().toUpperCase();
    } else if (tipo === 'familia') {
        return (detalles.nombre_familia || beneficiario.nombre || 'Sin nombre').toUpperCase();
    } else if (tipo === 'institución') {
        return (detalles.nombre_institucion || beneficiario.nombre || 'Sin nombre').toUpperCase();
    }
    
    return (beneficiario.nombre || beneficiario.display_name || 'Sin nombre').toUpperCase();
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
        const nombreCompleto = formatearNombreCompleto(b);
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
            <div class="beneficiary-item" style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                <div class="beneficiary-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 class="beneficiary-name" style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600; text-transform: uppercase;">${nombreCompleto}</h4>
                    <span class="beneficiary-type" style="padding: 4px 12px; background: rgba(0, 123, 255, 0.2); border-radius: 12px; font-size: 12px; color: #007bff; font-weight: 500;">${tipoLabel}</span>
                </div>
                <div style="color: #b8c5d1; font-size: 14px; margin-top: 4px;">
                    ${b.comunidad_nombre || 'Sin comunidad'}
                    ${b.region_nombre ? ` • ${b.region_nombre}` : ''}
                </div>
                ${infoAdicional ? `<div style="color: #6c757d; font-size: 12px; margin-top: 4px;">${infoAdicional}</div>` : ''}
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button type="button" class="btn-edit-beneficiario" data-id="${b.id}" style="flex: 1; padding: 8px 12px; background: rgba(0, 123, 255, 0.2); border: 1px solid rgba(0, 123, 255, 0.3); border-radius: 6px; color: #007bff; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s;" 
                            onmouseover="this.style.background='rgba(0, 123, 255, 0.3)';"
                            onmouseout="this.style.background='rgba(0, 123, 255, 0.2)';">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Agregar event listeners a los botones de editar
    resultsContainer.querySelectorAll('.btn-edit-beneficiario').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const beneficiarioId = this.getAttribute('data-id');
            mostrarOpcionesEdicion(beneficiarioId);
        });
    });
}

// Variable para almacenar el beneficiario que se está editando
let beneficiarioEditando = null;

// Función para mostrar opciones de edición
function mostrarOpcionesEdicion(beneficiarioId) {
    beneficiarioEditando = beneficiarioId;
    const modal = document.getElementById('editBeneficiaryOptionsModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

// Función para cerrar modal de opciones
function cerrarOpcionesEdicion() {
    const modal = document.getElementById('editBeneficiaryOptionsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    beneficiarioEditando = null;
}

// Función para cargar datos del beneficiario y autocompletar formulario
async function cargarDatosBeneficiarioParaEditar(beneficiarioId) {
    if (!beneficiarioId || beneficiarioId === 'null' || beneficiarioId === 'undefined') {
        console.error('Error: ID de beneficiario inválido:', beneficiarioId);
        mostrarMensaje('error', 'Error: ID de beneficiario inválido');
        return;
    }
    
    try {
        const url = `/api/beneficiario/${beneficiarioId}/detalle/`;
        if (!url || url.includes('null') || url.includes('undefined')) {
            throw new Error('URL inválida para cargar datos del beneficiario');
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al cargar datos del beneficiario');
        }
        
        const data = await response.json();
        if (!data.success || !data.beneficiario) {
            throw new Error('No se pudieron obtener los datos del beneficiario');
        }
        
        const beneficiario = data.beneficiario;
        const detalles = beneficiario.detalles || {};
        
        // Establecer que estamos editando
        editandoBeneficiarioId = beneficiarioId;
        
        // Cambiar a modo de edición (ocultar sección de buscar existente, mostrar formulario)
        setBeneficiaryMode('nuevo');
        document.getElementById('benef_existente_section').style.display = 'none';
        document.getElementById('benef_nuevo_section').style.display = 'block';
        
        // Ocultar opción de Excel
        const excelToggleSection = document.getElementById('excel_toggle_section');
        if (excelToggleSection) excelToggleSection.style.display = 'none';
        const excelImportSection = document.getElementById('excel_import_section');
        if (excelImportSection) excelImportSection.style.display = 'none';
        
        // Establecer tipo de beneficiario
        const tipoSelect = document.getElementById('benef_tipo');
        if (tipoSelect) {
            tipoSelect.value = beneficiario.tipo || 'individual';
            tipoSelect.dispatchEvent(new Event('change'));
        }
        
        // Esperar un poco para que se muestren los campos
        setTimeout(async () => {
            if (beneficiario.tipo === 'individual') {
                // Autocompletar campos de individual
                const nombreCompleto = [
                    detalles.primer_nombre || detalles.nombre || '',
                    detalles.segundo_nombre || '',
                    detalles.tercer_nombre || ''
                ].filter(n => n).join(' ');
                
                const apellidoCompleto = [
                    detalles.primer_apellido || detalles.apellido || '',
                    detalles.segundo_apellido || ''
                ].filter(a => a).join(' ');
                
                const nombreField = document.getElementById('benef_ind_nombre');
                const apellidoField = document.getElementById('benef_ind_apellido');
                const apellidoCasadaField = document.getElementById('benef_ind_apellido_casada');
                const dpiField = document.getElementById('benef_ind_dpi');
                const comunidadLinguisticaField = document.getElementById('benef_ind_comunidad_linguistica');
                const fechaRegistroField = document.getElementById('benef_ind_fecha_registro');
                const fechaNacField = document.getElementById('benef_ind_fecha_nac');
                const edadField = document.getElementById('benef_ind_edad');
                const generoField = document.getElementById('benef_ind_genero');
                const telefonoField = document.getElementById('benef_ind_telefono');
                
                if (nombreField && nombreCompleto) {
                    nombreField.value = nombreCompleto;
                    nombreField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (apellidoField && apellidoCompleto) {
                    apellidoField.value = apellidoCompleto;
                    apellidoField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (apellidoCasadaField && detalles.apellido_casada) {
                    apellidoCasadaField.value = detalles.apellido_casada;
                    apellidoCasadaField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (dpiField && detalles.dpi) {
                    dpiField.value = detalles.dpi;
                    dpiField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                    // No validar DPI si estamos editando el mismo beneficiario
                    // El DPI ya existe y es el mismo, no mostrar advertencia
                }
                if (comunidadLinguisticaField && detalles.comunidad_linguistica) {
                    comunidadLinguisticaField.value = detalles.comunidad_linguistica;
                    comunidadLinguisticaField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (fechaRegistroField && beneficiario.creado_en) {
                    const fecha = new Date(beneficiario.creado_en);
                    fechaRegistroField.value = fecha.toISOString().split('T')[0];
                    fechaRegistroField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (fechaNacField && detalles.fecha_nacimiento) {
                    fechaNacField.value = detalles.fecha_nacimiento;
                    fechaNacField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (edadField && detalles.edad) {
                    edadField.value = detalles.edad;
                    edadField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (generoField && detalles.genero) {
                    generoField.value = detalles.genero;
                    generoField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                if (telefonoField && detalles.telefono) {
                    telefonoField.value = detalles.telefono;
                    telefonoField.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
                
                // Establecer región y comunidad (primero región, luego comunidad)
                // Asegurar que las regiones estén cargadas
                await asegurarDatosRegionesComunidades();
                
                if (beneficiario.region_id) {
                    const regionSelect = document.getElementById('benef_region_select');
                    if (regionSelect) {
                        // Asegurar que el select esté poblado
                        if (regionSelect.options.length <= 1) {
                            populateRegionSelect();
                        }
                        
                        // Establecer la región
                        regionSelect.value = beneficiario.region_id;
                        
                        // Cargar comunidades de esa región y luego seleccionar la comunidad
                        if (beneficiario.comunidad_id) {
                            // Usar setTimeout para asegurar que el evento de cambio de región se procese
                            setTimeout(() => {
                                renderBeneficiaryCommunityOptions(beneficiario.region_id, beneficiario.comunidad_id);
                                
                                // Asegurar que la comunidad esté seleccionada después de renderizar
                                setTimeout(() => {
                                    const comunidadSelect = document.getElementById('benef_comunidad_select');
                                    if (comunidadSelect) {
                                        comunidadSelect.value = beneficiario.comunidad_id;
                                        comunidadSelect.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                                        // Disparar evento change para notificar la selección
                                        const changeEvent = new Event('change', { bubbles: true });
                                        comunidadSelect.dispatchEvent(changeEvent);
                                    }
                                }, 100);
                            }, 100);
                        } else {
                            // Si no hay comunidad, solo cargar las comunidades de la región
                            renderBeneficiaryCommunityOptions(beneficiario.region_id, '');
                        }
                        
                        // Disparar evento change para actualizar comunidades
                        const changeEvent = new Event('change', { bubbles: true });
                        regionSelect.dispatchEvent(changeEvent);
                        regionSelect.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                    }
                } else if (beneficiario.comunidad_id) {
                    // Si solo hay comunidad_id pero no region_id, buscar la región de la comunidad
                    const comunidad = allComunidades.find(c => c.id === beneficiario.comunidad_id);
                    if (comunidad && comunidad.region_id) {
                        const regionSelect = document.getElementById('benef_region_select');
                        if (regionSelect) {
                            if (regionSelect.options.length <= 1) {
                                populateRegionSelect();
                            }
                            regionSelect.value = comunidad.region_id;
                            regionSelect.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                            
                            setTimeout(() => {
                                renderBeneficiaryCommunityOptions(comunidad.region_id, beneficiario.comunidad_id);
                                
                                setTimeout(() => {
                                    const comunidadSelect = document.getElementById('benef_comunidad_select');
                                    if (comunidadSelect) {
                                        comunidadSelect.value = beneficiario.comunidad_id;
                                        comunidadSelect.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                                        const changeEvent = new Event('change', { bubbles: true });
                                        comunidadSelect.dispatchEvent(changeEvent);
                                    }
                                }, 100);
                            }, 100);
                            
                            const changeEvent = new Event('change', { bubbles: true });
                            regionSelect.dispatchEvent(changeEvent);
                        }
                    }
                }
            }
            
            // Cambiar texto del botón de guardar
            const saveBtn = document.getElementById('saveBeneficiaryBtn');
            if (saveBtn) {
                saveBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar Beneficiario
                `;
            }
            
            // Configurar validación de entrada (especialmente para DPI)
            setupInputValidation();
            
            // Cargar proyectos asociados al beneficiario
            if (beneficiario.proyectos && beneficiario.proyectos.length > 0) {
                // Cargar proyectos disponibles primero
                await loadProyectos();
                
                // Esperar un poco para que se carguen los proyectos
                setTimeout(() => {
                    // Marcar el checkbox de agregar a proyecto
                    const addToProjectCheckbox = document.getElementById('addToProjectCheckbox');
                    const projectSection = document.getElementById('projectSelectionSection');
                    if (addToProjectCheckbox && projectSection) {
                        addToProjectCheckbox.checked = true;
                        projectSection.style.display = 'block';
                    }
                    
                    // Limpiar selección anterior
                    selectedProjects.clear();
                    
                    // Marcar los proyectos ya asociados
                    beneficiario.proyectos.forEach(proyecto => {
                        selectedProjects.add(proyecto.id);
                    });
                    
                    // Actualizar el checklist
                    updateProjectsChecklist();
                    updateSelectedProjectsCount();
                }, 300);
            } else {
                // Si no hay proyectos asociados, asegurarse de que la sección esté oculta
                const addToProjectCheckbox = document.getElementById('addToProjectCheckbox');
                const projectSection = document.getElementById('projectSelectionSection');
                if (addToProjectCheckbox && projectSection) {
                    addToProjectCheckbox.checked = false;
                    projectSection.style.display = 'none';
                }
                selectedProjects.clear();
                updateSelectedProjectsCount();
            }
            
            // Scroll al formulario
            const formContainer = document.getElementById('benef_nuevo_section');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
        
        cerrarOpcionesEdicion();
        
    } catch (error) {
        console.error('Error al cargar beneficiario:', error);
        mostrarMensaje('error', 'Error al cargar los datos del beneficiario');
    }
}

// Función para inicializar modal de agregar a proyecto
let beneficiarioParaProyecto = null;
let proyectosParaAgregar = new Set();

function inicializarModalAgregarProyecto() {
    const modal = document.getElementById('addToProjectModal');
    const closeBtn = document.getElementById('closeAddToProjectModal');
    const cancelBtn = document.getElementById('cancelAddToProjectBtn');
    const saveBtn = document.getElementById('saveAddToProjectBtn');
    const searchInput = document.getElementById('addToProjectSearchInput');
    const searchClearBtn = document.getElementById('addToProjectSearchClearBtn');
    
    // Cerrar modal
    function cerrarModal() {
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                proyectosParaAgregar.clear();
                proyectosYaAsociados.clear();
                beneficiarioParaProyecto = null;
                if (searchInput) searchInput.value = '';
                if (searchClearBtn) searchClearBtn.style.display = 'none';
                updateAddToProjectChecklist();
            }, 300);
        }
    }
    
    if (closeBtn) closeBtn.addEventListener('click', cerrarModal);
    if (cancelBtn) cancelBtn.addEventListener('click', cerrarModal);
    
    // Guardar
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            await guardarBeneficiarioAProyecto();
        });
    }
    
    // Buscador de proyectos
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            if (query) {
                if (searchClearBtn) searchClearBtn.style.display = 'block';
                filterAddToProjectChecklist(query);
            } else {
                if (searchClearBtn) searchClearBtn.style.display = 'none';
                updateAddToProjectChecklist();
            }
        });
    }
    
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            this.style.display = 'none';
            updateAddToProjectChecklist();
        });
    }
    
    // Cargar proyectos al abrir
    if (modal) {
        const observer = new MutationObserver(function(mutations) {
            if (modal.style.display === 'flex') {
                loadProyectosParaAgregar();
            }
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
    }
}

// Función para mostrar modal de agregar a proyecto
function mostrarModalAgregarProyecto(beneficiarioId) {
    beneficiarioParaProyecto = beneficiarioId;
    const modal = document.getElementById('addToProjectModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        loadProyectosParaAgregar();
    }
    cerrarOpcionesEdicion();
}

// Variable para almacenar proyectos ya asociados al beneficiario
let proyectosYaAsociados = new Set();

// Función para cargar proyectos disponibles para agregar
async function loadProyectosParaAgregar() {
    if (!beneficiarioParaProyecto) return;
    
    try {
        // Cargar proyectos disponibles para el usuario
        const response = await fetch('/api/proyectos/usuario/');
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        if (data.success && data.proyectos) {
            proyectosData = data.proyectos;
            
            // Cargar proyectos ya asociados al beneficiario
            try {
                const detalleResponse = await fetch(`/api/beneficiario/${beneficiarioParaProyecto}/detalle/`);
                if (detalleResponse.ok) {
                    const detalleData = await detalleResponse.json();
                    if (detalleData.success && detalleData.beneficiario && detalleData.beneficiario.proyectos) {
                        proyectosYaAsociados.clear();
                        detalleData.beneficiario.proyectos.forEach(proyecto => {
                            proyectosYaAsociados.add(proyecto.id);
                        });
                    }
                }
            } catch (error) {
                console.error('Error al cargar proyectos asociados:', error);
            }
            
            updateAddToProjectChecklist();
        }
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        mostrarMensaje('error', 'Error al cargar proyectos');
    }
}

// Función para actualizar checklist de proyectos
function updateAddToProjectChecklist() {
    const checklist = document.getElementById('addToProjectChecklist');
    if (!checklist || !proyectosData) return;
    
    if (proyectosData.length === 0) {
        checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No hay proyectos disponibles</div>';
        return;
    }
    
    checklist.innerHTML = proyectosData.map(proyecto => {
        const isSelected = proyectosParaAgregar.has(proyecto.id);
        const yaAsociado = proyectosYaAsociados.has(proyecto.id);
        const isChecked = isSelected || yaAsociado;
        const isDisabled = yaAsociado; // Deshabilitar si ya está asociado
        
        return `
            <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 6px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; transition: background 0.2s; ${isChecked ? 'background: rgba(0, 123, 255, 0.1);' : ''} ${isDisabled ? 'opacity: 0.6;' : ''}"
                   onmouseover="this.style.background='${isDisabled ? 'rgba(0, 123, 255, 0.1)' : 'rgba(255,255,255,0.05)'}'"
                   onmouseout="this.style.background='${isChecked ? 'rgba(0, 123, 255, 0.1)' : 'transparent'}'">
                <input type="checkbox" value="${proyecto.id}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}
                       style="width: 18px; height: 18px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'};"
                       onchange="toggleProyectoParaAgregar('${proyecto.id}', this.checked)">
                <span style="color: #ffffff; flex: 1;">
                    ${proyecto.nombre || 'Sin nombre'}
                    ${yaAsociado ? '<span style="color: #28a745; font-size: 0.85rem; margin-left: 8px;">(Ya asociado)</span>' : ''}
                </span>
            </label>
        `;
    }).join('');
    
    updateAddToProjectSelectedCount();
    
    // Mostrar/ocultar campo de fecha según si hay proyectos seleccionados (solo los nuevos, no los ya asociados)
    const fechaContainer = document.getElementById('addToProjectFechaContainer');
    if (fechaContainer) {
        fechaContainer.style.display = proyectosParaAgregar.size > 0 ? 'block' : 'none';
    }
}

// Función para toggle de proyecto (necesita ser global para el onclick)
window.toggleProyectoParaAgregar = function(proyectoId, checked) {
    // No permitir desmarcar proyectos ya asociados
    if (proyectosYaAsociados.has(proyectoId)) {
        return;
    }
    
    if (checked) {
        proyectosParaAgregar.add(proyectoId);
    } else {
        proyectosParaAgregar.delete(proyectoId);
    }
    updateAddToProjectSelectedCount();
    
    // Mostrar/ocultar campo de fecha
    const fechaContainer = document.getElementById('addToProjectFechaContainer');
    if (fechaContainer) {
        fechaContainer.style.display = proyectosParaAgregar.size > 0 ? 'block' : 'none';
    }
}

// Función para actualizar contador
function updateAddToProjectSelectedCount() {
    const container = document.getElementById('addToProjectSelectedContainer');
    if (container) {
        const countNuevos = proyectosParaAgregar.size;
        const countAsociados = proyectosYaAsociados.size;
        const countSpan = container.querySelector('.selected-count');
        if (countSpan) {
            if (countAsociados > 0 && countNuevos > 0) {
                countSpan.textContent = `${countNuevos} proyecto(s) nuevo(s) seleccionado(s) | ${countAsociados} ya asociado(s)`;
            } else if (countAsociados > 0) {
                countSpan.textContent = `${countAsociados} proyecto(s) ya asociado(s)`;
            } else {
                countSpan.textContent = `${countNuevos} proyecto(s) seleccionado(s)`;
            }
        }
    }
}

// Función para filtrar proyectos
function filterAddToProjectChecklist(query) {
    const checklist = document.getElementById('addToProjectChecklist');
    if (!checklist || !proyectosData) return;
    
    const filtered = proyectosData.filter(p => 
        (p.nombre || '').toLowerCase().includes(query)
    );
    
    checklist.innerHTML = filtered.map(proyecto => {
        const isSelected = proyectosParaAgregar.has(proyecto.id);
        const yaAsociado = proyectosYaAsociados.has(proyecto.id);
        const isChecked = isSelected || yaAsociado;
        const isDisabled = yaAsociado;
        
        return `
            <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 6px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; transition: background 0.2s; ${isChecked ? 'background: rgba(0, 123, 255, 0.1);' : ''} ${isDisabled ? 'opacity: 0.6;' : ''}"
                   onmouseover="this.style.background='${isDisabled ? 'rgba(0, 123, 255, 0.1)' : 'rgba(255,255,255,0.05)'}'"
                   onmouseout="this.style.background='${isChecked ? 'rgba(0, 123, 255, 0.1)' : 'transparent'}'">
                <input type="checkbox" value="${proyecto.id}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}
                       style="width: 18px; height: 18px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'};"
                       onchange="toggleProyectoParaAgregar('${proyecto.id}', this.checked)">
                <span style="color: #ffffff; flex: 1;">
                    ${proyecto.nombre || 'Sin nombre'}
                    ${yaAsociado ? '<span style="color: #28a745; font-size: 0.85rem; margin-left: 8px;">(Ya asociado)</span>' : ''}
                </span>
            </label>
        `;
    }).join('');
}

// Función para guardar beneficiario a proyecto
async function guardarBeneficiarioAProyecto() {
    if (!beneficiarioParaProyecto) {
        mostrarMensaje('error', 'No hay beneficiario seleccionado');
        return;
    }
    
    // Filtrar solo proyectos nuevos (no los ya asociados)
    const proyectosNuevos = Array.from(proyectosParaAgregar).filter(p => !proyectosYaAsociados.has(p));
    
    if (proyectosNuevos.length === 0) {
        mostrarMensaje('info', 'No hay proyectos nuevos para agregar. El beneficiario ya está asociado a los proyectos seleccionados.');
        return;
    }
    
    const fechaAgregacion = document.getElementById('addToProjectFechaAgregacion');
    const fechaAgregacionValue = fechaAgregacion ? fechaAgregacion.value : null;
    const saveBtn = document.getElementById('saveAddToProjectBtn');
    const btnOriginalHTML = saveBtn ? saveBtn.innerHTML : '';
    
    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #ffffff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px;"></div> Guardando...';
        }
        
        // Agregar beneficiario a cada proyecto nuevo
        for (const proyectoId of proyectosNuevos) {
            const response = await fetch(`/api/beneficiario/${beneficiarioParaProyecto}/agregar-proyectos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    proyecto_ids: [proyectoId],
                    fecha_agregacion: fechaAgregacionValue || null
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al agregar beneficiario al proyecto');
            }
        }
        
        mostrarMensaje('success', `Beneficiario agregado exitosamente a ${proyectosNuevos.length} proyecto(s) nuevo(s)`);
        
        // Recargar proyectos asociados
        await loadProyectosParaAgregar();
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
            const modal = document.getElementById('addToProjectModal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                    proyectosParaAgregar.clear();
                    beneficiarioParaProyecto = null;
                    if (fechaAgregacion) fechaAgregacion.value = '';
                    const fechaContainer = document.getElementById('addToProjectFechaContainer');
                    if (fechaContainer) fechaContainer.style.display = 'none';
                }, 300);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error al agregar beneficiario a proyecto:', error);
        mostrarMensaje('error', error.message || 'Error al agregar beneficiario a proyecto');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = btnOriginalHTML;
        }
    }
}

function seleccionarBeneficiarioExistente(beneficiarioId) {
    // Esta función ya no se usa, pero la mantenemos por compatibilidad
    mostrarOpcionesEdicion(beneficiarioId);
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
    
    // Checkbox de solo con habilidades
    const filterSoloConHabilidades = document.getElementById('filterSoloConHabilidades');
    if (filterSoloConHabilidades) {
        filterSoloConHabilidades.addEventListener('change', function() {
            filters.soloConHabilidades = this.checked;
            applyFiltersAndSort();
        });
    }
    
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
    
    // Filtrar solo beneficiarios con habilidades
    if (filters.soloConHabilidades) {
        filtered = filtered.filter(b => {
            const atributos = b.atributos || [];
            return atributos.length > 0;
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
    } else if (sortOrder === 'habilidades') {
        // Ordenar por habilidades: primero los que tienen habilidades, agrupados por tipo de habilidad
        filtered.sort((a, b) => {
            const atributosA = a.atributos || [];
            const atributosB = b.atributos || [];
            
            // Si uno tiene habilidades y el otro no, el que tiene habilidades va primero
            if (atributosA.length > 0 && atributosB.length === 0) return -1;
            if (atributosA.length === 0 && atributosB.length > 0) return 1;
            
            // Si ambos tienen habilidades, agrupar por tipo de habilidad
            if (atributosA.length > 0 && atributosB.length > 0) {
                // Obtener el primer tipo de habilidad de cada uno
                const tipoA = atributosA[0]?.tipo_nombre || '';
                const tipoB = atributosB[0]?.tipo_nombre || '';
                const comparacionTipo = tipoA.localeCompare(tipoB);
                
                // Si tienen el mismo tipo, ordenar por valor
                if (comparacionTipo === 0) {
                    const valorA = atributosA[0]?.valor || '';
                    const valorB = atributosB[0]?.valor || '';
                    return valorA.localeCompare(valorB);
                }
                
                return comparacionTipo;
            }
            
            // Si ninguno tiene habilidades, mantener orden original
            return 0;
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
    } else if (sortOrder === 'habilidades') {
        renderGroupedByHabilidades(beneficiarios);
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
        item.addEventListener('click', function(e) {
            // No abrir modal si se hace clic en los botones
            if (e.target.closest('.btn-edit-beneficiario-listado') || e.target.closest('.btn-ver-info-beneficiario-listado')) {
                return;
            }
            const beneficiarioId = this.getAttribute('data-beneficiario-id');
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de editar
    container.querySelectorAll('.btn-edit-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const beneficiarioId = this.getAttribute('data-id');
            if (beneficiarioId) {
                mostrarOpcionesEdicion(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de ver información
    container.querySelectorAll('.btn-ver-info-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const beneficiarioId = this.getAttribute('data-id');
            console.log('Botón Ver Información clickeado, beneficiarioId:', beneficiarioId);
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            } else {
                console.error('No se encontró beneficiarioId en el botón');
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
        item.addEventListener('click', function(e) {
            // No abrir modal si se hace clic en los botones
            if (e.target.closest('.btn-edit-beneficiario-listado') || e.target.closest('.btn-ver-info-beneficiario-listado')) {
                return;
            }
            const beneficiarioId = this.getAttribute('data-beneficiario-id');
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de editar
    container.querySelectorAll('.btn-edit-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const beneficiarioId = this.getAttribute('data-id');
            if (beneficiarioId) {
                mostrarOpcionesEdicion(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de ver información
    container.querySelectorAll('.btn-ver-info-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const beneficiarioId = this.getAttribute('data-id');
            console.log('Botón Ver Información clickeado, beneficiarioId:', beneficiarioId);
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            } else {
                console.error('No se encontró beneficiarioId en el botón');
            }
        });
    });
}

function renderGroupedByHabilidades(beneficiarios) {
    const container = document.getElementById('beneficiariesList');
    if (!container) return;
    
    // Agrupar por habilidades
    const grouped = {};
    const sinHabilidades = [];
    
    beneficiarios.forEach(b => {
        const atributos = b.atributos || [];
        
        if (atributos.length === 0) {
            sinHabilidades.push(b);
        } else {
            // Agrupar por tipo de habilidad
            atributos.forEach(attr => {
                const tipoHabilidad = attr.tipo_nombre || 'Sin tipo';
                const valorHabilidad = attr.valor || 'Sin valor';
                const key = `${tipoHabilidad} - ${valorHabilidad}`;
                
                if (!grouped[key]) {
                    grouped[key] = {
                        tipo: tipoHabilidad,
                        valor: valorHabilidad,
                        beneficiarios: []
                    };
                }
                
                // Evitar duplicados
                if (!grouped[key].beneficiarios.find(bb => bb.id === b.id)) {
                    grouped[key].beneficiarios.push(b);
                }
            });
        }
    });
    
    // Construir HTML
    let html = '';
    
    // Mostrar grupos de habilidades ordenados
    Object.keys(grouped).sort().forEach(key => {
        const group = grouped[key];
        html += `
            <div class="habilidad-group" style="margin-bottom: 24px;">
                <h3 class="habilidad-group-title" style="padding: 12px 16px; background: rgba(255, 193, 7, 0.15); border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 12px; color: #ffc107; font-size: 1.1rem; font-weight: 600;">
                    ${group.tipo}: ${group.valor} <span style="color: #b8c5d1; font-size: 0.9rem; font-weight: 400;">(${group.beneficiarios.length} beneficiario${group.beneficiarios.length !== 1 ? 's' : ''})</span>
                </h3>
                <div style="display: grid; gap: 12px;">
                    ${group.beneficiarios.map(b => createBeneficiaryCard(b)).join('')}
                </div>
            </div>
        `;
    });
    
    // Mostrar beneficiarios sin habilidades al final
    if (sinHabilidades.length > 0) {
        html += `
            <div class="habilidad-group" style="margin-bottom: 24px;">
                <h3 class="habilidad-group-title" style="padding: 12px 16px; background: rgba(108, 117, 125, 0.15); border-left: 4px solid #6c757d; border-radius: 4px; margin-bottom: 12px; color: #6c757d; font-size: 1.1rem; font-weight: 600;">
                    Sin Habilidades Especiales <span style="color: #b8c5d1; font-size: 0.9rem; font-weight: 400;">(${sinHabilidades.length} beneficiario${sinHabilidades.length !== 1 ? 's' : ''})</span>
                </h3>
                <div style="display: grid; gap: 12px;">
                    ${sinHabilidades.map(b => createBeneficiaryCard(b)).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Agregar event listeners para abrir modal de detalles
    container.querySelectorAll('.beneficiary-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function(e) {
            // No abrir modal si se hace clic en los botones
            if (e.target.closest('.btn-edit-beneficiario-listado') || e.target.closest('.btn-ver-info-beneficiario-listado')) {
                return;
            }
            const beneficiarioId = this.getAttribute('data-beneficiario-id');
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de editar
    container.querySelectorAll('.btn-edit-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const beneficiarioId = this.getAttribute('data-id');
            if (beneficiarioId) {
                mostrarOpcionesEdicion(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de ver información
    container.querySelectorAll('.btn-ver-info-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const beneficiarioId = this.getAttribute('data-id');
            console.log('Botón Ver Información clickeado, beneficiarioId:', beneficiarioId);
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            } else {
                console.error('No se encontró beneficiarioId en el botón');
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
        item.addEventListener('click', function(e) {
            // No abrir modal si se hace clic en los botones
            if (e.target.closest('.btn-edit-beneficiario-listado') || e.target.closest('.btn-ver-info-beneficiario-listado')) {
                return;
            }
            const beneficiarioId = this.getAttribute('data-beneficiario-id');
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de editar
    container.querySelectorAll('.btn-edit-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const beneficiarioId = this.getAttribute('data-id');
            if (beneficiarioId) {
                mostrarOpcionesEdicion(beneficiarioId);
            }
        });
    });
    
    // Agregar event listeners para botones de ver información
    container.querySelectorAll('.btn-ver-info-beneficiario-listado').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const beneficiarioId = this.getAttribute('data-id');
            console.log('Botón Ver Información clickeado, beneficiarioId:', beneficiarioId);
            if (beneficiarioId) {
                openBeneficiaryDetailsModal(beneficiarioId);
            } else {
                console.error('No se encontró beneficiarioId en el botón');
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
    
    // Obtener atributos si existen
    const atributos = beneficiario.atributos || [];
    const tieneAtributos = atributos.length > 0;
    
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
            ${tieneAtributos ? `
            <div class="beneficiary-attributes" style="margin-top: 12px; padding: 12px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; border: 1px solid rgba(255, 193, 7, 0.3);">
                <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: #ffc107; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    Características Especiales:
                </p>
                <div class="beneficiary-attributes-list" style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${atributos.map(attr => `
                        <span class="attribute-tag" style="padding: 4px 10px; background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.4); border-radius: 12px; font-size: 0.8rem; color: #ffc107; font-weight: 500;">
                            <strong>${attr.tipo_nombre}:</strong> ${attr.valor}
                        </span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            ${proyectos.length > 0 ? `
            <div class="beneficiary-projects">
                <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: #6c757d;">Proyectos vinculados:</p>
                <div class="beneficiary-projects-list">
                    ${proyectos.map(p => `<span class="project-tag">${p.nombre || p}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            <div style="margin-top: 12px; display: flex; gap: 8px;">
                <button type="button" class="btn-ver-info-beneficiario-listado" data-id="${beneficiario.id}" style="flex: 1; padding: 8px 12px; background: rgba(40, 167, 69, 0.2); border: 1px solid rgba(40, 167, 69, 0.3); border-radius: 6px; color: #28a745; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s;" 
                        onmouseover="this.style.background='rgba(40, 167, 69, 0.3)';"
                        onmouseout="this.style.background='rgba(40, 167, 69, 0.2)';">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Ver Información
                </button>
                <button type="button" class="btn-edit-beneficiario-listado" data-id="${beneficiario.id}" style="flex: 1; padding: 8px 12px; background: rgba(0, 123, 255, 0.2); border: 1px solid rgba(0, 123, 255, 0.3); border-radius: 6px; color: #007bff; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s;" 
                        onmouseover="this.style.background='rgba(0, 123, 255, 0.3)';"
                        onmouseout="this.style.background='rgba(0, 123, 255, 0.2)';">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                </button>
            </div>
        </div>
    `;
}

// Función para abrir modal de agregar atributo
// Función para abrir modal de reinscripción a proyecto
async function abrirModalReinscribirProyecto(beneficiarioId) {
    if (!beneficiarioId || beneficiarioId === 'null' || beneficiarioId === 'undefined') {
        console.error('Error: ID de beneficiario inválido:', beneficiarioId);
        mostrarMensaje('error', 'Error: ID de beneficiario inválido');
        return;
    }
    
    const modal = document.getElementById('reinscribirProyectoModal');
    if (!modal) {
        console.error('Error: Modal de reinscripción no encontrado');
        return;
    }
    
    // Guardar el ID del beneficiario en el modal
    modal.setAttribute('data-beneficiario-id', beneficiarioId);
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Cargar proyectos asociados
    await cargarProyectosAsociadosParaReinscripcion(beneficiarioId);
}

// Función para cerrar modal de reinscripción
function cerrarModalReinscribirProyecto() {
    const modal = document.getElementById('reinscribirProyectoModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            // Limpiar contenido
            const content = document.getElementById('reinscribirProyectoContent');
            if (content) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6c757d;">
                        <div class="spinner" style="border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                        <p>Cargando proyectos asociados...</p>
                    </div>
                `;
            }
        }, 300);
    }
}

// Función para cargar proyectos asociados al beneficiario
async function cargarProyectosAsociadosParaReinscripcion(beneficiarioId) {
    const content = document.getElementById('reinscribirProyectoContent');
    if (!content) return;
    
    try {
        // Obtener datos del beneficiario con proyectos
        const response = await fetch(`/api/beneficiario/${beneficiarioId}/detalle/`);
        if (!response.ok) {
            throw new Error('Error al cargar datos del beneficiario');
        }
        const data = await response.json();
        
        if (!data.success || !data.beneficiario) {
            throw new Error('Formato de respuesta inválido');
        }
        
        const beneficiario = data.beneficiario;
        const proyectos = beneficiario.proyectos || [];
        
        if (proyectos.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p style="margin: 0; font-size: 1.1rem; color: #ffffff;">Este beneficiario no está asociado a ningún proyecto</p>
                    <small style="display: block; margin-top: 8px;">Primero debe agregar el beneficiario a un proyecto</small>
                </div>
            `;
            return;
        }
        
        // Renderizar lista de proyectos
        let html = `
            <div style="margin-bottom: 20px;">
                <p style="color: #b8c5d1; font-size: 0.9rem; margin: 0 0 16px 0;">Selecciona un proyecto para reinscribir al beneficiario en un año diferente:</p>
            </div>
            <div style="display: grid; gap: 12px;">
        `;
        
        proyectos.forEach((proyecto, index) => {
            const fechaAgregacion = proyecto.fecha_agregacion ? new Date(proyecto.fecha_agregacion) : null;
            const fechaReinscripcion = proyecto.fecha_reinscripcion ? new Date(proyecto.fecha_reinscripcion) : null;
            
            // Obtener años ya usados (solo el año de inscripción original, no el año actual)
            const añosUsados = new Set();
            if (fechaAgregacion) {
                añosUsados.add(fechaAgregacion.getFullYear()); // Solo prohibir el año de inscripción original
            }
            // No agregamos el año actual ni años de reinscripción previos como restricción
            
            html += `
                <div class="proyecto-reinscripcion-item" style="padding: 16px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                    <div style="flex: 1;">
                        <h4 style="color: #ffffff; font-size: 1rem; font-weight: 600; margin: 0 0 8px 0;">${proyecto.nombre}</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.85rem; color: #6c757d;">
                            ${fechaAgregacion ? `<span>Inscrito: ${fechaAgregacion.getFullYear()}</span>` : ''}
                            ${fechaReinscripcion ? `<span>Reinscrito: ${fechaReinscripcion.getFullYear()}</span>` : ''}
                        </div>
                    </div>
                    <button type="button" class="btn-secondary btn-reinscribir-proyecto" 
                            data-proyecto-id="${proyecto.id}" 
                            data-proyecto-nombre="${proyecto.nombre.replace(/"/g, '&quot;')}"
                            data-años-usados='${JSON.stringify(Array.from(añosUsados))}'
                            style="padding: 10px 16px; font-size: 0.9rem; white-space: nowrap; background: rgba(0, 123, 255, 0.2); border-color: rgba(0, 123, 255, 0.4); color: #4dabf7;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Reinscribir
                    </button>
                </div>
            `;
        });
        
        html += `</div>`;
        
        content.innerHTML = html;
        
        // Agregar event listeners a los botones de reinscripción
        document.querySelectorAll('.btn-reinscribir-proyecto').forEach(btn => {
            btn.addEventListener('click', function() {
                const proyectoId = this.dataset.proyectoId;
                const proyectoNombre = this.dataset.proyectoNombre;
                const añosUsados = JSON.parse(this.dataset.añosUsados || '[]');
                mostrarFormularioReinscripcion(proyectoId, proyectoNombre, añosUsados);
            });
        });
        
    } catch (error) {
        console.error('Error cargando proyectos asociados:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc3545;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p style="margin: 0; font-size: 1.1rem; color: #dc3545;">Error al cargar proyectos asociados</p>
                <small style="display: block; margin-top: 8px;">${error.message}</small>
            </div>
        `;
    }
}

// Función para mostrar formulario de reinscripción
function mostrarFormularioReinscripcion(proyectoId, proyectoNombre, añosUsados) {
    const content = document.getElementById('reinscribirProyectoContent');
    if (!content) return;
    
    // Obtener año actual para establecer como valor por defecto
    const añoActual = new Date().getFullYear();
    const mesActual = String(new Date().getMonth() + 1).padStart(2, '10');
    const díaActual = String(new Date().getDate()).padStart(2, '01');
    
    // Usar el año actual como valor por defecto (ya no está restringido)
    const fechaPorDefecto = `${añoActual}-${mesActual}-${díaActual}`;
    
    // Construir mensaje de años no disponibles
    let mensajeAñosNoDisponibles = '';
    if (añosUsados.length > 0) {
        mensajeAñosNoDisponibles = `Año no disponible: ${añosUsados.join(', ')} (año de inscripción original). Puedes reinscribir en cualquier otro año, incluyendo el año actual.`;
    } else {
        mensajeAñosNoDisponibles = 'Puedes reinscribir en cualquier año, incluyendo el año actual.';
    }
    
    const html = `
        <div style="margin-bottom: 20px;">
            <button type="button" id="volverListaProyectosBtn" class="btn-secondary" style="padding: 8px 16px; font-size: 0.9rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                Volver a lista de proyectos
            </button>
            <h4 style="color: #ffffff; font-size: 1.1rem; font-weight: 600; margin: 0 0 8px 0;">Reinscribir en: ${proyectoNombre}</h4>
            <p style="color: #6c757d; font-size: 0.9rem; margin: 0;">Selecciona la fecha de reinscripción. El año debe ser diferente al año de inscripción original.</p>
        </div>
        <form id="formReinscripcionProyecto">
            <input type="hidden" id="reinscripcionProyectoId" value="${proyectoId}">
            <div class="form-group">
                <label for="reinscripcionFecha" class="form-label">Fecha de Reinscripción *</label>
                <input type="date" id="reinscripcionFecha" class="form-input" value="${fechaPorDefecto}" required>
                <small style="color: #6c757d; display: block; margin-top: 4px;">
                    ${mensajeAñosNoDisponibles}
                </small>
            </div>
            <div id="reinscripcionFechaError" style="display: none; padding: 12px; background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 8px; margin-top: 12px; color: #dc3545; font-size: 0.9rem;"></div>
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" id="cancelarReinscripcionBtn" class="btn-secondary">Cancelar</button>
                <button type="button" id="guardarReinscripcionBtn" class="btn-primary">Guardar Reinscripción</button>
            </div>
        </form>
    `;
    
    content.innerHTML = html;
    
    // Event listeners
    const volverBtn = document.getElementById('volverListaProyectosBtn');
    if (volverBtn) {
        volverBtn.addEventListener('click', async () => {
            const modal = document.getElementById('reinscribirProyectoModal');
            const beneficiarioId = modal ? modal.getAttribute('data-beneficiario-id') : null;
            if (beneficiarioId) {
                await cargarProyectosAsociadosParaReinscripcion(beneficiarioId);
            }
        });
    }
    
    const cancelarBtn = document.getElementById('cancelarReinscripcionBtn');
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', async () => {
            const modal = document.getElementById('reinscribirProyectoModal');
            const beneficiarioId = modal ? modal.getAttribute('data-beneficiario-id') : null;
            if (beneficiarioId) {
                await cargarProyectosAsociadosParaReinscripcion(beneficiarioId);
            }
        });
    }
    
    const fechaInput = document.getElementById('reinscripcionFecha');
    const errorDiv = document.getElementById('reinscripcionFechaError');
    
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            validarFechaReinscripcion(this.value, añosUsados, errorDiv);
        });
    }
    
    const guardarBtn = document.getElementById('guardarReinscripcionBtn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', async function() {
            const fecha = fechaInput.value;
            if (!fecha) {
                mostrarMensaje('error', 'Por favor selecciona una fecha');
                return;
            }
            
            if (!validarFechaReinscripcion(fecha, añosUsados, errorDiv)) {
                return;
            }
            
            await guardarReinscripcion(proyectoId, fecha);
        });
    }
}

// Función para validar fecha de reinscripción
function validarFechaReinscripcion(fecha, añosUsados, errorDiv) {
    if (!fecha) {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        return false;
    }
    
    const fechaSeleccionada = new Date(fecha);
    const añoSeleccionado = fechaSeleccionada.getFullYear();
    
    let error = null;
    
    // Solo validar que no sea el año de inscripción original
    if (añosUsados.includes(añoSeleccionado)) {
        error = `El año ${añoSeleccionado} es el año de inscripción original. No puedes reinscribir en el mismo año. Selecciona un año diferente.`;
    }
    
    if (error && errorDiv) {
        errorDiv.textContent = error;
        errorDiv.style.display = 'block';
        return false;
    }
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    return true;
}

// Función para guardar la reinscripción
async function guardarReinscripcion(proyectoId, fecha) {
    const modal = document.getElementById('reinscribirProyectoModal');
    const beneficiarioId = modal ? modal.getAttribute('data-beneficiario-id') : null;
    
    if (!beneficiarioId) {
        mostrarMensaje('error', 'Error: No se encontró el ID del beneficiario');
        return;
    }
    
    try {
        mostrarMensaje('info', 'Guardando reinscripción...');
        
        const response = await fetch(`/api/beneficiario/${beneficiarioId}/agregar-proyectos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                proyecto_ids: [proyectoId],
                fecha_agregacion: fecha
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'Error al guardar la reinscripción';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Si no se puede parsear el JSON, usar el mensaje de estado
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Error al procesar la respuesta del servidor');
        }
        
        if (data.success) {
            mostrarMensaje('success', 'Reinscripción guardada exitosamente');
            cerrarModalReinscribirProyecto();
            
            // Recargar datos del beneficiario si está en la vista de detalles
            if (beneficiarioEditando === beneficiarioId) {
                // Recargar detalles del beneficiario si la función existe
                if (typeof mostrarDetallesBeneficiario === 'function') {
                    setTimeout(() => {
                        mostrarDetallesBeneficiario(beneficiarioId);
                    }, 500);
                }
            }
            
            // Recargar listado de beneficiarios si está visible
            if (currentView === 'listBeneficiariesView') {
                setTimeout(() => {
                    cargarBeneficiarios();
                }, 500);
            }
        } else {
            throw new Error(data.error || 'Error al guardar la reinscripción');
        }
        
    } catch (error) {
        console.error('Error guardando reinscripción:', error);
        const errorMessage = error.message || 'Error desconocido al guardar la reinscripción';
        mostrarMensaje('error', 'Error al guardar la reinscripción: ' + errorMessage);
    }
}

async function abrirModalAgregarAtributo(beneficiarioId) {
    if (!beneficiarioId || beneficiarioId === 'null' || beneficiarioId === 'undefined') {
        console.error('Error: ID de beneficiario inválido:', beneficiarioId);
        mostrarMensaje('error', 'Error: ID de beneficiario inválido');
        return;
    }
    
    const modal = document.getElementById('addAtributoModal');
    if (!modal) {
        console.error('Error: Modal de agregar atributo no encontrado');
        return;
    }
    
    // Guardar el ID del beneficiario en el modal
    modal.setAttribute('data-beneficiario-id', beneficiarioId);
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Cargar tipos de atributos
    await cargarTiposAtributos();
    
    // Cargar atributos existentes del beneficiario
    await cargarAtributosBeneficiario(beneficiarioId);
}

// Función para cargar tipos de atributos
async function cargarTiposAtributos() {
    const select = document.getElementById('atributoTipoSelect');
    if (!select) return;
    
    try {
        const response = await fetch('/api/atributos/tipos/');
        if (!response.ok) {
            throw new Error('Error al cargar tipos de atributos');
        }
        
        const data = await response.json();
        if (data.success && data.tipos) {
            select.innerHTML = '<option value="">Seleccione un tipo...</option>';
            data.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando tipos de atributos:', error);
        mostrarMensaje('error', 'Error al cargar tipos de atributos');
    }
}

// Función para cargar atributos existentes del beneficiario
async function cargarAtributosBeneficiario(beneficiarioId) {
    if (!beneficiarioId || beneficiarioId === 'null' || beneficiarioId === 'undefined') {
        console.error('Error: ID de beneficiario inválido para cargar atributos:', beneficiarioId);
        const container = document.getElementById('atributosExistentesList');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545; width: 100%;">Error: ID de beneficiario inválido</div>';
        }
        return;
    }
    
    const container = document.getElementById('atributosExistentesList');
    if (!container) return;
    
    try {
        const url = `/api/beneficiario/${beneficiarioId}/atributos/`;
        if (!url || url.includes('null') || url.includes('undefined')) {
            throw new Error('URL inválida para cargar atributos');
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al cargar atributos');
        }
        
        const data = await response.json();
        if (data.success && data.atributos) {
            if (data.atributos.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d; width: 100%;">Este beneficiario no tiene atributos asignados aún</div>';
            } else {
                container.innerHTML = data.atributos.map(attr => `
                    <div class="attribute-tag-existing" style="padding: 8px 12px; background: rgba(255, 193, 7, 0.15); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; font-size: 0.85rem; color: #ffc107; display: flex; align-items: center; gap: 8px;">
                        <strong>${attr.tipo_nombre}:</strong> ${attr.valor}
                        <button type="button" class="btn-eliminar-atributo" data-id="${attr.id}" style="background: rgba(220, 53, 69, 0.2); border: 1px solid rgba(220, 53, 69, 0.4); border-radius: 4px; color: #dc3545; padding: 2px 6px; cursor: pointer; font-size: 0.75rem; margin-left: 4px;" title="Eliminar">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `).join('');
                
                // Agregar event listeners para botones de eliminar
                container.querySelectorAll('.btn-eliminar-atributo').forEach(btn => {
                    btn.addEventListener('click', async function(e) {
                        e.stopPropagation();
                        const atributoId = this.getAttribute('data-id');
                        if (atributoId && confirm('¿Estás seguro de que deseas eliminar este atributo?')) {
                            await eliminarAtributo(atributoId, beneficiarioId);
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error cargando atributos:', error);
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545; width: 100%;">Error al cargar atributos</div>';
    }
}

// Función para eliminar atributo
async function eliminarAtributo(atributoId, beneficiarioId) {
    try {
        const response = await fetch(`/api/atributos/${atributoId}/eliminar/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar atributo');
        }
        
        const data = await response.json();
        if (data.success) {
            mostrarMensaje('success', 'Atributo eliminado exitosamente');
            // Recargar atributos
            await cargarAtributosBeneficiario(beneficiarioId);
        } else {
            mostrarMensaje('error', data.error || 'Error al eliminar atributo');
        }
    } catch (error) {
        console.error('Error eliminando atributo:', error);
        mostrarMensaje('error', 'Error al eliminar atributo');
    }
}

// Inicializar modal de agregar atributo
function inicializarModalAgregarAtributo() {
    const modal = document.getElementById('addAtributoModal');
    const closeBtn = document.getElementById('closeAddAtributoModal');
    const cancelBtn = document.getElementById('cancelAddAtributoBtn');
    const saveBtn = document.getElementById('saveAddAtributoBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalAgregarAtributo);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cerrarModalAgregarAtributo);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalAgregarAtributo();
            }
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const beneficiarioId = modal.getAttribute('data-beneficiario-id');
            if (!beneficiarioId || beneficiarioId === 'null' || beneficiarioId === 'undefined') {
                mostrarMensaje('error', 'Error: No se encontró el beneficiario o ID inválido');
                return;
            }
            
            const tipoSelect = document.getElementById('atributoTipoSelect');
            const valorInput = document.getElementById('atributoValor');
            const descripcionInput = document.getElementById('atributoDescripcion');
            
            if (!tipoSelect || !valorInput) {
                mostrarMensaje('error', 'Error: Campos no encontrados');
                return;
            }
            
            const tipoId = tipoSelect.value;
            const valor = valorInput.value.trim();
            const descripcion = descripcionInput ? descripcionInput.value.trim() : '';
            
            if (!tipoId || !valor) {
                mostrarMensaje('error', 'Por favor completa todos los campos obligatorios');
                return;
            }
            
            // Deshabilitar botón mientras se guarda
            saveBtn.disabled = true;
            saveBtn.innerHTML = 'Guardando...';
            
            try {
                const url = `/api/beneficiario/${beneficiarioId}/atributos/agregar/`;
                if (!url || url.includes('null') || url.includes('undefined')) {
                    throw new Error('URL inválida para agregar atributo');
                }
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        atributo_tipo_id: tipoId,
                        valor: valor,
                        descripcion: descripcion || null
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al agregar atributo');
                }
                
                const data = await response.json();
                if (data.success) {
                    mostrarMensaje('success', 'Atributo agregado exitosamente');
                    
                    // Limpiar formulario
                    if (tipoSelect) tipoSelect.value = '';
                    if (valorInput) valorInput.value = '';
                    if (descripcionInput) descripcionInput.value = '';
                    
                    // Recargar atributos
                    await cargarAtributosBeneficiario(beneficiarioId);
                    
                    // Recargar listado de beneficiarios si estamos en esa vista
                    if (currentView === 'listBeneficiariesView') {
                        await loadBeneficiariosList();
                    }
                } else {
                    mostrarMensaje('error', data.error || 'Error al agregar atributo');
                }
            } catch (error) {
                console.error('Error agregando atributo:', error);
                mostrarMensaje('error', error.message || 'Error al agregar atributo');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Agregar Atributo';
            }
        });
    }
}

function cerrarModalAgregarAtributo() {
    const modal = document.getElementById('addAtributoModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            // Limpiar formulario
            const form = document.getElementById('addAtributoForm');
            if (form) form.reset();
        }, 300);
    }
}

async function openBeneficiaryDetailsModal(beneficiarioId) {
    console.log('openBeneficiaryDetailsModal llamado con ID:', beneficiarioId);
    const modal = document.getElementById('beneficiaryDetailsModal');
    const content = document.getElementById('beneficiaryDetailsContent');
    
    if (!modal || !content) {
        console.error('Modal o contenido no encontrado. Modal:', modal, 'Content:', content);
        return;
    }
    
    console.log('Abriendo modal...');
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => {
        if (modal) {
            modal.classList.add('show');
        }
    }, 10);
    
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
            const atributos = b.atributos || [];
            const foto_url = b.foto_url || null;
            
            let nombre = b.nombre || 'Sin nombre';
            const tipo = (b.tipo || '').toLowerCase();
            
            // Foto del beneficiario (solo para individuales)
            let fotoHTML = '';
            if (tipo === 'individual') {
                fotoHTML = `
                    <div class="detail-section">
                        <h4 class="section-title">Foto del Beneficiario</h4>
                        <div style="text-align: center; margin: 20px 0;">
                            ${foto_url ? `
                                <div id="fotoActualContainer" style="margin-bottom: 20px;">
                                    <img id="fotoActualImg" src="${foto_url}" alt="Foto del beneficiario" style="max-width: 300px; max-height: 300px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); box-shadow: 0 4px 8px rgba(0,0,0,0.2); margin-bottom: 12px;">
                                    <div>
                                        <button type="button" id="btnEliminarFoto" class="btn-danger" style="padding: 8px 16px; background: rgba(220, 53, 69, 0.2); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 6px; color: #dc3545; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;" 
                                                onmouseover="this.style.background='rgba(220, 53, 69, 0.3)';"
                                                onmouseout="this.style.background='rgba(220, 53, 69, 0.2)';">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            Eliminar Foto
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div id="fotoActualContainer" style="display: none; margin-bottom: 20px;">
                                    <img id="fotoActualImg" src="" alt="Foto del beneficiario" style="max-width: 300px; max-height: 300px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); box-shadow: 0 4px 8px rgba(0,0,0,0.2); margin-bottom: 12px;">
                                    <div>
                                        <button type="button" id="btnEliminarFoto" class="btn-danger" style="padding: 8px 16px; background: rgba(220, 53, 69, 0.2); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 6px; color: #dc3545; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
                                            Eliminar Foto
                                        </button>
                                    </div>
                                </div>
                            `}
                            <div style="margin-top: 20px;">
                                <label for="fotoInputModal" style="display: block; margin-bottom: 8px; color: rgba(255,255,255,0.9); font-weight: 500;">${foto_url ? 'Cambiar Foto' : 'Subir Foto'}</label>
                                <input type="file" id="fotoInputModal" accept="image/jpeg,image/png,image/gif,image/webp" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #ffffff; width: 100%; max-width: 400px; margin: 0 auto; display: block;">
                                <small style="display: block; margin-top: 8px; color: #6c757d; text-align: center;">Solo imágenes (JPEG, PNG, GIF, WEBP). Tamaño máximo: 5MB</small>
                                <div id="fotoPreviewModal" style="margin-top: 12px; display: none;">
                                    <img id="fotoPreviewImgModal" src="" alt="Vista previa" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); margin: 0 auto; display: block;">
                                </div>
                                <button type="button" id="btnSubirFoto" style="margin-top: 12px; padding: 10px 20px; background: rgba(40, 167, 69, 0.2); border: 1px solid rgba(40, 167, 69, 0.3); border-radius: 6px; color: #28a745; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s; display: none;"
                                        onmouseover="this.style.background='rgba(40, 167, 69, 0.3)';"
                                        onmouseout="this.style.background='rgba(40, 167, 69, 0.2)';">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    Subir Foto
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            let detallesHTML = '';
            if (tipo === 'individual') {
                const nombres = [
                    detalles.primer_nombre || '',
                    detalles.segundo_nombre || '',
                    detalles.tercer_nombre || ''
                ].filter(n => n).join(' ');
                const apellidos = [
                    detalles.primer_apellido || '',
                    detalles.segundo_apellido || ''
                ].filter(a => a).join(' ');
                const apellidoCasada = detalles.apellido_casada || '';
                
                detallesHTML = `
                    <div class="detail-section">
                        <h4 class="section-title">Información Personal</h4>
                        <div class="detail-grid">
                            <div class="detail-item"><strong>Nombre(s):</strong> <span>${nombres || detalles.nombre || 'N/A'}</span></div>
                            <div class="detail-item"><strong>Apellido(s):</strong> <span>${apellidos || detalles.apellido || 'N/A'}</span></div>
                            ${apellidoCasada ? `<div class="detail-item"><strong>Apellido de Casada:</strong> <span>${apellidoCasada}</span></div>` : ''}
                            <div class="detail-item"><strong>DPI:</strong> <span>${detalles.dpi || 'N/A'}</span></div>
                            <div class="detail-item"><strong>Teléfono:</strong> <span>${detalles.telefono || 'N/A'}</span></div>
                            <div class="detail-item"><strong>Género:</strong> <span>${detalles.genero || 'N/A'}</span></div>
                            ${detalles.fecha_nacimiento ? `<div class="detail-item"><strong>Fecha de Nacimiento:</strong> <span>${new Date(detalles.fecha_nacimiento).toLocaleDateString('es-GT')}</span></div>` : ''}
                            ${detalles.fecha_registro ? `<div class="detail-item"><strong>Fecha de Registro:</strong> <span>${new Date(detalles.fecha_registro).toLocaleDateString('es-GT')}</span></div>` : ''}
                            ${detalles.comunidad_linguistica ? `<div class="detail-item"><strong>Comunidad Lingüística:</strong> <span>${detalles.comunidad_linguistica}</span></div>` : ''}
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
            
            // Atributos (solo para individuales)
            let atributosHTML = '';
            if (tipo === 'individual' && atributos.length > 0) {
                atributosHTML = `
                    <div class="detail-section">
                        <h4 class="section-title">Habilidades y Características Especiales</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                            ${atributos.map(attr => `
                                <div style="padding: 8px 12px; background: rgba(255, 193, 7, 0.15); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; font-size: 0.9rem; color: #ffc107;">
                                    <strong>${attr.tipo_nombre}:</strong> ${attr.valor}
                                    ${attr.descripcion ? `<br><small style="color: rgba(255,255,255,0.7);">${attr.descripcion}</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            // Proyectos con más detalles
            let proyectosHTML = '';
            if (proyectos.length > 0) {
                proyectosHTML = `
                    <div class="detail-section">
                        <h4 class="section-title">Proyectos Vinculados (${proyectos.length})</h4>
                        <div style="display: grid; gap: 16px; margin-top: 12px;">
                            ${proyectos.map(p => `
                                <div style="padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                                    <h5 style="margin: 0 0 8px 0; color: #ffffff; font-size: 1rem; font-weight: 600;">${p.nombre || 'Sin nombre'}</h5>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.9rem; color: rgba(255,255,255,0.8);">
                                        ${p.tipo ? `<div><strong>Tipo:</strong> ${p.tipo}</div>` : ''}
                                        ${p.fecha ? `<div><strong>Fecha del Proyecto:</strong> ${new Date(p.fecha).toLocaleDateString('es-GT')}</div>` : ''}
                                        ${p.comunidad ? `<div><strong>Comunidad:</strong> ${p.comunidad}</div>` : ''}
                                        ${p.fecha_agregacion ? `<div><strong>Agregado al Proyecto:</strong> ${new Date(p.fecha_agregacion).toLocaleDateString('es-GT')}</div>` : ''}
                                    </div>
                                    ${p.descripcion ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 0.85rem;">${p.descripcion}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                proyectosHTML = '<div class="detail-section"><p style="color: #6c757d;">Este beneficiario no está vinculado a ningún proyecto.</p></div>';
            }
            
            content.innerHTML = `
                ${fotoHTML}
                <div class="detail-section">
                    <h4 class="section-title">Información General</h4>
                    <div class="detail-grid">
                        <div class="detail-item"><strong>Tipo:</strong> <span>${b.tipo_display || tipo}</span></div>
                        <div class="detail-item"><strong>Comunidad:</strong> <span>${b.comunidad_nombre || 'N/A'}</span></div>
                        ${b.comunidad_codigo ? `<div class="detail-item"><strong>Código de Comunidad:</strong> <span>${b.comunidad_codigo}</span></div>` : ''}
                        ${b.region_nombre ? `<div class="detail-item"><strong>Región:</strong> <span>${b.region_nombre}</span></div>` : ''}
                        ${b.region_sede ? `<div class="detail-item"><strong>Sede Regional:</strong> <span>${b.region_sede}</span></div>` : ''}
                        ${b.creado_en ? `<div class="detail-item"><strong>Fecha de Registro en Sistema:</strong> <span>${new Date(b.creado_en).toLocaleString('es-GT')}</span></div>` : ''}
                        ${b.actualizado_en ? `<div class="detail-item"><strong>Última Actualización:</strong> <span>${new Date(b.actualizado_en).toLocaleString('es-GT')}</span></div>` : ''}
                    </div>
                </div>
                ${detallesHTML}
                ${atributosHTML}
                ${proyectosHTML}
            `;
            
            // Configurar event listeners para la foto (solo para individuales)
            if (tipo === 'individual') {
                setupFotoModalHandlers(beneficiarioId);
            }
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
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function setupFotoModalHandlers(beneficiarioId) {
    const fotoInput = document.getElementById('fotoInputModal');
    const fotoPreview = document.getElementById('fotoPreviewModal');
    const fotoPreviewImg = document.getElementById('fotoPreviewImgModal');
    const btnSubirFoto = document.getElementById('btnSubirFoto');
    const btnEliminarFoto = document.getElementById('btnEliminarFoto');
    const fotoActualContainer = document.getElementById('fotoActualContainer');
    const fotoActualImg = document.getElementById('fotoActualImg');
    
    if (!fotoInput || !btnSubirFoto) return;
    
    // Preview cuando se selecciona una foto
    fotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                mostrarMensaje('error', 'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
                e.target.value = '';
                return;
            }
            
            // Validar tamaño (5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                mostrarMensaje('error', 'El archivo es demasiado grande. El tamaño máximo es 5MB');
                e.target.value = '';
                return;
            }
            
            // Mostrar preview
            const reader = new FileReader();
            reader.onload = function(e) {
                if (fotoPreviewImg) fotoPreviewImg.src = e.target.result;
                if (fotoPreview) fotoPreview.style.display = 'block';
                if (btnSubirFoto) btnSubirFoto.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Subir foto
    btnSubirFoto.addEventListener('click', async function() {
        const file = fotoInput.files[0];
        if (!file) {
            mostrarMensaje('error', 'Por favor selecciona una imagen');
            return;
        }
        
        const formData = new FormData();
        formData.append('foto', file);
        
        btnSubirFoto.disabled = true;
        btnSubirFoto.innerHTML = '<div class="spinner" style="border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #28a745; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px;"></div> Subiendo...';
        
        try {
            const response = await fetch(`/api/beneficiario/${beneficiarioId}/foto/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarMensaje('success', 'Foto subida exitosamente');
                
                // Actualizar imagen actual
                if (fotoActualImg && data.foto_url) {
                    fotoActualImg.src = data.foto_url;
                }
                if (fotoActualContainer) {
                    fotoActualContainer.style.display = 'block';
                }
                
                // Limpiar preview y input
                if (fotoInput) fotoInput.value = '';
                if (fotoPreview) fotoPreview.style.display = 'none';
                if (btnSubirFoto) btnSubirFoto.style.display = 'none';
            } else {
                mostrarMensaje('error', data.error || 'Error al subir la foto');
            }
        } catch (error) {
            console.error('Error al subir foto:', error);
            mostrarMensaje('error', 'Error al subir la foto');
        } finally {
            btnSubirFoto.disabled = false;
            btnSubirFoto.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Subir Foto
            `;
        }
    });
    
    // Eliminar foto
    if (btnEliminarFoto) {
        btnEliminarFoto.addEventListener('click', async function() {
            if (!confirm('¿Estás seguro de que deseas eliminar la foto del beneficiario?')) {
                return;
            }
            
            btnEliminarFoto.disabled = true;
            btnEliminarFoto.innerHTML = 'Eliminando...';
            
            try {
                const response = await fetch(`/api/beneficiario/${beneficiarioId}/foto/eliminar/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('success', 'Foto eliminada exitosamente');
                    
                    // Ocultar imagen actual
                    if (fotoActualContainer) {
                        fotoActualContainer.style.display = 'none';
                    }
                    
                    // Cambiar texto del input
                    const label = fotoInput.previousElementSibling;
                    if (label && label.tagName === 'LABEL') {
                        label.textContent = 'Subir Foto';
                    }
                } else {
                    mostrarMensaje('error', data.error || 'Error al eliminar la foto');
                }
            } catch (error) {
                console.error('Error al eliminar foto:', error);
                mostrarMensaje('error', 'Error al eliminar la foto');
            } finally {
                btnEliminarFoto.disabled = false;
                btnEliminarFoto.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Eliminar Foto
                `;
            }
        });
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
    // Resetear filtros
    filters = {
        tipoBeneficiario: ['individual', 'familia', 'institución', 'otro'],
        comunidad: [],
        evento: [],
        soloConHabilidades: false
    };
    
    // Resetear checkboxes de tipo
    const filterTipoCheckboxes = document.querySelectorAll('#filterTipoBeneficiario input[type="checkbox"]');
    filterTipoCheckboxes.forEach(cb => {
        cb.checked = true;
    });
    
    // Resetear checkbox de solo con habilidades
    const filterSoloConHabilidades = document.getElementById('filterSoloConHabilidades');
    if (filterSoloConHabilidades) {
        filterSoloConHabilidades.checked = false;
    }
    
    // Resetear otros filtros
    filters.comunidad = [];
    filters.evento = [];
    
    // Limpiar tags de comunidades
    const comunidadesTags = document.getElementById('selectedComunidadesTags');
    if (comunidadesTags) {
        comunidadesTags.innerHTML = '';
    }
    
    // Limpiar tags de eventos
    const eventosTags = document.getElementById('selectedEventosListadoTags');
    if (eventosTags) {
        eventosTags.innerHTML = '';
    }
    
    // Limpiar búsqueda de comunidad
    const searchComunidad = document.getElementById('searchComunidadListado');
    if (searchComunidad) {
        searchComunidad.value = '';
    }
    
    // Limpiar búsqueda de evento
    const searchEvento = document.getElementById('searchEventoListado');
    if (searchEvento) {
        searchEvento.value = '';
    }
    
    // Aplicar filtros
    applyFiltersAndSort();
}

function resetFiltersOld() {
    filters = {
        tipoBeneficiario: ['individual', 'familia', 'institución', 'otro'],
        comunidad: [],
        evento: [],
        soloConHabilidades: false
    };
    
    // Resetear checkboxes
    document.querySelectorAll('#filterTipoBeneficiario input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
    
    // Resetear checkbox de solo con habilidades
    const filterSoloConHabilidades = document.getElementById('filterSoloConHabilidades');
    if (filterSoloConHabilidades) {
        filterSoloConHabilidades.checked = false;
    }
    
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

// ======================================
// FUNCIONES PARA COMPARACIONES Y REPORTES
// ======================================

let comparisonGroups = []; // Array para almacenar los grupos de comparación

// Inicializar formulario de comparación
function initializeComparisonForm() {
    comparisonGroups = [0]; // Inicializar con un grupo
    populateYearsForComparison();
    
    // Cargar proyectos para todos los grupos existentes
    const existingGroups = document.querySelectorAll('.comparison-group');
    existingGroups.forEach(group => {
        const groupIndex = parseInt(group.dataset.groupIndex);
        loadProjectsForGroup(groupIndex);
        setupGroupProjectSearch(groupIndex);
    });
    
    // Configurar botón para agregar grupos
    const addGroupBtn = document.getElementById('addComparisonGroupBtn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', addComparisonGroup);
    }
    
    // Configurar botones de eliminar grupos
    document.querySelectorAll('.remove-comparison-group-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.closest('.comparison-group');
            if (group) {
                const groupIndex = parseInt(group.dataset.groupIndex);
                removeComparisonGroup(groupIndex);
            }
        });
    });
    
    // Actualizar visibilidad inicial de botones de eliminar
    updateRemoveButtonsVisibility();
}

// Poblar años en los selects
function populateYearsForComparison() {
    const currentYear = new Date().getFullYear();
    const yearSelects = document.querySelectorAll('[id^="comparison_group_"][id$="_year"]');
    
    yearSelects.forEach(select => {
        // Limpiar opciones existentes excepto "Todos los años"
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar años desde 2020 hasta el año actual + 1
        for (let year = 2020; year <= currentYear + 1; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    });
}

// Actualizar visibilidad de botones de eliminar
function updateRemoveButtonsVisibility() {
    const groups = document.querySelectorAll('.comparison-group');
    const shouldShowRemove = groups.length > 1;
    
    groups.forEach(group => {
        const removeBtn = group.querySelector('.remove-comparison-group-btn');
        if (removeBtn) {
            removeBtn.style.display = shouldShowRemove ? 'block' : 'none';
        }
    });
}

// Agregar nuevo grupo de comparación
function addComparisonGroup() {
    const container = document.getElementById('comparisonGroupsContainer');
    if (!container) return;
    
    const newGroupIndex = comparisonGroups.length;
    comparisonGroups.push(newGroupIndex);
    
    const groupHTML = `
        <div class="comparison-group" data-group-index="${newGroupIndex}" style="margin-bottom: 24px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <h4 style="color: #ffffff; font-size: 1.1rem; font-weight: 600; margin: 0;">Grupo ${newGroupIndex + 1}</h4>
                <button type="button" class="remove-comparison-group-btn" style="background: rgba(220, 53, 69, 0.2); border: 1px solid rgba(220, 53, 69, 0.3); color: #dc3545; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Eliminar
                </button>
            </div>
            
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Filtros del Grupo</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 12px;">
                    <div>
                        <label for="comparison_group_${newGroupIndex}_year" class="form-label" style="font-size: 0.85rem; margin-bottom: 4px;">Año *</label>
                        <select id="comparison_group_${newGroupIndex}_year" class="form-select" required>
                            <option value="">Seleccione un año</option>
                        </select>
                    </div>
                    <div>
                        <label for="comparison_group_${newGroupIndex}_month" class="form-label" style="font-size: 0.85rem; margin-bottom: 4px;">Mes (opcional)</label>
                        <select id="comparison_group_${newGroupIndex}_month" class="form-select">
                            <option value="">Todos los meses</option>
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                        </select>
                    </div>
                    <div>
                        <label for="comparison_group_${newGroupIndex}_project" class="form-label" style="font-size: 0.85rem; margin-bottom: 4px;">Proyecto (opcional)</label>
                        <div id="comparison_group_${newGroupIndex}_project_container" style="position: relative;">
                            <div class="beneficiaries-search-container" style="margin-bottom: 8px;">
                                <div class="beneficiaries-search-wrapper">
                                    <svg class="beneficiaries-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                    <input type="text" id="comparison_group_${newGroupIndex}_project_search" class="beneficiaries-search-input" placeholder="Buscar proyecto..." autocomplete="off" style="font-size: 14px;">
                                    <button type="button" class="beneficiaries-search-clear-btn" style="display: none;" title="Limpiar búsqueda">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div id="comparison_group_${newGroupIndex}_project_checklist" style="max-height: 200px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; background: rgba(30, 39, 54, 0.98); backdrop-filter: blur(10px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5); display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 1000;">
                                <div style="text-align: center; padding: 20px; color: #6c757d;">
                                    <p>Cargando proyectos...</p>
                                </div>
                            </div>
                            <div id="comparison_group_${newGroupIndex}_selected_project" style="margin-top: 8px; padding: 8px; background: rgba(0, 123, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 123, 255, 0.3); display: none;">
                                <span style="color: #007bff; font-weight: 600; font-size: 0.85rem;">Ningún proyecto seleccionado</span>
                            </div>
                        </div>
                    </div>
                </div>
                <small style="color: #6c757d; display: block; margin-top: 8px;">* El año es obligatorio. Si no selecciona proyecto, se buscarán todos los beneficiarios de la fecha.</small>
            </div>

        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', groupHTML);
    
    // Poblar años para el nuevo grupo
    populateYearsForComparison();
    
    // Cargar proyectos para el nuevo grupo
    loadProjectsForGroup(newGroupIndex);
    
    // Configurar buscador de proyectos para el nuevo grupo
    setupGroupProjectSearch(newGroupIndex);
    
    // Configurar event listener para el botón de eliminar
    const newGroup = container.querySelector(`[data-group-index="${newGroupIndex}"]`);
    if (newGroup) {
        const removeBtn = newGroup.querySelector('.remove-comparison-group-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                removeComparisonGroup(newGroupIndex);
            });
        }
    }
    
    // Actualizar visibilidad de botones de eliminar
    updateRemoveButtonsVisibility();
}

// Eliminar grupo de comparación
function removeComparisonGroup(groupIndex) {
    if (comparisonGroups.length <= 1) {
        mostrarMensaje('warning', 'Debe haber al menos un grupo de comparación');
        return;
    }
    
    const group = document.querySelector(`[data-group-index="${groupIndex}"]`);
    if (group) {
        group.remove();
        comparisonGroups = comparisonGroups.filter(g => g !== groupIndex);
        // Renumerar grupos restantes
        updateGroupNumbers();
        // Actualizar visibilidad de botones de eliminar
        updateRemoveButtonsVisibility();
    }
}

// Renumerar grupos
function updateGroupNumbers() {
    const groups = document.querySelectorAll('.comparison-group');
    groups.forEach((group, index) => {
        const title = group.querySelector('h4');
        if (title) {
            title.textContent = `Grupo ${index + 1}`;
        }
    });
}

// Variables para proyectos de comparación por grupo
let comparisonProjectsDataByGroup = {}; // { groupIndex: [proyectos] }
let selectedProjectsByGroup = {}; // { groupIndex: projectId }

// Cargar proyectos para todos los grupos
async function loadProjectsForAllGroups() {
    const groups = document.querySelectorAll('.comparison-group');
    for (const group of groups) {
        const groupIndex = parseInt(group.dataset.groupIndex);
        await loadProjectsForGroup(groupIndex);
    }
}

// Cargar proyectos para un grupo específico
async function loadProjectsForGroup(groupIndex) {
    const checklist = document.getElementById(`comparison_group_${groupIndex}_project_checklist`);
    if (!checklist) return;
    
    try {
        checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;"><p>Cargando proyectos...</p></div>';
        
        // Obtener proyectos accesibles al usuario
        const response = await fetch('/api/proyectos/usuario/');
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        const data = await response.json();
        
        if (data.success && Array.isArray(data.proyectos)) {
            comparisonProjectsDataByGroup[groupIndex] = data.proyectos.map(proyecto => ({
                id: proyecto.id,
                nombre: proyecto.nombre
            }));
            updateGroupProjectsChecklist(groupIndex);
            updateGroupSelectedProject(groupIndex);
        } else {
            console.error('Formato de respuesta inesperado:', data);
            comparisonProjectsDataByGroup[groupIndex] = [];
            checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;"><p>Error al cargar proyectos</p></div>';
        }
    } catch (error) {
        console.error(`Error cargando proyectos para grupo ${groupIndex}:`, error);
        comparisonProjectsDataByGroup[groupIndex] = [];
        if (checklist) {
            checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;"><p>Error al cargar proyectos</p></div>';
        }
    }
}

// Actualizar checklist de proyectos para un grupo
function updateGroupProjectsChecklist(groupIndex, filterQuery = '') {
    const checklist = document.getElementById(`comparison_group_${groupIndex}_project_checklist`);
    if (!checklist) return;
    
    const proyectos = comparisonProjectsDataByGroup[groupIndex] || [];
    
    if (proyectos.length === 0) {
        checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;"><p>No hay proyectos disponibles</p></div>';
        return;
    }
    
    // Filtrar si hay búsqueda
    let proyectosFiltrados = proyectos;
    if (filterQuery) {
        const normalizedQuery = filterQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        proyectosFiltrados = proyectos.filter(p => 
            p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
        );
    }
    
    if (proyectosFiltrados.length === 0) {
        checklist.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;"><p>No se encontraron proyectos</p></div>';
        return;
    }
    
    const selectedProjectId = selectedProjectsByGroup[groupIndex] || null;
    
    checklist.innerHTML = proyectosFiltrados.map(proyecto => `
        <label style="display: flex; align-items: center; gap: 8px; padding: 10px; cursor: pointer; border-radius: 6px; transition: background 0.2s;" 
               onmouseover="this.style.background='rgba(255,255,255,0.05)'" 
               onmouseout="this.style.background='transparent'">
            <input type="radio" name="comparison_group_${groupIndex}_project" value="${proyecto.id}" 
                   ${selectedProjectId === proyecto.id ? 'checked' : ''} 
                   onchange="selectGroupProject(${groupIndex}, '${proyecto.id}', '${proyecto.nombre.replace(/'/g, "\\'")}')" 
                   style="width: 18px; height: 18px; cursor: pointer;">
            <span style="color: #ffffff; font-size: 14px;">${proyecto.nombre}</span>
        </label>
    `).join('');
}

// Seleccionar proyecto para un grupo (solo uno)
function selectGroupProject(groupIndex, projectId, projectName) {
    selectedProjectsByGroup[groupIndex] = projectId;
    updateGroupSelectedProject(groupIndex, projectName);
    // Ocultar checklist después de seleccionar
    const checklist = document.getElementById(`comparison_group_${groupIndex}_project_checklist`);
    if (checklist) {
        checklist.style.display = 'none';
    }
    // Limpiar búsqueda
    const searchInput = document.getElementById(`comparison_group_${groupIndex}_project_search`);
    if (searchInput) {
        searchInput.value = '';
    }
    const clearBtn = searchInput?.closest('.beneficiaries-search-wrapper')?.querySelector('.beneficiaries-search-clear-btn');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
}

// Deseleccionar proyecto de un grupo
function deselectGroupProject(groupIndex) {
    delete selectedProjectsByGroup[groupIndex];
    updateGroupSelectedProject(groupIndex);
    // Desmarcar radio button
    const radioButtons = document.querySelectorAll(`input[name="comparison_group_${groupIndex}_project"]`);
    radioButtons.forEach(radio => radio.checked = false);
}

// Actualizar display del proyecto seleccionado para un grupo
function updateGroupSelectedProject(groupIndex, projectName = null) {
    const container = document.getElementById(`comparison_group_${groupIndex}_selected_project`);
    if (!container) return;
    
    const selectedProjectId = selectedProjectsByGroup[groupIndex];
    
    if (selectedProjectId && projectName) {
        container.style.display = 'block';
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #007bff; font-weight: 600; font-size: 0.85rem;">${projectName}</span>
                <button type="button" onclick="deselectGroupProject(${groupIndex})" style="background: rgba(220, 53, 69, 0.2); border: 1px solid rgba(220, 53, 69, 0.3); color: #dc3545; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
    } else {
        container.style.display = 'none';
    }
}

// Configurar buscador de proyectos para un grupo
function setupGroupProjectSearch(groupIndex) {
    const searchInput = document.getElementById(`comparison_group_${groupIndex}_project_search`);
    const clearBtn = searchInput?.closest('.beneficiaries-search-wrapper')?.querySelector('.beneficiaries-search-clear-btn');
    const checklist = document.getElementById(`comparison_group_${groupIndex}_project_checklist`);
    
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            if (checklist) {
                checklist.style.display = 'block';
            }
        });
        
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            updateGroupProjectsChecklist(groupIndex, query);
            
            if (clearBtn) {
                clearBtn.style.display = query ? 'flex' : 'none';
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                updateGroupProjectsChecklist(groupIndex, '');
                this.style.display = 'none';
            }
        });
    }
    
    // Cerrar checklist al hacer click fuera
    document.addEventListener('click', function(e) {
        const container = document.getElementById(`comparison_group_${groupIndex}_project_container`);
        if (container && !container.contains(e.target) && checklist) {
            checklist.style.display = 'none';
        }
    });
}

// Hacer funciones disponibles globalmente
window.selectGroupProject = selectGroupProject;
window.deselectGroupProject = deselectGroupProject;


// Manejar generación de comparativa
async function handleGenerateComparison() {
    try {
        // Validar que haya al menos un grupo
        const groups = document.querySelectorAll('.comparison-group');
        if (groups.length === 0) {
            mostrarMensaje('error', 'Debe haber al menos un grupo de comparación');
            return;
        }

        // Validar que cada grupo tenga un año seleccionado
        let hasError = false;
        for (const group of groups) {
            const groupIndex = parseInt(group.dataset.groupIndex);
            const yearSelect = document.getElementById(`comparison_group_${groupIndex}_year`);
            if (!yearSelect || !yearSelect.value) {
                mostrarMensaje('error', `El grupo ${groupIndex + 1} debe tener un año seleccionado`);
                hasError = true;
                break;
            }
        }
        
        if (hasError) return;

        mostrarMensaje('info', 'Generando comparativa...');

        // Obtener todos los beneficiarios
        const response = await fetch('/api/beneficiarios/completo/');
        if (!response.ok) {
            throw new Error('Error al cargar beneficiarios');
        }
        const data = await response.json();
        
        if (!data.success || !Array.isArray(data.beneficiarios)) {
            throw new Error('Formato de respuesta inválido');
        }

        const allBeneficiarios = data.beneficiarios;

        // Procesar cada grupo
        const groupsData = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const groupIndex = parseInt(group.dataset.groupIndex);
            
            // Obtener filtros del grupo
            const year = document.getElementById(`comparison_group_${groupIndex}_year`)?.value || '';
            const month = document.getElementById(`comparison_group_${groupIndex}_month`)?.value || '';
            const projectId = selectedProjectsByGroup[groupIndex] || null;
            
            // Filtrar beneficiarios según los criterios
            let filtered = allBeneficiarios;
            
            // Si hay proyecto seleccionado, filtrar por beneficiarios de ese proyecto
            if (projectId) {
                filtered = filtered.filter(ben => {
                    return ben.proyectos && ben.proyectos.some(p => p.id === projectId);
                });
            }
            
            // Filtrar por fechas
            if (year || month) {
                filtered = filtered.filter(ben => {
                    // Si hay proyecto seleccionado, buscar en fechas de asociación y reinscripción
                    if (projectId) {
                        // Buscar el proyecto específico
                        const proyectoBeneficiario = ben.proyectos?.find(p => p.id === projectId);
                        if (!proyectoBeneficiario) return false;
                        
                        // Obtener ambas fechas: creación original y reinscripción
                        const fechaAgregacion = proyectoBeneficiario.fecha_agregacion || proyectoBeneficiario.fecha;
                        const fechaReinscripcion = proyectoBeneficiario.fecha_reinscripcion;
                        
                        // Lista de fechas a verificar (puede haber múltiples reinscripciones en el futuro)
                        const fechasAVerificar = [];
                        if (fechaAgregacion) fechasAVerificar.push(new Date(fechaAgregacion));
                        if (fechaReinscripcion) fechasAVerificar.push(new Date(fechaReinscripcion));
                        
                        // Si no hay ninguna fecha, no puede coincidir
                        if (fechasAVerificar.length === 0) return false;
                        
                        // Verificar si alguna de las fechas coincide con el filtro
                        const fechaCoincide = fechasAVerificar.some(fecha => {
                            const añoFecha = fecha.getFullYear();
                            const mesFecha = fecha.getMonth() + 1;
                            
                            // Verificar año
                            if (year && añoFecha !== parseInt(year)) return false;
                            
                            // Verificar mes (si se especificó)
                            if (month && mesFecha !== parseInt(month)) return false;
                            
                            return true;
                        });
                        
                        return fechaCoincide;
                    } else {
                        // Sin proyecto: usar fecha de creación del beneficiario en la base de datos
                        const fechaBeneficiario = ben.creado_en || ben.actualizado_en;
                        if (!fechaBeneficiario) return false;
                        
                        const fecha = new Date(fechaBeneficiario);
                        const añoBeneficiario = fecha.getFullYear();
                        const mesBeneficiario = fecha.getMonth() + 1;
                        
                        if (year && añoBeneficiario !== parseInt(year)) return false;
                        if (month && mesBeneficiario !== parseInt(month)) return false;
                        
                        return true;
                    }
                });
            }
            
            // Crear identificador único para cada beneficiario (usando DPI si existe, o ID)
            const processed = filtered.map(ben => {
                const dpi = ben.detalles?.dpi || ben.detalles?.dpi_jefe_familia || ben.detalles?.dpi_representante || null;
                // Usar DPI como identificador único si existe, sino usar ID
                const uniqueId = dpi || ben.id;
                return {
                    ...ben,
                    uniqueId: uniqueId,
                    dpi: dpi
                };
            });
            
            // Obtener nombre del proyecto si está seleccionado
            const proyectoNombre = projectId 
                ? (comparisonProjectsDataByGroup[groupIndex]?.find(p => p.id === projectId)?.nombre || 'Proyecto seleccionado')
                : null;
            
            groupsData.push({
                index: groupIndex,
                label: `Grupo ${groupIndex + 1}`,
                year: year,
                month: month,
                projectId: projectId,
                proyectoNombre: proyectoNombre,
                beneficiarios: processed
            });
        }

        // Calcular beneficiarios repetentes y ausentes
        const comparisonResults = calculateComparisonResults(groupsData);

        // Mostrar resultados
        displayComparisonResults(comparisonResults, groupsData);
        
        // Cambiar a la vista de resultados
        showView('comparisonResultsView');
        
        mostrarMensaje('success', 'Comparativa generada exitosamente');
    } catch (error) {
        console.error('Error generando comparativa:', error);
        mostrarMensaje('error', 'Error al generar la comparativa: ' + error.message);
    }
}

// Calcular resultados de comparación
function calculateComparisonResults(groupsData) {
    if (groupsData.length === 0) return { repetentes: [], ausentes: [] };
    
    // Obtener todos los uniqueIds de cada grupo
    const groupIds = groupsData.map(group => 
        new Set(group.beneficiarios.map(b => b.uniqueId))
    );
    
    // Beneficiarios repetentes: están en TODOS los grupos
    const repetentesIds = new Set();
    if (groupIds.length > 0) {
        const firstGroupIds = groupIds[0];
        for (const id of firstGroupIds) {
            if (groupIds.every(groupSet => groupSet.has(id))) {
                repetentesIds.add(id);
            }
        }
    }
    
    // Obtener datos completos de repetentes (del primer grupo)
    const repetentes = groupsData[0].beneficiarios.filter(b => repetentesIds.has(b.uniqueId));
    
    // Beneficiarios ausentes: por cada grupo, los que NO están en otros grupos
    const ausentes = groupsData.map((group, groupIndex) => {
        const otherGroupsIds = new Set();
        groupIds.forEach((ids, idx) => {
            if (idx !== groupIndex) {
                ids.forEach(id => otherGroupsIds.add(id));
            }
        });
        
        return group.beneficiarios.filter(b => !otherGroupsIds.has(b.uniqueId));
    });
    
    return { repetentes, ausentes };
}

// Mostrar resultados de comparación
function displayComparisonResults(comparisonResults, groupsData) {
    const container = document.getElementById('comparisonResultsContent');
    if (!container) return;
    
    const { repetentes, ausentes } = comparisonResults;
    
    let html = '';
    
    // Sección 1: Listados generales por grupo
    html += `
        <div class="comparison-results-section">
            <div class="comparison-results-header">
                <h3 class="comparison-results-title">Listados Generales por Grupo</h3>
                <button type="button" class="comparison-results-toggle" onclick="toggleComparisonSection('general')">
                    <span>Ocultar</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
            </div>
            <div id="generalSection" class="comparison-columns-container ${groupsData.length === 3 ? 'comparison-3-columns' : groupsData.length >= 4 ? 'comparison-4-columns' : ''}">
    `;
    
    groupsData.forEach((group, index) => {
        let label = `Grupo ${index + 1}`;
        if (group.proyectoNombre) {
            label += ` - ${group.proyectoNombre}`;
        }
        if (group.year) {
            label += ` (${group.year}`;
            if (group.month) {
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                label += `/${meses[parseInt(group.month) - 1]}`;
            }
            label += ')';
        }
        
        html += `
            <div class="comparison-column">
                <div class="comparison-column-header">
                    <h4 class="comparison-column-title">${label}</h4>
                    <span class="comparison-column-count">${group.beneficiarios.length}</span>
                </div>
                <div class="comparison-column-search">
                    <input type="text" class="form-input" placeholder="Buscar en este listado..." 
                           onkeyup="filterComparisonList(this, 'general_${index}')" 
                           style="width: 100%; padding: 10px 16px; padding-left: 40px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.05); color: #ffffff;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; pointer-events: none;">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
                <div id="general_${index}_list" class="comparison-beneficiaries-list">
        `;
        
        group.beneficiarios.forEach(ben => {
            const dpi = ben.dpi || ben.detalles?.dpi || ben.detalles?.dpi_jefe_familia || ben.detalles?.dpi_representante || 'N/A';
            const comunidad = ben.comunidad_nombre || 'N/A';
            const nombre = ben.nombre || ben.detalles?.display_name || 'N/A';
            const searchText = (nombre + ' ' + (dpi !== 'N/A' ? dpi : '') + ' ' + comunidad).toLowerCase();
            html += `
                <div class="comparison-beneficiary-item" data-search="${searchText}">
                    <div class="comparison-beneficiary-name">${nombre}</div>
                    <div class="comparison-beneficiary-dpi">DPI: ${dpi}</div>
                    <div class="comparison-beneficiary-comunidad">Comunidad: ${comunidad}</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    // Sección 2: Beneficiarios repetentes
    if (repetentes.length > 0) {
        html += `
            <div class="comparison-results-section comparison-repetentes-section">
                <div class="comparison-results-header">
                    <h3 class="comparison-results-title">Beneficiarios Repetentes</h3>
                    <button type="button" class="comparison-results-toggle" onclick="toggleComparisonSection('repetentes')">
                        <span>Ocultar</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                </div>
                <div id="repetentesSection" class="comparison-columns-container">
                    <div class="comparison-column" style="grid-column: 1 / -1;">
                        <div class="comparison-column-header">
                            <h4 class="comparison-column-title">Beneficiarios que aparecen en todos los grupos</h4>
                            <span class="comparison-column-count">${repetentes.length}</span>
                        </div>
                        <div class="comparison-column-search">
                            <input type="text" class="form-input" placeholder="Buscar en este listado..." 
                                   onkeyup="filterComparisonList(this, 'repetentes')" 
                                   style="width: 100%; padding: 10px 16px; padding-left: 40px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.05); color: #ffffff;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; pointer-events: none;">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </div>
                        <div id="repetentes_list" class="comparison-beneficiaries-list">
        `;
        
        repetentes.forEach(ben => {
            const dpi = ben.dpi || ben.detalles?.dpi || ben.detalles?.dpi_jefe_familia || ben.detalles?.dpi_representante || 'N/A';
            const comunidad = ben.comunidad_nombre || 'N/A';
            const nombre = ben.nombre || ben.detalles?.display_name || 'N/A';
            const searchText = (nombre + ' ' + (dpi !== 'N/A' ? dpi : '') + ' ' + comunidad).toLowerCase();
            html += `
                <div class="comparison-beneficiary-item" data-search="${searchText}">
                    <div class="comparison-beneficiary-name">${nombre}</div>
                    <div class="comparison-beneficiary-dpi">DPI: ${dpi}</div>
                    <div class="comparison-beneficiary-comunidad">Comunidad: ${comunidad}</div>
                </div>
            `;
        });
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Sección 3: Beneficiarios ausentes
    html += `
        <div class="comparison-results-section comparison-ausentes-section">
            <div class="comparison-results-header">
                <h3 class="comparison-results-title">Beneficiarios Ausentes</h3>
                <button type="button" class="comparison-results-toggle" onclick="toggleComparisonSection('ausentes')">
                    <span>Ocultar</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
            </div>
            <div id="ausentesSection" class="comparison-columns-container ${ausentes.length === 3 ? 'comparison-3-columns' : ausentes.length >= 4 ? 'comparison-4-columns' : ''}">
    `;
    
    ausentes.forEach((grupoAusentes, index) => {
        // Siempre mostrar el grupo, incluso si está vacío, para mantener el diseño de columnas
        const group = groupsData[index];
        let label = `Grupo ${index + 1}`;
        if (group.proyectoNombre) {
            label += ` - ${group.proyectoNombre}`;
        }
        if (group.year) {
            label += ` (${group.year}`;
            if (group.month) {
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                label += `/${meses[parseInt(group.month) - 1]}`;
            }
            label += ')';
        }
        label += ' (Solo en este grupo)';
        
        html += `
            <div class="comparison-column">
                <div class="comparison-column-header">
                    <h4 class="comparison-column-title">${label}</h4>
                    <span class="comparison-column-count">${grupoAusentes.length}</span>
                </div>
                <div class="comparison-column-search">
                    <input type="text" class="form-input" placeholder="Buscar en este listado..." 
                           onkeyup="filterComparisonList(this, 'ausentes_${index}')" 
                           style="width: 100%; padding: 10px 16px; padding-left: 40px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.05); color: #ffffff;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; pointer-events: none;">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
                <div id="ausentes_${index}_list" class="comparison-beneficiaries-list">
        `;
        
        if (grupoAusentes.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                    <p style="margin: 0;">No hay beneficiarios ausentes en este grupo</p>
                    <small style="display: block; margin-top: 8px; font-size: 0.85rem;">Todos los beneficiarios de este grupo aparecen en otros grupos</small>
                </div>
            `;
        } else {
            grupoAusentes.forEach(ben => {
                const dpi = ben.dpi || ben.detalles?.dpi || ben.detalles?.dpi_jefe_familia || ben.detalles?.dpi_representante || 'N/A';
                const comunidad = ben.comunidad_nombre || 'N/A';
                const nombre = ben.nombre || ben.detalles?.display_name || 'N/A';
                const searchText = (nombre + ' ' + (dpi !== 'N/A' ? dpi : '') + ' ' + comunidad).toLowerCase();
                html += `
                    <div class="comparison-beneficiary-item" data-search="${searchText}">
                        <div class="comparison-beneficiary-name">${nombre}</div>
                        <div class="comparison-beneficiary-dpi">DPI: ${dpi}</div>
                        <div class="comparison-beneficiary-comunidad">Comunidad: ${comunidad}</div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Toggle sección de comparación
function toggleComparisonSection(sectionId) {
    // Buscar el contenedor de la sección (el div con comparison-columns-container)
    const section = document.getElementById(sectionId + 'Section');
    const toggle = event.target.closest('.comparison-results-toggle');
    
    if (!section || !toggle) return;
    
    // Ocultar/mostrar el contenido pero mantener el contenedor del grid visible
    const isHidden = section.classList.contains('comparison-section-hidden');
    
    if (isHidden) {
        section.classList.remove('comparison-section-hidden');
        toggle.querySelector('span').textContent = 'Ocultar';
        toggle.querySelector('svg').style.transform = 'rotate(0deg)';
    } else {
        section.classList.add('comparison-section-hidden');
        toggle.querySelector('span').textContent = 'Mostrar';
        toggle.querySelector('svg').style.transform = 'rotate(180deg)';
    }
}

// Filtrar listado de comparación
function filterComparisonList(input, listId) {
    const query = input.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const list = document.getElementById(listId + '_list');
    if (!list) return;
    
    const items = list.querySelectorAll('.comparison-beneficiary-item');
    items.forEach(item => {
        const searchText = item.dataset.search || '';
        const normalized = searchText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Hacer funciones disponibles globalmente
window.toggleComparisonSection = toggleComparisonSection;
window.filterComparisonList = filterComparisonList;

// Cargar dashboard de estadísticas
async function loadStatisticsDashboard() {
    console.log('Cargando estadísticas...');
    
    try {
        const response = await fetch('/api/beneficiarios/estadisticas/');
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.estadisticas) {
            throw new Error('Formato de respuesta inválido');
        }
        
        const stats = data.estadisticas;
        
        // Actualizar tarjetas de estadísticas
        const statTotalEl = document.getElementById('statTotalBeneficiarios');
        const statAlcanzadosEl = document.getElementById('statBeneficiariosAlcanzados');
        const statMultiplesEl = document.getElementById('statMultiplesProyectos');
        const statUnSoloEl = document.getElementById('statUnSoloProyecto');
        const statComunidadesEl = document.getElementById('statComunidadesAlcanzadas');
        
        if (statTotalEl) statTotalEl.textContent = stats.total_beneficiarios || 0;
        if (statAlcanzadosEl) statAlcanzadosEl.textContent = stats.beneficiarios_alcanzados || 0;
        if (statMultiplesEl) statMultiplesEl.textContent = stats.beneficiarios_multiples_proyectos || 0;
        if (statUnSoloEl) statUnSoloEl.textContent = stats.beneficiarios_un_solo_proyecto || 0;
        if (statComunidadesEl) statComunidadesEl.textContent = stats.comunidades_alcanzadas || 0;
        
        // Actualizar beneficiarios con habilidades
        const statHabilidadesEl = document.getElementById('statBeneficiariosConHabilidades');
        if (statHabilidadesEl) {
            statHabilidadesEl.textContent = stats.beneficiarios_con_habilidades || 0;
        }
        
        // Renderizar listado de habilidades
        if (stats.habilidades && Array.isArray(stats.habilidades) && stats.habilidades.length > 0) {
            renderHabilidadesList(stats.habilidades);
        } else {
            const habilidadesListEl = document.getElementById('habilidadesList');
            if (habilidadesListEl) {
                habilidadesListEl.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No hay habilidades registradas</p>';
            }
        }
        
        // Actualizar gráfico de distribución por género
        if (stats.distribucion_genero) {
            renderGenderDistributionChart(stats.distribucion_genero);
        }
        
        // Actualizar top 5 comunidades
        if (stats.top_comunidades && Array.isArray(stats.top_comunidades)) {
            renderTopComunidadesChart(stats.top_comunidades);
        }
        
        console.log('Estadísticas cargadas exitosamente');
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Mostrar valores por defecto en caso de error
        const statTotalEl = document.getElementById('statTotalBeneficiarios');
        const statAlcanzadosEl = document.getElementById('statBeneficiariosAlcanzados');
        const statMultiplesEl = document.getElementById('statMultiplesProyectos');
        const statUnSoloEl = document.getElementById('statUnSoloProyecto');
        const statComunidadesEl = document.getElementById('statComunidadesAlcanzadas');
        
        if (statTotalEl) statTotalEl.textContent = '-';
        if (statAlcanzadosEl) statAlcanzadosEl.textContent = '-';
        if (statMultiplesEl) statMultiplesEl.textContent = '-';
        if (statUnSoloEl) statUnSoloEl.textContent = '-';
        if (statComunidadesEl) statComunidadesEl.textContent = '-';
    }
}

// Función para renderizar gráfico de distribución por género
function renderGenderDistributionChart(distribucion) {
    const container = document.getElementById('genderDistributionChart');
    if (!container) return;
    
    const total = distribucion.masculino + distribucion.femenino + distribucion.otro;
    if (total === 0) {
        container.innerHTML = '<p style="color: #6c757d;">No hay datos disponibles</p>';
        return;
    }
    
    const porcentajeMasculino = ((distribucion.masculino / total) * 100).toFixed(1);
    const porcentajeFemenino = ((distribucion.femenino / total) * 100).toFixed(1);
    const porcentajeOtro = ((distribucion.otro / total) * 100).toFixed(1);
    
    container.innerHTML = `
        <div style="width: 100%; max-width: 100%; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0;">
                    <div style="width: 16px; height: 16px; border-radius: 4px; background: #007bff; flex-shrink: 0;"></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; gap: 8px; flex-wrap: wrap;">
                            <span style="color: #ffffff; font-weight: 600; font-size: 0.9rem;">Masculino</span>
                            <span style="color: #6c757d; font-size: 0.85rem; white-space: nowrap;">${distribucion.masculino} (${porcentajeMasculino}%)</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; box-sizing: border-box;">
                            <div style="width: ${porcentajeMasculino}%; height: 100%; background: #007bff; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0;">
                    <div style="width: 16px; height: 16px; border-radius: 4px; background: #28a745; flex-shrink: 0;"></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; gap: 8px; flex-wrap: wrap;">
                            <span style="color: #ffffff; font-weight: 600; font-size: 0.9rem;">Femenino</span>
                            <span style="color: #6c757d; font-size: 0.85rem; white-space: nowrap;">${distribucion.femenino} (${porcentajeFemenino}%)</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; box-sizing: border-box;">
                            <div style="width: ${porcentajeFemenino}%; height: 100%; background: #28a745; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0;">
                    <div style="width: 16px; height: 16px; border-radius: 4px; background: #ffc107; flex-shrink: 0;"></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; gap: 8px; flex-wrap: wrap;">
                            <span style="color: #ffffff; font-weight: 600; font-size: 0.9rem;">Otro</span>
                            <span style="color: #6c757d; font-size: 0.85rem; white-space: nowrap;">${distribucion.otro} (${porcentajeOtro}%)</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; box-sizing: border-box;">
                            <div style="width: ${porcentajeOtro}%; height: 100%; background: #ffc107; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar top 5 comunidades
function renderTopComunidadesChart(topComunidades) {
    const container = document.getElementById('topComunidadesChart');
    if (!container) return;
    
    if (!topComunidades || topComunidades.length === 0) {
        container.innerHTML = '<p style="color: #6c757d;">No hay datos disponibles</p>';
        return;
    }
    
    const maxTotal = Math.max(...topComunidades.map(c => c.total));
    
    container.innerHTML = `
        <div style="width: 100%; max-width: 100%; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                ${topComunidades.map((comunidad, index) => {
                    const porcentaje = ((comunidad.total / maxTotal) * 100).toFixed(1);
                    return `
                        <div style="display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(0, 123, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #007bff; font-weight: 700; font-size: 0.9rem; flex-shrink: 0;">
                                ${index + 1}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; gap: 8px; flex-wrap: wrap;">
                                    <span style="color: #ffffff; font-weight: 600; font-size: 0.9rem; word-break: break-word;">${comunidad.nombre}</span>
                                    <span style="color: #007bff; font-weight: 700; font-size: 1rem; white-space: nowrap; flex-shrink: 0;">${comunidad.total}</span>
                                </div>
                                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; box-sizing: border-box;">
                                    <div style="width: ${porcentaje}%; height: 100%; background: linear-gradient(90deg, #007bff, #0056b3); transition: width 0.5s ease;"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Función para renderizar listado de habilidades
function renderHabilidadesList(habilidades) {
    const container = document.getElementById('habilidadesList');
    if (!container) return;
    
    if (!habilidades || habilidades.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No hay habilidades registradas</p>';
        return;
    }
    
    // Agrupar habilidades por tipo
    const habilidadesPorTipo = {};
    habilidades.forEach(habilidad => {
        const tipo = habilidad.tipo || 'Sin tipo';
        if (!habilidadesPorTipo[tipo]) {
            habilidadesPorTipo[tipo] = [];
        }
        habilidadesPorTipo[tipo].push({
            valor: habilidad.valor,
            total: habilidad.total
        });
    });
    
    // Ordenar por total descendente dentro de cada tipo
    Object.keys(habilidadesPorTipo).forEach(tipo => {
        habilidadesPorTipo[tipo].sort((a, b) => b.total - a.total);
    });
    
    let html = '<div style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 100%; box-sizing: border-box;">';
    
    Object.keys(habilidadesPorTipo).sort().forEach(tipo => {
        const habilidadesTipo = habilidadesPorTipo[tipo];
        const totalTipo = habilidadesTipo.reduce((sum, h) => sum + h.total, 0);
        
        html += `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; width: 100%; max-width: 100%; box-sizing: border-box;">
                <h4 style="color: #ffffff; font-size: 0.95rem; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ffc107; flex-shrink: 0;">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    <span style="flex: 1; min-width: 0; word-break: break-word;">${tipo}</span>
                    <span style="color: #6c757d; font-size: 0.85rem; font-weight: normal; white-space: nowrap; flex-shrink: 0;">${totalTipo} beneficiario(s)</span>
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                    ${habilidadesTipo.map(habilidad => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; transition: all 0.2s; width: 100%; max-width: 100%; box-sizing: border-box; gap: 8px; min-width: 0;">
                            <span style="color: #b8c5d1; font-size: 0.85rem; flex: 1; min-width: 0; word-break: break-word;">${habilidad.valor}</span>
                            <span style="color: #ffc107; font-weight: 700; font-size: 0.9rem; background: rgba(255, 193, 7, 0.15); padding: 4px 12px; border-radius: 12px; min-width: 45px; text-align: center; flex-shrink: 0;">${habilidad.total}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
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

