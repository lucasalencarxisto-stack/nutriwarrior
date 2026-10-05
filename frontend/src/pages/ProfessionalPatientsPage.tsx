import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bot,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Pencil,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { BrandLogo } from "../components/BrandLogo"
import { DeletePatientModal } from "../components/DeletePatientModal"
import { NewPatientModal } from "../components/NewPatientModal"
import { NotificationBell } from "../components/NotificationBell"
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
    <div className="min-h-screen bg-[#f8faf9] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
        <div className="px-7 py-7">
          <BrandLogo />
        </div>

        <nav className="mt-4 flex-1 px-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/professional")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              <LayoutDashboard size={19} />
              Visão geral
            </button>

            <button className="flex w-full items-center gap-3 rounded-2xl bg-neutral-950 px-4 py-3 text-left text-sm font-medium text-white">
              <Users size={19} />
              Pacientes
            </button>

            <button
              type="button"
              onClick={() => navigate("/professional/reports")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              <ClipboardList size={19} />
              Relatórios
            </button>

            <button
              type="button"
              onClick={() => navigate("/professional/insights")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              <Bot size={19} />
              Insights de IA
            </button>
          </div>

          <div className="my-6 border-t border-neutral-200" />

          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
            <Settings size={19} />
            Configurações
          </button>
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
            <LogOut size={19} />
            Sair
          </button>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="flex h-20 items-center justify-between border-b border-neutral-200 bg-white px-6 lg:px-10">
          <div>
            <p className="text-sm text-neutral-500">NutriWarrior Professional</p>
            <h1 className="text-xl font-semibold tracking-tight">Pacientes</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.nome ?? "Nutricionista"}</p>
              <p className="text-xs text-neutral-500">Plano Professional</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
              {getInitials(user?.nome)}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
          <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-[var(--nw-green)]">Carteira clínica</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Gestão de pacientes
              </h2>
              <p className="mt-2 text-neutral-500">
                Busque, filtre e abra rapidamente a ficha, o Assistant ou o contato do paciente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewPatientOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <UserPlus size={18} />
              Novo paciente
            </button>
          </section>

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Todos", value: patients.length, filter: "all" as const },
              { label: "Retornos hoje", value: counters.dueToday, filter: "today" as const },
              { label: "Atrasados", value: counters.overdue, filter: "overdue" as const },
              { label: "Próximos", value: counters.upcoming, filter: "upcoming" as const },
            ].map(card => (
              <button
                key={card.label}
                type="button"
                onClick={() => setStatus(card.filter)}
                className={[
                  "rounded-[22px] border p-4 text-left shadow-sm transition",
                  status === card.filter
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-neutral-200 bg-white hover:border-emerald-200",
                ].join(" ")}
              >
                <p className="text-xs font-medium text-neutral-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              </button>
            ))}
          </section>

          <section className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl border border-neutral-200 px-4">
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
                className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none"
              >
                <option value="name">Ordenar: A–Z</option>
                <option value="return">Ordenar: próximo retorno</option>
              </select>
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            )}

            {loading ? (
              <PatientListSkeleton />
            ) : filteredPatients.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-center">
                <div>
                  <Users size={30} className="mx-auto text-neutral-300" />
                  <p className="mt-4 font-semibold">Nenhum paciente encontrado</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Ajuste a busca ou os filtros para ampliar os resultados.
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
                      ? { label: "Sem retorno agendado", className: "bg-neutral-100 text-neutral-600" }
                      : followUp.returnDate < currentDate
                        ? { label: "Retorno atrasado", className: "bg-red-50 text-red-700" }
                        : followUp.returnDate === currentDate
                          ? { label: "Retorno hoje", className: "bg-amber-50 text-amber-700" }
                          : { label: "Retorno agendado", className: "bg-emerald-50 text-emerald-700" }

                  return (
                    <article
                      key={patient.id}
                      className="rounded-[24px] border border-neutral-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-neutral-100 text-sm font-semibold">
                            {getInitials(patient.nome)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold">{patient.nome}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${followUpStatus.className}`}>
                                {followUpStatus.label}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm text-neutral-500">{patient.email}</p>
                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-400">
                              <span>Cliente #{patient.clienteId ?? "—"}</span>
                              <span>
                                Última consulta: {dateLabel(followUp?.consultationDate)}
                              </span>
                              <span>
                                Próximo retorno: {dateLabel(followUp?.returnDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {patient.telefone && (
                            <a
                              href={whatsappLink(patient.telefone)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-100 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <img src={whatsappIcon} alt="" className="h-5 w-5 object-contain" />
                              {formatPhone(patient.telefone)}
                            </a>
                          )}

                          <button
                            type="button"
                            disabled={!patient.clienteId}
                            onClick={() =>
                              patient.clienteId &&
                              navigate(`/professional/patients/${patient.clienteId}?section=assistant`)
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
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
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                          >
                            Abrir ficha
                            <ChevronRight size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPatientToEdit(patient)}
                            className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
                            aria-label={`Editar ${patient.nome}`}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPatientToDelete(patient)}
                            className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                            aria-label={`Excluir ${patient.nome}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="mt-5 flex items-center gap-2 text-xs text-neutral-400">
              <CalendarClock size={15} />
              Status calculado a partir das datas de retorno já registradas.
            </div>
          </section>
        </div>
      </main>

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
    </div>
  )
}
