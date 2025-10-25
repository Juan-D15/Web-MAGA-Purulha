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

// Función para validar credenciales (simulada)
function validateCredentials(username, password) {
  // Credenciales de prueba
  const validCredentials = [
    { username: 'admin', password: 'admin123', name: 'Administrador', email: 'admin@maga.gt' },
    { username: 'usuario', password: 'usuario123', name: 'Usuario', email: 'usuario@maga.gt' },
    { username: 'test@maga.gt', password: 'test123', name: 'Usuario Test', email: 'test@maga.gt' }
  ];
  
  return validCredentials.find(cred => 
    (cred.username === username || cred.email === username) && cred.password === password
  );
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
  
  // Formulario de login
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('usernameOrEmail').value;
    const password = document.getElementById('password').value;
    const rememberUser = document.getElementById('rememberUser').checked;
    
    // Validar credenciales
    const user = validateCredentials(username, password);
    
    if (user) {
      // Guardar información del usuario
      if (rememberUser) {
        localStorage.setItem('userInfo', JSON.stringify(user));
      } else {
        sessionStorage.setItem('userInfo', JSON.stringify(user));
      }
      
      // Ocultar modal
      hideLoginModal();
      
      // Detectar si el login se inició desde una acción de Gestiones
      const gestionesAction = isFromGestionesAction();
      
      // Redirigir según la acción solicitada o a la página de origen
      if (targetAction === 'createEventView' || gestionesAction === 'createEventView') {
        window.location.href = '/gestioneseventos/';
      } else if (targetAction === 'manageEventView' || gestionesAction === 'manageEventView') {
        window.location.href = '/gestioneseventos/';
      } else if (targetAction === 'createReport' || gestionesAction === 'createReport') {
        window.location.href = '/gestioneseventos/';
      } else if (originPage && originPage !== window.location.href) {
        // Redirigir a la página de origen si existe y es diferente a la actual
        window.location.href = originPage;
      } else {
        // Redirigir a la página principal por defecto
        window.location.href = '/';
      }
    } else {
      alert('Credenciales incorrectas. Intenta nuevamente.');
    }
  });
  
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
});