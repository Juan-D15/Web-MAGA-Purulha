"""
Decoradores personalizados para control de acceso basado en roles
Sistema simplificado con 2 roles: admin y personal
"""
from django.shortcuts import redirect
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from functools import wraps
from .models import Usuario


def get_usuario_maga(user):
    """
    Obtiene el usuario MAGA asociado al usuario de Django
    """
    if not user.is_authenticated:
        return None
    
    try:
        return Usuario.objects.filter(
            username=user.username,
            activo=True
        ).first()
    except Usuario.DoesNotExist:
        return None


def solo_administrador(view_func):
    """
    Decorador que restringe el acceso solo a usuarios con rol 'admin'
    """
    @wraps(view_func)
    @login_required(login_url='webmaga:login')
    def wrapper(request, *args, **kwargs):
        usuario_maga = get_usuario_maga(request.user)
        
        if not usuario_maga:
            messages.error(request, 'No tienes permisos para acceder a esta página.')
            return redirect('webmaga:index')
        
        if usuario_maga.rol != 'admin':
            messages.error(request, 'Solo los administradores pueden acceder a esta página.')
            return redirect('webmaga:index')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def permiso_gestionar_eventos_api(view_func):
    """
    Decorador para APIs que permite a admin y personal gestionar eventos.
    - Admin: puede gestionar todos los eventos
    - Personal: puede gestionar solo los eventos donde está asignado
    Devuelve JSON en lugar de redirigir cuando no hay permisos.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Verificar autenticación primero
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'error': 'Usuario no autenticado'
            }, status=401)
        
        usuario_maga = get_usuario_maga(request.user)
        
        if not usuario_maga:
            return JsonResponse({
                'success': False,
                'error': 'Usuario no encontrado'
            }, status=401)
        
        # Admin y personal pueden gestionar eventos
        if usuario_maga.rol not in ['admin', 'personal']:
            return JsonResponse({
                'success': False,
                'error': 'No tienes permisos para realizar esta acción. Solo administradores y personal pueden gestionar eventos.'
            }, status=403)
        
        # Si es personal y hay un evento_id, verificar que esté asignado
        evento_id = kwargs.get('evento_id')
        if evento_id and usuario_maga.rol == 'personal':
            if not usuario_puede_gestionar_evento(usuario_maga, evento_id):
                return JsonResponse({
                    'success': False,
                    'error': 'No tienes permisos para gestionar este evento. Solo puedes gestionar eventos donde estás asignado.'
                }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def permiso_admin_o_personal_api(view_func):
    """
    Decorador genérico para APIs que requieren rol administrador o personal.
    Devuelve respuestas JSON con códigos adecuados cuando no existen permisos.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'error': 'Usuario no autenticado'
            }, status=401)

        usuario_maga = get_usuario_maga(request.user)

        if not usuario_maga:
            return JsonResponse({
                'success': False,
                'error': 'Usuario no encontrado'
            }, status=401)

        if usuario_maga.rol not in ['admin', 'personal']:
            return JsonResponse({
                'success': False,
                'error': 'No tienes permisos para realizar esta acción'
            }, status=403)

        return view_func(request, *args, **kwargs)

    return wrapper


def usuario_puede_gestionar_evento(usuario_maga, evento_id=None):
    """
    Verifica si un usuario puede gestionar un evento específico.
    - Admin: puede gestionar todos los eventos
    - Personal: puede gestionar solo los eventos donde está asignado
    
    Args:
        usuario_maga: Instancia de Usuario
        evento_id: ID del evento (opcional). Si no se proporciona, solo verifica el rol.
    
    Returns:
        bool: True si el usuario puede gestionar el evento
    """
    if not usuario_maga:
        return False
    
    # Admin puede gestionar todos los eventos
    if usuario_maga.rol == 'admin':
        return True
    
    # Personal solo puede gestionar eventos donde está asignado
    if usuario_maga.rol == 'personal':
        # Si no hay evento_id específico, permitir el acceso inicial
        # La validación específica se hará en cada endpoint
        if not evento_id:
            return True
        
        # Verificar si el usuario está asignado al evento
        from .models import ActividadPersonal, Colaborador
        
        try:
            # Verificar por usuario directamente
            esta_asignado_usuario = ActividadPersonal.objects.filter(
                actividad_id=evento_id,
                usuario=usuario_maga
            ).exists()
            
            if esta_asignado_usuario:
                return True
            
            # Verificar por colaborador vinculado
            if hasattr(usuario_maga, 'colaborador') and usuario_maga.colaborador:
                esta_asignado_colaborador = ActividadPersonal.objects.filter(
                    actividad_id=evento_id,
                    colaborador=usuario_maga.colaborador
                ).exists()
                
                if esta_asignado_colaborador:
                    return True
            
            return False
        except Exception:
            return False
    
    return False


def permiso_gestionar_eventos(view_func):
    """
    Decorador que permite a administradores y personal gestionar eventos.
    - Admin: puede gestionar todos los eventos
    - Personal: puede gestionar solo los eventos donde está asignado
    """
    @wraps(view_func)
    @login_required(login_url='webmaga:login')
    def wrapper(request, *args, **kwargs):
        usuario_maga = get_usuario_maga(request.user)
        
        if not usuario_maga:
            messages.error(request, 'No tienes permisos para acceder a esta página.')
            return redirect('webmaga:index')
        
        # Admin y personal pueden gestionar eventos
        if usuario_maga.rol not in ['admin', 'personal']:
            messages.error(request, 'No tienes permisos para gestionar eventos.')
            return redirect('webmaga:index')
        
        # Si es personal y hay un evento_id en los kwargs, verificar asignación
        evento_id = kwargs.get('evento_id')
        if evento_id and usuario_maga.rol == 'personal':
            if not usuario_puede_gestionar_evento(usuario_maga, evento_id):
                # Para APIs, retornar JSON en lugar de redirección
                if request.path.startswith('/api/'):
                    return JsonResponse({
                        'success': False,
                        'error': 'No tienes permisos para gestionar este evento. Solo puedes gestionar eventos donde estás asignado.'
                    }, status=403)
                else:
                    messages.error(request, 'No tienes permisos para gestionar este evento.')
                    return redirect('webmaga:index')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def permiso_generar_reportes(view_func):
    """
    Decorador que permite a todos los usuarios autenticados generar reportes.
    """
    @wraps(view_func)
    @login_required(login_url='webmaga:login')
    def wrapper(request, *args, **kwargs):
        usuario_maga = get_usuario_maga(request.user)
        
        if not usuario_maga:
            messages.error(request, 'Debes estar autenticado para generar reportes.')
            return redirect('webmaga:login')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def usuario_autenticado(view_func):
    """
    Decorador que solo requiere que el usuario esté autenticado (admin o personal)
    """
    @wraps(view_func)
    @login_required(login_url='webmaga:login')
    def wrapper(request, *args, **kwargs):
        usuario_maga = get_usuario_maga(request.user)
        
        if not usuario_maga:
            messages.error(request, 'Debes estar autenticado para acceder.')
            return redirect('webmaga:login')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper
