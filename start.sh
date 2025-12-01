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

# Ejecutar migraciones con manejo de errores mejorado
# Desactivar set -e temporalmente para manejar errores de migraciones
set +e
echo "Ejecutando migraciones..."
MIGRATE_LOG="/tmp/migrate.log"
python manage.py migrate --noinput 2>&1 | tee "$MIGRATE_LOG"
MIGRATE_EXIT_CODE=${PIPESTATUS[0]}

if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
    echo "✅ Migraciones completadas exitosamente"
else
    echo "⚠️ Error en migraciones (código: $MIGRATE_EXIT_CODE)"
    echo "Revisando si hay tablas duplicadas..."
    
    # Verificar si el error es por tabla duplicada
    if grep -q "already exists" "$MIGRATE_LOG" 2>/dev/null || grep -q "DuplicateTable" "$MIGRATE_LOG" 2>/dev/null; then
        echo "⚠️ Detectado error de tabla duplicada"
        echo "Intentando marcar migraciones como aplicadas (fake) para tablas existentes..."
        
        # Intentar marcar la migración 0010 como aplicada si la tabla ya existe
        echo "Marcando migración 0010 como aplicada (fake)..."
        python manage.py migrate webmaga 0010 --fake --noinput 2>&1 | tee -a "$MIGRATE_LOG"
        FAKE_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $FAKE_EXIT_CODE -eq 0 ]; then
            echo "✅ Migración 0010 marcada como aplicada"
        else
            echo "⚠️ No se pudo marcar migración 0010 como fake, intentando --fake-initial..."
            python manage.py migrate --fake-initial --noinput 2>&1 | tee -a "$MIGRATE_LOG"
            FAKE_INITIAL_EXIT_CODE=${PIPESTATUS[0]}
            
            if [ $FAKE_INITIAL_EXIT_CODE -eq 0 ]; then
                echo "✅ Migraciones con --fake-initial completadas"
            else
                echo "⚠️ --fake-initial también falló"
            fi
        fi
        
        # Intentar migraciones normales de nuevo
        echo "Reintentando migraciones normales..."
        python manage.py migrate --noinput 2>&1 | tee -a "$MIGRATE_LOG"
        RETRY_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $RETRY_EXIT_CODE -eq 0 ]; then
            echo "✅ Migraciones completadas después de corrección"
        else
            echo "❌ ERROR: Las migraciones fallaron después de intentar corregir"
            echo "Revisa los logs en $MIGRATE_LOG"
            echo "⚠️ Continuando con el inicio de la aplicación de todos modos..."
        fi
    else
        echo "❌ ERROR: Las migraciones fallaron por otra razón"
        echo "Revisa los logs en $MIGRATE_LOG"
        echo "⚠️ Continuando con el inicio de la aplicación de todos modos..."
    fi
fi

# Reactivar set -e para el resto del script
set -e

# Obtener puerto de variable de entorno o usar 8000 por defecto
PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}
WORKERS=${WORKERS:-4}

echo "Iniciando Gunicorn en $HOST:$PORT con $WORKERS workers..."

# Iniciar Gunicorn con configuración explícita
exec gunicorn config.wsgi:application \
    --bind $HOST:$PORT \
    --workers $WORKERS \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --log-level info

