// perfilusuario.js

// Variables globales
let userData = null;
let colaboradorData = null;
let originalUserData = null; // Para detectar cambios
let modoEdicion = false; // Controla si estamos en modo edición
let ultimaEdicion = null; // Timestamp de la última edición

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // 1. Cargar datos del usuario y colaborador
    loadUserData();
    
    // 2. Cargar estadísticas del usuario
    loadUserStatistics();
    
    // 3. Configurar eventos
    setupEventListeners();
});

// Cargar datos del usuario
async function loadUserData() {
    try {
        // Usar offlineAwareFetch si está disponible, sino usar fetch normal
        const fetchFn = window.offlineAwareFetch || fetch;
        const response = await fetchFn('/api/usuario/');
        
        if (!response.ok) {
            // Verificar si hay sesión offline activa antes de redirigir
            const hasOfflineSession = window.OfflineAuth && window.OfflineAuth.getActiveSession && window.OfflineAuth.getActiveSession();
            const isOffline = !navigator.onLine;
            
            // Si está offline o hay sesión offline, no redirigir
            if (isOffline || hasOfflineSession) {
                console.warn('Modo offline: No se pudieron cargar los datos del usuario');
                // Intentar cargar datos desde localStorage si están disponibles
                if (window.USER_AUTH && window.USER_AUTH.username) {
                    // Mostrar datos básicos del usuario desde USER_AUTH
                    displayUserDataFromAuth();
                }
                return;
            }
            
            // Solo redirigir si es 401 y no hay sesión offline
            if (response.status === 401) {
                // Usuario no autenticado y no hay sesión offline, redirigir a index
                window.location.href = '/';
                return;
            }
            
            throw new Error('Error al cargar datos del usuario');
        }
        const data = await response.json();
        
        userData = data;
        
        // Si tiene colaborador vinculado, cargar sus datos primero para sincronizar
        if (data.colaborador_id) {
            await loadColaboradorDataFromUsuario();
        }
        
        // Mostrar datos del usuario (después de cargar colaborador para sincronizar valores)
        displayUserData(data);
        
        // Cargar foto de perfil
        loadProfilePhoto();
    } catch (error) {
        // Verificar si hay sesión offline activa antes de mostrar error o redirigir
        const hasOfflineSession = window.OfflineAuth && window.OfflineAuth.getActiveSession && window.OfflineAuth.getActiveSession();
        const isOffline = !navigator.onLine;
        
        // Si está offline o hay sesión offline, no mostrar error ni redirigir
        if (isOffline || hasOfflineSession) {
            console.warn('Modo offline: No se pudieron cargar los datos del usuario');
            // Intentar cargar datos desde localStorage si están disponibles
            if (window.USER_AUTH && window.USER_AUTH.username) {
                displayUserDataFromAuth();
            }
        } else {
            // Solo mostrar error si no está offline y no hay sesión offline
            showError('Error al cargar los datos del usuario');
        }
    }
}

// Mostrar datos básicos del usuario desde USER_AUTH cuando está offline
function displayUserDataFromAuth() {
    if (!window.USER_AUTH) return;
    
    const usernameInput = document.getElementById('datoUsername');
    const nombreInput = document.getElementById('datoNombre');
    const emailInput = document.getElementById('datoEmail');
    
    if (usernameInput && window.USER_AUTH.username) {
        usernameInput.value = window.USER_AUTH.username;
    }
    if (nombreInput && window.USER_AUTH.username) {
        nombreInput.value = window.USER_AUTH.username;
    }
    if (emailInput && window.USER_AUTH.email) {
        emailInput.value = window.USER_AUTH.email;
    }
    
    // Mostrar mensaje de que está en modo offline
    const offlineNotice = document.createElement('div');
    offlineNotice.style.cssText = `
        background: #ffc107;
        color: #000;
        padding: 12px;
        margin: 16px 0;
        border-radius: 8px;
        text-align: center;
    `;
    offlineNotice.textContent = '⚠️ Modo offline: Mostrando datos limitados. Los cambios se sincronizarán cuando se restablezca la conexión.';
    
    const container = document.querySelector('.perfil-container') || document.body;
    const firstChild = container.firstElementChild;
    if (firstChild && !container.querySelector('.offline-notice')) {
        offlineNotice.className = 'offline-notice';
        container.insertBefore(offlineNotice, firstChild);
    }
}

