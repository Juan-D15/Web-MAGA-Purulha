from django.urls import path
from . import views

app_name = 'webmaga'

urlpatterns = [
    path('', views.index, name='index'),
    path('comunidades/', views.comunidades, name='comunidades'),
    path('regiones/', views.regiones, name='regiones'),
    path('proyectos/', views.proyectos, name='proyectos'),
    path('gestioneseventos/', views.gestioneseventos, name='gestioneseventos'),
    path('generarreportes/', views.generarreportes, name='generarreportes'),
    path('mapa-completo/', views.mapa_completo, name='mapa-completo'),
    path('login/', views.login, name='login'),
]

