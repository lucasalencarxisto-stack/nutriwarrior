import {
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  Navigate,
} from "react-router-dom"

import { getMe } from "../services/auth"

type Role =
  | "PACIENTE"
  | "NUTRICIONISTA"

type User = {
  id: number
  nome: string
  email: string
  role: Role
  clienteId: number | null
}

type ProtectedRouteProps = {
  children: ReactNode
  allowedRole: Role
}

export function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const [user, setUser] =
    useState<User | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [authenticated, setAuthenticated] =
    useState(true)

  useEffect(() => {
    async function validateSession() {
      try {
        const me = await getMe()

        setUser(me)
      } catch {
        localStorage.removeItem(
          "nw_access_token",
        )

        setAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    validateSession()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-neutral-500">
          Carregando NutriWarrior...
        </p>
      </main>
    )
  }

  if (!authenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={
          user.role === "NUTRICIONISTA"
            ? "/professional"
            : "/dashboard"
        }
        replace
      />
    )
  }

  return children
}