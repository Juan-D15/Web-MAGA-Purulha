// configgeneral.js

// Variables globales
let notificationPermission = null;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // 1. Configurar notificaciones
    setupNotifications();
    
    // 2. Configurar formulario de asistencia
    setupAsistenciaForm();
    
    // 3. Configurar toggle del formulario de asistencia
    setupAsistenciaToggle();
    
    // 4. Verificar estado de notificaciones
    checkNotificationPermission();
});

// ========== NOTIFICACIONES ==========
function setupNotifications() {
    const btnPermitirNotificaciones = document.getElementById('btnPermitirNotificaciones');
    
    if (!btnPermitirNotificaciones) return;
    
    btnPermitirNotificaciones.addEventListener('click', async function() {
        await requestNotificationPermission();
    });
}

async function requestNotificationPermission() {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
        showMessage('Tu navegador no soporta notificaciones', 'error');
        return;
    }
    
    // Verificar el estado actual del permiso
    if (Notification.permission === 'granted') {
        showMessage('Las notificaciones ya están permitidas', 'success');
        updateNotificationButton('granted');
        return;
    }
    
    if (Notification.permission === 'denied') {
        showMessage('Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.', 'error');
        return;
    }
    
    // Solicitar permiso
    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        
        if (permission === 'granted') {
            showMessage('¡Notificaciones permitidas! Recibirás alertas importantes del sistema.', 'success');
            updateNotificationButton('granted');
            
            // Mostrar una notificación de prueba (opcional)
            try {
                new Notification('Notificaciones Activadas', {
                    body: 'Ahora recibirás notificaciones importantes del sistema.',
                    icon: '/static/img/logos/maga_logo.png',
                    tag: 'notification-enabled'
                });
            } catch (error) {
                console.log('No se pudo mostrar la notificación de prueba:', error);
            }
        } else if (permission === 'denied') {
            showMessage('Las notificaciones fueron denegadas. Puedes habilitarlas más tarde en la configuración de tu navegador.', 'error');
            updateNotificationButton('denied');
        } else {
            showMessage('Permiso de notificaciones no otorgado', 'error');
            updateNotificationButton('default');
        }
    } catch (error) {
        console.error('Error al solicitar permiso de notificaciones:', error);
        showMessage('Error al solicitar permiso de notificaciones', 'error');
    }
}

function checkNotificationPermission() {
    if (!('Notification' in window)) {
        updateNotificationButton('not-supported');
        return;
    }
    
    notificationPermission = Notification.permission;
    updateNotificationButton(notificationPermission);
}

