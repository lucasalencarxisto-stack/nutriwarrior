import { apiFetch } from "./api"

export type LoginRequest = {
  email: string
  senha: string
}

export type LoginResponse = {
  accessToken: string
  expiresIn?: number
  usuario?: unknown
}

export async function login(
  credentials: LoginRequest,
) {
  const response: LoginResponse =
    await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

  localStorage.setItem(
    "nw_access_token",
    response.accessToken,
  )

  return response
}

export async function getMe() {
  return apiFetch("/me")
}

export function logout() {
  localStorage.removeItem("nw_access_token")
}