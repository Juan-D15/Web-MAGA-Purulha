from django.shortcuts import render

# Create your views here.

def index(request):
    """Vista principal - Página de inicio con mapa interactivo"""
    return render(request, 'index.html')

def comunidades(request):
    """Vista de comunidades"""
    return render(request, 'comunidades.html')

def regiones(request):
    """Vista de regiones"""
    return render(request, 'regiones.html')

def proyectos(request):
    """Vista de proyectos"""
    return render(request, 'proyectos.html')

def gestioneseventos(request):
    """Vista de gestión de eventos"""
    return render(request, 'gestioneseventos.html')

def generarreportes(request):
    """Vista de generación de reportes"""
    return render(request, 'generarreportes.html')

def mapa_completo(request):
    """Vista del mapa completo"""
    return render(request, 'mapa-completo.html')