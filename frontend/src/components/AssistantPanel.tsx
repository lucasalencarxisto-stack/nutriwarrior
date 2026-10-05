import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Bot, Check, SendHorizontal, X } from "lucide-react"
import { apiFetch } from "../services/api"

type Reply = {
  message: string
  confirmationRequired: boolean
  confirmationId?: string | null
}

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  message: string
  confirmationRequired?: boolean
  confirmationId?: string | null
  discarded?: boolean
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  message:
    "Olá! Posso te ajudar a registrar peso, água e refeições. O que você quer atualizar?",
}

export function AssistantPanel({ clienteId }: { clienteId: number }) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const running = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const pendingConfirmation = messages.some(
    item =>
      item.role === "assistant" &&
      item.confirmationRequired &&
      item.confirmationId &&
      !item.discarded,
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, busy, error])

  async function send(event: FormEvent) {
    event.preventDefault()

    const text = message.trim()

    if (
      running.current ||
      !text ||
      pendingConfirmation
    ) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      message: text,
    }

    setMessages(current => [...current, userMessage])
    setMessage("")
    setError("")
    running.current = true
    setBusy(true)

    try {
      const reply = (await apiFetch("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          clienteId,
          message: text,
        }),
      })) as Reply

      setMessages(current => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          message: reply.message,
          confirmationRequired: reply.confirmationRequired,
          confirmationId: reply.confirmationId,
        },
      ])
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Assistente indisponível. Tente novamente.",
      )
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  async function confirm(item: ChatMessage) {
    if (
      running.current ||
      !item.confirmationRequired ||
      !item.confirmationId
    ) {
      return
    }

    running.current = true
    setBusy(true)
    setError("")

    try {
      const result = (await apiFetch("/assistant/execute", {
        method: "POST",
        body: JSON.stringify({
          confirmationId: item.confirmationId,
        }),
      })) as { message: string }

      setMessages(current =>
        current.map(messageItem =>
          messageItem.id === item.id
            ? {
                ...messageItem,
                message: result.message,
                confirmationRequired: false,
                confirmationId: null,
              }
            : messageItem,
        ),
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível confirmar o registro.",
      )
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  function discard(item: ChatMessage) {
    if (busy) return

    setMessages(current =>
      current.map(messageItem =>
        messageItem.id === item.id
          ? {
              ...messageItem,
              confirmationRequired: false,
              confirmationId: null,
              discarded: true,
            }
          : messageItem,
      ),
    )
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-neutral-100 bg-white px-5 py-4 sm:px-6">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-950 text-white">
          <Bot size={20} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-neutral-950">
              NutriWarrior Assistant
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>

          <p className="mt-0.5 text-xs text-neutral-500">
            Registros de peso, água e refeições com confirmação antes de salvar.
          </p>
        </div>
      </header>

      <div className="flex min-h-[520px] max-h-[640px] flex-col bg-[#f7faf9]">
        <div
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
          aria-live="polite"
        >
          {messages.map(item => {
            const assistant = item.role === "assistant"

            return (
              <div
                key={item.id}
                className={[
                  "flex",
                  assistant ? "justify-start" : "justify-end",
                ].join(" ")}
              >
                <div className={assistant ? "flex max-w-[88%] items-end gap-2 sm:max-w-[78%]" : "max-w-[88%] sm:max-w-[72%]"}>
                  {assistant && (
                    <div className="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-teal-700 shadow-sm ring-1 ring-neutral-200">
                      <Bot size={15} aria-hidden="true" />
                    </div>
                  )}

                  <div
                    className={[
                      "rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                      assistant
                        ? "rounded-bl-md border border-neutral-200 bg-white text-neutral-800"
                        : "rounded-br-md bg-teal-600 text-white",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap">{item.message}</p>

                    {item.discarded && (
                      <p className="mt-2 border-t border-neutral-100 pt-2 text-xs text-neutral-400">
                        Registro descartado.
                      </p>
                    )}

                    {item.confirmationRequired &&
                      item.confirmationId &&
                      !item.discarded && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void confirm(item)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                          >
                            <Check size={14} aria-hidden="true" />
                            Confirmar
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => discard(item)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                          >
                            <X size={14} aria-hidden="true" />
                            Cancelar
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )
          })}

          {busy && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="mb-1 grid h-8 w-8 place-items-center rounded-full bg-white text-teal-700 shadow-sm ring-1 ring-neutral-200">
                  <Bot size={15} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mx-auto max-w-xl rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form
          ref={formRef}
          onSubmit={send}
          className="border-t border-neutral-200 bg-white p-4 sm:p-5"
        >
          {pendingConfirmation && (
            <p className="mb-2 text-xs text-amber-700">
              Confirme ou cancele o registro acima antes de enviar uma nova mensagem.
            </p>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 transition focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100">
            <textarea
              required
              maxLength={2000}
              rows={1}
              disabled={busy || pendingConfirmation}
              value={message}
              onChange={event => setMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={
                pendingConfirmation
                  ? "Aguardando confirmação do registro..."
                  : "Digite sua mensagem..."
              }
            />

            <button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={busy || pendingConfirmation || !message.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              <SendHorizontal size={17} aria-hidden="true" />
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-neutral-400">
            Enter envia · Shift + Enter quebra a linha
          </p>
        </form>
      </div>
    </section>
  )
}
