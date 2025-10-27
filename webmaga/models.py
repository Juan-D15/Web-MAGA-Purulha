from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# =====================================================
# MODELOS BASE
# =====================================================

class Puesto(models.Model):
    """Puestos de trabajo para personal de la organización"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'puestos'
        verbose_name = 'Puesto'
        verbose_name_plural = 'Puestos'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Usuario(models.Model):
    """Usuarios del sistema MAGA - Sistema simplificado con 2 roles: admin y personal"""
    
    ROL_CHOICES = [
        ('admin', 'Administrador'),
        ('personal', 'Personal'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    password_hash = models.TextField()
    rol = models.CharField(max_length=50, choices=ROL_CHOICES, default='personal')
    puesto = models.ForeignKey(Puesto, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios', db_column='puesto_id')
    activo = models.BooleanField(default=True)
    intentos_fallidos = models.IntegerField(default=0)
    bloqueado_hasta = models.DateTimeField(blank=True, null=True)
    ultimo_login = models.DateTimeField(blank=True, null=True)
    ultimo_logout = models.DateTimeField(blank=True, null=True)
    token_refresh = models.TextField(blank=True, null=True)
    token_expiracion = models.DateTimeField(blank=True, null=True)
    permite_offline = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']
    
    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"
    
    @property
    def es_admin(self):
        """Retorna True si el usuario es administrador"""
        return self.rol == 'admin'


class Region(models.Model):
    """Regiones geográficas del municipio (microrregiones)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    comunidad_sede = models.CharField(max_length=100, blank=True, null=True)
    poblacion_aprox = models.IntegerField(blank=True, null=True)
    latitud = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitud = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'regiones'
        verbose_name = 'Región'
        verbose_name_plural = 'Regiones'
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoComunidad(models.Model):
    """Tipos de comunidad: barrio, caserío, aldea, municipio"""
    
    TIPO_CHOICES = [
        ('barrio', 'Barrio'),
        ('caserío', 'Caserío'),
        ('aldea', 'Aldea'),
        ('municipio', 'Municipio'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=50, choices=TIPO_CHOICES)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tipos_comunidad'
        verbose_name = 'Tipo de Comunidad'
        verbose_name_plural = 'Tipos de Comunidad'
    
    def __str__(self):
        return self.get_nombre_display()


class Comunidad(models.Model):
    """Comunidades del municipio (aldeas, caseríos, barrios)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    tipo = models.ForeignKey(TipoComunidad, on_delete=models.RESTRICT, related_name='comunidades', db_column='tipo_id')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='comunidades', db_column='region_id')
    descripcion = models.TextField(blank=True, null=True)
    poblacion = models.IntegerField(blank=True, null=True)
    latitud = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitud = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    cocode = models.CharField(max_length=100, blank=True, null=True)
    telefono_cocode = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    ultimo_sync = models.DateTimeField(blank=True, null=True)
    modificado_offline = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'comunidades'
        verbose_name = 'Comunidad'
        verbose_name_plural = 'Comunidades'
        ordering = ['region', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.tipo.get_nombre_display()})"


class ComunidadAutoridad(models.Model):
    """Autoridades de las comunidades (COCODE, etc)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comunidad = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name='autoridades', db_column='comunidad_id')
    rol = models.CharField(max_length=50)
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'comunidad_autoridades'
        verbose_name = 'Autoridad de Comunidad'
        verbose_name_plural = 'Autoridades de Comunidades'
    
    def __str__(self):
        return f"{self.nombre} - {self.rol} ({self.comunidad.nombre})"


