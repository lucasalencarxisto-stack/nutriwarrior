const API_URL =
  import.meta.env.VITE_API_URL

export async function apiFetch(
  path: string,
  options: RequestInit = {},
) {
  const token =
    localStorage.getItem(
      "nw_access_token",
    )

  const isAuthRoute =
    path.startsWith("/auth/")

  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers: {
          "Content-Type":
            "application/json",

          ...(
            token &&
            !isAuthRoute
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}
          ),

          ...options.headers,
        },
      },
    )


  const contentType =
    response.headers.get(
      "content-type",
    ) ?? ""

  const hasJson =
    contentType.includes(
      "application/json",
    )


  let data = null

  if (
    response.status !== 204 &&
    hasJson
  ) {
    data =
      await response
        .json()
        .catch(() => null)
  }


  if (!response.ok) {
    throw new Error(
      data?.message ??
        `Erro ${response.status}`,
    )
  }


  return data
}