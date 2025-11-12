"""
Script de prueba para verificar la configuración de correo
Ejecuta: python test_email_config.py
"""
import os
import sys
import django
from pathlib import Path

# Configurar Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail

def test_email_config():
    """Prueba la configuración de correo"""
    print("=" * 60)
    print("PRUEBA DE CONFIGURACIÓN DE CORREO")
    print("=" * 60)
    print()
    
    # Verificar variables de entorno
    print("📋 Verificando configuración:")
    print(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"  EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"  EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '❌ NO CONFIGURADO'}")
    print(f"  EMAIL_HOST_PASSWORD: {'✅ Configurado' if settings.EMAIL_HOST_PASSWORD else '❌ NO CONFIGURADO'}")
    print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print()
    
    # Verificar que las credenciales estén configuradas
    if not settings.EMAIL_HOST_USER:
        print("❌ ERROR: EMAIL_HOST_USER no está configurado en el .env")
        print("   Agrega: EMAIL_HOST_USER=recupmagabvpurulha@gmail.com")
        return False
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("❌ ERROR: EMAIL_HOST_PASSWORD no está configurado en el .env")
        print("   Agrega: EMAIL_HOST_PASSWORD=Juan123Chun")
        return False
    
    print("✅ Todas las variables están configuradas")
    print()
    
    # Intentar enviar correo de prueba
    print("📧 Enviando correo de prueba...")
    try:
        result = send_mail(
            subject='[Prueba] Configuración de Correo - MAGA Purulhá',
            message='Este es un correo de prueba para verificar la configuración del sistema.',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=['recupmagabvpurulha@gmail.com'],
            fail_silently=False,
            html_message='<p>Este es un <strong>correo de prueba</strong> para verificar la configuración del sistema.</p>'
        )
        
        if result:
            print("✅ ¡Correo enviado exitosamente!")
            print(f"   Revisa la bandeja de entrada de: recupmagabvpurulha@gmail.com")
            return True
        else:
            print("❌ El correo no se pudo enviar (resultado: False)")
            return False
            
    except Exception as e:
        print(f"❌ ERROR al enviar correo:")
        print(f"   Tipo: {type(e).__name__}")
        print(f"   Mensaje: {str(e)}")
        print()
        print("💡 Posibles soluciones:")
        print("   1. Verifica que la contraseña sea correcta")
        print("   2. Si tienes 2FA activado, usa una 'Contraseña de aplicación'")
        print("   3. Verifica que 'Permitir aplicaciones menos seguras' esté activado")
        print("   4. Revisa que el firewall no bloquee el puerto 587")
        return False

if __name__ == '__main__':
    success = test_email_config()
    print()
    print("=" * 60)
    if success:
        print("✅ PRUEBA EXITOSA")
    else:
        print("❌ PRUEBA FALLIDA - Revisa la configuración")
    print("=" * 60)
    sys.exit(0 if success else 1)

