-- ============================================
-- MIGRACIÓN DE DIRECCIONES - CLUB ATLÉTICO
-- ============================================

-- PASO 1: Modificar tabla 'direcciones' agregando nuevas columnas
ALTER TABLE direcciones 
ADD COLUMN pais VARCHAR(50) DEFAULT 'Venezuela',
ADD COLUMN estado VARCHAR(50),
ADD COLUMN municipio VARCHAR(50),
ADD COLUMN parroquia VARCHAR(50),
ADD COLUMN descripcion_descriptiva VARCHAR(255);

-- PASO 2: Agregar columna direccion_id a la tabla 'plantel'
ALTER TABLE plantel 
ADD COLUMN direccion_id INT NULL,
ADD CONSTRAINT fk_plantel_direccion 
    FOREIGN KEY (direccion_id) REFERENCES direcciones(direccion_id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- PASO 3: Agregar columna direccion_id a la tabla 'tutor'
ALTER TABLE tutor 
ADD COLUMN direccion_id INT NULL,
ADD CONSTRAINT fk_tutor_direccion 
    FOREIGN KEY (direccion_id) REFERENCES direcciones(direccion_id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- PASO 4: Eliminar restricciones de clave foránea antes de borrar tablas
-- Primero eliminamos la FK que conecta direcciones con parroquias
ALTER TABLE direcciones DROP FOREIGN KEY direcciones_ibfk_1;
-- Si el nombre del constraint es diferente, usa este comando para encontrarlo:
-- SHOW CREATE TABLE direcciones;

-- PASO 5: Ahora sí podemos eliminar las tablas auxiliares
DROP TABLE IF EXISTS parroquias;
DROP TABLE IF EXISTS municipios;

-- ============================================
-- OPCIONAL: Limpieza de columnas antiguas
-- (Ejecutar SOLO después de verificar que todo funciona)
-- ============================================
-- ALTER TABLE direcciones DROP COLUMN localidad;
-- ALTER TABLE direcciones DROP COLUMN `direccion_casa/apto`;
-- ALTER TABLE direcciones DROP COLUMN parroquias_id;
-- ALTER TABLE plantel DROP COLUMN dirreccion;
-- ALTER TABLE tutor DROP COLUMN direccion;
