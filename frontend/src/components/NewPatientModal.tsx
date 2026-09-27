import {
  Eye,
  EyeOff,
  LoaderCircle,
  UserPlus,
  X,
} from "lucide-react"

import { useState } from "react"

import {
  createPatient,
} from "../services/patients"


type NewPatientModalProps = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}


export function NewPatientModal({
  open,
  onClose,
  onCreated,
}: NewPatientModalProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)


  if (!open) {
    return null
  }


  function resetForm() {
    setNome("")
    setEmail("")
    setSenha("")
    setShowPassword(false)
    setError(null)
  }


  function handleClose() {
    if (loading) {
      return
    }

    resetForm()
    onClose()
  }


  async function handleSubmit(
    event: { preventDefault: () => void },
  ) {
    event.preventDefault()

    setError(null)

    const cleanName = nome.trim()
    const cleanEmail = email
      .trim()
      .toLowerCase()

    if (!cleanName) {
      setError(
        "Informe o nome completo do paciente.",
      )
      return
    }

    if (!cleanEmail) {
      setError(
        "Informe o e-mail do paciente.",
      )
      return
    }

    if (senha.length < 8) {
      setError(
        "A senha inicial deve ter pelo menos 8 caracteres.",
      )
      return
    }

    try {
      setLoading(true)

      await createPatient({
        nome: cleanName,
        email: cleanEmail,
        senha,
      })

      resetForm()

      onCreated()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o paciente.",
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">

      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-neutral-100 px-7 py-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[var(--nw-green)]">
              <UserPlus size={20} />
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Novo paciente
              </h2>

              <p className="mt-1 text-sm leading-5 text-neutral-500">
                Cadastre um paciente e vincule-o
                automaticamente à sua carteira.
              </p>
            </div>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={19} />
          </button>

        </div>


        <form
          onSubmit={handleSubmit}
          className="px-7 py-6"
        >

          <div>

            <label
              htmlFor="patient-name"
              className="text-sm font-medium text-neutral-700"
            >
              Nome completo
            </label>

            <input
              id="patient-name"
              type="text"
              autoComplete="name"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              placeholder="Ex.: João da Silva"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:bg-neutral-50"
            />

          </div>


          <div className="mt-5">

            <label
              htmlFor="patient-email"
              className="text-sm font-medium text-neutral-700"
            >
              E-mail
            </label>

            <input
              id="patient-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="paciente@email.com"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:bg-neutral-50"
            />

          </div>


          <div className="mt-5">

            <label
              htmlFor="patient-password"
              className="text-sm font-medium text-neutral-700"
            >
              Senha inicial
            </label>


            <div className="relative mt-2">

              <input
                id="patient-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                placeholder="Mínimo de 8 caracteres"
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:bg-neutral-50"
              />


              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>


            <p className="mt-2 text-xs leading-5 text-neutral-400">
              O paciente utilizará este e-mail e
              esta senha para acessar o NutriWarrior.
            </p>

          </div>


          {error && (

            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

            </div>

          )}


          <div className="mt-7 flex justify-end gap-3">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="h-11 rounded-2xl border border-neutral-200 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>


            <button
              type="submit"
              disabled={loading}
              className="flex h-11 min-w-40 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Cadastrando...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Cadastrar paciente
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  )
}