import { useEffect, useState, type ChangeEvent } from "react"
import {
  Bold,
  ImagePlus,
  Italic,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  Underline,
} from "lucide-react"
import brandLogo from "../assets/nutriwarrior-logo.png"
import { formatScheduleDateTime } from "./SchedulePicker"
import { getCareHistory, type CareRecord } from "../services/care"
import { getNextAppointment, type Appointment } from "../services/clinical"
import type { DayRecord } from "../services/days"
import type { NutritionSummary } from "../services/nutrition"

const BRANDING_STORAGE_KEY = "nutriwarrior:clinical-report-branding:v1"
const MAX_LOGO_BYTES = 850_000

const footerColors = [
  { name: "Preto", value: "#171717" },
  { name: "Verde", value: "#047857" },
  { name: "Azul", value: "#1d4ed8" },
  { name: "Vermelho", value: "#b91c1c" },
  { name: "Âmbar", value: "#b45309" },
  { name: "Violeta", value: "#6d28d9" },
] as const

type ReportBranding = {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  fontSize: number
  logoDataUrl: string | null
}

const defaultBranding: ReportBranding = {
  text: "",
  bold: false,
  italic: false,
  underline: false,
  color: "#171717",
  fontSize: 20,
  logoDataUrl: null,
}

const esc = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

function normalizeBranding(value: Partial<ReportBranding> | null): ReportBranding {
  const validColor = footerColors.some(color => color.value === value?.color)
    ? value?.color ?? defaultBranding.color
    : defaultBranding.color

  const logo =
    typeof value?.logoDataUrl === "string" &&
    value.logoDataUrl.startsWith("data:image/")
      ? value.logoDataUrl
      : null

  return {
    text: typeof value?.text === "string" ? value.text.slice(0, 180) : "",
    bold: Boolean(value?.bold),
    italic: Boolean(value?.italic),
    underline: Boolean(value?.underline),
    color: validColor,
    fontSize:
      typeof value?.fontSize === "number" && Number.isFinite(value.fontSize)
        ? Math.min(32, Math.max(14, Math.round(value.fontSize)))
        : defaultBranding.fontSize,
    logoDataUrl: logo,
  }
}

function loadBranding() {
  if (typeof window === "undefined") return defaultBranding

  try {
    const stored = window.localStorage.getItem(BRANDING_STORAGE_KEY)
    if (!stored) return defaultBranding
    return normalizeBranding(JSON.parse(stored) as Partial<ReportBranding>)
  } catch {
    return defaultBranding
  }
}

function formatRecordDate(value: string) {
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}/${month}/${year}` : value
}

export function ClinicalReport({
  clienteId,
  patientName,
  records,
  summaries,
  targetWeight,
}: {
  clienteId: number
  patientName: string
  records: DayRecord[]
  summaries: NutritionSummary[]
  targetWeight?: number | null
}) {
  const [history, setHistory] = useState<CareRecord[]>([])
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [branding, setBranding] = useState<ReportBranding>(loadBranding)
  const [brandingError, setBrandingError] = useState("")

  useEffect(() => {
    let alive = true

    Promise.all([
      getCareHistory(clienteId),
      getNextAppointment(clienteId),
    ])
      .then(([care, next]) => {
        if (!alive) return
        setHistory(care)
        setAppointment(next)
      })
      .catch(() => undefined)

    return () => {
      alive = false
    }
  }, [clienteId])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        BRANDING_STORAGE_KEY,
        JSON.stringify(branding),
      )
    } catch {
      // Se o navegador estiver sem espaço, a personalização segue ativa
      // nesta sessão mesmo sem persistência.
    }
  }, [branding])

  function updateBranding(patch: Partial<ReportBranding>) {
    setBranding(current => normalizeBranding({ ...current, ...patch }))
    setBrandingError("")
  }

  function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setBrandingError("Use um logo em PNG, JPG ou WEBP.")
      return
    }

    if (file.size > MAX_LOGO_BYTES) {
      setBrandingError("O logo deve ter no máximo 850 KB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null

      if (!dataUrl) {
        setBrandingError("Não foi possível carregar este logo.")
        return
      }

      updateBranding({ logoDataUrl: dataUrl })
    }
    reader.onerror = () => setBrandingError("Não foi possível carregar este logo.")
    reader.readAsDataURL(file)
  }

  function resetBranding() {
    setBranding(defaultBranding)
    setBrandingError("")
  }

  function printReport() {
    const weights = records
      .filter(row => row.pesoKg != null)
      .sort((a, b) => b.data.localeCompare(a.data))
    const latestWeight = weights[0]
    const latestPlan = history.find(row => row.kind === "PLAN")
    const latestConsultation = history.find(row => row.kind === "CONSULTATION")
    const recentNutrition = [...summaries]
      .filter(row => row.quantidadeItens > 0)
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 7)

    const popup = window.open("", "_blank")
    if (!popup) return
    popup.opener = null

    const meals = latestPlan?.payload.meals ?? []
    const hasCustomBrand = Boolean(
      branding.text.trim() || branding.logoDataUrl,
    )
    const brandText = esc(branding.text).replaceAll("\n", "<br>")
    const brandTextStyle = [
      `color:${branding.color}`,
      `font-size:${branding.fontSize}px`,
      branding.bold ? "font-weight:700" : "font-weight:500",
      branding.italic ? "font-style:italic" : "font-style:normal",
      branding.underline ? "text-decoration:underline" : "text-decoration:none",
    ].join(";")
    const reportBrand = hasCustomBrand
      ? `
