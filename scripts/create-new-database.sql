-- Crear nueva base de datos con el nombre que prefieras
CREATE DATABASE sistema_turnos_empresa;
USE sistema_turnos_empresa;

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
