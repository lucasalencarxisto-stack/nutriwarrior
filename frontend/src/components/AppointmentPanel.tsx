import { useEffect, useState, type FormEvent } from "react"
import {
  createAppointment,
  deleteAppointment,
  getAgenda,
  updateAppointment,
  type Appointment,
  type AppointmentStatus,
} from "../services/clinical"

const statusLabel: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Realizado",
  CANCELLED: "Cancelado",
}

export function AppointmentPanel({ clienteId }: { clienteId: number }) {
  const [rows, setRows] = useState<Appointment[]>([])
  const [startsAt, setStartsAt] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true
    getAgenda()
      .then(items => {
        if (alive) setRows(items.filter(item => item.clienteId === clienteId))
      })
      .catch(cause => {
        if (alive) setError(cause instanceof Error ? cause.message : "Falha ao carregar agenda.")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [clienteId])

  async function create(event: FormEvent) {
    event.preventDefault()
    if (!startsAt || busy) return
    setBusy(true)
    setError("")
    try {
      const saved = await createAppointment(clienteId, {
        startsAt: new Date(startsAt).toISOString(),
        status: "SCHEDULED",
        notes,
      })
      setRows(current => [...current, saved].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
      setStartsAt("")
      setNotes("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao agendar consulta.")
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(item: Appointment, status: AppointmentStatus) {
    setBusy(true)
    try {
      const updated = await updateAppointment(clienteId, item.id, { status })
      setRows(current => current.map(row => row.id === item.id ? updated : row))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao atualizar consulta.")
    } finally {
      setBusy(false)
    }
  }

  async function remove(item: Appointment) {
    setBusy(true)
    try {
      await deleteAppointment(clienteId, item.id)
      setRows(current => current.filter(row => row.id !== item.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao excluir consulta.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="agenda" className="scroll-mt-6 rounded-3xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Agenda</p>
      <h3 className="mt-2 font-semibold">Consultas agendadas</h3>

      <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="datetime-local"
          required
          value={startsAt}
          onChange={event => setStartsAt(event.target.value)}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          value={notes}
          onChange={event => setNotes(event.target.value)}
          maxLength={4000}
          placeholder="Observação opcional"
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <button
          disabled={busy}
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Agendar
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Carregando agenda…</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(item => (
            <article key={item.id} className="rounded-2xl bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {new Date(item.startsAt).toLocaleString("pt-BR")}
                  </p>
                  {item.notes && <p className="mt-1 text-xs text-neutral-500">{item.notes}</p>}
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium">
                  {statusLabel[item.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["CONFIRMED", "COMPLETED", "CANCELLED"] as AppointmentStatus[]).map(status => (
                  <button
                    key={status}
                    type="button"
                    disabled={busy || item.status === status}
                    onClick={() => void setStatus(item, status)}
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    {statusLabel[status]}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(item)}
                  className="ml-auto text-xs font-medium text-red-700"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhuma consulta agendada.</p>
          )}
        </div>
      )}
    </section>
  )
}
