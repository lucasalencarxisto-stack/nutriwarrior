import { AssistantPanel } from "./AssistantPanel"
import { CareWorkspace } from "./CareWorkspace"
import { ClinicalTimeline } from "./ClinicalTimeline"
import { EnergyAssessment } from "./EnergyAssessment"
import { ClinicalWorkspaceHub } from "./ClinicalWorkspaceHub"
import type { NutritionSummary } from "../services/nutrition"
import type { DayRecord } from "../services/days"
import type { ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  Bot,
  ClipboardList,
  Clock3,
  Gauge,
  LayoutDashboard,
  UtensilsCrossed,
  Stethoscope,
} from "lucide-react"

type Props = {
  clienteId: number
  summaries: NutritionSummary[]
  children: ReactNode
  records: DayRecord[]
  heightCm?: number | null
  currentWeight: number | null
  bmi: number | null
  age: number | null
  targetWeight?: number | null
  patientName: string
  initialTags?: string[]
}

const sections = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "workspace", label: "Atendimento", icon: Stethoscope },
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "assessments", label: "Avaliações", icon: Gauge },
  { id: "consultations", label: "Consultas", icon: ClipboardList },
  { id: "plan", label: "Plano alimentar", icon: UtensilsCrossed },
  { id: "assistant", label: "Assistente", icon: Bot },
] as const

const number = (value: number | null | undefined, suffix = "") =>
  value != null && Number.isFinite(value)
    ? `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}${suffix}`
    : "Não informado"

function dateLabel(date: string) {
  return date.split("-").reverse().join("/")
}

export function PatientSections({
  clienteId,
  summaries,
  children,
  records,
  heightCm,
  currentWeight,
  bmi,
  age,
  targetWeight,
  patientName,
  initialTags,
}: Props) {
  const [params, setParams] = useSearchParams()
  const active =
    sections.find(section => section.id === params.get("section"))?.id ??
    "overview"

  const sectionQuery = (section: string) => {
    const next = new URLSearchParams(params)
    if (section === "overview") next.delete("section")
    else next.set("section", section)
    return next
  }

  const weights = records
    .filter(
      record =>
        record.pesoKg != null &&
        Number.isFinite(Number(record.pesoKg)) &&
        Number(record.pesoKg) > 0,
    )
    .sort((a, b) => b.data.localeCompare(a.data))

  return (
    <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <aside className="self-start lg:sticky lg:top-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm">
          <label
            htmlFor="patient-section"
            className="mb-2 block px-2 text-xs font-semibold text-neutral-500 lg:hidden"
          >
            Seções do paciente
          </label>

          <select
            id="patient-section"
            value={active}
            onChange={event => setParams(sectionQuery(event.target.value))}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-emerald-600 lg:hidden"
          >
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>

          <nav aria-label="Seções do paciente" className="hidden lg:block">
            <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Neste paciente
            </p>
            {sections.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                to={{ search: sectionQuery(id).toString() }}
                aria-current={active === id ? "page" : undefined}
                className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  active === id
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        {active === "assistant" && (
          <AssistantPanel
            key={clienteId}
            clienteId={clienteId}
            patientName={patientName}
          />
        )}

        {active === "consultations" && (
          <CareWorkspace
            key={`${clienteId}-consultations`}
            clienteId={clienteId}
            mode="CONSULTATION"
            records={records}
            summaries={summaries}
          />
        )}

        {active === "plan" && (
          <CareWorkspace
            key={`${clienteId}-plan`}
            clienteId={clienteId}
            mode="PLAN"
            records={records}
            summaries={summaries}
          />
        )}

        {active === "timeline" && (
          <ClinicalTimeline
            clienteId={clienteId}
            records={records}
            summaries={summaries}
          />
        )}

        {active === "overview" && children}

        {active === "workspace" && (
          <ClinicalWorkspaceHub
            clienteId={clienteId}
            patientName={patientName}
            initialTags={initialTags}
            records={records}
            summaries={summaries}
            currentWeight={currentWeight}
            targetWeight={targetWeight}
          />
        )}

        {active === "assessments" && (
          <section
            aria-labelledby="patient-assessments-title"
            className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Antropometria
            </p>
            <h2
              id="patient-assessments-title"
              className="mt-2 text-xl font-semibold tracking-tight"
            >
              Avaliações
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Medidas disponíveis, meta definida pelo profissional e histórico
              de peso deste paciente.
            </p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Último peso registrado",
                  value: number(currentWeight, " kg"),
                  detail: weights[0]
                    ? dateLabel(weights[0].data)
                    : "Sem pesagens registradas",
                },
                {
                  label: "Peso-alvo",
                  value: number(targetWeight, " kg"),
                  detail: "Meta definida pelo profissional",
                },
                {
                  label: "Altura cadastrada",
                  value: number(heightCm, " cm"),
                  detail: "Informada na ficha",
                },
                {
                  label: "IMC atual",
                  value: number(bmi),
                  detail: "Último peso e altura cadastrada",
                },
              ].map(item => (
                <div key={item.label} className="rounded-2xl bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">{item.label}</dt>
                  <dd className="mt-2 text-lg font-semibold">{item.value}</dd>
                  <dd className="mt-1 text-xs leading-5 text-neutral-500">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>

            {currentWeight != null && targetWeight != null && (
              <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                  Distância até a meta registrada
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {number(Math.abs(currentWeight - targetWeight), " kg")}
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-600">
                  Valor descritivo. A interpretação clínica da meta permanece
                  com o nutricionista.
                </p>
              </div>
            )}

            <h3 className="mt-8 text-sm font-semibold">Histórico de pesagens</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Do registro mais recente ao mais antigo. Variação em relação à
              pesagem anterior disponível.
            </p>

            {weights.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-neutral-50 p-6 text-sm text-neutral-500">
                Ainda não há pesagens registradas para este paciente.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-100">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Histórico de peso do paciente
                  </caption>
                  <thead className="bg-neutral-50 text-xs text-neutral-500">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Data
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Peso
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Variação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {weights.map((record, index) => {
                      const previous = weights[index + 1]
                      const delta = previous
                        ? Number(record.pesoKg) - Number(previous.pesoKg)
                        : null

                      return (
                        <tr key={record.id}>
                          <th
                            scope="row"
                            className="whitespace-nowrap px-4 py-4 font-normal text-neutral-600"
                          >
                            {dateLabel(record.data)}
                          </th>
                          <td className="whitespace-nowrap px-4 py-4 font-medium">
                            {number(Number(record.pesoKg), " kg")}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-neutral-500">
                            {delta === null
                              ? "—"
                              : `${delta > 0 ? "+" : ""}${number(delta, " kg")}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <EnergyAssessment
              clienteId={clienteId}
              key={`${currentWeight}-${heightCm}-${age}-${weights[0]?.data}`}
              weightKg={currentWeight}
              heightCm={heightCm}
              age={age}
              weightDate={weights[0]?.data}
            />
          </section>
        )}
      </div>
    </div>
  )
}
