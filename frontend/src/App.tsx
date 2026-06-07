import { Routes, Route, Navigate } from "react-router-dom"
import { ToastProvider } from "./context/ToastContext"
import { AuthProvider } from "./protection/AuthContext"
import Home from "./view/Home"
import ProtectedRoute from "./protection/ProtectedRoute"
import Login from "./view/Login"
import Layout from "./components/ui/Layout"
import Profile from "./view/Profile"
import Search from "./view/Search"
import Library from "./view/Library"
import { DownloadProvider } from "./context/DownloadContext"
import Admin from "./view/admin/Admin"
import PlaylistView from "./view/playlist/PlaylistView"
import { PlayerProvider } from "./context/PlayerContext"
import { ROLES } from "./constant"
import VerifyEmail from "./view/VerifyEmail"
import ResetPassword from "./view/ResetPassword"

function App() {
  return (
    <DownloadProvider>
      <AuthProvider>
        <ToastProvider>
          <PlayerProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/library"
                  element={
                    <ProtectedRoute>
                      <Library />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/playlist/:id"
                  element={
                    <ProtectedRoute>
                      <PlaylistView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Admin"
                  element={
                    <ProtectedRoute
                      allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR]}
                    >
                      <Admin />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </PlayerProvider>
        </ToastProvider>
      </AuthProvider>
    </DownloadProvider>
  )
}

export default App
