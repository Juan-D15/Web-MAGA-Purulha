from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.db import connection
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
    Colaborador,
    ActividadBeneficiario, ActividadComunidad, ActividadPortada, TarjetaDato, Evidencia, ActividadCambio
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
# Funciones utilitarias internas
# =====================================================

def obtener_detalle_beneficiario(beneficiario):
    """Devuelve nombre para mostrar, info adicional, detalles y tipo efectivo del beneficiario."""
    nombre_display = ''
    info_adicional = ''
    detalles = {}
    tipo_envio = beneficiario.tipo.nombre if beneficiario.tipo else ''

    if hasattr(beneficiario, 'individual'):
        ind = beneficiario.individual
        nombre_display = f"{ind.nombre} {ind.apellido}".strip()
        info_adicional = ind.dpi or ''
        detalles = {
            'nombre': ind.nombre,
            'apellido': ind.apellido,
            'dpi': ind.dpi or '',
            'fecha_nacimiento': str(ind.fecha_nacimiento) if ind.fecha_nacimiento else '',
            'genero': ind.genero or '',
            'telefono': ind.telefono or '',
            'display_name': nombre_display
        }
    elif hasattr(beneficiario, 'familia'):
        fam = beneficiario.familia
        nombre_display = fam.nombre_familia
        info_adicional = f"Jefe: {fam.jefe_familia}" if fam.jefe_familia else ''
        detalles = {
            'nombre_familia': fam.nombre_familia,
            'jefe_familia': fam.jefe_familia,
            'dpi_jefe_familia': fam.dpi_jefe_familia or '',
            'telefono': fam.telefono or '',
            'numero_miembros': fam.numero_miembros or '',
            'display_name': nombre_display
        }
    elif hasattr(beneficiario, 'institucion'):
        inst = beneficiario.institucion
        nombre_display = inst.nombre_institucion
        info_adicional = inst.tipo_institucion or ''
        if (beneficiario.tipo and beneficiario.tipo.nombre.lower() == 'otro') or (inst.tipo_institucion or '').lower() == 'otro':
            tipo_envio = 'otro'
            detalles = {
                'nombre': inst.nombre_institucion,
                'tipo_descripcion': inst.email or inst.tipo_institucion,
                'contacto': inst.representante_legal or '',
                'telefono': inst.telefono or '',
                'descripcion': '',
                'display_name': nombre_display
            }
        else:
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
    else:
        nombre_display = f"Beneficiario {beneficiario.id}"

    comunidad = beneficiario.comunidad
    detalles['comunidad_id'] = str(comunidad.id) if comunidad else None
    detalles['comunidad_nombre'] = comunidad.nombre if comunidad else None
    detalles['region_id'] = str(comunidad.region_id) if comunidad and comunidad.region_id else None
    detalles['region_nombre'] = comunidad.region.nombre if comunidad and comunidad.region else None
    detalles['region_sede'] = comunidad.region.comunidad_sede if comunidad and comunidad.region and comunidad.region.comunidad_sede else None

    return nombre_display, info_adicional, detalles, tipo_envio


def aplicar_modificaciones_beneficiarios(beneficiarios_modificados):
    """Actualiza registros existentes de beneficiarios y devuelve la cantidad de cambios aplicados."""
    cambios_aplicados = 0

    for benef_data in beneficiarios_modificados:
        benef_id = benef_data.get('id')
        if not benef_id:
            continue

        try:
            beneficiario = Beneficiario.objects.get(id=benef_id)
        except Beneficiario.DoesNotExist:
            print(f"⚠️ Beneficiario {benef_id} no encontrado")
            continue

        tipo = benef_data.get('tipo')
        try:
            if tipo == 'individual':
                benef_ind = BeneficiarioIndividual.objects.get(beneficiario=beneficiario)
                benef_ind.nombre = benef_data.get('nombre', benef_ind.nombre)
                benef_ind.apellido = benef_data.get('apellido', benef_ind.apellido)
                benef_ind.dpi = benef_data.get('dpi')
                benef_ind.fecha_nacimiento = benef_data.get('fecha_nacimiento')
                benef_ind.genero = benef_data.get('genero')
                benef_ind.telefono = benef_data.get('telefono')
                benef_ind.save()
                cambios_aplicados += 1
                print(f"✅ Beneficiario individual actualizado: {benef_ind.nombre} {benef_ind.apellido}")

            elif tipo == 'familia':
                benef_fam = BeneficiarioFamilia.objects.get(beneficiario=beneficiario)
                benef_fam.nombre_familia = benef_data.get('nombre_familia', benef_fam.nombre_familia)
                benef_fam.jefe_familia = benef_data.get('jefe_familia', benef_fam.jefe_familia)
                benef_fam.dpi_jefe_familia = benef_data.get('dpi_jefe_familia')
                benef_fam.telefono = benef_data.get('telefono')
                benef_fam.numero_miembros = benef_data.get('numero_miembros')
                benef_fam.save()
                cambios_aplicados += 1
                print(f"✅ Beneficiario familia actualizado: {benef_fam.nombre_familia}")

            elif tipo in ('institucion', 'institución'):
                benef_inst = BeneficiarioInstitucion.objects.get(beneficiario=beneficiario)
                benef_inst.nombre_institucion = benef_data.get('nombre_institucion', benef_inst.nombre_institucion)
                benef_inst.tipo_institucion = benef_data.get('tipo_institucion', benef_inst.tipo_institucion)
                benef_inst.representante_legal = benef_data.get('representante_legal')
                benef_inst.dpi_representante = benef_data.get('dpi_representante')
                benef_inst.telefono = benef_data.get('telefono')
                benef_inst.email = benef_data.get('email')
                benef_inst.numero_beneficiarios_directos = benef_data.get('numero_beneficiarios_directos')
                benef_inst.save()
                cambios_aplicados += 1
                print(f"✅ Beneficiario institución actualizado: {benef_inst.nombre_institucion}")

            elif tipo == 'otro':
                benef_inst = BeneficiarioInstitucion.objects.get(beneficiario=beneficiario)
                benef_inst.nombre_institucion = benef_data.get('nombre', benef_inst.nombre_institucion)
                benef_inst.tipo_institucion = 'otro'
                benef_inst.representante_legal = benef_data.get('contacto')
                benef_inst.telefono = benef_data.get('telefono')
                benef_inst.email = benef_data.get('tipo_descripcion')
                benef_inst.save()
                cambios_aplicados += 1
                print(f"✅ Beneficiario tipo 'otro' actualizado: {benef_inst.nombre_institucion}")

        except (BeneficiarioIndividual.DoesNotExist, BeneficiarioFamilia.DoesNotExist, BeneficiarioInstitucion.DoesNotExist):
            print(f"⚠️ No se encontró el registro específico para el beneficiario {benef_id}")
            continue

        comunidad_id_nueva = benef_data.get('comunidad_id')
        if comunidad_id_nueva and str(beneficiario.comunidad_id) != str(comunidad_id_nueva):
            beneficiario.comunidad_id = comunidad_id_nueva
            beneficiario.save(update_fields=['comunidad'])
            cambios_aplicados += 1

    return cambios_aplicados


def obtener_comunidades_evento(evento):
    """Devuelve un listado de comunidades asociadas a la actividad con información de región."""
    comunidades_detalle = []

    relaciones = []
    if hasattr(evento, 'comunidades_relacionadas'):
        relaciones = evento.comunidades_relacionadas.all()

    for relacion in relaciones:
        comunidad = relacion.comunidad
        region = relacion.region or (comunidad.region if comunidad and comunidad.region else None)
        comunidades_detalle.append({
            'comunidad_id': str(comunidad.id) if comunidad else None,
            'comunidad_nombre': comunidad.nombre if comunidad else None,
            'region_id': str(region.id) if region else None,
            'region_nombre': region.nombre if region else None,
            'region_sede': region.comunidad_sede if getattr(region, 'comunidad_sede', None) else None
        })

    if not comunidades_detalle and evento.comunidad:
        region = evento.comunidad.region
        comunidades_detalle.append({
            'comunidad_id': str(evento.comunidad.id),
            'comunidad_nombre': evento.comunidad.nombre,
            'region_id': str(region.id) if region else None,
            'region_nombre': region.nombre if region else None,
            'region_sede': region.comunidad_sede if region else None
        })

    return comunidades_detalle


