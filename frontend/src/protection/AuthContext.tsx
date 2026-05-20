import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { login, signUp, getMe, logout } from "../service/authService"
import { useUserStore } from "../store/useUserStore"
import type { ApiResponse } from "../interface/ApiResponse"

type AuthContextType = {
  userId: number | null | undefined
  isLoading: boolean
  loginUser: (email: string, password: string) => Promise<ApiResponse<any>>
  signUpUser: (data: any) => Promise<ApiResponse<any>>
  refreshUser: () => Promise<void>
  logoutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<number | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const { setUser, clearUser } = useUserStore()

  const refreshUser = async () => {
    try {
      const res = await getMe()
      if (res.success && res.data) {
        setUserId(res.data.id)
        setUser(res.data)
      } else {
        setUserId(null)
        clearUser()
      }
    } catch {
      setUserId(null)
      clearUser()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const loginUser = async (
    email: string,
    password: string,
  ): Promise<ApiResponse<any>> => {
    const res = await login({ email, password })

    if (res.success && res.data) {
      const user = res.data.user
      setUserId(user.id)
      setUser(user)
    } else {
      setUserId(null)
      clearUser()
    }
    return res
  }

  const signUpUser = async (data: any): Promise<ApiResponse<any>> => {
    const res = await signUp(data)
    return res
  }

  const logoutUser = async () => {
    await logout()
    setUserId(null)
    clearUser()
  }

  return (
    <AuthContext.Provider
      value={{
        userId,
        isLoading,
        loginUser,
        signUpUser,
        refreshUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context)
    throw new Error("useAuth doit être utilisé dans un AuthProvider")
  return context
}