class TipoActividad(models.Model):
    """Tipos de actividad: Capacitación, Entrega, Proyecto de Ayuda"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tipos_actividad'
        verbose_name = 'Tipo de Actividad'
        verbose_name_plural = 'Tipos de Actividad'
    
    def __str__(self):
        return self.nombre


# =====================================================
# MODELOS DE BENEFICIARIOS (POLIMÓRFICOS)
# =====================================================

class TipoBeneficiario(models.Model):
    """Tipos: individual, familia, institución"""
    
    TIPO_CHOICES = [
        ('individual', 'Individual'),
        ('familia', 'Familia'),
        ('institución', 'Institución'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=50, choices=TIPO_CHOICES)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tipos_beneficiario'
        verbose_name = 'Tipo de Beneficiario'
        verbose_name_plural = 'Tipos de Beneficiario'
    
    def __str__(self):
        return self.get_nombre_display()


class Beneficiario(models.Model):
    """Tabla principal de beneficiarios (polimórfica)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo = models.ForeignKey(TipoBeneficiario, on_delete=models.RESTRICT, related_name='beneficiarios', db_column='tipo_id')
    comunidad = models.ForeignKey(Comunidad, on_delete=models.SET_NULL, null=True, blank=True, related_name='beneficiarios', db_column='comunidad_id')
    activo = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    ultimo_sync = models.DateTimeField(blank=True, null=True)
    modificado_offline = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'beneficiarios'
        verbose_name = 'Beneficiario'
        verbose_name_plural = 'Beneficiarios'
    
    def __str__(self):
        if hasattr(self, 'individual'):
            return f"{self.individual.nombre} {self.individual.apellido}"
        elif hasattr(self, 'familia'):
            return self.familia.nombre_familia
        elif hasattr(self, 'institucion'):
            return self.institucion.nombre_institucion
        return f"Beneficiario {self.id}"


