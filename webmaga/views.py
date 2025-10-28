from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import login as auth_login, logout as auth_logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.db import transaction
from django.utils import timezone
import os
import json
from datetime import datetime
from .models import (
    Region, Comunidad, Actividad, TipoActividad, 
    Beneficiario, BeneficiarioIndividual, BeneficiarioFamilia, BeneficiarioInstitucion,
    TipoBeneficiario, Usuario, TipoComunidad, ActividadPersonal,
    ActividadBeneficiario, Evidencia, ActividadCambio
)
from .forms import LoginForm, RecuperarPasswordForm, ActividadForm
from .decorators import (
    solo_administrador,
    permiso_gestionar_eventos,
    permiso_generar_reportes,
    usuario_autenticado,
    get_usuario_maga
)

# =====================================================
# VISTAS DE PÁGINAS HTML
# =====================================================

def index(request):
    """Vista principal - Página de inicio con mapa interactivo"""
    context = {
        'total_regiones': Region.objects.count(),
        'total_comunidades': Comunidad.objects.filter(activo=True).count(),
        'total_actividades': Actividad.objects.filter(eliminado_en__isnull=True).count(),
        'actividades_recientes': Actividad.objects.filter(
            eliminado_en__isnull=True
        ).select_related('tipo', 'comunidad', 'responsable').order_by('-fecha')[:5]
    }
    return render(request, 'index.html', context)


def comunidades(request):
    """Vista de comunidades con datos reales"""
    comunidades_list = Comunidad.objects.filter(
        activo=True
    ).select_related('tipo', 'region').prefetch_related('autoridades').order_by('region__codigo', 'nombre')
    
    context = {
        'comunidades': comunidades_list,
        'total_comunidades': comunidades_list.count(),
        'regiones': Region.objects.all().order_by('codigo'),
        'tipos_comunidad': TipoComunidad.objects.all()
    }
    return render(request, 'comunidades.html', context)


def regiones(request):
    """Vista de regiones con datos reales"""
    regiones_list = Region.objects.annotate(
        num_comunidades=Count('comunidades', filter=Q(comunidades__activo=True)),
        num_actividades=Count('comunidades__actividades', filter=Q(comunidades__actividades__eliminado_en__isnull=True))
    ).order_by('codigo')
    
    context = {
        'regiones': regiones_list,
        'total_regiones': regiones_list.count()
    }
    return render(request, 'regiones.html', context)


def proyectos(request):
    """Vista de proyectos/actividades con datos reales"""
    # Filtrar actividades por tipo
    actividades_list = Actividad.objects.filter(
        eliminado_en__isnull=True
    ).select_related('tipo', 'comunidad', 'responsable').prefetch_related('beneficiarios').order_by('-fecha')
    
    # Obtener tipos de actividad
    tipos = TipoActividad.objects.filter(activo=True)
    
    context = {
        'actividades': actividades_list,
        'tipos_actividad': tipos,
        'total_actividades': actividades_list.count()
    }
    return render(request, 'proyectos.html', context)


@permiso_gestionar_eventos
def gestioneseventos(request):
    """Vista de gestión de eventos - REQUIERE: Administrador"""
    usuario_maga = get_usuario_maga(request.user)
    
    # Admin puede ver y gestionar todas las actividades
    actividades_list = Actividad.objects.filter(eliminado_en__isnull=True)
    
    actividades_list = actividades_list.select_related(
        'tipo', 'comunidad', 'responsable'
    ).order_by('-fecha')
    
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


def mapa_completo(request):
    """Vista del mapa completo con datos reales de regiones"""
    regiones_list = Region.objects.annotate(
        num_comunidades=Count('comunidades', filter=Q(comunidades__activo=True))
    ).order_by('codigo')
    
    context = {
        'regiones': regiones_list
    }
    return render(request, 'mapa-completo.html', context)


def login_view(request):
    """Vista de login con autenticación real contra la BD"""
    # Si ya está autenticado, redirigir al index
    if request.user.is_authenticated:
        return redirect('webmaga:index')
    
    if request.method == 'POST':
        form = LoginForm(request.POST, request=request)
        if form.is_valid():
            user = form.get_user()
            
            # Iniciar sesión
            auth_login(request, user)
            
            # Configurar duración de sesión según "Recordar usuario"
            if not form.cleaned_data.get('remember_me'):
                # Expirar sesión al cerrar navegador
                request.session.set_expiry(0)
            else:
                # Sesión de 30 días
                request.session.set_expiry(30 * 24 * 60 * 60)
            
            messages.success(request, f'¡Bienvenido, {user.username}!')
            
            # Redirigir a la página solicitada o al index
            next_url = request.GET.get('next', 'webmaga:index')
            return redirect(next_url)
    else:
        form = LoginForm()
    
    context = {
        'form': form
    }
    return render(request, 'login.html', context)


def logout_view(request):
    """Vista de logout"""
    # Actualizar ultimo_logout en la tabla usuarios
    if request.user.is_authenticated and hasattr(request.user, 'usuario_maga_id'):
        try:
            from datetime import datetime
            usuario_maga = Usuario.objects.get(id=request.user.usuario_maga_id)
            usuario_maga.ultimo_logout = datetime.now()
            usuario_maga.save(update_fields=['ultimo_logout'])
        except Usuario.DoesNotExist:
            pass
    
    auth_logout(request)
    messages.info(request, 'Has cerrado sesión exitosamente.')
    return redirect('webmaga:login')


# =====================================================
# VISTAS API JSON (para AJAX)
# =====================================================

def api_usuario_actual(request):
    """API: Información del usuario actual y sus permisos"""
    if not request.user.is_authenticated:
        return JsonResponse({
            'autenticado': False,
            'error': 'Usuario no autenticado'
        }, status=401)
    
    usuario_maga = get_usuario_maga(request.user)
    
    if not usuario_maga:
        return JsonResponse({
            'autenticado': True,
            'error': 'Usuario MAGA no encontrado'
        }, status=404)
    
    return JsonResponse({
        'autenticado': True,
        'username': usuario_maga.username,
        'email': usuario_maga.email,
        'rol': usuario_maga.rol,
        'permisos': {
            'es_admin': usuario_maga.rol == 'admin',
            'es_personal': usuario_maga.rol == 'personal',
            'puede_gestionar_eventos': usuario_maga.rol == 'admin',
            'puede_generar_reportes': True,
        }
    })


def api_regiones(request):
    """API: Listar todas las regiones"""
    regiones = Region.objects.annotate(
        num_comunidades=Count('comunidades', filter=Q(comunidades__activo=True))
    ).values(
        'id', 'codigo', 'nombre', 'descripcion', 'comunidad_sede', 
        'poblacion_aprox', 'num_comunidades'
    )
    return JsonResponse(list(regiones), safe=False)


def api_comunidades(request):
    """API: Listar todas las comunidades"""
    region_id = request.GET.get('region_id')
    
    comunidades_query = Comunidad.objects.filter(activo=True).select_related('tipo', 'region')
    
    if region_id:
        comunidades_query = comunidades_query.filter(region_id=region_id)
    
    comunidades = []
    for com in comunidades_query:
        comunidades.append({
            'id': str(com.id),
            'codigo': com.codigo,
            'nombre': com.nombre,
            'tipo': com.tipo.get_nombre_display() if com.tipo else None,
            'region': {
                'id': str(com.region.id) if com.region else None,
                'codigo': com.region.codigo if com.region else None,
                'nombre': com.region.nombre if com.region else None
            } if com.region else None,
            'poblacion': com.poblacion,
            'cocode': com.cocode,
            'telefono_cocode': com.telefono_cocode
        })
    
    return JsonResponse(comunidades, safe=False)


