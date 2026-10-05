import { useEffect, useMemo, useState } from "react"
import {
  ClipboardList,
  Droplets,
  FileText,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Weight,
} from "lucide-react"
import { BrandLogo } from "../components/BrandLogo"
import { ProfessionalLayout } from "../components/ProfessionalLayout"
import { ReportPreviewSkeleton } from "../components/Skeleton"
import { useToast } from "../components/ToastProvider"
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

function WeightTrend({
  points,
}: {
  points: Array<{ date: string; value: number }>
}) {
  if (points.length < 2) return null

  const values = points.map(point => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const polyline = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100
      const y = 88 - ((point.value - min) / range) * 70
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4 print:border-neutral-200">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Tendência no período
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-700">
            {dateLabel(points[0].date)} → {dateLabel(points.at(-1)?.date)}
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-500 shadow-sm">
          {points.length} registros
        </span>
      </div>

      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Linha de evolução de peso"
        className="h-36 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="88" x2="100" y2="88" stroke="currentColor" className="text-neutral-200" strokeWidth="0.7" />
        <line x1="0" y1="53" x2="100" y2="53" stroke="currentColor" className="text-neutral-100" strokeWidth="0.7" />
        <line x1="0" y1="18" x2="100" y2="18" stroke="currentColor" className="text-neutral-100" strokeWidth="0.7" />
        <polyline
          fill="none"
          points={polyline}
          stroke="currentColor"
          className="text-emerald-600"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
        <span>{number(min)} kg</span>
        <span>{number(max)} kg</span>
      </div>
    </div>
  )
}

export function ProfessionalReportsPage() {
  const toast = useToast()
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
      const message = "Selecione um paciente com ficha ativa."
      setError(message)
      toast.error(message)
      return
    }

    if (!fromDate || !toDate || fromDate > toDate) {
      const message = "Informe um período válido para gerar o relatório."
      setError(message)
      toast.error(message)
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

      toast.success("Relatório gerado com os dados disponíveis.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Não foi possível gerar o relatório."

      setError(message)
      toast.error(message)
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
      icon: Sparkles,
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
    <ProfessionalLayout
      active="reports"
      title="Relatórios"
      userName={user?.nome}
      breadcrumbs={[
        { label: "Workspace", href: "/professional" },
        { label: "Relatórios" },
      ]}
      printFriendly
    >
      <section className="relative overflow-hidden rounded-[32px] border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/70 p-6 shadow-[0_18px_55px_rgba(14,116,144,0.06)] sm:p-7 lg:p-8 print:hidden">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 shadow-sm">
            Documentação clínica
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Relatórios do paciente
          </h2>
          <p className="mt-2 max-w-3xl text-neutral-500">
            Escolha o paciente, o período e o foco. O preview usa somente dados
            já registrados no NutriWarrior.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.045)] sm:p-6 print:hidden">
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
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50/70 px-4 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
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
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50/70 px-4 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
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
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50/70 px-4 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
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
                  "group rounded-[22px] border p-4 text-left transition duration-200",
                  reportType === item.id
                    ? "border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-100"
                    : "border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-10 w-10 place-items-center rounded-xl transition",
                    reportType === item.id
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-100 text-neutral-500 group-hover:bg-emerald-50 group-hover:text-emerald-700",
                  ].join(" ")}
                >
                  <Icon size={18} />
                </span>
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  {item.description}
                </p>
              </button>
            )
          })}
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void generateReport()}
            disabled={loadingReport || !selectedPatientId}
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white shadow-lg shadow-neutral-950/10 transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText size={17} />
            {loadingReport ? "Gerando..." : "Gerar relatório"}
          </button>
        </div>
      </section>

      {loadingReport && <ReportPreviewSkeleton />}

      {!loadingReport && !report && (
        <section className="mt-6 flex min-h-[300px] items-center justify-center rounded-[30px] border border-dashed border-neutral-200 bg-white/80 px-6 text-center shadow-sm print:hidden">
          <div>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
              <FileText size={28} />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              Seu relatório aparecerá aqui
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Selecione um paciente e gere um relatório para visualizar o documento
              antes de imprimir ou salvar como PDF.
            </p>
          </div>
        </section>
      )}

      {report && metrics && (
        <section className="mt-6 overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.075)] print:mt-0 print:border-0 print:shadow-none">
          <div className="border-b border-neutral-100 bg-gradient-to-r from-emerald-50/70 via-white to-white px-6 py-6 sm:px-8 print:bg-white">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="w-40">
                  <BrandLogo />
                </div>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Relatório profissional
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {reportTypes.find(item => item.id === reportType)?.label}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  {report.patient.nome} · {dateLabel(fromDate)} a {dateLabel(toDate)}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Profissional responsável: {user?.nome ?? "Nutricionista"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-11 items-center gap-2 self-start rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 print:hidden"
              >
                <Printer size={17} />
                Imprimir / Salvar PDF
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {(reportType === "general" || reportType === "weight") && (
              <section>
                <SectionTitle
                  eyebrow="Evolução corporal"
                  title="Peso"
                  description="Comparação entre os registros disponíveis dentro do período selecionado."
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
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

                <WeightTrend points={metrics.weights} />
              </section>
            )}

            {(reportType === "general" || reportType === "hydration") && (
              <section className="mt-8 border-t border-neutral-100 pt-8">
                <SectionTitle
                  eyebrow="Hábitos"
                  title="Hidratação"
                  description="Média calculada apenas sobre dias que possuem registro de água."
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              </section>
            )}

            {(reportType === "general" || reportType === "meals") && (
              <section className="mt-8 border-t border-neutral-100 pt-8">
                <SectionTitle
                  eyebrow="Nutrição"
                  title="Alimentação"
                  description="Resumo calculado somente a partir dos dias que retornaram consolidação nutricional."
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
              </section>
            )}

            {(reportType === "general" || reportType === "consultations") && (
              <section className="mt-8 border-t border-neutral-100 pt-8">
                <SectionTitle
                  eyebrow="Acompanhamento"
                  title="Consultas"
                  description="Registros clínicos encontrados no intervalo selecionado."
                />

                <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
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
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500">
                            {dateLabel(item.date)}
                          </span>
                        </div>

                        {item.notes && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                            {item.notes}
                          </p>
                        )}

                        {item.returnDate && (
                          <p className="mt-3 text-xs font-medium text-emerald-700">
                            Retorno programado: {dateLabel(item.returnDate)}
                          </p>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}

            <div className="mt-8 flex flex-col gap-2 border-t border-neutral-200 pt-5 text-xs leading-5 text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Gerado a partir dos registros existentes no NutriWarrior.
                Informações ausentes são exibidas como “—” e não são estimadas.
              </p>
              <span className="shrink-0 font-medium text-neutral-500">
                {dateLabel(isoDate(new Date()))}
              </span>
            </div>
          </div>
        </section>
      )}
    </ProfessionalLayout>
  )
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
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
    <article className="rounded-[20px] border border-neutral-100 bg-neutral-50/80 p-4">
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
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-neutral-400">{detail}</p>
    </article>
  )
}
