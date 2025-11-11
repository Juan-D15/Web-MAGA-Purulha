#!/bin/bash
set -e

# Verificar si el venv existe (si no, estamos en build time y debemos salir)
if [ ! -f /opt/venv/bin/activate ]; then
    echo "Venv no existe aún, esto debe ejecutarse en runtime, no durante el build"
    exit 0
fi

# Activar el entorno virtual
source /opt/venv/bin/activate

# Crear carpetas de media si no existen
echo "Creando carpetas de media necesarias..."
python -c "
import os
import sys

# Intentar usar Django settings, si falla usar ruta por defecto
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    from django.conf import settings
    import django
    django.setup()
    media_root = settings.MEDIA_ROOT
except Exception as e:
    # Si Django no está disponible, usar ruta por defecto relativa
    print(f'⚠️ No se pudo cargar Django settings, usando ruta por defecto: {e}')
    media_root = os.path.join(os.getcwd(), 'media')

carpetas = [
    'perfiles_img',
    'evidencias',
    'evidencias_cambios_eventos',
    'archivos_eventos',
    'eventos_portada_img',
    'galeria_img',
    'comunidades_galeria',
    'comunidades_archivos',
    'regiones_portada_img',
    'regiones_archivos',
]

os.makedirs(media_root, exist_ok=True)
for carpeta in carpetas:
    carpeta_path = os.path.join(media_root, carpeta)
    os.makedirs(carpeta_path, exist_ok=True)
    print(f'✅ Carpeta verificada/creada: {carpeta_path}')
" || {
    # Si el script Python falla, crear carpetas con ruta por defecto usando mkdir
    echo "⚠️ Fallback: Creando carpetas con ruta por defecto..."
    MEDIA_DIR="/app/media"
    mkdir -p "$MEDIA_DIR/perfiles_img"
    mkdir -p "$MEDIA_DIR/evidencias"
    mkdir -p "$MEDIA_DIR/evidencias_cambios_eventos"
    mkdir -p "$MEDIA_DIR/archivos_eventos"
    mkdir -p "$MEDIA_DIR/eventos_portada_img"
    mkdir -p "$MEDIA_DIR/galeria_img"
    mkdir -p "$MEDIA_DIR/comunidades_galeria"
    mkdir -p "$MEDIA_DIR/comunidades_archivos"
    mkdir -p "$MEDIA_DIR/regiones_portada_img"
    mkdir -p "$MEDIA_DIR/regiones_archivos"
    echo "✅ Carpetas creadas con fallback"
}

# Ejecutar migraciones
python manage.py migrate

# Iniciar Gunicorn
exec gunicorn config.wsgi

