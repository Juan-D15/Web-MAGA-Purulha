-- =====================================================
-- SCRIPT: TABLA DE FOTOS DE PERFIL DE USUARIOS
-- =====================================================
-- Esta tabla almacena las fotos de perfil de los usuarios del sistema
-- Se vincula con la tabla usuarios mediante una relación uno a uno

-- TABLA: FOTOS DE PERFIL
CREATE TABLE IF NOT EXISTS usuario_fotos_perfil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_tipo VARCHAR(100),
    archivo_tamanio BIGINT,
    url_almacenamiento TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_fotos_perfil_usuario ON usuario_fotos_perfil(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_fotos_perfil_creado_en ON usuario_fotos_perfil(creado_en DESC);

-- Comentarios
COMMENT ON TABLE usuario_fotos_perfil IS 'Fotos de perfil de usuarios del sistema';
COMMENT ON COLUMN usuario_fotos_perfil.usuario_id IS 'Referencia única al usuario. Solo puede haber una foto por usuario.';
COMMENT ON COLUMN usuario_fotos_perfil.url_almacenamiento IS 'Ruta completa del archivo en el sistema de archivos (ej: /media/perfiles_img/...)';
COMMENT ON COLUMN usuario_fotos_perfil.archivo_nombre IS 'Nombre original del archivo subido';
COMMENT ON COLUMN usuario_fotos_perfil.archivo_tipo IS 'Tipo MIME del archivo (ej: image/jpeg, image/png)';
COMMENT ON COLUMN usuario_fotos_perfil.archivo_tamanio IS 'Tamaño del archivo en bytes';

-- Trigger para actualizar timestamp
CREATE TRIGGER trg_usuario_fotos_perfil_timestamp 
    BEFORE UPDATE ON usuario_fotos_perfil
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. La relación es UNO A UNO (UNIQUE) porque cada usuario solo puede tener una foto de perfil
-- 2. Si se elimina un usuario, su foto también se elimina (ON DELETE CASCADE)
-- 3. Los archivos deben almacenarse en la carpeta: /media/perfiles_img/
-- 4. Formato recomendado de nombre de archivo: timestamp_usuario_id.extension
-- 5. Tipos de archivo permitidos: JPEG, PNG, GIF, WEBP (validar en el backend)
-- 6. Tamaño máximo recomendado: 5MB (validar en el backend)

