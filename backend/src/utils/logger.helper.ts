import fs from "fs"
import path from "path"

const logDir = path.resolve(process.cwd(), "logs")
const logFile = path.join(logDir, "server.log")
const FILE_NAME = "logger.helper.ts"
const MAX_DAYS = 30

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const cleanOldLogs = () => {
  try {
    const files = fs.readdirSync(logDir)
    const now = Date.now()
    const msPerDay = 24 * 60 * 60 * 1000

    files.forEach((file) => {
      if (file === "server.log") return

      const filePath = path.join(logDir, file)
      const stats = fs.statSync(filePath)
      const ageInDays = (now - stats.mtimeMs) / msPerDay

      if (ageInDays > MAX_DAYS) {
        fs.unlinkSync(filePath)
        console.log(
          `\x1b[33m[INFO] [${FILE_NAME}]\x1b[0m Archive supprimée (plus de ${MAX_DAYS} jours) : ${file}`,
        )
      }
    })
  } catch (err: any) {
    console.log(
      `\x1b[31m[ERROR] [${FILE_NAME}]\x1b[0m Erreur lors du nettoyage : ${err.message}`,
    )
  }
}

const rotateLogFile = () => {
  if (!fs.existsSync(logFile)) return

  try {
    const stats = fs.statSync(logFile)
    const lastModified = new Date(stats.mtime)
    const today = new Date()

    if (
      lastModified.getDate() !== today.getDate() ||
      lastModified.getMonth() !== today.getMonth() ||
      lastModified.getFullYear() !== today.getFullYear()
    ) {
      const dateString = lastModified.toISOString().split("T")[0]
      const archivePath = path.join(logDir, `server-${dateString}.log`)

      fs.renameSync(logFile, archivePath)
      cleanOldLogs()

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Archive créée : server-${dateString}.log (Nettoyage effectué)`,
      )
    }
  } catch (err: any) {
    console.log(
      `\x1b[31m[ERROR] [${FILE_NAME}]\x1b[0m Erreur rotation: ${err.message}`,
    )
  }
}

const padCenter = (text: string, length: number) => {
  if (text.length >= length) return text
  const leftPadding = Math.floor((length - text.length) / 2)
  return text.padStart(text.length + leftPadding, " ").padEnd(length, " ")
}

export const logger = (
  userId: string | number | "SYSTEM",
  source: string,
  level: "INFO" | "WARN" | "ERROR" | "LOG",
  message: any,
) => {
  if (source !== FILE_NAME) {
    rotateLogFile()
  }

  const now = new Date().toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  })

  const cleanMessage =
    message instanceof Error
      ? message.stack
      : typeof message === "object"
        ? JSON.stringify(message)
        : message

  const centeredUser = padCenter(String(userId), 6)
  const centeredSource = padCenter(source, 20)

  const logEntry = `[${now}] [${level}] [User:${centeredUser}] [${centeredSource}] -> ${cleanMessage}\n`

  fs.appendFile(logFile, logEntry, (err) => {
    if (err && source !== FILE_NAME) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Impossible d'écrire dans le fichier log: ${err.message}`,
      )
    }
  })

  const colors = {
    INFO: "\x1b[32m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
    LOG: "\x1b[36m",
  }
  const reset = "\x1b[0m"
  console.log(
    `${colors[level] || ""}[${level}] [${source}]${reset} ${cleanMessage}`,
  )
}
