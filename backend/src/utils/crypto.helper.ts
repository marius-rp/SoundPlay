import crypto from "crypto"
import { logger } from "./logger.helper"

const ALGORITHM = "aes-256-cbc"
const FILE_NAME = "crypto.helper.ts"
const ENCRYPTION_KEY = process.env.PROXY_ENCRYPTION_KEY

export const cryptoHelper = {
  encrypt: (text?: string | null): string | null => {
    if (!text) return null

    try {
      if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
        throw new Error("La clé ENCRYPTION_KEY doit faire 32 caractères.")
      }

      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(String(ENCRYPTION_KEY)),
        iv,
      )

      let encrypted = cipher.update(text)
      encrypted = Buffer.concat([encrypted, cipher.final()])

      return `${iv.toString("hex")}:${encrypted.toString("hex")}`
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur de chiffrement : ${error.message}`,
      )
      return null
    }
  },

  decrypt: (text?: string | null): string | null => {
    if (!text) return null

    try {
      const textParts = text.split(":")

      if (textParts.length !== 2) return text

      if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
        throw new Error("La clé ENCRYPTION_KEY doit faire 32 caractères.")
      }

      const iv = Buffer.from(textParts.shift() as string, "hex")
      const encryptedText = Buffer.from(textParts.join(":"), "hex")
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(String(ENCRYPTION_KEY)),
        iv,
      )

      let decrypted = decipher.update(encryptedText)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      return decrypted.toString()
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "WARN",
        `Échec du déchiffrement (clé invalide ou texte brut) : ${error.message}`,
      )
      return text
    }
  },
}
