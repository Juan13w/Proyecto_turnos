-- Agrega la columna maps_url a info_sesion y la rellena cuando existan coordenadas

-- 1) Añadir columna si no existe
ALTER TABLE info_sesion 
  ADD COLUMN IF NOT EXISTS maps_url VARCHAR(255) NULL DEFAULT NULL;

-- 2) Rellenar maps_url para filas existentes con latitud/longitud
UPDATE info_sesion
SET maps_url = CONCAT('https://www.google.com/maps?q=', latitud, ',', longitud)
WHERE maps_url IS NULL AND latitud IS NOT NULL AND longitud IS NOT NULL;

-- 3) Índice útil (opcional) para consultas por empleado
-- CREATE INDEX IF NOT EXISTS idx_info_sesion_empleado_id ON info_sesion (empleado_id);

