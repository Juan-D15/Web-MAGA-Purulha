#!/bin/bash
set -e

# Verificar si el venv existe (si no, estamos en build time y debemos salir)
if [ ! -f /opt/venv/bin/activate ]; then
    echo "Venv no existe aún, esto debe ejecutarse en runtime, no durante el build"
    exit 0
fi

# Activar el entorno virtual
source /opt/venv/bin/activate

# Ejecutar migraciones
python manage.py migrate

# Iniciar Gunicorn
exec gunicorn config.wsgi

