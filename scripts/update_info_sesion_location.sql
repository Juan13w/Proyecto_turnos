-- Primero, eliminamos la restricción de clave foránea si existe
ALTER TABLE info_sesion DROP FOREIGN KEY IF EXISTS info_sesion_ibfk_1;

-- Eliminamos el índice único en empleado_id
ALTER TABLE info_sesion DROP INDEX IF EXISTS empleado_id;

-- Renombramos la tabla antigua por si necesitamos hacer rollback
RENAME TABLE info_sesion TO info_sesion_old;

-- Creamos la nueva tabla con la estructura actualizada
CREATE TABLE `info_sesion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empleado_id` int(11) NOT NULL,
  `dispositivo` varchar(50) NOT NULL,
  `direccion_ip` text NOT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `fecha_acceso` timestamp NOT NULL DEFAULT current_timestamp(),
  `ubicacion` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`),
  CONSTRAINT `info_sesion_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`empleado_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insertamos los datos existentes en la nueva tabla
INSERT INTO info_sesion (empleado_id, dispositivo, direccion_ip, ubicacion, fecha_acceso)
SELECT empleado_id, dispositivo, direccion_ip, ubicacion, NOW() 
FROM info_sesion_old;

-- Opcional: Eliminar la tabla antigua si todo salió bien
-- DROP TABLE IF EXISTS info_sesion_old;
