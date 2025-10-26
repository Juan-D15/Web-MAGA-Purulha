"""
Context processors personalizados - Sistema simplificado con 2 roles: admin y personal
"""
from .models import Usuario


def usuario_maga(request):
    """
    Agrega información del usuario MAGA a todos los templates
    Sistema simplificado con solo admin y personal
    """
    context = {
        'usuario_maga': None,
        'es_admin': False,
        'es_personal': False,
        'puede_gestionar_eventos': False,
        'puede_generar_reportes': False,
    }
    
    if not request.user.is_authenticated:
        return context
    
    try:
        usuario = Usuario.objects.filter(
            username=request.user.username,
            activo=True
        ).first()
        
        if usuario:
            context['usuario_maga'] = usuario
            context['es_admin'] = usuario.rol == 'admin'
            context['es_personal'] = usuario.rol == 'personal'
            
            # Permisos
            context['puede_gestionar_eventos'] = usuario.rol == 'admin'
            context['puede_generar_reportes'] = True  # Todos los autenticados
    
    except Usuario.DoesNotExist:
        pass
    
    return context
