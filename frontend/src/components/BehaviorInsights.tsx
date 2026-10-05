import { useEffect, useState } from "react"
import { getCareHistory, type CareRecord, today } from "../services/care"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"

function daysBetween(date: string) {
  const start = new Date(`${date}T00:00:00`)
  const end = new Date(`${today()}T00:00:00`)
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000))
}

export function BehaviorInsights({
  clienteId,
  records,
  summaries,
}: {
  clienteId: number
  records: DayRecord[]
  summaries: NutritionSummary[]
}) {
  const [history, setHistory] = useState<CareRecord[]>([])

  useEffect(() => {
    let alive = true
    getCareHistory(clienteId).then(rows => {
      if (alive) setHistory(rows)
    }).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [clienteId])

  const lastWeight = records
    .filter(row => row.pesoKg != null)
    .sort((a, b) => b.data.localeCompare(a.data))[0]
  const lastWater = records
    .filter(row => row.aguaMl != null && row.aguaMl > 0)
    .sort((a, b) => b.data.localeCompare(a.data))[0]
  const lastPlan = history.find(row => row.kind === "PLAN")
  const last7 = summaries.filter(row => daysBetween(row.data) <= 6 && row.quantidadeItens > 0)

  const insights = [
    lastWeight
      ? `Última pesagem há ${daysBetween(lastWeight.data)} dia(s).`
      : "Ainda não há pesagem registrada.",
    lastWater
      ? `Último registro de hidratação há ${daysBetween(lastWater.data)} dia(s).`
      : "Ainda não há hidratação registrada.",
    `${last7.length} dia(s) com alimentação registrada nos últimos 7 dias.`,
    lastPlan
      ? `Plano vigente publicado há ${daysBetween(lastPlan.date)} dia(s).`
      : "Ainda não há plano alimentar publicado.",
  ]

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Insights verificáveis
      </p>
      <h3 className="mt-2 font-semibold">Padrões de registro</h3>
      <ul className="mt-4 space-y-2 text-sm text-neutral-700">
        {insights.map(item => (
          <li key={item} className="rounded-xl bg-neutral-50 p-3">{item}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-neutral-500">
        Indicadores descritivos; não representam diagnóstico nem avaliação automática de adesão.
      </p>
    </section>
  )
}
