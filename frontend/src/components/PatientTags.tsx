import { useState } from "react"
import { updatePatient } from "../services/patients"

export function PatientTags({
  clienteId,
  initialTags = [],
}: {
  clienteId: number
  initialTags?: string[]
}) {
  const [tags, setTags] = useState(initialTags)
  const [draft, setDraft] = useState(initialTags.join(", "))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function save() {
    const values = [...new Set(
      draft
        .split(",")
        .map(value => value.trim().toLowerCase())
        .filter(Boolean),
    )].slice(0, 12)

    setBusy(true)
    setMessage("")
    try {
      const updated = await updatePatient(clienteId, { tags: values })
      setTags(updated.tags ?? values)
      setDraft((updated.tags ?? values).join(", "))
      setMessage("Tags salvas.")
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Não foi possível salvar as tags.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Organização
      </p>
      <h3 className="mt-2 font-semibold">Tags do paciente</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <span className="text-sm text-neutral-500">Nenhuma tag cadastrada.</span>
        ) : (
          tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
            >
              {tag}
            </span>
          ))
        )}
      </div>
      <label className="mt-4 block text-xs text-neutral-500">
        Separe por vírgulas
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          maxLength={500}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          placeholder="emagrecimento, vegetariano, retorno pendente"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="mt-3 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Salvar tags"}
      </button>
      {message && <p className="mt-2 text-xs text-neutral-600">{message}</p>}
    </section>
  )
}
