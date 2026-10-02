import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"
import { AppointmentPanel } from "./AppointmentPanel"
import { AssistedConsultation } from "./AssistedConsultation"
import { BehaviorInsights } from "./BehaviorInsights"
import { ClinicalReport } from "./ClinicalReport"
import { PatientTags } from "./PatientTags"
import { PeriodComparison } from "./PeriodComparison"
import { PrivateNotes } from "./PrivateNotes"

export function ClinicalWorkspaceHub({
  clienteId,
  patientName,
  initialTags,
  records,
  summaries,
  heightCm,
  currentWeight,
  age,
  targetWeight,
}: {
  clienteId: number
  patientName: string
  initialTags?: string[]
  records: DayRecord[]
  summaries: NutritionSummary[]
  heightCm?: number | null
  currentWeight: number | null
  age: number | null
  targetWeight?: number | null
}) {
  return (
    <div className="space-y-6">
      <AssistedConsultation
        clienteId={clienteId}
        records={records}
        summaries={summaries}
        heightCm={heightCm}
        currentWeight={currentWeight}
        age={age}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AppointmentPanel clienteId={clienteId} />
        <PatientTags clienteId={clienteId} initialTags={initialTags} />
        <PrivateNotes clienteId={clienteId} />
        <BehaviorInsights clienteId={clienteId} records={records} summaries={summaries} />
      </div>

      <PeriodComparison records={records} summaries={summaries} />

      <ClinicalReport
        clienteId={clienteId}
        patientName={patientName}
        records={records}
        summaries={summaries}
        targetWeight={targetWeight}
      />
    </div>
  )
}
