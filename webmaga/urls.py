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
    path('api/cambios-recientes/', views.api_cambios_recientes, name='api-cambios-recientes'),
    path('api/personal/', views.api_listar_personal, name='api-personal'),
    path('api/beneficiarios/', views.api_listar_beneficiarios, name='api-beneficiarios'),
    path('api/verificar-admin/', views.api_verificar_admin, name='api-verificar-admin'),
    
    # APIs de Proyectos
    path('api/proyectos/<str:tipo_actividad>/', views.api_listar_proyectos_por_tipo, name='api-proyectos-por-tipo'),
    path('api/ultimos-proyectos/', views.api_ultimos_proyectos, name='api-ultimos-proyectos'),
    path('api/proyecto/<uuid:evento_id>/', views.api_obtener_detalle_proyecto, name='api-detalle-proyecto'),
    
    # APIs para Inicio
    path('api/ultimos-eventos-inicio/', views.api_ultimos_eventos_inicio, name='api-ultimos-eventos-inicio'),
]

