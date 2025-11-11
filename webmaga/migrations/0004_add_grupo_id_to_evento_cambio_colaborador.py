import uuid
from collections import defaultdict

from django.db import migrations, models


def agrupar_cambios_existentes(apps, schema_editor):
    EventoCambioColaborador = apps.get_model('webmaga', 'EventoCambioColaborador')

    # Agrupar por actividad, descripción y fecha (redondeada al segundo) para detectar
    # cambios que pertenecen al mismo grupo antes de que existiera el campo.
    grupos = defaultdict(list)
    cambios = EventoCambioColaborador.objects.all().only(
        'id', 'actividad_id', 'descripcion_cambio', 'fecha_cambio', 'grupo_id'
    )

    for cambio in cambios:
        descripcion = (cambio.descripcion_cambio or '').strip()
        fecha = cambio.fecha_cambio
        if fecha:
            fecha_clave = fecha.replace(microsecond=0)
        else:
            fecha_clave = None
        key = (cambio.actividad_id, descripcion, fecha_clave)
        grupos[key].append(cambio)

    for cambios_grupo in grupos.values():
        if len(cambios_grupo) <= 1:
            continue

        grupo_uuid = cambios_grupo[0].grupo_id
        for cambio in cambios_grupo[1:]:
            if cambio.grupo_id != grupo_uuid:
                cambio.grupo_id = grupo_uuid
                cambio.save(update_fields=['grupo_id'])


def nada(apps, schema_editor):
    """Función nula para reversed migration."""


class Migration(migrations.Migration):

    dependencies = [
        ('webmaga', '0003_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventocambiocolaborador',
            name='grupo_id',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False),
        ),
        migrations.RunPython(agrupar_cambios_existentes, nada),
    ]

