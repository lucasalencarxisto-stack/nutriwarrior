import { useEffect, useRef, useState, type FormEvent } from "react"

import {
  dateLabel,
  getCareHistory,
  getMealPlanDraft,
  saveCare,
  today,
  type CareRecord,
  type Meal,
} from "../services/care"

import { PlanView } from "./PlanView"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"

const input = "mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-600"
const emptyMeal = (): Meal => ({ name: "", portions: "", substitutions: "" })
export function CareWorkspace({ clienteId, mode, records, summaries }: { clienteId: number; mode: "CONSULTATION" | "PLAN"; records: DayRecord[]; summaries: NutritionSummary[] }) {
  const [history, setHistory] = useState<CareRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [historyReady, setHistoryReady] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const [title, setTitle] = useState(mode === "PLAN" ? "Plano alimentar" : "Consulta nutricional")
  const [date, setDate] = useState(today())
  const [returnDate, setReturnDate] = useState("")
  const [notes, setNotes] = useState("")
  const [anamnesis, setAnamnesis] = useState("")
  const [meals, setMeals] = useState<Meal[]>([emptyMeal()])
  const [draftLoading, setDraftLoading] = useState(mode === "PLAN")
  const [draftReady, setDraftReady] = useState(mode !== "PLAN")
  const [draftError, setDraftError] = useState("")
  const [draftRevision, setDraftRevision] = useState(0)

  const draftVersion = useRef<number | null>(null)

  const formBlocked =
    busy || (mode === "PLAN" && (draftLoading || !draftReady))

  const requestId = useRef<string | null>(null)
  const saving = useRef(false)
  useEffect(() => {
    let alive = true; setLoading(true); setError("")
    getCareHistory(clienteId).then(rows => { if (alive) { setHistory(rows); setHistoryReady(true) } }).catch(e => { if (alive) { setError(e.message); setHistoryReady(false) } }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [clienteId, revision])
  useEffect(() => {
    if (mode !== "PLAN") return

    let alive = true

    setDraftLoading(true)
    setDraftReady(false)
    setDraftError("")

    getMealPlanDraft(clienteId)
      .then(draft => {
        if (!alive) return

        draftVersion.current = draft?.version ?? null

        if (draft) {
          setTitle(draft.title)
          setDate(draft.planDate ?? "")
          setNotes(draft.notes)
          setMeals(
            draft.meals.length > 0
              ? draft.meals.map(meal => ({ ...meal }))
              : [emptyMeal()]
          )
        }

        setDraftReady(true)
      })
      .catch(error => {
        if (!alive) return

        setDraftError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o rascunho."
        )
      })
      .finally(() => {
        if (alive) setDraftLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clienteId, mode, draftRevision])
  const entries = history.filter(item => item.kind === mode)
  const lastVisit = history.filter(item => item.kind === "CONSULTATION").sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0]
  const since = lastVisit?.date
  const days = records.filter(record => !since || record.data >= since)
  const nutritionDays = summaries.filter(row => (!since || row.data >= since) && row.quantidadeItens > 0)
  function editMeal(index: number, field: keyof Meal, value: string) { setMeals(current => current.map((meal, i) => i === index ? { ...meal, [field]: value } : meal)) }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current || formBlocked) return
    saving.current = true; setBusy(true); setError(""); setSuccess("")
    requestId.current ??= crypto.randomUUID()
    try {
      const saved = await saveCare(clienteId, { requestId: requestId.current, kind: mode, date, title, notes, anamnesis: mode === "CONSULTATION" ? anamnesis : "", ...(mode === "PLAN" ? { meals } : { returnDate: returnDate || null }) })
      setHistory(current => [saved, ...current.filter(row => row.id !== saved.id)])
      requestId.current = null; setNotes(""); setAnamnesis(""); setReturnDate(""); if (mode === "PLAN") setMeals([emptyMeal()])
      setSuccess(mode === "PLAN" ? `Versão ${saved.version} publicada e disponível ao paciente.` : "Consulta salva no histórico.")
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar. Tente novamente.") }
    finally { saving.current = false; setBusy(false) }
  }
  return <section className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-7">
    <h2 className="text-xl font-semibold">{mode === "PLAN" ? "Plano alimentar" : "Consultas"}</h2>
    <p className="mt-2 text-sm text-neutral-500">{mode === "PLAN" ? "Monte refeições e substituições. Publicar cria uma nova versão visível ao paciente; versões anteriores ficam preservadas." : "Anamnese e observações ficam na área profissional. Registros salvos permanecem no histórico; correções devem ser registradas em uma nova entrada."}</p>
    {mode === "CONSULTATION" && historyReady && !loading && <aside className="mt-5 rounded-2xl bg-teal-50 p-4 text-sm">
      <h3 className="font-semibold">Preparação do retorno · registros disponíveis</h3>
      <p className="mt-2">{since ? `Desde ${dateLabel(since)}` : "No histórico disponível"}: {days.filter(row => row.pesoKg != null).length} pesagens e {nutritionDays.length} dias com alimentos registrados.</p>
      <p className="mt-1 text-xs text-neutral-600">Frequência de registros não significa adesão ao plano. Dias sem registros não entram como consumo zero.</p>
    </aside>}
    {error && <div role="alert" className="mt-4 text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => setRevision(x => x + 1)}>Recarregar histórico</button></div>}
    {success && <p role="status" className="mt-4 text-sm text-teal-700">{success}</p>}
    {loading ? <p className="mt-4 text-sm text-neutral-500">Carregando histórico…</p> : !historyReady ? null : <>
      {mode === "PLAN" && draftLoading && (
        <p role="status" className="mt-4 text-sm text-neutral-500">
          Buscando rascunho salvo…
        </p>
      )}

      {mode === "PLAN" && draftError && (
        <div role="alert" className="mt-4 text-sm text-red-700">
          <p>{draftError}</p>

          <button
            type="button"
            onClick={() => setDraftRevision(value => value + 1)}
            className="mt-2 underline"
          >
            Tentar carregar novamente
          </button>
        </div>
      )}
      <form onSubmit={submit} onChange={() => { requestId.current = null; setSuccess("") }} className="mt-6 border-t border-neutral-100 pt-5">
        <fieldset disabled={formBlocked} className="space-y-4 disabled:opacity-60">
          <legend className="mb-4 font-semibold">{mode === "PLAN" ? "Nova publicação" : "Registrar consulta"}</legend>
          <label className="block text-sm">Título<input className={input} required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Data<input className={input} type="date" required max={today()} value={date} onChange={e => setDate(e.target.value)} /></label>
            {mode === "CONSULTATION" && <label className="block text-sm">Retorno previsto (opcional)<input className={input} type="date" min={date} value={returnDate} onChange={e => setReturnDate(e.target.value)} /></label>}</div>
          {mode === "CONSULTATION" && <label className="block text-sm">Anamnese<textarea className={input} rows={5} maxLength={8000} value={anamnesis} onChange={e => setAnamnesis(e.target.value)} placeholder="Objetivo, rotina, preferências, restrições e histórico relatado pelo paciente" /></label>}
          <label className="block text-sm">{mode === "PLAN" ? "Orientações ao paciente" : "Observações e conduta"}<textarea className={input} rows={4} maxLength={8000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
          {mode === "PLAN" && <>{meals.map((meal, index) => <fieldset key={index} className="rounded-2xl bg-neutral-50 p-4"><legend className="text-sm font-semibold">Refeição {index + 1}</legend>
            <label className="block text-sm">Nome / horário<input className={input} required maxLength={80} value={meal.name} onChange={e => editMeal(index, "name", e.target.value)} /></label>
            <label className="mt-3 block text-sm">Alimentos, porções e medidas caseiras<textarea className={input} required rows={3} maxLength={3000} value={meal.portions} onChange={e => editMeal(index, "portions", e.target.value)} /></label>
            <label className="mt-3 block text-sm">Substituições orientadas<textarea className={input} rows={2} maxLength={3000} value={meal.substitutions} onChange={e => editMeal(index, "substitutions", e.target.value)} /></label>
            {meals.length > 1 && <button type="button" className="mt-2 text-xs text-red-700" onClick={() => { setMeals(current => current.filter((_, i) => i !== index)); requestId.current = null }}>Remover refeição do rascunho</button>}
          </fieldset>)}<button type="button" disabled={meals.length >= 12} className="text-sm font-semibold text-teal-700 disabled:opacity-40" onClick={() => { setMeals(current => [...current, emptyMeal()]); requestId.current = null }}>Adicionar refeição</button></>}
          <button className="block rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white" type="submit">{busy ? "Salvando…" : mode === "PLAN" ? "Publicar plano para o paciente" : "Salvar consulta"}</button>
        </fieldset>
      </form>
      <h3 className="mt-8 font-semibold">Histórico</h3>
      {entries.length === 0 ? <p className="mt-3 text-sm text-neutral-500">Nenhum registro salvo nesta seção.</p> : entries.map(entry => <details key={entry.id} className="mt-3 rounded-xl border border-neutral-200 p-4"><summary className="cursor-pointer text-sm font-medium">{dateLabel(entry.date)} · {entry.title} · {mode === "PLAN" ? `versão ${entry.version}` : entry.author}</summary>
        {mode === "PLAN" ? <div className="mt-4"><PlanView plan={entry} /></div> : <div className="mt-3 space-y-3 text-sm leading-6"><p className="text-xs text-neutral-500">Registrado por {entry.author} em {new Date(entry.createdAt).toLocaleString("pt-BR")}</p>{entry.anamnesis && <div><h4 className="font-semibold">Anamnese</h4><p className="whitespace-pre-wrap">{entry.anamnesis}</p></div>}<div><h4 className="font-semibold">Observações</h4><p className="whitespace-pre-wrap">{entry.notes}</p></div>{entry.returnDate && <p>Retorno: {dateLabel(entry.returnDate)}</p>}</div>}
      </details>)}
    </>}
  </section>
}
