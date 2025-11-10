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

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

<!-- Extras: descomenta si aplican
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)
-->


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