def api_actividades(request):
    """API: Listar actividades"""
    tipo_id = request.GET.get('tipo_id')
    estado = request.GET.get('estado')
    
    actividades_query = Actividad.objects.filter(
        eliminado_en__isnull=True
    ).select_related('tipo', 'comunidad', 'responsable')
    
    if tipo_id:
        actividades_query = actividades_query.filter(tipo_id=tipo_id)
    
    if estado:
        actividades_query = actividades_query.filter(estado=estado)
    
    actividades = []
    for act in actividades_query.order_by('-fecha')[:50]:  # Limitar a 50 más recientes
        actividades.append({
            'id': str(act.id),
            'nombre': act.nombre,
            'fecha': act.fecha.isoformat(),
            'descripcion': act.descripcion,
            'estado': act.estado,
            'tipo': act.tipo.nombre if act.tipo else None,
            'comunidad': {
                'nombre': act.comunidad.nombre,
                'codigo': act.comunidad.codigo
            } if act.comunidad else None,
            'responsable': (act.responsable.nombre if act.responsable.nombre else act.responsable.username) if act.responsable else None
        })
    
    return JsonResponse(actividades, safe=False)


# =====================================================
# VISTAS DE GESTIÓN DE EVENTOS
# =====================================================

@permiso_gestionar_eventos
@require_http_methods(["POST"])
def api_crear_evento(request):
    """
    API: Crear un nuevo evento/actividad
    Maneja el formulario con archivos, personal y beneficiarios
    """
    usuario_maga = get_usuario_maga(request.user)
    
    if not usuario_maga:
        return JsonResponse({
            'success': False,
            'error': 'Usuario no autenticado'
        }, status=401)
    
    try:
        # Procesar los datos del formulario
        data = request.POST
        
        # Validar campos requeridos
        campos_requeridos = ['nombre', 'tipo_actividad_id', 'comunidad_id', 'fecha', 'descripcion']
        for campo in campos_requeridos:
            if not data.get(campo):
                return JsonResponse({
                    'success': False,
                    'error': f'El campo {campo} es requerido'
                }, status=400)
        
        # Usar transacción para asegurar integridad de datos
        with transaction.atomic():
            # 1. Crear la actividad
            actividad = Actividad.objects.create(
                nombre=data['nombre'],
                tipo_id=data['tipo_actividad_id'],
                comunidad_id=data['comunidad_id'],
                responsable=usuario_maga,
                fecha=data['fecha'],
                descripcion=data['descripcion'],
                estado=data.get('estado', 'planificado'),
                latitud=data.get('latitud') if data.get('latitud') else None,
                longitud=data.get('longitud') if data.get('longitud') else None
            )
            
            # 2. Asignar personal
            if data.get('personal_ids'):
                try:
                    personal_ids = json.loads(data['personal_ids'])
                    for item in personal_ids:
                        # Manejar tanto strings (IDs) como objetos {"id": "...", "rol": "..."}
                        if isinstance(item, str):
                            usuario_id = item
                            rol = 'Colaborador'
                        elif isinstance(item, dict):
                            usuario_id = item.get('id')
                            rol = item.get('rol', 'Colaborador')
                        else:
                            continue
                        
                        if usuario_id:
                            ActividadPersonal.objects.create(
                                actividad=actividad,
                                usuario_id=usuario_id,
                                rol_en_actividad=rol
                            )
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error al asignar personal: {e}")
                    pass  # Ignorar si no hay personal válido
            
            # 3. Crear y asignar beneficiarios nuevos
            if data.get('beneficiarios_nuevos'):
                try:
                    beneficiarios_nuevos = json.loads(data['beneficiarios_nuevos'])
                    print(f"📋 Beneficiarios nuevos a crear: {len(beneficiarios_nuevos)}")
                    
                    for benef_data in beneficiarios_nuevos:
                        tipo = benef_data.get('tipo')
                        print(f"🔍 Procesando beneficiario tipo: {tipo}")
                        print(f"🔍 Datos completos: {benef_data}")
                        comunidad_id = data.get('comunidad_id')  # Usar la misma comunidad del evento
                        
                        # Obtener el tipo de beneficiario (mapear "otro" a "institucion")
                        tipo_lookup = tipo if tipo != 'otro' else 'institución'
                        tipo_benef = TipoBeneficiario.objects.get(nombre=tipo_lookup)
                        
                        # Crear beneficiario principal
                        beneficiario = Beneficiario.objects.create(
                            tipo=tipo_benef,
                            comunidad_id=comunidad_id,
                            activo=True
                        )
                        
                        # Crear registro específico según tipo
                        if tipo == 'individual':
                            BeneficiarioIndividual.objects.create(
                                beneficiario=beneficiario,
                                nombre=benef_data.get('nombre', ''),
                                apellido=benef_data.get('apellido', ''),
                                dpi=benef_data.get('dpi'),
                                fecha_nacimiento=benef_data.get('fecha_nacimiento'),
                                genero=benef_data.get('genero'),
                                telefono=benef_data.get('telefono')
                            )
                        elif tipo == 'familia':
                            BeneficiarioFamilia.objects.create(
                                beneficiario=beneficiario,
                                nombre_familia=benef_data.get('nombre_familia', ''),
                                jefe_familia=benef_data.get('jefe_familia', ''),
                                dpi_jefe_familia=benef_data.get('dpi_jefe_familia'),
                                telefono=benef_data.get('telefono'),
                                numero_miembros=benef_data.get('numero_miembros')
                            )
                        elif tipo == 'institucion' or tipo == 'institución':
                            inst = BeneficiarioInstitucion.objects.create(
                                beneficiario=beneficiario,
                                nombre_institucion=benef_data.get('nombre_institucion', ''),
                                tipo_institucion=benef_data.get('tipo_institucion', 'otro'),
                                representante_legal=benef_data.get('representante_legal'),
                                dpi_representante=benef_data.get('dpi_representante'),
                                telefono=benef_data.get('telefono'),
                                email=benef_data.get('email'),
                                numero_beneficiarios_directos=benef_data.get('numero_beneficiarios_directos')
                            )
                            print(f"✅ Institución creada: {inst.nombre_institucion} (ID: {inst.id})")
                        elif tipo == 'otro':
                            # Guardar como institución con tipo 'otro' y usar campos flexibles
                            BeneficiarioInstitucion.objects.create(
                                beneficiario=beneficiario,
                                nombre_institucion=benef_data.get('nombre', ''),
                                tipo_institucion='otro',
                                representante_legal=benef_data.get('contacto'),
                                telefono=benef_data.get('telefono'),
                                email=benef_data.get('tipo_descripcion')  # Usar email para guardar el tipo_descripcion
                            )
                        
                        # Asociar beneficiario con la actividad
                        ActividadBeneficiario.objects.create(
                            actividad=actividad,
                            beneficiario=beneficiario
                        )
                        
                except (json.JSONDecodeError, ValueError, TipoBeneficiario.DoesNotExist) as e:
                    print(f"Error al crear beneficiarios: {e}")
                    pass  # Ignorar si hay errores en beneficiarios
            
            # 4. Guardar evidencias (archivos/imágenes)
            archivos_guardados = []
            evidencias_guardadas = request.FILES.getlist('evidences')
            
            if evidencias_guardadas:
                fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'evidencias'))
                
                for index, file in enumerate(evidencias_guardadas):
                    # Generar nombre único con microsegundos para evitar duplicados
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S%f')
                    # Obtener extensión del archivo
                    file_extension = os.path.splitext(file.name)[1]
                    filename = f"{timestamp}_{index}{file_extension}"
                    
                    # Guardar archivo físicamente
                    saved_name = fs.save(filename, file)
                    file_url = f"/media/evidencias/{saved_name}"
                    
                    # Determinar si es imagen
                    es_imagen = file.content_type.startswith('image/') if hasattr(file, 'content_type') else False
                    
                    # Crear registro de evidencia en la BD
                    evidencia = Evidencia.objects.create(
                        actividad=actividad,
                        archivo_nombre=file.name,
                        archivo_tipo=file.content_type if hasattr(file, 'content_type') else 'application/octet-stream',
                        archivo_tamanio=file.size if hasattr(file, 'size') else 0,
                        url_almacenamiento=file_url,
                        es_imagen=es_imagen,
                        creado_por=usuario_maga
                    )
                    
                    archivos_guardados.append({
                        'id': str(evidencia.id),
                        'nombre': file.name,
                        'url': file_url,
                        'tipo': 'imagen' if es_imagen else 'archivo',
                        'tamanio': file.size
                    })
            
            # 5. Registrar cambio/creación
            ActividadCambio.objects.create(
                actividad=actividad,
                responsable=usuario_maga,
                descripcion_cambio=f'Evento "{actividad.nombre}" creado por {usuario_maga.username}'
            )
            
            # Respuesta exitosa
            return JsonResponse({
                'success': True,
                'message': 'Evento creado exitosamente',
                'actividad': {
                    'id': str(actividad.id),
                    'nombre': actividad.nombre,
                    'tipo': actividad.tipo.nombre,
                    'fecha': str(actividad.fecha),
                    'comunidad': actividad.comunidad.nombre if actividad.comunidad else None,
                    'estado': actividad.estado
                },
                'archivos': archivos_guardados,
                'total_archivos': len(archivos_guardados)
            })
    
    except TipoActividad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Tipo de actividad no válido'
        }, status=400)
    
    except Comunidad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Comunidad no válida'
        }, status=400)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al crear evento: {str(e)}'
        }, status=500)


