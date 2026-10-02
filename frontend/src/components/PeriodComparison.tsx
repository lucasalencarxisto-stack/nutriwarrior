import { useState } from "react"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"

export function PeriodComparison({
  records,
  summaries,
}: {
  records: DayRecord[]
  summaries: NutritionSummary[]
}) {
  const [days, setDays] = useState(30)
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - (days - 1))
  const cutoffIso = [
    cutoff.getFullYear(),
    String(cutoff.getMonth() + 1).padStart(2, "0"),
    String(cutoff.getDate()).padStart(2, "0"),
  ].join("-")

  const periodRecords = records
    .filter(row => row.data >= cutoffIso)
    .sort((a, b) => a.data.localeCompare(b.data))
  const periodSummaries = summaries.filter(row => row.data >= cutoffIso)

  const weights = periodRecords.filter(row => row.pesoKg != null)
  const firstWeight = weights[0]?.pesoKg
  const lastWeight = weights.at(-1)?.pesoKg
  const delta =
    firstWeight != null && lastWeight != null
      ? Number(lastWeight) - Number(firstWeight)
      : null

  const waters = periodRecords
    .map(row => row.aguaMl)
    .filter((value): value is number => value != null && value > 0)
  const avgWater = waters.length
    ? waters.reduce((sum, value) => sum + value, 0) / waters.length
    : null

  const foodDays = periodSummaries.filter(row => row.quantidadeItens > 0)
  const avgKcal = foodDays.length
    ? foodDays.reduce((sum, row) => sum + row.calorias, 0) / foodDays.length
    : null

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Evolução</p>
          <h3 className="mt-2 font-semibold">Comparação por período</h3>
        </div>
        <select
          value={days}
          onChange={event => setDays(Number(event.target.value))}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
        </select>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <dt className="text-xs text-neutral-500">Variação de peso</dt>
          <dd className="mt-2 text-lg font-semibold">
            {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`}
          </dd>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <dt className="text-xs text-neutral-500">Média de água registrada</dt>
          <dd className="mt-2 text-lg font-semibold">
            {avgWater == null ? "—" : `${Math.round(avgWater).toLocaleString("pt-BR")} ml`}
          </dd>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <dt className="text-xs text-neutral-500">Dias com alimentação</dt>
          <dd className="mt-2 text-lg font-semibold">{foodDays.length}</dd>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <dt className="text-xs text-neutral-500">Média calórica registrada</dt>
          <dd className="mt-2 text-lg font-semibold">
            {avgKcal == null ? "—" : `${Math.round(avgKcal).toLocaleString("pt-BR")} kcal`}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-neutral-500">
        Ausência de registro não é interpretada como consumo zero ou falta de adesão.
      </p>
    </section>
  )
}
