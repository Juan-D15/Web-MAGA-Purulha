// admin-gestiones.js - Funciones para gestión de administradores y acceso a Gestiones

(function() {
  'use strict';

  const DEBUG_LOGS = (() => {
    try {
      return Boolean(window && window.localStorage && window.localStorage.getItem('WEBMAGA_DEBUG'));
    } catch (err) {
      return false;
    }
  })();
  const debugLog = (...args) => { if (DEBUG_LOGS) (() => {})(); };

  // ========== VERIFICAR ACCESO DE ADMINISTRADOR ==========
  function checkAdminAccess() {
    // Usar las variables globales de Django si están disponibles
    if (window.USER_AUTH) {
      return window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin;
    }
    
    // Fallback: verificar en localStorage/sessionStorage (compatibilidad con código legacy)
    const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        
        // Corregir automáticamente si es admin pero no tiene la propiedad isAdmin
        if (user.username === 'admin' && !user.isAdmin) {
          debugLog('Fixing admin user - adding isAdmin property');
          user.isAdmin = true;
          localStorage.setItem('userInfo', JSON.stringify(user));
        }
        
        // Verificar si es administrador
        return user.username === 'admin' && user.isAdmin === true;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }

  // ========== CARGAR INFORMACIÓN DE USUARIO ==========
  function loadUserInfo() {
    // Ya no es necesario porque Django maneja esto en el template
    // Esta función se mantiene para compatibilidad con código legacy
    debugLog('User info managed by Django template');
  }

  // ========== MOSTRAR MODAL DE LOGIN DE ADMINISTRADOR ==========
  function showAdminLoginModal() {
    debugLog('showAdminLoginModal called');
    
    // Crear modal de login para administrador
    const modal = document.createElement('div');
    modal.id = 'adminLoginModal';
    modal.className = 'admin-login-modal';
    modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 10000;';
    
    modal.innerHTML = `
      <div class="admin-login-content" style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%;">
        <div class="admin-login-header" style="margin-bottom: 1.5rem;">
          <h2 style="margin: 0 0 0.5rem 0; color: #1a73e8;">Acceso de Administrador</h2>
          <p style="margin: 0; color: #666; font-size: 0.9rem;">Ingrese sus credenciales de administrador para acceder a la gestión de eventos</p>
        </div>
        <div class="admin-login-body">
          <form id="adminLoginForm" class="admin-login-form">
            <div class="admin-form-group" style="margin-bottom: 1rem;">
              <label for="adminUsername" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Usuario</label>
              <input type="text" id="adminUsername" name="adminUsername" required 
                     style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
            </div>
            <div class="admin-form-group" style="margin-bottom: 1rem; position: relative;">
              <label for="adminPassword" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Contraseña</label>
              <div style="position: relative;">
                <input type="password" id="adminPassword" name="adminPassword" required 
                       style="width: 100%; padding: 0.75rem; padding-right: 3rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                <button type="button" class="admin-password-toggle" onclick="window.toggleAdminPassword()" 
                        style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 0.5rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>
            <div id="adminLoginError" class="admin-error-message" style="display: none; color: #d32f2f; font-size: 0.875rem; margin-bottom: 1rem;">
              Credenciales incorrectas. Intente nuevamente.
            </div>
            <div class="admin-form-actions" style="display: flex; gap: 0.5rem;">
              <button type="submit" class="admin-btn-primary" 
                      style="flex: 1; padding: 0.75rem; background: #1a73e8; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; font-weight: 500;">
                Acceder
              </button>
              <button type="button" class="admin-btn-secondary" onclick="window.closeAdminLoginModal()" 
                      style="flex: 1; padding: 0.75rem; background: #f1f3f4; color: #5f6368; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; font-weight: 500;">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Enfocar el campo de usuario
    setTimeout(() => {
      const usernameInput = document.getElementById('adminUsername');
      if (usernameInput) {
        usernameInput.focus();
      }
    }, 100);
    
    // Manejar el envío del formulario
    const form = document.getElementById('adminLoginForm');
    if (form) {
      form.onsubmit = function(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('adminUsername');
        const passwordInput = document.getElementById('adminPassword');
        const errorDiv = document.getElementById('adminLoginError');
        
        if (!usernameInput || !passwordInput || !errorDiv) {
          return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Verificar credenciales de administrador
        // NOTA: En producción, esto debe validarse en el backend
        if (username === 'admin' && password === 'admin123') {
          debugLog('Admin credentials correct, redirecting to gestioneventos');
          
          // Redirigir usando la URL de Django
          const gestionesUrl = window.DJANGO_URLS?.gestioneseventos || '/gestioneseventos/';
          window.location.href = gestionesUrl;
        } else {
          debugLog('Admin credentials incorrect');
          errorDiv.style.display = 'block';
          errorDiv.textContent = 'Credenciales incorrectas. Intente nuevamente.';
        }
      };
    }
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeAdminLoginModal();
      }
    });
    
    // Cerrar modal con Escape
    const escapeHandler = function(e) {
      if (e.key === 'Escape') {
        closeAdminLoginModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  // ========== CERRAR MODAL DE LOGIN DE ADMINISTRADOR ==========
  function closeAdminLoginModal() {
    debugLog('closeAdminLoginModal called');
    const modal = document.getElementById('adminLoginModal');
    
    if (modal) {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
      
      // Limpiar la acción guardada en sessionStorage
      sessionStorage.removeItem('gestionesAction');
      
      debugLog('Modal closed successfully');
    }
  }

  // ========== ALTERNAR VISIBILIDAD DE CONTRASEÑA ==========
  function toggleAdminPassword() {
    debugLog('toggleAdminPassword called');
    const passwordInput = document.getElementById('adminPassword');
    const toggleBtn = document.querySelector('.admin-password-toggle');
    
    if (passwordInput && toggleBtn) {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
      } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
      }
    }
  }

  // ========== MANEJAR ACCIONES DE GESTIONES (OVERRIDE) ==========
  // Esta función sobrescribe la versión básica de navigation.js con lógica de modal
  function handleGestionesActionWithModal(action) {
    debugLog('handleGestionesActionWithModal called with action:', action);
    
    // Usar las variables globales de base.html
    if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin) {
      debugLog('Redirecting to gestioneventos as admin');
      const gestionesUrl = window.DJANGO_URLS?.gestioneseventos || '/gestioneseventos/';
      window.location.href = gestionesUrl;
    } else if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && !window.USER_AUTH.isAdmin) {
      alert('No tienes permisos de administrador para acceder a esta sección.');
    } else {
      debugLog('User not authenticated, showing admin login modal');
      sessionStorage.setItem('gestionesAction', action);
      showAdminLoginModal();
    }
  }

  // Exponer funciones globales
  window.checkAdminAccess = checkAdminAccess;
  window.loadUserInfo = loadUserInfo;
  window.showAdminLoginModal = showAdminLoginModal;
  window.closeAdminLoginModal = closeAdminLoginModal;
  window.toggleAdminPassword = toggleAdminPassword;
  
  // Sobrescribir handleGestionesAction con la versión que tiene modal
  window.handleGestionesAction = handleGestionesActionWithModal;

  debugLog('Admin gestiones module loaded');
})();

