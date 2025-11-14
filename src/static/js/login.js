// ======= LOGIN FUNCTIONALITY =======

// Variables globales
let currentForm = 'login';
let targetAction = null; // Para almacenar la acción que se quiere realizar después del login
let originPage = null; // Para almacenar la página de origen
const recoveryState = {
  email: null,
  token: null,
  codeSent: false,
};
const RECOVERY_ALERT_VARIANTS = ['recovery-alert-info', 'recovery-alert-success', 'recovery-alert-warning', 'recovery-alert-error'];
let recoveryMessageTimeout = null;
const LOGIN_ALERT_VARIANTS = ['login-alert-info', 'login-alert-success', 'login-alert-error'];

// Función para alternar la visibilidad de la contraseña
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleButton = document.querySelector('.password-toggle');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    passwordInput.type = 'password';
    toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

// Función para alternar la visibilidad de la nueva contraseña
function toggleNewPassword() {
  const passwordInput = document.getElementById('newPassword');
  const toggleButton = document.querySelector('#newPassword').parentElement.querySelector('.password-toggle');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    passwordInput.type = 'password';
    toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

// Función para alternar la visibilidad de la confirmación de contraseña
function toggleConfirmPassword() {
  const passwordInput = document.getElementById('confirmPassword');
  const toggleButton = document.querySelector('#confirmPassword').parentElement.querySelector('.password-toggle');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    passwordInput.type = 'password';
    toggleButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

// Función para mostrar el modal de login
function showLoginModal(action) {
  targetAction = action;
  // Capturar la página de origen desde el referrer o la URL actual
  originPage = document.referrer || window.location.href;
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = 'flex';
    // Resetear formularios
    showLoginForm();
    // Limpiar campos
    document.getElementById('usernameOrEmail').value = '';
    document.getElementById('password').value = '';
    document.getElementById('rememberUser').checked = false;
  }
}

// Función para ocultar el modal de login
function hideLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = 'none';
    targetAction = null;
    originPage = null;
  }
}

// Función para mostrar el formulario de login
function showLoginForm() {
  currentForm = 'login';
  document.getElementById('loginForm').classList.add('active');
  document.getElementById('forgotPasswordForm').classList.remove('active');
  document.getElementById('resetPasswordForm').classList.remove('active');
  clearRecoveryMessage();
}

// Función para mostrar el formulario de recuperación
function showForgotPassword() {
  currentForm = 'forgot';
  document.getElementById('loginForm').classList.remove('active');
  document.getElementById('forgotPasswordForm').classList.add('active');
  document.getElementById('resetPasswordForm').classList.remove('active');
  
  resetRecoveryFlow();
  
  // Pre-llenar el email si está disponible en el login
  const usernameOrEmail = document.getElementById('usernameOrEmail').value;
  if (usernameOrEmail && usernameOrEmail.includes('@')) {
    document.getElementById('recoveryEmail').value = usernameOrEmail;
  }
}

// Función para mostrar el formulario de cambio de contraseña
function showResetPassword() {
  currentForm = 'reset';
  document.getElementById('loginForm').classList.remove('active');
  document.getElementById('forgotPasswordForm').classList.remove('active');
  document.getElementById('resetPasswordForm').classList.add('active');
  document.getElementById('resetPasswordForm').reset();
  validatePasswordStrength('');
  document.getElementById('confirmPassword').style.borderColor = '';
}

// Función para validar la fortaleza de la contraseña
function validatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password)
  };
  
  // Actualizar indicadores visuales
  document.getElementById('reqLength').classList.toggle('valid', requirements.length);
  document.getElementById('reqUppercase').classList.toggle('valid', requirements.uppercase);
  document.getElementById('reqLowercase').classList.toggle('valid', requirements.lowercase);
  document.getElementById('reqNumber').classList.toggle('valid', requirements.number);
  
  return Object.values(requirements).every(req => req);
}

