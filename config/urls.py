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
from django.http import Http404, HttpResponse
from django.views.decorators.http import require_http_methods
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

@require_http_methods(["GET"])
def serve_service_worker(request):
    """Servir Service Worker con header Service-Worker-Allowed para permitir scope /"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info('Service Worker request recibido')
    
    try:
        # Ruta al archivo del Service Worker
        sw_path = os.path.join(settings.STATICFILES_DIRS[0], 'js', 'service-worker.js')
        logger.info(f'Buscando Service Worker en: {sw_path}')
        
        # Verificar que el archivo exista
        if not os.path.exists(sw_path):
            logger.error(f'Service Worker no encontrado en: {sw_path}')
            return HttpResponse('Service Worker not found', status=404, content_type='text/plain')
        
        # Leer el contenido del archivo
        with open(sw_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        logger.info('Service Worker leído exitosamente, sirviendo con headers especiales')
        
        # Crear respuesta con el header Service-Worker-Allowed
        response = HttpResponse(content, content_type='application/javascript')
        response['Service-Worker-Allowed'] = '/'
        # Headers para evitar caché
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        # Agregar ETag único para forzar recarga
        import hashlib
        etag = hashlib.md5(content.encode()).hexdigest()
        response['ETag'] = f'"{etag}"'
        
        return response
    except Exception as e:
        import traceback
        logger.error(f'Error al servir Service Worker: {str(e)}')
        traceback.print_exc()
        return HttpResponse(f'Error serving Service Worker: {str(e)}', status=500, content_type='text/plain')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Service Worker DEBE estar antes de include('webmaga.urls') para que se ejecute primero
    path('static/js/service-worker.js', serve_service_worker, name='serve-service-worker'),
    path('', include('webmaga.urls')),
]

# Servir archivos media (tanto en desarrollo como en producción)
# Usar vista personalizada en producción para mayor confiabilidad
if settings.DEBUG:
    # En desarrollo, usar static() normal
    # IMPORTANTE: La ruta del Service Worker ya está en urlpatterns antes de esto,
    # así que se ejecutará primero y no será interceptada por static()
    urlpatterns += static(settings.MEDIA_URL, document_root=str(settings.MEDIA_ROOT))
    # Excluir service-worker.js de las rutas estáticas para que use nuestra vista personalizada
    # (Ya está manejado porque está antes en urlpatterns)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
else:
    # En producción, usar vista personalizada para servir archivos media
    media_url = settings.MEDIA_URL.lstrip('/')
    urlpatterns += [
        path(f'{media_url}<path:path>', serve_media, name='media'),
    ]
