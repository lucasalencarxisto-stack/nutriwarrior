import {
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react"

import { useEffect, useState } from "react"

import { useToast } from "./ToastProvider"

import {
  deletePatient,
} from "../services/patients"


type DeletePatientModalProps = {
  open: boolean
  patientName: string
  clienteId: number | null
  onClose: () => void
  onDeleted: () => void | Promise<void>
}


export function DeletePatientModal({
  open,
  patientName,
  clienteId,
  onClose,
  onDeleted,
}: DeletePatientModalProps) {
  const toast = useToast()

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        handleClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open, loading])


  if (!open) {
    return null
  }


  function handleClose() {
    if (loading) {
      return
    }

    setError(null)
    onClose()
  }


  async function handleDelete() {
    if (!clienteId) {
      const message = "Não foi possível identificar o paciente."
      setError(message)
      toast.error(message)
      return
    }

    try {
      setLoading(true)
      setError(null)

      await deletePatient(
        clienteId,
      )

      await onDeleted()
      toast.success("Paciente removido da carteira.")
      onClose()

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível deletar o paciente."

      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">

      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-7 shadow-2xl"
      >

        <div className="flex items-start justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>


            <div>

              <h2 className="text-lg font-semibold tracking-tight">
                Deletar paciente
              </h2>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Deseja realmente deletar{" "}
                <span className="font-semibold text-neutral-800">
                  {patientName}
                </span>
                ?
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-50"
          >
            <X size={18} />
          </button>

        </div>


        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">

          <p className="text-sm leading-5 text-red-700">
            Esta ação removerá o paciente e os
            dados vinculados a ele. Esta operação
            não pode ser desfeita.
          </p>

        </div>


        {error && (

          <p className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>

        )}


        <div className="mt-7 flex justify-end gap-3">

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="h-11 rounded-2xl border border-neutral-200 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Não
          </button>


          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 size={17} />
                Sim, deletar
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  )
}