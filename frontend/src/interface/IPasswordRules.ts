export interface PasswordRule {
  label: string
  test: (password: string) => boolean
}
