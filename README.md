# MAGA Purulhá - Sistema de Gestión Municipal

Sistema web desarrollado con Django para la gestión de comunidades, regiones, proyectos y eventos del Ministerio de Agricultura, Ganadería y Alimentación (MAGA) en el municipio de Purulhá, Baja Verapaz, Guatemala.

## Tabla de Contenidos

- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [URLs Disponibles](#-urls-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Características](#-características)
- [Solución de Problemas](#-solución-de-problemas)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Python 3.8 o superior** - [Descargar Python](https://www.python.org/downloads/)
- **Git** (opcional, para clonar el repositorio) - [Descargar Git](https://git-scm.com/)

Para verificar tu versión de Python:

```bash
python --version
# o en algunos sistemas:
python3 --version
```

## Instalación

### Paso 1: Clonar o Descargar el Proyecto

#### Opción A: Clonar con Git
```bash
git clone <url-del-repositorio>
cd MAGA-ProyectoWeb
```

#### Opción B: Descargar ZIP
1. Descarga el archivo ZIP del proyecto
2. Extrae el contenido
3. Abre una terminal en la carpeta del proyecto

### Paso 2: Crear Entorno Virtual

Es **altamente recomendado** usar un entorno virtual para aislar las dependencias del proyecto.

#### En Windows:
```bash
# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
.venv\Scripts\activate
```

#### En Linux/Mac:
```bash
# Crear entorno virtual
python3 -m venv .venv

# Activar entorno virtual
source .venv/bin/activate
```

**Nota:** Cuando el entorno virtual esté activado, verás `(.venv)` al inicio de tu línea de comandos.

### Paso 3: Instalar Dependencias

Con el entorno virtual activado:

```bash
# Actualizar pip (recomendado)
pip install --upgrade pip

# Instalar todas las dependencias del proyecto
pip install -r requirements.txt
```

## Configuración

### Paso 1: Crear Archivo de Variables de Entorno

Crea un archivo llamado `.env` en la **raíz del proyecto** (mismo nivel que `manage.py`):

```bash
# En Windows (PowerShell)
New-Item .env -ItemType File

# En Windows (CMD)
type nul > .env

# En Linux/Mac
touch .env
```

Abre el archivo `.env` con un editor de texto y agrega:

```env
KEY_DJANGO=django-insecure-tu-clave-secreta-para-desarrollo
```

**IMPORTANTE:**
- Esta clave es solo para desarrollo local

### Paso 2: Realizar Migraciones de Base de Datos

Las migraciones crean las tablas necesarias en la base de datos:

```bash
# Crear archivos de migración (si es necesario)
python manage.py makemigrations

# Aplicar migraciones a la base de datos
python manage.py migrate
```

Deberías ver un mensaje de éxito indicando que las migraciones se aplicaron correctamente.

### Paso 3: Crear Superusuario (Opcional pero Recomendado)

Para acceder al panel de administración de Django:

```bash
python manage.py createsuperuser
```

## Ejecución

### Iniciar el Servidor de Desarrollo

Con el entorno virtual activado:

```bash
python manage.py runserver
```
### Acceder al Proyecto

Abre tu navegador web y visita:

```
http://127.0.0.1:8000/
```

o

```
http://localhost:8000/
```

### Detener el Servidor

Para detener el servidor de desarrollo:

- **Windows:** Presiona `Ctrl + C` o `Ctrl + Break`
- **Linux/Mac:** Presiona `Ctrl + C`

### Panel de Administración
- **Admin Django:** http://127.0.0.1:8000/admin/
  - Solo accesible con las credenciales del superusuario creado anteriormente

### Sistemas Implementados

#### Sistema de Navegación
- **Página de Inicio:** Presentación del sistema y acceso rápido a funciones
- **Mapa Interactivo:** Visualización de las 17 microrregiones del municipio
- **Gestión de Comunidades:** Visualización y búsqueda de comunidades
- **Gestión de Regiones:** Información detallada de cada microrregión
- **Proyectos Activos:** Capacitaciones, entregas y proyectos de ayuda

#### Funcionalidades Técnicas
- **Sistema de Templates Django:** Reutilización de componentes
- **Archivos Estáticos:** CSS, JavaScript, imágenes y SVG organizados
- **Diseño Responsivo:** Compatible con móviles, tablets y escritorio
- **Navegación Adaptativa:** Menú hamburguesa en dispositivos móviles
- **Dropdowns Interactivos:** Menús desplegables con búsqueda

#### Mapas y Visualización
- **Mapa SVG Principal:** Municipio dividido en 17 microrregiones
- **Mapas Individuales:** SVG de cada región con comunidades
- **Interactividad:** Click en regiones para ver detalles
- **Tabla de Microrregiones:** Lista completa con sedes


### Archivos Estáticos
- Servidos desde `src/static/` en desarrollo
- En producción, usar `python manage.py collectstatic`
- WhiteNoise se encarga de servirlos eficientemente

### Templates
- Ubicados en `src/templates/`
- Usan el sistema de templates de Django
- Incluyen `{% load static %}` para archivos estáticos
- URLs dinámicas con `{% url 'nombre_vista' %}`

##  Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'django'"

**Problema:** Django no está instalado o el entorno virtual no está activado.

**Solución:**
```bash
# Activa el entorno virtual primero
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Luego instala las dependencias
pip install -r requirements.txt
```

---

### Error: "SECRET_KEY not found" o "Environment variable KEY_DJANGO not found"

**Problema:** No existe el archivo `.env` o no contiene la variable necesaria.

**Solución:**
```bash
# Crear archivo .env en la raíz del proyecto
echo KEY_DJANGO=django-insecure-tu-clave-secreta-para-desarrollo > .env
```

O crea manualmente el archivo `.env` con:
```env
KEY_DJANGO=django-insecure-tu-clave-secreta-para-desarrollo-12345
```

---

### Error: "TemplateDoesNotExist at /"

**Problema:** Django no encuentra los templates HTML.

**Solución:**
1. Verifica que exista la carpeta `src/templates/`
2. Verifica que `index.html` exista en esa carpeta
3. Revisa `config/settings.py` - debe contener:
```python
TEMPLATES = [
    {
        'DIRS': [BASE_DIR / 'src' / 'templates'],
        ...
    }
]
```

---

### Los archivos estáticos (CSS, imágenes) no cargan

**Problema:** Django no encuentra los archivos estáticos.

**Solución:**
1. Verifica que `{% load static %}` esté al inicio de cada template HTML
2. Usa `{% static 'ruta/archivo' %}` en lugar de rutas absolutas
3. Verifica en `config/settings.py`:
```python
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "src" / "static"]
```
4. Recarga el servidor: `Ctrl+C` y luego `python manage.py runserver`

---

### Error: "Port 8000 is already in use"

**Problema:** Ya hay un servidor ejecutándose en el puerto 8000.

**Solución:**

**Opción 1:** Detén el servidor anterior (busca la ventana de terminal y presiona `Ctrl+C`)

**Opción 2:** Usa un puerto diferente:
```bash
python manage.py runserver 8001
```

**Opción 3 (Windows):** Mata el proceso:
```bash
# Encuentra el proceso
netstat -ano | findstr :8000

# Mata el proceso (reemplaza PID con el número que apareció)
taskkill /PID <número_pid> /F
```

---

### Error: "no such table: django_session"

**Problema:** Las migraciones no se han aplicado.

**Solución:**
```bash
python manage.py migrate
```

---

### Error: "python: command not found" (Linux/Mac)

**Problema:** Python no está en el PATH o se llama `python3`.

**Solución:**
Intenta usar `python3` en lugar de `python`:
```bash
python3 --version
python3 -m venv .venv
python3 manage.py runserver
```

---

### El navegador muestra "Unable to connect" o "No se puede conectar"

**Problema:** El servidor no está ejecutándose.

**Solución:**
1. Verifica que el servidor esté corriendo (deberías ver mensajes en la terminal)
2. Verifica la URL: debe ser `http://127.0.0.1:8000/` o `http://localhost:8000/`
3. Revisa si hay errores en la terminal donde ejecutaste `runserver`

---

### Los cambios en CSS/JS no se reflejan

**Problema:** El navegador está usando cache.

**Solución:**
1. **Recarga forzada:**
   - Chrome/Edge: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
   - Firefox: `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac)
2. **Abre el inspector:** F12 → Pestaña Network → Marca "Disable cache"
3. **Limpia el cache del navegador**

---

### Error al instalar dependencias (WeasyPrint, Pillow, etc.)

**Problema:** Faltan dependencias del sistema (especialmente en Linux).

**Solución en Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3-dev python3-pip python3-setuptools python3-wheel python3-cffi libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info

# Luego reinstala las dependencias
pip install -r requirements.txt
```

**Solución en Windows:**
- Asegúrate de tener Visual C++ Build Tools instalados
- Descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/

---

### El proyecto funciona pero no se ve bien (sin estilos)

**Problema:** El archivo CSS no está vinculado correctamente.

**Solución:**
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Console" - busca errores 404
3. Verifica que el HTML tenga:
```html
{% load static %}
<link rel="stylesheet" href="{% static 'css/styles.css' %}">
```

---