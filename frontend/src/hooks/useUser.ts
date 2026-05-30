import { ROLES } from "../constant"
import { useUserStore } from "../store/useUserStore"

export const useUser = () => {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)

  const isAuthenticated = !!user
  const fullName = user ? `${user.name} ${user.surname}` : "Invité"

  const currentRoleId = user?.role_id || user?.role?.id

  const isAdmin = currentRoleId === ROLES.ADMIN
  const isSupervisor = currentRoleId === ROLES.SUPERVISOR || currentRoleId === ROLES.ADMIN
  const isRegularUser = currentRoleId === ROLES.USER

  return {
    user,
    setUser,
    clearUser,
    isAuthenticated,
    fullName,
    isAdmin,
    isSupervisor,
    isRegularUser,
  }
}