@permiso_gestionar_eventos
def api_listar_personal(request):
    """API: Listar personal disponible para asignar a eventos"""
    usuarios = Usuario.objects.filter(activo=True).select_related('puesto').order_by('username')
    
    personal_list = []
    for usuario in usuarios:
        personal_list.append({
            'id': str(usuario.id),
            'username': usuario.username,
            'nombre': usuario.nombre or '',  # Nombre completo (opcional)
            'email': usuario.email,
            'rol': usuario.rol,
            'rol_display': usuario.get_rol_display(),
            'puesto': usuario.puesto.nombre if usuario.puesto else None
        })
    
    return JsonResponse(personal_list, safe=False)


@permiso_gestionar_eventos
def api_listar_beneficiarios(request):
    """API: Listar beneficiarios disponibles"""
    beneficiarios = Beneficiario.objects.filter(
        activo=True
    ).select_related('tipo', 'comunidad').prefetch_related(
        'individual', 'familia', 'institucion'
    )
    
    beneficiarios_list = []
    for ben in beneficiarios:
        # Obtener nombre según tipo
        if hasattr(ben, 'individual'):
            nombre = f"{ben.individual.nombre} {ben.individual.apellido}"
            info_adicional = ben.individual.dpi or ''
        elif hasattr(ben, 'familia'):
            nombre = ben.familia.nombre_familia
            info_adicional = f"Jefe: {ben.familia.jefe_familia}"
        elif hasattr(ben, 'institucion'):
            nombre = ben.institucion.nombre_institucion
            info_adicional = ben.institucion.tipo_institucion
        else:
            nombre = f"Beneficiario {ben.id}"
            info_adicional = ''
        
        beneficiarios_list.append({
            'id': str(ben.id),
            'nombre': nombre,
            'tipo': ben.tipo.nombre,
            'tipo_display': ben.tipo.get_nombre_display(),
            'comunidad': ben.comunidad.nombre if ben.comunidad else None,
            'info_adicional': info_adicional
        })
    
    return JsonResponse(beneficiarios_list, safe=False)


# =====================================================
# APIs PARA GESTIÓN DE EVENTOS (Listar, Editar, Eliminar)
# =====================================================

@permiso_gestionar_eventos
@require_http_methods(["GET"])
def api_listar_eventos(request):
    """Lista todos los eventos no eliminados"""
    try:
        eventos = Actividad.objects.filter(
            eliminado_en__isnull=True
        ).select_related(
            'tipo', 'comunidad', 'comunidad__region', 'responsable'
        ).prefetch_related(
            'personal__usuario',
            'beneficiarios__beneficiario'
        ).order_by('-creado_en')
        
        eventos_data = []
        for evento in eventos:
            # Contar personal y beneficiarios
            personal_count = evento.personal.count()
            beneficiarios_count = evento.beneficiarios.count()
            
            # Obtener nombres del personal (usar nombre completo o username como fallback)
            personal_nombres = [
                ap.usuario.nombre if ap.usuario.nombre else ap.usuario.username 
                for ap in evento.personal.all()[:3]
            ]
            if personal_count > 3:
                personal_nombres.append(f'+{personal_count - 3} más')
            
            # Convertir creado_en a zona horaria local
            from django.utils.timezone import localtime, is_aware, make_aware
            import pytz
            
            # Si la fecha no tiene timezone, agregarla (asumiendo UTC)
            if not is_aware(evento.creado_en):
                creado_en_aware = make_aware(evento.creado_en, pytz.UTC)
            else:
                creado_en_aware = evento.creado_en
            
            creado_en_local = localtime(creado_en_aware)
            
            eventos_data.append({
                'id': str(evento.id),
                'nombre': evento.nombre,
                'tipo': evento.tipo.nombre if evento.tipo else 'Sin tipo',
                'comunidad': evento.comunidad.nombre if evento.comunidad else 'Sin comunidad',
                'fecha': str(evento.fecha),
                'estado': evento.estado,
                'descripcion': evento.descripcion[:100] + '...' if len(evento.descripcion) > 100 else evento.descripcion,
                'personal_count': personal_count,
                'personal_nombres': ', '.join(personal_nombres) if personal_nombres else 'Sin personal',
                'beneficiarios_count': beneficiarios_count,
                'responsable': (evento.responsable.nombre if evento.responsable.nombre else evento.responsable.username) if evento.responsable else 'Sin responsable',
                'creado_en': creado_en_local.strftime('%d/%m/%Y %H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'eventos': eventos_data,
            'total': len(eventos_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al listar eventos: {str(e)}'
        }, status=500)


@permiso_gestionar_eventos
@require_http_methods(["GET"])
def api_obtener_evento(request, evento_id):
    """Obtiene los detalles completos de un evento"""
    try:
        evento = Actividad.objects.select_related(
            'tipo', 'comunidad', 'responsable'
        ).prefetch_related(
            'personal__usuario__puesto',
            'beneficiarios__beneficiario__individual',
            'beneficiarios__beneficiario__familia',
            'beneficiarios__beneficiario__institucion',
            'evidencias'
        ).get(id=evento_id, eliminado_en__isnull=True)
        
        # Personal asignado
        personal_data = []
        for ap in evento.personal.all():
            personal_data.append({
                'id': str(ap.usuario.id),
                'username': ap.usuario.username,
                'nombre': ap.usuario.nombre or '',  # Nombre completo (opcional)
                'rol': ap.rol_en_actividad,
                'rol_display': ap.usuario.get_rol_display(),
                'puesto': ap.usuario.puesto.nombre if ap.usuario.puesto else None
            })
        
        # Beneficiarios con detalles completos
        beneficiarios_data = []
        for ab in evento.beneficiarios.all():
            benef = ab.beneficiario
            nombre_display = ''
            detalles = {}
            
            if hasattr(benef, 'individual'):
                ind = benef.individual
                nombre_display = f"{ind.nombre} {ind.apellido}"
                detalles = {
                    'nombre': ind.nombre,
                    'apellido': ind.apellido,
                    'dpi': ind.dpi or '',
                    'fecha_nacimiento': str(ind.fecha_nacimiento) if ind.fecha_nacimiento else '',
                    'genero': ind.genero or '',
                    'telefono': ind.telefono or '',
                    'display_name': nombre_display
                }
            elif hasattr(benef, 'familia'):
                fam = benef.familia
                nombre_display = fam.nombre_familia
                detalles = {
                    'nombre_familia': fam.nombre_familia,
                    'jefe_familia': fam.jefe_familia,
                    'dpi_jefe_familia': fam.dpi_jefe_familia or '',
                    'telefono': fam.telefono or '',
                    'numero_miembros': fam.numero_miembros or '',
                    'display_name': nombre_display
                }
            elif hasattr(benef, 'institucion'):
                inst = benef.institucion
                nombre_display = inst.nombre_institucion
                detalles = {
                    'nombre_institucion': inst.nombre_institucion,
                    'tipo_institucion': inst.tipo_institucion,
                    'representante_legal': inst.representante_legal or '',
                    'dpi_representante': inst.dpi_representante or '',
                    'telefono': inst.telefono or '',
                    'email': inst.email or '',
                    'numero_beneficiarios_directos': inst.numero_beneficiarios_directos or '',
                    'display_name': nombre_display
                }
            
            beneficiarios_data.append({
                'id': str(benef.id),
                'nombre': nombre_display,
                'tipo': benef.tipo.nombre,
                'detalles': detalles
            })
        
        # Evidencias
        evidencias_data = []
        for evidencia in evento.evidencias.all():
            evidencias_data.append({
                'id': str(evidencia.id),
                'nombre': evidencia.archivo_nombre,
                'url': evidencia.url_almacenamiento,
                'tipo': evidencia.archivo_tipo,
                'es_imagen': evidencia.es_imagen
            })
        
        evento_data = {
            'id': str(evento.id),
            'nombre': evento.nombre,
            'tipo_id': str(evento.tipo.id) if evento.tipo else None,
            'comunidad_id': str(evento.comunidad.id) if evento.comunidad else None,
            'fecha': str(evento.fecha),
            'estado': evento.estado,
            'descripcion': evento.descripcion,
            'latitud': float(evento.latitud) if evento.latitud else None,
            'longitud': float(evento.longitud) if evento.longitud else None,
            'personal': personal_data,
            'beneficiarios': beneficiarios_data,
            'evidencias': evidencias_data
        }
        
        return JsonResponse({
            'success': True,
            'evento': evento_data
        })
        
    except Actividad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Evento no encontrado'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al obtener evento: {str(e)}'
        }, status=500)