// Función para validar que las contraseñas coincidan
function validatePasswordMatch() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (confirmPassword && newPassword === confirmPassword) {
    document.getElementById('confirmPassword').style.borderColor = 'rgba(16, 185, 129, 0.5)';
    return true;
  } else if (confirmPassword) {
    document.getElementById('confirmPassword').style.borderColor = 'rgba(252, 165, 165, 0.5)';
    return false;
  }
  return false;
}

function showRecoveryMessage(message, type = 'info') {
  const container = document.getElementById('recoveryMessageContainer');
  const textEl = document.getElementById('recoveryMessageText');
 
  if (!container || !textEl) {
    return;
  }
 
  const variants = {
    success: { className: 'recovery-alert-success' },
    error: { className: 'recovery-alert-error' },
    warning: { className: 'recovery-alert-warning' },
    info: { className: 'recovery-alert-info' },
  };
 
  const selected = variants[type] || variants.info;
 
  if (recoveryMessageTimeout) {
    clearTimeout(recoveryMessageTimeout);
    recoveryMessageTimeout = null;
  }

  container.classList.remove(...RECOVERY_ALERT_VARIANTS);
  container.classList.add(selected.className);
  textEl.textContent = message;
  container.style.display = 'flex';
  container.setAttribute('role', 'alert');

  recoveryMessageTimeout = setTimeout(() => {
    clearRecoveryMessage();
  }, 4000);
}

function clearRecoveryMessage() {
  const container = document.getElementById('recoveryMessageContainer');
  const textEl = document.getElementById('recoveryMessageText');
 
  if (!container) {
    return;
  }
 
  if (recoveryMessageTimeout) {
    clearTimeout(recoveryMessageTimeout);
    recoveryMessageTimeout = null;
  }

  container.style.display = 'none';
  container.classList.remove(...RECOVERY_ALERT_VARIANTS);
  container.removeAttribute('role');
 
  if (textEl) {
    textEl.textContent = '';
  }
}

function showLoginInlineMessage(message, type = 'info') {
  const container = document.getElementById('loginOfflineMessage');
  if (!container) {
    return;
  }
  container.classList.remove(...LOGIN_ALERT_VARIANTS);
  const map = {
    info: 'login-alert-info',
    success: 'login-alert-success',
    error: 'login-alert-error',
  };
  container.classList.add(map[type] || map.info);
  container.textContent = message;
  container.style.display = 'flex';
}

function clearLoginInlineMessage() {
  const container = document.getElementById('loginOfflineMessage');
  if (!container) {
    return;
  }
  container.style.display = 'none';
  container.textContent = '';
  container.classList.remove(...LOGIN_ALERT_VARIANTS);
}

function resetRecoveryFlow() {
  recoveryState.email = null;
  recoveryState.token = null;
  recoveryState.codeSent = false;
  clearRecoveryMessage();
  const form = document.getElementById('forgotPasswordForm');
  if (form) {
    form.reset();
  }
  const emailInput = document.getElementById('recoveryEmail');
  const codeInput = document.getElementById('recoveryCode');
  const submitButton = document.querySelector('#forgotPasswordForm button[type="submit"]');
  if (codeInput) {
    codeInput.value = '';
    codeInput.disabled = true;
  }
  if (emailInput) {
    emailInput.removeAttribute('readonly');
  }
  if (submitButton) {
    submitButton.textContent = 'Enviar Código';
  }
}

async function requestRecoveryCode(email) {
  const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');
  const normalizedEmail = email.trim().toLowerCase();
  const response = await fetch('/api/auth/recovery/send-code/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({ email: normalizedEmail }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'No pudimos enviar el código de verificación. Intenta nuevamente.');
  }
  recoveryState.email = normalizedEmail;
  recoveryState.codeSent = true;
  recoveryState.token = null;
  return data;
}

