import { apiFetch } from "./api"

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"

export type Appointment = {
  id: number
  clienteId: number
  patient: string
  startsAt: string
  status: AppointmentStatus
  notes: string
  updatedAt: string
}

export type AppointmentInput = {
  startsAt?: string
  status?: AppointmentStatus
  notes?: string
}

export type PatientNote = {
  id: number
  clienteId: number
  author: string
  content: string
  createdAt: string
}

export type ClinicalNotification = {
  type: string
  severity: "info" | "warning"
  clienteId: number
  patient: string
  title: string
  message: string
  date: string | null
}

export const getAgenda = (): Promise<Appointment[]> =>
  apiFetch("/nutricionistas/me/agenda")

export const createAppointment = (
  clienteId: number,
  input: AppointmentInput,
): Promise<Appointment> =>
  apiFetch(`/clientes/${clienteId}/agenda`, {
    method: "POST",
    body: JSON.stringify(input),
  })

export const updateAppointment = (
  clienteId: number,
  appointmentId: number,
  input: AppointmentInput,
): Promise<Appointment> =>
  apiFetch(`/clientes/${clienteId}/agenda/${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })

export const deleteAppointment = (
  clienteId: number,
  appointmentId: number,
): Promise<void> =>
  apiFetch(`/clientes/${clienteId}/agenda/${appointmentId}`, {
    method: "DELETE",
  })

export const getNextAppointment = (
  clienteId: number,
): Promise<Appointment | null> =>
  apiFetch(`/clientes/${clienteId}/proxima-consulta`)

export const getPrivateNotes = (
  clienteId: number,
): Promise<PatientNote[]> =>
  apiFetch(`/clientes/${clienteId}/notas-internas`)

export const addPrivateNote = (
  clienteId: number,
  content: string,
): Promise<PatientNote> =>
  apiFetch(`/clientes/${clienteId}/notas-internas`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })

export const deletePrivateNote = (
  clienteId: number,
  noteId: number,
): Promise<void> =>
  apiFetch(`/clientes/${clienteId}/notas-internas/${noteId}`, {
    method: "DELETE",
  })

export const getClinicalNotifications = (): Promise<ClinicalNotification[]> =>
  apiFetch("/nutricionistas/me/notificacoes")
