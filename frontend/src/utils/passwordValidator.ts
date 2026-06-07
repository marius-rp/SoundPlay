import type { PasswordRule } from "../interface/IPasswordRules"

export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: "12 caractères minimum",
    test: (p) => p.length >= 12,
  },
  {
    label: "Au moins un chiffre",
    test: (p) => /\d/.test(p),
  },
  {
    label: "Au moins un caractère spécial (!@#$%^&*...)",
    test: (p) => /[!@#$%^&*()\-_=+\[\]{}|;':",.<>?/`~\\]/.test(p),
  },
]

export function validatePassword(password: string): {
  valid: boolean
  failedRules: string[]
} {
  const failedRules = PASSWORD_RULES.filter((r) => !r.test(password)).map(
    (r) => r.label,
  )
  return {
    valid: failedRules.length === 0,
    failedRules,
  }
}
