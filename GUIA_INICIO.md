# 🚀 Guía de Inicio - Web-MAGA-Purulhá

Esta guía te ayudará a configurar y ejecutar el sistema desde cero.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Python 3.8+** (recomendado 3.10 o superior)
- **PostgreSQL 12+** (con extensión `pgcrypto` habilitada)
- **Git** (para clonar el repositorio)
- **pip** (gestor de paquetes de Python)

## 🔧 Paso 1: Configurar PostgreSQL

1. **Instala PostgreSQL** si no lo tienes:
   - Windows: Descarga desde [postgresql.org](https://www.postgresql.org/download/windows/)
   - Linux: `sudo apt-get install postgresql postgresql-contrib` (Ubuntu/Debian)
   - macOS: `brew install postgresql`

2. **Crea la base de datos**:
   ```sql
   -- Conéctate a PostgreSQL como superusuario
   psql -U postgres

   -- Crea la base de datos
   CREATE DATABASE webmaga_purulha;

   -- Crea un usuario (opcional, puedes usar postgres)
   CREATE USER webmaga_user WITH PASSWORD 'tu_password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE webmaga_purulha TO webmaga_user;

   -- Habilita la extensión pgcrypto (necesaria para hashear contraseñas)
   \c webmaga_purulha
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Salir
   \q
   ```

## 📦 Paso 2: Clonar y Configurar el Proyecto

1. **Navega a la carpeta del proyecto**:
   ```bash
   cd D:\Web-MAGA-Purulha
   ```

2. **Crea un entorno virtual** (recomendado):
   ```bash
   # Windows
   python -m venv .venv

   # Linux/macOS
   python3 -m venv .venv
   ```

3. **Activa el entorno virtual**:
   ```bash
   # Windows
   .venv\Scripts\activate

   # Linux/macOS
   source .venv/bin/activate
   ```

4. **Instala las dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

## ⚙️ Paso 3: Configurar Variables de Entorno

1. **Crea el archivo `.env`** en la raíz del proyecto:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env

   # Linux/macOS
   cp .env.example .env
   ```

2. **Edita el archivo `.env`** con tus configuraciones:

   ```env
   # Genera una SECRET_KEY nueva (puedes usar: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
   KEY_DJANGO=tu-secret-key-generada-aqui

   # Modo desarrollo
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

   # Base de datos PostgreSQL
   DB_NAME=webmaga_purulha
   DB_USER=postgres
   DB_PASSWORD=tu-password-postgres
   DB_HOST=localhost
   DB_PORT=5432

   # Configuración de correo (opcional para desarrollo)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=tu-email@gmail.com
   EMAIL_HOST_PASSWORD=tu-app-password-gmail
   DEFAULT_FROM_EMAIL=tu-email@gmail.com
   ```

   **Nota sobre Gmail**: Si usas Gmail, necesitas crear una "Contraseña de aplicación":
   - Ve a tu cuenta de Google → Seguridad → Verificación en 2 pasos
   - Genera una "Contraseña de aplicación" y úsala en `EMAIL_HOST_PASSWORD`

## 🗄️ Paso 4: Aplicar Migraciones

1. **Aplica las migraciones** para crear las tablas en la base de datos:
   ```bash
   python manage.py migrate
   ```

2. **Crea un superusuario** (administrador del sistema):
   ```bash
   python manage.py createsuperuser
   ```
   
   **Nota**: Este comando crea un usuario en la tabla `auth_user` de Django. 
   Para crear un usuario en la tabla `usuarios` de MAGA, necesitarás usar el panel de administración o crear un script personalizado.

## 🎨 Paso 5: Recopilar Archivos Estáticos (Opcional)

Si vas a usar archivos estáticos en producción:
```bash
python manage.py collectstatic --noinput
```

## 🚀 Paso 6: Iniciar el Servidor

1. **Inicia el servidor de desarrollo**:
   ```bash
   python manage.py runserver
   ```

2. **Abre tu navegador** y ve a:
   ```
   http://127.0.0.1:8000/
   ```

3. **Inicia sesión** con las credenciales del superusuario que creaste.

## 🔐 Paso 7: Crear Usuario MAGA (Opcional)

Si necesitas crear un usuario en la tabla `usuarios` de MAGA (no solo en Django), puedes:

1. **Usar el panel de administración de Django** (si tienes acceso):
   ```
   http://127.0.0.1:8000/admin/
   ```

2. **O crear un script Python**:
   ```python
   # crear_usuario_maga.py
   import os
   import django
   
   os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
   django.setup()
   
   from webmaga.models import Usuario, Puesto
   from webmaga.authentication import hash_password_for_maga
   
   # Crear usuario
   password_hash = hash_password_for_maga('tu_password_seguro')
   
   usuario = Usuario.objects.create(
       username='admin',
       email='admin@maga.gob.gt',
       password_hash=password_hash,
       rol='admin',
       activo=True,
       nombre='Administrador'
   )
   
   print(f"Usuario creado: {usuario.username}")
   ```

   Ejecuta: `python crear_usuario_maga.py`

## 🐛 Solución de Problemas Comunes

### Error: "No module named 'psycopg2'"
```bash
pip install psycopg2-binary
```

### Error: "could not connect to server"
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que la base de datos exista

### Error: "extension 'pgcrypto' does not exist"
```sql
-- Conéctate a tu base de datos
psql -U postgres -d webmaga_purulha

-- Ejecuta:
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "ModuleNotFoundError: No module named 'django'"
- Asegúrate de tener el entorno virtual activado
- Ejecuta: `pip install -r requirements.txt`

### Error de migraciones
```bash
# Si hay conflictos, puedes resetear (¡CUIDADO: borra datos!)
python manage.py migrate --run-syncdb
```

## 📝 Comandos Útiles

```bash
# Verificar que todo esté bien
python manage.py check

# Ver las migraciones pendientes
python manage.py showmigrations

# Crear una nueva migración (si modificas modelos)
python manage.py makemigrations

# Abrir shell de Django
python manage.py shell

# Ver todas las URLs disponibles
python manage.py show_urls  # (requiere django-extensions)
```

## 🎯 Próximos Pasos

1. ✅ Configura el correo electrónico para recuperación de contraseñas
2. ✅ Crea usuarios de prueba con diferentes roles
3. ✅ Importa datos iniciales (regiones, comunidades, etc.)
4. ✅ Revisa la documentación del manual de usuario en `src/archivos_sistema/`

## 📞 Soporte

Si encuentras problemas, revisa:
- Los logs del servidor en la consola
- El archivo `nuevaBasedeDAtos.txt` para ver la estructura de la BD
- Los issues del repositorio

---

¡Listo! Tu sistema debería estar funcionando. 🎉



