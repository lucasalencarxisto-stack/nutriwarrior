export const REPORT_BRANDING_STORAGE_KEY =
  "nutriwarrior:clinical-report-branding:v1"

export const REPORT_BRANDING_COLORS = [
  { name: "Preto", value: "#171717" },
  { name: "Verde", value: "#047857" },
  { name: "Azul", value: "#1d4ed8" },
  { name: "Vermelho", value: "#b91c1c" },
  { name: "Âmbar", value: "#b45309" },
  { name: "Violeta", value: "#6d28d9" },
] as const

export type ReportBranding = {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  fontSize: number
  logoDataUrl: string | null
}

export const defaultReportBranding: ReportBranding = {
  text: "",
  bold: false,
  italic: false,
  underline: false,
  color: "#171717",
  fontSize: 20,
  logoDataUrl: null,
}

export function normalizeReportBranding(
  value: Partial<ReportBranding> | null,
): ReportBranding {
  const validColor = REPORT_BRANDING_COLORS.some(
    color => color.value === value?.color,
  )
    ? value?.color ?? defaultReportBranding.color
    : defaultReportBranding.color

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
        : defaultReportBranding.fontSize,
    logoDataUrl: logo,
  }
}

export function loadReportBranding() {
  if (typeof window === "undefined") return defaultReportBranding

  try {
    const stored = window.localStorage.getItem(REPORT_BRANDING_STORAGE_KEY)
    if (!stored) return defaultReportBranding

    return normalizeReportBranding(
      JSON.parse(stored) as Partial<ReportBranding>,
    )
  } catch {
    return defaultReportBranding
  }
}

export function saveReportBranding(branding: ReportBranding) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(
    REPORT_BRANDING_STORAGE_KEY,
    JSON.stringify(branding),
  )
}
