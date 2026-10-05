import {
  Bot,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { BrandLogo } from "./BrandLogo"
import { NotificationBell } from "./NotificationBell"

type ActiveSection = "overview" | "patients" | "reports" | "insights"

type BreadcrumbItem = {
  label: string
  href?: string
}

type ProfessionalLayoutProps = {
  active: ActiveSection
  title: string
  userName?: string
  breadcrumbs?: BreadcrumbItem[]
  children: ReactNode
  printFriendly?: boolean
}

const navItems = [
  {
    id: "overview" as const,
    label: "Visão geral",
    href: "/professional",
    icon: LayoutDashboard,
  },
  {
    id: "patients" as const,
    label: "Pacientes",
    href: "/professional/patients",
    icon: Users,
  },
  {
    id: "reports" as const,
    label: "Relatórios",
    href: "/professional/reports",
    icon: ClipboardList,
  },
  {
    id: "insights" as const,
    label: "Insights de IA",
    href: "/professional/insights",
    icon: Bot,
  },
]

function getInitials(name?: string) {
  if (!name) return "NW"

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase()
}

function SidebarContent({
  active,
  userName,
  onNavigate,
}: {
  active: ActiveSection
  userName?: string
  onNavigate: (href: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-5 pt-7">
        <BrandLogo />
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Professional
        </p>
      </div>

      <nav className="flex-1 px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Workspace
        </p>

        <div className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon
            const selected = item.id === active

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.href)}
                aria-current={selected ? "page" : undefined}
                className={[
                  "group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-medium transition-all duration-200",
                  selected
                    ? "bg-neutral-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                    : "text-neutral-500 hover:bg-emerald-50 hover:text-neutral-950",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition",
                    selected
                      ? "bg-white/10 text-emerald-300"
                      : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-emerald-700",
                  ].join(" ")}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="flex-1">{item.label}</span>

                {selected && (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-emerald-400"
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="my-5 border-t border-neutral-100" />

        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-100 text-neutral-500 transition group-hover:bg-white">
            <Settings size={18} aria-hidden="true" />
          </span>
          Configurações
        </button>
      </nav>

      <div className="m-3 rounded-[22px] border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-950 text-xs font-bold text-white">
            {getInitials(userName)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {userName ?? "Nutricionista"}
            </p>
            <p className="truncate text-[11px] text-neutral-400">
              Plano Professional
            </p>
          </div>

          <button
            type="button"
            aria-label="Sair"
            title="Sair"
            className="grid h-9 w-9 place-items-center rounded-xl text-neutral-400 transition hover:bg-white hover:text-neutral-700"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProfessionalLayout({
  active,
  title,
  userName,
  breadcrumbs = [],
  children,
  printFriendly = false,
}: ProfessionalLayoutProps) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function goTo(href: string) {
    setMobileOpen(false)
    navigate(href)
  }

  useEffect(() => {
    if (!mobileOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false)
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [mobileOpen])

  return (
    <div
      className={[
        "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,155,97,0.055),_transparent_28%),#f8faf9] text-neutral-950",
        printFriendly ? "print:bg-white" : "",
      ].join(" ")}
    >
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-neutral-200/80 bg-white/95 shadow-[8px_0_40px_rgba(15,23,42,0.025)] backdrop-blur lg:block",
          printFriendly ? "print:hidden" : "",
        ].join(" ")}
      >
        <SidebarContent active={active} userName={userName} onNavigate={goTo} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-neutral-950/35 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 w-[min(86vw,320px)] border-r border-neutral-200 bg-white shadow-2xl">
            <div className="absolute right-4 top-4 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:bg-neutral-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <SidebarContent active={active} userName={userName} onNavigate={goTo} />
          </aside>
        </div>
      )}

      <main
        className={[
          "min-w-0 lg:ml-[264px]",
          printFriendly ? "print:ml-0" : "",
        ].join(" ")}
      >
        <header
          className={[
            "sticky top-0 z-20 border-b border-neutral-200/80 bg-white/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8",
            printFriendly ? "print:hidden" : "",
          ].join(" ")}
        >
          <div className="mx-auto flex min-h-20 max-w-[1540px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 lg:hidden"
              >
                <Menu size={19} aria-hidden="true" />
              </button>

              <div className="min-w-0">
                {breadcrumbs.length > 0 ? (
                  <nav
                    aria-label="Breadcrumb"
                    className="mb-1 hidden items-center gap-1.5 text-xs text-neutral-400 sm:flex"
                  >
                    {breadcrumbs.map((item, index) => (
                      <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                        {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
                        {item.href ? (
                          <button
                            type="button"
                            onClick={() => goTo(item.href!)}
                            className="transition hover:text-emerald-700"
                          >
                            {item.label}
                          </button>
                        ) : (
                          <span className="text-neutral-500">{item.label}</span>
                        )}
                      </span>
                    ))}
                  </nav>
                ) : (
                  <p className="mb-1 hidden text-xs font-medium text-neutral-400 sm:block">
                    NutriWarrior Professional
                  </p>
                )}

                <h1 className="truncate text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <NotificationBell />

              <div className="hidden text-right md:block">
                <p className="max-w-44 truncate text-sm font-semibold text-neutral-900">
                  {userName ?? "Nutricionista"}
                </p>
                <p className="text-[11px] text-neutral-400">Plano Professional</p>
              </div>

              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-neutral-950 to-neutral-700 text-xs font-bold text-white shadow-sm">
                {getInitials(userName)}
              </div>
            </div>
          </div>
        </header>

        <div
          className={[
            "nw-page-enter mx-auto max-w-[1540px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9",
            printFriendly ? "print:max-w-none print:px-0 print:py-0" : "",
          ].join(" ")}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
