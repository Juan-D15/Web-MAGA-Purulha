from django.utils.deprecation import MiddlewareMixin


class NoCacheMiddleware(MiddlewareMixin):
    
    def process_response(self, request, response):
        # Solo aplicar a respuestas HTML que no sean de login
        if not request.path.startswith('/static/') and not request.path.startswith('/media/'):
            content_type = response.get('Content-Type', '')
            if 'text/html' in content_type:
                # Si el usuario está autenticado, agregar headers de no-cache
                if request.user.is_authenticated:
                    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
                # Si no está autenticado pero no es la página de login, también no cachear
                elif request.path != '/login/':
                    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
        
        return response