// Mostrar datos del usuario en el HTML
function displayUserData(data) {
    // Determinar valores finales: priorizar valores del usuario, si no tiene, usar los del colaborador
    let nombreFinal = data.nombre || '';
    let emailFinal = data.email || '';
    let telefonoFinal = data.telefono || '';
    
    // Si hay colaborador y el usuario no tiene estos valores, usar los del colaborador
    if (colaboradorData) {
        // Nombre: usar del colaborador si el usuario no lo tiene
        if (!nombreFinal && colaboradorData.nombre) {
            nombreFinal = colaboradorData.nombre;
        }
        // Email: el usuario siempre debe tenerlo, pero si no, usar el del colaborador
        if (!emailFinal && colaboradorData.correo) {
            emailFinal = colaboradorData.correo;
        }
        // Teléfono: usar del colaborador si el usuario no lo tiene
        if (!telefonoFinal && colaboradorData.telefono) {
            telefonoFinal = colaboradorData.telefono;
        }
    }
    
    // Guardar datos originales para detectar cambios
    originalUserData = {
        username: data.username || '',
        nombre: nombreFinal,
        email: emailFinal,
        telefono: telefonoFinal
    };
    
    // Actualizar los inputs con los valores finales
    const usernameInput = document.getElementById('datoUsername');
    const nombreInput = document.getElementById('datoNombre');
    const emailInput = document.getElementById('datoEmail');
    const telefonoInput = document.getElementById('datoTelefono');
    
    if (usernameInput) usernameInput.value = data.username || '';
    if (nombreInput) nombreInput.value = nombreFinal;
    if (emailInput) emailInput.value = emailFinal;
    if (telefonoInput) telefonoInput.value = telefonoFinal;
    
    // Si hay colaborador vinculado, mostrar hints de sincronización
    if (data.colaborador_id) {
        const syncHintNombre = document.getElementById('syncHintNombre');
        const syncHintEmail = document.getElementById('syncHintEmail');
        const syncHintTelefono = document.getElementById('syncHintTelefono');
        
        if (syncHintNombre) syncHintNombre.style.display = 'inline';
        if (syncHintEmail) syncHintEmail.style.display = 'inline';
        if (syncHintTelefono) syncHintTelefono.style.display = 'inline';
    }
}

// Cargar datos del colaborador vinculado al usuario actual
async function loadColaboradorDataFromUsuario() {
    try {
        const response = await fetch('/api/usuario/colaborador/');
        if (!response.ok) {
            throw new Error('Error al cargar datos del colaborador');
        }
        const result = await response.json();
        
        if (result.success && result.colaborador) {
            colaboradorData = result.colaborador;
            // Mostrar datos del colaborador
            displayColaboradorData(result.colaborador);
        }
    } catch (error) {
    }
}

// Mostrar datos del colaborador (solo campos NO duplicados)
function displayColaboradorData(data) {
    const colaboradorSection = document.getElementById('colaboradorSection');
    if (!colaboradorSection) return;
    
    if (!data) {
        // Si no hay datos, ocultar sección
        colaboradorSection.style.display = 'none';
        return;
    }
    
    // Mostrar sección solo con campos adicionales (no duplicados)
    colaboradorSection.style.display = 'block';
    
    // Llenar solo los campos que NO están duplicados
    const puestoEl = document.getElementById('datoColaboradorPuesto');
    const dpiInput = document.getElementById('datoColaboradorDpi');
    const dpiDisplay = document.getElementById('datoColaboradorDpiDisplay');
    const descripcionInput = document.getElementById('datoColaboradorDescripcion');
    const descripcionDisplay = document.getElementById('datoColaboradorDescripcionDisplay');
    
    if (puestoEl) puestoEl.textContent = data.puesto_nombre || '-';
    
    // DPI: mostrar en display o input según modo edición
    if (dpiDisplay) dpiDisplay.textContent = data.dpi || '-';
    if (dpiInput) {
        dpiInput.value = data.dpi || '';
        if (modoEdicion) {
            dpiInput.style.display = 'block';
            if (dpiDisplay) dpiDisplay.style.display = 'none';
        } else {
            dpiInput.style.display = 'none';
            if (dpiDisplay) dpiDisplay.style.display = 'block';
        }
    }
    
    // Descripción: mostrar en display o textarea según modo edición
    if (descripcionDisplay) descripcionDisplay.textContent = data.descripcion || '-';
    if (descripcionInput) {
        descripcionInput.value = data.descripcion || '';
        if (modoEdicion) {
            descripcionInput.style.display = 'block';
            if (descripcionDisplay) descripcionDisplay.style.display = 'none';
        } else {
            descripcionInput.style.display = 'none';
            if (descripcionDisplay) descripcionDisplay.style.display = 'block';
        }
    }
}