class BeneficiarioIndividual(models.Model):
    """Beneficiarios individuales"""
    
    GENERO_CHOICES = [
        ('masculino', 'Masculino'),
        ('femenino', 'Femenino'),
        ('otro', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    beneficiario = models.OneToOneField(Beneficiario, on_delete=models.CASCADE, related_name='individual', db_column='beneficiario_id')
    nombre = models.CharField(max_length=150)
    apellido = models.CharField(max_length=150)
    dpi = models.CharField(max_length=20, unique=True, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    genero = models.CharField(max_length=20, choices=GENERO_CHOICES, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'beneficiarios_individuales'
        verbose_name = 'Beneficiario Individual'
        verbose_name_plural = 'Beneficiarios Individuales'
    
    def __str__(self):
        return f"{self.nombre} {self.apellido}"


class BeneficiarioFamilia(models.Model):
    """Beneficiarios familias"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    beneficiario = models.OneToOneField(Beneficiario, on_delete=models.CASCADE, related_name='familia', db_column='beneficiario_id')
    nombre_familia = models.CharField(max_length=150)
    jefe_familia = models.CharField(max_length=150)
    dpi_jefe_familia = models.CharField(max_length=20, unique=True, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    numero_miembros = models.IntegerField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'beneficiarios_familias'
        verbose_name = 'Beneficiario Familia'
        verbose_name_plural = 'Beneficiarios Familias'
    
    def __str__(self):
        return self.nombre_familia


class BeneficiarioInstitucion(models.Model):
    """Beneficiarios instituciones"""
    
    TIPO_INSTITUCION_CHOICES = [
        ('escuela', 'Escuela'),
        ('cooperativa', 'Cooperativa'),
        ('asociación', 'Asociación'),
        ('ONG', 'ONG'),
        ('iglesia', 'Iglesia'),
        ('otro', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    beneficiario = models.OneToOneField(Beneficiario, on_delete=models.CASCADE, related_name='institucion', db_column='beneficiario_id')
    nombre_institucion = models.CharField(max_length=200)
    tipo_institucion = models.CharField(max_length=50, choices=TIPO_INSTITUCION_CHOICES)
    representante_legal = models.CharField(max_length=150, blank=True, null=True)
    dpi_representante = models.CharField(max_length=20, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)
    numero_beneficiarios_directos = models.IntegerField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'beneficiarios_instituciones'
        verbose_name = 'Beneficiario Institución'
        verbose_name_plural = 'Beneficiarios Instituciones'
    
    def __str__(self):
        return self.nombre_institucion


# =====================================================
# MODELOS DE ACTIVIDADES/EVENTOS
# =====================================================

class Actividad(models.Model):
    """Actividades/Eventos: Capacitaciones, Entregas, Proyectos"""
    
    ESTADO_CHOICES = [
        ('planificado', 'Planificado'),
        ('en_progreso', 'En Progreso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo = models.ForeignKey(TipoActividad, on_delete=models.RESTRICT, related_name='actividades', db_column='tipo_id')
    comunidad = models.ForeignKey(Comunidad, on_delete=models.SET_NULL, null=True, blank=True, related_name='actividades', db_column='comunidad_id')
    responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='actividades_responsable', db_column='responsable_id')
    nombre = models.CharField(max_length=200)
    fecha = models.DateField()
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='planificado')
    latitud = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitud = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    version = models.IntegerField(default=1)
    ultimo_sync = models.DateTimeField(blank=True, null=True)
    modificado_offline = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    eliminado_en = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'actividades'
        verbose_name = 'Actividad'
        verbose_name_plural = 'Actividades'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.nombre} - {self.fecha}"


class ActividadPersonal(models.Model):
    """Personal asignado a actividades"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='personal', db_column='actividad_id')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='actividades_asignadas', db_column='usuario_id')
    rol_en_actividad = models.CharField(max_length=50)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'actividad_personal'
        verbose_name = 'Personal de Actividad'
        verbose_name_plural = 'Personal de Actividades'
        unique_together = [['actividad', 'usuario']]
    
    def __str__(self):
        return f"{self.usuario.username} - {self.rol_en_actividad}"


class ActividadBeneficiario(models.Model):
    """Relación entre actividades y beneficiarios"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='beneficiarios', db_column='actividad_id')
    beneficiario = models.ForeignKey(Beneficiario, on_delete=models.CASCADE, related_name='actividades', db_column='beneficiario_id')
    version = models.IntegerField(default=1)
    sincronizado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'actividad_beneficiarios'
        verbose_name = 'Beneficiario de Actividad'
        verbose_name_plural = 'Beneficiarios de Actividades'
        unique_together = [['actividad', 'beneficiario']]
    
    def __str__(self):
        return f"{self.beneficiario} - {self.actividad.nombre}"


class Evidencia(models.Model):
    """Evidencias multimedia de actividades"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='evidencias', db_column='actividad_id')
    archivo_nombre = models.CharField(max_length=255)
    archivo_tipo = models.CharField(max_length=50, blank=True, null=True)
    archivo_tamanio = models.BigIntegerField(blank=True, null=True)
    url_almacenamiento = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    es_imagen = models.BooleanField(default=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='evidencias_creadas', db_column='creado_por')
    version = models.IntegerField(default=1)
    ultimo_sync = models.DateTimeField(blank=True, null=True)
    sincronizado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'evidencias'
        verbose_name = 'Evidencia'
        verbose_name_plural = 'Evidencias'
        ordering = ['-creado_en']
    
    def __str__(self):
        return f"{self.archivo_nombre} - {self.actividad.nombre}"


class ActividadCambio(models.Model):
    """Registro de cambios/actualizaciones en actividades"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='cambios', db_column='actividad_id')
    responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='cambios_realizados', db_column='responsable_id')
    descripcion_cambio = models.TextField()
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'actividad_cambios'
        verbose_name = 'Cambio de Actividad'
        verbose_name_plural = 'Cambios de Actividades'
        ordering = ['-fecha_cambio']
    
    def __str__(self):
        return f"Cambio en {self.actividad.nombre} - {self.fecha_cambio}"


# =====================================================
# MODELOS DE ARCHIVOS Y GALERÍAS
# =====================================================

class ActividadArchivo(models.Model):
    """Archivos adjuntos de actividades"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='archivos', db_column='actividad_id')
    nombre_archivo = models.CharField(max_length=255)
    archivo_tipo = models.CharField(max_length=50, blank=True, null=True)
    archivo_tamanio = models.BigIntegerField(blank=True, null=True)
    url_almacenamiento = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='creado_por')
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'actividad_archivos'
        verbose_name = 'Archivo de Actividad'
        verbose_name_plural = 'Archivos de Actividades'
    
    def __str__(self):
        return self.nombre_archivo


class ComunidadGaleria(models.Model):
    """Galería de imágenes de comunidades"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comunidad = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name='galeria', db_column='comunidad_id')
    archivo_nombre = models.CharField(max_length=255)
    url_almacenamiento = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='creado_por')
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'comunidad_galeria'
        verbose_name = 'Galería de Comunidad'
        verbose_name_plural = 'Galerías de Comunidades'
    
    def __str__(self):
        return f"{self.archivo_nombre} - {self.comunidad.nombre}"


class RegionGaleria(models.Model):
    """Galería de imágenes de regiones"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='galeria', db_column='region_id')
    archivo_nombre = models.CharField(max_length=255)
    url_almacenamiento = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='creado_por')
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'region_galeria'
        verbose_name = 'Galería de Región'
        verbose_name_plural = 'Galerías de Regiones'
    
    def __str__(self):
        return f"{self.archivo_nombre} - {self.region.nombre}"
