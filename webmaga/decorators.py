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
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def permiso_gestionar_eventos(view_func):
    """
    Decorador que permite solo a administradores gestionar eventos.
    El personal puede visualizar pero no gestionar.
    """
    @wraps(view_func)
    @login_required(login_url='webmaga:login')
    def wrapper(request, *args, **kwargs):
        usuario_maga = get_usuario_maga(request.user)
        
        if not usuario_maga:
            messages.error(request, 'No tienes permisos para acceder a esta página.')
            return redirect('webmaga:index')
        
        # Solo admin puede gestionar eventos
        if usuario_maga.rol != 'admin':
            messages.error(request, 'Solo los administradores pueden gestionar eventos.')
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
