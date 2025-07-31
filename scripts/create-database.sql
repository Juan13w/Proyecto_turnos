-- Crear la base de datos empresa_db manteniendo la estructura exacta original

-- Tabla turno
CREATE TABLE turno (
  Id_turno_PK SERIAL PRIMARY KEY,
  Hora_Entrada TIME,
  Hora_Salida_break TIME,
  Hora_Entrada_break TIME,
  Hora_Salida_almuerzo TIME,
  Hora_Entrada_almuerzo TIME,
  Hora_Salida TIME
);

-- Tabla sede
CREATE TABLE sede (
  Id_sede_PK SERIAL PRIMARY KEY,
  Nombre VARCHAR(255) NOT NULL,
  Direccion_IP VARCHAR(255) NOT NULL,
  Turno_id INTEGER REFERENCES turno(Id_turno_PK)
);

-- Tabla empleado
CREATE TABLE empleado (
  Id_empleado_PK SERIAL PRIMARY KEY,
  Correo_emp VARCHAR(255) NOT NULL UNIQUE,
  Direccion_ip VARCHAR(255) NOT NULL,
  Turno_id INTEGER REFERENCES turno(Id_turno_PK),
  Sede_id INTEGER REFERENCES sede(Id_sede_PK)
);

-- Tabla administrador
CREATE TABLE administrador (
  Id_admin_PK INTEGER PRIMARY KEY REFERENCES empleado(Id_empleado_PK),
  Correo VARCHAR(255) NOT NULL
);

-- Tabla registro_horario
CREATE TABLE registro_horario (
  Id_registro_PK SERIAL PRIMARY KEY,
  Empleado_id INTEGER REFERENCES empleado(Id_empleado_PK),
  Tipo VARCHAR(50),
  Hora TIME,
  Fecha DATE
);
