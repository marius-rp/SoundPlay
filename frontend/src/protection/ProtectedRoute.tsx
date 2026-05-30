import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { useUser } from "../hooks/useUser"
import type { ReactNode } from "react"
import Loading from "../components/ui/Loading"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: number[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { userId } = useAuth()
  const { user } = useUser()
  const location = useLocation()

  if (userId === undefined) {
    return <Loading />
  }

  if (userId === null) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const currentRoleId = user?.role_id || user?.role?.id

  if (
    allowedRoles &&
    (!user || !currentRoleId || !allowedRoles.includes(currentRoleId))
  ) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
