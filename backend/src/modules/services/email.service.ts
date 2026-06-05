import nodemailer from "nodemailer"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "email.service.ts"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const emailService = {
  send: async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
      const text = `Bonjour, pour valider votre action sur SoundPlay, veuillez copier ce lien dans votre navigateur : ${html.match(/href="([^"]*)"/)?.[1] || "lien expiré"}. Ce message est automatique, merci de ne pas y répondre.`

      await transporter.sendMail({
        from: `"SoundPlay" <${process.env.EMAIL_SOUNDPLAY}>`,
        to,
        subject,
        html,
        text,
        headers: {
          "X-Priority": "3 (Normal)",
          "X-Mailer": "SoundPlay-System",
        },
      })

      logger("SYSTEM", FILE_NAME, "INFO", `E-mail envoyé à : ${to}`)
      return true
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Échec envoi à ${to} : ${error.message}`,
      )
      return false
    }
  },

  sendVerificationEmail: async (
    to: string,
    userLogin: string,
    verificationLink: string,
  ): Promise<boolean> => {
    const subject = "Confirmation de votre adresse e-mail - SoundPlay"
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #333333; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #1ed760;">Liaison de compte SoundPlay</h2>
        <p>Bonjour <strong>${userLogin}</strong>,</p>
        <p>Vous avez demandé à lier votre adresse e-mail <em>${to}</em> à votre compte SoundPlay.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verificationLink}" alt="Confirmer mon e-mail" style="background-color: #1ed760; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 50px; display: inline-block;">
            CONFIRMER MON E-MAIL
          </a>
        </div>
        <p style="font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #777;">SoundPlay - ${new Date().getFullYear()}<br>
        Vous recevez cet e-mail car une action a été initiée sur votre compte.</p>
      </div>
    `
    return await emailService.send(to, subject, html)
  },
}
