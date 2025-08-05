-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-08-2025 a las 19:00:46
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `empresa_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `administrador`
--

CREATE TABLE `administrador` (
  `admin_id` int(11) NOT NULL,
  `Correo` varchar(255) NOT NULL,
  `Clave` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `administrador`
--

INSERT INTO `administrador` (`admin_id`, `Correo`, `Clave`) VALUES
(3, 'admin12@gmail.com', 'admin1234');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleado`
--

CREATE TABLE `empleado` (
  `empleado_id` int(11) NOT NULL,
  `Correo_emp` varchar(255) NOT NULL,
  `Turno_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empleado`
--

INSERT INTO `empleado` (`empleado_id`, `Correo_emp`, `Turno_id`) VALUES
(1, 'luis@empresa.com', 1),
(2, 'empleado23@empresa.com', 2),
(3, 'empleado2@empresa.com', 3),
(4, 'operador@empresa.com', 4),
(5, 'empleado1@empresa.com', 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_turnos`
--

CREATE TABLE `historial_turnos` (
  `id` int(11) NOT NULL,
  `empleado_email` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` time DEFAULT NULL,
  `hora_salida` time DEFAULT NULL,
  `break1_salida` time DEFAULT NULL,
  `break1_entrada` time DEFAULT NULL,
  `almuerzo_salida` time DEFAULT NULL,
  `almuerzo_entrada` time DEFAULT NULL,
  `break2_salida` time DEFAULT NULL,
  `break2_entrada` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial_turnos`
--

INSERT INTO `historial_turnos` (`id`, `empleado_email`, `fecha`, `hora_entrada`, `hora_salida`, `break1_salida`, `break1_entrada`, `almuerzo_salida`, `almuerzo_entrada`, `break2_salida`, `break2_entrada`) VALUES
(1, 'empleado23@empresa.com', '2025-07-25', '09:43:32', '09:43:33', '09:43:34', '09:43:35', '09:43:36', '09:43:36', '09:43:37', '09:43:38'),
(4, 'luis@empresa.com', '2025-07-25', '10:23:42', '10:23:43', '10:23:44', '10:23:45', '10:23:46', '10:23:47', '10:23:47', '10:23:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `info_sesion`
--

CREATE TABLE `info_sesion` (
  `empleado_id` int(11) NOT NULL,
  `dispositivo` varchar(50) NOT NULL,
  `direccion_ip` text NOT NULL,
  `ubicacion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turno`
--

CREATE TABLE `turno` (
  `Turno_id` int(11) NOT NULL,
  `Hora_Entrada` time DEFAULT NULL,
  `Hora_Salida_break` time DEFAULT NULL,
  `Hora_Entrada_break` time DEFAULT NULL,
  `Hora_Salida_almuerzo` time DEFAULT NULL,
  `Hora_Entrada_almuerzo` time DEFAULT NULL,
  `Hora_Salida_break2` time DEFAULT NULL,
  `Hora_Entrada_break2` time DEFAULT NULL,
  `Hora_Salida` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `turno`
--

INSERT INTO `turno` (`Turno_id`, `Hora_Entrada`, `Hora_Salida_break`, `Hora_Entrada_break`, `Hora_Salida_almuerzo`, `Hora_Entrada_almuerzo`, `Hora_Salida_break2`, `Hora_Entrada_break2`, `Hora_Salida`) VALUES
(1, '09:46:41', '09:46:49', '09:46:49', '09:46:51', '09:46:51', '09:46:52', '09:46:53', '09:46:54'),
(2, '10:23:42', '10:23:44', '10:23:45', '10:23:46', '10:23:47', '10:23:47', '10:23:48', '10:23:43'),
(3, '08:44:19', '08:44:24', '08:44:25', '08:44:32', '08:44:33', '08:44:34', '08:44:35', '08:44:46'),
(4, NULL, NULL, NULL, NULL, NULL, '00:00:00', '00:00:00', NULL),
(5, NULL, NULL, NULL, NULL, NULL, '00:00:00', '00:00:00', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `administrador`
--
ALTER TABLE `administrador`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indices de la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD PRIMARY KEY (`empleado_id`),
  ADD UNIQUE KEY `Correo_emp` (`Correo_emp`),
  ADD KEY `Turno_id` (`Turno_id`);

--
-- Indices de la tabla `historial_turnos`
--
ALTER TABLE `historial_turnos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `info_sesion`
--
ALTER TABLE `info_sesion`
  ADD UNIQUE KEY `empleado_id` (`empleado_id`);

--
-- Indices de la tabla `turno`
--
ALTER TABLE `turno`
  ADD PRIMARY KEY (`Turno_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `administrador`
--
ALTER TABLE `administrador`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `empleado`
--
ALTER TABLE `empleado`
  MODIFY `empleado_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `historial_turnos`
--
ALTER TABLE `historial_turnos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `turno`
--
ALTER TABLE `turno`
  MODIFY `Turno_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`Turno_id`) REFERENCES `turno` (`Turno_id`);

--
-- Filtros para la tabla `info_sesion`
--
ALTER TABLE `info_sesion`
  ADD CONSTRAINT `info_sesion_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`empleado_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
