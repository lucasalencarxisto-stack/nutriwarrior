import { apiFetch } from "./api"

export type Patient = {
  id: number
  nome: string
  email: string
  telefone?: string | null
  clienteId?: number | null
}

export type NewPatientRequest = {
  nome: string
  email: string
  senha: string
  telefone?: string
}

export async function getMyPatients(): Promise<Patient[]> {
  return apiFetch(
    "/nutricionistas/me/pacientes",
  )
}

export async function createPatient(
  patient: NewPatientRequest,
) {
  return apiFetch(
    "/nutricionistas/me/pacientes",
    {
      method: "POST",
      body: JSON.stringify(patient),
    },
  )
}

  export async function deletePatient(
    clienteId: number,
  ) {
    return apiFetch(
      `/nutricionistas/me/pacientes/${clienteId}`,
      {
        method: "DELETE",
      },
    )
  }
