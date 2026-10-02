import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getMe, logout } from "../services/auth"
import { getCurrentPlan, type CareRecord } from "../services/care"
import { PlanView } from "../components/PlanView"
import { AssistantPanel } from "../components/AssistantPanel"

export function PatientDashboard() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<{ nome: string; clienteId: number } | null>(null)
  const [plan, setPlan] = useState<CareRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true); setError("")
    async function load() {
      try {
        const me = await getMe()
        if (!me?.clienteId) throw new Error("Seu usuário ainda não tem uma ficha de paciente vinculada.")
        const current = await getCurrentPlan(me.clienteId)
        if (alive) { setPatient(me); setPlan(current) }
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "Não foi possível carregar seu plano.") }
      finally { if (alive) setLoading(false) }
    }
    void load()
    return () => { alive = false }
  }, [revision])
  return <main className="min-h-screen bg-[#f8faf9] px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-teal-700">NutriWarrior</p><h1 className="mt-2 text-2xl font-semibold">Meu acompanhamento</h1>{patient && <p className="mt-2 text-sm text-neutral-500">Olá, {patient.nome}.</p>}</div>
        <button type="button" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm" onClick={() => { logout(); navigate("/login", { replace: true }) }}>Sair</button>
      </header>
      <section aria-labelledby="current-plan" className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 id="current-plan" className="text-xl font-semibold">Meu plano alimentar</h2><button type="button" disabled={loading} className="text-sm font-semibold text-teal-700 disabled:opacity-40" onClick={() => setRevision(x => x + 1)}>Atualizar</button></div>
        {loading ? <p role="status" className="text-sm text-neutral-500">Carregando seu plano…</p> : error ? <p role="alert" className="text-sm text-red-700">{error}</p> : plan ? <PlanView plan={plan} /> : <p className="text-sm text-neutral-500">Seu nutricionista ainda não publicou um plano alimentar.</p>}
      </section>
      {patient && !error && <AssistantPanel key={patient.clienteId} clienteId={patient.clienteId} />}
    </div>
  </main>
}
