-- Poblar la base de datos empresa_db con datos de ejemplo

-- Insertar turnos
INSERT INTO turno (Hora_Entrada, Hora_Salida_break, Hora_Entrada_break, Hora_Salida_almuerzo, Hora_Entrada_almuerzo, Hora_Salida) VALUES
('08:00:00', '10:00:00', '10:15:00', '12:00:00', '13:00:00', '17:00:00'),
('14:00:00', '16:00:00', '16:15:00', '18:00:00', '19:00:00', '22:00:00'),
('22:00:00', '00:00:00', '00:15:00', '02:00:00', '03:00:00', '06:00:00');

-- Insertar sedes
INSERT INTO sede (Nombre, Direccion_IP, Turno_id) VALUES
('Sede Central', '192.168.1.100', 1),
('Sede Norte', '192.168.2.100', 1),
('Sede Sur', '192.168.3.100', 2),
('Sede Este', '192.168.4.100', 2),
('Sede Oeste', '192.168.5.100', 3);

-- Insertar empleados de ejemplo
INSERT INTO empleado (Correo_emp, Direccion_ip, Turno_id, Sede_id) VALUES
('admin@empresa.com', '192.168.1.101', 1, 1),
('empleado1@empresa.com', '192.168.1.102', 1, 1),
('empleado2@empresa.com', '192.168.2.102', 1, 2),
('supervisor@empresa.com', '192.168.3.102', 2, 3),
('gerente@empresa.com', '192.168.1.103', 1, 1),
('operador@empresa.com', '192.168.4.102', 2, 4);

-- Insertar administradores
INSERT INTO administrador (Id_admin_PK, Correo) VALUES
(1, 'admin@empresa.com'),
(5, 'gerente@empresa.com');
