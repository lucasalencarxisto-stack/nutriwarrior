import { useEffect, useState } from "react"
import {
  addPrivateNote,
  deletePrivateNote,
  getPrivateNotes,
  type PatientNote,
} from "../services/clinical"

export function PrivateNotes({ clienteId }: { clienteId: number }) {
  const [notes, setNotes] = useState<PatientNote[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true
    getPrivateNotes(clienteId)
      .then(rows => {
        if (alive) setNotes(rows)
      })
      .catch(cause => {
        if (alive) setError(cause instanceof Error ? cause.message : "Falha ao carregar notas.")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [clienteId])

  async function add() {
    if (!draft.trim() || busy) return
    setBusy(true)
    setError("")
    try {
      const saved = await addPrivateNote(clienteId, draft)
      setNotes(current => [saved, ...current])
      setDraft("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao salvar nota.")
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    setBusy(true)
    try {
      await deletePrivateNote(clienteId, id)
      setNotes(current => current.filter(note => note.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao excluir nota.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
        Área profissional
      </p>
      <h3 className="mt-2 font-semibold">Notas internas</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Visíveis somente para o nutricionista.
      </p>

      <textarea
        value={draft}
        onChange={event => setDraft(event.target.value)}
        maxLength={8000}
        rows={3}
        className="mt-4 w-full rounded-xl border border-neutral-200 p-3 text-sm"
        placeholder="Ex.: revisar exames no próximo retorno"
      />
      <button
        type="button"
        disabled={busy || !draft.trim()}
        onClick={() => void add()}
        className="mt-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Adicionar nota
      </button>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Carregando notas…</p>
      ) : (
        <div className="mt-4 space-y-3">
          {notes.map(note => (
            <article key={note.id} className="rounded-2xl bg-neutral-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6">{note.content}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-neutral-500">
                  {note.author} · {new Date(note.createdAt).toLocaleString("pt-BR")}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(note.id)}
                  className="text-xs font-medium text-red-700"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
          {notes.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhuma nota interna ainda.</p>
          )}
        </div>
      )}
    </section>
  )
}
