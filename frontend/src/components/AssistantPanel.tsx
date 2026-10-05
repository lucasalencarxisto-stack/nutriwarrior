import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Check, X } from "lucide-react"
import { apiFetch } from "../services/api"
import attachmentIcon from "../assets/anexo-icon.png"
import chatBackground from "../assets/back-ground.png"
import clarifyIcon from "../assets/clarefy-icone.png"
import defaultIcon from "../assets/default-icone.png"
import errorIcon from "../assets/error-icone.png"
import imageIcon from "../assets/img-icon.png"
import mascot from "../assets/mascote.png"
import pdfIcon from "../assets/pdf-icon.png"
import sendIcon from "../assets/send-icon.png"
import successIcon from "../assets/sucess-icone.png"
import thinkingIcon from "../assets/thinking-icone.png"
import txtIcon from "../assets/txt-icon.png"
import warningIcon from "../assets/warning-icone.png"

type Reply = {
  message: string
  confirmationRequired: boolean
  confirmationId?: string | null
}

type AssistantMood =
  | "default"
  | "thinking"
  | "clarify"
  | "error"
  | "success"
  | "warning"

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  message: string
  mood?: AssistantMood
  confirmationRequired?: boolean
  confirmationId?: string | null
  discarded?: boolean
}

type AttachmentKind = "image" | "pdf" | "txt"

type AttachmentPreview = {
  id: string
  name: string
  size: number
  kind: AttachmentKind
}

const moodIcons: Record<AssistantMood, string> = {
  default: defaultIcon,
  thinking: thinkingIcon,
  clarify: clarifyIcon,
  error: errorIcon,
  success: successIcon,
  warning: warningIcon,
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  mood: "default",
  message:
    "Olá! Posso te ajudar a registrar peso, água e refeições. O que você quer atualizar?",
}

const MAX_ATTACHMENTS = 3
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

function patientInitials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []

  if (parts.length === 0) return "EU"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function inferMood(reply: Reply): AssistantMood {
  const normalized = reply.message.toLocaleLowerCase("pt-BR")

  if (
    /não entendi|não consegui identificar|preciso que|me informe|qual quantidade|quanto|quantos|especifique|poderia informar/.test(
      normalized,
    )
  ) {
    return "clarify"
  }

  if (
    /estimativ|aproximad|atenção|aviso|cuidado|confirme antes|confirmar antes/.test(
      normalized,
    )
  ) {
    return "warning"
  }

  if (reply.confirmationRequired) return "warning"

  return "default"
}

function attachmentKind(file: File): AttachmentKind | null {
  const lower = file.name.toLowerCase()

  if (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp)$/.test(lower)
  ) {
    return "image"
  }

  if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
    return "pdf"
  }

  if (file.type === "text/plain" || lower.endsWith(".txt")) {
    return "txt"
  }

  return null
}