async function verifyRecoveryCodeRequest(email, code) {
  const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');
  const response = await fetch('/api/auth/recovery/verify-code/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({ email, code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.reset_token) {
    throw new Error(data.error || 'El código ingresado no es válido.');
  }
  recoveryState.token = data.reset_token;
  return data;
}

async function resetPasswordRequest(newPassword) {
  if (!recoveryState.email || !recoveryState.token) {
    throw new Error('Debes validar el código de verificación antes de cambiar la contraseña.');
  }
  const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');
  const response = await fetch('/api/auth/recovery/reset-password/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({
      email: recoveryState.email,
      token: recoveryState.token,
      password: newPassword,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'No fue posible actualizar la contraseña. Intenta nuevamente.');
  }
  return data;
}

// Función para validar credenciales con el backend de Django
async function validateCredentials(username, password) {
  try {
    // Obtener el CSRF token
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');
    
    // Hacer petición al backend de Django
    const response = await fetch('/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrftoken
      },
      body: new URLSearchParams({
        'username': username,
        'password': password,
        'remember_me': document.getElementById('rememberUser')?.checked || false
      })
    });
    
    // Si la respuesta es una redirección (login exitoso)
    if (response.redirected) {
      return { 
        success: true, 
        redirectUrl: response.url,
        username: username 
      };
    }
    
    // Si es 200 pero no redirige, obtener el HTML y buscar errores
    const html = await response.text();
    
    // Verificar si hay errores en el HTML
    if (html.includes('Credenciales incorrectas') || html.includes('Usuario o contraseña incorrectos')) {
      return null;
    }
    
    // Si llegamos aquí, asumimos que el login fue exitoso
    return { 
      success: true, 
      username: username 
    };
    
  } catch (error) {
    return null;
  }
}

// Función auxiliar para obtener el CSRF token de las cookies
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

// Función para detectar la página de origen al cargar el login
function detectOriginPage() {
  // Si no hay originPage definida, intentar obtenerla de diferentes fuentes
  if (!originPage) {
    // 1. Intentar obtener desde sessionStorage (si se guardó previamente)
    const savedOrigin = sessionStorage.getItem('loginOriginPage');
    if (savedOrigin) {
      originPage = savedOrigin;
      sessionStorage.removeItem('loginOriginPage'); // Limpiar después de usar
      return;
    }
    
    // 2. Intentar obtener desde el referrer
    if (document.referrer && document.referrer !== window.location.href) {
      originPage = document.referrer;
      return;
    }
    
    // 3. Intentar obtener desde parámetros URL
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('return');
    if (returnUrl) {
      originPage = returnUrl;
      return;
    }
    
    // 4. Por defecto, usar la página principal
    originPage = '/';
  }
}

