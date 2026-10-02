import { useEffect, useState } from "react"
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
    },
    {
      label: "Retornos hoje",
      value: loading ? "…" : String(dueToday),
      detail: "previstos nas consultas",
    },
    {
      label: "Retornos atrasados",
      value: loading ? "…" : String(overdue),
      detail: "datas já vencidas",
    },
    {
      label: "Próximos retornos",
      value: loading ? "…" : String(upcoming),
      detail: "datas futuras registradas",
    },
  ]

  return (
    <section className="mt-8 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
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

        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
          dados reais
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <article key={card.label} className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-neutral-400">{card.detail}</p>
          </article>
        ))}
      </div>

      {!loading && overdue > 0 && (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          {overdue === 1
            ? "Há 1 retorno com data passada para revisar."
            : `Há ${overdue} retornos com data passada para revisar.`}
        </p>
      )}
    </section>
  )
}
