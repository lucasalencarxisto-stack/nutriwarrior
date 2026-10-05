import { useEffect, useState } from "react"
import {
  CalendarCheck2,
  CalendarRange,
  ClockAlert,
  Users,
} from "lucide-react"
import { getFollowUps, today, type FollowUp } from "../services/care"

export function DashboardInsights({
  patientCount,
  loadingPatients,
}: {
  patientCount: number
  loadingPatients: boolean
}) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    getFollowUps()
      .then(rows => {
        if (!alive) return
        setFollowUps(rows)
        setError("")
      })
      .catch(cause => {
        if (!alive) return
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar os indicadores de retorno.",
        )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const currentDate = today()
  const dueToday = followUps.filter(row => row.returnDate === currentDate).length
  const overdue = followUps.filter(row => row.returnDate < currentDate).length
  const upcoming = followUps.filter(row => row.returnDate > currentDate).length

  const cards = [
    {
      label: "Pacientes vinculados",
      value: loadingPatients ? "…" : String(patientCount),
      detail: "carteira atual",
      icon: Users,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Retornos hoje",
      value: loading ? "…" : String(dueToday),
      detail: "previstos nas consultas",
      icon: CalendarCheck2,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Retornos atrasados",
      value: loading ? "…" : String(overdue),
      detail: "datas já vencidas",
      icon: ClockAlert,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Próximos retornos",
      value: loading ? "…" : String(upcoming),
      detail: "datas futuras registradas",
      icon: CalendarRange,
      tone: "bg-violet-50 text-violet-700",
    },
  ]

  return (
    <section className="mt-6 rounded-[30px] border border-neutral-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.045)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Insights operacionais
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            O que merece atenção agora
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Indicadores calculados somente a partir dos pacientes vinculados e
            das datas de retorno registradas nas consultas.
          </p>
        </div>

        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          dados reais
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => {
          const Icon = card.icon

          return (
            <article
              key={card.label}
              className="rounded-[22px] border border-neutral-100 bg-neutral-50/70 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.tone}`}>
                <Icon size={18} />
              </span>
              <p className="mt-4 text-xs text-neutral-500">{card.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-neutral-400">{card.detail}</p>
            </article>
          )
        })}
      </div>

      {!loading && overdue > 0 && (
        <p className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          {overdue === 1
            ? "Há 1 retorno com data passada para revisar."
            : `Há ${overdue} retornos com data passada para revisar.`}
        </p>
      )}
    </section>
  )
}
