import { useEffect, useState } from "react"
import { CalendarClock, RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"
import { dateLabel, getFollowUps, today, type FollowUp } from "../services/care"

export function FollowUpPanel() {
  const [rows, setRows] = useState<FollowUp[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let alive = true

    getFollowUps()
      .then(data => {
        if (!alive) return
        setRows(data)
        setError("")
      })
      .catch(cause => {
        if (alive) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os retornos.",
          )
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [revision])

  const currentDate = today()
  const sortedRows = [...rows].sort((a, b) =>
    a.returnDate.localeCompare(b.returnDate),
  )

  const groups = [
    {
      title: "Hoje",
      items: sortedRows.filter(row => row.returnDate === currentDate),
    },
    {
      title: "Próximos retornos",
      items: sortedRows.filter(row => row.returnDate > currentDate),
    },
    {
      title: "Datas passadas",
      items: sortedRows.filter(row => row.returnDate < currentDate).reverse(),
    },
  ]

  function refresh() {
    setLoading(true)
    setError("")
    setRevision(value => value + 1)
  }

  return (
    <section className="my-6 rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.045)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-700">
            <CalendarClock size={18} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Acompanhamento
            </p>
            <h2 className="mt-1 font-semibold">Retornos previstos</h2>
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        Datas indicadas na consulta mais recente de cada paciente. Não são
        agendamentos confirmados.
      </p>

      {loading ? (
        <p role="status" className="mt-4 text-sm text-neutral-500">
          Carregando retornos…
        </p>
      ) : error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error} Use Atualizar para tentar novamente.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {groups.map(group => (
            <section
              key={group.title}
              className="min-w-0 rounded-[22px] border border-neutral-100 bg-neutral-50/60 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <span
                  aria-label={`${group.items.length} retornos`}
                  className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
                >
                  {group.items.length}
                </span>
              </div>

              {group.items.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">
                  Nenhum retorno nesta categoria.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-neutral-100">
                  {group.items.map(row => (
                    <li key={row.clienteId} className="py-3">
                      <Link
                        to={`/professional/patients/${row.clienteId}?section=consultations`}
                        className="break-words text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                      >
                        {row.patient}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        {dateLabel(row.returnDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
