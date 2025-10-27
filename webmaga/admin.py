from django.contrib import admin
from .models import (
    Puesto, Usuario, Region, TipoComunidad, Comunidad, ComunidadAutoridad,
    TipoActividad, TipoBeneficiario, Beneficiario, BeneficiarioIndividual,
    BeneficiarioFamilia, BeneficiarioInstitucion, Actividad, ActividadPersonal,
    ActividadBeneficiario, Evidencia, ActividadCambio, ActividadArchivo,
    ComunidadGaleria, RegionGaleria
)

# =====================================================
# CONFIGURACIÓN DE ADMIN - USUARIOS Y GEOGRAFÍA
# =====================================================

@admin.register(Puesto)
class PuestoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'activo', 'creado_en']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
        ('Fechas', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'rol', 'puesto', 'activo', 'creado_en']
    list_filter = ['rol', 'activo']
    search_fields = ['username', 'email', 'telefono']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']
    fieldsets = (
        ('Información Básica', {
            'fields': ('username', 'email', 'telefono', 'password_hash')
        }),
        ('Roles y Permisos', {
            'fields': ('rol', 'puesto', 'activo', 'permite_offline')
        }),
        ('Seguridad', {
            'fields': ('intentos_fallidos', 'bloqueado_hasta')
        }),
        ('Fechas', {
            'fields': ('ultimo_login', 'ultimo_logout', 'creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'comunidad_sede', 'poblacion_aprox']
    search_fields = ['codigo', 'nombre', 'comunidad_sede']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'comunidad_sede')
        }),
        ('Datos Demográficos', {
            'fields': ('poblacion_aprox',)
        }),
        ('Ubicación Geográfica', {
            'fields': ('latitud', 'longitud')
        }),
        ('Fechas', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TipoComunidad)
class TipoComunidadAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'creado_en']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['id', 'creado_en']


class ComunidadAutoridadInline(admin.TabularInline):
    model = ComunidadAutoridad
    extra = 1
    fields = ['rol', 'nombre', 'telefono', 'activo']


