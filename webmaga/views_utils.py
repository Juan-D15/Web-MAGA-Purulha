from datetime import datetime
import os

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils import timezone

from .models import (
    Actividad,
    ActividadBeneficiario,
    ActividadComunidad,
    ActividadPortada,
    Beneficiario,
    BeneficiarioFamilia,
    BeneficiarioIndividual,
    BeneficiarioInstitucion,
    Colaborador,
    Comunidad,
    EventoCambioColaborador,
    EventosEvidenciasCambios,
    TarjetaDato,
)


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
            'display_name': nombre_display,
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
            'display_name': nombre_display,
        }
    elif hasattr(beneficiario, 'institucion'):
        inst = beneficiario.institucion
        nombre_display = inst.nombre_institucion
        info_adicional = inst.tipo_institucion or ''
        if (beneficiario.tipo and beneficiario.tipo.nombre.lower() == 'otro') or (
            inst.tipo_institucion or ''
        ).lower() == 'otro':
            tipo_envio = 'otro'
            detalles = {
                'nombre': inst.nombre_institucion,
                'tipo_descripcion': inst.email or inst.tipo_institucion,
                'contacto': inst.representante_legal or '',
                'telefono': inst.telefono or '',
                'descripcion': '',
                'display_name': nombre_display,
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
                'display_name': nombre_display,
            }
    else:
        nombre_display = f"Beneficiario {beneficiario.id}"

    comunidad = beneficiario.comunidad
    detalles['comunidad_id'] = str(comunidad.id) if comunidad else None
    detalles['comunidad_nombre'] = comunidad.nombre if comunidad else None
    detalles['region_id'] = str(comunidad.region_id) if comunidad and comunidad.region_id else None
    detalles['region_nombre'] = comunidad.region.nombre if comunidad and comunidad.region else None
    detalles['region_sede'] = (
        comunidad.region.comunidad_sede
        if comunidad and comunidad.region and comunidad.region.comunidad_sede
        else None
    )

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
                nuevo_dpi = benef_data.get('dpi')
                if nuevo_dpi and nuevo_dpi != benef_ind.dpi:
                    dpi_existente = (
                        BeneficiarioIndividual.objects.filter(dpi=nuevo_dpi, beneficiario__activo=True)
                        .exclude(beneficiario=beneficiario)
                        .first()
                    )
                    if dpi_existente:
                        raise ValueError(f'Ya existe un beneficiario individual con el DPI {nuevo_dpi}.')

                benef_ind.nombre = benef_data.get('nombre', benef_ind.nombre)
                benef_ind.apellido = benef_data.get('apellido', benef_ind.apellido)
                benef_ind.dpi = nuevo_dpi
                benef_ind.fecha_nacimiento = benef_data.get('fecha_nacimiento')
                benef_ind.genero = benef_data.get('genero')
                benef_ind.telefono = benef_data.get('telefono')
                benef_ind.save()
                cambios_aplicados += 1
                print(
                    f"✅ Beneficiario individual actualizado: {benef_ind.nombre} {benef_ind.apellido}"
                )

            elif tipo == 'familia':
                benef_fam = BeneficiarioFamilia.objects.get(beneficiario=beneficiario)
                nuevo_dpi_jefe = benef_data.get('dpi_jefe_familia')
                if nuevo_dpi_jefe and nuevo_dpi_jefe != benef_fam.dpi_jefe_familia:
                    dpi_existente = (
                        BeneficiarioFamilia.objects.filter(
                            dpi_jefe_familia=nuevo_dpi_jefe, beneficiario__activo=True
                        )
                        .exclude(beneficiario=beneficiario)
                        .first()
                    )
                    if dpi_existente:
                        raise ValueError(
                            f'Ya existe una familia con el DPI del jefe {nuevo_dpi_jefe}.'
                        )

                benef_fam.nombre_familia = benef_data.get('nombre_familia', benef_fam.nombre_familia)
                benef_fam.jefe_familia = benef_data.get('jefe_familia', benef_fam.jefe_familia)
                benef_fam.dpi_jefe_familia = nuevo_dpi_jefe
                benef_fam.telefono = benef_data.get('telefono')
                benef_fam.numero_miembros = benef_data.get('numero_miembros')
                benef_fam.save()
                cambios_aplicados += 1
                print(f"✅ Beneficiario familia actualizado: {benef_fam.nombre_familia}")

            elif tipo in ('institucion', 'institución'):
                benef_inst = BeneficiarioInstitucion.objects.get(beneficiario=beneficiario)
                nuevo_dpi_rep = benef_data.get('dpi_representante')
                if nuevo_dpi_rep and nuevo_dpi_rep != benef_inst.dpi_representante:
                    dpi_existente = (
                        BeneficiarioInstitucion.objects.filter(
                            dpi_representante=nuevo_dpi_rep, beneficiario__activo=True
                        )
                        .exclude(beneficiario=beneficiario)
                        .first()
                    )
                    if dpi_existente:
                        raise ValueError(
                            f'Ya existe una institución con el DPI del representante {nuevo_dpi_rep}.'
                        )

                benef_inst.nombre_institucion = benef_data.get(
                    'nombre_institucion', benef_inst.nombre_institucion
                )
                benef_inst.tipo_institucion = benef_data.get(
                    'tipo_institucion', benef_inst.tipo_institucion
                )
                benef_inst.representante_legal = benef_data.get('representante_legal')
                benef_inst.dpi_representante = nuevo_dpi_rep
                benef_inst.telefono = benef_data.get('telefono')
                benef_inst.email = benef_data.get('email')
                benef_inst.numero_beneficiarios_directos = benef_data.get(
                    'numero_beneficiarios_directos'
                )
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

        except (
            BeneficiarioIndividual.DoesNotExist,
            BeneficiarioFamilia.DoesNotExist,
            BeneficiarioInstitucion.DoesNotExist,
        ):
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
        comunidades_detalle.append(
            {
                'comunidad_id': str(comunidad.id) if comunidad else None,
                'comunidad_nombre': comunidad.nombre if comunidad else None,
                'region_id': str(region.id) if region else None,
                'region_nombre': region.nombre if region else None,
                'region_sede': region.comunidad_sede if getattr(region, 'comunidad_sede', None) else None,
            }
        )

    if not comunidades_detalle and evento.comunidad:
        region = evento.comunidad.region
        comunidades_detalle.append(
            {
                'comunidad_id': str(evento.comunidad.id),
                'comunidad_nombre': evento.comunidad.nombre,
                'region_id': str(region.id) if region else None,
                'region_nombre': region.nombre if region else None,
                'region_sede': region.comunidad_sede if region else None,
            }
        )

    return comunidades_detalle


