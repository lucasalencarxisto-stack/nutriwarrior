import { useEffect, useMemo, useState } from "react"
import {
  createPlanTemplate,
  deletePlanTemplate,
  getPlanTemplates,
  type PlanTemplate,
} from "../services/planTemplates"
import type { Meal } from "../services/care"

export function PlanTemplateManager({
  title,
  notes,
  meals,
  onApply,
}: {
  title: string
  notes: string
  meals: Meal[]
  onApply: (template: PlanTemplate) => void
}) {
  const [templates, setTemplates] = useState<PlanTemplate[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let alive = true

    getPlanTemplates()
      .then(rows => {
        if (!alive) return
        setTemplates(rows)
        if (rows.length > 0) {
          setSelectedId(String(rows[0].id))
        }
      })
      .catch(cause => {
        if (alive) {
          setMessage(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os modelos.",
          )
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const selected = useMemo(
    () => templates.find(template => String(template.id) === selectedId) ?? null,
    [selectedId, templates],
  )

  const completeMeals =
    meals.length > 0 &&
    meals.every(
      meal => meal.name.trim().length > 0 && meal.portions.trim().length > 0,
    )

  async function saveCurrent() {
    if (!name.trim() || !title.trim() || !completeMeals || busy) return

    setBusy(true)
    setMessage("")

    try {
      const saved = await createPlanTemplate({
        name: name.trim(),
        title: title.trim(),
        notes,
        meals,
      })

      setTemplates(current => [saved, ...current])
      setSelectedId(String(saved.id))
      setName("")
      setMessage("Modelo salvo e disponível para outros pacientes.")
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o modelo.",
      )
    } finally {
      setBusy(false)
    }
  }

  async function removeSelected() {
    if (!selected || busy) return

    setBusy(true)
    setMessage("")

    try {
      await deletePlanTemplate(selected.id)
      const next = templates.filter(template => template.id !== selected.id)
      setTemplates(next)
      setSelectedId(next[0] ? String(next[0].id) : "")
      setMessage("Modelo excluído.")
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir o modelo.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Biblioteca do nutricionista
          </p>
          <h3 className="mt-1 text-sm font-semibold">Modelos de plano</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            O modelo guarda estrutura, orientações e refeições. Nenhum dado
            clínico do paciente é copiado.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-neutral-500">
          {templates.length} modelo(s)
        </span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Carregando modelos…</p>
      ) : (
        <>
          {templates.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <select
                value={selectedId}
                onChange={event => setSelectedId(event.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.meals.length} refeição(ões)
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selected || busy}
                onClick={() => selected && onApply(selected)}
                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Aplicar modelo
              </button>

              <button
                type="button"
                disabled={!selected || busy}
                onClick={() => void removeSelected()}
                className="rounded-xl border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
              >
                Excluir
              </button>
            </div>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={120}
              placeholder="Nome do modelo, ex.: Plano vegetariano base"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy || !name.trim() || !title.trim() || !completeMeals}
              onClick={() => void saveCurrent()}
              className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 disabled:opacity-40"
            >
              Salvar rascunho como modelo
            </button>
          </div>

          {!completeMeals && (
            <p className="mt-2 text-xs text-neutral-500">
              Preencha nome e porções de todas as refeições antes de salvar um modelo.
            </p>
          )}

          {message && (
            <p className="mt-3 text-xs text-neutral-600" role="status">
              {message}
            </p>
          )}
        </>
      )}
    </section>
  )
}