def obtener_tarjetas_datos(evento):
    tarjetas = []
    qs = TarjetaDato.objects.filter(entidad_tipo='actividad', entidad_id=evento.id).order_by('orden', 'creado_en')
    for tarjeta in qs:
        tarjetas.append({
            'id': str(tarjeta.id),
            'titulo': tarjeta.titulo,
            'valor': tarjeta.valor,
            'icono': tarjeta.icono,
            'orden': tarjeta.orden,
            'es_favorita': tarjeta.es_favorita
        })
    return tarjetas


def obtener_portada_evento(evento):
    """Devuelve la información de la portada del evento, si existe."""
    portada = getattr(evento, 'portada', None)
    if not portada:
        return None
    return {
        'id': str(portada.id),
        'nombre': portada.archivo_nombre,
        'tipo': portada.archivo_tipo or '',
        'url': portada.url_almacenamiento
    }


def eliminar_portada_evento(portada_inst):
    """Elimina la portada asociada al evento, incluyendo el archivo físico."""
    try:
        portada = ActividadPortada.objects.get(actividad=portada_inst)
    except ActividadPortada.DoesNotExist:
        return False

    archivo_path = os.path.join(settings.MEDIA_ROOT, portada.url_almacenamiento.lstrip('/media/'))
    if os.path.exists(archivo_path):
        try:
            os.remove(archivo_path)
        except Exception as e:
            print(f"⚠️ No se pudo eliminar el archivo de portada: {e}")

    portada.delete()
    return True


def obtener_url_portada_o_evidencia(evento):
    """Retorna la URL de la portada si existe; de lo contrario, la primera evidencia de imagen."""
    portada = obtener_portada_evento(evento)
    if portada and portada.get('url'):
        return portada['url']

    if hasattr(evento, 'evidencias'):
        evidencia = evento.evidencias.filter(es_imagen=True).first()
        if evidencia and evidencia.url_almacenamiento:
            return evidencia.url_almacenamiento
    return None


def guardar_portada_evento(actividad, archivo):
    if not archivo:
        return None

    content_type = getattr(archivo, 'content_type', '') or ''
    if not content_type.startswith('image/'):
        raise ValueError('El archivo de portada debe ser una imagen')

    fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'eventos_portada_img'))
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S%f')
    extension = os.path.splitext(archivo.name)[1]
    filename = f"{timestamp}{extension}"
    saved_name = fs.save(filename, archivo)
    url = f"/media/eventos_portada_img/{saved_name}"

    portada, _ = ActividadPortada.objects.update_or_create(
        actividad=actividad,
        defaults={
            'archivo_nombre': archivo.name,
            'archivo_tipo': content_type,
            'url_almacenamiento': url
        }
    )
    return portada


