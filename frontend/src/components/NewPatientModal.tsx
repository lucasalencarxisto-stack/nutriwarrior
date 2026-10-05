import {
  Eye,
  EyeOff,
  LoaderCircle,
  Phone,
  Pencil,
  UserPlus,
  X,
} from "lucide-react"

import { useEffect, useState } from "react"

import { useToast } from "./ToastProvider"
import { ScheduleDatePicker } from "./SchedulePicker"

import {
  createPatient,
  updatePatient,
  type Patient,
} from "../services/patients"


type NewPatientModalProps = {
  open: boolean
  onClose: () => void
  onCreated: () => void
  patient?: Patient
}


function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2)
  }
  digits = digits.slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}


export function NewPatientModal({
  open,
  onClose,
  onCreated,
  patient,
}: NewPatientModalProps) {
  const editing = patient !== undefined
  const toast = useToast()
  const [nome, setNome] = useState(patient?.nome ?? "")
  const [email, setEmail] = useState(patient?.email ?? "")
  const [telefone, setTelefone] = useState(formatPhone(patient?.telefone ?? ""))
  const [alturaCm, setAlturaCm] = useState(patient?.alturaCm?.toString() ?? "")
  const [dataNascimento, setDataNascimento] = useState(patient?.dataNascimento?.slice(0, 10) ?? "")
  const [senha, setSenha] = useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        handleClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open, loading])


  if (!open) {
    return null
  }


  function resetForm() {
    setNome("")
    setEmail("")
    setTelefone("")
    setAlturaCm("")
    setDataNascimento("")
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
    event: {
      preventDefault: () => void
    },
  ) {
    event.preventDefault()

    setError(null)

    const cleanName =
      nome.trim()

    const cleanEmail =
      email
        .trim()
        .toLowerCase()

    const cleanPhone =
      telefone.trim()


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

    if ((!editing || senha.length > 0) && (senha.length < 8 || !senha.trim())) {
      setError(
        "A senha deve ter pelo menos 8 caracteres e não pode conter apenas espaços.",
      )
      return
    }

    const alturaInformada = alturaCm.trim()
      ? Number(alturaCm)
      : undefined

    if (alturaInformada !== undefined && (!Number.isFinite(alturaInformada) || alturaInformada <= 0)) {
      setError("Informe uma altura válida em centímetros.")
      return
    }

    const dataNascimentoInformada = dataNascimento.trim()


    try {
      setLoading(true)

      if (editing) {
        if (!patient.clienteId) {
          throw new Error("Paciente sem vínculo de cliente para editar.")
        }
        await updatePatient(patient.clienteId, {
          nome: cleanName,
          email: cleanEmail,
          telefone: cleanPhone,
          ...(alturaInformada !== undefined ? { alturaCm: alturaInformada } : {}),
          ...(dataNascimentoInformada ? { dataNascimento: dataNascimentoInformada } : {}),
          ...(senha ? { senha } : {}),
        })
      } else {
        await createPatient({
          nome: cleanName,
          email: cleanEmail,
          telefone: cleanPhone || undefined,
          senha,
          ...(alturaInformada !== undefined ? { alturaCm: alturaInformada } : {}),
          ...(dataNascimentoInformada ? { dataNascimento: dataNascimentoInformada } : {}),
        })
      }

      resetForm()

      toast.success(
        editing
          ? "Paciente atualizado com sucesso."
          : "Paciente cadastrado com sucesso.",
      )

      onCreated()
      onClose()

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o paciente."

      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-neutral-200 bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-neutral-100 px-7 py-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[var(--nw-green)]">
              {editing ? <Pencil size={20} /> : <UserPlus size={20} />}
            </div>

            <div>

              <h2 className="text-xl font-semibold tracking-tight">
                {editing ? "Editar paciente" : "Novo paciente"}
              </h2>

              <p className="mt-1 text-sm leading-5 text-neutral-500">
                {editing
                  ? "Atualize os dados de cadastro do paciente."
                  : "Cadastre um paciente e vincule-o automaticamente à sua carteira."}
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
                setNome(
                  event.target.value,
                )
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
                setEmail(
                  event.target.value,
                )
              }
              placeholder="paciente@email.com"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:bg-neutral-50"
            />

          </div>


          <div className="mt-5">

            <label
              htmlFor="patient-phone"
              className="text-sm font-medium text-neutral-700"
            >
              Telefone
              <span className="ml-2 font-normal text-neutral-400">
                opcional
              </span>
            </label>


            <div className="relative mt-2">

              <Phone
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                id="patient-phone"
                type="tel"
                autoComplete="tel"
                value={telefone}
                onChange={(event) =>
                  setTelefone(
                    formatPhone(
                      event.target.value,
                    ),
                  )
                }
                placeholder="(13) 99999-9999"
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:bg-neutral-50"
              />

            </div>


            <p className="mt-2 text-xs leading-5 text-neutral-400">
              Quando informado, o telefone poderá ser usado
              para contato direto pelo WhatsApp.
            </p>

          </div>


          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <label
                htmlFor="patient-height"
                className="text-sm font-medium text-neutral-700"
              >
                Altura (cm)
              </label>

              <input
                id="patient-height"
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                value={alturaCm}
                onChange={(event) => setAlturaCm(event.target.value)}
                placeholder="Ex.: 173"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:bg-neutral-50"
              />
            </div>

            <ScheduleDatePicker
              id="patient-birth-date"
              label="Data de nascimento"
              value={dataNascimento}
              onChange={setDataNascimento}
              disabled={loading}
            />

          </div>


          <div className="mt-5">

            <label
              htmlFor="patient-password"
              className="text-sm font-medium text-neutral-700"
            >
              {editing ? "Nova senha (opcional)" : "Senha inicial"}
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
                  setSenha(
                    event.target.value,
                  )
                }
                placeholder="Mínimo de 8 caracteres"
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:bg-neutral-50"
              />


              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current,
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
              {editing
                ? "Deixe a senha em branco para manter a atual."
                : "O paciente utilizará este e-mail e esta senha para acessar o NutriWarrior."}
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
                  {editing ? "Salvando..." : "Cadastrando..."}
                </>
              ) : (
                <>
                  {editing ? <Pencil size={17} /> : <UserPlus size={17} />}
                  {editing ? "Salvar alterações" : "Cadastrar paciente"}
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  )
}
