import mysql, { type Pool } from "mysql2/promise"
import dotenv from "dotenv"
import { logger } from "../../utils/logger.helper"

dotenv.config()

const FILE_NAME = "db.ts"

const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection()
    logger("SYSTEM", FILE_NAME, "INFO", "Connexion à MySQL réussie.")
    connection.release()
  } catch (err: any) {
    logger(
      "SYSTEM",
      FILE_NAME,
      "ERROR",
      `Échec de la connexion à la base de données : ${err.message}`,
    )
    throw err
  }
}

export default pool
