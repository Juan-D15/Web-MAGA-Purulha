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
# Verificar y corregir migraciones problemáticas ANTES de ejecutar
echo "Verificando estado de migraciones..."
python -c "
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.db.migrations.recorder import MigrationRecorder

# Verificar si la tabla beneficiario_atributos_tipos existe
with connection.cursor() as cursor:
    cursor.execute('''
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'beneficiario_atributos_tipos'
        );
    ''')
    tabla_existe = cursor.fetchone()[0]
    
    if tabla_existe:
        print('⚠️ Tabla beneficiario_atributos_tipos ya existe en la base de datos')
        
        # Verificar si la migración 0010 está registrada
        recorder = MigrationRecorder(connection)
        migraciones_aplicadas = recorder.applied_migrations()
        migracion_0010 = ('webmaga', '0010_alter_actividad_options_and_more')
        
        if migracion_0010 not in migraciones_aplicadas:
            print('⚠️ Migración 0010 no está registrada, marcándola como aplicada (fake)...')
            try:
                recorder.record_applied('webmaga', '0010_alter_actividad_options_and_more')
                print('✅ Migración 0010 marcada como aplicada exitosamente')
            except Exception as e:
                print(f'⚠️ Error al marcar migración: {e}')
        else:
            print('✅ Migración 0010 ya está registrada')
    else:
        print('✅ Tabla beneficiario_atributos_tipos no existe, migraciones normales procederán')
"

# Desactivar set -e temporalmente para manejar errores de migraciones
set +e
echo "Ejecutando migraciones..."
python manage.py migrate --noinput
MIGRATE_EXIT_CODE=$?

if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
    echo "✅ Migraciones completadas exitosamente"
else
    echo "⚠️ Error en migraciones (código: $MIGRATE_EXIT_CODE)"
    echo "⚠️ Continuando con el inicio de la aplicación de todos modos..."
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

