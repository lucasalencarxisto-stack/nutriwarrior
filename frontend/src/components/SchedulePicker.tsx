import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react"

type DatePickerProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  required?: boolean
  disabled?: boolean
  hint?: string
}

type TimePickerProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  hint?: string
}

const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"]

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day, 12, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function monthStartFor(value?: string) {
  const selected = value ? fromIsoDate(value) : null
  const base = selected ?? new Date()
  return new Date(base.getFullYear(), base.getMonth(), 1, 12, 0, 0, 0)
}

function isDateDisabled(value: string, min?: string, max?: string) {
  return (min != null && value < min) || (max != null && value > max)
}

export function formatScheduleDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  const day = date.toLocaleDateString("pt-BR")
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${day} · ${time}`
}

export function ScheduleDatePicker({
  id,
  label,
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  hint,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => monthStartFor(value))
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setVisibleMonth(monthStartFor(value))
  }, [value])

  useEffect(() => {
    if (!open) return

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  const days = useMemo(() => {
    const first = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
      12,
      0,
      0,
      0,
    )

    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - first.getDay())

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + index)
      return date
    })
  }, [visibleMonth])

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth)

  const selectedDate = value ? fromIsoDate(value) : null
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("pt-BR")
    : "Selecionar data"
  const today = toIsoDate(new Date())

  function changeMonth(offset: number) {
    setVisibleMonth(
      current =>
        new Date(
          current.getFullYear(),
          current.getMonth() + offset,
          1,
          12,
          0,
          0,
          0,
        ),
    )
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <label
        id={`${id}-label`}
        className="mb-1.5 block text-xs font-medium text-neutral-500"
      >
        {label}
      </label>

      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        onClick={() => setOpen(current => !current)}
        className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left text-sm transition hover:border-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarDays size={17} className="shrink-0 text-teal-700" aria-hidden="true" />
        <span className={value ? "truncate text-neutral-950" : "truncate text-neutral-400"}>
          {displayValue}
        </span>
      </button>

      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}

      {open && !disabled && (
        <div
          role="dialog"
          aria-label={`Selecionar ${label.toLowerCase()}`}
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-80 max-w-[90vw] rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Mês anterior"
              className="grid h-9 w-9 place-items-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>

            <p className="text-sm font-semibold capitalize text-neutral-900">
              {monthLabel}
            </p>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Próximo mês"
              className="grid h-9 w-9 place-items-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {weekdayLabels.map((weekday, index) => (
              <span
                key={`${weekday}-${index}`}
                className="py-1 text-[11px] font-semibold text-neutral-400"
              >
                {weekday}
              </span>
            ))}

            {days.map(day => {
              const iso = toIsoDate(day)
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth()
              const selected = iso === value
              const isToday = iso === today
              const unavailable = isDateDisabled(iso, min, max)

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    onChange(iso)
                    setOpen(false)
                  }}
                  className={[
                    "grid h-9 w-9 place-items-center justify-self-center rounded-xl text-xs transition",
                    selected
                      ? "bg-neutral-950 font-semibold text-white"
                      : isToday
                        ? "bg-teal-50 font-semibold text-teal-800"
                        : isCurrentMonth
                          ? "text-neutral-800 hover:bg-neutral-100"
                          : "text-neutral-300 hover:bg-neutral-50",
                    unavailable ? "cursor-not-allowed opacity-25" : "",
                  ].join(" ")}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={selected}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
            {!required ? (
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-950"
              >
                Limpar
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => {
                if (!isDateDisabled(today, min, max)) {
                  onChange(today)
                  setOpen(false)
                }
              }}
              disabled={isDateDisabled(today, min, max)}
              className="text-xs font-semibold text-teal-700 disabled:opacity-30"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ScheduleTimePicker({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  hint,
}: TimePickerProps) {
  const [hour, setHour] = useState(value.split(":")[0] ?? "")
  const [minute, setMinute] = useState(value.split(":")[1] ?? "")

  useEffect(() => {
    const [nextHour = "", nextMinute = ""] = value.split(":")
    setHour(nextHour)
    setMinute(nextMinute)
  }, [value])

  function update(nextHour: string, nextMinute: string) {
    setHour(nextHour)
    setMinute(nextMinute)

    if (nextHour && nextMinute) {
      onChange(`${nextHour}:${nextMinute}`)
    } else {
      onChange("")
    }
  }

  return (
    <div className="min-w-0">
      <label
        htmlFor={`${id}-hour`}
        className="mb-1.5 block text-xs font-medium text-neutral-500"
      >
        {label}
      </label>

      <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600">
        <Clock3 size={17} className="shrink-0 text-teal-700" aria-hidden="true" />

        <select
          id={`${id}-hour`}
          value={hour}
          required={required}
          disabled={disabled}
          aria-label="Hora"
          onChange={event => update(event.target.value, minute)}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
        >
          <option value="">HH</option>
          {Array.from({ length: 24 }, (_, index) => pad(index)).map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="text-sm font-semibold text-neutral-300">:</span>

        <select
          value={minute}
          required={required}
          disabled={disabled}
          aria-label="Minuto"
          onChange={event => update(hour, event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
        >
          <option value="">MM</option>
          {Array.from({ length: 60 }, (_, index) => pad(index)).map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