def obtener_tarjetas_datos(evento):
    """Retorna las tarjetas de datos asociadas a una actividad sin duplicados."""
    tarjetas = []
    qs = (
        TarjetaDato.objects.filter(entidad_tipo='actividad', entidad_id=evento.id)
        .order_by('orden', 'creado_en')
        .distinct()
    )

    ids_vistos = set()

    for tarjeta in qs:
        tarjeta_id = str(tarjeta.id)
        if tarjeta_id in ids_vistos:
            print(f'⚠️ Tarjeta duplicada detectada en BD: {tarjeta.titulo} (ID: {tarjeta_id})')
            continue

        ids_vistos.add(tarjeta_id)
        tarjetas.append(
            {
                'id': tarjeta_id,
                'titulo': tarjeta.titulo,
                'valor': tarjeta.valor,
                'icono': tarjeta.icono,
                'orden': tarjeta.orden,
                'es_favorita': tarjeta.es_favorita,
            }
        )

    return tarjetas


def obtener_cambios_evento(evento):
    """Obtiene los cambios realizados en un evento por colaboradores."""
    print(f'🔍 Buscando cambios (colaboradores) para evento {evento.id} - {evento.nombre}')

    cambios = (
        EventoCambioColaborador.objects.filter(actividad=evento)
        .select_related('colaborador')
        .prefetch_related('evidencias')
        .order_by('-fecha_cambio')
    )

    cambios_data = []
    for cambio in cambios:
        print(f'📝 Procesando cambio colaborador {cambio.id}: {cambio.descripcion_cambio[:50]}...')
        colaborador = cambio.colaborador
        responsable_nombre = colaborador.nombre if colaborador else 'Colaborador desconocido'

        evidencias_data = []
        evidencias_qs = cambio.evidencias.all()
        print(f'📎 Evidencias encontradas para cambio {cambio.id}: {evidencias_qs.count()}')
        for evidencia in evidencias_qs:
            evidencias_data.append(
                {
                    'id': str(evidencia.id),
                    'nombre': evidencia.archivo_nombre,
                    'url': evidencia.url_almacenamiento,
                    'tipo': evidencia.archivo_tipo or '',
                    'descripcion': evidencia.descripcion or '',
                }
            )

        fecha_display = ''
        if cambio.fecha_cambio:
            import pytz

            guatemala_tz = pytz.timezone('America/Guatemala')
            if timezone.is_aware(cambio.fecha_cambio):
                fecha_local = cambio.fecha_cambio.astimezone(guatemala_tz)
            else:
                fecha_local = timezone.make_aware(cambio.fecha_cambio, guatemala_tz)
            fecha_display = fecha_local.strftime('%d/%m/%Y %H:%M')

        cambios_data.append(
            {
                'id': str(cambio.id),
                'descripcion': cambio.descripcion_cambio,
                'fecha_cambio': cambio.fecha_cambio.isoformat() if cambio.fecha_cambio else None,
                'fecha_display': fecha_display,
                'responsable': responsable_nombre,
                'colaborador_id': str(colaborador.id) if colaborador else None,
                'responsable_id': str(colaborador.id) if colaborador else None,
                'evidencias': evidencias_data,
            }
        )
        print(f'✅ Cambio colaborador agregado: {cambios_data[-1]["id"]}')

    print(f'📦 Total de cambios de colaboradores retornados: {len(cambios_data)}')
    return cambios_data


