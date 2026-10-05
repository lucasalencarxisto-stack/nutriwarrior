import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"

import {
  dateLabel,
  deleteMealPlanDraft,
  getCareHistory,
  getMealPlanDraft,
  saveCare,
  saveMealPlanDraft,
  today,
  type CareRecord,
  type Meal,
} from "../services/care"

import { PlanView } from "./PlanView"
import { PlanTemplateManager } from "./PlanTemplateManager"
import { ScheduleDatePicker } from "./SchedulePicker"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"

const input =
  "mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-600"

const emptyMeal = (): Meal => ({ name: "", portions: "", substitutions: "" })

function draftSignature(title: string, date: string, notes: string, meals: Meal[]) {
  return JSON.stringify({ title, date, notes, meals })
}

function describePlanChanges(current: CareRecord, previous: CareRecord) {
  const currentMeals = current.payload.meals ?? []
  const previousMeals = previous.payload.meals ?? []
  const max = Math.max(currentMeals.length, previousMeals.length)
  const changes: string[] = []

  if (currentMeals.length !== previousMeals.length) {
    changes.push(
      `Quantidade de refeições: ${previousMeals.length} → ${currentMeals.length}.`,
    )
  }

  for (let index = 0; index < max; index += 1) {
    const before = previousMeals[index]
    const after = currentMeals[index]

    if (!before && after) {
      changes.push(`Refeição ${index + 1} adicionada: ${after.name || "sem nome"}.`)
      continue
    }

    if (before && !after) {
      changes.push(`Refeição ${index + 1} removida: ${before.name || "sem nome"}.`)
      continue
    }

    if (
      before &&
      after &&
      (before.name !== after.name ||
        before.portions !== after.portions ||
        before.substitutions !== after.substitutions)
    ) {
      changes.push(`Refeição ${index + 1} alterada: ${before.name} → ${after.name}.`)
    }
  }

  if (current.notes !== previous.notes) {
    changes.push("Orientações gerais foram alteradas.")
  }

  return changes
}

