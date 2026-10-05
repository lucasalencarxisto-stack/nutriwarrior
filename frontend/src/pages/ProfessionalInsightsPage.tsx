import { useEffect, useState } from "react"
import {
  Bot,
  Droplets,
  Sparkles,
  UtensilsCrossed,
  Weight,
} from "lucide-react"
import { DashboardInsights } from "../components/DashboardInsights"
import { ProfessionalLayout } from "../components/ProfessionalLayout"
import { apiFetch } from "../services/api"
import { getMe } from "../services/auth"

type ProfessionalUser = {
  id: number
  nome: string
  email: string
  role: "NUTRICIONISTA"
  clienteId: null
}

export function ProfessionalInsightsPage() {
  const [user, setUser] = useState<ProfessionalUser | null>(null)
  const [patientCount, setPatientCount] = useState(0)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const [me, response] = await Promise.all([
          getMe(),
          apiFetch("/nutricionistas/me/pacientes"),
        ])

        if (!alive) return

        setUser(me)
        setPatientCount(Array.isArray(response) ? response.length : 0)
        setError("")
      } catch (cause) {
        if (!alive) return

        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar os insights.",
        )
      } finally {
        if (alive) setLoadingPatients(false)
      }
    }

    void load()

    return () => {
      alive = false
    }
  }, [])

  const futureInsights = [
    {
      icon: Droplets,
      title: "Hidratação",
      text: "Padrões de meta, frequência e dias com baixa ingestão poderão ser destacados aqui.",
      accent: "bg-sky-50 text-sky-700 ring-sky-100",
    },
    {
      icon: Weight,
      title: "Peso e evolução",
      text: "Mudanças relevantes poderão ser comparadas por período sem inventar interpretações clínicas.",
      accent: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    {
      icon: UtensilsCrossed,
      title: "Adesão alimentar",
      text: "Refeições registradas, frequência e plano alimentar poderão compor sinais de acompanhamento.",
      accent: "bg-amber-50 text-amber-700 ring-amber-100",
    },
  ]

  return (
    <ProfessionalLayout
      active="insights"
      title="Insights de IA"
      userName={user?.nome}
      breadcrumbs={[
        { label: "Workspace", href: "/professional" },
        { label: "Insights de IA" },
      ]}
    >
      <section className="relative overflow-hidden rounded-[34px] bg-neutral-950 p-6 text-white shadow-[0_24px_65px_rgba(15,23,42,0.18)] sm:p-8 lg:p-9">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
              <Sparkles size={13} />
              Inteligência clínica e operacional
            </span>

            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              O NutriWarrior transforma registros em prioridades claras.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
              Esta área concentra sinais, padrões e acompanhamento da carteira.
              Tudo deve partir de dados reais antes de qualquer interpretação assistida.
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Bot size={21} />
              </span>
              <div>
                <p className="text-sm font-semibold">Camada de IA</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Evolução progressiva, sem métricas fictícias
                </p>
              </div>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/5 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-2 text-[11px] text-neutral-500">
              Base operacional disponível; análises clínicas avançadas entram por etapas.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <DashboardInsights
        patientCount={patientCount}
        loadingPatients={loadingPatients}
      />

      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Próximas camadas
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">
              Onde a inteligência vai crescer
            </h3>
          </div>

          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-500 shadow-sm">
            roadmap visual
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {futureInsights.map(item => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="group rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_40px_rgba(15,118,110,0.08)]"
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ring-inset ${item.accent}`}
                >
                  <Icon size={20} />
                </span>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Próxima etapa
                </p>
                <h4 className="mt-1 text-lg font-semibold">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {item.text}
                </p>

                <div className="mt-5 h-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full w-1/3 rounded-full bg-emerald-300 transition-all duration-300 group-hover:w-2/5" />
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </ProfessionalLayout>
  )
}
