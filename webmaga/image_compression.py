"""
Módulo de compresión de imágenes para optimizar el almacenamiento y rendimiento.

Este módulo proporciona funciones para comprimir imágenes automáticamente
manteniendo una alta calidad visual, reduciendo el tamaño de archivo entre 60-80%.
"""

from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import os
import logging

logger = logging.getLogger(__name__)


def compress_image(uploaded_file, max_width=1920, max_height=1080, quality=90, format_output='JPEG'):
    """
    Comprime una imagen manteniendo alta calidad visual.
    
    Args:
        uploaded_file: Archivo subido (InMemoryUploadedFile o TemporaryUploadedFile)
        max_width: Ancho máximo en píxeles (default: 1920px Full HD)
        max_height: Alto máximo en píxeles (default: 1080px)
        quality: Calidad de compresión 1-100 (default: 90 - alta calidad)
        format_output: Formato de salida ('JPEG', 'PNG', 'WEBP')
    
    Returns:
        InMemoryUploadedFile: Archivo comprimido listo para guardar
        
    Raises:
        Exception: Si hay error en la compresión, devuelve el archivo original
    """
    try:
        original_size = uploaded_file.size
        original_name = uploaded_file.name
        
        logger.info(f"📸 Comprimiendo imagen: {original_name} ({original_size / 1024:.2f}KB)")
        
        # Abrir imagen con Pillow
        img = Image.open(uploaded_file)
        
        # Guardar orientación EXIF si existe
        try:
            from PIL import ImageOps
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass
        
        # Convertir RGBA/LA/P a RGB si es necesario (para JPEG)
        if img.mode in ('RGBA', 'LA', 'P') and format_output == 'JPEG':
            # Crear fondo blanco
            background = Image.new('RGB', img.size, (255, 255, 255))
            
            # Convertir P (palette) a RGBA primero
            if img.mode == 'P':
                img = img.convert('RGBA')
            
            # Pegar imagen sobre fondo blanco
            if img.mode in ('RGBA', 'LA'):
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            
            img = background
        
        # Redimensionar solo si excede las dimensiones máximas
        original_width, original_height = img.size
        if img.width > max_width or img.height > max_height:
            # Usar LANCZOS para mejor calidad en redimensionamiento
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            logger.info(f"📐 Redimensionado de {original_width}x{original_height} a {img.width}x{img.height}")
        
        # Guardar en memoria con compresión optimizada
        output = BytesIO()
        
        # Optimizar según formato
        if format_output == 'JPEG':
            # JPEG con alta calidad y optimización
            img.save(
                output,
                format='JPEG',
                quality=quality,
                optimize=True,
                progressive=True  # JPEG progresivo para mejor carga web
            )
            content_type = 'image/jpeg'
            extension = '.jpg'
            
        elif format_output == 'WEBP':
            # WebP con alta calidad
            img.save(
                output,
                format='WEBP',
                quality=quality,
                method=6  # Mejor compresión (0-6, 6 es el más lento pero mejor)
            )
            content_type = 'image/webp'
            extension = '.webp'
            
        elif format_output == 'PNG':
            # PNG con optimización
            img.save(
                output,
                format='PNG',
                optimize=True,
                compress_level=6  # 0-9, 6 es buen balance
            )
            content_type = 'image/png'
            extension = '.png'
        else:
            raise ValueError(f"Formato no soportado: {format_output}")
        
        output.seek(0)
        compressed_size = output.getbuffer().nbytes
        
        # Calcular reducción
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        logger.info(f"✅ Compresión exitosa: {original_size / 1024:.2f}KB → {compressed_size / 1024:.2f}KB ({reduction:.1f}% reducción)")
        
        # Crear nombre de archivo (mantener nombre original si es posible)
        base_name = os.path.splitext(original_name)[0]
        new_name = f"{base_name}{extension}"
        
        # Crear nuevo archivo en memoria
        compressed_file = InMemoryUploadedFile(
            output,
            'ImageField',
            new_name,
            content_type,
            compressed_size,
            None
        )
        
        return compressed_file
        
    except Exception as e:
        # Si falla la compresión, devolver el archivo original
        logger.warning(f"⚠️ Error al comprimir imagen {uploaded_file.name}: {str(e)}")
        logger.warning(f"⚠️ Usando archivo original sin comprimir")
        uploaded_file.seek(0)  # Resetear puntero del archivo
        return uploaded_file


def should_compress_image(uploaded_file, min_size_kb=300):
    """
    Determina si una imagen debe ser comprimida.
    
    Args:
        uploaded_file: Archivo subido
        min_size_kb: Tamaño mínimo en KB para comprimir (default: 300KB)
    
    Returns:
        bool: True si debe comprimirse
    """
    # Solo comprimir si es mayor al tamaño mínimo
    should_compress = uploaded_file.size > (min_size_kb * 1024)
    
    if should_compress:
        logger.info(f"🔍 Imagen {uploaded_file.name} ({uploaded_file.size / 1024:.2f}KB) será comprimida")
    else:
        logger.info(f"⏭️ Imagen {uploaded_file.name} ({uploaded_file.size / 1024:.2f}KB) es pequeña, no se comprimirá")
    
    return should_compress


def compress_if_needed(uploaded_file, **kwargs):
    """
    Comprime una imagen solo si es necesario (tamaño > 300KB).
    
    Args:
        uploaded_file: Archivo subido
        **kwargs: Argumentos para compress_image() (max_width, max_height, quality, format_output)
    
    Returns:
        InMemoryUploadedFile: Archivo (comprimido o original)
    """
    if should_compress_image(uploaded_file, min_size_kb=kwargs.pop('min_size_kb', 300)):
        return compress_image(uploaded_file, **kwargs)
    return uploaded_file


def get_compression_settings(image_type='default'):
    """
    Obtiene configuración de compresión según el tipo de imagen.
    
    Args:
        image_type: Tipo de imagen ('profile', 'gallery', 'evidence', 'thumbnail', 'default')
    
    Returns:
        dict: Configuración de compresión
    """
    settings = {
        'profile': {
            'max_width': 1200,
            'max_height': 1200,
            'quality': 80,
            'format_output': 'JPEG',
            'min_size_kb': 300
        },
        'gallery': {
            'max_width': 1920,
            'max_height': 1080,
            'quality': 85,
            'format_output': 'JPEG',
            'min_size_kb': 400
        },
        'evidence': {
            'max_width': 1920,
            'max_height': 1080,
            'quality': 80,  
            'format_output': 'JPEG',
            'min_size_kb': 500
        },
        'thumbnail': {
            'max_width': 400,
            'max_height': 400,
            'quality': 85,
            'format_output': 'JPEG',
            'min_size_kb': 100
        },
        'default': {
            'max_width': 1920,
            'max_height': 1080,
            'quality': 80,
            'format_output': 'JPEG',
            'min_size_kb': 300
        }
    }
    
    return settings.get(image_type, settings['default'])


def is_image_file(uploaded_file):
    """
    Verifica si un archivo es una imagen.
    
    Args:
        uploaded_file: Archivo subido
    
    Returns:
        bool: True si es una imagen
    """
    if not uploaded_file:
        return False
    
    # Verificar por content_type
    if hasattr(uploaded_file, 'content_type') and uploaded_file.content_type:
        return uploaded_file.content_type.startswith('image/')
    
    # Verificar por extensión
    if hasattr(uploaded_file, 'name') and uploaded_file.name:
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff']
        file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        return file_extension in image_extensions
    
    return False

