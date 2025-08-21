-- Primero, eliminamos la clave primaria actual si existe
ALTER TABLE historial_turnos DROP PRIMARY KEY;

-- Luego, agregamos la nueva clave primaria compuesta
ALTER TABLE historial_turnos ADD PRIMARY KEY (empleado_email, fecha);