<div class="custom-brand">
  ${branding.logoDataUrl ? `<img src="${esc(branding.logoDataUrl)}" alt="Logo do profissional ou clínica">` : ""}
  ${brandText ? `<div class="custom-brand-name" style="${brandTextStyle}">${brandText}</div>` : ""}
</div>`
      : `<img class="brand" src="${esc(brandLogo)}" alt="NutriWarrior">`

    popup.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Relatório NutriWarrior</title>
<style>
@page{size:A4;margin:14mm 14mm 18mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:Arial,sans-serif;color:#171717;line-height:1.45;background:#fff}
.page{min-height:255mm;display:flex;flex-direction:column}
.content{flex:1}
.brand{width:138px;height:auto;display:block;margin-bottom:20px}
.custom-brand{min-height:54px;display:flex;align-items:center;gap:14px;margin-bottom:20px}
.custom-brand img{max-height:58px;max-width:170px;object-fit:contain}
.custom-brand-name{line-height:1.15;white-space:normal}
.eyebrow{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#047857}
h1{font-size:27px;line-height:1.15;margin:5px 0 6px}
.subtitle{font-size:12px;color:#737373;margin:0}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px}
.card{background:#f7f8f7;border:1px solid #ededed;padding:14px;border-radius:12px}
.card small{display:block;color:#8a8a8a;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
.card strong{font-size:14px}
h2{font-size:18px;margin:28px 0 12px;border-bottom:1px solid #e5e5e5;padding-bottom:7px}
p{font-size:13px}
.meal{border:1px solid #e5e5e5;padding:12px;margin:8px 0;border-radius:10px}
.recent-list{padding-left:18px;font-size:12px;color:#404040}
.recent-list li{margin:6px 0}
.disclaimer{margin-top:28px;padding:12px 14px;border-radius:10px;background:#f7f8f7;color:#666;font-size:11px}
.print-action{margin-top:18px;border:0;border-radius:10px;background:#171717;color:#fff;padding:10px 14px;font-weight:700}
@media print{.print-action{display:none}}
</style>
</head>
<body>
<div class="page">
  <main class="content">
    ${reportBrand}
    <div class="eyebrow">Relatório profissional</div>
    <h1>Relatório clínico</h1>
    <p class="subtitle">Paciente: ${esc(patientName)} · Gerado em ${esc(new Date().toLocaleString("pt-BR"))}</p>

    <div class="grid">
      <div class="card"><small>Último peso</small><strong>${latestWeight?.pesoKg == null ? "—" : esc(latestWeight.pesoKg) + " kg"}</strong></div>
      <div class="card"><small>Peso-alvo</small><strong>${targetWeight == null ? "—" : esc(targetWeight) + " kg"}</strong></div>
      <div class="card"><small>Próxima consulta</small><strong>${appointment ? esc(formatScheduleDateTime(appointment.startsAt)) : "—"}</strong></div>
    </div>

    <h2>Última consulta</h2>
    <p><strong>${esc(latestConsultation?.title ?? "Sem consulta registrada")}</strong></p>
    ${latestConsultation?.notes ? `<p>${esc(latestConsultation.notes).replaceAll("\n", "<br>")}</p>` : ""}

    <h2>Plano alimentar vigente</h2>
    <p>${esc(latestPlan?.title ?? "Sem plano publicado")}</p>
    ${meals.map(meal => `<div class="meal"><strong>${esc(meal.name)}</strong><br>${esc(meal.portions).replaceAll("\n", "<br>")}<br><small>Substituições: ${esc(meal.substitutions)}</small></div>`).join("")}

    <h2>Registros recentes</h2>
    ${recentNutrition.length > 0
      ? `<ul class="recent-list">${recentNutrition.map(row => `<li>${esc(formatRecordDate(row.data))} — ${Math.round(row.calorias)} kcal · ${row.quantidadeRefeicoes} refeições · água ${row.aguaMl ?? 0} ml</li>`).join("")}</ul>`
      : '<p style="color:#737373">Nenhum registro nutricional recente disponível.</p>'}

    <div class="disclaimer">
      Relatório descritivo gerado a partir dos registros disponíveis no sistema.
      A interpretação clínica cabe ao profissional responsável.
    </div>

    <button class="print-action" onclick="window.print()">Imprimir / salvar em PDF</button>
  </main>
</div>
<script>window.onload=()=>setTimeout(()=>window.print(),120)</script>
</body>
</html>`)
    popup.document.close()
  }

  const textStyle = {
    color: branding.color,
    fontWeight: branding.bold ? 700 : 500,
    fontStyle: branding.italic ? "italic" : "normal",
    textDecoration: branding.underline ? "underline" : "none",
    fontSize: `${branding.fontSize}px`,
    lineHeight: 1.15,
  } as const

  return (
    <section
      id="report"
      className="scroll-mt-28 overflow-hidden rounded-[30px] border border-neutral-800 bg-neutral-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
    >
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
          Relatório
        </p>
        <h3 className="mt-2 text-lg font-semibold">Resumo clínico para PDF</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
          Gere o relatório com dados atuais e personalize a identidade que aparece
          no topo do documento antes de imprimir ou salvar em PDF.
        </p>

        <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Personalize sua marca</p>
              <p className="mt-1 text-xs leading-5 text-neutral-400">
                Use seu nome, o nome da clínica ou um logotipo no cabeçalho do PDF.
                Se deixar tudo em branco, o NutriWarrior assume a identidade do relatório.
              </p>
            </div>

            <button
              type="button"
              onClick={resetBranding}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white"
            >
              <RotateCcw size={14} />
              Limpar
            </button>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
            <div>
              <textarea
                value={branding.text}
                onChange={event => updateBranding({ text: event.target.value })}
                maxLength={180}
                rows={2}
                placeholder="Ex.: Dra. Ana Lima · Clínica Vida Nutri"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400"
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  { label: "Negrito", icon: Bold, key: "bold" as const },
                  { label: "Itálico", icon: Italic, key: "italic" as const },
                  { label: "Sublinhado", icon: Underline, key: "underline" as const },
                ].map(item => {
                  const Icon = item.icon
                  const pressed = branding[item.key]

                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-label={item.label}
                      title={item.label}
                      aria-pressed={pressed}
                      onClick={() => updateBranding({ [item.key]: !pressed })}
                      className={[
                        "grid h-9 w-9 place-items-center rounded-xl border transition",
                        pressed
                          ? "border-emerald-400 bg-emerald-400 text-neutral-950"
                          : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      <Icon size={15} />
                    </button>
                  )
                })}

                <span className="mx-1 h-6 w-px bg-white/10" />

                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                  <button
                    type="button"
                    aria-label="Diminuir tamanho da fonte"
                    title="Diminuir tamanho da fonte"
                    disabled={branding.fontSize <= 14}
                    onClick={() =>
                      updateBranding({
                        fontSize: Math.max(14, branding.fontSize - 2),
                      })
                    }
                    className="grid h-7 w-7 place-items-center rounded-lg text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus size={13} />
                  </button>

                  <span className="min-w-11 text-center text-[11px] font-semibold text-neutral-300">
                    {branding.fontSize}px
                  </span>

                  <button
                    type="button"
                    aria-label="Aumentar tamanho da fonte"
                    title="Aumentar tamanho da fonte"
                    disabled={branding.fontSize >= 32}
                    onClick={() =>
                      updateBranding({
                        fontSize: Math.min(32, branding.fontSize + 2),
                      })
                    }
                    className="grid h-7 w-7 place-items-center rounded-lg text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <span className="mx-1 h-6 w-px bg-white/10" />

                {footerColors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    aria-label={`Cor ${color.name}`}
                    title={color.name}
                    aria-pressed={branding.color === color.value}
                    onClick={() => updateBranding({ color: color.value })}
                    className={[
                      "h-8 w-8 rounded-full border-2 transition",
                      branding.color === color.value
                        ? "scale-110 border-white"
                        : "border-white/20 hover:scale-105 hover:border-white/60",
                    ].join(" ")}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            <div className="flex min-w-44 flex-col gap-2">
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-neutral-200 transition hover:bg-white/10">
                <ImagePlus size={16} />
                Importar logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogo}
                  className="sr-only"
                />
              </label>

              {branding.logoDataUrl && (
                <button
                  type="button"
                  onClick={() => updateBranding({ logoDataUrl: null })}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Remover logo
                </button>
              )}
            </div>
          </div>

          {brandingError && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-300">
              {brandingError}
            </p>
          )}

          <div className="mt-4 rounded-2xl bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Prévia da marca no relatório
            </p>
            <div className="mt-3 min-h-24 border-t border-neutral-100 pt-4">
              {branding.text.trim() || branding.logoDataUrl ? (
                <div className="flex min-h-16 items-center gap-4">
                  {branding.logoDataUrl && (
                    <img
                      src={branding.logoDataUrl}
                      alt="Logo personalizado"
                      className="max-h-14 max-w-36 object-contain"
                    />
                  )}

                  {branding.text.trim() && (
                    <span
                      style={textStyle}
                      className="whitespace-pre-wrap text-left"
                    >
                      {branding.text}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex min-h-16 items-center justify-between gap-4">
                  <img
                    src={brandLogo}
                    alt="NutriWarrior"
                    className="h-auto w-32 object-contain"
                  />
                  <span className="max-w-xs text-right text-[11px] leading-5 text-neutral-400">
                    Sem personalização, o relatório será emitido com a marca NutriWarrior.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-neutral-500">
            Dica: no diálogo de impressão, desative os cabeçalhos e rodapés do navegador para um PDF mais limpo.
          </p>

          <button
            type="button"
            onClick={printReport}
            className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-50"
          >
            Imprimir / salvar como PDF
          </button>
        </div>
      </div>
    </section>
  )
}
