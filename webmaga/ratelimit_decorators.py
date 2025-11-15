"""
Decoradores de Rate Limiting para APIs
Protege las APIs contra abuso y ataques DDoS
"""

from functools import wraps
from django.http import JsonResponse
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited


def api_ratelimit(rate='30/m', method='ALL', key='ip', block=True):
    """
    Decorador de rate limiting para APIs con respuesta JSON
    
    Args:
        rate: Límite de peticiones (ej: '30/m' = 30 por minuto, '5/5m' = 5 cada 5 minutos)
        method: Métodos HTTP a limitar ('GET', 'POST', 'ALL', etc.)
        key: Qué usar para identificar al usuario ('ip', 'user', 'user_or_ip')
        block: Si True, bloquea peticiones excedidas. Si False, solo marca.
    
    Ejemplos de uso:
        @api_ratelimit(rate='30/m')  # 30 peticiones por minuto
        @api_ratelimit(rate='10/m', method='POST')  # 10 POST por minuto
        @api_ratelimit(rate='5/5m', key='user_or_ip')  # 5 cada 5 minutos
    """
    def decorator(view_func):
        @wraps(view_func)
        @ratelimit(key=key, rate=rate, method=method, block=block)
        def wrapped_view(request, *args, **kwargs):
            # Si se excedió el límite, retornar error JSON
            if getattr(request, 'limited', False):
                return JsonResponse({
                    'success': False,
                    'error': 'Demasiadas peticiones. Por favor, espera un momento e intenta de nuevo.',
                    'rate_limited': True
                }, status=429)
            
            return view_func(request, *args, **kwargs)
        
        return wrapped_view
    return decorator


def api_ratelimit_read(rate='30/m'):
    """
    Rate limiting para APIs de lectura (GET)
    Por defecto: 30 peticiones por minuto
    """
    return api_ratelimit(rate=rate, method='GET', key='user_or_ip')


def api_ratelimit_write(rate='10/m'):
    """
    Rate limiting para APIs de escritura (POST, PUT, DELETE)
    Por defecto: 10 peticiones por minuto
    """
    return api_ratelimit(rate=rate, method=['POST', 'PUT', 'DELETE', 'PATCH'], key='user_or_ip')


def api_ratelimit_auth(rate='5/5m'):
    """
    Rate limiting para endpoints de autenticación
    Por defecto: 5 intentos cada 5 minutos
    Más estricto para prevenir ataques de fuerza bruta
    """
    return api_ratelimit(rate=rate, method='POST', key='ip', block=True)


def api_ratelimit_upload(rate='5/m'):
    """
    Rate limiting para carga de archivos
    Por defecto: 5 peticiones por minuto
    Más estricto porque son operaciones pesadas
    """
    return api_ratelimit(rate=rate, method='POST', key='user_or_ip')


def api_ratelimit_strict(rate='5/m'):
    """
    Rate limiting estricto para operaciones sensibles
    Por defecto: 5 peticiones por minuto
    """
    return api_ratelimit(rate=rate, method='ALL', key='user_or_ip')


def api_ratelimit_bulk(rate='30/m'):
    """
    Rate limiting para operaciones masivas (importación de Excel, guardado masivo)
    Por defecto: 30 peticiones por minuto
    Más permisivo porque procesa múltiples registros en una sola petición
    """
    return api_ratelimit(rate=rate, method='POST', key='user_or_ip')


def api_ratelimit_login_smart(rate_per_user='10/3m', rate_per_ip='20/3m'):
    """
    Rate limiting inteligente para login:
    - 20 intentos por IP cada 3 minutos (permite múltiples usuarios en la misma red)
    - 10 intentos por usuario cada 3 minutos (protege cuentas específicas contra fuerza bruta)
    
    Esto permite que múltiples usuarios se logueen desde la misma oficina/red
    sin bloquearse entre sí, mientras mantiene protección contra ataques.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            from django_ratelimit.decorators import ratelimit
            import json
            
            # Verificar límite por IP primero (más permisivo)
            @ratelimit(key='ip', rate=rate_per_ip, method='POST', block=True)
            def ip_limited(req):
                # Si se excede el límite por IP
                if getattr(req, 'limited', False):
                    return JsonResponse({
                        'success': False,
                        'error': 'Demasiados intentos de login desde esta red. Por favor, espera un momento e intenta de nuevo.',
                        'rate_limited': True
                    }, status=429)
                
                # Verificar límite por usuario
                try:
                    data = json.loads(req.body)
                    username = data.get('username', '').strip()
                    
                    if username:
                        @ratelimit(
                            key=lambda r: f'login_user:{username}',
                            rate=rate_per_user,
                            method='POST',
                            block=True
                        )
                        def user_limited(r):
                            if getattr(r, 'limited', False):
                                return JsonResponse({
                                    'success': False,
                                    'error': f'Demasiados intentos de login. Por favor, espera un momento e intenta de nuevo.',
                                    'rate_limited': True
                                }, status=429)
                            return view_func(r, *args, **kwargs)
                        
                        return user_limited(req)
                except:
                    pass
                
                return view_func(req, *args, **kwargs)
            
            return ip_limited(request)
        
        return wrapped_view
    return decorator


# Manejador global de excepciones de rate limit
def handle_ratelimit_exception(request, exception):
    """
    Manejador personalizado para excepciones de rate limit
    Retorna una respuesta JSON amigable
    """
    return JsonResponse({
        'success': False,
        'error': 'Has excedido el límite de peticiones permitidas. Por favor, espera un momento e intenta de nuevo.',
        'rate_limited': True,
        'retry_after': getattr(exception, 'retry_after', 60)  # Segundos hasta poder reintentar
    }, status=429)

