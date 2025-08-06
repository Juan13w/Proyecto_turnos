-- Agregar columna de plataforma
ALTER TABLE info_sesion 
ADD COLUMN plataforma VARCHAR(100) NULL AFTER direccion_ip,
ADD COLUMN fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER ubicacion;

-- Actualizar la columna dispositivo para permitir más caracteres
ALTER TABLE info_sesion 
MODIFY COLUMN dispositivo TEXT;
