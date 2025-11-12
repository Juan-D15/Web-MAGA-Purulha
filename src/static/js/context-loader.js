(function (window, document) {
  'use strict';

  function parseBool(value) {
    if (typeof value !== 'string') {
      return false;
    }
    var normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  var contextEl = document.getElementById('djangoContextData');
  if (!contextEl) {
    return;
  }

  var data = contextEl.dataset || {};

  window.DJANGO_URLS = {
    mapaCompleto: data.urlMapaCompleto || '',
    login: data.urlLogin || '',
    logout: data.urlLogout || '',
    gestioneseventos: data.urlGestiones || '',
    proyectos: data.urlProyectos || '',
    reportes: data.urlReportes || '',
    perfilusuario: data.urlPerfil || '',
    configgeneral: data.urlConfig || '',
    preguntasFrecuentes: data.urlPreguntas || '',
    usuario: data.urlUsuario || '',
    calendarEvents: data.urlCalendar || '',
    eventsList: data.urlEventsList || '',
    avances: data.urlAvances || '',
    reminders: data.urlReminders || '',
    remindersPending: data.urlRemindersPending || '',
    marcarNotificacionEnviadaBase: data.urlMarcarNotificacion || '',
    collaborators: data.urlCollaborators || ''
  };

  var isAdmin = parseBool(data.userAdmin);
  var isPersonal = parseBool(data.userPersonal);
  
  window.USER_AUTH = {
    isAuthenticated: parseBool(data.userAuthenticated),
    isAdmin: isAdmin,
    isPersonal: isPersonal,
    username: data.userUsername || '',
    email: data.userEmail || '',
    permisos: {
      es_admin: isAdmin,
      es_personal: isPersonal,
      puede_gestionar_eventos: isAdmin || isPersonal,
      puede_generar_reportes: parseBool(data.userAuthenticated)
    }
  };

  if (contextEl.parentNode) {
    contextEl.parentNode.removeChild(contextEl);
  }
})(window, document);