function updateNotificationButton(permission) {
    const btnPermitirNotificaciones = document.getElementById('btnPermitirNotificaciones');
    
    if (!btnPermitirNotificaciones) return;
    
    switch (permission) {
        case 'granted':
            btnPermitirNotificaciones.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Notificaciones Permitidas
            `;
            btnPermitirNotificaciones.classList.remove('btn-primary');
            btnPermitirNotificaciones.classList.add('btn-secondary');
            btnPermitirNotificaciones.disabled = true;
            break;
        case 'denied':
            btnPermitirNotificaciones.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Notificaciones Bloqueadas
            `;
            btnPermitirNotificaciones.disabled = true;
            break;
        case 'not-supported':
            btnPermitirNotificaciones.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                No Soportado
            `;
            btnPermitirNotificaciones.disabled = true;
            break;
        default:
            // Mantener el estado original
            break;
    }
}

// ========== TOGGLE FORMULARIO DE ASISTENCIA ==========
function setupAsistenciaToggle() {
    const asistenciaHeader = document.getElementById('asistenciaHeader');
    const asistenciaContent = document.getElementById('asistenciaContent');
    const asistenciaToggle = document.getElementById('asistenciaToggle');
    
    if (!asistenciaHeader || !asistenciaContent) return;
    
    // Verificar el estado inicial (expandido por defecto por la clase en HTML)
    let isExpanded = asistenciaHeader.classList.contains('expanded');
    
    function toggleForm() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            asistenciaContent.classList.remove('collapsed');
            asistenciaHeader.classList.add('expanded');
        } else {
            asistenciaContent.classList.add('collapsed');
            asistenciaHeader.classList.remove('expanded');
        }
    }
    
    // Agregar event listeners
    if (asistenciaHeader) {
        asistenciaHeader.addEventListener('click', function(e) {
            // No toggle si se hace clic en el botón toggle directamente (evitar doble toggle)
            if (e.target.closest('.asistencia-toggle')) {
                return;
            }
            toggleForm();
        });
    }
    
    if (asistenciaToggle) {
        asistenciaToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleForm();
        });
    }
}

// ========== FORMULARIO DE ASISTENCIA ==========
function setupAsistenciaForm() {
    const formAsistencia = document.getElementById('formAsistencia');
    
    if (!formAsistencia) return;
    
    formAsistencia.addEventListener('submit', function(e) {
        e.preventDefault();
        handleAsistenciaSubmit();
    });
    
    // Si el usuario está autenticado, prellenar algunos campos
    if (window.USER_AUTH && window.USER_AUTH.isAuthenticated) {
        const nombreInput = document.getElementById('asistenciaNombre');
        
        if (nombreInput && window.USER_AUTH.username) {
            nombreInput.value = window.USER_AUTH.username;
        }
    }
}

async function handleAsistenciaSubmit() {
    const form = document.getElementById('formAsistencia');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Obtener valores del formulario
    const nombre = document.getElementById('asistenciaNombre').value.trim();
    const tipo = document.getElementById('asistenciaTipo').value;
    const mensaje = document.getElementById('asistenciaMensaje').value.trim();
    
    // Validaciones
    if (!nombre || !tipo || !mensaje) {
        showMessage('Por favor, completa todos los campos requeridos', 'error');
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Enviando...
        `;
    }
    
    // Obtener el token CSRF
    const csrftoken = getCookie('csrftoken');
    
    try {
        // Enviar petición al servidor
        const response = await fetch('/api/asistencia-tecnica/enviar/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                nombre: nombre,
                tipo: tipo,
                mensaje: mensaje
            })
        });
        
        const data = await response.json();
        
        // Log para depuración
        console.log('Respuesta del servidor:', {
            status: response.status,
            ok: response.ok,
            data: data
        });
        
        if (response.ok && data.success) {
            showMessage(data.message || '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.', 'success');
            
            // Limpiar formulario
            form.reset();
            
            // Restaurar el nombre del usuario si está autenticado
            if (window.USER_AUTH && window.USER_AUTH.isAuthenticated) {
                const nombreInput = document.getElementById('asistenciaNombre');
                if (nombreInput && window.USER_AUTH.username) {
                    nombreInput.value = window.USER_AUTH.username;
                }
            }
        } else {
            // Mostrar error detallado
            const errorMessage = data.error || data.detail || 'Error al enviar el mensaje. Por favor, intenta nuevamente.';
            console.error('Error del servidor:', {
                error: data.error,
                detail: data.detail,
                status: response.status
            });
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        showMessage('Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.', 'error');
    } finally {
        // Restaurar botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Enviar
            `;
        }
    }
}

// Función auxiliar para obtener el token CSRF
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

// ========== MENSAJES ==========
function showMessage(message, type = 'info') {
    // Crear elemento de mensaje
    const messageEl = document.createElement('div');
    messageEl.className = `config-message config-message-${type}`;
    messageEl.textContent = message;
    
    // Estilos para el mensaje
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    // Colores según el tipo
    switch (type) {
        case 'success':
            messageEl.style.background = '#28a745';
            break;
        case 'error':
            messageEl.style.background = '#dc3545';
            break;
        case 'warning':
            messageEl.style.background = '#ffc107';
            messageEl.style.color = '#000';
            break;
        default:
            messageEl.style.background = '#17a2b8';
    }
    
    // Agregar al DOM
    document.body.appendChild(messageEl);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 5000);
}

// Agregar animaciones CSS dinámicamente
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

