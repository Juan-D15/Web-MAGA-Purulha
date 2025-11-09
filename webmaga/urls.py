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
    path('gestionusuarios/', views.gestionusuarios, name='gestionusuarios'),
    path('generarreportes/', views.generarreportes, name='generarreportes'),
    path('reportes/', views.reportes_index, name='reportes-index'),
    path('mapa-completo/', views.mapa_completo, name='mapa-completo'),
    
    # APIs JSON (para AJAX)
    path('api/usuario/', views.api_usuario_actual, name='api-usuario'),
    path('api/regiones/', views.api_regiones, name='api-regiones'),
    path('api/regiones/recientes/', views.api_regiones_recientes, name='api-regiones-recientes'),
    path('api/region/<uuid:region_id>/', views.api_region_detalle, name='api-region-detalle'),
    path('api/region/<uuid:region_id>/descripcion/', views.api_actualizar_region_descripcion, name='api-actualizar-region-descripcion'),
    path('api/region/<uuid:region_id>/galeria/agregar/', views.api_agregar_imagen_region, name='api-agregar-imagen-region'),
    path('api/region/<uuid:region_id>/galeria/<uuid:imagen_id>/eliminar/', views.api_eliminar_imagen_region, name='api-eliminar-imagen-region'),
    path('api/region/<uuid:region_id>/archivo/agregar/', views.api_agregar_archivo_region, name='api-agregar-archivo-region'),
    path('api/region/<uuid:region_id>/archivo/<uuid:archivo_id>/actualizar/', views.api_actualizar_archivo_region, name='api-actualizar-archivo-region'),
    path('api/region/<uuid:region_id>/archivo/<uuid:archivo_id>/eliminar/', views.api_eliminar_archivo_region, name='api-eliminar-archivo-region'),
    path('api/comunidades/', views.api_comunidades, name='api-comunidades'),
    path('api/comunidad/<uuid:comunidad_id>/', views.api_comunidad_detalle, name='api-comunidad-detalle'),
    path('api/comunidad/<uuid:comunidad_id>/datos/', views.api_actualizar_comunidad_datos, name='api-actualizar-comunidad-datos'),
    path('api/comunidad/<uuid:comunidad_id>/galeria/agregar/', views.api_agregar_imagen_comunidad, name='api-agregar-imagen-comunidad'),
    path('api/comunidad/<uuid:comunidad_id>/galeria/<uuid:imagen_id>/eliminar/', views.api_eliminar_imagen_comunidad, name='api-eliminar-imagen-comunidad'),
    path('api/comunidad/<uuid:comunidad_id>/descripcion/', views.api_actualizar_comunidad_descripcion, name='api-actualizar-comunidad-descripcion'),
    path('api/comunidad/<uuid:comunidad_id>/archivos/agregar/', views.api_agregar_archivo_comunidad, name='api-agregar-archivo-comunidad'),
    path('api/comunidad/<uuid:comunidad_id>/archivos/<uuid:archivo_id>/actualizar/', views.api_actualizar_archivo_comunidad, name='api-actualizar-archivo-comunidad'),
    path('api/comunidad/<uuid:comunidad_id>/archivos/<uuid:archivo_id>/eliminar/', views.api_eliminar_archivo_comunidad, name='api-eliminar-archivo-comunidad'),
    path('api/actividades/', views.api_actividades, name='api-actividades'),
    path('api/tipos-actividad/', views.api_tipos_actividad, name='api-tipos-actividad'),
    
    # APIs de Gestión de Eventos
    path('api/evento/crear/', views.api_crear_evento, name='api-crear-evento'),
    path('api/eventos/', views.api_listar_eventos, name='api-listar-eventos'),
    path('api/evento/<uuid:evento_id>/', views.api_obtener_evento, name='api-obtener-evento'),
    path('api/evento/<uuid:evento_id>/actualizar/', views.api_actualizar_evento, name='api-actualizar-evento'),
    path('api/evento/<uuid:evento_id>/eliminar/', views.api_eliminar_evento, name='api-eliminar-evento'),
    path('api/evento/<uuid:evento_id>/galeria/agregar/', views.api_agregar_imagen_galeria, name='api-agregar-imagen-galeria'),
    path('api/evento/<uuid:evento_id>/galeria/<uuid:imagen_id>/eliminar/', views.api_eliminar_imagen_galeria, name='api-eliminar-imagen-galeria'),
    path('api/evento/<uuid:evento_id>/archivo/agregar/', views.api_agregar_archivo, name='api-agregar-archivo'),
    path('api/evento/<uuid:evento_id>/archivo/<uuid:archivo_id>/actualizar/', views.api_actualizar_archivo_evento, name='api-actualizar-archivo-evento'),
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
    
    # APIs de Gestión de Usuarios y Colaboradores
    path('api/usuarios/', views.api_listar_usuarios, name='api-listar-usuarios'),
    path('api/usuario/<uuid:usuario_id>/', views.api_obtener_usuario, name='api-obtener-usuario'),
    path('api/usuario/crear/', views.api_crear_usuario, name='api-crear-usuario'),
    path('api/usuario/<uuid:usuario_id>/actualizar/', views.api_actualizar_usuario, name='api-actualizar-usuario'),
    path('api/usuario/<uuid:usuario_id>/eliminar/', views.api_eliminar_usuario, name='api-eliminar-usuario'),
    path('api/colaboradores/', views.api_listar_colaboradores, name='api-listar-colaboradores'),
    path('api/colaborador/<uuid:colaborador_id>/', views.api_obtener_colaborador, name='api-obtener-colaborador'),
    path('api/colaborador/crear/', views.api_crear_colaborador, name='api-crear-colaborador'),
    path('api/colaborador/<uuid:colaborador_id>/actualizar/', views.api_actualizar_colaborador, name='api-actualizar-colaborador'),
    path('api/colaborador/<uuid:colaborador_id>/eliminar/', views.api_eliminar_colaborador, name='api-eliminar-colaborador'),
    path('api/puestos/', views.api_listar_puestos, name='api-listar-puestos'),
    path('api/puesto/crear/', views.api_crear_puesto, name='api-crear-puesto'),
    
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
    
    # APIs de Reportes
    path('reportes/dashboard/stats/', views.api_dashboard_stats, name='api-dashboard-stats'),
    path('api/reportes/<str:report_type>/', views.api_generar_reporte, name='api-generar-reporte'),
    path('api/reportes/exportar/<str:report_type>/', views.api_exportar_reporte, name='api-exportar-reporte'),
]

