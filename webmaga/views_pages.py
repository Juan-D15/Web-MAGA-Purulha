from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils import timezone

from django.db.models import Count, Prefetch, Q

from .decorators import (
    get_usuario_maga,
    permiso_generar_reportes,
    permiso_gestionar_eventos,
    solo_administrador,
)
from .forms import LoginForm
from .models import (
    Actividad,
    Comunidad,
    ComunidadGaleria,
    Region,
    RegionGaleria,
    TipoActividad,
    TipoComunidad,
    Usuario,
    Beneficiario,
    Puesto,
)


def index(request):
    """Vista principal - Página de inicio con mapa interactivo"""
    context = {
        'total_regiones': Region.objects.count(),
        'total_comunidades': Comunidad.objects.filter(activo=True).count(),
        'total_actividades': Actividad.objects.filter(eliminado_en__isnull=True).count(),
        'actividades_recientes': Actividad.objects.filter(eliminado_en__isnull=True)
        .select_related('tipo', 'comunidad', 'responsable')
        .order_by('-fecha')[:5],
    }
    return render(request, 'index.html', context)


def comunidades(request):
    """Vista de comunidades con datos reales"""
    galeria_prefetch = Prefetch(
        'galeria',
        queryset=ComunidadGaleria.objects.order_by('-creado_en'),
        to_attr='galeria_prefetch',
    )

    comunidades_qs = (
        Comunidad.objects.filter(activo=True)
        .select_related('tipo', 'region')
        .prefetch_related('autoridades', galeria_prefetch)
    )

    comunidades_list = list(
        comunidades_qs.order_by('region__codigo', 'nombre')
    )

    ultimas_comunidades = list(
        comunidades_qs.order_by('-actualizado_en', '-creado_en')[:3]
    )

    default_image_large = (
        'https://images.unsplash.com/photo-1523978591478-c753949ff840'
        '?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    )
    default_image_small = (
        'https://images.unsplash.com/photo-1523978591478-c753949ff840'
        '?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    )

    def asignar_imagen(comunidad, fallback_url):
        galeria = getattr(comunidad, 'galeria_prefetch', None)
        if galeria:
            comunidad.imagen_url = galeria[0].url_almacenamiento
        else:
            comunidad.imagen_url = fallback_url

    for comunidad in comunidades_list:
        asignar_imagen(comunidad, default_image_small)

    for comunidad in ultimas_comunidades:
        asignar_imagen(comunidad, default_image_large)

    ultimas_ids = {str(comunidad.id) for comunidad in ultimas_comunidades}
    comunidades_secundarias = [
        comunidad for comunidad in comunidades_list if str(comunidad.id) not in ultimas_ids
    ]

    context = {
        'ultimas_comunidades': ultimas_comunidades,
        'comunidades': comunidades_secundarias,
        'total_comunidades': len(comunidades_list),
        'regiones': Region.objects.all().order_by('codigo'),
        'tipos_comunidad': TipoComunidad.objects.all(),
    }
    return render(request, 'comunidades.html', context)


def regiones(request):
    """Vista de regiones con datos reales"""
    regiones_list = Region.objects.annotate(
        num_comunidades=Count('comunidades', filter=Q(comunidades__activo=True)),
        num_actividades=Count(
            'comunidades__actividades',
            filter=Q(comunidades__actividades__eliminado_en__isnull=True),
        ),
    ).order_by('codigo')

    ultimas_regiones = Region.objects.annotate(
        num_comunidades=Count('comunidades', filter=Q(comunidades__activo=True))
    ).order_by('-actualizado_en', '-creado_en')[:3]

    ultimas_regiones_ids = [str(r.id) for r in ultimas_regiones]

    for region in regiones_list:
        galeria = RegionGaleria.objects.filter(region=region).first()
        region.imagen_url = (
            galeria.url_almacenamiento
            if galeria
            else 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
        )

    for region in ultimas_regiones:
        galeria = RegionGaleria.objects.filter(region=region).first()
        region.imagen_url = (
            galeria.url_almacenamiento
            if galeria
            else 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        )

    context = {
        'regiones': regiones_list,
        'ultimas_regiones': ultimas_regiones,
        'ultimas_regiones_ids': ultimas_regiones_ids,
        'total_regiones': regiones_list.count(),
    }
    return render(request, 'regiones.html', context)


def proyectos(request):
    """Vista de proyectos/actividades con datos reales"""
    actividades_list = (
        Actividad.objects.filter(eliminado_en__isnull=True)
        .select_related('tipo', 'comunidad', 'responsable')
        .prefetch_related('beneficiarios')
        .order_by('-fecha')
    )

    tipos = TipoActividad.objects.filter(activo=True)

    context = {
        'actividades': actividades_list,
        'tipos_actividad': tipos,
        'total_actividades': actividades_list.count(),
    }
    return render(request, 'proyectos.html', context)


@permiso_gestionar_eventos
def gestioneseventos(request):
    """Vista de gestión de eventos - REQUIERE: Administrador"""
    usuario_maga = get_usuario_maga(request.user)

    actividades_list = (
        Actividad.objects.filter(eliminado_en__isnull=True)
        .select_related('tipo', 'comunidad', 'responsable')
        .order_by('-fecha')
    )

    context = {
        'actividades': actividades_list,
        'tipos_actividad': TipoActividad.objects.filter(activo=True),
        'comunidades': Comunidad.objects.filter(activo=True).select_related('region'),
        'usuarios': Usuario.objects.filter(activo=True),
        'usuario_actual': usuario_maga,
    }
    return render(request, 'gestioneseventos.html', context)


@permiso_generar_reportes
def generarreportes(request):
    """Vista de generación de reportes - REQUIERE: Usuario autenticado"""
    usuario_maga = get_usuario_maga(request.user)

    context = {
        'total_regiones': Region.objects.count(),
        'total_comunidades': Comunidad.objects.filter(activo=True).count(),
        'total_actividades': Actividad.objects.filter(eliminado_en__isnull=True).count(),
        'total_beneficiarios': Beneficiario.objects.filter(activo=True).count(),
        'usuario_actual': usuario_maga,
    }
    return render(request, 'generarreportes.html', context)


@solo_administrador
def gestionusuarios(request):
    """Vista de gestión de usuarios y personal - REQUIERE: Administrador"""
    usuario_maga = get_usuario_maga(request.user)
    puestos = Puesto.objects.filter(activo=True).order_by('nombre')

    context = {
        'usuario_actual': usuario_maga,
        'puestos': puestos,
    }
    return render(request, 'gestionusuarios.html', context)


def mapa_completo(request):
    """Vista del mapa completo con datos reales de regiones"""
    regiones_list = Region.objects.annotate(
        num_comunidades=Count('comunidades', filter=Q(comunidades__activo=True))
    ).order_by('codigo')

    context = {'regiones': regiones_list}
    return render(request, 'mapa-completo.html', context)


def login_view(request):
    """Vista de login con autenticación real contra la BD"""
    if request.user.is_authenticated:
        return redirect('webmaga:index')

    if request.method == 'POST':
        form = LoginForm(request.POST, request=request)
        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)

            # Configurar sesión para que dure una semana (7 días) y no se cierre al cerrar el navegador
            # Esto se aplica siempre, independientemente del checkbox "remember_me"
            # 7 días = 7 * 24 * 60 * 60 = 604800 segundos
            # La configuración SESSION_EXPIRE_AT_BROWSER_CLOSE = False en settings.py
            # asegura que la sesión no se cierre al cerrar el navegador
            request.session.set_expiry(604800)  # Una semana en segundos

            messages.success(request, f'¡Bienvenido, {user.username}!')
            next_url = request.GET.get('next', 'webmaga:index')
            return redirect(next_url)
    else:
        form = LoginForm()

    context = {'form': form}
    return render(request, 'login.html', context)


def logout_view(request):
    """Vista de logout"""
    if request.user.is_authenticated and hasattr(request.user, 'usuario_maga_id'):
        try:
            usuario_maga = Usuario.objects.get(id=request.user.usuario_maga_id)
            usuario_maga.ultimo_logout = timezone.now()
            usuario_maga.save(update_fields=['ultimo_logout'])
        except Usuario.DoesNotExist:
            pass

    auth_logout(request)
    messages.info(request, 'Has cerrado sesión exitosamente.')
    return redirect('webmaga:login')


@solo_administrador
def reportes_index(request):
    """Vista principal del módulo de reportes"""
    context = {'es_admin': True}
    return render(request, 'reportes.html', context)


@login_required(login_url='webmaga:login')
def perfilusuario(request):
    """Vista de perfil de usuario - REQUIERE: Usuario autenticado"""
    usuario_maga = get_usuario_maga(request.user)
    
    if not usuario_maga:
        messages.error(request, 'No se encontró tu información de usuario.')
        return redirect('webmaga:index')
    
    context = {
        'usuario_maga': usuario_maga,
    }
    return render(request, 'perfilusuario.html', context)


def configgeneral(request):
    """Vista de configuración general - ACCESIBLE PARA TODOS"""
    usuario_maga = get_usuario_maga(request.user) if request.user.is_authenticated else None
    
    context = {
        'usuario_maga': usuario_maga,
    }
    return render(request, 'configgeneral.html', context)


def preguntas_frecuentes(request):
    """Vista de preguntas frecuentes - ACCESIBLE PARA TODOS"""
    context = {}
    return render(request, 'preguntas-frecuentes.html', context)


__all__ = [
    'index',
    'comunidades',
    'regiones',
    'proyectos',
    'gestioneseventos',
    'generarreportes',
    'gestionusuarios',
    'mapa_completo',
    'login_view',
    'logout_view',
    'reportes_index',
    'perfilusuario',
    'configgeneral',
    'preguntas_frecuentes',
]

