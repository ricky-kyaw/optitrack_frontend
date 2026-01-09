"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type User,
  login as apiLogin,
  logout as apiLogout,
  type LoginCredentials,
  setAccessToken,
  getAccessToken,
} from "@/lib/api"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem("optitrack_user")
    const storedToken = localStorage.getItem("optitrack_token")
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setAccessToken(storedToken)
    }
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response = await apiLogin(credentials)
    setUser(response.user)
    localStorage.setItem("optitrack_user", JSON.stringify(response.user))
    localStorage.setItem("optitrack_token", response.access)
  }

  const logout = () => {
    apiLogout()
    setUser(null)
    localStorage.removeItem("optitrack_user")
    localStorage.removeItem("optitrack_token")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.is_admin ?? false,
        isLoading,
        isAuthenticated: !!user && !!getAccessToken(),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