function attachmentAsset(kind: AttachmentKind) {
  if (kind === "pdf") return pdfIcon
  if (kind === "txt") return txtIcon
  return imageIcon
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AssistantAvatar({ mood = "default" }: { mood?: AssistantMood }) {
  return (
    <div className="mb-1 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-transparent">
      <img
        src={moodIcons[mood]}
        alt=""
        aria-hidden="true"
        className="h-full w-full scale-[0.94] object-contain"
      />
    </div>
  )
}

export function AssistantPanel({
  clienteId,
  patientName,
  variant = "default",
}: {
  clienteId: number
  patientName?: string
  variant?: "default" | "compact"
}) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [attachmentError, setAttachmentError] = useState("")
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false)
  const running = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initials = patientInitials(patientName)
  const compact = variant === "compact"

  const pendingConfirmation = messages.some(
    item =>
      item.role === "assistant" &&
      item.confirmationRequired &&
      item.confirmationId &&
      !item.discarded,
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, busy, error, attachments])

  async function send(event: FormEvent) {
    event.preventDefault()

    const text = message.trim()

    if (running.current || !text || pendingConfirmation) {
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
          mood: inferMood(reply),
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
                mood: "success",
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
              mood: "warning",
              confirmationRequired: false,
              confirmationId: null,
              discarded: true,
            }
          : messageItem,
      ),
    )
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""

    if (files.length === 0) return

    setAttachmentError("")

    const remaining = MAX_ATTACHMENTS - attachments.length
    if (remaining <= 0) {
      setAttachmentError("Você pode selecionar até 3 anexos por mensagem.")
      return
    }

    const next: AttachmentPreview[] = []

    for (const file of files.slice(0, remaining)) {
      const kind = attachmentKind(file)

      if (!kind) {
        setAttachmentError(
          "Formato não suportado. Use PNG, JPG, WEBP, PDF ou TXT.",
        )
        continue
      }

      if (file.size > MAX_ATTACHMENT_SIZE) {
        setAttachmentError(
          `${file.name} excede o limite de 10 MB por arquivo.`,
        )
        continue
      }

      next.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        kind,
      })
    }

    setAttachments(current => [...current, ...next])

    if (files.length > remaining) {
      setAttachmentError("Somente os 3 primeiros anexos foram selecionados.")
    }
  }

  function removeAttachment(id: string) {
    setAttachments(current => current.filter(item => item.id !== id))
    setAttachmentError("")
  }

  function openAttachmentPicker(kind: AttachmentKind) {
    const input = fileInputRef.current
    if (!input) return

    input.accept =
      kind === "image"
        ? ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        : kind === "pdf"
          ? ".pdf,application/pdf"
          : ".txt,text/plain"

    setAttachmentMenuOpen(false)
    input.click()
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
    <section
      className={[
        "overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_18px_55px_rgba(15,118,110,0.10)]",
        compact ? "mt-0" : "mt-6",
      ].join(" ")}
    >
      <header
        className={[
          "relative overflow-hidden border-b border-emerald-100 bg-[#eaf7f0]",
          compact ? "px-4 py-4" : "px-5 py-5 sm:px-7",
        ].join(" ")}
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(234,247,240,.94), rgba(234,247,240,.78)), url(${chatBackground})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div
          className={[
            "relative z-10 flex items-center",
            compact ? "min-h-20 gap-3" : "min-h-28 gap-4 sm:min-h-32 sm:gap-6",
          ].join(" ")}
        >
          <img
            src={mascot}
            alt="Mascote do NutriWarrior Assistant"
            className={
              compact
                ? "h-16 w-16 shrink-0 object-contain drop-shadow-md"
                : "h-24 w-24 shrink-0 object-contain drop-shadow-md sm:h-32 sm:w-32"
            }
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={
                  compact
                    ? "text-base font-bold tracking-tight text-emerald-950"
                    : "text-lg font-bold tracking-tight text-emerald-950 sm:text-xl"
                }
              >
                NutriWarrior Assistant
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.12)]" />
                Online
              </span>
            </div>

            {compact ? (
              <p className="mt-1 text-xs text-emerald-950/60">
                {patientName ? `Conversando sobre ${patientName}` : "Assistente clínico"}
              </p>
            ) : (
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-950/65">
                Seu assistente para registrar peso, água e refeições com uma
                confirmação rápida antes de salvar.
              </p>
            )}
          </div>
        </div>
      </header>

      <div
        className={[
          "flex flex-col bg-gradient-to-b from-[#f8fcfa] to-[#f2f8f5]",
          compact ? "min-h-[470px] max-h-[620px]" : "min-h-[540px] max-h-[700px]",
        ].join(" ")}
      >
        <div
          className={[
            "flex-1 overflow-y-auto",
            compact ? "space-y-4 px-3 py-4" : "space-y-5 px-4 py-6 sm:px-6",
          ].join(" ")}
          aria-live="polite"
        >
          {messages.map(item => {
            const assistant = item.role === "assistant"

            return (
              <div
                key={item.id}
                className={`flex ${assistant ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={
                    assistant
                      ? "flex max-w-[92%] items-end gap-2.5 sm:max-w-[80%]"
                      : "flex max-w-[92%] flex-row-reverse items-end gap-2.5 sm:max-w-[74%]"
                  }
                >
                  {assistant ? (
                    <AssistantAvatar mood={item.mood} />
                  ) : (
                    <div
                      aria-label={patientName ? `Mensagem de ${patientName}` : "Sua mensagem"}
                      className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-700 text-[11px] font-bold tracking-wide text-white shadow-sm ring-2 ring-white"
                    >
                      {initials}
                    </div>
                  )}

                  <div
                    className={[
                      "rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                      assistant
                        ? "rounded-bl-md border border-emerald-100 bg-white text-neutral-800"
                        : "rounded-br-md bg-teal-700 text-white shadow-teal-900/10",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap">{item.message}</p>

                    {item.discarded && (
                      <p className="mt-2 border-t border-amber-100 pt-2 text-xs text-amber-700">
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
                            className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
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
              <div className="flex items-end gap-2.5">
                <AssistantAvatar mood="thinking" />
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-emerald-100 bg-white px-4 py-3.5 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="flex justify-start">
              <div className="flex max-w-[92%] items-end gap-2.5 sm:max-w-[80%]">
                <AssistantAvatar mood="error" />
                <div className="rounded-2xl rounded-bl-md border border-red-100 bg-white px-4 py-3 text-sm leading-6 text-red-700 shadow-sm">
                  {error}
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form
          ref={formRef}
          onSubmit={send}
          className={[
            "border-t border-emerald-100 bg-white/95 backdrop-blur",
            compact ? "p-3" : "p-4 sm:p-5",
          ].join(" ")}
        >
          {pendingConfirmation && (
            <p className="mb-2 text-xs font-medium text-amber-700">
              Confirme ou cancele o registro acima antes de enviar uma nova mensagem.
            </p>
          )}

          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map(item => (
                <div
                  key={item.id}
                  className="flex max-w-full items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 shadow-sm"
                >
                  <img
                    src={attachmentAsset(item.kind)}
                    alt=""
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="max-w-44 truncate text-xs font-semibold text-neutral-700">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {formatBytes(item.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(item.id)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-white hover:text-neutral-700"
                    aria-label={`Remover ${item.name}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {(attachmentError || attachments.length > 0) && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              {attachmentError ? (
                <span className="text-amber-700">{attachmentError}</span>
              ) : (
                <span className="text-neutral-400">
                  PNG, JPG, WEBP, PDF ou TXT · até 10 MB · máximo de 3 arquivos
                </span>
              )}
              {attachments.length > 0 && (
                <span className="font-medium text-neutral-400">
                  Preview local — o envio dos arquivos será conectado ao backend na próxima etapa.
                </span>
              )}
            </div>
          )}

          <div className="relative flex items-end gap-2 rounded-[22px] border border-neutral-200 bg-neutral-50 p-2 transition focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleAttachmentChange}
              className="hidden"
              aria-label="Selecionar anexos"
            />

            <div className="relative shrink-0">
              {attachmentMenuOpen && (
                <div
                  role="menu"
                  aria-label="Tipo de anexo"
                  className="absolute bottom-[calc(100%+12px)] left-0 z-20 w-64 rounded-2xl border border-emerald-100 bg-white p-2 shadow-[0_16px_45px_rgba(15,23,42,0.16)]"
                >
                  <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Escolha o tipo de anexo
                  </p>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openAttachmentPicker("image")}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-emerald-50"
                  >
                    <img src={imageIcon} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
                    <span>
                      <span className="block text-sm font-semibold text-neutral-800">Imagem</span>
                      <span className="block text-[11px] text-neutral-400">PNG, JPG ou WEBP</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openAttachmentPicker("pdf")}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-emerald-50"
                  >
                    <img src={pdfIcon} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
                    <span>
                      <span className="block text-sm font-semibold text-neutral-800">PDF</span>
                      <span className="block text-[11px] text-neutral-400">Documento em PDF</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openAttachmentPicker("txt")}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-emerald-50"
                  >
                    <img src={txtIcon} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
                    <span>
                      <span className="block text-sm font-semibold text-neutral-800">TXT</span>
                      <span className="block text-[11px] text-neutral-400">Arquivo de texto simples</span>
                    </span>
                  </button>
                </div>
              )}

              <button
                type="button"
                aria-label="Anexar arquivo"
                aria-haspopup="menu"
                aria-expanded={attachmentMenuOpen}
                title="Anexar arquivo"
                disabled={busy || pendingConfirmation}
                onClick={() => setAttachmentMenuOpen(open => !open)}
                className={[
                  "grid h-11 w-11 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40",
                  attachmentMenuOpen ? "bg-white shadow-sm" : "hover:bg-white",
                ].join(" ")}
              >
                <img
                  src={attachmentIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 object-contain"
                />
              </button>
            </div>

            <textarea
              required
              maxLength={2000}
              rows={1}
              disabled={busy || pendingConfirmation}
              value={message}
              onChange={event => setMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={
                pendingConfirmation
                  ? "Aguardando confirmação do registro..."
                  : "Digite sua mensagem..."
              }
            />

            <button
              type="submit"
              aria-label="Enviar mensagem"
              title="Enviar mensagem"
              disabled={busy || pendingConfirmation || !message.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <img
                src={sendIcon}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 object-contain"
              />
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