export function CareWorkspace({
  clienteId,
  mode,
  records,
  summaries,
}: {
  clienteId: number
  mode: "CONSULTATION" | "PLAN"
  records: DayRecord[]
  summaries: NutritionSummary[]
}) {
  const [history, setHistory] = useState<CareRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [historyReady, setHistoryReady] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)

  const [title, setTitle] = useState(
    mode === "PLAN" ? "Plano alimentar" : "Consulta nutricional",
  )
  const [date, setDate] = useState(today())
  const [returnDate, setReturnDate] = useState("")
  const [notes, setNotes] = useState("")
  const [anamnesis, setAnamnesis] = useState("")
  const [meals, setMeals] = useState<Meal[]>([emptyMeal()])

  const [draftLoading, setDraftLoading] = useState(mode === "PLAN")
  const [draftReady, setDraftReady] = useState(mode !== "PLAN")
  const [draftError, setDraftError] = useState("")
  const [draftRevision, setDraftRevision] = useState(0)
  const [draftSaving, setDraftSaving] = useState(false)
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null)

  const draftVersion = useRef<number | null>(null)
  const lastDraftSignature = useRef("")
  const requestId = useRef<string | null>(null)
  const saving = useRef(false)
  const savingDraft = useRef(false)

  const signature = draftSignature(title, date, notes, meals)
  const formBlocked =
    busy ||
    draftSaving ||
    (mode === "PLAN" && (draftLoading || !draftReady))

  useEffect(() => {
    let alive = true

    getCareHistory(clienteId)
      .then(rows => {
        if (!alive) return
        setHistory(rows)
        setHistoryReady(true)
      })
      .catch(cause => {
        if (!alive) return
        setError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico.")
        setHistoryReady(false)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clienteId, revision])

  useEffect(() => {
    if (mode !== "PLAN") return

    let alive = true

    getMealPlanDraft(clienteId)
      .then(draft => {
        if (!alive) return

        draftVersion.current = draft?.version ?? null

        if (draft) {
          const loadedTitle = draft.title
          const loadedDate = draft.planDate ?? today()
          const loadedNotes = draft.notes
          const loadedMeals =
            draft.meals.length > 0
              ? draft.meals.map(meal => ({ ...meal }))
              : [emptyMeal()]

          setTitle(loadedTitle)
          setDate(loadedDate)
          setNotes(loadedNotes)
          setMeals(loadedMeals)
          setLastDraftSavedAt(draft.updatedAt)
          lastDraftSignature.current = draftSignature(
            loadedTitle,
            loadedDate,
            loadedNotes,
            loadedMeals,
          )
        } else {
          lastDraftSignature.current = draftSignature(
            "Plano alimentar",
            today(),
            "",
            [emptyMeal()],
          )
        }

        setDraftReady(true)
      })
      .catch(cause => {
        if (!alive) return
        setDraftError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar o rascunho.",
        )
      })
      .finally(() => {
        if (alive) setDraftLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clienteId, mode, draftRevision])

  const persistDraft = useCallback(async () => {
    if (
      mode !== "PLAN" ||
      !draftReady ||
      draftLoading ||
      busy ||
      savingDraft.current
    ) {
      return
    }

    const currentSignature = draftSignature(title, date, notes, meals)
    if (currentSignature === lastDraftSignature.current) return

    savingDraft.current = true
    setDraftSaving(true)
    setDraftError("")

    try {
      const saved = await saveMealPlanDraft(clienteId, {
        title,
        planDate: date || null,
        notes,
        meals,
        version: draftVersion.current,
      })

      draftVersion.current = saved.version
      lastDraftSignature.current = currentSignature
      setLastDraftSavedAt(saved.updatedAt)
    } catch (cause) {
      setDraftError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o rascunho.",
      )
    } finally {
      savingDraft.current = false
      setDraftSaving(false)
    }
  }, [
    busy,
    clienteId,
    date,
    draftLoading,
    draftReady,
    meals,
    mode,
    notes,
    title,
  ])

  useEffect(() => {
    if (
      mode !== "PLAN" ||
      !draftReady ||
      draftLoading ||
      busy ||
      signature === lastDraftSignature.current
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      void persistDraft()
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [busy, draftLoading, draftReady, mode, persistDraft, signature])

  const entries = history.filter(item => item.kind === mode)
  const planEntries =
    mode === "PLAN" ? entries.filter(item => item.kind === "PLAN") : []
  const latestPlan = planEntries[0]
  const previousPlan = planEntries[1]
  const planChanges =
    latestPlan && previousPlan ? describePlanChanges(latestPlan, previousPlan) : []

  const lastVisit = history
    .filter(item => item.kind === "CONSULTATION")
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0]
  const since = lastVisit?.date
  const days = records.filter(record => !since || record.data >= since)
  const nutritionDays = summaries.filter(
    row => (!since || row.data >= since) && row.quantidadeItens > 0,
  )

  function editMeal(index: number, field: keyof Meal, value: string) {
    setMeals(current =>
      current.map((meal, mealIndex) =>
        mealIndex === index ? { ...meal, [field]: value } : meal,
      ),
    )
  }

  function duplicateMeal(index: number) {
    if (meals.length >= 12) return
    setMeals(current => {
      const copy = { ...current[index] }
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
    })
    requestId.current = null
  }

  function moveMeal(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= meals.length) return
    setMeals(current => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
    requestId.current = null
  }

  function useLatestPlanAsBase() {
    if (!latestPlan) return
    const baseMeals = (latestPlan.payload.meals ?? []).map(meal => ({ ...meal }))
    setTitle(latestPlan.title)
    setDate(today())
    setNotes(latestPlan.notes)
    setMeals(baseMeals.length > 0 ? baseMeals : [emptyMeal()])
    requestId.current = null
    setSuccess(`Versão ${latestPlan.version} carregada como base do novo rascunho.`)
  }

  function resetPlanEditor() {
    const resetTitle = "Plano alimentar"
    const resetDate = today()
    const resetMeals = [emptyMeal()]

    setTitle(resetTitle)
    setDate(resetDate)
    setNotes("")
    setMeals(resetMeals)
    setLastDraftSavedAt(null)
    draftVersion.current = null
    lastDraftSignature.current = draftSignature(
      resetTitle,
      resetDate,
      "",
      resetMeals,
    )
  }

  async function discardDraft() {
    if (mode !== "PLAN" || busy || draftSaving) return

    setBusy(true)
    setDraftError("")

    try {
      await deleteMealPlanDraft(clienteId)
      resetPlanEditor()
      setSuccess("Rascunho descartado.")
    } catch (cause) {
      setDraftError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível descartar o rascunho.",
      )
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current || formBlocked) return

    saving.current = true
    setBusy(true)
    setError("")
    setSuccess("")
    requestId.current ??= crypto.randomUUID()

    try {
      const saved = await saveCare(clienteId, {
        requestId: requestId.current,
        kind: mode,
        date,
        title,
        notes,
        anamnesis: mode === "CONSULTATION" ? anamnesis : "",
        ...(mode === "PLAN"
          ? { meals }
          : { returnDate: returnDate || null }),
      })

      setHistory(current => [
        saved,
        ...current.filter(row => row.id !== saved.id),
      ])
      requestId.current = null

      if (mode === "PLAN") {
        try {
          await deleteMealPlanDraft(clienteId)
          resetPlanEditor()
          setDraftError("")
        } catch {
          setDraftError(
            "O plano foi publicado, mas o rascunho não pôde ser limpo. Use “Descartar rascunho” antes da próxima revisão.",
          )
        }

        setSuccess(
          `Versão ${saved.version} publicada e disponível ao paciente.`,
        )
      } else {
        setNotes("")
        setAnamnesis("")
        setReturnDate("")
        setSuccess("Consulta salva no histórico.")
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar. Tente novamente.",
      )
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  function reloadHistory() {
    setLoading(true)
    setHistoryReady(false)
    setError("")
    setRevision(value => value + 1)
  }

  function reloadDraft() {
    setDraftLoading(true)
    setDraftReady(false)
    setDraftError("")
    setDraftRevision(value => value + 1)
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-semibold">
        {mode === "PLAN" ? "Plano alimentar" : "Consultas"}
      </h2>

      <p className="mt-2 text-sm text-neutral-500">
        {mode === "PLAN"
          ? "Monte refeições e substituições. O rascunho é salvo automaticamente; publicar cria uma nova versão visível ao paciente."
          : "Anamnese e observações ficam na área profissional. Registros salvos permanecem no histórico; correções devem ser registradas em uma nova entrada."}
      </p>

      {mode === "CONSULTATION" && historyReady && !loading && (
        <aside className="mt-5 rounded-2xl bg-teal-50 p-4 text-sm">
          <h3 className="font-semibold">
            Preparação do retorno · registros disponíveis
          </h3>
          <p className="mt-2">
            {since ? `Desde ${dateLabel(since)}` : "No histórico disponível"}:{" "}
            {days.filter(row => row.pesoKg != null).length} pesagens e{" "}
            {nutritionDays.length} dias com alimentos registrados.
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Frequência de registros não significa adesão ao plano. Dias sem
            registros não entram como consumo zero.
          </p>
        </aside>
      )}

      {error && (
        <div role="alert" className="mt-4 text-sm text-red-700">
          {error}{" "}
          <button type="button" className="underline" onClick={reloadHistory}>
            Recarregar histórico
          </button>
        </div>
      )}

      {success && (
        <p role="status" className="mt-4 text-sm text-teal-700">
          {success}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Carregando histórico…</p>
      ) : !historyReady ? null : (
        <>
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
                onClick={reloadDraft}
                className="mt-2 underline"
              >
                Tentar carregar novamente
              </button>
            </div>
          )}

          <form
            onSubmit={submit}
            onChange={() => {
              requestId.current = null
              setSuccess("")
            }}
            className="mt-6 border-t border-neutral-100 pt-5"
          >
            <fieldset
              disabled={formBlocked}
              className="space-y-4 disabled:opacity-60"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <legend className="font-semibold">
                  {mode === "PLAN" ? "Próxima versão" : "Registrar consulta"}
                </legend>

                {mode === "PLAN" && (
                  <span className="text-xs text-neutral-500">
                    {draftSaving
                      ? "Salvando rascunho…"
                      : lastDraftSavedAt
                        ? `Rascunho salvo às ${new Date(lastDraftSavedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                        : "Alterações serão salvas automaticamente"}
                  </span>
                )}
              </div>

              {mode === "PLAN" && (
                <PlanTemplateManager
                  title={title}
                  notes={notes}
                  meals={meals}
                  onApply={template => {
                    const templateMeals = template.meals.map(meal => ({ ...meal }))
                    setTitle(template.title)
                    setDate(today())
                    setNotes(template.notes)
                    setMeals(templateMeals.length > 0 ? templateMeals : [emptyMeal()])
                    requestId.current = null
                    setSuccess(`Modelo “${template.name}” aplicado ao rascunho.`)
                  }}
                />
              )}

              {mode === "PLAN" && latestPlan && (
                <button
                  type="button"
                  onClick={useLatestPlanAsBase}
                  className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800"
                >
                  Usar plano vigente como base
                </button>
              )}

              <label className="block text-sm">
                Título
                <input
                  className={input}
                  required={mode !== "PLAN"}
                  maxLength={160}
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <ScheduleDatePicker
                  id={mode === "PLAN" ? "plan-date" : "consultation-date"}
                  label="Data"
                  value={date}
                  onChange={setDate}
                  max={today()}
                  required
                  disabled={formBlocked}
                />

                {mode === "CONSULTATION" && (
                  <ScheduleDatePicker
                    id="consultation-return-date"
                    label="Retorno previsto (opcional)"
                    value={returnDate}
                    onChange={setReturnDate}
                    min={date}
                    disabled={formBlocked}
                  />
                )}
              </div>

              {mode === "CONSULTATION" && (
                <label className="block text-sm">
                  Anamnese
                  <textarea
                    className={input}
                    rows={5}
                    maxLength={8000}
                    value={anamnesis}
                    onChange={event => setAnamnesis(event.target.value)}
                    placeholder="Objetivo, rotina, preferências, restrições e histórico relatado pelo paciente"
                  />
                </label>
              )}

              <label className="block text-sm">
                {mode === "PLAN"
                  ? "Orientações ao paciente"
                  : "Observações e conduta"}
                <textarea
                  className={input}
                  rows={4}
                  maxLength={8000}
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                />
              </label>

              {mode === "PLAN" && (
                <>
                  {meals.map((meal, index) => (
                    <fieldset
                      key={index}
                      className="rounded-2xl bg-neutral-50 p-4"
                    >
                      <legend className="text-sm font-semibold">
                        Refeição {index + 1}
                      </legend>
                      <label className="block text-sm">
                        Nome / horário
                        <input
                          className={input}
                          required
                          maxLength={80}
                          value={meal.name}
                          onChange={event =>
                            editMeal(index, "name", event.target.value)
                          }
                        />
                      </label>
                      <label className="mt-3 block text-sm">
                        Alimentos, porções e medidas caseiras
                        <textarea
                          className={input}
                          required
                          rows={3}
                          maxLength={3000}
                          value={meal.portions}
                          onChange={event =>
                            editMeal(index, "portions", event.target.value)
                          }
                        />
                      </label>
                      <label className="mt-3 block text-sm">
                        Substituições orientadas
                        <textarea
                          className={input}
                          rows={2}
                          maxLength={3000}
                          value={meal.substitutions}
                          onChange={event =>
                            editMeal(index, "substitutions", event.target.value)
                          }
                        />
                      </label>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveMeal(index, -1)}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs disabled:opacity-30"
                        >
                          ↑ Subir
                        </button>
                        <button
                          type="button"
                          disabled={index === meals.length - 1}
                          onClick={() => moveMeal(index, 1)}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs disabled:opacity-30"
                        >
                          ↓ Descer
                        </button>
                        <button
                          type="button"
                          disabled={meals.length >= 12}
                          onClick={() => duplicateMeal(index)}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs disabled:opacity-30"
                        >
                          Duplicar refeição
                        </button>
                        {meals.length > 1 && (
                          <button
                            type="button"
                            className="rounded-lg px-2.5 py-1.5 text-xs text-red-700"
                            onClick={() => {
                              setMeals(current =>
                                current.filter((_, mealIndex) => mealIndex !== index),
                              )
                              requestId.current = null
                            }}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </fieldset>
                  ))}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={meals.length >= 12}
                      className="text-sm font-semibold text-teal-700 disabled:opacity-40"
                      onClick={() => {
                        setMeals(current => [...current, emptyMeal()])
                        requestId.current = null
                      }}
                    >
                      Adicionar refeição
                    </button>

                    <button
                      type="button"
                      disabled={draftSaving || busy}
                      className="text-sm font-semibold text-neutral-600 disabled:opacity-40"
                      onClick={() => void persistDraft()}
                    >
                      Salvar rascunho agora
                    </button>

                    <button
                      type="button"
                      disabled={draftSaving || busy}
                      className="text-sm font-semibold text-red-700 disabled:opacity-40"
                      onClick={() => void discardDraft()}
                    >
                      Descartar rascunho
                    </button>
                  </div>
                </>
              )}

              <button
                className="block rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"
                type="submit"
              >
                {busy
                  ? "Salvando…"
                  : mode === "PLAN"
                    ? "Publicar plano para o paciente"
                    : "Salvar consulta"}
              </button>
            </fieldset>
          </form>

          {mode === "PLAN" && latestPlan && previousPlan && (
            <section className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <h3 className="text-sm font-semibold">
                Comparação · versão {previousPlan.version} → {latestPlan.version}
              </h3>
              {planChanges.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-600">
                  Nenhuma diferença textual detectada entre as duas versões.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                  {planChanges.map(change => (
                    <li key={change}>• {change}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <h3 className="mt-8 font-semibold">Histórico</h3>

          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">
              Nenhum registro salvo nesta seção.
            </p>
          ) : (
            entries.map(entry => (
              <details
                key={entry.id}
                className="mt-3 rounded-xl border border-neutral-200 p-4"
              >
                <summary className="cursor-pointer text-sm font-medium">
                  {dateLabel(entry.date)} · {entry.title} ·{" "}
                  {mode === "PLAN"
                    ? `versão ${entry.version}`
                    : entry.author}
                </summary>

                {mode === "PLAN" ? (
                  <div className="mt-4">
                    <PlanView plan={entry} />
                  </div>
                ) : (
                  <div className="mt-3 space-y-3 text-sm leading-6">
                    <p className="text-xs text-neutral-500">
                      Registrado por {entry.author} em{" "}
                      {new Date(entry.createdAt).toLocaleString("pt-BR")}
                    </p>
                    {entry.payload.checklist && entry.payload.checklist.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Checklist concluído</h4>
                        <ul className="mt-1 list-disc pl-5">
                          {entry.payload.checklist.map(item => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {entry.anamnesis && (
                      <div>
                        <h4 className="font-semibold">Anamnese</h4>
                        <p className="whitespace-pre-wrap">{entry.anamnesis}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">Observações</h4>
                      <p className="whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                    {entry.returnDate && (
                      <p>Retorno: {dateLabel(entry.returnDate)}</p>
                    )}
                  </div>
                )}
              </details>
            ))
          )}
        </>
      )}
    </section>
  )
}