def eliminar_portada_evento(portada_inst):
    if not portada_inst:
        return

    try:
        file_path = os.path.join(settings.MEDIA_ROOT, portada_inst.url_almacenamiento.lstrip('/media/'))
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as error:
        print(f"⚠️ No se pudo eliminar el archivo de portada: {error}")

    portada_inst.delete()

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
        campos_requeridos = ['nombre', 'tipo_actividad_id', 'fecha', 'descripcion']
        for campo in campos_requeridos:
            if not data.get(campo):
                return JsonResponse({
                    'success': False,
                    'error': f'El campo {campo} es requerido'
                }, status=400)
        
        # Comunidades seleccionadas (principal + adicionales)
        comunidades_payload = []
        if data.get('comunidades_seleccionadas'):
            try:
                comunidades_payload = json.loads(data['comunidades_seleccionadas'])
            except (json.JSONDecodeError, ValueError):
                comunidades_payload = []

        comunidad_principal_id = data.get('comunidad_id')
        if not comunidad_principal_id and comunidades_payload:
            comunidad_principal_id = comunidades_payload[0].get('comunidad_id')

        portada_eliminar_flag = data.get('portada_eliminar') == 'true'

        if not comunidad_principal_id:
            return JsonResponse({
                'success': False,
                'error': 'Debe seleccionar al menos una comunidad asociada al evento'
            }, status=400)
        
        # Usar transacción para asegurar integridad de datos
        with transaction.atomic():
            # 1. Crear la actividad
            actividad = Actividad.objects.create(
                nombre=data['nombre'],
                tipo_id=data['tipo_actividad_id'],
                comunidad_id=comunidad_principal_id,
                responsable=usuario_maga,
                fecha=data['fecha'],
                descripcion=data['descripcion'],
                estado=data.get('estado', 'planificado')
            )
            
            # 2. Asignar personal
            if data.get('personal_ids'):
                try:
                    personal_raw = json.loads(data['personal_ids'])
                except (json.JSONDecodeError, ValueError):
                    personal_raw = []

                for item in personal_raw:
                    if isinstance(item, dict):
                        obj_id = item.get('id')
                        tipo = item.get('tipo', 'colaborador')
                        rol = item.get('rol', 'Colaborador')
                    else:
                        obj_id = item
                        tipo = 'colaborador'
                        rol = 'Colaborador'

                    if not obj_id:
                        continue

                    if tipo == 'usuario':
                        ActividadPersonal.objects.create(
                            actividad=actividad,
                            usuario_id=obj_id,
                            rol_en_actividad=rol
                        )
                    else:
                        colaborador = Colaborador.objects.filter(id=obj_id, activo=True).select_related('usuario').first()
                        if colaborador:
                            ActividadPersonal.objects.create(
                                actividad=actividad,
                                colaborador=colaborador,
                                usuario=colaborador.usuario if colaborador.usuario else None,
                                rol_en_actividad=rol
                            )
            
            # 3. Asociar comunidades seleccionadas (principal + adicionales)
            comunidades_a_registrar = comunidades_payload.copy()
            if comunidad_principal_id and not any(item.get('comunidad_id') == comunidad_principal_id for item in comunidades_a_registrar):
                comunidades_a_registrar.insert(0, {'comunidad_id': comunidad_principal_id})

            if comunidades_a_registrar:
                comunidades_ids = [item.get('comunidad_id') for item in comunidades_a_registrar if item.get('comunidad_id')]
                comunidades_map = {
                    str(com.id): com for com in Comunidad.objects.filter(id__in=comunidades_ids).select_related('region')
                }

                for item in comunidades_a_registrar:
                    comunidad_id = item.get('comunidad_id')
                    if not comunidad_id:
                        continue

                    comunidad_obj = comunidades_map.get(str(comunidad_id))
                    if comunidad_obj is None:
                        raise Comunidad.DoesNotExist(f'Comunidad no válida: {comunidad_id}')

                    region_id = item.get('region_id')
                    if not region_id and comunidad_obj.region_id:
                        region_id = comunidad_obj.region_id

                    ActividadComunidad.objects.get_or_create(
                        actividad=actividad,
                        comunidad=comunidad_obj,
                        defaults={'region_id': region_id}
                    )

            tarjetas_creadas = []
            if data.get('tarjetas_datos_nuevas'):
                try:
                    tarjetas_payload = json.loads(data['tarjetas_datos_nuevas'])
                except json.JSONDecodeError:
                    tarjetas_payload = []

                for idx, tarjeta in enumerate(tarjetas_payload):
                    titulo = tarjeta.get('titulo')
                    valor = tarjeta.get('valor')
                    icono = tarjeta.get('icono')
                    if not titulo or not valor:
                        continue
                    tarjeta_inst = TarjetaDato.objects.create(
                        entidad_tipo='actividad',
                        entidad_id=actividad.id,
                        titulo=titulo,
                        valor=valor,
                        icono=icono,
                        orden=idx
                    )
                    tarjetas_creadas.append({
                        'id': str(tarjeta_inst.id),
                        'titulo': tarjeta_inst.titulo,
                        'valor': tarjeta_inst.valor,
                        'icono': tarjeta_inst.icono,
                        'orden': tarjeta_inst.orden
                    })

            # 4. Crear y asignar beneficiarios nuevos
            if data.get('beneficiarios_nuevos'):
                try:
                    beneficiarios_nuevos = json.loads(data['beneficiarios_nuevos'])
                    print(f"📋 Beneficiarios nuevos a crear: {len(beneficiarios_nuevos)}")
                    
                    for benef_data in beneficiarios_nuevos:
                        tipo = benef_data.get('tipo')
                        print(f"🔍 Procesando beneficiario tipo: {tipo}")
                        print(f"🔍 Datos completos: {benef_data}")
                        comunidad_id = benef_data.get('comunidad_id') or data.get('comunidad_id')
                        
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

            # 3b. Asociar beneficiarios existentes seleccionados
            if data.get('beneficiarios_existentes'):
                try:
                    beneficiarios_existentes_ids = json.loads(data['beneficiarios_existentes'])
                    asociados = 0
                    for benef_id in beneficiarios_existentes_ids:
                        if not benef_id:
                            continue
                        beneficiario = Beneficiario.objects.filter(id=benef_id, activo=True).first()
                        if not beneficiario:
                            continue
                        _, creado_rel = ActividadBeneficiario.objects.get_or_create(
                            actividad=actividad,
                            beneficiario=beneficiario
                        )
                        if creado_rel:
                            asociados += 1
                    if asociados:
                        print(f"✅ Asociados {asociados} beneficiarios existentes al evento")
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error al asociar beneficiarios existentes: {e}")
                    pass

            # 3c. Aplicar modificaciones a beneficiarios existentes (si se editaron desde el formulario)
            if data.get('beneficiarios_modificados'):
                try:
                    beneficiarios_modificados = json.loads(data['beneficiarios_modificados'])
                    cambios_aplicados = aplicar_modificaciones_beneficiarios(beneficiarios_modificados)
                    if cambios_aplicados:
                        print(f"✏️ Beneficiarios existentes actualizados: {cambios_aplicados}")
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error al actualizar beneficiarios: {e}")
                    pass
            
            # 5. Guardar evidencias (archivos/imágenes)
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
            
            # 6. Guardar imagen de portada (si se envió)
            portada_info = None
            portada_file = request.FILES.get('portada_evento')
            if portada_file:
                try:
                    portada_inst = guardar_portada_evento(actividad, portada_file)
                    portada_info = obtener_portada_evento(portada_inst.actividad)
                except ValueError as portada_error:
                    raise ValueError(str(portada_error))
            else:
                portada_info = obtener_portada_evento(actividad)
            
            # 6. Registrar cambio/creación
            ActividadCambio.objects.create(
                actividad=actividad,
                responsable=usuario_maga,
                descripcion_cambio=f'Evento "{actividad.nombre}" creado por {usuario_maga.username}'
            )
            
            # Respuesta exitosa
            comunidades_evento = obtener_comunidades_evento(actividad)
            comunidad_principal_nombre = comunidades_evento[0]['comunidad_nombre'] if comunidades_evento else (actividad.comunidad.nombre if actividad.comunidad else None)
            
            return JsonResponse({
                'success': True,
                'message': 'Evento creado exitosamente',
                'actividad': {
                    'id': str(actividad.id),
                    'nombre': actividad.nombre,
                    'tipo': actividad.tipo.nombre,
                    'fecha': str(actividad.fecha),
                    'comunidad': comunidad_principal_nombre,
                    'comunidades': comunidades_evento,
                    'estado': actividad.estado,
                    'portada': portada_info,
                    'tarjetas_datos': tarjetas_creadas or obtener_tarjetas_datos(actividad)
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
    """API: Listar colaboradores disponibles para asignar a eventos"""

    colaboradores = (
        Colaborador.objects.filter(activo=True)
        .select_related('puesto', 'usuario')
        .order_by('nombre')
    )

    personal_list = []
    for colaborador in colaboradores:
        personal_list.append({
            'id': str(colaborador.id),
            'nombre': colaborador.nombre,
            'username': colaborador.usuario.username if colaborador.usuario else '',
            'correo': colaborador.correo,
            'telefono': colaborador.telefono,
            'rol': 'Colaborador',
            'rol_display': 'Personal Fijo' if colaborador.es_personal_fijo else 'Colaborador Externo',
            'puesto': colaborador.puesto.nombre if colaborador.puesto else 'Sin puesto asignado',
            'tipo': 'colaborador',
            'es_personal_fijo': colaborador.es_personal_fijo,
            'usuario_id': str(colaborador.usuario_id) if colaborador.usuario_id else None,
        })

    return JsonResponse(personal_list, safe=False)


@permiso_gestionar_eventos
def api_listar_beneficiarios(request):
    """API: Listar beneficiarios disponibles"""
    search = (request.GET.get('q') or '').strip()

    beneficiarios = Beneficiario.objects.filter(activo=True).select_related(
        'tipo', 'comunidad'
    ).prefetch_related('individual', 'familia', 'institucion')

    if search:
        beneficiarios = beneficiarios.filter(
            Q(individual__nombre__icontains=search) |
            Q(individual__apellido__icontains=search) |
            Q(individual__dpi__icontains=search) |
            Q(familia__nombre_familia__icontains=search) |
            Q(familia__jefe_familia__icontains=search) |
            Q(familia__dpi_jefe_familia__icontains=search) |
            Q(institucion__nombre_institucion__icontains=search) |
            Q(institucion__representante_legal__icontains=search) |
            Q(institucion__tipo_institucion__icontains=search) |
            Q(comunidad__nombre__icontains=search)
        )

    beneficiarios = beneficiarios.order_by('tipo__nombre', 'comunidad__nombre', 'id')[:50]

    beneficiarios_list = []
    for ben in beneficiarios:
        nombre_display, info_adicional, detalles, tipo_envio = obtener_detalle_beneficiario(ben)
        if ben.tipo and hasattr(ben.tipo, 'get_nombre_display'):
            tipo_display = ben.tipo.get_nombre_display()
        else:
            tipo_display = tipo_envio.title() if tipo_envio else ''
        beneficiarios_list.append({
            'id': str(ben.id),
            'nombre': nombre_display,
            'display_name': nombre_display,
            'tipo': tipo_envio,
            'tipo_display': tipo_display,
            'comunidad_id': str(ben.comunidad_id) if ben.comunidad_id else None,
            'comunidad_nombre': ben.comunidad.nombre if ben.comunidad else None,
            'region_id': str(ben.comunidad.region_id) if ben.comunidad and ben.comunidad.region_id else None,
            'region_nombre': ben.comunidad.region.nombre if ben.comunidad and ben.comunidad.region else None,
            'region_sede': ben.comunidad.region.comunidad_sede if ben.comunidad and ben.comunidad.region and ben.comunidad.region.comunidad_sede else None,
            'comunidad': ben.comunidad.nombre if ben.comunidad else None,
            'info_adicional': info_adicional,
            'detalles': detalles
        })

    return JsonResponse(beneficiarios_list, safe=False)


@permiso_gestionar_eventos
@require_http_methods(["GET"])
def api_obtener_beneficiario(request, beneficiario_id):
    """API: Obtener detalles completos de un beneficiario por ID"""
    try:
        beneficiario = Beneficiario.objects.filter(
            id=beneficiario_id, activo=True
        ).select_related(
            'tipo', 'comunidad', 'comunidad__region'
        ).prefetch_related('individual', 'familia', 'institucion').first()
        
        if not beneficiario:
            return JsonResponse({
                'success': False,
                'error': 'Beneficiario no encontrado'
            }, status=404)
        
        nombre_display, info_adicional, detalles, tipo_envio = obtener_detalle_beneficiario(beneficiario)
        
        if beneficiario.tipo and hasattr(beneficiario.tipo, 'get_nombre_display'):
            tipo_display = beneficiario.tipo.get_nombre_display()
        else:
            tipo_display = tipo_envio.title() if tipo_envio else ''
        
        return JsonResponse({
            'success': True,
            'beneficiario': {
                'id': str(beneficiario.id),
                'nombre': nombre_display,
                'display_name': nombre_display,
                'tipo': tipo_envio,
                'tipo_display': tipo_display,
                'comunidad_id': str(beneficiario.comunidad_id) if beneficiario.comunidad_id else None,
                'comunidad_nombre': beneficiario.comunidad.nombre if beneficiario.comunidad else None,
                'region_id': str(beneficiario.comunidad.region_id) if beneficiario.comunidad and beneficiario.comunidad.region_id else None,
                'region_nombre': beneficiario.comunidad.region.nombre if beneficiario.comunidad and beneficiario.comunidad.region else None,
                'region_sede': beneficiario.comunidad.region.comunidad_sede if beneficiario.comunidad and beneficiario.comunidad.region and beneficiario.comunidad.region.comunidad_sede else None,
                'info_adicional': info_adicional,
                'detalles': detalles,
                'creado_en': beneficiario.creado_en.isoformat() if beneficiario.creado_en else None,
                'actualizado_en': beneficiario.actualizado_en.isoformat() if beneficiario.actualizado_en else None
            }
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al obtener beneficiario: {str(e)}'
        }, status=500)


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
            'tipo', 'comunidad', 'comunidad__region', 'responsable', 'colaborador', 'portada'
        ).prefetch_related(
            'personal__usuario__puesto',
            'personal__colaborador',
            'beneficiarios__beneficiario',
            'comunidades_relacionadas__comunidad__region',
            'comunidades_relacionadas__region'
         ).order_by('-creado_en')
        
        eventos_data = []
        for evento in eventos:
            # Contar personal y beneficiarios
            personal_count = evento.personal.count()
            beneficiarios_count = evento.beneficiarios.count()
            
            # Obtener nombres del personal (usar nombre completo o username como fallback)
            personal_nombres = []
            for ap in evento.personal.all()[:3]:
                if ap.usuario:
                    personal_nombres.append(ap.usuario.nombre if ap.usuario.nombre else ap.usuario.username)
                elif ap.colaborador:
                    personal_nombres.append(ap.colaborador.nombre)
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
            
            comunidades_detalle = obtener_comunidades_evento(evento)
            if comunidades_detalle:
                comunidades_resumen = ', '.join([c['comunidad_nombre'] for c in comunidades_detalle if c['comunidad_nombre']])
                comunidad_principal = comunidades_detalle[0]['comunidad_nombre']
            else:
                comunidades_resumen = evento.comunidad.nombre if evento.comunidad else 'Sin comunidades'
                comunidad_principal = evento.comunidad.nombre if evento.comunidad else 'Sin comunidad'
            
            portada_evento = obtener_portada_evento(evento)
             
            eventos_data.append({
                'id': str(evento.id),
                'nombre': evento.nombre,
                'tipo': evento.tipo.nombre if evento.tipo else 'Sin tipo',
                'comunidad': comunidad_principal,
                'comunidades': comunidades_detalle,
                'comunidades_resumen': comunidades_resumen,
                'fecha': str(evento.fecha),
                'estado': evento.estado,
                'descripcion': evento.descripcion[:100] + '...' if len(evento.descripcion) > 100 else evento.descripcion,
                'personal_count': personal_count,
                'personal_nombres': ', '.join(personal_nombres) if personal_nombres else 'Sin personal',
                'beneficiarios_count': beneficiarios_count,
                'responsable': (evento.responsable.nombre if evento.responsable.nombre else evento.responsable.username) if evento.responsable else 'Sin responsable',
                'creado_en': creado_en_local.strftime('%d/%m/%Y %H:%M'),
                'portada': portada_evento
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
            'tipo', 'comunidad', 'responsable', 'colaborador', 'portada'
        ).prefetch_related(
            'personal__usuario__puesto',
            'personal__colaborador__puesto',
            'beneficiarios__beneficiario__individual',
            'beneficiarios__beneficiario__familia',
            'beneficiarios__beneficiario__institucion',
            'evidencias',
            'comunidades_relacionadas__comunidad__region',
            'comunidades_relacionadas__region'
        ).get(id=evento_id, eliminado_en__isnull=True)
        
        # Personal asignado
        personal_data = []
        for ap in evento.personal.all():
            if ap.usuario:
                personal_data.append({
                    'id': str(ap.usuario.id),
                    'username': ap.usuario.username,
                    'nombre': ap.usuario.nombre or '',
                    'rol': ap.rol_en_actividad,
                    'rol_display': ap.usuario.get_rol_display(),
                    'puesto': ap.usuario.puesto.nombre if ap.usuario.puesto else None,
                    'tipo': 'usuario'
                })
            elif ap.colaborador:
                personal_data.append({
                    'id': str(ap.colaborador.id),
                    'username': ap.colaborador.correo or '',
                    'nombre': ap.colaborador.nombre,
                    'rol': ap.rol_en_actividad,
                    'rol_display': 'Personal Fijo' if ap.colaborador.es_personal_fijo else 'Colaborador Externo',
                    'puesto': ap.colaborador.puesto.nombre if ap.colaborador.puesto else None,
                    'tipo': 'colaborador'
                })
        
        # Beneficiarios con detalles completos
        beneficiarios_data = []
        for ab in evento.beneficiarios.all():
            benef = ab.beneficiario
            nombre_display, _, detalles, tipo_envio = obtener_detalle_beneficiario(benef)
            if benef.tipo and hasattr(benef.tipo, 'get_nombre_display'):
                tipo_display = benef.tipo.get_nombre_display()
            else:
                tipo_display = tipo_envio.title() if tipo_envio else ''
            beneficiarios_data.append({
                'id': str(benef.id),
                'nombre': nombre_display,
                'tipo': tipo_envio,
                'tipo_display': tipo_display,
                'comunidad_id': detalles.get('comunidad_id'),
                'comunidad_nombre': detalles.get('comunidad_nombre'),
                'region_id': detalles.get('region_id'),
                'region_nombre': detalles.get('region_nombre'),
                'region_sede': detalles.get('region_sede'),
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
        
        comunidades_data = obtener_comunidades_evento(evento)
        comunidad_principal_id = comunidades_data[0]['comunidad_id'] if comunidades_data else (str(evento.comunidad.id) if evento.comunidad else None)
        portada_data = obtener_portada_evento(evento)
        
        evento_data = {
            'id': str(evento.id),
            'nombre': evento.nombre,
            'tipo_id': str(evento.tipo.id) if evento.tipo else None,
            'comunidad_id': comunidad_principal_id,
            'fecha': str(evento.fecha),
            'estado': evento.estado,
            'descripcion': evento.descripcion,
            'personal': personal_data,
            'beneficiarios': beneficiarios_data,
            'evidencias': evidencias_data,
            'comunidades': comunidades_data,
            'portada': portada_data,
            'tarjetas_datos': obtener_tarjetas_datos(evento)
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
        
        comunidades_payload = []
        if data.get('comunidades_seleccionadas'):
            try:
                comunidades_payload = json.loads(data['comunidades_seleccionadas'])
            except (json.JSONDecodeError, ValueError):
                comunidades_payload = []

        comunidad_principal_id = data.get('comunidad_id')
        if not comunidad_principal_id and comunidades_payload:
            comunidad_principal_id = comunidades_payload[0].get('comunidad_id')

        portada_eliminar_flag = data.get('portada_eliminar') == 'true'

        if not comunidad_principal_id:
            return JsonResponse({
                'success': False,
                'error': 'Debe seleccionar al menos una comunidad asociada al evento'
            }, status=400)
        
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
            
            if comunidad_principal_id:
                nueva_comunidad = Comunidad.objects.get(id=comunidad_principal_id)
                if nueva_comunidad != evento.comunidad:
                    cambios_realizados.append(f"Comunidad: '{evento.comunidad.nombre}' → '{nueva_comunidad.nombre}'")
                    evento.comunidad = nueva_comunidad
            else:
                if evento.comunidad is not None:
                    cambios_realizados.append(f"Comunidad principal removida: '{evento.comunidad.nombre}'")
                    evento.comunidad = None
            
            if data.get('fecha') and data.get('fecha') != str(evento.fecha):
                cambios_realizados.append(f"Fecha: '{evento.fecha}' → '{data.get('fecha')}'")
                evento.fecha = data.get('fecha')
            
            if data.get('estado') and data.get('estado') != evento.estado:
                cambios_realizados.append(f"Estado: '{evento.estado}' → '{data.get('estado')}'")
                evento.estado = data.get('estado')
            
            if data.get('descripcion') and data.get('descripcion') != evento.descripcion:
                cambios_realizados.append("Descripción actualizada")
                evento.descripcion = data.get('descripcion')
            
            evento.actualizado_en = timezone.now()
            evento.save()
            
            # Actualizar personal
            if data.get('personal_ids') is not None:
                try:
                    personal_raw = json.loads(data.get('personal_ids'))
                except (json.JSONDecodeError, ValueError):
                    personal_raw = []

                parsed_incoming = []
                incoming_keys = set()
                for item in personal_raw:
                    if isinstance(item, dict):
                        obj_id = item.get('id')
                        tipo = item.get('tipo', 'colaborador')
                        rol = item.get('rol', 'Colaborador')
                    else:
                        obj_id = item
                        tipo = 'colaborador'
                        rol = 'Colaborador'

                    if not obj_id:
                        continue

                    key = f"{tipo}:{obj_id}"
                    incoming_keys.add(key)
                    parsed_incoming.append({'id': obj_id, 'tipo': tipo, 'rol': rol, 'key': key})

                # Mapear personal actual
                personal_actual = {}
                for ap in evento.personal.all():
                    if ap.colaborador_id:
                        key = f"colaborador:{ap.colaborador_id}"
                    elif ap.usuario_id:
                        key = f"usuario:{ap.usuario_id}"
                    else:
                        continue
                    personal_actual[key] = ap

                actuales_keys = set(personal_actual.keys())

                # Eliminar los que ya no están
                keys_a_eliminar = actuales_keys - incoming_keys
                if keys_a_eliminar:
                    for key in keys_a_eliminar:
                        personal_actual[key].delete()
                    cambios_realizados.append(f"Removido {len(keys_a_eliminar)} personal")

                # Agregar o actualizar
                parsed_map = {item['key']: item for item in parsed_incoming}
                for key, item in parsed_map.items():
                    rol = item.get('rol', 'Colaborador')
                    if key in personal_actual:
                        ap = personal_actual[key]
                        if ap.rol_en_actividad != rol:
                            ap.rol_en_actividad = rol
                            ap.save(update_fields=['rol_en_actividad'])
                        continue

                    if item['tipo'] == 'usuario':
                        try:
                            usuario = Usuario.objects.get(id=item['id'])
                        except Usuario.DoesNotExist:
                            continue

                        ActividadPersonal.objects.create(
                            actividad=evento,
                            usuario=usuario,
                            rol_en_actividad=rol
                        )
                    else:
                        colaborador = Colaborador.objects.filter(id=item['id'], activo=True).select_related('usuario').first()
                        if not colaborador:
                            continue
                        ActividadPersonal.objects.create(
                            actividad=evento,
                            colaborador=colaborador,
                            usuario=colaborador.usuario if colaborador.usuario else None,
                            rol_en_actividad=rol
                        )

                nuevos_agregados = max(len(incoming_keys - actuales_keys), 0)
                if nuevos_agregados:
                    cambios_realizados.append(f"Agregado {nuevos_agregados} personal")
            
            # Actualizar comunidades asociadas
            comunidades_a_registrar = comunidades_payload.copy()
            if comunidad_principal_id and not any(item.get('comunidad_id') == comunidad_principal_id for item in comunidades_a_registrar):
                comunidades_a_registrar.insert(0, {'comunidad_id': comunidad_principal_id})

            comunidades_existentes_ids = set(
                str(cid) for cid in ActividadComunidad.objects.filter(actividad=evento).values_list('comunidad_id', flat=True)
            )

            if comunidades_a_registrar:
                comunidades_ids = [item.get('comunidad_id') for item in comunidades_a_registrar if item.get('comunidad_id')]
                comunidades_map = {
                    str(com.id): com for com in Comunidad.objects.filter(id__in=comunidades_ids).select_related('region')
                }

                for item in comunidades_a_registrar:
                    comunidad_id = item.get('comunidad_id')
                    if not comunidad_id:
                        continue

                    comunidad_obj = comunidades_map.get(str(comunidad_id))
                    if comunidad_obj is None:
                        raise Comunidad.DoesNotExist(f'Comunidad no válida: {comunidad_id}')

                    region_id = item.get('region_id')
                    if not region_id and comunidad_obj.region_id:
                        region_id = comunidad_obj.region_id

                    ActividadComunidad.objects.get_or_create(
                        actividad=evento,
                        comunidad=comunidad_obj,
                        defaults={'region_id': region_id}
                    )

            tarjetas_creadas = []
            if data.get('tarjetas_datos_nuevas'):
                try:
                    tarjetas_payload = json.loads(data['tarjetas_datos_nuevas'])
                except json.JSONDecodeError:
                    tarjetas_payload = []

                for idx, tarjeta in enumerate(tarjetas_payload):
                    titulo = tarjeta.get('titulo')
                    valor = tarjeta.get('valor')
                    icono = tarjeta.get('icono')
                    if not titulo or not valor:
                        continue
                    tarjeta_inst = TarjetaDato.objects.create(
                        entidad_tipo='actividad',
                        entidad_id=evento.id,
                        titulo=titulo,
                        valor=valor,
                        icono=icono,
                        orden=idx
                    )
                    tarjetas_creadas.append({
                        'id': str(tarjeta_inst.id),
                        'titulo': tarjeta_inst.titulo,
                        'valor': tarjeta_inst.valor,
                        'icono': tarjeta_inst.icono,
                        'orden': tarjeta_inst.orden
                    })

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
            
            # Agregar beneficiarios existentes seleccionados durante la edición
            if data.get('beneficiarios_existentes_agregar'):
                try:
                    beneficiarios_agregar = json.loads(data['beneficiarios_existentes_agregar'])
                    agregados = 0
                    for benef_id in beneficiarios_agregar:
                        if not benef_id:
                            continue
                        beneficiario = Beneficiario.objects.filter(id=benef_id, activo=True).first()
                        if not beneficiario:
                            continue
                        _, created_rel = ActividadBeneficiario.objects.get_or_create(
                            actividad=evento,
                            beneficiario=beneficiario
                        )
                        if created_rel:
                            agregados += 1
                    if agregados:
                        cambios_realizados.append(f"Asociado {agregados} beneficiarios existentes")
                        print(f"✅ Asociados {agregados} beneficiarios existentes al evento")
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error al agregar beneficiarios existentes: {e}")
                    pass

            # Actualizar beneficiarios modificados (si hay)
            if data.get('beneficiarios_modificados'):
                try:
                    beneficiarios_modificados = json.loads(data['beneficiarios_modificados'])
                    cambios_aplicados = aplicar_modificaciones_beneficiarios(beneficiarios_modificados)
                    if cambios_aplicados:
                        cambios_realizados.append(f"Modificado {cambios_aplicados} beneficiarios")
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
            
            # Gestionar imagen de portada
            portada_actual = getattr(evento, 'portada', None)
            portada_file = request.FILES.get('portada_evento')
            if portada_eliminar_flag and portada_actual and not portada_file:
                eliminar_portada_evento(portada_actual)
                cambios_realizados.append('Imagen de portada eliminada')

            if portada_file:
                if portada_actual:
                    eliminar_portada_evento(portada_actual)
                try:
                    guardar_portada_evento(evento, portada_file)
                    cambios_realizados.append('Imagen de portada actualizada')
                except ValueError as portada_error:
                    raise ValueError(str(portada_error))

            if data.get('tarjetas_datos_nuevas'):
                try:
                    tarjetas_nuevas = json.loads(data['tarjetas_datos_nuevas'])
                except json.JSONDecodeError:
                    tarjetas_nuevas = []

                if tarjetas_nuevas:
                    orden_inicial = TarjetaDato.objects.filter(entidad_tipo='actividad', entidad_id=evento.id).count()
                    for idx, tarjeta in enumerate(tarjetas_nuevas):
                        titulo = tarjeta.get('titulo')
                        valor = tarjeta.get('valor')
                        icono = tarjeta.get('icono')
                        if not titulo or not valor:
                            continue
                        TarjetaDato.objects.create(
                            entidad_tipo='actividad',
                            entidad_id=evento.id,
                            titulo=titulo,
                            valor=valor,
                            icono=icono,
                            orden=orden_inicial + idx
                        )
                    cambios_realizados.append(f"Agregados {len(tarjetas_nuevas)} datos del proyecto")

            if data.get('tarjetas_datos_actualizadas'):
                try:
                    tarjetas_actualizadas = json.loads(data['tarjetas_datos_actualizadas'])
                except json.JSONDecodeError:
                    tarjetas_actualizadas = []

                actualizados = 0
                for tarjeta in tarjetas_actualizadas:
                    tarjeta_id = tarjeta.get('id')
                    if not tarjeta_id:
                        continue
                    filas = TarjetaDato.objects.filter(id=tarjeta_id, entidad_tipo='actividad', entidad_id=evento.id)
                    if filas.exists():
                        filas.update(
                            titulo=tarjeta.get('titulo', ''),
                            valor=tarjeta.get('valor', ''),
                            icono=tarjeta.get('icono')
                        )
                        actualizados += 1
                if actualizados:
                    cambios_realizados.append(f"Actualizados {actualizados} datos del proyecto")

            if data.get('tarjetas_datos_eliminadas'):
                try:
                    tarjetas_eliminar = json.loads(data['tarjetas_datos_eliminadas'])
                except json.JSONDecodeError:
                    tarjetas_eliminar = []

                if tarjetas_eliminar:
                    eliminados, _ = TarjetaDato.objects.filter(
                        entidad_tipo='actividad',
                        entidad_id=evento.id,
                        id__in=tarjetas_eliminar
                    ).delete()
                    if eliminados:
                        cambios_realizados.append(f"Eliminados {eliminados} datos del proyecto")

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
                    'portada': obtener_portada_evento(evento),
                    'tarjetas_datos': obtener_tarjetas_datos(evento)
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
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
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
        data = json.loads(request.body or '{}')
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
            'tipo', 'comunidad', 'comunidad__region', 'responsable', 'portada'
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
                    personal_nombres = []
                    for ap in evento.personal.all()[:3]:
                        if ap.usuario:
                            personal_nombres.append(ap.usuario.nombre if ap.usuario.nombre else ap.usuario.username)
                        elif ap.colaborador:
                            personal_nombres.append(ap.colaborador.nombre)
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
                
                portada_info = obtener_portada_evento(evento)
                imagen_url = portada_info['url'] if portada_info else None
                
                if not imagen_url:
                    primera_evidencia = evento.evidencias.filter(es_imagen=True).first()
                    if primera_evidencia and primera_evidencia.url_almacenamiento:
                        try:
                            imagen_url = primera_evidencia.url_almacenamiento
                        except Exception:
                            imagen_url = None
                
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
                    'tarjetas_datos': obtener_tarjetas_datos(evento),
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
            'tipo', 'comunidad', 'comunidad__region', 'responsable', 'portada'
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
                    personal_nombres = []
                    for ap in evento.personal.all()[:3]:
                        if ap.usuario:
                            personal_nombres.append(ap.usuario.nombre if ap.usuario.nombre else ap.usuario.username)
                        elif ap.colaborador:
                            personal_nombres.append(ap.colaborador.nombre)
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
                    'portada': obtener_portada_evento(evento),
                    'tarjetas_datos': obtener_tarjetas_datos(evento),
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
            'tipo', 'comunidad', 'comunidad__region', 'responsable', 'portada'
        ).prefetch_related(
            'evidencias'
        ).order_by('-creado_en')[:6]
        
        eventos_data = []
        for evento in eventos:
            try:
                portada_info = obtener_portada_evento(evento)
                imagen_url = portada_info['url'] if portada_info else None

                if not imagen_url:
                    primera_evidencia = evento.evidencias.filter(es_imagen=True).first()
                    if primera_evidencia and primera_evidencia.url_almacenamiento:
                        imagen_url = primera_evidencia.url_almacenamiento

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
                except Exception:
                    fecha_obj = None

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
                    'portada': portada_info,
                    'fecha_mes': mes,
                    'fecha_dia': dia,
                    'fecha_anio': anio,
                    'tipo': evento.tipo.nombre if evento.tipo else 'Sin tipo',
                    'comunidad': evento.comunidad.nombre if evento.comunidad else 'Sin comunidad',
                    'tarjetas_datos': obtener_tarjetas_datos(evento)
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
def api_calendar_events(request):
    """Eventos para el calendario entre start y end (YYYY-MM-DD). Solo eventos con estado 'en_progreso' o 'completado'."""
    start = request.GET.get('start')
    end = request.GET.get('end')
    if not start or not end:
        return JsonResponse([], safe=False)
    try:
        # Solo eventos con estado 'en_progreso' o 'completado'
        actividades = Actividad.objects.filter(
            eliminado_en__isnull=True,
            fecha__gte=start,
            fecha__lte=end,
            estado__in=['en_progreso', 'completado']
        ).select_related('tipo', 'comunidad', 'responsable')

        # Obtener IDs de actividades para consultas optimizadas
        actividad_ids = list(actividades.values_list('id', flat=True))
        
        # Personal asignado (tabla ActividadPersonal)
        # Obtener usuarios asignados a través de ActividadPersonal
        usuarios_asignados_map = {}
        for ap in ActividadPersonal.objects.filter(actividad_id__in=actividad_ids).select_related('usuario'):
            key = str(ap.actividad_id)
            if ap.usuario_id:
                if key not in usuarios_asignados_map:
                    usuarios_asignados_map[key] = set()
                usuarios_asignados_map[key].add(str(ap.usuario_id))

        data = []
        for a in actividades:
            # IDs de usuarios asignados a través de ActividadPersonal
            usuarios_ids = usuarios_asignados_map.get(str(a.id), set()).copy()
            
            # Agregar responsable si existe
            if a.responsable_id:
                usuarios_ids.add(str(a.responsable_id))
            
            # Obtener nombres de responsables/encargados (usuario.nombre o username)
            responsables_nombres = []
            if a.responsable:
                responsables_nombres.append(a.responsable.nombre if a.responsable.nombre else a.responsable.username)
            
            # Obtener nombres de personal asignado
            personal_asignado = ActividadPersonal.objects.filter(actividad_id=a.id).select_related('usuario')
            for ap in personal_asignado:
                if ap.usuario:
                    nombre = ap.usuario.nombre if ap.usuario.nombre else ap.usuario.username
                    if nombre not in responsables_nombres:
                        responsables_nombres.append(nombre)
            
            responsables_texto = ', '.join(responsables_nombres) if responsables_nombres else None

            data.append({
                'date': a.fecha.isoformat() if a.fecha else None,
                'name': a.nombre,
                'description': a.descripcion,
                'status': a.estado,
                'responsable': a.responsable.username if a.responsable else None,
                'owners': responsables_texto,  # Texto con todos los responsables/encargados
                'usuarios_asignados_ids': list(usuarios_ids),
            })
        return JsonResponse(data, safe=False)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET", "POST"])
@login_required
def api_avances(request):
    """Obtiene avances/cambios de eventos para el calendario por fecha."""
    date_str = request.GET.get('date')
    if not date_str:
        return JsonResponse([], safe=False)
    
    try:
        from django.utils.timezone import localtime, is_aware, make_aware
        import pytz
        from django.db import connection
        
        # Buscar cambios cuya fecha_cambio (en zona horaria de Guatemala) corresponda al día solicitado
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT ac.id::text,
                       ac.actividad_id::text,
                       ac.responsable_id::text,
                       ac.colaborador_id::text,
                       ac.descripcion_cambio,
                       ac.fecha_cambio,
                       a.nombre as evento_nombre,
                       COALESCE(u.nombre, u.username) as responsable_nombre,
                       c.nombre as colaborador_nombre
                FROM actividad_cambios ac
                INNER JOIN actividades a ON a.id = ac.actividad_id
                LEFT JOIN usuarios u ON u.id = ac.responsable_id
                LEFT JOIN colaboradores c ON c.id = ac.colaborador_id
                WHERE (ac.fecha_cambio AT TIME ZONE 'America/Guatemala')::date = %s::date
                  AND a.eliminado_en IS NULL
                ORDER BY ac.fecha_cambio ASC
                """,
                [date_str]
            )
            rows = cur.fetchall()
        
        results = []
        for row in rows:
            cambio_id, actividad_id, responsable_id, colaborador_id, descripcion, fecha_cambio, evento_nombre, responsable_nombre, colaborador_nombre = row
            
            # Si no hay evento_nombre desde la consulta, obtenerlo manualmente (fallback)
            if not evento_nombre:
                try:
                    actividad = Actividad.objects.get(id=actividad_id)
                    evento_nombre = actividad.nombre
                except Actividad.DoesNotExist:
                    continue
            
            # Determinar el responsable/colaborador a mostrar
            responsable_display = None
            if colaborador_nombre:
                responsable_display = colaborador_nombre
            elif responsable_nombre:
                responsable_display = responsable_nombre
            else:
                responsable_display = 'Sistema'
            
            # Convertir fecha_cambio a zona horaria de Guatemala
            if fecha_cambio:
                guatemala_tz = pytz.timezone('America/Guatemala')
                if fecha_cambio.tzinfo is None:
                    fecha_guatemala = guatemala_tz.localize(fecha_cambio)
                else:
                    fecha_guatemala = fecha_cambio.astimezone(guatemala_tz)
                fecha_iso = fecha_guatemala.date().isoformat()
                hora_str = fecha_guatemala.strftime('%H:%M')
            else:
                fecha_iso = date_str
                hora_str = ''
            
            results.append({
                'id': cambio_id,
                'actividad_id': actividad_id,
                'evento_nombre': evento_nombre,
                'fecha': fecha_iso,
                'hora': hora_str,
                'responsable': responsable_display,
                'descripcion': descripcion or ''
            })
        
        return JsonResponse(results, safe=False)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET", "POST"])
@login_required
def api_reminders(request):
    """Lista o crea recordatorios usando tablas recordatorios y recordatorio_colaboradores."""
    if request.method == 'GET':
        date_str = request.GET.get('date')
        if not date_str:
            return JsonResponse([], safe=False)
        
        # Verificar si el usuario es admin
        is_admin = False
        user_id = None
        try:
            with connection.cursor() as cur_user:
                cur_user.execute(
                    "SELECT id::text, rol FROM usuarios WHERE username = %s LIMIT 1",
                    [getattr(request.user, 'username', None)]
                )
                user_row = cur_user.fetchone()
                if user_row:
                    user_id, user_rol = user_row
                    is_admin = (user_rol == 'admin')
        except Exception:
            pass
        
        try:
            with connection.cursor() as cur:
                # Si es admin, mostrar todos los recordatorios del día
                # Si no es admin, mostrar solo los suyos
                if is_admin:
                    cur.execute(
                        """
                        SELECT r.id::text,
                               r.actividad_id::text,
                               r.created_by::text,
                               r.titulo,
                               r.descripcion,
                               r.due_at,
                               r.enviar_notificacion,
                               r.enviado
                        FROM recordatorios r
                        WHERE (r.due_at AT TIME ZONE 'America/Guatemala')::date = %s::date
                        ORDER BY r.due_at ASC
                        """,
                        [date_str]
                    )
                else:
                    # Solo los recordatorios del usuario actual
                    if user_id:
                        cur.execute(
                            """
                            SELECT r.id::text,
                                   r.actividad_id::text,
                                   r.created_by::text,
                                   r.titulo,
                                   r.descripcion,
                                   r.due_at,
                                   r.enviar_notificacion,
                                   r.enviado
                            FROM recordatorios r
                            WHERE (r.due_at AT TIME ZONE 'America/Guatemala')::date = %s::date
                              AND r.created_by = %s
                            ORDER BY r.due_at ASC
                            """,
                            [date_str, user_id]
                        )
                    else:
                        # Si no hay user_id, no mostrar nada
                        rows = []
                        results = []
                        return JsonResponse(results, safe=False)
                rows = cur.fetchall()

            results = []
            for row in rows:
                rid, act_id, created_by, titulo, desc, due_at, enviar, enviado = row
                # owners text
                with connection.cursor() as cur2:
                    cur2.execute(
                        """
                        SELECT c.nombre
                        FROM recordatorio_colaboradores rc
                        JOIN colaboradores c ON c.id = rc.colaborador_id
                        WHERE rc.recordatorio_id = %s
                        ORDER BY c.nombre
                        """,
                        [rid]
                    )
                    owners_names = [r[0] for r in cur2.fetchall()]
                owners_text = ', '.join(owners_names)
                
                # Extraer fecha y hora correctamente en zona horaria de Guatemala
                if due_at:
                    import pytz
                    guatemala_tz = pytz.timezone('America/Guatemala')
                    # Si due_at ya es timezone-aware, convertir a Guatemala
                    if due_at.tzinfo is None:
                        due_at_guatemala = guatemala_tz.localize(due_at)
                    else:
                        due_at_guatemala = due_at.astimezone(guatemala_tz)
                    
                    # Extraer hora y fecha por separado para evitar problemas de cambio de día
                    time_str = due_at_guatemala.strftime('%H:%M')
                    # Usar directamente la fecha del datetime en zona horaria de Guatemala
                    # Importante: usar .date() después de la conversión de timezone
                    date_iso = due_at_guatemala.date().isoformat()
                else:
                    time_str = ''
                    date_iso = date_str
                    
                results.append({
                    'id': rid,
                    'date': date_iso,
                    'time': time_str,
                    'description': desc or '',
                    'event_name': titulo or None,
                    'created_by': created_by,
                    'owners_text': owners_text
                })
            return JsonResponse(results, safe=False)
        except Exception as e:
            return JsonResponse([], safe=False)

    # POST crear recordatorio
    try:
        payload = json.loads(request.body or '{}')
        date = payload.get('date')
        time = payload.get('time') or '08:00'
        event_name = payload.get('event_name')
        description = payload.get('description') or ''
        owners = payload.get('owners') or []

        # due_at timestamptz (zona horaria de Guatemala)
        try:
            from django.utils.timezone import make_aware
            import pytz
            # Crear datetime naive desde la fecha y hora (parsear por separado para evitar problemas)
            date_parts = date.split('-')
            time_parts = time.split(':')
            if len(date_parts) == 3 and len(time_parts) >= 2:
                year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
                hour, minute = int(time_parts[0]), int(time_parts[1])
                dt_naive = datetime(year, month, day, hour, minute)
            else:
                dt_naive = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
            # Convertir a timezone-aware usando zona horaria de Guatemala
            guatemala_tz = pytz.timezone('America/Guatemala')
            due_at = guatemala_tz.localize(dt_naive)
        except Exception as e:
            # Fallback: usar hora actual con timezone de Guatemala
            import pytz
            guatemala_tz = pytz.timezone('America/Guatemala')
            due_at = timezone.now().astimezone(guatemala_tz)

        # Resolver created_by (UUID en tabla usuarios). Si el auth user no es el mismo modelo, buscar por username
        created_by = None
        try:
            with connection.cursor() as curu:
                curu.execute("SELECT id::text FROM usuarios WHERE username = %s LIMIT 1", [getattr(request.user, 'username', None)])
                rowu = curu.fetchone()
                if rowu:
                    created_by = rowu[0]
        except Exception:
            created_by = None
        actividad_id = None
        if event_name:
            act = Actividad.objects.filter(nombre__iexact=event_name).order_by('-creado_en').first()
            if act:
                actividad_id = str(act.id)

        # Insertar recordatorio
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recordatorios (actividad_id, created_by, titulo, descripcion, due_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                [actividad_id, created_by, event_name, description, due_at]
            )
            rid = cur.fetchone()[0]
        # Insertar involucrados
        if owners:
            with connection.cursor() as cur2:
                cur2.executemany(
                    """
                    INSERT INTO recordatorio_colaboradores (recordatorio_id, colaborador_id)
                    VALUES (%s, %s)
                    ON CONFLICT (recordatorio_id, colaborador_id) DO NOTHING
                    """,
                    [(rid, o) for o in owners]
                )
        return JsonResponse({'id': str(rid)})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["DELETE"])
@login_required
def api_reminder_detail(request, reminder_id):
    """Eliminar recordatorio si es admin o creador."""
    try:
        # Obtener información del recordatorio
        with connection.cursor() as cur:
            cur.execute("SELECT created_by::text FROM recordatorios WHERE id = %s", [reminder_id])
            row = cur.fetchone()
            if not row:
                return JsonResponse({'error': 'Not found'}, status=404)
            created_by = row[0]
        
        # Verificar permisos: admin o creador
        is_admin = False
        is_creator = False
        
        # Obtener usuario actual desde la tabla usuarios
        try:
            with connection.cursor() as cur_user:
                cur_user.execute(
                    "SELECT id::text, rol FROM usuarios WHERE username = %s LIMIT 1",
                    [getattr(request.user, 'username', None)]
                )
                user_row = cur_user.fetchone()
                if user_row:
                    user_id, user_rol = user_row
                    is_admin = (user_rol == 'admin')
                    is_creator = (created_by == user_id)
        except Exception:
            pass
        
        if not (is_admin or is_creator):
            return JsonResponse({'error': 'Forbidden'}, status=403)
        
        # Eliminar el recordatorio (CASCADE eliminará también los colaboradores)
        with connection.cursor() as cur2:
            cur2.execute("DELETE FROM recordatorios WHERE id = %s", [reminder_id])
        
        return JsonResponse({'deleted': True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
def api_events_list(request):
    """Lista simple de eventos (id, name) para el formulario de recordatorios."""
    qs = Actividad.objects.filter(eliminado_en__isnull=True).order_by('-creado_en')[:300]
    data = [{'id': str(a.id), 'name': a.nombre} for a in qs]
    return JsonResponse(data, safe=False)


@require_http_methods(["GET"])
def api_collaborators(request):
    """Lista de colaboradores activos para el formulario (id, nombre, puesto)."""
    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT c.id::text, c.nombre, COALESCE(p.nombre,'') as puesto
                FROM colaboradores c
                LEFT JOIN puestos p ON p.id = c.puesto_id
                WHERE c.activo = TRUE
                ORDER BY c.nombre
                """
            )
            rows = cur.fetchall()
        data = [{'id': r[0], 'name': r[1], 'puesto': r[2]} for r in rows]
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse([], safe=False)

@require_http_methods(["GET"])
def api_obtener_detalle_proyecto(request, evento_id):
    """
    Obtiene los detalles completos de un proyecto/evento específico
    """
    try:
        from django.utils.timezone import localtime, is_aware, make_aware
        import pytz
        
        evento = Actividad.objects.select_related(
            'tipo', 'comunidad', 'comunidad__region', 'responsable', 'colaborador'
        ).prefetch_related(
            'personal__usuario__puesto',
            'personal__colaborador__puesto',
            'beneficiarios__beneficiario__individual',
            'beneficiarios__beneficiario__familia',
            'beneficiarios__beneficiario__institucion',
            'evidencias',
            'comunidades_relacionadas__comunidad__region',
            'comunidades_relacionadas__region'
        ).get(id=evento_id, eliminado_en__isnull=True)
        
        # Personal asignado
        personal_data = []
        for ap in evento.personal.all():
            if ap.usuario:
                personal_data.append({
                    'id': str(ap.usuario.id),
                    'username': ap.usuario.username,
                    'nombre': ap.usuario.nombre or ap.usuario.username,
                    'rol': ap.rol_en_actividad,
                    'rol_display': ap.usuario.get_rol_display() if hasattr(ap.usuario, 'get_rol_display') else ap.usuario.rol,
                    'puesto': ap.usuario.puesto.nombre if ap.usuario.puesto else 'Sin puesto',
                    'tipo': 'usuario'
                })
            elif ap.colaborador:
                personal_data.append({
                    'id': str(ap.colaborador.id),
                    'username': ap.colaborador.correo or '',
                    'nombre': ap.colaborador.nombre,
                    'rol': ap.rol_en_actividad,
                    'rol_display': 'Personal Fijo' if ap.colaborador.es_personal_fijo else 'Colaborador Externo',
                    'puesto': ap.colaborador.puesto.nombre if ap.colaborador.puesto else 'Sin puesto',
                    'tipo': 'colaborador'
                })
        
        # Beneficiarios
        beneficiarios_data = []
        for ab in evento.beneficiarios.all():
            benef = ab.beneficiario
            nombre_display, _, detalles, tipo_envio = obtener_detalle_beneficiario(benef)
            if benef.tipo and hasattr(benef.tipo, 'get_nombre_display'):
                tipo_display = benef.tipo.get_nombre_display()
            else:
                tipo_display = tipo_envio.title() if tipo_envio else ''
            beneficiarios_data.append({
                'id': str(benef.id),
                'tipo': tipo_envio,
                'nombre': nombre_display,
                'descripcion': '',  # Sin campo de descripción en el modelo
                'tipo_display': tipo_display,
                'comunidad_id': detalles.get('comunidad_id'),
                'comunidad_nombre': detalles.get('comunidad_nombre'),
                'region_id': detalles.get('region_id'),
                'region_nombre': detalles.get('region_nombre'),
                'region_sede': detalles.get('region_sede'),
                'detalles': detalles
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
            'evidencias': evidencias_data,
            'portada': obtener_portada_evento(evento),
            'tarjetas_datos': obtener_tarjetas_datos(evento)
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