// Cargar foto de perfil
async function loadProfilePhoto() {
    try {
        const response = await fetch('/api/usuario/foto-perfil/');
        if (!response.ok) {
            // Si no hay foto, mantener la inicial
            displayInitialAvatar();
            return;
        }
        const data = await response.json();
        
        if (data.success && data.foto_url) {
            displayProfilePhoto(data.foto_url);
        } else {
            displayInitialAvatar();
        }
    } catch (error) {
        displayInitialAvatar();
    }
}

// Mostrar foto de perfil
function displayProfilePhoto(fotoUrl) {
    const avatarInitial = document.getElementById('avatarInitial');
    const avatarImage = document.getElementById('avatarImage');
    const perfilAvatar = document.getElementById('perfilAvatar');
    
    if (avatarImage) {
        avatarImage.src = fotoUrl;
        avatarImage.style.display = 'block';
        avatarImage.style.width = '100%';
        avatarImage.style.height = '100%';
        avatarImage.style.objectFit = 'cover';
        avatarImage.style.borderRadius = '50%';
    }
    
    if (avatarInitial) {
        avatarInitial.style.display = 'none';
    }
}

// Mostrar avatar con inicial
function displayInitialAvatar() {
    const avatarInitial = document.getElementById('avatarInitial');
    const avatarImage = document.getElementById('avatarImage');
    
    if (avatarImage) {
        avatarImage.style.display = 'none';
    }
    
    if (avatarInitial && userData && userData.username) {
        avatarInitial.textContent = userData.username.charAt(0).toUpperCase();
        avatarInitial.style.display = 'block';
    }
}

// Cargar estadísticas del usuario
async function loadUserStatistics() {
    try {
        const response = await fetch('/api/usuario/estadisticas/');
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }
        const data = await response.json();
        
        // Mostrar estadísticas
        displayStatistics(data);
    } catch (error) {
        showError('Error al cargar las estadísticas');
    }
}

// Mostrar estadísticas
function displayStatistics(data) {
    // Total de eventos trabajados (proyectos)
    const totalEventos = data.total_eventos || 0;
    const statTotalProyectos = document.getElementById('statTotalProyectos');
    if (statTotalProyectos) {
        statTotalProyectos.textContent = totalEventos;
    }
    
    // Total de avances realizados
    const totalAvances = data.total_avances || 0;
    const statTotalAvances = document.getElementById('statTotalAvances');
    if (statTotalAvances) {
        statTotalAvances.textContent = totalAvances;
    }
    
    // Mostrar eventos detallados si existen
    if (data.eventos && data.eventos.length > 0) {
        displayEventos(data.eventos);
        const eventosSection = document.getElementById('eventosSection');
        if (eventosSection) {
            eventosSection.style.display = 'block';
        }
    } else {
        const eventosSection = document.getElementById('eventosSection');
        if (eventosSection) {
            eventosSection.style.display = 'none';
        }
    }
}

