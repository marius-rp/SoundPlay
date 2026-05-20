import React, { useState } from "react"
import Input from "../components/dropdown/Input"
import Button from "../components/buttons/Button"
import { useToast } from "../context/ToastContext"
import { useAuth } from "../protection/AuthContext"
import { useNavigate } from "react-router-dom"

const Login: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
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

    if (isLoginMode) {
      const res = await loginUser(formData.email, formData.password)

      if (res.success) {
        showToast(
          `${res.data.user.name} ${res.data.user.surname}, connexion réussie`,
          "success",
        )
        navigate("/home")
      } else {
        showToast(`${res.error?.message} (Code: ${res.error?.code})`, "error")
      }
    } else {
      const res = await signUpUser(formData)

      if (res.success) {
        showToast("Compte créé ! Veuillez vous connecter.", "success")
        setIsLoginMode(true)
        setFormData((prev) => ({
          ...prev,
          password: "",
          name: "",
          surname: "",
        }))
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
          {isLoginMode ? "Se connecter" : "S'inscrire"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
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
            type="email"
            placeholder="Adresse e-mail"
            value={formData.email}
            autoFocus
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <Button
            shape="full"
            isLoading={isLoading}
            className="mt-4 py-3 text-black font-black bg-[#1ed760] cursor-pointer"
          >
            {isLoginMode ? "LOG IN" : "SIGN UP"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
          {isLoginMode ? (
            <p>
              Vous n'avez pas de compte ?{" "}
              <button
                onClick={() => setIsLoginMode(false)}
                className="text-white font-bold hover:text-[#1ed760] transition underline underline-offset-4 cursor-pointer"
              >
                S'inscrire à SoundPlay
              </button>
            </p>
          ) : (
            <p>
              Vous avez déjà un compte ?{" "}
              <button
                onClick={() => setIsLoginMode(true)}
                className="text-white font-bold hover:text-[#1ed760] transition underline underline-offset-4 cursor-pointer"
              >
                Se connecter ici
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
