import { apiFetch } from "./api"
import type { Meal } from "./care"

export type PlanTemplate = {
  id: number
  name: string
  title: string
  notes: string
  meals: Meal[]
  createdAt: string
  updatedAt: string
}

export type PlanTemplateInput = {
  name: string
  title: string
  notes: string
  meals: Meal[]
}

export const getPlanTemplates = (): Promise<PlanTemplate[]> =>
  apiFetch("/nutricionistas/me/plan-templates")

export const createPlanTemplate = (
  input: PlanTemplateInput,
): Promise<PlanTemplate> =>
  apiFetch("/nutricionistas/me/plan-templates", {
    method: "POST",
    body: JSON.stringify(input),
  })

export const updatePlanTemplate = (
  id: number,
  input: PlanTemplateInput,
): Promise<PlanTemplate> =>
  apiFetch(`/nutricionistas/me/plan-templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })

export const deletePlanTemplate = (
  id: number,
): Promise<void> =>
  apiFetch(`/nutricionistas/me/plan-templates/${id}`, {
    method: "DELETE",
  })
