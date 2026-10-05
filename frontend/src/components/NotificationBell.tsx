import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Bell } from "lucide-react"
import {
  getClinicalNotifications,
  type ClinicalNotification,
} from "../services/clinical"

export function NotificationBell() {
  const [items, setItems] = useState<ClinicalNotification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    getClinicalNotifications()
      .then(rows => {
        if (alive) setItems(rows)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificações"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50"
      >
        <Bell size={18} />
        {items.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--nw-green)] px-1 text-[9px] font-bold text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <h3 className="text-sm font-semibold">Notificações</h3>
            <span className="text-xs text-neutral-400">{items.length}</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-2 py-4 text-sm text-neutral-500">
                Nada pendente por aqui.
              </p>
            ) : (
              items.map((item, index) => (
                <Link
                  key={`${item.type}-${item.clienteId}-${index}`}
                  to={`/professional/patients/${item.clienteId}?section=workspace`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.severity === "warning"
                          ? "bg-amber-500"
                          : "bg-teal-500"
                      }`}
                    />
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {item.patient} · {item.message}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
