import { Link } from "react-router-dom"
import {
  CalendarPlus,
  ClipboardPlus,
  FileDown,
  NotebookPen,
  UtensilsCrossed,
} from "lucide-react"

const actions = [
  {
    label: "Nova consulta",
    detail: "Abrir atendimento assistido",
    to: "?section=workspace#consultation",
    icon: ClipboardPlus,
  },
  {
    label: "Agendar",
    detail: "Criar ou revisar consulta",
    to: "?section=workspace#agenda",
    icon: CalendarPlus,
  },
  {
    label: "Novo plano",
    detail: "Editar plano alimentar",
    to: "?section=plan",
    icon: UtensilsCrossed,
  },
  {
    label: "Nota interna",
    detail: "Registrar observação privada",
    to: "?section=workspace#notes",
    icon: NotebookPen,
  },
  {
    label: "Relatório",
    detail: "Imprimir ou salvar em PDF",
    to: "?section=workspace#report",
    icon: FileDown,
  },
] as const

export function PatientQuickActions() {
  return (
    <section
      aria-label="Ações rápidas do paciente"
      className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Ações rápidas
        </span>

        {actions.map(({ label, detail, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            title={detail}
            className="flex items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </section>
  )
}
