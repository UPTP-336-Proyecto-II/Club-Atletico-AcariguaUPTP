-- Script SQL para Sistema de Categorías Fijas
-- Ejecutar en phpMyAdmin o MySQL

-- 1. Agregar columna estatus a la tabla categoria
ALTER TABLE categoria ADD COLUMN estatus ENUM('Activa', 'Inactiva') DEFAULT 'Activa';

-- 2. Actualizar rangos de edad correctos en categorías existentes
UPDATE categoria SET edad_min = 5, edad_max = 7 WHERE nombre_categoria = 'Sub 7';
UPDATE categoria SET edad_min = 7, edad_max = 9 WHERE nombre_categoria = 'Sub 9';
UPDATE categoria SET edad_min = 9, edad_max = 11 WHERE nombre_categoria = 'Sub 11';
UPDATE categoria SET edad_min = 13, edad_max = 15 WHERE nombre_categoria = 'Sub 15';

-- 3. Insertar categorías faltantes (ignorar si ya existen)
INSERT IGNORE INTO categoria (nombre_categoria, edad_min, edad_max, estatus) VALUES 
('Sub 13', 11, 13, 'Activa'),
('Sub 17', 15, 17, 'Activa'),
('Sub 20', 17, 20, 'Activa');

-- 4. Verificar resultado
SELECT * FROM categoria ORDER BY edad_min;