// Mostrar eventos detallados (copiado de reportes.js)
function displayEventos(eventos) {
    const eventosSection = document.getElementById('eventosSection');
    const eventosGrid = document.getElementById('eventosGrid');
    
    if (!eventosSection || !eventosGrid) return;
    
    eventosSection.style.display = 'block';
    eventosGrid.innerHTML = '';
    
    eventos.forEach(evento => {
        const eventoCard = document.createElement('div');
        eventoCard.className = 'evento-card';
        
        eventoCard.innerHTML = `
            <h5 class="evento-name">${escapeHtml(evento.nombre || 'Sin nombre')}</h5>
            <div class="evento-details">
                <span class="status-badge status-${evento.estado || 'planificado'}">${formatEstado(evento.estado)}</span>
                <span class="evento-comunidad">${escapeHtml(evento.comunidad || '-')}</span>
            </div>
            <div class="evento-stats">
                <div class="evento-stat">
                    <span class="evento-stat-label">Avances realizados:</span>
                    <span class="evento-stat-value">${evento.total_avances || 0}</span>
                </div>
                ${evento.fecha_primer_avance ? `
                <div class="evento-stat">
                    <span class="evento-stat-label">Fecha primer avance:</span>
                    <span class="evento-stat-value">${evento.fecha_primer_avance}</span>
                </div>
                ` : ''}
                ${evento.fecha_ultimo_avance ? `
                <div class="evento-stat">
                    <span class="evento-stat-label">Fecha último avance:</span>
                    <span class="evento-stat-value">${evento.fecha_ultimo_avance}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        eventosGrid.appendChild(eventoCard);
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón cambiar foto
    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const inputFotoPerfil = document.getElementById('inputFotoPerfil');
    
    if (btnCambiarFoto && inputFotoPerfil) {
        btnCambiarFoto.addEventListener('click', () => {
            inputFotoPerfil.click();
        });
        
        inputFotoPerfil.addEventListener('change', handleFotoChange);
    }
    
    // Botón editar información
    const btnEditarInformacion = document.getElementById('btnEditarInformacion');
    if (btnEditarInformacion) {
        btnEditarInformacion.addEventListener('click', toggleModoEdicion);
    }
    
    // Botón cambiar contraseña
    const btnCambiarPassword = document.getElementById('btnCambiarPassword');
    if (btnCambiarPassword) {
        btnCambiarPassword.addEventListener('click', async () => {
            const correoUsuario = userData && (userData.email || (colaboradorData && colaboradorData.correo));
            const loginBase = (window.DJANGO_URLS && window.DJANGO_URLS.login) ? window.DJANGO_URLS.login : '/login/';
            const logoutUrl = (window.DJANGO_URLS && window.DJANGO_URLS.logout) ? window.DJANGO_URLS.logout : '/logout/';

            const params = new URLSearchParams({ 'mode': 'password-recovery' });
            if (correoUsuario) {
                params.set('email', correoUsuario);
            }
            const targetUrl = `${loginBase}?${params.toString()}`;

            try {
                // Limpiar cache del Service Worker antes de hacer logout
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
                }
                
                await fetch(logoutUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    credentials: 'include'
                });
            } catch (error) {
            } finally {
                // Limpiar sesión offline del localStorage antes de redirigir
                if (window.OfflineAuth && window.OfflineAuth.clearActiveSession) {
                    window.OfflineAuth.clearActiveSession();
                }
                // Limpiar también cualquier dato de usuario en localStorage/sessionStorage
                try {
                    localStorage.removeItem('userInfo');
                    sessionStorage.removeItem('userInfo');
                    localStorage.removeItem('magaOfflineActiveSession');
                } catch (e) {
                    // Ignorar errores de localStorage
                }
                window.location.href = targetUrl;
            }
        });
    }
    
    // Detectar cambios en los inputs editables
    const inputsEditables = ['datoUsername', 'datoNombre', 'datoEmail', 'datoTelefono', 'datoColaboradorDpi', 'datoColaboradorDescripcion'];
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    
    inputsEditables.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                // Aplicar validaciones en tiempo real
                if (inputId === 'datoNombre') {
                    validarNombreCompleto(input);
                } else if (inputId === 'datoEmail') {
                    validarEmail(input);
                } else if (inputId === 'datoTelefono') {
                    validarTelefono(input);
                } else if (inputId === 'datoColaboradorDpi') {
                    validarDPI(input);
                }
                checkForChanges();
            });
        }
    });
    
    // Botón guardar cambios
    if (btnGuardarCambios) {
        btnGuardarCambios.addEventListener('click', guardarCambiosUsuario);
    }
}

