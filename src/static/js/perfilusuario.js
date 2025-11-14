// perfilusuario.js

// Variables globales
let userData = null;
let colaboradorData = null;
let originalUserData = null; // Para detectar cambios

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
        const response = await fetch('/api/usuario/');
        if (!response.ok) {
            if (response.status === 401) {
                // Usuario no autenticado, redirigir a index
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
        showError('Error al cargar los datos del usuario');
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
    const dpiEl = document.getElementById('datoColaboradorDpi');
    const descripcionEl = document.getElementById('datoColaboradorDescripcion');
    
    if (puestoEl) puestoEl.textContent = data.puesto_nombre || '-';
    if (dpiEl) dpiEl.textContent = data.dpi || '-';
    if (descripcionEl) descripcionEl.textContent = data.descripcion || '-';
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
                await fetch(logoutUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    credentials: 'include'
                });
            } catch (error) {
            } finally {
                window.location.href = targetUrl;
            }
        });
    }
    
    // Detectar cambios en los inputs editables
    const inputsEditables = ['datoUsername', 'datoNombre', 'datoEmail', 'datoTelefono'];
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    
    inputsEditables.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                checkForChanges();
            });
        }
    });
    
    // Botón guardar cambios
    if (btnGuardarCambios) {
        btnGuardarCambios.addEventListener('click', guardarCambiosUsuario);
    }
}

// Verificar si hay cambios en los datos
function checkForChanges() {
    if (!originalUserData) return;
    
    const usernameInput = document.getElementById('datoUsername');
    const nombreInput = document.getElementById('datoNombre');
    const emailInput = document.getElementById('datoEmail');
    const telefonoInput = document.getElementById('datoTelefono');
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    
    const currentData = {
        username: usernameInput ? usernameInput.value.trim() : '',
        nombre: nombreInput ? nombreInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        telefono: telefonoInput ? telefonoInput.value.trim() : ''
    };
    
    const hasChanges = 
        currentData.username !== originalUserData.username ||
        currentData.nombre !== originalUserData.nombre ||
        currentData.email !== originalUserData.email ||
        currentData.telefono !== originalUserData.telefono;
    
    if (btnGuardarCambios) {
        if (hasChanges) {
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
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    
    if (!usernameInput || !emailInput) {
        showError('Error: No se pudieron obtener los campos del formulario');
        return;
    }
    
    const username = usernameInput.value.trim();
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const email = emailInput.value.trim();
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';
    
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
    
    // Validar teléfono si se proporciona (8 dígitos)
    if (telefono && !/^[0-9]{8}$/.test(telefono)) {
        showError('El teléfono debe contener exactamente 8 dígitos');
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
                telefono: telefono
            })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Error al guardar los cambios');
        }
        
        // Actualizar datos originales
        originalUserData = {
            username: username,
            nombre: nombre,
            email: email,
            telefono: telefono
        };
        
        // Ocultar botón guardar
        if (btnGuardarCambios) {
            btnGuardarCambios.style.display = 'none';
        }
        
        // Mostrar mensaje de éxito con información de sincronización
        const mensaje = result.sincronizado_colaborador 
            ? 'Cambios guardados exitosamente (sincronizado con colaborador)'
            : 'Cambios guardados exitosamente';
        showSuccess(mensaje);
        
        // Recargar datos del usuario y colaborador
        await loadUserData();
        
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
        showError(error.message || 'Error al guardar los cambios');
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

