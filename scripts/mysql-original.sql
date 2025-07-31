-- Archivo SQL original para MySQL/MariaDB - Base de datos: empresa_db

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS empresa_db;
USE empresa_db;

-- Estructura de tabla para la tabla `administrador`
CREATE TABLE `administrador` (
  `Id_admin_PK` int(11) NOT NULL,
  `Correo` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Estructura de tabla para la tabla `empleado`
CREATE TABLE `empleado` (
  `Id_empleado_PK` int(11) NOT NULL,
  `Correo_emp` varchar(255) NOT NULL,
  `Direccion_ip` varchar(255) NOT NULL,
  `Turno_id` int(11) DEFAULT NULL,
  `Sede_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Estructura de tabla para la tabla `registro_horario`
CREATE TABLE `registro_horario` (
  `Id_registro_PK` int(11) NOT NULL,
  `Empleado_id` int(11) DEFAULT NULL,
  `Tipo` varchar(50) DEFAULT NULL,
  `Hora` time DEFAULT NULL,
  `Fecha` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Estructura de tabla para la tabla `sede`
CREATE TABLE `sede` (
  `Id_sede_PK` int(11) NOT NULL,
  `Nombre` varchar(255) NOT NULL,
  `Direccion_IP` varchar(255) NOT NULL,
  `Turno_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Estructura de tabla para la tabla `turno`
CREATE TABLE `turno` (
  `Id_turno_PK` int(11) NOT NULL,
  `Hora_Entrada` time DEFAULT NULL,
  `Hora_Salida_break` time DEFAULT NULL,
  `Hora_Entrada_break` time DEFAULT NULL,
  `Hora_Salida_almuerzo` time DEFAULT NULL,
  `Hora_Entrada_almuerzo` time DEFAULT NULL,
  `Hora_Salida` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Índices para tablas volcadas
ALTER TABLE `administrador` ADD PRIMARY KEY (`Id_admin_PK`);
ALTER TABLE `empleado` ADD PRIMARY KEY (`Id_empleado_PK`), ADD KEY `Turno_id` (`Turno_id`), ADD KEY `Sede_id` (`Sede_id`);
ALTER TABLE `registro_horario` ADD PRIMARY KEY (`Id_registro_PK`), ADD KEY `Empleado_id` (`Empleado_id`);
ALTER TABLE `sede` ADD PRIMARY KEY (`Id_sede_PK`), ADD KEY `Turno_id` (`Turno_id`);
ALTER TABLE `turno` ADD PRIMARY KEY (`Id_turno_PK`);

-- AUTO_INCREMENT de las tablas volcadas
ALTER TABLE `empleado` MODIFY `Id_empleado_PK` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `registro_horario` MODIFY `Id_registro_PK` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `sede` MODIFY `Id_sede_PK` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `turno` MODIFY `Id_turno_PK` int(11) NOT NULL AUTO_INCREMENT;

-- Restricciones para tablas volcadas
ALTER TABLE `administrador` ADD CONSTRAINT `administrador_ibfk_1` FOREIGN KEY (`Id_admin_PK`) REFERENCES `empleado` (`Id_empleado_PK`);
ALTER TABLE `empleado` ADD CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`Turno_id`) REFERENCES `turno` (`Id_turno_PK`), ADD CONSTRAINT `empleado_ibfk_2` FOREIGN KEY (`Sede_id`) REFERENCES `sede` (`Id_sede_PK`);
ALTER TABLE `registro_horario` ADD CONSTRAINT `registro_horario_ibfk_1` FOREIGN KEY (`Empleado_id`) REFERENCES `empleado` (`Id_empleado_PK`);
ALTER TABLE `sede` ADD CONSTRAINT `sede_ibfk_1` FOREIGN KEY (`Turno_id`) REFERENCES `turno` (`Id_turno_PK`);

-- Insertar datos de ejemplo
INSERT INTO turno (Hora_Entrada, Hora_Salida_break, Hora_Entrada_break, Hora_Salida_almuerzo, Hora_Entrada_almuerzo, Hora_Salida) VALUES
('08:00:00', '10:00:00', '10:15:00', '12:00:00', '13:00:00', '17:00:00'),
('14:00:00', '16:00:00', '16:15:00', '18:00:00', '19:00:00', '22:00:00'),
('22:00:00', '00:00:00', '00:15:00', '02:00:00', '03:00:00', '06:00:00');

INSERT INTO sede (Nombre, Direccion_IP, Turno_id) VALUES
('Sede Central', '192.168.1.100', 1),
('Sede Norte', '192.168.2.100', 1),
('Sede Sur', '192.168.3.100', 2),
('Sede Este', '192.168.4.100', 2),
('Sede Oeste', '192.168.5.100', 3);

INSERT INTO empleado (Correo_emp, Direccion_ip, Turno_id, Sede_id) VALUES
('admin@empresa.com', '192.168.1.101', 1, 1),
('empleado1@empresa.com', '192.168.1.102', 1, 1),
('empleado2@empresa.com', '192.168.2.102', 1, 2),
('supervisor@empresa.com', '192.168.3.102', 2, 3),
('gerente@empresa.com', '192.168.1.103', 1, 1),
('operador@empresa.com', '192.168.4.102', 2, 4);

INSERT INTO administrador (Id_admin_PK, Correo) VALUES
(1, 'admin@empresa.com'),
(5, 'gerente@empresa.com');

COMMIT;