@permiso_gestionar_eventos
@require_http_methods(["POST"])
def api_actualizar_evento(request, evento_id):
    """Actualiza un evento existente"""
    try:
        evento = Actividad.objects.get(id=evento_id, eliminado_en__isnull=True)
        usuario_maga = get_usuario_maga(request.user)
        
        data = request.POST
        cambios_realizados = []
        
        with transaction.atomic():
            # Actualizar campos básicos
            if data.get('nombre') and data.get('nombre') != evento.nombre:
                cambios_realizados.append(f"Nombre: '{evento.nombre}' → '{data.get('nombre')}'")
                evento.nombre = data.get('nombre')
            
            if data.get('tipo_actividad_id'):
                nuevo_tipo = TipoActividad.objects.get(id=data.get('tipo_actividad_id'))
                if nuevo_tipo != evento.tipo:
                    cambios_realizados.append(f"Tipo: '{evento.tipo.nombre}' → '{nuevo_tipo.nombre}'")
                    evento.tipo = nuevo_tipo
            
            if data.get('comunidad_id'):
                nueva_comunidad = Comunidad.objects.get(id=data.get('comunidad_id'))
                if nueva_comunidad != evento.comunidad:
                    cambios_realizados.append(f"Comunidad: '{evento.comunidad.nombre}' → '{nueva_comunidad.nombre}'")
                    evento.comunidad = nueva_comunidad
            
            if data.get('fecha') and data.get('fecha') != str(evento.fecha):
                cambios_realizados.append(f"Fecha: '{evento.fecha}' → '{data.get('fecha')}'")
                evento.fecha = data.get('fecha')
            
            if data.get('estado') and data.get('estado') != evento.estado:
                cambios_realizados.append(f"Estado: '{evento.estado}' → '{data.get('estado')}'")
                evento.estado = data.get('estado')
            
            if data.get('descripcion') and data.get('descripcion') != evento.descripcion:
                cambios_realizados.append("Descripción actualizada")
                evento.descripcion = data.get('descripcion')
            
            if data.get('latitud'):
                evento.latitud = float(data.get('latitud'))
            
            if data.get('longitud'):
                evento.longitud = float(data.get('longitud'))
            
            evento.actualizado_en = timezone.now()
            evento.save()
            
            # Actualizar personal
            if data.get('personal_ids'):
                personal_ids_nuevos = set(json.loads(data.get('personal_ids')))
                personal_ids_actuales = set(str(ap.usuario.id) for ap in evento.personal.all())
                
                # Eliminar personal que ya no está asignado
                personal_a_eliminar = personal_ids_actuales - personal_ids_nuevos
                if personal_a_eliminar:
                    ActividadPersonal.objects.filter(
                        actividad=evento,
                        usuario_id__in=personal_a_eliminar
                    ).delete()
                    cambios_realizados.append(f"Removido {len(personal_a_eliminar)} personal")
                
                # Agregar nuevo personal
                personal_a_agregar = personal_ids_nuevos - personal_ids_actuales
                if personal_a_agregar:
                    for usuario_id in personal_a_agregar:
                        usuario = Usuario.objects.get(id=usuario_id)
                        ActividadPersonal.objects.create(
                            actividad=evento,
                            usuario=usuario,
                            rol_en_actividad='colaborador'
                        )
                    cambios_realizados.append(f"Agregado {len(personal_a_agregar)} personal")
            
            # Eliminar beneficiarios (si se marcaron)
            if data.get('beneficiarios_eliminados'):
                try:
                    beneficiarios_ids_eliminar = json.loads(data['beneficiarios_eliminados'])
                    if beneficiarios_ids_eliminar:
                        # Eliminar las relaciones ActividadBeneficiario
                        ActividadBeneficiario.objects.filter(
                            actividad=evento,
                            beneficiario_id__in=beneficiarios_ids_eliminar
                        ).delete()
                        cambios_realizados.append(f"Removido {len(beneficiarios_ids_eliminar)} beneficiarios")
                        print(f"✅ Removidos {len(beneficiarios_ids_eliminar)} beneficiarios del evento")
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error al eliminar beneficiarios: {e}")
                    pass
            
            # Actualizar beneficiarios modificados (si hay)
            if data.get('beneficiarios_modificados'):
                try:
                    beneficiarios_modificados = json.loads(data['beneficiarios_modificados'])
                    for benef_data in beneficiarios_modificados:
                        benef_id = benef_data.get('id')
                        if not benef_id:
                            continue
                        
                        # Obtener el beneficiario principal
                        try:
                            beneficiario = Beneficiario.objects.get(id=benef_id)
                        except Beneficiario.DoesNotExist:
                            print(f"⚠️ Beneficiario {benef_id} no encontrado")
                            continue
                        
                        # Actualizar según el tipo
                        tipo = benef_data.get('tipo')
                        
                        if tipo == 'individual':
                            # Actualizar BeneficiarioIndividual
                            try:
                                benef_ind = BeneficiarioIndividual.objects.get(beneficiario=beneficiario)
                                benef_ind.nombre = benef_data.get('nombre', benef_ind.nombre)
                                benef_ind.apellido = benef_data.get('apellido', benef_ind.apellido)
                                benef_ind.dpi = benef_data.get('dpi')
                                benef_ind.fecha_nacimiento = benef_data.get('fecha_nacimiento')
                                benef_ind.genero = benef_data.get('genero')
                                benef_ind.telefono = benef_data.get('telefono')
                                benef_ind.save()
                                print(f"✅ Individual actualizado: {benef_ind.nombre} {benef_ind.apellido}")
                            except BeneficiarioIndividual.DoesNotExist:
                                print(f"⚠️ BeneficiarioIndividual no encontrado para {benef_id}")
                        
                        elif tipo == 'familia':
                            # Actualizar BeneficiarioFamilia
                            try:
                                benef_fam = BeneficiarioFamilia.objects.get(beneficiario=beneficiario)
                                benef_fam.nombre_familia = benef_data.get('nombre_familia', benef_fam.nombre_familia)
                                benef_fam.jefe_familia = benef_data.get('jefe_familia', benef_fam.jefe_familia)
                                benef_fam.dpi_jefe_familia = benef_data.get('dpi_jefe_familia')
                                benef_fam.telefono = benef_data.get('telefono')
                                benef_fam.numero_miembros = benef_data.get('numero_miembros')
                                benef_fam.save()
                                print(f"✅ Familia actualizada: {benef_fam.nombre_familia}")
                            except BeneficiarioFamilia.DoesNotExist:
                                print(f"⚠️ BeneficiarioFamilia no encontrado para {benef_id}")
                        
                        elif tipo == 'institucion' or tipo == 'institución':
                            # Actualizar BeneficiarioInstitucion
                            try:
                                benef_inst = BeneficiarioInstitucion.objects.get(beneficiario=beneficiario)
                                benef_inst.nombre_institucion = benef_data.get('nombre_institucion', benef_inst.nombre_institucion)
                                benef_inst.tipo_institucion = benef_data.get('tipo_institucion', benef_inst.tipo_institucion)
                                benef_inst.representante_legal = benef_data.get('representante_legal')
                                benef_inst.dpi_representante = benef_data.get('dpi_representante')
                                benef_inst.telefono = benef_data.get('telefono')
                                benef_inst.email = benef_data.get('email')
                                benef_inst.numero_beneficiarios_directos = benef_data.get('numero_beneficiarios_directos')
                                benef_inst.save()
                                print(f"✅ Institución actualizada: {benef_inst.nombre_institucion}")
                            except BeneficiarioInstitucion.DoesNotExist:
                                print(f"⚠️ BeneficiarioInstitucion no encontrado para {benef_id}")
                        
                        elif tipo == 'otro':
                            # Actualizar como Institución con tipo 'otro'
                            try:
                                benef_inst = BeneficiarioInstitucion.objects.get(beneficiario=beneficiario)
                                benef_inst.nombre_institucion = benef_data.get('nombre', benef_inst.nombre_institucion)
                                benef_inst.tipo_institucion = 'otro'
                                benef_inst.representante_legal = benef_data.get('contacto')
                                benef_inst.telefono = benef_data.get('telefono')
                                # Nota: El campo observaciones no existe en el modelo
                                benef_inst.save()
                                print(f"✅ Otro actualizado: {benef_inst.nombre_institucion}")
                            except BeneficiarioInstitucion.DoesNotExist:
                                print(f"⚠️ BeneficiarioInstitucion (otro) no encontrado para {benef_id}")
                    
                    if beneficiarios_modificados:
                        cambios_realizados.append(f"Modificado {len(beneficiarios_modificados)} beneficiarios")
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error al actualizar beneficiarios: {e}")
                    pass
            
            # Eliminar evidencias (si se marcaron)
            if data.get('evidencias_eliminadas'):
                try:
                    evidencias_ids_eliminar = json.loads(data['evidencias_eliminadas'])
                    if evidencias_ids_eliminar:
                        # Obtener las evidencias antes de eliminarlas (para borrar archivos físicos)
                        evidencias_a_eliminar = Evidencia.objects.filter(
                            id__in=evidencias_ids_eliminar,
                            actividad=evento
                        )
                        
                        archivos_eliminados = 0
                        for evidencia in evidencias_a_eliminar:
                            # Intentar eliminar el archivo físico
                            try:
                                archivo_path = os.path.join(settings.MEDIA_ROOT, evidencia.url_almacenamiento.lstrip('/media/'))
                                if os.path.exists(archivo_path):
                                    os.remove(archivo_path)
                                    print(f"🗑️ Archivo físico eliminado: {archivo_path}")
                            except Exception as e_file:
                                print(f"⚠️ No se pudo eliminar el archivo físico: {e_file}")
                            
                            archivos_eliminados += 1
                        
                        # Eliminar registros de la base de datos
                        evidencias_a_eliminar.delete()
                        cambios_realizados.append(f"Removido {archivos_eliminados} evidencias")
                        print(f"✅ Removidas {archivos_eliminados} evidencias del evento")
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error al eliminar evidencias: {e}")
                    pass
            
            # Actualizar beneficiarios nuevos (si se agregaron)
            if data.get('beneficiarios_nuevos'):
                try:
                    beneficiarios_nuevos = json.loads(data['beneficiarios_nuevos'])
                    
                    for benef_data in beneficiarios_nuevos:
                        tipo = benef_data.get('tipo')
                        comunidad_id = data.get('comunidad_id')
                        
                        # Obtener el tipo de beneficiario
                        tipo_lookup = tipo if tipo != 'otro' else 'institución'
                        tipo_benef = TipoBeneficiario.objects.get(nombre=tipo_lookup)
                        
                        # Crear beneficiario principal
                        beneficiario = Beneficiario.objects.create(
                            tipo=tipo_benef,
                            comunidad_id=comunidad_id,
                            activo=True
                        )
                        
                        # Crear registro específico según tipo
                        if tipo == 'individual':
                            BeneficiarioIndividual.objects.create(
                                beneficiario=beneficiario,
                                nombre=benef_data.get('nombre', ''),
                                apellido=benef_data.get('apellido', ''),
                                dpi=benef_data.get('dpi'),
                                fecha_nacimiento=benef_data.get('fecha_nacimiento'),
                                genero=benef_data.get('genero'),
                                telefono=benef_data.get('telefono')
                            )
                        elif tipo == 'familia':
                            BeneficiarioFamilia.objects.create(
                                beneficiario=beneficiario,
                                nombre_familia=benef_data.get('nombre_familia', ''),
                                jefe_familia=benef_data.get('jefe_familia', ''),
                                dpi_jefe_familia=benef_data.get('dpi_jefe_familia'),
                                telefono=benef_data.get('telefono'),
                                numero_miembros=benef_data.get('numero_miembros')
                            )
                        elif tipo == 'institucion' or tipo == 'institución':
                            BeneficiarioInstitucion.objects.create(
                                beneficiario=beneficiario,
                                nombre_institucion=benef_data.get('nombre_institucion', ''),
                                tipo_institucion=benef_data.get('tipo_institucion', 'otro'),
                                representante_legal=benef_data.get('representante_legal'),
                                dpi_representante=benef_data.get('dpi_representante'),
                                telefono=benef_data.get('telefono'),
                                email=benef_data.get('email'),
                                numero_beneficiarios_directos=benef_data.get('numero_beneficiarios_directos')
                            )
                        elif tipo == 'otro':
                            BeneficiarioInstitucion.objects.create(
                                beneficiario=beneficiario,
                                nombre_institucion=benef_data.get('nombre', ''),
                                tipo_institucion='otro',
                                representante_legal=benef_data.get('contacto'),
                                telefono=benef_data.get('telefono'),
                                email=benef_data.get('tipo_descripcion')
                            )
                        
                        # Asociar beneficiario con la actividad
                        ActividadBeneficiario.objects.create(
                            actividad=evento,
                            beneficiario=beneficiario
                        )
                    
                    cambios_realizados.append(f"Agregado {len(beneficiarios_nuevos)} beneficiarios")
                    
                except (json.JSONDecodeError, ValueError, TipoBeneficiario.DoesNotExist) as e:
                    print(f"Error al agregar beneficiarios: {e}")
                    pass
            
            # Agregar nuevas evidencias
            if request.FILES.getlist('evidencias_nuevas'):
                archivos = request.FILES.getlist('evidencias_nuevas')
                fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'evidencias'))
                
                for idx, archivo in enumerate(archivos):
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S%f')
                    nombre_unico = f"{timestamp}_{idx}.{archivo.name.split('.')[-1]}"
                    nombre_guardado = fs.save(nombre_unico, archivo)
                    url_archivo = f"/media/evidencias/{nombre_guardado}"
                    
                    Evidencia.objects.create(
                        actividad=evento,
                        archivo_nombre=archivo.name,
                        archivo_tipo=archivo.content_type,
                        url_almacenamiento=url_archivo,
                        es_imagen=archivo.content_type.startswith('image/')
                    )
                
                cambios_realizados.append(f"Agregado {len(archivos)} evidencias")
            
            # Registrar cambios
            if cambios_realizados:
                descripcion = f"Evento actualizado por {usuario_maga.username}: " + "; ".join(cambios_realizados)
                ActividadCambio.objects.create(
                    actividad=evento,
                    responsable=usuario_maga,
                    descripcion_cambio=descripcion[:500]
                )
            
            return JsonResponse({
                'success': True,
                'message': 'Evento actualizado exitosamente',
                'evento': {
                    'id': str(evento.id),
                    'nombre': evento.nombre,
                    'fecha': str(evento.fecha),
                },
                'cambios': cambios_realizados
            })
    
    except Actividad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Evento no encontrado'
        }, status=404)
    except TipoActividad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Tipo de actividad no válido'
        }, status=400)
    except Comunidad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Comunidad no válida'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al actualizar evento: {str(e)}'
        }, status=500)


