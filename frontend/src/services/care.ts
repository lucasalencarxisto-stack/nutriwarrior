import { apiFetch } from "./api"
import type { EnergyInput } from "../utils/energy"

export type Meal = { name: string; portions: string; substitutions: string }

export type CareRecord = {
  id: number
  clienteId: number
  kind: "CONSULTATION" | "PLAN" | "ENERGY"
  date: string
  returnDate: string | null
  title: string
  notes: string
  anamnesis: string
  version: number
  author: string
  createdAt: string
  payload: {
    meals?: Meal[]
    input?: EnergyInput
    restingKcal?: number
    totalKcal?: number | null
    consultationId?: number
  }
}

export type CareDraft = {
  requestId: string
  kind: CareRecord["kind"]
  date: string
  title: string
  notes: string
  anamnesis: string
  returnDate?: string | null
  meals?: Meal[]
  energy?: EnergyInput
  consultationId?: number
}

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const dateLabel = (value: string) => value.split("-").reverse().join("/")

export const getCareHistory = (id: number): Promise<CareRecord[]> =>
  apiFetch(`/clientes/${id}/care`)

export const saveCare = (id: number, draft: CareDraft): Promise<CareRecord> =>
  apiFetch(`/clientes/${id}/care`, {
    method: "POST",
    body: JSON.stringify(draft),
  })

export const getCurrentPlan = (id: number): Promise<CareRecord | null> =>
  apiFetch(`/clientes/${id}/plano-vigente`)

export type FollowUp = {
  clienteId: number
  patient: string
  consultationDate: string
  returnDate: string
}

export const getFollowUps = (): Promise<FollowUp[]> =>
  apiFetch("/nutricionistas/me/retornos")

export type MealPlanDraftRequest = {
  title: string
  planDate: string | null
  notes: string
  meals: Meal[]
  version: number | null
}

export type MealPlanDraft = {
  id: number
  clienteId: number
  title: string
  planDate: string | null
  notes: string
  meals: Meal[]
  version: number
  updatedAt: string
}

export function getMealPlanDraft(clienteId: number): Promise<MealPlanDraft | null> {
  return apiFetch(`/clientes/${clienteId}/plano-rascunho`)
}

export function saveMealPlanDraft(
  clienteId: number,
  draft: MealPlanDraftRequest,
): Promise<MealPlanDraft> {
  return apiFetch(`/clientes/${clienteId}/plano-rascunho`, {
    method: "PUT",
    body: JSON.stringify(draft),
  })
}

export async function deleteMealPlanDraft(clienteId: number): Promise<void> {
  await apiFetch(`/clientes/${clienteId}/plano-rascunho`, {
    method: "DELETE",
  })
}