// Toggle modo edición
async function toggleModoEdicion() {
    // Si estamos activando el modo edición, verificar restricción de tiempo
    if (!modoEdicion) {
        // Verificar si el usuario es admin (no tiene restricción)
        const esAdmin = userData && userData.rol === 'admin';
        
        if (!esAdmin && ultimaEdicion) {
            const tiempoTranscurrido = Date.now() - ultimaEdicion;
            const quinceMinutos = 15 * 60 * 1000; // 15 minutos en milisegundos
            
            if (tiempoTranscurrido < quinceMinutos) {
                const minutosRestantes = Math.ceil((quinceMinutos - tiempoTranscurrido) / (60 * 1000));
                showError(`Debe esperar ${minutosRestantes} minuto(s) antes de poder editar nuevamente.`);
                return;
            }
        }
    }
    
    modoEdicion = !modoEdicion;
    const btnEditarInformacion = document.getElementById('btnEditarInformacion');
    
    if (modoEdicion) {
        // Activar modo edición
        activarModoEdicion();
        if (btnEditarInformacion) {
            btnEditarInformacion.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
                Cancelar Edición
            `;
        }
    } else {
        // Desactivar modo edición
        desactivarModoEdicion();
        if (btnEditarInformacion) {
            btnEditarInformacion.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar Información
            `;
        }
        // Restaurar valores originales
        restaurarValoresOriginales();
    }
}

// Activar modo edición
function activarModoEdicion() {
    // Mostrar mensaje de edición
    const mensajeModoEdicion = document.getElementById('mensajeModoEdicion');
    if (mensajeModoEdicion) {
        mensajeModoEdicion.style.display = 'flex';
    }
    
    // Mostrar campos editables del colaborador
    const dpiInput = document.getElementById('datoColaboradorDpi');
    const dpiDisplay = document.getElementById('datoColaboradorDpiDisplay');
    const descripcionInput = document.getElementById('datoColaboradorDescripcion');
    const descripcionDisplay = document.getElementById('datoColaboradorDescripcionDisplay');
    const hintDpi = document.getElementById('hintDpi');
    const hintDescripcion = document.getElementById('hintDescripcion');
    
    if (dpiInput && dpiDisplay) {
        dpiInput.style.display = 'block';
        dpiDisplay.style.display = 'none';
    }
    if (descripcionInput && descripcionDisplay) {
        descripcionInput.style.display = 'block';
        descripcionDisplay.style.display = 'none';
    }
    if (hintDpi) hintDpi.style.display = 'inline';
    if (hintDescripcion) hintDescripcion.style.display = 'inline';
}

// Desactivar modo edición
function desactivarModoEdicion() {
    // Ocultar mensaje de edición
    const mensajeModoEdicion = document.getElementById('mensajeModoEdicion');
    if (mensajeModoEdicion) {
        mensajeModoEdicion.style.display = 'none';
    }
    
    // Ocultar campos editables del colaborador
    const dpiInput = document.getElementById('datoColaboradorDpi');
    const dpiDisplay = document.getElementById('datoColaboradorDpiDisplay');
    const descripcionInput = document.getElementById('datoColaboradorDescripcion');
    const descripcionDisplay = document.getElementById('datoColaboradorDescripcionDisplay');
    const hintDpi = document.getElementById('hintDpi');
    const hintDescripcion = document.getElementById('hintDescripcion');
    
    if (dpiInput && dpiDisplay) {
        dpiInput.style.display = 'none';
        dpiDisplay.style.display = 'block';
    }
    if (descripcionInput && descripcionDisplay) {
        descripcionInput.style.display = 'none';
        descripcionDisplay.style.display = 'block';
    }
    if (hintDpi) hintDpi.style.display = 'none';
    if (hintDescripcion) hintDescripcion.style.display = 'none';
}

// Restaurar valores originales
function restaurarValoresOriginales() {
    if (!originalUserData) return;
    
    const usernameInput = document.getElementById('datoUsername');
    const nombreInput = document.getElementById('datoNombre');
    const emailInput = document.getElementById('datoEmail');
    const telefonoInput = document.getElementById('datoTelefono');
    
    if (usernameInput) usernameInput.value = originalUserData.username || '';
    if (nombreInput) nombreInput.value = originalUserData.nombre || '';
    if (emailInput) emailInput.value = originalUserData.email || '';
    if (telefonoInput) telefonoInput.value = originalUserData.telefono || '';
    
    // Restaurar valores del colaborador
    if (colaboradorData) {
        const dpiInput = document.getElementById('datoColaboradorDpi');
        const descripcionInput = document.getElementById('datoColaboradorDescripcion');
        const dpiDisplay = document.getElementById('datoColaboradorDpiDisplay');
        const descripcionDisplay = document.getElementById('datoColaboradorDescripcionDisplay');
        
        if (dpiInput) dpiInput.value = colaboradorData.dpi || '';
        if (descripcionInput) descripcionInput.value = colaboradorData.descripcion || '';
        if (dpiDisplay) dpiDisplay.textContent = colaboradorData.dpi || '-';
        if (descripcionDisplay) descripcionDisplay.textContent = colaboradorData.descripcion || '-';
    }
    
    // Ocultar botón guardar
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    if (btnGuardarCambios) {
        btnGuardarCambios.style.display = 'none';
    }
}

