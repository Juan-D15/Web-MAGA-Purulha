from django.urls import path
from . import views

app_name = 'webmaga'

urlpatterns = [
    # Autenticación
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Vistas HTML
    path('', views.index, name='index'),
    path('comunidades/', views.comunidades, name='comunidades'),
    path('regiones/', views.regiones, name='regiones'),
    path('proyectos/', views.proyectos, name='proyectos'),
    path('gestioneseventos/', views.gestioneseventos, name='gestioneseventos'),
    path('generarreportes/', views.generarreportes, name='generarreportes'),
    path('mapa-completo/', views.mapa_completo, name='mapa-completo'),
    
    # APIs JSON (para AJAX)
    path('api/usuario/', views.api_usuario_actual, name='api-usuario'),
    path('api/regiones/', views.api_regiones, name='api-regiones'),
    path('api/comunidades/', views.api_comunidades, name='api-comunidades'),
    path('api/actividades/', views.api_actividades, name='api-actividades'),
    
    # APIs de Gestión de Eventos
    path('api/evento/crear/', views.api_crear_evento, name='api-crear-evento'),
    path('api/eventos/', views.api_listar_eventos, name='api-listar-eventos'),
    path('api/evento/<uuid:evento_id>/', views.api_obtener_evento, name='api-obtener-evento'),
    path('api/evento/<uuid:evento_id>/actualizar/', views.api_actualizar_evento, name='api-actualizar-evento'),
    path('api/evento/<uuid:evento_id>/eliminar/', views.api_eliminar_evento, name='api-eliminar-evento'),
    path('api/evento/<uuid:evento_id>/galeria/agregar/', views.api_agregar_imagen_galeria, name='api-agregar-imagen-galeria'),
    path('api/evento/<uuid:evento_id>/galeria/<uuid:imagen_id>/eliminar/', views.api_eliminar_imagen_galeria, name='api-eliminar-imagen-galeria'),
    path('api/evento/<uuid:evento_id>/archivo/agregar/', views.api_agregar_archivo, name='api-agregar-archivo'),
    path('api/evento/<uuid:evento_id>/archivo/<uuid:archivo_id>/eliminar/', views.api_eliminar_archivo, name='api-eliminar-archivo'),
    path('api/evento/<uuid:evento_id>/cambio/crear/', views.api_crear_cambio, name='api-crear-cambio'),
    path('api/evento/<uuid:evento_id>/cambio/<uuid:cambio_id>/actualizar/', views.api_actualizar_cambio, name='api-actualizar-cambio'),
    path('api/evento/<uuid:evento_id>/cambio/<uuid:cambio_id>/eliminar/', views.api_eliminar_cambio, name='api-eliminar-cambio'),
    path('api/evento/<uuid:evento_id>/cambio/<uuid:cambio_id>/evidencia/agregar/', views.api_agregar_evidencia_cambio, name='api-agregar-evidencia-cambio'),
    path('api/evento/<uuid:evento_id>/cambio/<uuid:cambio_id>/evidencia/<uuid:evidencia_id>/eliminar/', views.api_eliminar_evidencia_cambio, name='api-eliminar-evidencia-cambio'),
    path('api/evento/<uuid:evento_id>/cambio/<uuid:cambio_id>/evidencia/<uuid:evidencia_id>/actualizar/', views.api_actualizar_evidencia_cambio, name='api-actualizar-evidencia-cambio'),
    path('api/cambios-recientes/', views.api_cambios_recientes, name='api-cambios-recientes'),
    path('api/personal/', views.api_listar_personal, name='api-personal'),
    path('api/beneficiarios/', views.api_listar_beneficiarios, name='api-beneficiarios'),
    path('api/beneficiario/<uuid:beneficiario_id>/', views.api_obtener_beneficiario, name='api-obtener-beneficiario'),
    path('api/verificar-admin/', views.api_verificar_admin, name='api-verificar-admin'),
    
    # APIs de Proyectos
    path('api/proyectos/<str:tipo_actividad>/', views.api_listar_proyectos_por_tipo, name='api-proyectos-por-tipo'),
    path('api/ultimos-proyectos/', views.api_ultimos_proyectos, name='api-ultimos-proyectos'),
    path('api/proyecto/<uuid:evento_id>/', views.api_obtener_detalle_proyecto, name='api-detalle-proyecto'),
    
    # APIs para Inicio
    path('api/ultimos-eventos-inicio/', views.api_ultimos_eventos_inicio, name='api-ultimos-eventos-inicio'),
    # APIs para Calendario
    path('api/calendar-events/', views.api_calendar_events, name='api-calendar-events'),
    path('api/reminders/', views.api_reminders, name='api-reminders'),
    path('api/avances/', views.api_avances, name='api-avances'),
    path('api/reminders/<uuid:reminder_id>/', views.api_reminder_detail, name='api-reminder-detail'),
    path('api/events-list/', views.api_events_list, name='api-events-list'),
    path('api/collaborators/', views.api_collaborators, name='api-collaborators'),
]

