# MAGA Purulhá - Sistema de Gestión Municipal

Sistema web desarrollado con Django para la gestión de comunidades, regiones, proyectos y eventos del Ministerio de Agricultura, Ganadería y Alimentación (MAGA) en Purulhá, Baja Verapaz (Guatemala).

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Lo que Incluye la Plataforma](#lo-que-incluye-la-plataforma)
- [Características Clave](#características-clave)
- [Guía Rápida de Uso](#guía-rápida-de-uso)

## Descripción General

La plataforma centraliza la información territorial y proyectos ejecutados en el municipio de Purulhá. Permite visualizar y administrar microrregiones, comunidades, proyectos, evidencias y novedades desde una interfaz ágil orientada a equipos municipales.

## Tecnologías Utilizadas

- **Backend:** Django 4, Python 3
- **Frontend:** HTML5, SCSS, Vanilla JS (ES6), SVG interactivos
- **Base de datos:** PostgreSQL con extensiones `uuid-ossp`, `pg_trgm` y soporte `TIMESTAMPTZ`
- **Infraestructura:** WhiteNoise para archivos estáticos, `dotenv` para variables de entorno
- **Integraciones:** Gmail SMTP para recuperación de contraseña, Fetch API para endpoints
- **Testing y Herramientas:** Django TestCase, Git, pip/venv

## Lo que Incluye la Plataforma

- **Panel principal:** acceso a noticias destacadas, acciones rápidas y métricas generales.
- **Mapa interactivo:** visualización SVG de las 17 microrregiones con acceso a fichas de detalle.
- **Gestión de comunidades:** registro, edición, filtrado por región y búsqueda avanzada.
- **Gestión de proyectos:** seguimiento de proyectos, cambios cronológicos, adjuntos y evidencias.
- **Módulo de archivos:** descarga, edición de descripciones y controles de permisos por rol.
- **Recuperación de contraseña:** flujo de verificación vía código de seguridad enviado por correo.
- **Sección de recordatorios:** alertas automáticas para tareas pendientes y seguimiento interno.

## Características Clave

- Interfaz responsiva optimizada para escritorio y móviles.
- Control de acceso por roles: administración, colaboradores y consulta.
- Manejo de fechas y horarios con zona horaria de Guatemala.
- Formularios dinámicos con validaciones en frontend y backend.
- Templates reutilizables, componentes modales y diseño coherente.
- Emails transaccionales con plantilla HTML personalizada.

## Guía Rápida de Uso

1. Clona el repositorio y crea un entorno virtual:
   ```bash
   git clone <url-del-repositorio>
   cd Web-MAGA-Purulha
   python -m venv .venv
   ```
2. Activa el entorno e instala dependencias:
   ```bash
   # Windows
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Aplica migraciones y ejecuta el servidor de desarrollo:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
4. Ingresa a `http://127.0.0.1:8000/` y explora el panel principal. Para administrar usuarios y contenido necesitas un superusuario (`python manage.py createsuperuser`).

---

> **Nota:** Consulta la sección de configuración avanzada en la documentación interna o en los issues del repositorio cuando necesites desplegar en producción o integrar nuevos servicios.