// Validaciones
function validarNombreCompleto(input) {
    // Solo letras y espacios
    let valor = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    if (valor !== input.value) {
        input.value = valor;
    }
}

function validarEmail(input) {
    // El navegador ya valida el formato con type="email", pero podemos agregar validación adicional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (input.value && !emailRegex.test(input.value)) {
        input.setCustomValidity('Por favor ingrese un email válido');
    } else {
        input.setCustomValidity('');
    }
}

function validarTelefono(input) {
    // Solo números, máximo 8 dígitos
    let valor = input.value.replace(/\D/g, '').substring(0, 8);
    if (valor !== input.value) {
        input.value = valor;
    }
}

function validarDPI(input) {
    // Solo números, máximo 13 dígitos
    let valor = input.value.replace(/\D/g, '').substring(0, 13);
    if (valor !== input.value) {
        input.value = valor;
    }
}

// Verificar si hay cambios en los datos
function checkForChanges() {
    if (!originalUserData) return;
    
    const usernameInput = document.getElementById('datoUsername');
    const nombreInput = document.getElementById('datoNombre');
    const emailInput = document.getElementById('datoEmail');
    const telefonoInput = document.getElementById('datoTelefono');
    const dpiInput = document.getElementById('datoColaboradorDpi');
    const descripcionInput = document.getElementById('datoColaboradorDescripcion');
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    
    const currentData = {
        username: usernameInput ? usernameInput.value.trim() : '',
        nombre: nombreInput ? nombreInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        telefono: telefonoInput ? telefonoInput.value.trim() : '',
        dpi: dpiInput ? dpiInput.value.trim() : '',
        descripcion: descripcionInput ? descripcionInput.value.trim() : ''
    };
    
    const originalDpi = colaboradorData ? (colaboradorData.dpi || '') : '';
    const originalDescripcion = colaboradorData ? (colaboradorData.descripcion || '') : '';
    
    const hasChanges = 
        currentData.username !== originalUserData.username ||
        currentData.nombre !== originalUserData.nombre ||
        currentData.email !== originalUserData.email ||
        currentData.telefono !== originalUserData.telefono ||
        currentData.dpi !== originalDpi ||
        currentData.descripcion !== originalDescripcion;
    
    if (btnGuardarCambios) {
        if (hasChanges && modoEdicion) {
            btnGuardarCambios.style.display = 'flex';
        } else {
            btnGuardarCambios.style.display = 'none';
        }
    }
}

