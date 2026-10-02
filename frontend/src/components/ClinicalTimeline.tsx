import { useEffect, useState } from "react"
import {
  dateLabel,
  getCareHistory,
  type CareRecord,
} from "../services/care"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"

type TimelineItem = {
  key: string
  date: string
  sortKey: string
  title: string
  detail: string
  meta?: string
}

function careItem(record: CareRecord): TimelineItem {
  if (record.kind === "CONSULTATION") {
    return {
      key: `care-${record.id}`,
      date: record.date,
      sortKey: `${record.date}|${record.createdAt}`,
      title: "Consulta nutricional",
      detail: record.title,
      meta: record.returnDate
        ? `Retorno previsto: ${dateLabel(record.returnDate)}`
        : `Registrado por ${record.author}`,
    }
  }

  if (record.kind === "PLAN") {
    return {
      key: `care-${record.id}`,
      date: record.date,
      sortKey: `${record.date}|${record.createdAt}`,
      title: `Plano alimentar v${record.version}`,
      detail: `${record.payload.meals?.length ?? 0} refeições · ${record.title}`,
      meta: `Publicado por ${record.author}`,
    }
  }

  return {
    key: `care-${record.id}`,
    date: record.date,
    sortKey: `${record.date}|${record.createdAt}`,
    title: "Avaliação energética",
    detail: `${Math.round(record.payload.restingKcal ?? 0).toLocaleString("pt-BR")} kcal/dia · ${record.title}`,
    meta:
      record.payload.totalKcal != null
        ? `Gasto total estimado: ${Math.round(record.payload.totalKcal).toLocaleString("pt-BR")} kcal/dia`
        : "Sem fator de atividade aplicado",
  }
}

export function ClinicalTimeline({
  clienteId,
  records,
  summaries,
}: {
  clienteId: number
  records: DayRecord[]
  summaries: NutritionSummary[]
}) {
  const [history, setHistory] = useState<CareRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let alive = true

    getCareHistory(clienteId)
      .then(rows => {
        if (!alive) return
        setHistory(rows)
        setError("")
      })
      .catch(cause => {
        if (!alive) return
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar a timeline.",
        )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clienteId, revision])

  const items: TimelineItem[] = history.map(careItem)

  for (const record of records) {
    if (record.pesoKg != null) {
      items.push({
        key: `weight-${record.id}`,
        date: record.data,
        sortKey: `${record.data}|weight-${record.id}`,
        title: "Peso registrado",
        detail: `${Number(record.pesoKg).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`,
      })
    }

    if (record.aguaMl != null && record.aguaMl > 0) {
      items.push({
        key: `water-${record.id}`,
        date: record.data,
        sortKey: `${record.data}|water-${record.id}`,
        title: "Hidratação registrada",
        detail: `${record.aguaMl.toLocaleString("pt-BR")} ml`,
      })
    }
  }

  for (const summary of summaries) {
    if (summary.quantidadeItens <= 0) continue

    items.push({
      key: `nutrition-${summary.data}`,
      date: summary.data,
      sortKey: `${summary.data}|nutrition`,
      title: "Alimentação registrada",
      detail: `${summary.quantidadeRefeicoes} refeições · ${summary.quantidadeItens} itens`,
      meta: `${Math.round(summary.calorias).toLocaleString("pt-BR")} kcal registradas`,
    })
  }

  items.sort((a, b) => b.sortKey.localeCompare(a.sortKey))

  function reload() {
    setLoading(true)
    setError("")
    setRevision(value => value + 1)
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Histórico integrado
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Timeline clínica
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Consultas, planos, avaliações e registros do paciente em uma única
            sequência cronológica.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={reload}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-teal-700 disabled:opacity-50"
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {loading ? (
        <p role="status" className="mt-6 text-sm text-neutral-500">
          Montando timeline…
        </p>
      ) : error ? (
        <p role="alert" className="mt-6 text-sm text-red-700">
          {error}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-neutral-50 p-6 text-sm text-neutral-500">
          Ainda não há eventos suficientes para montar a timeline.
        </p>
      ) : (
        <ol className="mt-7 space-y-1">
          {items.map(item => (
            <li key={item.key} className="relative grid grid-cols-[20px_1fr] gap-4 pb-6">
              <div className="relative flex justify-center">
                <span className="mt-1.5 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-teal-50" />
                <span className="absolute bottom-0 top-5 w-px bg-neutral-200 last:hidden" />
              </div>
              <article className="min-w-0 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <time className="text-xs text-neutral-500">
                    {dateLabel(item.date)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-neutral-700">{item.detail}</p>
                {item.meta && (
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    {item.meta}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
