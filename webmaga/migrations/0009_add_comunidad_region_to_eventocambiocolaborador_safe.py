# Generated manually to safely add comunidad and region fields to EventoCambioColaborador

from django.db import migrations, models
import django.db.models.deletion


def add_comunidad_region_fields_if_not_exists(apps, schema_editor):
    """Agrega las columnas comunidad_id y region_id solo si no existen"""
    db_alias = schema_editor.connection.alias
    
    # Verificar si las columnas existen
    with schema_editor.connection.cursor() as cursor:
        # Para PostgreSQL
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'eventos_cambios_colaboradores' 
            AND column_name IN ('comunidad_id', 'region_id');
        """)
        
        existing_columns = {row[0] for row in cursor.fetchall()}
        
        # Agregar comunidad_id si no existe
        if 'comunidad_id' not in existing_columns:
            cursor.execute("""
                ALTER TABLE eventos_cambios_colaboradores
                ADD COLUMN comunidad_id UUID REFERENCES comunidades(id) ON DELETE SET NULL;
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_eventos_cambios_colab_comunidad 
                ON eventos_cambios_colaboradores(comunidad_id);
            """)
        
        # Agregar region_id si no existe
        if 'region_id' not in existing_columns:
            cursor.execute("""
                ALTER TABLE eventos_cambios_colaboradores
                ADD COLUMN region_id UUID REFERENCES regiones(id) ON DELETE SET NULL;
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_eventos_cambios_colab_region 
                ON eventos_cambios_colaboradores(region_id);
            """)


def remove_comunidad_region_fields(apps, schema_editor):
    """Elimina las columnas comunidad_id y region_id si existen"""
    db_alias = schema_editor.connection.alias
    
    with schema_editor.connection.cursor() as cursor:
        # Verificar si las columnas existen antes de eliminarlas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'eventos_cambios_colaboradores' 
            AND column_name IN ('comunidad_id', 'region_id');
        """)
        
        existing_columns = {row[0] for row in cursor.fetchall()}
        
        # Eliminar índices primero
        if 'comunidad_id' in existing_columns:
            cursor.execute("""
                DROP INDEX IF EXISTS idx_eventos_cambios_colab_comunidad;
            """)
            cursor.execute("""
                ALTER TABLE eventos_cambios_colaboradores
                DROP COLUMN IF EXISTS comunidad_id;
            """)
        
        if 'region_id' in existing_columns:
            cursor.execute("""
                DROP INDEX IF EXISTS idx_eventos_cambios_colab_region;
            """)
            cursor.execute("""
                ALTER TABLE eventos_cambios_colaboradores
                DROP COLUMN IF EXISTS region_id;
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('webmaga', '0008_merge_20251111_1243'),
    ]

    operations = [
        migrations.RunPython(
            add_comunidad_region_fields_if_not_exists,
            remove_comunidad_region_fields,
        ),
    ]

