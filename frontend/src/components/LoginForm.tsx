import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react"

import { BrandLogo } from "./BrandLogo"
import { getMe, login } from "../services/auth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setLoading(true)
    setError(null)

    try {
      await login({
        email,
        senha,
      })

      const me = await getMe()

      if (me.role === "NUTRICIONISTA") {
        navigate("/professional")
        return
      }

      if (me.role === "PACIENTE") {
        navigate("/dashboard")
        return
      }

      throw new Error(
        "Perfil de usuário não reconhecido.",
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível realizar o login.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl rounded-[32px] border border-neutral-200 bg-white p-8 shadow-2xl shadow-black/5 sm:p-12">

      <div className="mb-10 flex justify-center">
        <BrandLogo />
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">
          Bem-vindo de volta
        </h2>

        <p className="mt-2 text-neutral-500">
          Acesse sua conta para continuar sua jornada.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-800">
            E-mail
          </label>

          <div className="flex h-14 items-center gap-3 rounded-2xl border border-neutral-200 px-4 transition focus-within:border-neutral-950">
            <Mail
              size={19}
              className="text-neutral-400"
            />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="seu@email.com"
              autoComplete="email"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-800">
            Senha
          </label>

          <div className="flex h-14 items-center gap-3 rounded-2xl border border-neutral-200 px-4 transition focus-within:border-neutral-950">
            <LockKeyhole
              size={19}
              className="text-neutral-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="Sua senha"
              autoComplete="current-password"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((current) => !current)
              }
              className="text-neutral-400 transition hover:text-neutral-900"
              aria-label={
                showPassword
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          <div className="mt-3 text-right">
            <button
              type="button"
              className="text-sm font-medium text-[var(--nw-green)]"
            >
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}

          {!loading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-neutral-200" />

        <span className="text-xs text-neutral-400">
          acesso seguro
        </span>

        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <p className="text-center text-sm text-neutral-500">
        Ainda não tem uma conta?{" "}

        <button className="font-semibold text-[var(--nw-green)]">
          Criar conta
        </button>
      </p>
    </div>
  )
}