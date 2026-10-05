import { X } from "lucide-react"
import { useState, type KeyboardEvent } from "react"
import { updatePatient } from "../services/patients"
import { useToast } from "./ToastProvider"

function normalizeTags(values: string[]) {
  return [...new Set(
    values
      .map(value => value.trim().toLowerCase())
      .filter(Boolean),
  )].slice(0, 12)
}

export function PatientTags({
  clienteId,
  initialTags = [],
}: {
  clienteId: number
  initialTags?: string[]
}) {
  const toast = useToast()
  const [tags, setTags] = useState(normalizeTags(initialTags))
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function persist(nextTags: string[], successMessage: string) {
    setBusy(true)
    setMessage("")

    try {
      const normalized = normalizeTags(nextTags)
      const updated = await updatePatient(clienteId, { tags: normalized })
      const saved = normalizeTags(updated.tags ?? normalized)

      setTags(saved)
      setMessage(successMessage)
      toast.success(successMessage)
      return true
    } catch (cause) {
      const errorMessage =
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar as tags."

      setMessage(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function addTags() {
    const additions = normalizeTags(draft.split(","))

    if (additions.length === 0) {
      setMessage("Digite ao menos uma tag.")
      return
    }

    const nextTags = normalizeTags([...tags, ...additions])

    if (nextTags.length === tags.length) {
      setDraft("")
      setMessage("Essas tags já estão cadastradas.")
      return
    }

    const saved = await persist(nextTags, "Tags adicionadas.")
    if (saved) setDraft("")
  }

  async function removeTag(tag: string) {
    await persist(
      tags.filter(item => item !== tag),
      "Tag removida.",
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      if (!busy) void addTags()
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
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-1 pl-3 pr-1.5 text-xs font-medium text-neutral-700"
            >
              {tag}

              <button
                type="button"
                disabled={busy}
                onClick={() => void removeTag(tag)}
                aria-label={`Remover tag ${tag}`}
                className="grid h-5 w-5 place-items-center rounded-full text-neutral-400 transition hover:bg-white hover:text-red-600 disabled:opacity-40"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      <label className="mt-4 block text-xs text-neutral-500">
        Adicionar tags
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          disabled={busy || tags.length >= 12}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 disabled:bg-neutral-50"
          placeholder="emagrecimento, vegetariano, retorno pendente"
        />
      </label>

      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-neutral-400">
        <span>Separe várias tags por vírgulas ou pressione Enter.</span>
        <span>{tags.length}/12</span>
      </div>

      <button
        type="button"
        disabled={busy || !draft.trim() || tags.length >= 12}
        onClick={() => void addTags()}
        className="mt-3 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Adicionar tags"}
      </button>

      {message && <p className="mt-2 text-xs text-neutral-600">{message}</p>}
    </section>
  )
}
