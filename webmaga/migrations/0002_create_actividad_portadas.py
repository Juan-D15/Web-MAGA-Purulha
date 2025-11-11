from django.db import migrations


SQL_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS actividad_portadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_tipo VARCHAR(100),
    url_almacenamiento TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (actividad_id)
);
CREATE INDEX IF NOT EXISTS idx_actividad_portadas_actividad ON actividad_portadas(actividad_id);
"""

SQL_DROP_TABLE = """
DROP TABLE IF EXISTS actividad_portadas;
"""


class Migration(migrations.Migration):

    initial = False

    dependencies = [('webmaga', '0001_create_actividad_comunidades'),]

    operations = [
        migrations.RunSQL(sql=SQL_CREATE_TABLE, reverse_sql=SQL_DROP_TABLE),
    ]
