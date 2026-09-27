const API_URL = import.meta.env.VITE_API_URL

export async function apiFetch(
  path: string,
  options: RequestInit = {},
) {
  const token = localStorage.getItem("nw_access_token")

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.message ??
        `Erro ${response.status}`,
    )
  }

  return response.json()
}