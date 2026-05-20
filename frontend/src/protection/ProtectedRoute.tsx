import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext"
import type { ReactNode } from "react"
import Loading from "../components/ui/Loading"

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { userId } = useAuth()
  const location = useLocation()

  if (userId === undefined) {
    return (
      <Loading />
    )
  }

  if (userId === null) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
