# Credenciales de Prueba para el Sistema de Login

## Usuarios de Prueba

### 1. Administrador (Gestión de Eventos)
- **Usuario/Email:** `admin`
- **Contraseña:** `admin123`
- **Nombre:** Administrador
- **Email:** admin@maga.gt
- **Acceso:** Solo para gestioneventos.html
- **Nota:** Credenciales específicas para acceso a la gestión de eventos

### 2. Usuario Regular
- **Usuario/Email:** `usuario`
- **Contraseña:** `usuario123`
- **Nombre:** Usuario
- **Email:** usuario@maga.gt

### 3. Usuario con Email
- **Usuario/Email:** `test@maga.gt`
- **Contraseña:** `test123`
- **Nombre:** Usuario Test
- **Email:** test@maga.gt

## Funcionalidades Implementadas

### ✅ Login Principal
- Formulario de login con usuario/email y contraseña
- Botón de "Recordar usuario" (guarda en localStorage)
- Botón de "¿Olvidaste tu contraseña?"
- Botón "Volver" que redirige al index

### ✅ Recuperación de Contraseña
- Formulario para ingresar email de recuperación
- Campo para código de recuperación (6 dígitos)
- Validación de email
- Simulación de envío de código

### ✅ Cambio de Contraseña
- Formulario para nueva contraseña
- Validación de fortaleza de contraseña:
  - Mínimo 8 caracteres
  - Al menos una letra mayúscula
  - Al menos una letra minúscula
  - Al menos un número
- Confirmación de contraseña
- Indicadores visuales de validación

### ✅ Funcionalidades Adicionales
- Toggle de visibilidad de contraseña (icono de ojo)
- Validación en tiempo real
- Mensajes de error y éxito
- Diseño responsive
- Integración con el sistema de gestión de eventos

## Cómo Probar

1. **Acceder al Login:**
   - Ir a `/login/` o hacer clic en "Gestiones" → "Agregar Evento" (mostrará el modal)

2. **Probar Login:**
   - Usar cualquiera de las credenciales de prueba
   - Marcar "Recordar usuario" para probar la funcionalidad
   - Al hacer login exitoso, redirige a `/gestioneseventos/`

3. **Probar Recuperación:**
   - Hacer clic en "¿Olvidaste tu contraseña?"
   - Ingresar un email (se puede usar `test@maga.gt`)
   - Hacer clic en "Enviar Código"
   - Revisar la consola del navegador para ver el código generado
   - Ingresar el código de 6 dígitos

4. **Probar Cambio de Contraseña:**
   - Después de ingresar el código correcto
   - Crear una nueva contraseña que cumpla los requisitos
   - Confirmar la contraseña
   - Hacer clic en "Cambiar Contraseña"

## Notas Técnicas

- El sistema usa `localStorage` para "Recordar usuario"
- El sistema usa `sessionStorage` para sesiones temporales
- Los códigos de recuperación son simulados (se muestran en consola)
- El cambio de contraseña es simulado (no se persiste)
- El diseño es responsive y sigue la paleta de colores del proyecto
- Integrado con Django usando `{% static %}` y `{% url %}` tags