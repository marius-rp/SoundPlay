import React, { useState } from "react"
import Input from "../components/dropdown/Input"
import Button from "../components/buttons/Button"
import { useToast } from "../context/ToastContext"
import { useAuth } from "../protection/AuthContext"
import { useNavigate } from "react-router-dom"
import { forgotLogin, forgotPassword } from "../service/authService"
import PasswordStrengthIndicator from "../components/ui/PasswordStrengthIndicator"
import { validatePassword } from "../utils/passwordValidator"

const Login: React.FC = () => {
  const [mode, setMode] = useState<
    "login" | "signup" | "forgotPassword" | "forgotLogin"
  >("login")
  const [isLoading, setIsLoading] = useState(false)

  const [resetEmail, setResetEmail] = useState("")

  const [formData, setFormData] = useState({
    login: "",
    password: "",
    name: "",
    surname: "",
    role_id: 1,
  })

  const { showToast } = useToast()
  const { loginUser, signUpUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (mode === "login") {
      const res = await loginUser(formData.login, formData.password)

      if (res.success) {
        showToast(
          `${res.data.user.name} ${res.data.user.surname}, connexion réussie`,
          "success",
        )
        navigate("/home")
      } else {
        showToast(`${res.error?.message} (Code: ${res.error?.code})`, "error")
      }
    } else if (mode === "signup") {
      const { valid, failedRules } = validatePassword(formData.password)
      if (!valid) {
        showToast(failedRules[0], "error")
        setIsLoading(false)
        return
      }

      const res = await signUpUser(formData)

      if (res.success) {
        showToast("Compte créé ! Veuillez vous connecter.", "success")
        setMode("login")
        setFormData((prev) => ({
          ...prev,
          password: "",
          name: "",
          surname: "",
        }))
      } else {
        showToast(res.error?.message || "Erreur", "error")
      }
    } else if (mode === "forgotPassword") {
      const res = await forgotPassword(resetEmail)

      if (res.success) {
        showToast(
          "Un e-mail de réinitialisation vous a été envoyé !",
          "success",
        )
        setResetEmail("")
        setMode("login")
      } else {
        showToast(res.error?.message || "Une erreur est survenue", "error")
      }
    } else if (mode === "forgotLogin") {
      const res = await forgotLogin(resetEmail)
      if (res.success) {
        showToast(
          "Si cet e-mail existe, votre identifiant vous a été envoyé.",
          "success",
        )
        setMode("login")
      } else {
        showToast(res.error?.message || "Erreur", "error")
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
      <div className="mb-10 text-4xl font-black tracking-tighter">
        SoundPlay<span className="text-[#1ed760]">.</span>
      </div>

      <div className="w-full max-w-112.5 bg-[#121212] p-8 md:p-12 rounded-lg shadow-2xl border border-white/5">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {mode === "login" && "Se connecter"}
          {mode === "signup" && "S'inscrire"}
          {mode === "forgotPassword" && "Mot de passe oublié"}
          {mode === "forgotLogin" && "Identifiant oublié"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "forgotPassword" || mode === "forgotLogin" ? (
            <Input
              type="email"
              placeholder="Votre adresse e-mail"
              value={resetEmail}
              autoFocus
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          ) : (
            <>
              {mode === "signup" && (
                <div className="flex gap-4">
                  <Input
                    placeholder="Nom"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Prénom"
                    value={formData.surname}
                    onChange={(e) =>
                      setFormData({ ...formData, surname: e.target.value })
                    }
                  />
                </div>
              )}

              <Input
                type="text"
                placeholder="Login"
                value={formData.login}
                autoFocus
                onChange={(e) =>
                  setFormData({ ...formData, login: e.target.value })
                }
              />

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={
                    mode === "signup"
                      ? "Mot de passe (12 car. min, chiffre, caractère spécial)"
                      : "Mot de passe"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />

                {mode === "signup" && (
                  <PasswordStrengthIndicator password={formData.password} />
                )}

                {mode === "login" && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <button
                      type="button"
                      onClick={() => setMode("forgotLogin")}
                      className="hover:text-[#1ed760] transition underline cursor-pointer"
                    >
                      Login oublié ?
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("forgotPassword")}
                      className="hover:text-[#1ed760] transition underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <Button
            shape="full"
            isLoading={isLoading}
            className="mt-4 py-3 text-black font-black bg-[#1ed760] cursor-pointer"
          >
            {mode === "login" && "LOG IN"}
            {mode === "signup" && "SIGN UP"}
            {mode === "forgotPassword" && "ENVOYER LE LIEN"}
            {mode === "forgotLogin" && "RÉCUPÉRER MON LOGIN"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
          {mode === "login" && (
            <p>
              Vous n'avez pas de compte ?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-white font-bold hover:text-[#1ed760] transition underline underline-offset-4 cursor-pointer"
              >
                S'inscrire à SoundPlay
              </button>
            </p>
          )}

          {mode === "signup" && (
            <p>
              Vous avez déjà un compte ?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-white font-bold hover:text-[#1ed760] transition underline underline-offset-4 cursor-pointer"
              >
                Se connecter ici
              </button>
            </p>
          )}

          {(mode === "forgotPassword" || mode === "forgotLogin") && (
            <p>
              <button
                onClick={() => setMode("login")}
                className="text-white font-bold hover:text-[#1ed760] transition underline underline-offset-4 cursor-pointer"
              >
                Retour à la connexion
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
