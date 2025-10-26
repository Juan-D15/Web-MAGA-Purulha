// ======= LOGIN FUNCTIONALITY =======

// Variables globales
let currentForm = 'login';
let targetAction = null; // Para almacenar la acción que se quiere realizar después del login
let originPage = null; // Para almacenar la página de origen

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
}

// Función para mostrar el formulario de recuperación
function showForgotPassword() {
  currentForm = 'forgot';
  document.getElementById('loginForm').classList.remove('active');
  document.getElementById('forgotPasswordForm').classList.add('active');
  document.getElementById('resetPasswordForm').classList.remove('active');
  
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

// Función para simular el envío de código de recuperación
function sendRecoveryCode(email) {
  // Simular envío de código
  console.log(`Enviando código de recuperación a: ${email}`);
  
  // Simular código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000);
  console.log(`Código de recuperación: ${code}`);
  
  // Mostrar mensaje de éxito
  alert(`Código enviado a ${email}. Código de prueba: ${code}`);
  
  // Habilitar el campo de código
  document.getElementById('recoveryCode').disabled = false;
  document.getElementById('recoveryCode').focus();
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
    console.error('Error al validar credenciales:', error);
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
  
  // Formulario de login - DEJAR QUE DJANGO LO MANEJE
  // El formulario se envía normalmente (sin preventDefault)
  // Django validará las credenciales y manejará la redirección
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      // Verificar si es el formulario del modal (sin action definida originalmente)
      const isModal = this.closest('.login-modal') !== null;
      
      // Mostrar indicador de carga
      const submitButton = this.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Validando...';
      }
      
      // Si es el modal y no tiene action, prevenir y redirigir manualmente
      if (isModal && !this.hasAttribute('data-submitted')) {
        // Marcar como enviado para evitar loops
        this.setAttribute('data-submitted', 'true');
      }
      // NO hacer preventDefault() - dejar que el formulario se envíe normalmente
    });
  }
  
  // Formulario de recuperación
  document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('recoveryEmail').value;
    const code = document.getElementById('recoveryCode').value;
    
    if (!code) {
      // Enviar código
      sendRecoveryCode(email);
    } else {
      // Validar código (simulado)
      if (code.length === 6) {
        showResetPassword();
      } else {
        alert('El código debe tener 6 dígitos.');
      }
    }
  });
  
  // Formulario de cambio de contraseña
  document.getElementById('resetPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validar fortaleza de contraseña
    if (!validatePasswordStrength(newPassword)) {
      alert('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }
    
    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    
    // Simular cambio de contraseña
    alert('Contraseña cambiada exitosamente. Ahora puedes iniciar sesión.');
    showLoginForm();
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
});