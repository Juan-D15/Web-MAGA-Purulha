from django.db import migrations


SQL_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS actividad_comunidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    comunidad_id UUID NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
    region_id UUID REFERENCES regiones(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (actividad_id, comunidad_id)
);
CREATE INDEX IF NOT EXISTS idx_actividad_comunidades_actividad ON actividad_comunidades(actividad_id);
CREATE INDEX IF NOT EXISTS idx_actividad_comunidades_comunidad ON actividad_comunidades(comunidad_id);
"""

SQL_DROP_TABLE = """
DROP TABLE IF EXISTS actividad_comunidades;
"""


class Migration(migrations.Migration):

    initial = False

    dependencies = []

    operations = [
        migrations.RunSQL(sql=SQL_CREATE_TABLE, reverse_sql=SQL_DROP_TABLE),
    ]
