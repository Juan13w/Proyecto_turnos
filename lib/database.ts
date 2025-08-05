import mysql from 'mysql2/promise'

// Validar variables de entorno necesarias
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

// Crear pool de conexiones MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME!,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Función helper para ejecutar queries con sintaxis similar a Neon
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  let query = strings[0]
  for (let i = 0; i < values.length; i++) {
    query += '?' + strings[i + 1]
  }
  
  const [rows] = await pool.execute(query, values)
  return rows as any[]
}

export { pool }

// Tipos TypeScript para la base de datos empresa_db - Estructura exacta original
export interface Turno {
  Id_turno_PK: number
  Hora_Entrada: string
  Hora_Salida_break: string
  Hora_Entrada_break: string
  Hora_Salida_almuerzo: string
  Hora_Entrada_almuerzo: string
  Hora_Salida: string
}

export interface Sede {
  Id_sede_PK: number
  Nombre: string
  Direccion_IP: string
  Turno_id: number
}

export interface Empleado {
  empleado_id: number
  Correo_emp: string
  Turno_id: number
}

export interface RegistroHorario {
  Id_registro_PK: number
  Empleado_id: number
  Tipo: string
  Hora: string
  Fecha: string
}

export interface Administrador {
  admin_id: number
  Correo: string
  Clave: string
}
