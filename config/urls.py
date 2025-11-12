"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import Http404
import os

def serve_media(request, path):
    """Vista personalizada para servir archivos media en producción"""
    media_root = str(settings.MEDIA_ROOT)
    file_path = os.path.join(media_root, path)
    
    # Verificar que el archivo esté dentro de MEDIA_ROOT (seguridad)
    file_path = os.path.normpath(file_path)
    if not file_path.startswith(os.path.normpath(media_root)):
        raise Http404("Archivo no encontrado")
    
    # Verificar que el archivo exista
    if not os.path.exists(file_path):
        raise Http404("Archivo no encontrado")
    
    return serve(request, path, document_root=media_root)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('webmaga.urls')),
]

# Servir archivos media (tanto en desarrollo como en producción)
# Usar vista personalizada en producción para mayor confiabilidad
if settings.DEBUG:
    # En desarrollo, usar static() normal
    urlpatterns += static(settings.MEDIA_URL, document_root=str(settings.MEDIA_ROOT))
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
else:
    # En producción, usar vista personalizada para servir archivos media
    media_url = settings.MEDIA_URL.lstrip('/')
    urlpatterns += [
        path(f'{media_url}<path:path>', serve_media, name='media'),
    ]
