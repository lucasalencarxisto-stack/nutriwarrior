import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bot,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react"
import { BrandLogo } from "../components/BrandLogo"
import { DashboardInsights } from "../components/DashboardInsights"
import { NotificationBell } from "../components/NotificationBell"
import { apiFetch } from "../services/api"
import { getMe } from "../services/auth"

type ProfessionalUser = {
  id: number
  nome: string
  email: string
  role: "NUTRICIONISTA"
  clienteId: null
}

function getInitials(name?: string) {
  if (!name) return "NW"

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase()
}

export function ProfessionalInsightsPage() {
  const navigate = useNavigate()
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

  return (
    <div className="min-h-screen bg-[#f8faf9] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
        <div className="px-7 py-7">
          <BrandLogo />
        </div>

        <nav className="mt-4 flex-1 px-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/professional")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              <LayoutDashboard size={19} />
              Visão geral
            </button>

            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
              <Users size={19} />
              Pacientes
            </button>

            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
              <ClipboardList size={19} />
              Relatórios
            </button>

            <button className="flex w-full items-center gap-3 rounded-2xl bg-neutral-950 px-4 py-3 text-left text-sm font-medium text-white">
              <Bot size={19} />
              Insights de IA
            </button>
          </div>

          <div className="my-6 border-t border-neutral-200" />

          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
            <Settings size={19} />
            Configurações
          </button>
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
            <LogOut size={19} />
            Sair
          </button>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="flex h-20 items-center justify-between border-b border-neutral-200 bg-white px-6 lg:px-10">
          <div>
            <p className="text-sm text-neutral-500">NutriWarrior Professional</p>
            <h1 className="text-xl font-semibold tracking-tight">Insights de IA</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {user?.nome ?? "Nutricionista"}
              </p>
              <p className="text-xs text-neutral-500">Plano Professional</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
              {getInitials(user?.nome)}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
          <section>
            <p className="text-sm font-medium text-[var(--nw-green)]">
              Inteligência clínica e operacional
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Insights NutriWarrior
            </h2>
            <p className="mt-2 max-w-3xl text-neutral-500">
              Uma área separada para padrões, prioridades e sinais relevantes da
              carteira. Os indicadores abaixo usam somente dados já registrados
              no sistema.
            </p>
          </section>

          {error && (
            <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          <DashboardInsights
            patientCount={patientCount}
            loadingPatients={loadingPatients}
          />

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Hidratação",
                text: "Aqui entraremos com padrões de meta e frequência quando a análise dos registros estiver integrada.",
              },
              {
                title: "Peso e evolução",
                text: "Variações relevantes poderão ser destacadas por paciente e período sem inventar interpretações clínicas.",
              },
              {
                title: "Adesão alimentar",
                text: "O painel poderá cruzar refeições registradas, plano alimentar e recorrência de acompanhamento.",
              },
            ].map(item => (
              <article
                key={item.title}
                className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Próxima etapa
                </span>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {item.text}
                </p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  )
}
