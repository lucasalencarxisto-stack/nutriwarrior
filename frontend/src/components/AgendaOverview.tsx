import { useEffect, useState } from "react"
import { CalendarDays, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { getAgenda, type Appointment } from "../services/clinical"
import { formatScheduleDateTime } from "./SchedulePicker"

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
    <section className="mt-6 rounded-[30px] border border-neutral-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.045)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Agenda
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Próximas consultas</h2>
        </div>

        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <CalendarDays size={20} />
        </span>
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
              className="group rounded-[22px] border border-neutral-100 bg-neutral-50/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.patient}</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 shadow-sm">
                  {labels[item.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {formatScheduleDateTime(item.startsAt)}
              </p>
              {item.notes && (
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                  {item.notes}
                </p>
              )}

              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-700 opacity-80 transition group-hover:opacity-100">
                Abrir atendimento
                <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
