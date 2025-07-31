-- Usar la nueva base de datos
USE sistema_turnos_empresa;

-- Insertar turnos
INSERT INTO turno (hora_entrada, hora_salida_break, hora_entrada_break, hora_salida_almuerzo, hora_entrada_almuerzo, hora_salida) VALUES
('08:00:00', '10:00:00', '10:15:00', '12:00:00', '13:00:00', '17:00:00'),
('14:00:00', '16:00:00', '16:15:00', '18:00:00', '19:00:00', '22:00:00'),
('22:00:00', '00:00:00', '00:15:00', '02:00:00', '03:00:00', '06:00:00');

-- Insertar sedes
INSERT INTO sede (nombre, direccion_ip, turno_id) VALUES
('Sede Central', '192.168.1.100', 1),
('Sede Norte', '192.168.2.100', 1),
('Sede Sur', '192.168.3.100', 2),
('Sede Este', '192.168.4.100', 2),
('Sede Oeste', '192.168.5.100', 3);

-- Insertar empleados de ejemplo
INSERT INTO empleado (correo_emp, direccion_ip, turno_id, sede_id) VALUES
('admin@empresa.com', '192.168.1.101', 1, 1),
('empleado1@empresa.com', '192.168.1.102', 1, 1),
('empleado2@empresa.com', '192.168.2.102', 1, 2),
('supervisor@empresa.com', '192.168.3.102', 2, 3);

-- Insertar administradores
INSERT INTO administrador (id_admin_pk, correo) VALUES
(1, 'admin@empresa.com');
