import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAgenda, type Appointment } from "../services/clinical"

const labels = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Realizado",
  CANCELLED: "Cancelado",
} as const

export function AgendaOverview() {
  const [rows, setRows] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadedAtMs, setLoadedAtMs] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    getAgenda()
      .then(items => {
        if (!alive) return
        setRows(items)
        setLoadedAtMs(Date.now())
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const cutoffMs = loadedAtMs == null ? 0 : loadedAtMs - 86400000

  const upcoming = rows
    .filter(item => item.status !== "CANCELLED" && item.status !== "COMPLETED")
    .filter(item => new Date(item.startsAt).getTime() >= cutoffMs)
    .slice(0, 8)

  return (
    <section className="mt-8 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Agenda
        </p>
        <h2 className="mt-2 text-xl font-semibold">Próximas consultas</h2>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-neutral-500">Carregando agenda…</p>
      ) : upcoming.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500">
          Nenhuma consulta futura registrada.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {upcoming.map(item => (
            <Link
              key={item.id}
              to={`/professional/patients/${item.clienteId}?section=workspace`}
              className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 transition hover:border-teal-200"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.patient}</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-neutral-600">
                  {labels[item.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {new Date(item.startsAt).toLocaleString("pt-BR")}
              </p>
              {item.notes && (
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                  {item.notes}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
