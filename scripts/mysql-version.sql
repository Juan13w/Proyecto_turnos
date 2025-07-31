-- Versión para MySQL/MariaDB de la base de datos proyecto_turnos

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS proyecto_turnos;
USE proyecto_turnos;

-- Tabla turno
CREATE TABLE turno (
  id_turno_pk INT AUTO_INCREMENT PRIMARY KEY,
  hora_entrada TIME,
  hora_salida_break TIME,
  hora_entrada_break TIME,
  hora_salida_almuerzo TIME,
  hora_entrada_almuerzo TIME,
  hora_salida TIME
);

-- Tabla sede
CREATE TABLE sede (
  id_sede_pk INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  direccion_ip VARCHAR(255) NOT NULL,
  turno_id INT,
  FOREIGN KEY (turno_id) REFERENCES turno(id_turno_pk)
);

-- Tabla empleado
CREATE TABLE empleado (
  id_empleado_pk INT AUTO_INCREMENT PRIMARY KEY,
  correo_emp VARCHAR(255) NOT NULL UNIQUE,
  direccion_ip VARCHAR(255) NOT NULL,
  turno_id INT,
  sede_id INT,
  FOREIGN KEY (turno_id) REFERENCES turno(id_turno_pk),
  FOREIGN KEY (sede_id) REFERENCES sede(id_sede_pk)
);

-- Tabla administrador
CREATE TABLE administrador (
  id_admin_pk INT PRIMARY KEY,
  correo VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_admin_pk) REFERENCES empleado(id_empleado_pk)
);

-- Tabla registro_horario
CREATE TABLE registro_horario (
  id_registro_pk INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT,
  tipo VARCHAR(50),
  hora TIME,
  fecha DATE,
  FOREIGN KEY (empleado_id) REFERENCES empleado(id_empleado_pk)
);

-- Insertar datos de ejemplo
INSERT INTO turno (hora_entrada, hora_salida_break, hora_entrada_break, hora_salida_almuerzo, hora_entrada_almuerzo, hora_salida) VALUES
('08:00:00', '10:00:00', '10:15:00', '12:00:00', '13:00:00', '17:00:00'),
('14:00:00', '16:00:00', '16:15:00', '18:00:00', '19:00:00', '22:00:00'),
('22:00:00', '00:00:00', '00:15:00', '02:00:00', '03:00:00', '06:00:00');

INSERT INTO sede (nombre, direccion_ip, turno_id) VALUES
('Sede Central', '192.168.1.100', 1),
('Sede Norte', '192.168.2.100', 1),
('Sede Sur', '192.168.3.100', 2),
('Sede Este', '192.168.4.100', 2),
('Sede Oeste', '192.168.5.100', 3);

INSERT INTO empleado (correo_emp, direccion_ip, turno_id, sede_id) VALUES
('admin@empresa.com', '192.168.1.101', 1, 1),
('empleado1@empresa.com', '192.168.1.102', 1, 1),
('empleado2@empresa.com', '192.168.2.102', 1, 2),
('supervisor@empresa.com', '192.168.3.102', 2, 3),
('gerente@empresa.com', '192.168.1.103', 1, 1),
('operador@empresa.com', '192.168.4.102', 2, 4);

INSERT INTO administrador (id_admin_pk, correo) VALUES
(1, 'admin@empresa.com'),
(5, 'gerente@empresa.com');
