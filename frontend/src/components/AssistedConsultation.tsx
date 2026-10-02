import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { saveCare, today } from "../services/care"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"
import { EnergyAssessment } from "./EnergyAssessment"

const checklistItems = [
  "Peso atualizado",
  "Anamnese revisada",
  "Meta nutricional revisada",
  "Plano alimentar revisado",
  "Retorno definido",
]

export function AssistedConsultation({
  clienteId,
  records,
  summaries,
  heightCm,
  currentWeight,
  age,
}: {
  clienteId: number
  records: DayRecord[]
  summaries: NutritionSummary[]
  heightCm?: number | null
  currentWeight: number | null
  age: number | null
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [anamnesis, setAnamnesis] = useState("")
  const [notes, setNotes] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const latestRecord = [...records].sort((a, b) => b.data.localeCompare(a.data))[0]
  const foodDays = summaries.filter(row => row.quantidadeItens > 0).length

  function toggle(item: string) {
    setSelected(current =>
      current.includes(item)
        ? current.filter(value => value !== item)
        : [...current, item],
    )
  }

  async function finish(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    try {
      const saved = await saveCare(clienteId, {
        requestId: crypto.randomUUID(),
        kind: "CONSULTATION",
        date: today(),
        title: "Consulta assistida",
        notes,
        anamnesis,
        returnDate: returnDate || null,
        checklist: selected,
      })
      setMessage(`Consulta salva no histórico (#${saved.id}).`)
      setAnamnesis("")
      setNotes("")
      setReturnDate("")
      setSelected([])
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível finalizar a consulta.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="consultation" className="scroll-mt-6 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Modo atendimento
      </p>
      <h2 className="mt-2 text-xl font-semibold">Consulta assistida</h2>
      <p className="mt-2 text-sm text-neutral-500">
        Um fluxo único para revisar dados, registrar conduta e fechar o retorno.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">Peso atual</p>
          <p className="mt-2 font-semibold">
            {currentWeight == null ? "—" : `${currentWeight.toLocaleString("pt-BR")} kg`}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">Último diário</p>
          <p className="mt-2 font-semibold">{latestRecord?.data ?? "—"}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">Dias com alimentação</p>
          <p className="mt-2 font-semibold">{foodDays}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">Checklist da consulta</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {checklistItems.map(item => (
            <label key={item} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => toggle(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <EnergyAssessment
        clienteId={clienteId}
        weightKg={currentWeight}
        heightCm={heightCm}
        age={age}
        weightDate={latestRecord?.data}
      />

      <form onSubmit={finish} className="mt-7 border-t border-neutral-100 pt-6">
        <label className="block text-sm font-medium">
          Anamnese
          <textarea
            value={anamnesis}
            onChange={event => setAnamnesis(event.target.value)}
            rows={5}
            maxLength={8000}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-3"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Observações e conduta
          <textarea
            value={notes}
            onChange={event => setNotes(event.target.value)}
            rows={4}
            maxLength={8000}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-3"
          />
        </label>
        <label className="mt-4 block text-sm font-medium sm:max-w-xs">
          Retorno
          <input
            type="date"
            min={today()}
            value={returnDate}
            onChange={event => setReturnDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-3"
          />
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={busy || (!anamnesis.trim() && !notes.trim())}
            className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Finalizando…" : "Finalizar consulta"}
          </button>
          <Link
            to="?section=plan"
            className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-teal-700"
          >
            Abrir plano alimentar
          </Link>
        </div>
        {message && <p className="mt-3 text-sm text-neutral-700">{message}</p>}
      </form>
    </section>
  )
}