def obtener_portada_evento(evento):
    """Devuelve la información de la portada del evento, si existe."""
    portada = getattr(evento, 'portada', None)
    if not portada:
        return None
    return {
        'id': str(portada.id),
        'nombre': portada.archivo_nombre,
        'tipo': portada.archivo_tipo or '',
        'url': portada.url_almacenamiento,
    }


def eliminar_portada_evento(portada_inst):
    """Elimina la portada asociada al evento, incluyendo el archivo físico."""
    if not portada_inst:
        return False

    archivo_path = os.path.join(settings.MEDIA_ROOT, portada_inst.url_almacenamiento.lstrip('/media/'))
    if os.path.exists(archivo_path):
        try:
            os.remove(archivo_path)
        except Exception as error:
            print(f"⚠️ No se pudo eliminar el archivo de portada: {error}")

    portada_inst.delete()
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
            'url_almacenamiento': url,
        },
    )
    return portada


__all__ = [
    'obtener_detalle_beneficiario',
    'aplicar_modificaciones_beneficiarios',
    'obtener_comunidades_evento',
    'obtener_tarjetas_datos',
    'obtener_cambios_evento',
    'obtener_portada_evento',
    'eliminar_portada_evento',
    'obtener_url_portada_o_evidencia',
    'guardar_portada_evento',
    '_calcular_tiempo_relativo',
]


def _calcular_tiempo_relativo(fecha):
    """Calcula tiempo relativo (ej: 'hace 2 horas')"""
    from django.utils import timezone
    from django.utils.timezone import localtime, is_aware, make_aware
    import pytz

    if not is_aware(fecha):
        fecha = make_aware(fecha, pytz.UTC)

    ahora = timezone.now()
    diferencia = ahora - fecha
    segundos = diferencia.total_seconds()

    if segundos < 0:
        return 'recién creado'

    if segundos < 60:
        return 'hace unos segundos'
    if segundos < 3600:
        minutos = int(segundos / 60)
        return f'hace {minutos} minuto{"s" if minutos != 1 else ""}'
    if segundos < 86400:
        horas = int(segundos / 3600)
        return f'hace {horas} hora{"s" if horas != 1 else ""}'
    if segundos < 604800:
        dias = int(segundos / 86400)
        return f'hace {dias} día{"s" if dias != 1 else ""}'

    fecha_local = localtime(fecha)
    return fecha_local.strftime('%d/%m/%Y %H:%M')

