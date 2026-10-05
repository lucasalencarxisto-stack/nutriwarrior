import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getMe, logout } from "../services/auth"
import { getCurrentPlan, type CareRecord } from "../services/care"
import { getNextAppointment, type Appointment } from "../services/clinical"
import { getPatientDays, type DayRecord } from "../services/days"
import {
  getNutritionalGoals,
  type NutritionalGoals,
} from "../services/nutrition"
import { PlanView } from "../components/PlanView"
import { AssistantPanel } from "../components/AssistantPanel"
import { formatScheduleDateTime } from "../components/SchedulePicker"

export function PatientDashboard() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<{ nome: string; clienteId: number } | null>(null)
  const [plan, setPlan] = useState<CareRecord | null>(null)
  const [days, setDays] = useState<DayRecord[]>([])
  const [goals, setGoals] = useState<NutritionalGoals | null>(null)
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const me = await getMe()
        if (!me?.clienteId) {
          throw new Error("Seu usuário ainda não tem uma ficha de paciente vinculada.")
        }

        const [currentPlan, dayRows, goalRows, appointment] = await Promise.all([
          getCurrentPlan(me.clienteId),
          getPatientDays(me.clienteId),
          getNutritionalGoals(me.clienteId).catch(() => null),
          getNextAppointment(me.clienteId),
        ])

        if (alive) {
          setPatient(me)
          setPlan(currentPlan)
          setDays(dayRows)
          setGoals(goalRows)
          setNextAppointment(appointment)
          setError("")
        }
      } catch (cause) {
        if (alive) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar seu acompanhamento.")
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [revision])

  function refresh() {
    setLoading(true)
    setError("")
    setRevision(value => value + 1)
  }

  const ordered = [...days].sort((a, b) => b.data.localeCompare(a.data))
  const latestWeight = ordered.find(row => row.pesoKg != null)
  const todayIso = new Date().toLocaleDateString("en-CA")
  const todayRecord = days.find(row => row.data === todayIso)

  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">NutriWarrior</p>
            <h1 className="mt-2 text-2xl font-semibold">Meu acompanhamento</h1>
            {patient && <p className="mt-2 text-sm text-neutral-500">Olá, {patient.nome}.</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={refresh}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
            >
              Atualizar
            </button>
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm"
              onClick={() => {
                logout()
                navigate("/login", { replace: true })
              }}
            >
              Sair
            </button>
          </div>
        </header>

        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Último peso</p>
            <p className="mt-2 text-xl font-semibold">
              {latestWeight?.pesoKg == null ? "—" : `${Number(latestWeight.pesoKg).toLocaleString("pt-BR")} kg`}
            </p>
            <p className="mt-1 text-xs text-neutral-400">{latestWeight?.data ?? "Sem registro"}</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Peso-alvo</p>
            <p className="mt-2 text-xl font-semibold">
              {goals?.pesoAlvoKg == null ? "—" : `${goals.pesoAlvoKg.toLocaleString("pt-BR")} kg`}
            </p>
            <p className="mt-1 text-xs text-neutral-400">Definido pelo profissional</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Água hoje</p>
            <p className="mt-2 text-xl font-semibold">
              {todayRecord?.aguaMl == null ? "—" : `${todayRecord.aguaMl.toLocaleString("pt-BR")} ml`}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Meta: {goals?.aguaMl == null ? "—" : `${goals.aguaMl.toLocaleString("pt-BR")} ml`}
            </p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Próxima consulta</p>
            <p className="mt-2 text-sm font-semibold">
              {nextAppointment ? formatScheduleDateTime(nextAppointment.startsAt) : "Não agendada"}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {nextAppointment?.status === "CONFIRMED" ? "Confirmada" : nextAppointment ? "Agendada" : "—"}
            </p>
          </article>
        </section>

        <section aria-labelledby="current-plan" className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
          <h2 id="current-plan" className="mb-5 text-xl font-semibold">Meu plano alimentar</h2>
          {loading ? (
            <p role="status" className="text-sm text-neutral-500">Carregando seu plano…</p>
          ) : plan ? (
            <PlanView plan={plan} />
          ) : (
            <p className="text-sm text-neutral-500">Seu nutricionista ainda não publicou um plano alimentar.</p>
          )}
        </section>

        {patient && !error && <AssistantPanel\n          key={patient.clienteId}\n          clienteId={patient.clienteId}\n          patientName={patient.nome}\n        />}
      </div>
    </main>
  )
}
