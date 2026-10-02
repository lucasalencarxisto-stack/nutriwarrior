import { apiFetch } from "./api"


export type NutritionalGoals = {
  clienteId: number

  calorias:
    | number
    | null

  proteinasGramas:
    | number
    | null

  carboidratosGramas:
    | number
    | null

  gordurasGramas:
    | number
    | null

  aguaMl:
    | number
    | null

  pesoAlvoKg:
    | number
    | null
}


export type NutritionSummary = {
  clienteId: number

  data: string

  calorias: number

  proteinasGramas: number

  carboidratosGramas: number

  gordurasGramas: number

  quantidadeRefeicoes: number

  quantidadeItens: number

  pesoKg:
    | number
    | null

  aguaMl:
    | number
    | null

  metaCalorias:
    | number
    | null

  caloriasRestantes:
    | number
    | null

  metaProteina:
    | number
    | null

  proteinaRestante:
    | number
    | null

  metaCarboidratos:
    | number
    | null

  carboidratosRestantes:
    | number
    | null

  metaGordura:
    | number
    | null

  gorduraRestante:
    | number
    | null

  metaAguaMl:
    | number
    | null

  aguaRestanteMl:
    | number
    | null

  pesoAlvoKg:
    | number
    | null
}


export async function getNutritionalGoals(
  clienteId: number,
): Promise<NutritionalGoals> {

  return apiFetch(
    `/clientes/${clienteId}/metas`,
  )
}


export async function getNutritionSummary(
  clienteId: number,
  date: string,
): Promise<NutritionSummary> {

  return apiFetch(
    `/clientes/${clienteId}/dias/${date}/resumo`,
  )
}


export async function getNutritionSummaries(
  clienteId: number,
  dates: string[],
): Promise<NutritionSummary[]> {

  const uniqueDates =
    [...new Set(dates)]


  const results =
    await Promise.allSettled(

      uniqueDates.map(
        (date) =>
          getNutritionSummary(
            clienteId,
            date,
          ),
      ),

    )


  return results
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<NutritionSummary> =>
        result.status ===
        "fulfilled",
    )
    .map(
      (result) =>
        result.value,
    )
    .sort(
      (a, b) =>
        a.data.localeCompare(
          b.data,
        ),
    )
}