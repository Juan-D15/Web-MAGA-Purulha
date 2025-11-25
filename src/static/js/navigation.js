// navigation.js - Script común para navegación y UI en todas las páginas

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

  // ========== BUSCADOR PRINCIPAL (BUSCA PROYECTOS) ==========
  function initSearchFunctionality() {
    const searchBtn = document.querySelector('.search .mini');
    const searchInput = document.getElementById('buscar-proyecto');
    
    if (searchBtn && searchInput) {
      // Función para ejecutar la búsqueda de proyectos
      const executeProjectSearch = () => {
        const query = searchInput.value.trim();
        if (!query) return;
        
        debugLog('Buscar proyecto:', query);
        const isOnProjectsPage = window.location.pathname.includes('/proyectos');
        
          // Si estamos en la página de proyectos Y las funciones están disponibles, usar búsqueda local
          // NOTA: El buscador de la navbar NO sincroniza con el buscador de la lista
          if (isOnProjectsPage && typeof window.showListView === 'function' && typeof window.filterProjectsBySearch === 'function') {
            // Verificar si estamos en la vista de lista
            const listView = document.getElementById('projectsListView');
            if (listView && listView.style.display !== 'none') {
              // Ya estamos en la vista de lista, buscar directamente
              // NO actualizar el valor del buscador de la lista
              window.filterProjectsBySearch(query);
            } else {
              // Si no estamos en la vista de lista, mostrarla primero y luego buscar
              if (typeof window.showListView === 'function') {
                window.showListView();
                setTimeout(() => {
                  // NO actualizar el valor del buscador de la lista
                  if (typeof window.filterProjectsBySearch === 'function') {
                    window.filterProjectsBySearch(query);
                  }
                  // Mostrar el botón de limpiar si hay texto
                  const searchClearBtn = document.getElementById('searchClearBtn');
                  if (searchClearBtn && query.trim()) {
                    searchClearBtn.style.display = 'block';
                  }
                }, 500);
              }
            }
        } else {
          // NO estamos en la página de proyectos O las funciones no están disponibles
          // Guardar la búsqueda en sessionStorage para aplicarla al cargar
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('projectSearchQuery', query);
            sessionStorage.setItem('showProjectsList', 'true');
          }
          const proyectosUrl = window.DJANGO_URLS?.proyectos || '/proyectos/';
          window.location.href = proyectosUrl;
        }
      };

      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        executeProjectSearch();
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeProjectSearch();
        }
      });

      // Búsqueda en tiempo real si estamos en la página de proyectos
      // NOTA: El buscador de la navbar NO sincroniza con el buscador de la lista
      // Cada uno funciona de forma independiente
      if (window.location.pathname.includes('/proyectos')) {
        let searchTimeout = null;
        searchInput.addEventListener('input', function() {
          const query = this.value.trim();
          
          // Limpiar timeout anterior
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }

          // Aplicar búsqueda después de un pequeño delay
          // SIN sincronizar con el buscador de la lista
          searchTimeout = setTimeout(() => {
            if (typeof window.filterProjectsBySearch === 'function') {
              // Verificar si estamos en la vista de listado
              const listView = document.getElementById('projectsListView');
              if (listView && listView.style.display !== 'none') {
                // Ya estamos en la vista de lista, buscar directamente
                // NO actualizar el valor del buscador de la lista
                window.filterProjectsBySearch(query);
                
                // Mostrar/ocultar botón de limpiar del buscador de la lista
                const searchClearBtn = document.getElementById('searchClearBtn');
                if (searchClearBtn) {
                  searchClearBtn.style.display = query ? 'flex' : 'none';
                }
              } else if (typeof window.showListView === 'function') {
                // Si no estamos en la vista de listado, mostrarla primero
                window.showListView();
                setTimeout(() => {
                  if (typeof window.filterProjectsBySearch === 'function') {
                    // NO actualizar el valor del buscador de la lista
                    window.filterProjectsBySearch(query);
                    
                    // Mostrar/ocultar botón de limpiar del buscador de la lista
                    const searchClearBtn = document.getElementById('searchClearBtn');
                    if (searchClearBtn) {
                      searchClearBtn.style.display = query ? 'flex' : 'none';
                    }
                  }
                }, 500);
              }
            }
          }, 500);
        });
      }
    }

    // ========== BUSCADOR DE COMUNIDADES EN DROPDOWN ==========
    const searchComunidadesInput = document.getElementById('search-comunidades');
    const searchComunidadesBtn = document.getElementById('search-comunidades-btn');
    
    // Función para ejecutar la búsqueda (igual que el input de búsqueda en comunidades.html)
    const executeCommunitiesSearch = () => {
      if (!searchComunidadesInput) return;
      
      const query = searchComunidadesInput.value.trim();
      const isOnCommunitiesPage = window.location.pathname.includes('/comunidades');
      
      // Si estamos en la página de comunidades Y las funciones están disponibles, usar búsqueda local
      if (isOnCommunitiesPage && typeof window.searchCommunities === 'function' && typeof window.showCommunitiesList === 'function') {
        // Verificar si estamos en la vista de listado
        const listView = document.getElementById('communitiesListView');
        if (listView && listView.style.display !== 'none') {
          // Ya estamos en la vista de listado, buscar directamente
          // Sincronizar con el buscador principal
          const mainSearchInput = document.getElementById('searchCommunities');
          if (mainSearchInput) {
            mainSearchInput.value = query;
          }
          window.searchCommunities(query);
        } else {
          // Si no estamos en la vista de listado, mostrarla primero y luego buscar
          window.showCommunitiesList().then(() => {
            setTimeout(() => {
              if (typeof window.searchCommunities === 'function') {
                const mainSearchInput = document.getElementById('searchCommunities');
                if (mainSearchInput) {
                  mainSearchInput.value = query;
                }
                window.searchCommunities(query);
              }
            }, 300);
          });
        }
      } else {
        // NO estamos en la página de comunidades O las funciones no están disponibles
        // SIEMPRE navegar a la vista del listado
        // Guardar la búsqueda y navegar
        navigateToCommunitiesWithSearch(query);
      }
    };

    if (searchComunidadesInput) {
      let searchTimeout = null;

      // Al escribir en el buscador del dropdown
      searchComunidadesInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Filtrar los enlaces del dropdown mientras se escribe
        filterComunidadesDropdown(query);

        // Si hay una query y estamos en la página de comunidades, aplicar búsqueda en tiempo real
        if (query && window.location.pathname.includes('/comunidades')) {
          // Limpiar timeout anterior
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }

          // Aplicar búsqueda después de un pequeño delay
          searchTimeout = setTimeout(() => {
            // Si existe la función de búsqueda de comunidades, usarla
            if (typeof window.searchCommunities === 'function') {
              // Verificar si estamos en la vista de listado
              const listView = document.getElementById('communitiesListView');
              if (listView && listView.style.display !== 'none') {
                // Sincronizar con el buscador principal
                const mainSearchInput = document.getElementById('searchCommunities');
                if (mainSearchInput) {
                  mainSearchInput.value = query;
                }
                window.searchCommunities(query);
              } else if (typeof window.showCommunitiesList === 'function') {
                // Si no estamos en la vista de listado, mostrarla primero
                window.showCommunitiesList().then(() => {
                  setTimeout(() => {
                    if (typeof window.searchCommunities === 'function') {
                      const mainSearchInput = document.getElementById('searchCommunities');
                      if (mainSearchInput) {
                        mainSearchInput.value = query;
                      }
                      window.searchCommunities(query);
                    }
                  }, 300);
                });
              }
            }
          }, 500);
        }
      });

      // Al presionar Enter, ejecutar la búsqueda y redirigir si es necesario
      searchComunidadesInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          executeCommunitiesSearch();
        }
      });

      // NO navegar automáticamente al hacer blur, solo al presionar Enter o clic en botón
      // Esto permite que el usuario pueda hacer clic en los enlaces sin problemas
    }

    // Botón de búsqueda (SVG/icono) - mismo funcionamiento que el input
    if (searchComunidadesBtn) {
      searchComunidadesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        executeCommunitiesSearch();
      });
    }

    // ========== BUSCADOR DE COMUNIDADES EN MENÚ HAMBURGUESA (MÓVIL) ==========
    const searchComunidadesMobileInput = document.getElementById('search-comunidades-mobile');
    const searchComunidadesMobileBtn = document.getElementById('search-comunidades-mobile-btn');
    
    // Función para ejecutar la búsqueda desde el menú móvil (misma lógica)
    const executeCommunitiesSearchMobile = () => {
      if (!searchComunidadesMobileInput) return;
      
      const query = searchComunidadesMobileInput.value.trim();
      const isOnCommunitiesPage = window.location.pathname.includes('/comunidades');
      
      // Si estamos en la página de comunidades Y las funciones están disponibles, usar búsqueda local
      if (isOnCommunitiesPage && typeof window.searchCommunities === 'function' && typeof window.showCommunitiesList === 'function') {
        // Verificar si estamos en la vista de listado
        const listView = document.getElementById('communitiesListView');
        if (listView && listView.style.display !== 'none') {
          // Ya estamos en la vista de listado, buscar directamente
          // Sincronizar con el buscador principal
          const mainSearchInput = document.getElementById('searchCommunities');
          if (mainSearchInput) {
            mainSearchInput.value = query;
          }
          window.searchCommunities(query);
        } else {
          // Si no estamos en la vista de listado, mostrarla primero y luego buscar
          window.showCommunitiesList().then(() => {
            setTimeout(() => {
              if (typeof window.searchCommunities === 'function') {
                const mainSearchInput = document.getElementById('searchCommunities');
                if (mainSearchInput) {
                  mainSearchInput.value = query;
                }
                window.searchCommunities(query);
              }
            }, 300);
          });
        }
      } else {
        // NO estamos en la página de comunidades O las funciones no están disponibles
        // SIEMPRE navegar a la vista del listado
        // Guardar la búsqueda y navegar
        navigateToCommunitiesWithSearch(query);
      }
      
      // Cerrar el drawer móvil después de navegar
      if (typeof window.closeDrawer === 'function') {
        window.closeDrawer();
      }
    };

    if (searchComunidadesMobileInput) {
      let searchTimeoutMobile = null;

      // Al escribir en el buscador del menú móvil
      searchComunidadesMobileInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Si hay una query y estamos en la página de comunidades, aplicar búsqueda en tiempo real
        if (query && window.location.pathname.includes('/comunidades')) {
          // Limpiar timeout anterior
          if (searchTimeoutMobile) {
            clearTimeout(searchTimeoutMobile);
          }

          // Aplicar búsqueda después de un pequeño delay
          searchTimeoutMobile = setTimeout(() => {
            // Si existe la función de búsqueda de comunidades, usarla
            if (typeof window.searchCommunities === 'function') {
              // Verificar si estamos en la vista de listado
              const listView = document.getElementById('communitiesListView');
              if (listView && listView.style.display !== 'none') {
                // Sincronizar con el buscador principal
                const mainSearchInput = document.getElementById('searchCommunities');
                if (mainSearchInput) {
                  mainSearchInput.value = query;
                }
                window.searchCommunities(query);
              } else if (typeof window.showCommunitiesList === 'function') {
                // Si no estamos en la vista de listado, mostrarla primero
                window.showCommunitiesList().then(() => {
                  setTimeout(() => {
                    if (typeof window.searchCommunities === 'function') {
                      const mainSearchInput = document.getElementById('searchCommunities');
                      if (mainSearchInput) {
                        mainSearchInput.value = query;
                      }
                      window.searchCommunities(query);
                    }
                  }, 300);
                });
              }
            }
          }, 500);
        }
      });

      // Al presionar Enter, ejecutar la búsqueda y redirigir si es necesario
      searchComunidadesMobileInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          executeCommunitiesSearchMobile();
        }
      });
    }

    // Botón de búsqueda móvil (SVG/icono) - mismo funcionamiento que el input
    if (searchComunidadesMobileBtn) {
      searchComunidadesMobileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        executeCommunitiesSearchMobile();
      });
    }
  }

  // Función para filtrar comunidades en el dropdown
  function filterComunidadesDropdown(query) {
    const comunidadesList = document.getElementById('comunidades-list');
    if (!comunidadesList) return;

    const items = comunidadesList.querySelectorAll('.dd__item');
    const queryLower = query.toLowerCase();

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const dataName = item.getAttribute('data-name') || '';
      if (text.includes(queryLower) || dataName.toLowerCase().includes(queryLower)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  // Función para navegar a la página de comunidades con búsqueda
  function navigateToCommunitiesWithSearch(query) {
    // Guardar la búsqueda en sessionStorage para que se aplique al cargar la página
    if (typeof sessionStorage !== 'undefined') {
      if (query && query.trim()) {
        sessionStorage.setItem('communitiesSearchQuery', query.trim());
      } else {
        sessionStorage.removeItem('communitiesSearchQuery');
      }
      // SIEMPRE mostrar el listado al navegar
      sessionStorage.setItem('showCommunitiesList', 'true');
    }

    // Obtener URL de comunidades de forma más robusta
    let comunidadesUrl = '/comunidades/';
    const comunidadesLink = document.querySelector('a[href*="comunidades"]');
    if (comunidadesLink) {
      const href = comunidadesLink.getAttribute('href');
      if (href) {
        // Extraer solo la ruta, sin hash ni query params
        comunidadesUrl = href.split('#')[0].split('?')[0];
      }
    }

    // Navegar a la página de comunidades
    window.location.href = comunidadesUrl;
  }

  // Exponer la función para que esté disponible globalmente
  window.navigateToCommunitiesWithSearch = navigateToCommunitiesWithSearch;

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
      drawerOpen = true;
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('inert', '');
      btnHamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      drawerOpen = false;
    };

    let drawerOpen = false;

    const handleDrawerToggle = () => {
      if (drawerOpen) {
        closeDrawer();
        drawerOpen = false;
      } else {
        openDrawer();
        drawerOpen = true;
      }
    };

    btnHamburger.addEventListener('click', handleDrawerToggle);
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

    // Perfil - Ya es un enlace, solo cerrar el dropdown al hacer clic
    if (navProfileBtn) {
      navProfileBtn.addEventListener('click', () => {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
      });
    }

    // Configuración
    if (navSettingsBtn) {
      navSettingsBtn.addEventListener('click', () => {
        navUserDropdown.style.display = 'none';
        navUserDropdown.classList.remove('show');
        navUserIcon.classList.remove('active');
        debugLog('Mostrar configuración');
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

    // Perfil - Ya es un enlace, solo cerrar el drawer al hacer clic
    if (mobileProfileBtn) {
      mobileProfileBtn.addEventListener('click', () => {
        if (window.closeDrawer) window.closeDrawer();
      });
    }

    // Configuración
    if (mobileSettingsBtn) {
      mobileSettingsBtn.addEventListener('click', () => {
        if (window.closeDrawer) window.closeDrawer();
        debugLog('Mostrar configuración (móvil)');
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
    // Cargar foto de perfil si el usuario está autenticado
    if (window.USER_AUTH && window.USER_AUTH.isAuthenticated) {
      loadProfilePhotoForNav();
    }
    debugLog('User info display initialized');
  }

  // ========== CARGAR FOTO DE PERFIL EN NAVEGACIÓN ==========
  async function loadProfilePhotoForNav() {
    // Esperar a que los elementos estén disponibles
    const navAvatarInitial = document.getElementById('navUserAvatarInitial');
    const navAvatarImage = document.getElementById('navUserAvatarImage');
    const mobileAvatarInitial = document.getElementById('mobileUserAvatarInitial');
    const mobileAvatarImage = document.getElementById('mobileUserAvatarImage');
    
    if (!navAvatarInitial || !navAvatarImage || !mobileAvatarInitial || !mobileAvatarImage) {
      // Si los elementos no están disponibles, esperar un poco y reintentar
      setTimeout(loadProfilePhotoForNav, 100);
      return;
    }
    
    try {
      const response = await fetch('/api/usuario/foto-perfil/');
      if (!response.ok) {
        // Si no hay foto, mantener la inicial (ya está en el HTML)
        return;
      }
      const data = await response.json();
      
      if (data.success && data.foto_url) {
        updateProfilePhotoInNav(data.foto_url);
      }
    } catch (error) {
      // En caso de error, mantener la inicial
    }
  }

  // ========== ACTUALIZAR FOTO DE PERFIL EN NAVEGACIÓN ==========
  function updateProfilePhotoInNav(fotoUrl) {
    if (!fotoUrl) return;
    
    // Actualizar avatar en desktop
    const navAvatarInitial = document.getElementById('navUserAvatarInitial');
    const navAvatarImage = document.getElementById('navUserAvatarImage');
    if (navAvatarInitial && navAvatarImage) {
      navAvatarInitial.style.display = 'none';
      navAvatarImage.src = fotoUrl;
      navAvatarImage.style.display = 'block';
      // Los estilos ya están en el CSS
    }
    
    // Actualizar avatar en móvil
    const mobileAvatarInitial = document.getElementById('mobileUserAvatarInitial');
    const mobileAvatarImage = document.getElementById('mobileUserAvatarImage');
    if (mobileAvatarInitial && mobileAvatarImage) {
      mobileAvatarInitial.style.display = 'none';
      mobileAvatarImage.src = fotoUrl;
      mobileAvatarImage.style.display = 'block';
      // Los estilos ya están en el CSS
    }
  }

  // Exponer función globalmente para uso desde otras páginas
  window.updateProfilePhoto = updateProfilePhotoInNav;

  // ========== FUNCIONES DE ADMINISTRADOR (GESTIONES) ==========
  function handleGestionesAction(action) {
    debugLog('handleGestionesAction called with action:', action);
    
    // Usar las variables globales de base.html
    if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && window.USER_AUTH.isAdmin) {
      debugLog('Redirecting to gestioneventos as admin');
      if (window.DJANGO_URLS && window.DJANGO_URLS.gestioneseventos) {
        // Determinar el hash según la acción
        let hash = '';
        if (action === 'createEventView') {
          hash = '#createEventView';
        } else if (action === 'manageEventView') {
          hash = '#manageEventView';
        } else if (action === 'createReport') {
          // Redirigir a la página de reportes
          if (window.DJANGO_URLS && window.DJANGO_URLS.reportes) {
            window.location.href = window.DJANGO_URLS.reportes;
            return;
          }
          hash = '#createReport';
        }
        window.location.href = window.DJANGO_URLS.gestioneseventos + hash;
      }
    } else if (window.USER_AUTH && window.USER_AUTH.isAuthenticated && !window.USER_AUTH.isAdmin) {
      alert('No tienes permisos de administrador para acceder a esta sección.');
    } else {
      debugLog('User not authenticated, redirecting to login');
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

