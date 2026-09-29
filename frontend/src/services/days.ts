import { apiFetch } from "./api"

export type DayRecord = {
  id: number
  clienteId: number
  data: string
  pesoKg: number | null
  aguaMl: number | null
}

export async function getPatientDays(
  clienteId: number,
): Promise<DayRecord[]> {
  return apiFetch(
    `/clientes/${clienteId}/dias`,
  )
}