// Función para detectar si el login se inició desde los botones de Gestiones
function isFromGestionesAction() {
  // Verificar si hay una acción de gestiones guardada en sessionStorage
  const gestionesAction = sessionStorage.getItem('gestionesAction');
  if (gestionesAction) {
    sessionStorage.removeItem('gestionesAction'); // Limpiar después de usar
    return gestionesAction;
  }
  
  // Verificar si hay parámetros URL que indiquen una acción de gestiones
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  if (action && ['createEventView', 'manageEventView', 'createReport'].includes(action)) {
    return action;
  }
  
  return null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Detectar la página de origen al cargar
  detectOriginPage();
  resetRecoveryFlow();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const emailFromQuery = params.get('email');
  if (mode === 'password-recovery') {
    showForgotPassword();
    const emailInput = document.getElementById('recoveryEmail');
    const contextDataEl = document.getElementById('djangoContextData');
    const fallbackEmail = contextDataEl ? contextDataEl.dataset.userEmail : '';
    const emailValue = emailFromQuery || fallbackEmail || '';
    if (emailInput) {
      emailInput.value = emailValue;
      if (emailValue) {
        emailInput.removeAttribute('readonly');
      }
    }
    const usernameField = document.getElementById('usernameOrEmail');
    if (usernameField && emailValue) {
      usernameField.value = emailValue;
    }
  }
  
  // Formulario de login: usar AJAX para login online y offline
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // SIEMPRE prevenir envío tradicional

      const usernameInput = document.getElementById('usernameOrEmail');
      const passwordInput = document.getElementById('password');
      const rememberCheckbox = document.getElementById('rememberUser');
      const submitButton = this.querySelector('button[type="submit"]');

      const usernameValue = usernameInput?.value?.trim() || '';
      const passwordValue = passwordInput?.value || '';

      // Validación básica del lado del cliente
      if (!usernameValue || !passwordValue) {
        clearLoginInlineMessage();
        showLoginInlineMessage('Ingresa tu usuario y contraseña para continuar.', 'error');
        return;
      }

      // Deshabilitar botón
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Verificando...';
      }

      try {
        // Si estamos OFFLINE, intentar login offline
        if (!navigator.onLine) {
          clearLoginInlineMessage();
          
          if (!window.OfflineAuth || typeof window.OfflineAuth.tryOfflineLogin !== 'function') {
            throw new Error('Este dispositivo no cuenta con credenciales offline guardadas.');
          }
          
          const result = await window.OfflineAuth.tryOfflineLogin(usernameValue, passwordValue);
          if (!result.success) {
            throw new Error(result.error || 'No fue posible iniciar sesión en modo offline.');
          }
          
          showLoginInlineMessage('Sesión iniciada en modo offline. Redirigiendo…', 'success');
          setTimeout(() => {
            window.location.href = result.redirectUrl || '/';
          }, 600);
          return;
        }

        // Si estamos ONLINE, hacer login por API
        clearLoginInlineMessage();
        
        const response = await fetch('/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          body: JSON.stringify({
            username: usernameValue,
            password: passwordValue,
            remember_me: rememberCheckbox?.checked || false,
            device_id: window.OfflineAuth ? window.OfflineAuth.getDeviceId() : null,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al iniciar sesión');
        }

        // ✅ GUARDAR CREDENCIALES OFFLINE (si el usuario lo solicitó)
        if (rememberCheckbox?.checked && data.offline && window.OfflineAuth) {
          try {
            await window.OfflineAuth.storeCredential(usernameValue, passwordValue, {
              durationHours: 720, // 30 días
              userInfo: data.user,
              serverHash: data.offline.hash,
              serverSalt: data.offline.salt,
            });
          } catch (offlineError) {
            console.warn('No se pudieron guardar las credenciales offline:', offlineError);
          }
        }

        // Mostrar mensaje de éxito y redirigir
        showLoginInlineMessage('Inicio de sesión exitoso. Redirigiendo…', 'success');
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/';
        }, 600);

      } catch (error) {
        showLoginInlineMessage(error.message || 'No fue posible iniciar sesión.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Acceder';
        }
      }
    });
  }

  // Función auxiliar para obtener CSRF token
  function getCsrfToken() {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='));
    return cookieValue ? cookieValue.split('=')[1] : null;
  }
  
  // Formulario de recuperación
  document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearRecoveryMessage();
    const emailInput = document.getElementById('recoveryEmail');
    const codeInput = document.getElementById('recoveryCode');
    const submitButton = this.querySelector('button[type="submit"]');
    const email = emailInput.value.trim();
    
    if (!email) {
      showRecoveryMessage('Ingresa un correo de recuperación válido.', 'warning');
      return;
    }

    try {
      submitButton.disabled = true;
      if (!recoveryState.codeSent) {
        submitButton.textContent = 'Enviando...';
        const data = await requestRecoveryCode(email);
        showRecoveryMessage(data.message || 'Enviamos el código a tu correo. Revisa tu bandeja de entrada.', 'success');
        codeInput.disabled = false;
        codeInput.focus();
        emailInput.setAttribute('readonly', 'readonly');
        submitButton.textContent = 'Verificar Código';
      } else if (!recoveryState.token) {
        const code = codeInput.value.trim();
        if (code.length !== 6 || !/^[0-9]{6}$/.test(code)) {
          showRecoveryMessage('Ingresa el código de 6 dígitos que recibiste por correo.', 'warning');
          return;
        }
        submitButton.textContent = 'Verificando...';
        const data = await verifyRecoveryCodeRequest(recoveryState.email, code);
        showRecoveryMessage(data.message || 'Código verificado correctamente.', 'success');
        codeInput.value = '';
        submitButton.textContent = 'Enviar Código';
        showResetPassword();
        const resetForm = document.getElementById('resetPasswordForm');
        if (resetForm) {
          resetForm.dataset.email = recoveryState.email;
        }
      } else {
        // Permitir reenviar un nuevo código en caso sea necesario
        submitButton.textContent = 'Enviando...';
        const data = await requestRecoveryCode(email);
        showRecoveryMessage(data.message || 'Se envió un nuevo código a tu correo.', 'success');
        codeInput.disabled = false;
        codeInput.focus();
        emailInput.setAttribute('readonly', 'readonly');
        submitButton.textContent = 'Verificar Código';
      }
    } catch (error) {
      showRecoveryMessage(error.message || 'Ocurrió un error al procesar la solicitud.', 'error');
    } finally {
      submitButton.disabled = false;
      if (!recoveryState.codeSent) {
        submitButton.textContent = 'Enviar Código';
      } else if (!recoveryState.token) {
        submitButton.textContent = 'Verificar Código';
      }
    }
  });
  
  // Formulario de cambio de contraseña
  document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearRecoveryMessage();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitButton = this.querySelector('button[type="submit"]');
    
    if (!validatePasswordStrength(newPassword)) {
      showRecoveryMessage('La contraseña no cumple con los requisitos de seguridad.', 'warning');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showRecoveryMessage('Las contraseñas no coinciden.', 'warning');
      return;
    }

    if (!recoveryState.email || !recoveryState.token) {
      showRecoveryMessage('Debes verificar tu código antes de cambiar la contraseña.', 'warning');
      showForgotPassword();
      return;
    }
    
    try {
      submitButton.disabled = true;
      submitButton.textContent = 'Guardando...';
      const data = await resetPasswordRequest(newPassword);
      showRecoveryMessage(data.message || 'La contraseña se actualizó correctamente.', 'success');
      document.getElementById('resetPasswordForm').reset();
      document.getElementById('forgotPasswordForm').reset();
      validatePasswordStrength('');
      document.getElementById('confirmPassword').style.borderColor = '';
      resetRecoveryFlow();
    showLoginForm();
    } catch (error) {
      showRecoveryMessage(error.message || 'No se pudo actualizar la contraseña.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Cambiar Contraseña';
    }
  });
  
  // Validación de contraseña en tiempo real
  document.getElementById('newPassword').addEventListener('input', function() {
    validatePasswordStrength(this.value);
  });
  
  // Validación de coincidencia de contraseñas
  document.getElementById('confirmPassword').addEventListener('input', function() {
    validatePasswordMatch();
  });
  
  // Cerrar modal con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('loginModal');
      if (modal && modal.style.display === 'flex') {
        hideLoginModal();
      }
    }
  });
  
  // Exponer funciones globalmente para que puedan ser llamadas desde otros archivos
  window.showLoginModal = showLoginModal;
  window.hideLoginModal = hideLoginModal;
  window.showLoginForm = showLoginForm;
  window.showForgotPassword = showForgotPassword;
  window.showResetPassword = showResetPassword;
  window.togglePassword = togglePassword;
  window.toggleNewPassword = toggleNewPassword;
  window.toggleConfirmPassword = toggleConfirmPassword;
  window.clearRecoveryMessage = clearRecoveryMessage;
});