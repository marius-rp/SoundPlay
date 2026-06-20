import React, { useState, useEffect } from "react"
import { useUser } from "../hooks/useUser"
import {
  Mail,
  Shield,
  Trash,
  AlertTriangle,
  Pen,
  Lock,
  LogOut,
} from "lucide-react"
import Modal from "../components/modal/Modal"
import { useToast } from "../context/ToastContext"
import { useNavigate } from "react-router-dom"
import {
  changePassword,
  deleteAccount,
  requestEmailVerification,
} from "../service/authService"
import { playlistService } from "../service/playlistService"
import { useAuth } from "../protection/AuthContext"
import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from "../components/dropdown/DropdownMenu"
import { ROLES } from "../constant"
import Button from "../components/buttons/Button"
import PasswordStrengthIndicator from "../components/ui/PasswordStrengthIndicator"

const Profile: React.FC = () => {
  const { user, fullName, clearUser } = useUser()
  const [isOpenPopUp, setIsOpenPopUp] = useState<boolean>(false)
  const [isOpenChangePsw, setIsOpenChangePsw] = useState<boolean>(false)
  const [isOpenChangeEmail, setIsOpenChangeEmail] = useState<boolean>(false)
  const [emailInput, setEmailInput] = useState<string>("")
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false)
  const [playlistCount, setPlaylistCount] = useState<number>(0)

  const [pswData, setPswData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })

  const navigate = useNavigate()
  const { showToast } = useToast()
  const { logoutUser } = useAuth()

  useEffect(() => {
    const fetchUserPlaylists = async () => {
      try {
        const res = await playlistService.getUserPlaylists()
        if (res.success && res.data) {
          setPlaylistCount(res.data.length)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des playlists", error)
      }
    }

    fetchUserPlaylists()
  }, [])

  const handleDeleteAccount = async () => {
    try {
      const res = await deleteAccount()
      if (res.success) {
        showToast("Votre compte a été supprimé avec succès", "success")
        clearUser()
        navigate("/login")
      } else {
        showToast(
          res.error?.message || "Erreur lors de la suppression",
          "error",
        )
      }
    } catch (err) {
      showToast("Une erreur réseau est survenue", "error")
    } finally {
      setIsOpenPopUp(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pswData.newPassword !== pswData.confirmNewPassword) {
      return showToast(
        "Les nouveaux mots de passe ne correspondent pas",
        "error",
      )
    }

    try {
      const res = await changePassword({
        oldPassword: pswData.oldPassword,
        newPassword: pswData.newPassword,
      })

      if (res.success) {
        showToast("Mot de passe mis à jour avec succès !", "success")
        setIsOpenChangePsw(false)
        setPswData({ oldPassword: "", newPassword: "", confirmNewPassword: "" })
      } else {
        showToast(String(res.error?.message), "error")
      }
    } catch (err) {
      showToast("Une erreur réseau est survenue", "error")
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput) return

    setIsEmailLoading(true)
    try {
      const res = await requestEmailVerification({ email: emailInput })

      if (res.success) {
        showToast("Un e-mail de vérification vous a été envoyé !", "success")
        setIsOpenChangeEmail(false)
        setEmailInput("")
      } else {
        showToast(res.error?.message || "Une erreur est survenue", "error")
      }
    } catch (err) {
      showToast("Une erreur réseau est survenue", "error")
    } finally {
      setIsEmailLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-[#121212] overflow-x-hidden">
      <div className="relative bg-linear-to-b from-[#414141] to-[#121212] p-4 md:p-8 pt-12 md:pt-20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 max-w-7xl mx-auto">
          <div className="w-40 h-40 md:w-60 md:h-60 bg-[#282828] rounded-full flex items-center justify-center text-6xl md:text-8xl font-black shadow-[0_8px_40px_rgba(0,0,0,0.5)] shrink-0 transition-transform hover:scale-105 duration-300">
            <span className="drop-shadow-2xl text-white">
              {fullName?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col text-center md:text-left text-white pb-2 w-full">
            <span className="hidden md:block text-xs font-bold uppercase mb-2">
              Profil
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-4 md:mb-6 tracking-tighter wrap-break-word">
              {fullName}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 text-sm font-bold">
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="hover:underline cursor-pointer">
                {playlistCount} Playlist{playlistCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-20 max-w-7xl mx-auto mt-8">
        <div className="flex items-center gap-4 mb-6 relative">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Informations
          </h2>

          <DropdownMenu>
            <DropdownItem
              icon={<Lock size={16} />}
              onClick={() => setIsOpenChangePsw(true)}
            >
              Changer le mot de passe
            </DropdownItem>

            <DropdownDivider />

            <DropdownItem
              icon={<Trash size={16} />}
              onClick={() => setIsOpenPopUp(true)}
              variant="danger"
            >
              Supprimer le compte
            </DropdownItem>
          </DropdownMenu>
        </div>

        <div className="grid gap-2">
          <div className="group flex flex-row items-center justify-between md:grid md:grid-cols-3 p-4 hover:bg-white/5 rounded-md transition-colors gap-4">
            <div className="flex items-center gap-4 min-w-25">
              <Mail
                size={18}
                className="text-gray-400 group-hover:text-white shrink-0"
              />
              <span className="font-bold text-sm text-white">E-mail</span>
            </div>

            <span className="text-gray-400 group-hover:text-white text-sm md:text-base truncate flex-1 md:flex-none">
              {!user?.email ? "Aucun e-mail renseigné" : user.email}
            </span>

            <div className="flex justify-end shrink-0">
              <button
                onClick={() => setIsOpenChangeEmail(true)}
                className="cursor-pointer flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#1ed760] transition-all p-2 -mr-2 md:mr-0"
              >
                <Pen size={14} />
                <span className="hidden sm:inline-block">Modifier</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 items-center p-4 hover:bg-white/5 rounded-md group transition-colors">
            <div className="flex items-center gap-4">
              <Shield
                size={18}
                className="text-gray-400 group-hover:text-white"
              />
              <span className="font-bold text-sm text-white">Rôle</span>
            </div>
            <span className="text-gray-400 group-hover:text-white col-span-1 md:col-span-2">
              {user?.role?.id === ROLES.ADMIN
                ? "Administrateur"
                : user?.role?.id === ROLES.SUPERVISOR
                  ? "Superviseur"
                  : "Utilisateur"}
            </span>
          </div>

          <div
            onClick={async () => {
              await logoutUser()
              navigate("/login")
            }}
            className="flex items-center p-4 hover:bg-red-500/10 rounded-md group transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <LogOut size={18} className="text-red-500" />
              <span className="font-bold text-sm text-red-500">
                Se déconnecter
              </span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOpenPopUp}
        onClose={() => setIsOpenPopUp(false)}
        title="Supprimer le compte ?"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-500/20 rounded-full text-red-500">
            <AlertTriangle className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <p className="text-gray-300 text-sm">
            Toutes vos playlists et préférences seront perdues à jamais.
          </p>
          <div className="flex flex-col w-full gap-3 pt-4">
            <Button
              onClick={handleDeleteAccount}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700"
            >
              Supprimer définitivement
            </Button>
            <Button
              onClick={() => setIsOpenPopUp(false)}
              variant="secondary"
              className="w-full py-3 text-white font-bold hover:underline "
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isOpenChangePsw}
        onClose={() => setIsOpenChangePsw(false)}
        title="Sécurité"
      >
        <form onSubmit={handleChangePassword} className="space-y-5 px-1">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">
                Mot de passe actuel
              </label>
              <input
                type="password"
                required
                className="w-full bg-[#282828] border-none rounded-md p-3 text-white focus:ring-1 focus:ring-[#1ed760] outline-none text-sm"
                onChange={(e) =>
                  setPswData({ ...pswData, oldPassword: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                placeholder="12 car. min, chiffre, caractère spécial"
                className="w-full bg-[#282828] border-none rounded-md p-3 text-white focus:ring-1 focus:ring-[#1ed760] outline-none text-sm"
                onChange={(e) =>
                  setPswData({ ...pswData, newPassword: e.target.value })
                }
              />
              <PasswordStrengthIndicator password={pswData.newPassword} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">
                Confirmer
              </label>
              <input
                type="password"
                required
                className="w-full bg-[#282828] border-none rounded-md p-3 text-white focus:ring-1 focus:ring-[#1ed760] outline-none text-sm"
                onChange={(e) =>
                  setPswData({ ...pswData, confirmNewPassword: e.target.value })
                }
              />
              {pswData.confirmNewPassword && (
                <p
                  className={`text-xs mt-1 ${
                    pswData.newPassword === pswData.confirmNewPassword
                      ? "text-[#1ed760]"
                      : "text-red-400"
                  }`}
                >
                  {pswData.newPassword === pswData.confirmNewPassword
                    ? "✓ Les mots de passe correspondent"
                    : "✗ Les mots de passe ne correspondent pas"}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition"
          >
            Mettre à jour
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isOpenChangeEmail}
        onClose={() => setIsOpenChangeEmail(false)}
        title="Adresse e-mail"
      >
        <form onSubmit={handleEmailSubmit} className="space-y-5 px-1">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-400 block">
              Nouvelle adresse e-mail
            </label>
            <input
              type="email"
              required
              placeholder="exemple@domaine.com"
              value={emailInput}
              className="w-full bg-[#282828] border-none rounded-md p-3 text-white focus:ring-1 focus:ring-[#1ed760] outline-none text-sm"
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <div className="text-[11px] text-gray-400 leading-normal pt-1">
              Un e-mail contenant un lien de validation sera envoyé à cette
              adresse afin de confirmer votre identité.
              <br />
              <span className="font-bold text-red-600">
                Attention : Vérifiez votre dossier de spam
              </span>
            </div>
          </div>
          <Button
            type="submit"
            isLoading={isEmailLoading}
            className="w-full py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition"
          >
            Envoyer le lien de vérification
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default Profile
