from django.db import migrations


class Migration(migrations.Migration):

    # Unifica las ramas 0003_seed_initial_data y 0004_add_grupo_id_to_evento_cambio_colaborador
    dependencies = [
        ('webmaga', '0003_initial'),
        ('webmaga', '0004_add_grupo_id_to_evento_cambio_colaborador'),
    ]

    operations = [
        # No hay cambios de esquema; esta migración simplemente fusiona el grafo.
    ]

