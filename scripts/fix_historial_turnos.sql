-- Primero, eliminamos la clave primaria actual si existe
ALTER TABLE historial_turnos DROP PRIMARY KEY;

-- Luego, agregamos la nueva clave primaria compuesta
ALTER TABLE historial_turnos ADD PRIMARY KEY (empleado_email, fecha);

-- Aseguramos que no haya duplicados antes de agregar la clave única
-- Primero, eliminamos registros duplicados dejando solo el más reciente
DELETE t1 FROM historial_turnos t1
INNER JOIN (
    SELECT empleado_email, fecha, MAX(id) as max_id
    FROM historial_turnos
    GROUP BY empleado_email, fecha
    HAVING COUNT(*) > 1
) t2 ON t1.empleado_email = t2.empleado_email 
    AND t1.fecha = t2.fecha 
    AND t1.id < t2.max_id;