@admin.register(Comunidad)
class ComunidadAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'region', 'poblacion', 'activo']
    list_filter = ['tipo', 'region', 'activo']
    search_fields = ['codigo', 'nombre', 'cocode']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']
    inlines = [ComunidadAutoridadInline]
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'tipo', 'region', 'descripcion')
        }),
        ('Datos Demográficos', {
            'fields': ('poblacion',)
        }),
        ('COCODE', {
            'fields': ('cocode', 'telefono_cocode')
        }),
        ('Ubicación Geográfica', {
            'fields': ('latitud', 'longitud')
        }),
        ('Estado y Sincronización', {
            'fields': ('activo', 'version', 'ultimo_sync', 'modificado_offline'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ComunidadAutoridad)
class ComunidadAutoridadAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'rol', 'comunidad', 'telefono', 'activo']
    list_filter = ['activo', 'comunidad']
    search_fields = ['nombre', 'rol', 'comunidad__nombre']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']


# =====================================================
# CONFIGURACIÓN DE ADMIN - ACTIVIDADES
# =====================================================

@admin.register(TipoActividad)
class TipoActividadAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo', 'creado_en']
    list_filter = ['activo']
    search_fields = ['nombre']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']


class ActividadPersonalInline(admin.TabularInline):
    model = ActividadPersonal
    extra = 1
    fields = ['usuario', 'rol_en_actividad']


class ActividadBeneficiarioInline(admin.TabularInline):
    model = ActividadBeneficiario
    extra = 1
    fields = ['beneficiario']


class EvidenciaInline(admin.TabularInline):
    model = Evidencia
    extra = 1
    fields = ['archivo_nombre', 'es_imagen', 'url_almacenamiento', 'descripcion']


@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'fecha', 'comunidad', 'estado', 'responsable']
    list_filter = ['tipo', 'estado', 'fecha', 'comunidad__region']
    search_fields = ['nombre', 'descripcion', 'comunidad__nombre']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']
    date_hierarchy = 'fecha'
    inlines = [ActividadPersonalInline, ActividadBeneficiarioInline, EvidenciaInline]
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'tipo', 'fecha', 'descripcion', 'estado')
        }),
        ('Ubicación', {
            'fields': ('comunidad', 'latitud', 'longitud')
        }),
        ('Responsable', {
            'fields': ('responsable',)
        }),
        ('Sincronización', {
            'fields': ('version', 'ultimo_sync', 'modificado_offline'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('creado_en', 'actualizado_en', 'eliminado_en'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ActividadCambio)
class ActividadCambioAdmin(admin.ModelAdmin):
    list_display = ['actividad', 'responsable', 'fecha_cambio']
    list_filter = ['fecha_cambio']
    search_fields = ['actividad__nombre', 'descripcion_cambio']
    readonly_fields = ['id', 'fecha_cambio', 'creado_en']
    date_hierarchy = 'fecha_cambio'


@admin.register(Evidencia)
class EvidenciaAdmin(admin.ModelAdmin):
    list_display = ['archivo_nombre', 'actividad', 'es_imagen', 'creado_por', 'creado_en']
    list_filter = ['es_imagen', 'creado_en']
    search_fields = ['archivo_nombre', 'actividad__nombre', 'descripcion']
    readonly_fields = ['id', 'creado_en']


# =====================================================
# CONFIGURACIÓN DE ADMIN - BENEFICIARIOS
# =====================================================

@admin.register(TipoBeneficiario)
class TipoBeneficiarioAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'creado_en']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['id', 'creado_en']


@admin.register(Beneficiario)
class BeneficiarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'tipo', 'comunidad', 'activo', 'creado_en']
    list_filter = ['tipo', 'activo', 'comunidad__region']
    search_fields = ['comunidad__nombre']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']


@admin.register(BeneficiarioIndividual)
class BeneficiarioIndividualAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'apellido', 'dpi', 'genero', 'telefono']
    list_filter = ['genero']
    search_fields = ['nombre', 'apellido', 'dpi', 'telefono']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']
    fieldsets = (
        ('Información Personal', {
            'fields': ('nombre', 'apellido', 'dpi', 'fecha_nacimiento', 'genero')
        }),
        ('Contacto', {
            'fields': ('telefono',)
        }),
        ('Relación', {
            'fields': ('beneficiario',)
        }),
        ('Fechas', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BeneficiarioFamilia)
class BeneficiarioFamiliaAdmin(admin.ModelAdmin):
    list_display = ['nombre_familia', 'jefe_familia', 'numero_miembros', 'telefono']
    search_fields = ['nombre_familia', 'jefe_familia', 'dpi_jefe_familia']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']


@admin.register(BeneficiarioInstitucion)
class BeneficiarioInstitucionAdmin(admin.ModelAdmin):
    list_display = ['nombre_institucion', 'tipo_institucion', 'representante_legal', 'telefono', 'email']
    list_filter = ['tipo_institucion']
    search_fields = ['nombre_institucion', 'representante_legal', 'email']
    readonly_fields = ['id', 'creado_en', 'actualizado_en']


# =====================================================
# CONFIGURACIÓN DE ADMIN - GALERÍAS
# =====================================================

@admin.register(ComunidadGaleria)
class ComunidadGaleriaAdmin(admin.ModelAdmin):
    list_display = ['archivo_nombre', 'comunidad', 'creado_por', 'creado_en']
    list_filter = ['comunidad']
    search_fields = ['archivo_nombre', 'comunidad__nombre']
    readonly_fields = ['id', 'creado_en']


@admin.register(RegionGaleria)
class RegionGaleriaAdmin(admin.ModelAdmin):
    list_display = ['archivo_nombre', 'region', 'creado_por', 'creado_en']
    list_filter = ['region']
    search_fields = ['archivo_nombre', 'region__nombre']
    readonly_fields = ['id', 'creado_en']


@admin.register(ActividadArchivo)
class ActividadArchivoAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'actividad', 'archivo_tipo', 'creado_por', 'creado_en']
    list_filter = ['archivo_tipo', 'creado_en']
    search_fields = ['nombre_archivo', 'actividad__nombre']
    readonly_fields = ['id', 'creado_en']