@permiso_gestionar_eventos
@require_http_methods(["GET"])
def api_cambios_recientes(request):
    """Obtiene los cambios recientes de actividades"""
    try:
        # Obtener los últimos 10 cambios
        limite = int(request.GET.get('limite', 10))
        
        # Obtener TODOS los cambios, incluyendo de eventos eliminados
        cambios = ActividadCambio.objects.select_related(
            'actividad', 'responsable'
        ).order_by('-fecha_cambio')[:limite]
        
        cambios_data = []
        for cambio in cambios:
            try:
                # Verificar que la actividad y responsable existen
                if not cambio.actividad:
                    continue
                
                # Determinar si el evento está eliminado
                evento_eliminado = cambio.actividad.eliminado_en is not None
                    
                # Convertir a la zona horaria local (Guatemala)
                from django.utils.timezone import localtime, is_aware, make_aware
                import pytz
                
                # Si la fecha no tiene timezone, agregarla (asumiendo UTC)
                if not is_aware(cambio.fecha_cambio):
                    fecha_aware = make_aware(cambio.fecha_cambio, pytz.UTC)
                else:
                    fecha_aware = cambio.fecha_cambio
                
                # Ahora convertir a hora local de Guatemala
                fecha_local = localtime(fecha_aware)
                
                cambios_data.append({
                    'id': str(cambio.id),
                    'actividad_id': str(cambio.actividad.id),
                    'actividad_nombre': cambio.actividad.nombre,
                    'responsable': (cambio.responsable.nombre if cambio.responsable.nombre else cambio.responsable.username) if cambio.responsable else 'Sistema',
                    'descripcion': cambio.descripcion_cambio,
                    'fecha': fecha_local.strftime('%d/%m/%Y %H:%M'),
                    'evento_eliminado': evento_eliminado
                })
            except Exception as item_error:
                # Si hay error con un cambio específico, lo saltamos y continuamos
                print(f"⚠️ Error procesando cambio {cambio.id}: {item_error}")
                continue
        
        return JsonResponse({
            'success': True,
            'cambios': cambios_data,
            'total': len(cambios_data)
        })
        
    except Exception as e:
        # Log del error para debugging
        print(f"❌ Error en api_cambios_recientes: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return JsonResponse({
            'success': False,
            'error': f'Error al obtener cambios: {str(e)}'
        }, status=500)


