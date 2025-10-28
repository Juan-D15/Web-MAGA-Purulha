// navigation.js - Script común para navegación y UI en todas las páginas

(function() {
  'use strict';

  // ========== INICIALIZACIÓN ==========
  document.addEventListener('DOMContentLoaded', function() {
    initDesktopDropdowns();
    initSearchFunctionality();
    initMobileDrawer();
    initUserMenuDesktop();
    initUserMenuMobile();
    initUserInfoDisplay();
    updateActiveProjectLink();
  });

  // ========== DROPDOWNS DE ESCRITORIO ==========
  function initDesktopDropdowns() {
    const dropdowns = document.querySelectorAll('.dd');
    
    const closeAll = () => dropdowns.forEach(dd => {
      const btn = dd.querySelector('.dd__btn');
      const panel = dd.querySelector('.dd__panel');
      if (btn && panel) {
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        panel.classList.remove('show');
      }
    });

    dropdowns.forEach(dd => {
      const btn = dd.querySelector('.dd__btn');
      const panel = dd.querySelector('.dd__panel');
      
      if (!btn || !panel) return;
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.contains('show');
        closeAll();
        if (!isOpen) {
          btn.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          panel.classList.add('show');
        }
      });

      // Permitir que los enlaces dentro del panel funcionen
      const links = panel.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.stopPropagation(); // Evitar que cierre el dropdown
          
          // Manejar enlaces con anclas (#capacitaciones, #entregas, etc.)
          const href = link.getAttribute('href');
          if (href && href.includes('#')) {
            const [path, hash] = href.split('#');
            const currentPath = window.location.pathname;
            
            // Si ya estamos en la página de proyectos
            if (currentPath.includes('/proyectos') && hash) {
              e.preventDefault(); // Prevenir navegación
              closeAll(); // Cerrar dropdown
              
              // Si hay un hash, navegar a esa sección
              if (hash) {
                // Primero actualizar la URL
                window.history.pushState(null, '', href);
                
                // Actualizar enlace activo
                if (window.updateActiveProjectLink) {
                  window.updateActiveProjectLink();
                }
                
                // Luego hacer scroll a la sección
                const targetElement = document.getElementById(hash);
                if (targetElement) {
                  // Ocultar vistas de lista y detalle si existen
                  const listView = document.getElementById('projectsListView');
                  const detailView = document.getElementById('projectDetailView');
                  const mainView = document.querySelector('.projects-main');
                  
                  if (listView) listView.style.display = 'none';
                  if (detailView) detailView.style.display = 'none';
                  if (mainView) mainView.style.display = 'block';
                  
                  // Scroll suave a la sección
                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // Si no existe el elemento, recargar la página
                  window.location.href = href;
                }
              } else {
                // Si no hay hash, mostrar la vista principal
                window.history.pushState(null, '', href);
                
                // Actualizar enlace activo
                if (window.updateActiveProjectLink) {
                  window.updateActiveProjectLink();
                }
                
                const listView = document.getElementById('projectsListView');
                const detailView = document.getElementById('projectDetailView');
                const mainView = document.querySelector('.projects-main');
                
                if (listView) listView.style.display = 'none';
                if (detailView) detailView.style.display = 'none';
                if (mainView) {
                  mainView.style.display = 'block';
                  // Scroll al inicio
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            }
            // Si no estamos en proyectos, dejar que navegue normalmente
          }
          // El navegador procesará el href del enlace si no se previno
        });
      });
    });

    document.addEventListener('click', (e) => {
      // Si el click es dentro de un dropdown, verificar si es un enlace
      const dropdown = e.target.closest('.dd');
      if (dropdown) {
        // Si el click es en un enlace o dentro de un enlace, permitir navegación
        const link = e.target.closest('a');
        if (link) {
          return; // Permitir que el enlace funcione
        }
      } else {
        // Click fuera de dropdowns, cerrar todos
        closeAll();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  // ========== BUSCADOR PRINCIPAL ==========
  function initSearchFunctionality() {
    const searchBtn = document.querySelector('.search .mini');
    const searchInput = document.getElementById('buscar-proyecto');
    
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          console.log('Buscar proyecto:', query);
          // Aquí puedes agregar la funcionalidad de búsqueda
        }
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = searchInput.value.trim();
          if (query) {
            console.log('Buscar proyecto:', query);
            // Aquí puedes agregar la funcionalidad de búsqueda
          }
        }
      });
    }
  }

  // ========== DRAWER MÓVIL ==========
  function initMobileDrawer() {
    const drawer = document.getElementById('drawer');
    const btnHamburger = document.getElementById('btnHamburger');
    const btnCloseDrawer = document.getElementById('btnCloseDrawer');

    if (!drawer || !btnHamburger || !btnCloseDrawer) return;

    const openDrawer = () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      drawer.removeAttribute('inert');
      btnHamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('inert', '');
      btnHamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    btnHamburger.addEventListener('click', openDrawer);
    btnCloseDrawer.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });

    // Acordeón dentro del drawer (excluir menú de usuario móvil)
    document.querySelectorAll('.ddm:not(#mobileUserMenu)').forEach(ddm => {
      const btn = ddm.querySelector('.ddm__btn');
      const panel = ddm.querySelector('.ddm__panel');
      
      if (!btn || !panel) return;
      
      btn.addEventListener('click', () => {
        const open = ddm.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      });
      
      // Manejar enlaces dentro del panel móvil
      const links = panel.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          // Manejar enlaces con anclas
          const href = link.getAttribute('href');
          if (href && href.includes('#')) {
            const [path, hash] = href.split('#');
            const currentPath = window.location.pathname;
            
            // Si ya estamos en la página de proyectos
            if (currentPath.includes('/proyectos') && hash) {
              e.preventDefault(); // Prevenir navegación
              closeDrawer(); // Cerrar drawer móvil
              
              // Si hay un hash, navegar a esa sección
              if (hash) {
                // Primero actualizar la URL
                window.history.pushState(null, '', href);
                
                // Actualizar enlace activo
                if (window.updateActiveProjectLink) {
                  window.updateActiveProjectLink();
                }
                
                // Luego hacer scroll a la sección
                const targetElement = document.getElementById(hash);
                if (targetElement) {
                  // Ocultar vistas de lista y detalle si existen
                  const listView = document.getElementById('projectsListView');
                  const detailView = document.getElementById('projectDetailView');
                  const mainView = document.querySelector('.projects-main');
                  
                  if (listView) listView.style.display = 'none';
                  if (detailView) detailView.style.display = 'none';
                  if (mainView) mainView.style.display = 'block';
                  
                  // Scroll suave a la sección
                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // Si no existe el elemento, recargar la página
                  window.location.href = href;
                }
              } else {
                // Si no hay hash, mostrar la vista principal
                window.history.pushState(null, '', href);
                
                // Actualizar enlace activo
                if (window.updateActiveProjectLink) {
                  window.updateActiveProjectLink();
                }
                
                const listView = document.getElementById('projectsListView');
                const detailView = document.getElementById('projectDetailView');
                const mainView = document.querySelector('.projects-main');
                
                if (listView) listView.style.display = 'none';
                if (detailView) detailView.style.display = 'none';
                if (mainView) {
                  mainView.style.display = 'block';
                  // Scroll al inicio
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            } else {
              // Si no estamos en proyectos, cerrar drawer y dejar que navegue
              closeDrawer();
            }
          } else {
            // Enlaces normales sin ancla, cerrar drawer
            closeDrawer();
          }
        });
      });
    });

    // Configurar menú de usuario móvil (tiene estructura especial)
    setupMobileUserMenu();

    // Exportar closeDrawer para uso externo
    window.closeDrawer = closeDrawer;
  }

  // ========== CONFIGURAR MENÚ DE USUARIO MÓVIL ==========
  function setupMobileUserMenu() {
    const mobileUserMenu = document.getElementById('mobileUserMenu');
    
    if (!mobileUserMenu) return;
    
    // Función para manejar el clic en el botón del menú móvil
    function handleMobileUserMenuClick(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isOpen = mobileUserMenu.classList.contains('open');
      mobileUserMenu.classList.toggle('open');
      
      // Encontrar el botón y panel activos según el estado visible
      const mobileUserLoggedIn = document.getElementById('mobileUserLoggedIn');
      const mobileUserLoggedOut = document.getElementById('mobileUserLoggedOut');
      
      let activeBtn, activePanel;
      
      // Determinar cuál estado está visible
      if (mobileUserLoggedIn && window.getComputedStyle(mobileUserLoggedIn).display !== 'none') {
        // Estado logueado está activo
        activeBtn = mobileUserLoggedIn.querySelector('.ddm__btn');
        activePanel = mobileUserLoggedIn.querySelector('.ddm__panel');
      } else if (mobileUserLoggedOut && window.getComputedStyle(mobileUserLoggedOut).display !== 'none') {
        // Estado no logueado está activo
        activeBtn = mobileUserLoggedOut.querySelector('.ddm__btn');
        activePanel = mobileUserLoggedOut.querySelector('.ddm__panel');
      }
      
      if (activeBtn && activePanel) {
        activeBtn.setAttribute('aria-expanded', String(!isOpen));
        
        if (!isOpen) {
          // Abrir el panel
          activePanel.style.maxHeight = '300px';
        } else {
          // Cerrar el panel
          activePanel.style.maxHeight = '0px';
        }
      }
    }
    
    // Agregar event listener a todos los botones del menú móvil
    const mobileUserBtns = mobileUserMenu.querySelectorAll('.ddm__btn');
    mobileUserBtns.forEach(btn => {
      btn.addEventListener('click', handleMobileUserMenuClick);
    });
  }

  // ========== MENÚ DE USUARIO DESKTOP ==========
  function initUserMenuDesktop() {
    const navUserIcon = document.getElementById('navUserIcon');
    const navUserDropdown = document.getElementById('navUserDropdown');
    const navProfileBtn = document.getElementById('navProfileBtn');
    const navSettingsBtn = document.getElementById('navSettingsBtn');
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    const navLoginBtn = document.getElementById('navLoginBtn');
    const navCloseBtn = document.getElementById('navCloseBtn');

    if (!navUserIcon || !navUserDropdown) return;

    // Toggle dropdown
    navUserIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = navUserDropdown.style.display === 'block';
      if (isVisible) {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
      } else {
        navUserDropdown.style.display = 'block';
        navUserDropdown.classList.add('show');
        navUserIcon.classList.add('active');
      }
    });

    // Perfil
    if (navProfileBtn) {
      navProfileBtn.addEventListener('click', () => {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
        console.log('Mostrar perfil del usuario');
      });
    }

    // Configuración
    if (navSettingsBtn) {
      navSettingsBtn.addEventListener('click', () => {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
        console.log('Mostrar configuración');
      });
    }

    // Logout
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', () => {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
        
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
          // Usar la URL de Django si está disponible
          const logoutUrl = window.DJANGO_URLS?.logout || '/logout/';
          window.location.href = logoutUrl;
        }
      });
    }

    // Login - Redirigir a la página de login
    if (navLoginBtn) {
      navLoginBtn.addEventListener('click', () => {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
        
        // Guardar la página actual como origen antes de redirigir
        sessionStorage.setItem('loginOriginPage', window.location.href);
        window.location.href = window.DJANGO_URLS.login;
      });
    }

    // Cerrar dropdown
    if (navCloseBtn) {
      navCloseBtn.addEventListener('click', () => {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
      });
    }

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!navUserIcon.contains(e.target) && !navUserDropdown.contains(e.target)) {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
      }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navUserDropdown.style.display === 'block') {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
      }
    });
  }

  // ========== MENÚ DE USUARIO MÓVIL ==========
  function initUserMenuMobile() {
    const mobileProfileBtn = document.getElementById('mobileProfileBtn');
    const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');

    // Perfil
    if (mobileProfileBtn) {
      mobileProfileBtn.addEventListener('click', () => {
        if (window.closeDrawer) window.closeDrawer();
        console.log('Mostrar perfil del usuario (móvil)');
      });
    }

    // Configuración
    if (mobileSettingsBtn) {
      mobileSettingsBtn.addEventListener('click', () => {
        if (window.closeDrawer) window.closeDrawer();
        console.log('Mostrar configuración (móvil)');
      });
    }

    // Logout
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        if (window.closeDrawer) window.closeDrawer();
        
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
          const logoutUrl = window.DJANGO_URLS?.logout || '/logout/';
          window.location.href = logoutUrl;
        }
      });
    }

    // Login - Redirigir a la página de login
    if (mobileLoginBtn) {
      mobileLoginBtn.addEventListener('click', () => {
        if (window.closeDrawer) window.closeDrawer();
        
        // Guardar la página actual como origen antes de redirigir
        sessionStorage.setItem('loginOriginPage', window.location.href);
        window.location.href = window.DJANGO_URLS.login;
      });
    }
  }

  // ========== MOSTRAR INFO DE USUARIO ==========
  function initUserInfoDisplay() {
    // La visibilidad inicial ya se maneja en el template de Django
    // Esta función solo se mantiene para posibles actualizaciones dinámicas futuras
    console.log('User info display initialized');
  }

  // ========== FUNCIONES DE ADMINISTRADOR (GESTIONES) ==========
  function handleGestionesAction(action) {
    console.log('handleGestionesAction called with action:', action);
    
    // Usar las variables globales de base.html
    if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin) {
      console.log('Redirecting to gestioneventos as admin');
      if (window.DJANGO_URLS && window.DJANGO_URLS.gestioneseventos) {
        window.location.href = window.DJANGO_URLS.gestioneseventos;
      }
    } else if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && !window.USER_AUTH.isAdmin) {
      alert('No tienes permisos de administrador para acceder a esta sección.');
    } else {
      console.log('User not authenticated, redirecting to login');
      sessionStorage.setItem('gestionesAction', action);
      sessionStorage.setItem('loginOriginPage', window.location.href);
      if (window.DJANGO_URLS && window.DJANGO_URLS.login) {
        window.location.href = window.DJANGO_URLS.login;
      }
    }
  }

  // Exponer funciones globales necesarias
  window.handleGestionesAction = handleGestionesAction;

  // ========== MARCAR ENLACE ACTIVO EN PROYECTOS ==========
  function updateActiveProjectLink() {
    // Solo ejecutar si estamos en la página de proyectos
    if (!window.location.pathname.includes('/proyectos')) {
      return;
    }

    const hash = window.location.hash;
    
    // Remover clase active de todos los enlaces de proyectos
    const allProjectLinks = document.querySelectorAll('.dd__item[href*="/proyectos"], .ddm__item[href*="/proyectos"]');
    allProjectLinks.forEach(link => link.classList.remove('active'));

    // Marcar el enlace activo según el hash
    let activeSelector = '';
    if (hash === '#capacitaciones') {
      activeSelector = '[href$="#capacitaciones"]';
    } else if (hash === '#entregas') {
      activeSelector = '[href$="#entregas"]';
    } else if (hash === '#proyectos-ayuda') {
      activeSelector = '[href$="#proyectos-ayuda"]';
    } else {
      // Sin hash o "Ver Todos"
      activeSelector = '[href="/proyectos/"]:not([href*="#"])';
    }

    if (activeSelector) {
      const activeLinks = document.querySelectorAll(`.dd__item${activeSelector}, .ddm__item${activeSelector}`);
      activeLinks.forEach(link => {
        link.classList.add('active');
      });
    }
  }

  // Actualizar cuando cambie el hash (sin recargar la página)
  window.addEventListener('hashchange', updateActiveProjectLink);

  // Exponer para uso externo
  window.updateActiveProjectLink = updateActiveProjectLink;

})();

