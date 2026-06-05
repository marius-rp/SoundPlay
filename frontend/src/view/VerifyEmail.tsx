import React, { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { verifyEmail } from "../service/authService"
import { useToast } from "../context/ToastContext"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  )
  const [message, setMessage] = useState<string>(
    "Vérification de votre e-mail en cours...",
  )

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Aucun token fourni. Le lien est invalide.")
      return
    }

    if (hasFetched.current) return
    hasFetched.current = true

    const confirmEmail = async () => {
      try {
        const res = await verifyEmail(token)

        if (res.success) {
          setStatus("success")
          setMessage("Votre e-mail a été lié avec succès !")
          showToast("E-mail vérifié avec succès", "success")

          setTimeout(() => {
            navigate("/profile")
          }, 3000)
        } else {
          const errorMsg =
            res.error?.message ||
            "Le lien de validation est invalide ou a expiré."
          setStatus("error")
          setMessage(errorMsg)
          showToast(errorMsg, "error")
        }
      } catch (err) {
        setStatus("error")
        setMessage("Une erreur réseau est survenue lors de la vérification.")
      }
    }

    confirmEmail()
  }, [token, navigate, showToast])

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#282828] p-8 md:p-10 rounded-xl shadow-2xl max-w-md w-full text-center flex flex-col items-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-[#1ed760] animate-spin mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">
              Vérification en cours
            </h2>
            <p className="text-gray-400 text-sm">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-[#1ed760] mb-6" />
            <h2 className="text-2xl font-black text-white mb-2">
              Félicitations !
            </h2>
            <p className="text-gray-300 text-sm mb-6">{message}</p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Redirection en cours...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-black text-white mb-2">Échec</h2>
            <p className="text-gray-300 text-sm mb-8">{message}</p>
            <button
              onClick={() => navigate("/profile")}
              className="w-full py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition"
            >
              Retourner au profil
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
