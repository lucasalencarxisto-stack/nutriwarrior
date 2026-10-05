import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bot,
  ClipboardList,
  Droplets,
  FileText,
  LayoutDashboard,
  LogOut,
  Printer,
  Settings,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Users,
  Weight,
} from "lucide-react"
import { BrandLogo } from "../components/BrandLogo"
import { NotificationBell } from "../components/NotificationBell"
import { getCareHistory, type CareRecord } from "../services/care"
import { getPatientDays, type DayRecord } from "../services/days"
import {
  getNutritionSummaries,
  type NutritionSummary,
} from "../services/nutrition"
import { getMe } from "../services/auth"
import { getMyPatients, type Patient } from "../services/patients"

type ProfessionalUser = {
  id: number
  nome: string
  email: string
  role: "NUTRICIONISTA"
  clienteId: null
}

type ReportType = "general" | "weight" | "hydration" | "meals" | "consultations"

type ReportData = {
  patient: Patient
  days: DayRecord[]
  summaries: NutritionSummary[]
  care: CareRecord[]
}

function isoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function daysAgo(amount: number) {
  const date = new Date()
  date.setDate(date.getDate() - amount)
  return isoDate(date)
}

function dateLabel(value?: string | null) {
  return value ? value.split("-").reverse().join("/") : "—"
}

function number(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
  }).format(value)
}

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

