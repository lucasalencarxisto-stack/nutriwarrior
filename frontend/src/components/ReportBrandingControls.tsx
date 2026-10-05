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
import { useState, type ChangeEvent } from "react"
import brandLogo from "../assets/nutriwarrior-logo.png"
import {
  REPORT_BRANDING_COLORS,
  defaultReportBranding,
  normalizeReportBranding,
  type ReportBranding,
} from "../utils/reportBranding"

const MAX_LOGO_BYTES = 850_000

export function ReportBrandingControls({
  branding,
  onChange,
}: {
  branding: ReportBranding
  onChange: (branding: ReportBranding) => void
}) {
  const [error, setError] = useState("")

  function update(patch: Partial<ReportBranding>) {
    setError("")
    onChange(normalizeReportBranding({ ...branding, ...patch }))
  }

  function reset() {
    setError("")
    onChange(defaultReportBranding)
  }

  function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Use um logo em PNG, JPG ou WEBP.")
      return
    }

    if (file.size > MAX_LOGO_BYTES) {
      setError("O logo deve ter no máximo 850 KB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null

      if (!dataUrl) {
        setError("Não foi possível carregar este logo.")
        return
      }

      update({ logoDataUrl: dataUrl })
    }
    reader.onerror = () => setError("Não foi possível carregar este logo.")
    reader.readAsDataURL(file)
  }

  const hasCustomBrand = Boolean(
    branding.text.trim() || branding.logoDataUrl,
  )

  const textStyle = {
    color: branding.color,
    fontWeight: branding.bold ? 700 : 500,
    fontStyle: branding.italic ? "italic" : "normal",
    textDecoration: branding.underline ? "underline" : "none",
    fontSize: `${branding.fontSize}px`,
    lineHeight: 1.15,
  } as const

  return (
    <div className="mt-6 rounded-[22px] border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            Identidade do PDF
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
            Use seu nome, o nome da clínica ou um logotipo. Se deixar em branco,
            o relatório será emitido com a marca NutriWarrior.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
        >
          <RotateCcw size={14} />
          Limpar
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
        <div>
          <textarea
            value={branding.text}
            onChange={event => update({ text: event.target.value })}
            maxLength={180}
            rows={2}
            placeholder="Ex.: Dra. Ana Lima · Clínica Vida Nutri"
            className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
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
                  onClick={() => update({ [item.key]: !pressed })}
                  className={[
                    "grid h-9 w-9 place-items-center rounded-xl border transition",
                    pressed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-neutral-200 bg-white text-neutral-500 hover:border-emerald-200 hover:text-emerald-700",
                  ].join(" ")}
                >
                  <Icon size={15} />
                </button>
              )
            })}

            <span className="mx-1 h-6 w-px bg-neutral-200" />

            <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1">
              <button
                type="button"
                aria-label="Diminuir tamanho da fonte"
                disabled={branding.fontSize <= 14}
                onClick={() =>
                  update({
                    fontSize: Math.max(14, branding.fontSize - 2),
                  })
                }
                className="grid h-7 w-7 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30"
              >
                <Minus size={13} />
              </button>

              <span className="min-w-11 text-center text-[11px] font-semibold text-neutral-600">
                {branding.fontSize}px
              </span>

              <button
                type="button"
                aria-label="Aumentar tamanho da fonte"
                disabled={branding.fontSize >= 32}
                onClick={() =>
                  update({
                    fontSize: Math.min(32, branding.fontSize + 2),
                  })
                }
                className="grid h-7 w-7 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30"
              >
                <Plus size={13} />
              </button>
            </div>

            <span className="mx-1 h-6 w-px bg-neutral-200" />

            {REPORT_BRANDING_COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                aria-label={`Cor ${color.name}`}
                title={color.name}
                aria-pressed={branding.color === color.value}
                onClick={() => update({ color: color.value })}
                className={[
                  "h-8 w-8 rounded-full border-2 transition",
                  branding.color === color.value
                    ? "scale-110 border-neutral-950"
                    : "border-white ring-1 ring-neutral-200 hover:scale-105",
                ].join(" ")}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>

        <div className="flex min-w-44 flex-col gap-2">
          <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-700 transition hover:border-emerald-200 hover:bg-emerald-50">
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
              onClick={() => update({ logoDataUrl: null })}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={14} />
              Remover logo
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Prévia da marca no relatório
        </p>

        <div className="mt-3 min-h-20 border-t border-neutral-100 pt-4">
          {hasCustomBrand ? (
            <div className="flex min-h-14 items-center gap-4">
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
            <div className="flex min-h-14 items-center justify-between gap-4">
              <img
                src={brandLogo}
                alt="NutriWarrior"
                className="h-auto w-32 object-contain"
              />
              <span className="max-w-xs text-right text-[11px] leading-5 text-neutral-400">
                Sem personalização, o relatório usa a identidade NutriWarrior.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
