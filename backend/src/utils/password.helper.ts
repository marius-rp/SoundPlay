import { PasswordValidationResult } from "../modules/types/PasswordValidation"

export function validatePasswordStrength(
  password: string,
): PasswordValidationResult {
  const errors: string[] = []

  if (!password || password.length < 12) {
    errors.push("Le mot de passe doit contenir au moins 12 caractères.")
  }

  if (!/\d/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre.")
  }

  if (!/[!@#$%^&*()\-_=+\[\]{}|;':",.<>?/`~\\]/.test(password)) {
    errors.push(
      "Le mot de passe doit contenir au moins un caractère spécial (ex: !@#$%^&*).",
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