export function ProfessionalReportsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<ProfessionalUser | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [fromDate, setFromDate] = useState(daysAgo(30))
  const [toDate, setToDate] = useState(isoDate(new Date()))
  const [reportType, setReportType] = useState<ReportType>("general")
  const [report, setReport] = useState<ReportData | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    Promise.all([getMe(), getMyPatients()])
      .then(([me, rows]) => {
        if (!alive) return
        setUser(me)
        setPatients(rows)
        setSelectedPatientId(rows.find(row => row.clienteId)?.clienteId ?? null)
        setError("")
      })
      .catch(cause => {
        if (!alive) return
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar os pacientes.",
        )
      })
      .finally(() => {
        if (alive) setLoadingPatients(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const selectedPatient =
    patients.find(patient => patient.clienteId === selectedPatientId) ?? null

  async function generateReport() {
    if (!selectedPatient?.clienteId) {
      setError("Selecione um paciente com ficha ativa.")
      return
    }

    if (!fromDate || !toDate || fromDate > toDate) {
      setError("Informe um período válido para gerar o relatório.")
      return
    }

    try {
      setLoadingReport(true)
      setError("")

      const [days, care] = await Promise.all([
        getPatientDays(selectedPatient.clienteId),
        getCareHistory(selectedPatient.clienteId),
      ])

      const filteredDays = days
        .filter(day => day.data >= fromDate && day.data <= toDate)
        .sort((a, b) => a.data.localeCompare(b.data))

      const summaries = await getNutritionSummaries(
        selectedPatient.clienteId,
        filteredDays.map(day => day.data),
      )

      setReport({
        patient: selectedPatient,
        days: filteredDays,
        summaries: summaries.filter(
          item => item.data >= fromDate && item.data <= toDate,
        ),
        care: care
          .filter(item => item.date >= fromDate && item.date <= toDate)
          .sort((a, b) => a.date.localeCompare(b.date)),
      })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível gerar o relatório.",
      )
      setReport(null)
    } finally {
      setLoadingReport(false)
    }
  }

  const metrics = useMemo(() => {
    if (!report) return null

    const weights = report.days
      .filter(row => row.pesoKg != null && Number(row.pesoKg) > 0)
      .map(row => ({ date: row.data, value: Number(row.pesoKg) }))

    const waterValues = report.days
      .filter(row => row.aguaMl != null && Number(row.aguaMl) >= 0)
      .map(row => Number(row.aguaMl))

    const firstWeight = weights[0] ?? null
    const lastWeight = weights.at(-1) ?? null
    const weightDelta =
      firstWeight && lastWeight ? lastWeight.value - firstWeight.value : null

    const avgWater =
      waterValues.length > 0
        ? waterValues.reduce((sum, value) => sum + value, 0) / waterValues.length
        : null

    const totalMeals = report.summaries.reduce(
      (sum, row) => sum + row.quantidadeRefeicoes,
      0,
    )

    const avgCalories =
      report.summaries.length > 0
        ? report.summaries.reduce((sum, row) => sum + row.calorias, 0) /
          report.summaries.length
        : null

    const consultations = report.care.filter(
      item => item.kind === "CONSULTATION",
    )

    return {
      weights,
      firstWeight,
      lastWeight,
      weightDelta,
      avgWater,
      totalMeals,
      avgCalories,
      consultations,
    }
  }, [report])

  const reportTypes: Array<{
    id: ReportType
    label: string
    description: string
    icon: typeof FileText
  }> = [
    {
      id: "general",
      label: "Evolução geral",
      description: "Peso, hidratação, alimentação e consultas.",
      icon: FileText,
    },
    {
      id: "weight",
      label: "Evolução de peso",
      description: "Histórico e variação no período.",
      icon: Weight,
    },
    {
      id: "hydration",
      label: "Hidratação",
      description: "Média e registros de água.",
      icon: Droplets,
    },
    {
      id: "meals",
      label: "Alimentação",
      description: "Refeições e média calórica registrada.",
      icon: UtensilsCrossed,
    },
    {
      id: "consultations",
      label: "Consultas",
      description: "Histórico clínico registrado no período.",
      icon: ClipboardList,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8faf9] text-neutral-950 print:bg-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white lg:flex lg:flex-col print:hidden">
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

            <button
              type="button"
              onClick={() => navigate("/professional/patients")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              <Users size={19} />
              Pacientes
            </button>

            <button className="flex w-full items-center gap-3 rounded-2xl bg-neutral-950 px-4 py-3 text-left text-sm font-medium text-white">
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

      <main className="lg:ml-64 print:ml-0">
        <header className="flex h-20 items-center justify-between border-b border-neutral-200 bg-white px-6 lg:px-10 print:hidden">
          <div>
            <p className="text-sm text-neutral-500">NutriWarrior Professional</p>
            <h1 className="text-xl font-semibold tracking-tight">Relatórios</h1>
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

        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10 print:max-w-none print:px-0 print:py-0">
          <section className="print:hidden">
            <p className="text-sm font-medium text-[var(--nw-green)]">Documentação clínica</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Relatórios do paciente
            </h2>
            <p className="mt-2 max-w-3xl text-neutral-500">
              Gere uma visão consolidada usando somente registros existentes no NutriWarrior.
            </p>
          </section>

          <section className="mt-7 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 print:hidden">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="text-sm font-medium text-neutral-700">
                Paciente
                <select
                  value={selectedPatientId ?? ""}
                  onChange={event => {
                    setSelectedPatientId(Number(event.target.value) || null)
                    setReport(null)
                  }}
                  disabled={loadingPatients}
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-emerald-300"
                >
                  <option value="">Selecione um paciente</option>
                  {patients
                    .filter(patient => patient.clienteId)
                    .map(patient => (
                      <option key={patient.id} value={patient.clienteId ?? ""}>
                        {patient.nome}
                      </option>
                    ))}
                </select>
              </label>

              <label className="text-sm font-medium text-neutral-700">
                De
                <input
                  type="date"
                  value={fromDate}
                  onChange={event => {
                    setFromDate(event.target.value)
                    setReport(null)
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-emerald-300"
                />
              </label>

              <label className="text-sm font-medium text-neutral-700">
                Até
                <input
                  type="date"
                  value={toDate}
                  onChange={event => {
                    setToDate(event.target.value)
                    setReport(null)
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-emerald-300"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {reportTypes.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setReportType(item.id)
                      setReport(null)
                    }}
                    className={[
                      "rounded-[20px] border p-4 text-left transition",
                      reportType === item.id
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-neutral-200 hover:border-emerald-200",
                    ].join(" ")}
                  >
                    <Icon size={18} className="text-emerald-700" />
                    <p className="mt-3 text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {item.description}
                    </p>
                  </button>
                )
              })}
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void generateReport()}
                disabled={loadingReport || !selectedPatientId}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileText size={17} />
                {loadingReport ? "Gerando..." : "Gerar relatório"}
              </button>
            </div>
          </section>

          {report && metrics && (
            <section className="mt-7 rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 print:mt-0 print:border-0 print:p-8 print:shadow-none">
              <div className="flex flex-col justify-between gap-5 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    NutriWarrior Professional
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {reportTypes.find(item => item.id === reportType)?.label}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    {report.patient.nome} · {dateLabel(fromDate)} a {dateLabel(toDate)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-11 items-center gap-2 self-start rounded-2xl border border-neutral-200 px-4 text-sm font-semibold transition hover:bg-neutral-50 print:hidden"
                >
                  <Printer size={17} />
                  Imprimir / Salvar PDF
                </button>
              </div>

              {(reportType === "general" || reportType === "weight") && (
                <div className="mt-6">
                  <h3 className="font-semibold">Peso</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Metric
                      label="Peso inicial"
                      value={
                        metrics.firstWeight
                          ? `${number(metrics.firstWeight.value)} kg`
                          : "—"
                      }
                      detail={dateLabel(metrics.firstWeight?.date)}
                    />
                    <Metric
                      label="Peso atual"
                      value={
                        metrics.lastWeight
                          ? `${number(metrics.lastWeight.value)} kg`
                          : "—"
                      }
                      detail={dateLabel(metrics.lastWeight?.date)}
                    />
                    <Metric
                      label="Variação"
                      value={
                        metrics.weightDelta == null
                          ? "—"
                          : `${metrics.weightDelta > 0 ? "+" : ""}${number(metrics.weightDelta)} kg`
                      }
                      detail={
                        metrics.weightDelta == null
                          ? "Sem dados suficientes"
                          : metrics.weightDelta > 0
                            ? "aumento no período"
                            : metrics.weightDelta < 0
                              ? "redução no período"
                              : "sem variação"
                      }
                      trend={metrics.weightDelta}
                    />
                  </div>
                </div>
              )}

              {(reportType === "general" || reportType === "hydration") && (
                <div className="mt-7">
                  <h3 className="font-semibold">Hidratação</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Metric
                      label="Média diária registrada"
                      value={
                        metrics.avgWater == null
                          ? "—"
                          : `${number(metrics.avgWater, 0)} ml`
                      }
                      detail={`${report.days.filter(day => day.aguaMl != null).length} dias com registro`}
                    />
                    <Metric
                      label="Dias no período"
                      value={String(report.days.length)}
                      detail="dias com algum registro diário"
                    />
                  </div>
                </div>
              )}

              {(reportType === "general" || reportType === "meals") && (
                <div className="mt-7">
                  <h3 className="font-semibold">Alimentação</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Metric
                      label="Refeições registradas"
                      value={String(metrics.totalMeals)}
                      detail={`${report.summaries.length} dias consolidados`}
                    />
                    <Metric
                      label="Média calórica"
                      value={
                        metrics.avgCalories == null
                          ? "—"
                          : `${number(metrics.avgCalories, 0)} kcal`
                      }
                      detail="média dos dias disponíveis"
                    />
                    <Metric
                      label="Dias com resumo"
                      value={String(report.summaries.length)}
                      detail="dados nutricionais encontrados"
                    />
                  </div>
                </div>
              )}

              {(reportType === "general" || reportType === "consultations") && (
                <div className="mt-7">
                  <h3 className="font-semibold">Consultas</h3>
                  <div className="mt-3 rounded-2xl border border-neutral-200">
                    {metrics.consultations.length === 0 ? (
                      <p className="p-5 text-sm text-neutral-500">
                        Nenhuma consulta registrada neste período.
                      </p>
                    ) : (
                      metrics.consultations.map(item => (
                        <article
                          key={item.id}
                          className="border-b border-neutral-100 p-5 last:border-b-0"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold">{item.title || "Consulta"}</p>
                            <span className="text-xs text-neutral-400">
                              {dateLabel(item.date)}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                              {item.notes}
                            </p>
                          )}
                          {item.returnDate && (
                            <p className="mt-2 text-xs font-medium text-emerald-700">
                              Retorno: {dateLabel(item.returnDate)}
                            </p>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}

              <p className="mt-8 border-t border-neutral-200 pt-5 text-xs leading-5 text-neutral-400">
                Relatório gerado a partir dos registros existentes no NutriWarrior.
                Informações ausentes são exibidas como “—” e não são estimadas.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  trend,
}: {
  label: string
  value: string
  detail: string
  trend?: number | null
}) {
  return (
    <article className="rounded-2xl bg-neutral-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">{label}</p>
        {trend != null && trend !== 0 && (
          trend > 0 ? (
            <TrendingUp size={15} className="text-amber-600" />
          ) : (
            <TrendingDown size={15} className="text-emerald-600" />
          )
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-neutral-400">{detail}</p>
    </article>
  )
}
