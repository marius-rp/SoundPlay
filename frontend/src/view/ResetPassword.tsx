import React, { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { resetPasswordViaToken } from "../service/authService"
import { useToast } from "../context/ToastContext"
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react"

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      showToast("Token de réinitialisation manquant.", "error")
      return
    }

    if (newPassword.length < 6) {
      showToast("Le mot de passe doit contenir au moins 6 caractères.", "error")
      return
    }

    if (newPassword !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas.", "error")
      return
    }

    setLoading(true)
    try {
      const res = await resetPasswordViaToken({ token, newPassword })

      if (res.success) {
        setSuccess(true)
        showToast("Mot de passe réinitialisé !", "success")
        setTimeout(() => {
          navigate("/login")
        }, 3000)
      } else {
        showToast(res.error?.message || "Une erreur est survenue.", "error")
      }
    } catch (err) {
      showToast("Erreur réseau.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="bg-[#282828] p-8 rounded-xl max-w-md w-full text-center">
          <p className="text-red-500 font-bold mb-4">Lien invalide</p>
          <p className="text-gray-400 text-sm mb-6">
            Ce lien de réinitialisation n'est pas valide.
          </p>
          <button
            onClick={() => navigate("/")}
            className="py-2 px-6 bg-white text-black font-bold rounded-full"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#282828] p-8 md:p-10 rounded-xl shadow-2xl max-w-md w-full">
        {success ? (
          <div className="text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-[#1ed760] mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">
              Mot de passe modifié !
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Votre compte est sécurisé avec votre nouveau mot de passe.
            </p>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest animate-pulse">
              Redirection vers la connexion...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <KeyRound className="w-12 h-12 text-[#1ed760]" />
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2">
              Nouveau mot de passe
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  disabled={loading}
                  className="w-full bg-[#3e3e3e] border border-transparent text-white px-4 py-3 rounded-md focus:outline-none focus:border-gray-500 text-sm transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  disabled={loading}
                  className="w-full bg-[#3e3e3e] border border-transparent text-white px-4 py-3 rounded-md focus:outline-none focus:border-gray-500 text-sm transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-[#1ed760] text-black font-bold rounded-full hover:scale-105 active:scale-95 transition flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "RÉINITIALISER LE MOT DE PASSE"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
