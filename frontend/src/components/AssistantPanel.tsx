import { useRef, useState, type FormEvent } from "react"
import { apiFetch } from "../services/api"

type Reply = { message: string; confirmationRequired: boolean; confirmationId?: string | null }
export function AssistantPanel({ clienteId }: { clienteId: number }) {
  const [message, setMessage] = useState("")
  const [reply, setReply] = useState<Reply | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const running = useRef(false)
  async function send(event: FormEvent) {
    event.preventDefault()
    if (running.current || !message.trim()) return
    running.current = true; setBusy(true); setError(""); setReply(null)
    try { setReply(await apiFetch("/assistant/chat", { method: "POST", body: JSON.stringify({ clienteId, message }) })); setMessage("") }
    catch (e) { setError(e instanceof Error ? e.message : "Assistente indisponível. Tente novamente.") }
    finally { running.current = false; setBusy(false) }
  }
  async function confirm() {
    if (running.current || !reply?.confirmationRequired || !reply.confirmationId) return
    running.current = true; setBusy(true); setError("")
    try {
      const result = await apiFetch("/assistant/execute", { method: "POST", body: JSON.stringify({ confirmationId: reply.confirmationId }) })
      setReply({ message: result.message, confirmationRequired: false })
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível confirmar o registro.") }
    finally { running.current = false; setBusy(false) }
  }
  return <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
    <h2 className="text-xl font-semibold">Assistente de registros</h2>
    <p className="mt-2 text-sm text-neutral-500">Peça ajuda para registrar peso, água e refeições. Confira os dados apresentados antes de confirmar.</p>
    {reply && <div className="mt-4 rounded-2xl bg-neutral-50 p-4"><p role="status" className="whitespace-pre-wrap text-sm leading-6">{reply.message}</p>{reply.confirmationRequired && reply.confirmationId && <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={confirm} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirmar registro</button><button type="button" disabled={busy} onClick={() => setReply(null)} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm">Descartar</button></div>}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={send} className="mt-4"><label className="block text-sm">Sua mensagem<textarea required maxLength={2000} rows={3} disabled={busy || !!reply?.confirmationRequired} value={message} onChange={e => setMessage(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 p-3 text-sm disabled:opacity-50" placeholder="Ex.: registre meu peso de hoje: 79 kg" /></label><button disabled={busy || !!reply?.confirmationRequired} className="mt-3 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Aguarde…" : "Enviar"}</button></form>
  </section>
}