@require_http_methods(["POST"])
def api_verificar_admin(request):
    """Verifica las credenciales del administrador antes de permitir acciones críticas"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return JsonResponse({
                'success': False,
                'error': 'Usuario y contraseña son requeridos'
            }, status=400)
        
        # Autenticar el usuario con el backend personalizado de MAGA
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return JsonResponse({
                'success': False,
                'error': 'Credenciales inválidas'
            }, status=401)
        
        # Verificar que es administrador
        # El backend personalizado agrega el atributo 'rol_maga' al objeto user
        rol = getattr(user, 'rol_maga', None)
        
        if rol != 'admin':
            return JsonResponse({
                'success': False,
                'error': 'No tienes permisos de administrador'
            }, status=403)
        
        return JsonResponse({
            'success': True,
            'message': 'Credenciales verificadas correctamente',
            'user': {
                'username': user.username,
                'rol': rol
            }
        })
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Datos inválidos'
        }, status=400)
    except Exception as e:
        print(f"❌ Error en api_verificar_admin: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': f'Error al verificar credenciales: {str(e)}'
        }, status=500)


def _calcular_tiempo_relativo(fecha):
    """Calcula tiempo relativo (ej: 'hace 2 horas')"""
    from django.utils import timezone
    from django.utils.timezone import localtime, is_aware, make_aware
    import pytz
    
    # Asegurar que la fecha tenga zona horaria
    if not is_aware(fecha):
        # Si la fecha no tiene timezone, asumir que es UTC
        fecha = make_aware(fecha, pytz.UTC)
    
    ahora = timezone.now()
    diferencia = ahora - fecha
    
    segundos = diferencia.total_seconds()
    
    # Manejar fechas futuras
    if segundos < 0:
        return 'recién creado'
    
    if segundos < 60:
        return 'hace unos segundos'
    elif segundos < 3600:
        minutos = int(segundos / 60)
        return f'hace {minutos} minuto{"s" if minutos != 1 else ""}'
    elif segundos < 86400:
        horas = int(segundos / 3600)
        return f'hace {horas} hora{"s" if horas != 1 else ""}'
    elif segundos < 604800:
        dias = int(segundos / 86400)
        return f'hace {dias} día{"s" if dias != 1 else ""}'
    else:
        # Convertir a zona horaria local antes de formatear
        fecha_local = localtime(fecha)
        return fecha_local.strftime('%d/%m/%Y %H:%M')


@permiso_gestionar_eventos
@require_http_methods(["DELETE"])
def api_eliminar_evento(request, evento_id):
    """Elimina un evento (soft delete)"""
    try:
        evento = Actividad.objects.get(id=evento_id, eliminado_en__isnull=True)
        usuario_maga = get_usuario_maga(request.user)
        
        # Soft delete - Marca el evento como eliminado con timestamp timezone-aware
        evento.eliminado_en = timezone.now()
        evento.save()
        
        # Registrar el cambio
        ActividadCambio.objects.create(
            actividad=evento,
            responsable=usuario_maga,
            descripcion_cambio=f'Evento "{evento.nombre}" eliminado por {usuario_maga.username}'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Evento eliminado exitosamente'
        })
        
    except Actividad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Evento no encontrado'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al eliminar evento: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_listar_proyectos_por_tipo(request, tipo_actividad):
    """
    Lista proyectos/eventos filtrados por tipo de actividad (ej: Capacitación, Entrega, etc.)
    Devuelve información completa incluyendo imagen principal (primera evidencia)
    """
    try:
        from django.utils.timezone import localtime, is_aware, make_aware
        import pytz
        
        # Normalizar el tipo de actividad para la búsqueda
        tipo_map = {
            'capacitaciones': 'Capacitación',
            'entregas': 'Entrega',
            'proyectos-ayuda': 'Proyecto de Ayuda'
        }
        
        tipo_nombre = tipo_map.get(tipo_actividad.lower())
        if not tipo_nombre:
            return JsonResponse({
                'success': False,
                'error': f'Tipo de actividad no válido: {tipo_actividad}'
            }, status=400)
        
        # Buscar eventos de ese tipo que no estén eliminados
        eventos = Actividad.objects.filter(
            tipo__nombre=tipo_nombre,
            eliminado_en__isnull=True
        ).select_related(
            'tipo', 'comunidad', 'comunidad__region', 'responsable'
        ).prefetch_related(
            'personal__usuario',
            'beneficiarios__beneficiario',
            'evidencias'
        ).order_by('-actualizado_en')
        
        proyectos_data = []
        for evento in eventos:
            try:
                # Obtener la primera evidencia como imagen principal
                primera_evidencia = evento.evidencias.filter(es_imagen=True).first()
                imagen_url = None
                if primera_evidencia and primera_evidencia.url_almacenamiento:
                    try:
                        imagen_url = primera_evidencia.url_almacenamiento
                    except:
                        imagen_url = None
                
                # Convertir fechas a zona horaria local
                try:
                    if evento.creado_en:
                        if not is_aware(evento.creado_en):
                            creado_en_aware = make_aware(evento.creado_en, pytz.UTC)
                        else:
                            creado_en_aware = evento.creado_en
                        creado_en_local = localtime(creado_en_aware)
                    else:
                        creado_en_local = None
                except:
                    creado_en_local = None
                
                try:
                    if evento.actualizado_en:
                        if not is_aware(evento.actualizado_en):
                            actualizado_en_aware = make_aware(evento.actualizado_en, pytz.UTC)
                        else:
                            actualizado_en_aware = evento.actualizado_en
                        actualizado_en_local = localtime(actualizado_en_aware)
                    else:
                        actualizado_en_local = None
                except:
                    actualizado_en_local = None
                
                # Obtener nombres del personal
                try:
                    personal_nombres = [
                        ap.usuario.nombre if ap.usuario.nombre else ap.usuario.username 
                        for ap in evento.personal.all()[:3]
                    ]
                    personal_count = evento.personal.count()
                    if personal_count > 3:
                        personal_nombres.append(f'+{personal_count - 3} más')
                except:
                    personal_nombres = []
                    personal_count = 0
                
                # Construir ubicación de forma segura
                ubicacion = 'Sin ubicación'
                region_nombre = None
                if evento.comunidad:
                    if evento.comunidad.region:
                        ubicacion = f"{evento.comunidad.nombre}, {evento.comunidad.region.nombre}"
                        region_nombre = evento.comunidad.region.nombre
                    else:
                        ubicacion = evento.comunidad.nombre
                
                proyectos_data.append({
                    'id': str(evento.id),
                    'nombre': evento.nombre or 'Sin nombre',
                    'tipo': evento.tipo.nombre if evento.tipo else 'Sin tipo',
                    'comunidad': evento.comunidad.nombre if evento.comunidad else 'Sin comunidad',
                    'region': region_nombre,
                    'ubicacion': ubicacion,
                    'fecha': str(evento.fecha) if evento.fecha else '',
                    'estado': evento.estado or 'planificado',
                    'estado_display': evento.get_estado_display() if hasattr(evento, 'get_estado_display') else evento.estado,
                    'descripcion': evento.descripcion or '',
                    'imagen_principal': imagen_url,
                    'personal_count': personal_count,
                    'personal_nombres': ', '.join(personal_nombres) if personal_nombres else 'Sin personal',
                    'beneficiarios_count': evento.beneficiarios.count() if hasattr(evento, 'beneficiarios') else 0,
                    'evidencias_count': evento.evidencias.count() if hasattr(evento, 'evidencias') else 0,
                    'creado_en': creado_en_local.strftime('%Y-%m-%d') if creado_en_local else '',
                    'actualizado_en': actualizado_en_local.strftime('%Y-%m-%d') if actualizado_en_local else '',
                    'creado_en_formatted': creado_en_local.strftime('%d de %B de %Y') if creado_en_local else '',
                    'actualizado_en_formatted': actualizado_en_local.strftime('%d de %B de %Y') if actualizado_en_local else ''
                })
            except Exception as item_error:
                # Si hay error con un evento específico, continuar con el siguiente
                print(f"Error procesando evento {evento.id}: {item_error}")
                import traceback
                traceback.print_exc()
                continue
        
        return JsonResponse({
            'success': True,
            'tipo': tipo_nombre,
            'proyectos': proyectos_data,
            'total': len(proyectos_data)
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': f'Error al listar proyectos: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_ultimos_proyectos(request):
    """
    Devuelve los últimos proyectos/eventos creados o actualizados (máximo 2)
    """
    try:
        from django.utils.timezone import localtime, is_aware, make_aware
        import pytz
        
        # Obtener los últimos 2 eventos actualizados
        eventos = Actividad.objects.filter(
            eliminado_en__isnull=True
        ).select_related(
            'tipo', 'comunidad', 'comunidad__region', 'responsable'
        ).prefetch_related(
            'personal__usuario',
            'beneficiarios__beneficiario',
            'evidencias'
        ).order_by('-actualizado_en')[:2]
        
        proyectos_data = []
        for evento in eventos:
            try:
                # Obtener la primera evidencia como imagen principal
                primera_evidencia = evento.evidencias.filter(es_imagen=True).first()
                imagen_url = None
                if primera_evidencia and primera_evidencia.url_almacenamiento:
                    try:
                        imagen_url = primera_evidencia.url_almacenamiento
                    except:
                        imagen_url = None
                
                # Convertir fecha a zona horaria local
                try:
                    if evento.fecha:
                        fecha_obj = evento.fecha
                    elif evento.actualizado_en:
                        fecha_obj = evento.actualizado_en.date() if hasattr(evento.actualizado_en, 'date') else evento.actualizado_en
                    else:
                        fecha_obj = evento.creado_en.date() if hasattr(evento.creado_en, 'date') else evento.creado_en
                except:
                    fecha_obj = None
                
                # Construir ubicación de forma segura
                ubicacion = 'Sin ubicación'
                if evento.comunidad:
                    if evento.comunidad.region:
                        ubicacion = f"{evento.comunidad.nombre}, {evento.comunidad.region.nombre}"
                    else:
                        ubicacion = evento.comunidad.nombre
                
                # Obtener conteo de personal
                try:
                    personal_count = evento.personal.count()
                    personal_nombres = [
                        ap.usuario.nombre if ap.usuario.nombre else ap.usuario.username 
                        for ap in evento.personal.all()[:3]
                    ]
                    if personal_count > 3:
                        personal_nombres.append(f'+{personal_count - 3} más')
                except:
                    personal_count = 0
                    personal_nombres = []
                
                proyectos_data.append({
                    'id': str(evento.id),
                    'nombre': evento.nombre or 'Sin nombre',
                    'tipo': evento.tipo.nombre if evento.tipo else 'Sin tipo',
                    'ubicacion': ubicacion,
                    'fecha': str(fecha_obj) if fecha_obj else '',
                    'estado': evento.estado or 'planificado',
                    'descripcion': evento.descripcion or '',
                    'imagen_principal': imagen_url,
                    'personal_count': personal_count,
                    'personal_nombres': ', '.join(personal_nombres) if personal_nombres else 'Sin personal',
                })
            except Exception as item_error:
                print(f"Error procesando evento para últimos proyectos {evento.id}: {item_error}")
                import traceback
                traceback.print_exc()
                continue
        
        return JsonResponse({
            'success': True,
            'proyectos': proyectos_data,
            'total': len(proyectos_data)
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': f'Error al obtener últimos proyectos: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_ultimos_eventos_inicio(request):
    """
    Devuelve los últimos 6 eventos para mostrar en el inicio
    """
    try:
        from django.utils.timezone import localtime, is_aware, make_aware
        import pytz
        
        # Obtener los últimos 6 eventos no eliminados
        eventos = Actividad.objects.filter(
            eliminado_en__isnull=True
        ).select_related(
            'tipo', 'comunidad', 'comunidad__region', 'responsable'
        ).prefetch_related(
            'evidencias'
        ).order_by('-creado_en')[:6]
        
        eventos_data = []
        for evento in eventos:
            try:
                # Obtener la primera evidencia como imagen
                primera_evidencia = evento.evidencias.filter(es_imagen=True).first()
                imagen_url = None
                if primera_evidencia and primera_evidencia.url_almacenamiento:
                    imagen_url = primera_evidencia.url_almacenamiento
                
                # Si no hay evidencias, usar imagen por defecto
                if not imagen_url:
                    imagen_url = '/static/img/default-event.jpg'
                
                # Convertir fecha a zona horaria local
                try:
                    if evento.fecha:
                        fecha_obj = evento.fecha
                    elif evento.creado_en:
                        if not is_aware(evento.creado_en):
                            creado_aware = make_aware(evento.creado_en, pytz.UTC)
                        else:
                            creado_aware = evento.creado_en
                        fecha_local = localtime(creado_aware)
                        fecha_obj = fecha_local.date()
                    else:
                        fecha_obj = None
                except:
                    fecha_obj = None
                
                # Formatear fecha
                if fecha_obj:
                    meses = {
                        1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr', 5: 'May', 6: 'Jun',
                        7: 'Jul', 8: 'Ago', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic'
                    }
                    mes = meses.get(fecha_obj.month, '')
                    dia = fecha_obj.day
                    anio = fecha_obj.year
                else:
                    mes = ''
                    dia = ''
                    anio = ''
                
                eventos_data.append({
                    'id': str(evento.id),
                    'nombre': evento.nombre or 'Sin nombre',
                    'descripcion': evento.descripcion[:100] + '...' if evento.descripcion and len(evento.descripcion) > 100 else (evento.descripcion or 'Sin descripción'),
                    'imagen_url': imagen_url,
                    'fecha_mes': mes,
                    'fecha_dia': dia,
                    'fecha_anio': anio,
                    'tipo': evento.tipo.nombre if evento.tipo else 'Sin tipo',
                    'comunidad': evento.comunidad.nombre if evento.comunidad else 'Sin comunidad'
                })
            except Exception as item_error:
                print(f"Error procesando evento para inicio {evento.id}: {item_error}")
                import traceback
                traceback.print_exc()
                continue
        
        return JsonResponse({
            'success': True,
            'eventos': eventos_data,
            'total': len(eventos_data)
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': f'Error al obtener últimos eventos: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_obtener_detalle_proyecto(request, evento_id):
    """
    Obtiene los detalles completos de un proyecto/evento específico
    """
    try:
        from django.utils.timezone import localtime, is_aware, make_aware
        import pytz
        
        evento = Actividad.objects.select_related(
            'tipo', 'comunidad', 'comunidad__region', 'responsable'
        ).prefetch_related(
            'personal__usuario__puesto',
            'beneficiarios__beneficiario__individual',
            'beneficiarios__beneficiario__familia',
            'beneficiarios__beneficiario__institucion',
            'evidencias'
        ).get(id=evento_id, eliminado_en__isnull=True)
        
        # Personal asignado
        personal_data = []
        for ap in evento.personal.all():
            personal_data.append({
                'id': str(ap.usuario.id),
                'username': ap.usuario.username,
                'nombre': ap.usuario.nombre or ap.usuario.username,
                'rol': ap.rol_en_actividad,
                'rol_display': ap.usuario.get_rol_display() if hasattr(ap.usuario, 'get_rol_display') else ap.usuario.rol,
                'puesto': ap.usuario.puesto.nombre if ap.usuario.puesto else 'Sin puesto'
            })
        
        # Beneficiarios
        beneficiarios_data = []
        for ab in evento.beneficiarios.all():
            benef = ab.beneficiario
            nombre_display = ''
            tipo_beneficiario = str(benef.tipo) if benef.tipo else 'individual'
            
            if benef.tipo == 'individual' and hasattr(benef, 'individual') and benef.individual:
                nombre_display = f"{benef.individual.nombre} {benef.individual.apellido}"
            elif benef.tipo == 'familia' and hasattr(benef, 'familia') and benef.familia:
                nombre_display = f"Familia {benef.familia.apellido_familia}"
            elif benef.tipo == 'institución' and hasattr(benef, 'institucion') and benef.institucion:
                nombre_display = benef.institucion.nombre
            
            beneficiarios_data.append({
                'id': str(benef.id),
                'tipo': tipo_beneficiario,
                'nombre': nombre_display or 'Sin nombre',
                'descripcion': ''  # Sin campo de descripción en el modelo
            })
        
        # Evidencias/Galería
        evidencias_data = []
        for evidencia in evento.evidencias.all():
            evidencias_data.append({
                'id': str(evidencia.id),
                'nombre': evidencia.archivo_nombre,
                'url': evidencia.url_almacenamiento,
                'tipo': evidencia.archivo_tipo or '',
                'es_imagen': evidencia.es_imagen,
                'descripcion': evidencia.descripcion or ''
            })
        
        # Ubicación
        ubicacion = 'Sin ubicación'
        if evento.comunidad:
            if evento.comunidad.region:
                ubicacion = f"{evento.comunidad.nombre}, {evento.comunidad.region.nombre}"
            else:
                ubicacion = evento.comunidad.nombre
        
        # Convertir fechas
        try:
            if evento.fecha:
                fecha_str = evento.fecha.strftime('%Y-%m-%d')
                fecha_display = evento.fecha.strftime('%d de %B de %Y')
            else:
                fecha_str = ''
                fecha_display = ''
        except:
            fecha_str = ''
            fecha_display = ''
        
        proyecto_data = {
            'id': str(evento.id),
            'nombre': evento.nombre,
            'tipo': evento.tipo.nombre if evento.tipo else 'Sin tipo',
            'descripcion': evento.descripcion or 'Sin descripción',
            'ubicacion': ubicacion,
            'comunidad': evento.comunidad.nombre if evento.comunidad else 'Sin comunidad',
            'region': evento.comunidad.region.nombre if evento.comunidad and evento.comunidad.region else None,
            'fecha': fecha_str,
            'fecha_display': fecha_display,
            'estado': evento.estado,
            'estado_display': evento.get_estado_display() if hasattr(evento, 'get_estado_display') else evento.estado,
            'responsable': (evento.responsable.nombre if evento.responsable.nombre else evento.responsable.username) if evento.responsable else 'Sin responsable',
            'personal': personal_data,
            'beneficiarios': beneficiarios_data,
            'evidencias': evidencias_data
        }
        
        return JsonResponse({
            'success': True,
            'proyecto': proyecto_data
        })
        
    except Actividad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Proyecto no encontrado'
        }, status=404)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': f'Error al obtener proyecto: {str(e)}'
        }, status=500)