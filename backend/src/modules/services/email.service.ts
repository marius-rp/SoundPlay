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

const generateEmailLayout = (content: string): string => {
  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #333333; border: 1px solid #ddd; border-radius: 8px;">
      ${content}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 11px; color: #777; text-align: center;">
        SoundPlay - ${new Date().getFullYear()}<br>
        Vous recevez cet e-mail car une action a été initiée sur votre compte.
      </p>
    </div>
  `
}

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
    const innerContent = `
      <h2 style="color: #1ed760;">Liaison de compte SoundPlay</h2>
      <p>Bonjour <strong>${userLogin}</strong>,</p>
      <p>Vous avez demandé à lier votre adresse e-mail <em>${to}</em> à votre compte SoundPlay.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${verificationLink}" alt="Confirmer mon e-mail" style="background-color: #1ed760; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 50px; display: inline-block;">
          CONFIRMER MON E-MAIL
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    `
    return await emailService.send(
      to,
      subject,
      generateEmailLayout(innerContent),
    )
  },

  sendResetPasswordEmail: async (
    to: string,
    userLogin: string,
    resetLink: string,
  ): Promise<boolean> => {
    const subject = "Réinitialisation de votre mot de passe - SoundPlay"
    const innerContent = `
      <h2 style="color: #1ed760;">Réinitialisation de mot de passe</h2>
      <p>Bonjour <strong>${userLogin}</strong>,</p>
      <p>Vous avez demandé à réinitialiser le mot de passe de votre compte SoundPlay.</p>
      <p>Cliquez sur le bouton ci-dessous pour configurer un nouveau mot de passe. Ce lien est valable pendant 15 minutes.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: #1ed760; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 50px; display: inline-block;">
          RÉINITIALISER MON MOT DE PASSE
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité. Votre mot de passe actuel restera inchangé.</p>
    `
    return await emailService.send(
      to,
      subject,
      generateEmailLayout(innerContent),
    )
  },

  sendRecoverLoginEmail: async (
    to: string,
    login: string,
  ): Promise<boolean> => {
    const subject = "Récupération de votre identifiant - SoundPlay"
    const innerContent = `
      <h2 style="color: #1ed760;">Récupération de login</h2>
      <p>Bonjour,</p>
      <p>Une demande de récupération de votre identifiant SoundPlay a été effectuée pour cette adresse e-mail.</p>
      <p>Votre identifiant est : <strong>${login}</strong></p>
      <p style="font-size: 14px; color: #666;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
    `
    return await emailService.send(
      to,
      subject,
      generateEmailLayout(innerContent),
    )
  },
}
