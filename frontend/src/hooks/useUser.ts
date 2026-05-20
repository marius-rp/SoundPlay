import { useUserStore } from "../store/useUserStore"

export const useUser = () => {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)

  const isAuthenticated = !!user
  const fullName = user ? `${user.name} ${user.surname}` : "Invité"
  const isAdmin = user?.role?.id === 2

  return {
    user,
    setUser,
    clearUser,
    isAuthenticated,
    fullName,
    isAdmin,
  }
}