// Guardar cambios del usuario
async function guardarCambiosUsuario() {
    const usernameInput = document.getElementById('datoUsername');
    const nombreInput = document.getElementById('datoNombre');
    const emailInput = document.getElementById('datoEmail');
    const telefonoInput = document.getElementById('datoTelefono');
    const dpiInput = document.getElementById('datoColaboradorDpi');
    const descripcionInput = document.getElementById('datoColaboradorDescripcion');
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    
    if (!usernameInput || !emailInput) {
        showError('Error: No se pudieron obtener los campos del formulario');
        return;
    }
    
    const username = usernameInput.value.trim();
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const email = emailInput.value.trim();
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';
    const dpi = dpiInput ? dpiInput.value.trim() : '';
    const descripcion = descripcionInput ? descripcionInput.value.trim() : '';
    
    // Validaciones
    if (!username) {
        showError('El nombre de usuario es requerido');
        return;
    }
    
    if (!email) {
        showError('El email es requerido');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('El formato del email no es válido');
        return;
    }
    
    // Validar nombre completo: solo letras y espacios
    if (nombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
        showError('El nombre completo solo puede contener letras y espacios');
        return;
    }
    
    // Validar teléfono si se proporciona (8 dígitos)
    if (telefono && !/^[0-9]{8}$/.test(telefono)) {
        showError('El teléfono debe contener exactamente 8 dígitos');
        return;
    }
    
    // Validar DPI si se proporciona (13 dígitos)
    if (dpi && !/^[0-9]{13}$/.test(dpi)) {
        showError('El DPI debe contener exactamente 13 dígitos');
        return;
    }
    
    // Deshabilitar botón mientras se guarda
    if (btnGuardarCambios) {
        btnGuardarCambios.disabled = true;
        btnGuardarCambios.innerHTML = '<span>Guardando...</span>';
    }
    
    try {
        const response = await fetch('/api/usuario/actualizar-perfil/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                username: username,
                nombre: nombre,
                email: email,
                telefono: telefono,
                dpi: dpi || null,
                descripcion: descripcion || null
            })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            // Si es error 429 (Too Many Requests), mostrar mensaje específico
            if (response.status === 429) {
                throw new Error(result.error || 'Debe esperar 15 minutos entre ediciones. Por favor, intente más tarde.');
            }
            throw new Error(result.error || 'Error al guardar los cambios');
        }
        
        // Actualizar datos originales
        originalUserData = {
            username: username,
            nombre: nombre,
            email: email,
            telefono: telefono
        };
        
        // Actualizar datos del colaborador si existen
        if (colaboradorData) {
            colaboradorData.dpi = dpi || null;
            colaboradorData.descripcion = descripcion || null;
        }
        
        // Ocultar botón guardar
        if (btnGuardarCambios) {
            btnGuardarCambios.style.display = 'none';
        }
        
        // Guardar timestamp de última edición
        ultimaEdicion = Date.now();
        
        // Mostrar mensaje de éxito con información de sincronización
        const mensaje = result.sincronizado_colaborador 
            ? 'Cambios guardados exitosamente (sincronizado con colaborador)'
            : 'Cambios guardados exitosamente';
        showSuccess(mensaje);
        
        // Recargar datos del usuario y colaborador
        await loadUserData();
        
        // Desactivar modo edición
        modoEdicion = false;
        desactivarModoEdicion();
        const btnEditarInformacion = document.getElementById('btnEditarInformacion');
        if (btnEditarInformacion) {
            btnEditarInformacion.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar Información
            `;
        }
        
        // Actualizar nombre de usuario en la navegación
        const navUserName = document.getElementById('navUserName');
        const mobileUserName = document.getElementById('mobileUserName');
        if (navUserName && result.usuario) {
            navUserName.textContent = result.usuario.username || result.usuario.nombre || userData.username;
        }
        if (mobileUserName && result.usuario) {
            mobileUserName.textContent = result.usuario.username || result.usuario.nombre || userData.username;
        }
        
    } catch (error) {
        // Si el error es por restricción de tiempo, mostrar mensaje específico
        if (error.message && error.message.includes('15 minutos')) {
            showError('Debe esperar 15 minutos entre ediciones. Por favor, intente más tarde.');
        } else {
            showError(error.message || 'Error al guardar los cambios');
        }
    } finally {
        // Restaurar botón
        if (btnGuardarCambios) {
            btnGuardarCambios.disabled = false;
            btnGuardarCambios.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Guardar Cambios
            `;
        }
    }
}

// Manejar cambio de foto
async function handleFotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showError('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)');
        return;
    }
    
    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showError('El archivo es demasiado grande. El tamaño máximo es 5MB');
        return;
    }
    
    // Crear FormData
    const formData = new FormData();
    formData.append('foto', file);
    
    // Mostrar loading
    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const originalText = btnCambiarFoto.innerHTML;
    btnCambiarFoto.innerHTML = '<span>Subiendo...</span>';
    btnCambiarFoto.disabled = true;
    
    try {
        // Subir foto
        const response = await fetch('/api/usuario/foto-perfil/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al subir la foto');
        }
        
        const data = await response.json();
        
        // Mostrar nueva foto
        if (data.foto_url) {
            displayProfilePhoto(data.foto_url);
            showSuccess('Foto de perfil actualizada exitosamente');
            
            // Actualizar también en la navegación usando la función global
            if (window.updateProfilePhoto) {
                window.updateProfilePhoto(data.foto_url);
            }
        }
    } catch (error) {
        showError(error.message || 'Error al subir la foto');
    } finally {
        // Restaurar botón
        btnCambiarFoto.innerHTML = originalText;
        btnCambiarFoto.disabled = false;
        event.target.value = '';
    }
}

// Utilidades
function escapeHtml(text) {
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

function showError(message) {
    // Crear notificación de error
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showSuccess(message) {
    // Crear notificación de éxito
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

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

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

