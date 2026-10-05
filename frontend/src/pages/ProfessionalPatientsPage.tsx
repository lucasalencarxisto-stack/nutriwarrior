import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bot,
  CalendarClock,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { DeletePatientModal } from "../components/DeletePatientModal"
import { NewPatientModal } from "../components/NewPatientModal"
import { ProfessionalLayout } from "../components/ProfessionalLayout"
import { PatientListSkeleton } from "../components/Skeleton"
import whatsappIcon from "../assets/whatsapp_icone.png"
import { getFollowUps, today, type FollowUp } from "../services/care"
import { getMe } from "../services/auth"
import { getMyPatients, type Patient } from "../services/patients"

type ProfessionalUser = {
  id: number
  nome: string
  email: string
  role: "NUTRICIONISTA"
  clienteId: null
}

type StatusFilter = "all" | "today" | "overdue" | "upcoming"

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

function formatPhone(phone: string) {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("55")) digits = digits.slice(2)

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return phone
}

function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "")
  if (!digits.startsWith("55")) digits = `55${digits}`
  return `https://wa.me/${digits}`
}

function dateLabel(value?: string | null) {
  return value ? value.split("-").reverse().join("/") : "—"
}

export function ProfessionalPatientsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<ProfessionalUser | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [sort, setSort] = useState<"name" | "return">("name")
  const [newPatientOpen, setNewPatientOpen] = useState(false)
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [openActionsId, setOpenActionsId] = useState<number | null>(null)

  async function loadData() {
    try {
      setLoading(true)

      const [me, patientRows, returnRows] = await Promise.all([
        getMe(),
        getMyPatients(),
        getFollowUps().catch(() => []),
      ])

      setUser(me)
      setPatients(patientRows)
      setFollowUps(returnRows)
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar os pacientes.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (openActionsId == null) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenActionsId(null)
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [openActionsId])

  const followUpByPatient = useMemo(() => {
    const map = new Map<number, FollowUp>()

    followUps
      .slice()
      .sort((a, b) => a.returnDate.localeCompare(b.returnDate))
      .forEach(item => {
        if (!map.has(item.clienteId)) map.set(item.clienteId, item)
      })

    return map
  }, [followUps])

  const currentDate = today()

  const counters = useMemo(() => {
    let dueToday = 0
    let overdue = 0
    let upcoming = 0

    followUps.forEach(item => {
      if (item.returnDate === currentDate) dueToday += 1
      else if (item.returnDate < currentDate) overdue += 1
      else upcoming += 1
    })

    return { dueToday, overdue, upcoming }
  }, [followUps, currentDate])

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase()

    return patients
      .filter(patient => {
        const followUp = patient.clienteId
          ? followUpByPatient.get(patient.clienteId)
          : undefined

        const matchesSearch =
          !term ||
          patient.nome.toLowerCase().includes(term) ||
          patient.email.toLowerCase().includes(term)

        if (!matchesSearch) return false
        if (status === "all") return true
        if (!followUp) return false
        if (status === "today") return followUp.returnDate === currentDate
        if (status === "overdue") return followUp.returnDate < currentDate
        return followUp.returnDate > currentDate
      })
      .sort((a, b) => {
        if (sort === "name") return a.nome.localeCompare(b.nome, "pt-BR")

        const aDate =
          (a.clienteId && followUpByPatient.get(a.clienteId)?.returnDate) ||
          "9999-12-31"
        const bDate =
          (b.clienteId && followUpByPatient.get(b.clienteId)?.returnDate) ||
          "9999-12-31"

        return aDate.localeCompare(bDate)
      })
  }, [patients, search, status, sort, followUpByPatient, currentDate])

  return (
    <ProfessionalLayout
      active="patients"
      title="Pacientes"
      userName={user?.nome}
      breadcrumbs={[
        { label: "Workspace", href: "/professional" },
        { label: "Pacientes" },
      ]}
    >
      <section className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-6 shadow-[0_18px_55px_rgba(15,118,110,0.07)] sm:p-7 lg:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-flex rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 shadow-sm">
              Carteira clínica
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Gestão de pacientes
            </h2>
            <p className="mt-2 max-w-2xl text-neutral-500">
              Encontre rapidamente quem precisa de retorno, abra a ficha completa
              ou converse com o Assistant no contexto certo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNewPatientOpen(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white shadow-lg shadow-neutral-950/10 transition hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            <UserPlus size={18} />
            Novo paciente
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Todos", value: patients.length, filter: "all" as const, detail: "carteira atual" },
          { label: "Retornos hoje", value: counters.dueToday, filter: "today" as const, detail: "agenda do dia" },
          { label: "Atrasados", value: counters.overdue, filter: "overdue" as const, detail: "pedem revisão" },
          { label: "Próximos", value: counters.upcoming, filter: "upcoming" as const, detail: "já programados" },
        ].map(card => (
          <button
            key={card.label}
            type="button"
            onClick={() => setStatus(card.filter)}
            className={[
              "group rounded-[24px] border p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-200",
              status === card.filter
                ? "border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-100"
                : "border-neutral-200/80 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_16px_34px_rgba(15,118,110,0.08)]",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-neutral-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-neutral-400">{card.detail}</p>
              </div>

              <span
                className={[
                  "h-2.5 w-2.5 rounded-full transition",
                  status === card.filter ? "bg-emerald-500" : "bg-neutral-200 group-hover:bg-emerald-300",
                ].join(" ")}
              />
            </div>
          </button>
        ))}
      </section>

      <section className="mt-6 rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.045)] sm:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 px-4 transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-50">
            <Search size={17} className="text-neutral-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>

          <select
            value={sort}
            onChange={event => setSort(event.target.value as "name" | "return")}
            className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 outline-none"
          >
            <option value="name">Ordenar: A–Z</option>
            <option value="return">Ordenar: próximo retorno</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <PatientListSkeleton />
        ) : filteredPatients.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50/60 text-center">
            <div className="px-6">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-neutral-400 shadow-sm">
                <Users size={24} />
              </div>
              <p className="mt-4 font-semibold">Nenhum paciente encontrado</p>
              <p className="mt-2 text-sm text-neutral-500">
                Ajuste a busca ou escolha outro filtro para ampliar os resultados.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {filteredPatients.map(patient => {
              const followUp =
                patient.clienteId ? followUpByPatient.get(patient.clienteId) : undefined

              const followUpStatus =
                !followUp
                  ? {
                      label: "Sem retorno agendado",
                      className: "bg-neutral-100 text-neutral-600 ring-neutral-200",
                      accent: "bg-neutral-300",
                    }
                  : followUp.returnDate < currentDate
                    ? {
                        label: "Retorno atrasado",
                        className: "bg-red-50 text-red-700 ring-red-100",
                        accent: "bg-red-400",
                      }
                    : followUp.returnDate === currentDate
                      ? {
                          label: "Retorno hoje",
                          className: "bg-amber-50 text-amber-700 ring-amber-100",
                          accent: "bg-amber-400",
                        }
                      : {
                          label: "Retorno agendado",
                          className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
                          accent: "bg-emerald-400",
                        }

              return (
                <article
                  key={patient.id}
                  className="group relative overflow-visible rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_16px_36px_rgba(15,118,110,0.075)]"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-5 left-0 w-1 rounded-r-full ${followUpStatus.accent}`}
                  />

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-start gap-4 pl-1">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neutral-950 to-neutral-700 text-sm font-bold text-white shadow-sm">
                        {getInitials(patient.nome)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-neutral-950">
                            {patient.nome}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${followUpStatus.className}`}
                          >
                            {followUpStatus.label}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-neutral-500">
                          {patient.email}
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-xl bg-neutral-50 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                              Cliente
                            </p>
                            <p className="mt-1 text-xs font-semibold text-neutral-700">
                              #{patient.clienteId ?? "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-neutral-50 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                              Última consulta
                            </p>
                            <p className="mt-1 text-xs font-semibold text-neutral-700">
                              {dateLabel(followUp?.consultationDate)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-neutral-50 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                              Próximo retorno
                            </p>
                            <p className="mt-1 text-xs font-semibold text-neutral-700">
                              {dateLabel(followUp?.returnDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      {patient.telefone && (
                        <a
                          href={whatsappLink(patient.telefone)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <img src={whatsappIcon} alt="" className="h-5 w-5 object-contain" />
                          <span className="hidden 2xl:inline">{formatPhone(patient.telefone)}</span>
                          <span className="2xl:hidden">WhatsApp</span>
                        </a>
                      )}

                      <button
                        type="button"
                        disabled={!patient.clienteId}
                        onClick={() =>
                          patient.clienteId &&
                          navigate(`/professional/patients/${patient.clienteId}?section=assistant`)
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-40"
                      >
                        <Bot size={16} />
                        Assistant
                      </button>

                      <button
                        type="button"
                        disabled={!patient.clienteId}
                        onClick={() =>
                          patient.clienteId &&
                          navigate(`/professional/patients/${patient.clienteId}`)
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-40"
                      >
                        Abrir ficha
                        <ChevronRight size={15} />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label={`Mais ações para ${patient.nome}`}
                          aria-haspopup="menu"
                          aria-expanded={openActionsId === patient.id}
                          onClick={() =>
                            setOpenActionsId(current =>
                              current === patient.id ? null : patient.id,
                            )
                          }
                          className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openActionsId === patient.id && (
                          <div
                            role="menu"
                            className="absolute right-0 top-12 z-20 w-44 rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenActionsId(null)
                                setPatientToEdit(patient)
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                            >
                              <Pencil size={15} />
                              Editar paciente
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenActionsId(null)
                                setPatientToDelete(patient)
                              }}
                              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                              Excluir paciente
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-400">
          <CalendarClock size={15} />
          Status calculado a partir das datas de retorno já registradas.
        </div>
      </section>

      {(newPatientOpen || patientToEdit !== null) && (
        <NewPatientModal
          key={patientToEdit?.clienteId ?? "new"}
          open
          patient={patientToEdit ?? undefined}
          onClose={() => {
            setNewPatientOpen(false)
            setPatientToEdit(null)
          }}
          onCreated={loadData}
        />
      )}

      <DeletePatientModal
        open={patientToDelete !== null}
        patientName={patientToDelete?.nome ?? ""}
        clienteId={patientToDelete?.clienteId ?? null}
        onClose={() => setPatientToDelete(null)}
        onDeleted={async () => {
          await loadData()
          setPatientToDelete(null)
        }}
      />
    </ProfessionalLayout>
  )
}
