"""
Backend de autenticación personalizado para usar la tabla usuarios de MAGA
"""
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password, make_password
from .models import Usuario
from datetime import datetime


class UsuarioMAGABackend(BaseBackend):
    """
    Backend de autenticación que valida contra la tabla 'usuarios' de PostgreSQL
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Autentica un usuario contra la tabla usuarios de MAGA
        """
        if username is None or password is None:
            return None
        
        try:
            # Buscar usuario por username o email
            usuario_maga = Usuario.objects.filter(
                username=username
            ).first() or Usuario.objects.filter(email=username).first()
            
            if not usuario_maga:
                return None
            
            # Verificar si el usuario está activo
            if not usuario_maga.activo:
                return None
            
            # Verificar si está bloqueado
            if usuario_maga.bloqueado_hasta:
                from django.utils import timezone
                if usuario_maga.bloqueado_hasta > timezone.now():
                    return None
            
            # Verificar la contraseña
            # Tu BD tiene password_hash, necesitamos verificarlo
            if self._check_password(password, usuario_maga.password_hash):
                # Resetear intentos fallidos si el login es exitoso
                if usuario_maga.intentos_fallidos > 0:
                    usuario_maga.intentos_fallidos = 0
                    usuario_maga.bloqueado_hasta = None
                    usuario_maga.save(update_fields=['intentos_fallidos', 'bloqueado_hasta'])
                
                # Actualizar último login
                from django.utils import timezone
                usuario_maga.ultimo_login = timezone.now()
                usuario_maga.save(update_fields=['ultimo_login'])
                
                # Crear o obtener el User de Django para la sesión
                user, created = User.objects.get_or_create(
                    username=usuario_maga.username,
                    defaults={
                        'email': usuario_maga.email,
                        'is_active': usuario_maga.activo,
                        'is_staff': usuario_maga.rol == 'admin',
                        'is_superuser': usuario_maga.rol == 'admin'
                    }
                )
                
                # Actualizar campos si el usuario ya existía
                if not created:
                    user.email = usuario_maga.email
                    user.is_active = usuario_maga.activo
                    user.is_staff = usuario_maga.rol == 'admin'
                    user.is_superuser = usuario_maga.rol == 'admin'
                    user.save()
                
                # Guardar el ID del usuario MAGA en el objeto User de Django
                user.backend = f'{self.__module__}.{self.__class__.__name__}'
                
                # Agregar datos adicionales al user object
                user.usuario_maga_id = usuario_maga.id
                user.rol_maga = usuario_maga.rol
                
                return user
            else:
                # Incrementar intentos fallidos
                usuario_maga.intentos_fallidos += 1
                
                # Bloquear después de 5 intentos fallidos (30 minutos)
                if usuario_maga.intentos_fallidos >= 5:
                    from datetime import timedelta
                    from django.utils import timezone
                    usuario_maga.bloqueado_hasta = timezone.now() + timedelta(minutes=30)
                
                usuario_maga.save(update_fields=['intentos_fallidos', 'bloqueado_hasta'])
                return None
                
        except Exception as e:
            # Log del error si es necesario
            print(f"Error en autenticación: {e}")
            return None
    
    def get_user(self, user_id):
        """
        Obtiene el usuario de Django por ID
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
    
    def _check_password(self, password_plain, password_hash):
        """
        Verifica la contraseña usando pgcrypto de PostgreSQL
        """
        # Si tus contraseñas están hasheadas con Django (para compatibilidad)
        if password_hash and (password_hash.startswith('pbkdf2_sha256') or password_hash.startswith('bcrypt$')):
            return check_password(password_plain, password_hash)
        
        # Si tus contraseñas están en texto plano (SOLO PARA DESARROLLO)
        # ⚠️ NUNCA uses esto en producción
        if password_plain == password_hash:
            return True
        
        # Verificar con pgcrypto de PostgreSQL
        # Usa crypt() para validar el hash
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT %s = crypt(%s, %s) AS password_match",
                    [password_hash, password_plain, password_hash]
                )
                result = cursor.fetchone()
                return result[0] if result else False
        except Exception as e:
            print(f"Error verificando contraseña con pgcrypto: {e}")
            # Fallback: comparación directa (solo si es texto plano)
            return password_plain == password_hash


def hash_password_for_maga(password, use_pgcrypto=True):
    """
    Utility function para hashear contraseñas
    
    Args:
        password: Contraseña en texto plano
        use_pgcrypto: Si True, usa pgcrypto de PostgreSQL (recomendado)
                     Si False, usa el hasher de Django
    
    Returns:
        Hash de la contraseña
    """
    if use_pgcrypto:
        # Hashear con pgcrypto de PostgreSQL usando bcrypt
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT crypt(%s, gen_salt('bf'))", [password])
            result = cursor.fetchone()
            return result[0] if result else None
    else:
        # Hashear con Django
        return make_password(password)

