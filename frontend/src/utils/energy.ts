export type EnergyMethod = "harris1984" | "mifflin1990"
export type EquationSex = "male" | "female"
export type EnergyInput = {
  method: EnergyMethod
  sex: EquationSex
  weightKg: number
  heightCm: number
  age: number
  activityFactor?: number
}

export const energyMethods = {
  harris1984: {
    name: "Harris-Benedict revisada (1984)",
    resultLabel: "Gasto basal estimado (TMB)",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5121980/",
    male: "88,362 + 13,397 × peso + 4,799 × altura − 5,677 × idade",
    female: "447,593 + 9,247 × peso + 3,098 × altura − 4,330 × idade",
  },
  mifflin1990: {
    name: "Mifflin-St Jeor (1990)",
    resultLabel: "Gasto de repouso estimado (GER)",
    source: "https://pubmed.ncbi.nlm.nih.gov/2305711/",
    male: "10 × peso + 6,25 × altura − 5 × idade + 5",
    female: "10 × peso + 6,25 × altura − 5 × idade − 161",
  },
} as const

// Decimal comma is accepted; empty/ambiguous values must not become zero.
export function parseEnergyNumber(value: string): number {
  const normalized = value.trim().replace(",", ".")
  return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN
}

// Weight in kg; height in cm; age in completed years. No prescription is written here.
export function estimateEnergy(input: EnergyInput) {
  const { method, sex, weightKg, heightCm, age, activityFactor } = input
  if (!(method === "harris1984" || method === "mifflin1990")) throw new Error("Selecione uma equação válida.")
  if (!(sex === "male" || sex === "female")) throw new Error("Selecione o sexo utilizado na equação.")
  if (!Number.isFinite(weightKg) || weightKg <= 0) throw new Error("Informe um peso válido em kg, maior que zero.")
  if (!Number.isFinite(heightCm) || heightCm <= 0) throw new Error("Informe uma altura válida em cm, maior que zero.")
  if (!Number.isInteger(age) || age < 18 || age > 120) throw new Error("Esta calculadora aceita adultos de 18 a 120 anos, em anos completos.")
  if (activityFactor !== undefined && (!Number.isFinite(activityFactor) || activityFactor < 1)) throw new Error("Informe um fator de atividade válido, igual ou maior que 1, ou deixe o campo vazio.")

  const restingKcal = method === "harris1984"
    ? sex === "male"
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age
    : 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161)
  const totalKcal = activityFactor === undefined ? null : restingKcal * activityFactor
  if (!Number.isFinite(restingKcal) || restingKcal <= 0 || (totalKcal !== null && !Number.isFinite(totalKcal))) {
    throw new Error("Os dados não produziram uma estimativa válida. Confira peso, altura, idade e fator.")
  }
  return { restingKcal, totalKcal }
}
