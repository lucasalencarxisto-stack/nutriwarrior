import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from "lucide-react"

type ToastTone = "success" | "error" | "info"

type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-100 bg-white text-emerald-700",
  error: "border-red-100 bg-white text-red-700",
  info: "border-sky-100 bg-white text-sky-700",
}

const toneIcons = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)

    if (timer != null) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }

    setToasts(current => current.filter(item => item.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone) => {
      const id = crypto.randomUUID()

      setToasts(current => [...current, { id, message, tone }])

      const timer = window.setTimeout(() => {
        dismiss(id)
      }, 3600)

      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(
    () => () => {
      timers.current.forEach(timer => window.clearTimeout(timer))
      timers.current.clear()
    },
    [],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: message => push(message, "success"),
      error: message => push(message, "error"),
      info: message => push(message, "info"),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2 sm:right-6 sm:top-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(item => {
          const Icon = toneIcons[item.tone]

          return (
            <div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              className={[
                "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur",
                toneClasses[item.tone],
              ].join(" ")}
            >
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />

              <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-neutral-800">
                {item.message}
              </p>

              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Fechar notificação"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider")
  }

  return context
}
