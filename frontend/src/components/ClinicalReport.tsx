import { useEffect, useState } from "react"
import { formatScheduleDateTime } from "./SchedulePicker"
import { getCareHistory, type CareRecord } from "../services/care"
import { getNextAppointment, type Appointment } from "../services/clinical"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"

const esc = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

export function ClinicalReport({
  clienteId,
  patientName,
  records,
  summaries,
  targetWeight,
}: {
  clienteId: number
  patientName: string
  records: DayRecord[]
  summaries: NutritionSummary[]
  targetWeight?: number | null
}) {
  const [history, setHistory] = useState<CareRecord[]>([])
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      getCareHistory(clienteId),
      getNextAppointment(clienteId),
    ]).then(([care, next]) => {
      if (!alive) return
      setHistory(care)
      setAppointment(next)
    }).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [clienteId])

  function printReport() {
    const weights = records
      .filter(row => row.pesoKg != null)
      .sort((a, b) => b.data.localeCompare(a.data))
    const latestWeight = weights[0]
    const latestPlan = history.find(row => row.kind === "PLAN")
    const latestConsultation = history.find(row => row.kind === "CONSULTATION")
    const recentNutrition = [...summaries]
      .filter(row => row.quantidadeItens > 0)
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 7)

    const popup = window.open("", "_blank")
    if (!popup) return
    popup.opener = null

    const meals = latestPlan?.payload.meals ?? []
    popup.document.write(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório NutriWarrior</title>
<style>
body{font-family:Arial,sans-serif;color:#171717;margin:36px;line-height:1.45}
h1{margin-bottom:4px} h2{margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:6px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{background:#f5f5f5;padding:12px;border-radius:10px}
small{color:#666}.meal{border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:8px}
@media print{button{display:none}} </style></head><body>
<h1>NutriWarrior · Relatório clínico</h1>
<small>Paciente: ${esc(patientName)} · Gerado em ${esc(new Date().toLocaleString("pt-BR"))}</small>
<div class="grid" style="margin-top:20px">
<div class="card"><small>Último peso</small><br><strong>${latestWeight?.pesoKg == null ? "—" : esc(latestWeight.pesoKg)+" kg"}</strong></div>
<div class="card"><small>Peso-alvo</small><br><strong>${targetWeight == null ? "—" : esc(targetWeight)+" kg"}</strong></div>
<div class="card"><small>Próxima consulta</small><br><strong>${appointment ? esc(formatScheduleDateTime(appointment.startsAt)) : "—"}</strong></div>
</div>
<h2>Última consulta</h2>
<p><strong>${esc(latestConsultation?.title ?? "Sem consulta registrada")}</strong></p>
<p>${esc(latestConsultation?.notes ?? "")}</p>
<h2>Plano alimentar vigente</h2>
<p>${esc(latestPlan?.title ?? "Sem plano publicado")}</p>
${meals.map(meal => `<div class="meal"><strong>${esc(meal.name)}</strong><br>${esc(meal.portions).replaceAll("\n","<br>")}<br><small>Substituições: ${esc(meal.substitutions)}</small></div>`).join("")}
<h2>Registros recentes</h2>
<ul>${recentNutrition.map(row => `<li>${esc(row.data)} — ${Math.round(row.calorias)} kcal · ${row.quantidadeRefeicoes} refeições · água ${row.aguaMl ?? 0} ml</li>`).join("")}</ul>
<p><small>Relatório descritivo gerado a partir dos registros disponíveis no NutriWarrior. A interpretação clínica cabe ao profissional responsável.</small></p>
<button onclick="window.print()">Imprimir / salvar em PDF</button>
<script>window.onload=()=>window.print()</script>
</body></html>`)
    popup.document.close()
  }

  return (
    <section id="report" className="scroll-mt-6 rounded-3xl border border-neutral-200 bg-neutral-950 p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
        Relatório
      </p>
      <h3 className="mt-2 text-lg font-semibold">Resumo clínico para PDF</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">
        Gera uma versão limpa com dados atuais, última consulta, plano vigente e registros recentes.
      </p>
      <button
        type="button"
        onClick={printReport}
        className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950"
      >
        Imprimir / salvar como PDF
      </button>
    </section>
  )
}
