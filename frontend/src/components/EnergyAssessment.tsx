import { SavedEnergy } from "./SavedEnergy"
import { useId, useState, type FormEvent } from "react"
import { energyMethods, estimateEnergy, parseEnergyNumber, type EnergyInput, type EnergyMethod, type EquationSex } from "../utils/energy"

type Props = { weightKg: number | null; heightCm?: number | null; age: number | null; weightDate?: string; clienteId?: number }
const initial = (n: number | null | undefined) => n != null && Number.isFinite(n) ? String(n).replace(".", ",") : ""
const format = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n)
const fieldClass = "mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-950 focus-visible:outline-2 focus-visible:outline-emerald-600"

export function EnergyAssessment({ weightKg, heightCm, age, weightDate, clienteId }: Props) {
  const id = useId()
  const [method, setMethod] = useState<EnergyMethod>("harris1984")
  const [sex, setSex] = useState<EquationSex | "">("")
  const [weight, setWeight] = useState(initial(weightKg))
  const [height, setHeight] = useState(initial(heightCm))
  const [years, setYears] = useState(initial(age))
  const [factor, setFactor] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<(ReturnType<typeof estimateEnergy> & { input: EnergyInput }) | null>(null)

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResult(null)
    try {
      if (!sex) throw new Error("Selecione o sexo utilizado na equação.")
      const input: EnergyInput = { method, sex, weightKg: parseEnergyNumber(weight), heightCm: parseEnergyNumber(height), age: parseEnergyNumber(years), activityFactor: factor.trim() ? parseEnergyNumber(factor) : undefined }
      setResult({ ...estimateEnergy(input), input })
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Confira os dados informados.")
    }
  }

  return (
    <section aria-labelledby={`${id}-title`} className="mt-8 border-t border-neutral-100 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`${id}-title`} className="text-lg font-semibold">Avaliação energética</h3>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">Estimativa energética</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-neutral-500">Confira os dados e escolha a equação. Ajustes aqui não alteram a ficha nem a meta alimentar.</p>
      <p className="mt-2 text-xs leading-5 text-neutral-500">Dados iniciais: último peso{weightDate ? ` de ${weightDate.split("-").reverse().join("/")}` : " disponível"}, altura e idade da ficha. Uso em adultos; a adequação da equação ao paciente deve ser avaliada pelo nutricionista.</p>

      <form noValidate onSubmit={calculate} onChange={() => { setResult(null); setError(null) }} className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium" htmlFor={`${id}-method`}>Equação
            <select id={`${id}-method`} className={fieldClass} value={method} onChange={e => setMethod(e.target.value as EnergyMethod)}>
              {Object.entries(energyMethods).map(([value, info]) => <option key={value} value={value}>{info.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium" htmlFor={`${id}-sex`}>Sexo utilizado na equação
            <select id={`${id}-sex`} className={fieldClass} value={sex} onChange={e => setSex(e.target.value as EquationSex | "")} required>
              <option value="">Selecione</option><option value="female">Feminino</option><option value="male">Masculino</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium" htmlFor={`${id}-weight`}>Peso (kg)
            <input id={`${id}-weight`} className={fieldClass} inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} required />
          </label>
          <label className="text-sm font-medium" htmlFor={`${id}-height`}>Altura (cm)
            <input id={`${id}-height`} className={fieldClass} inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} required />
          </label>
          <label className="text-sm font-medium" htmlFor={`${id}-age`}>Idade (anos completos)
            <input id={`${id}-age`} className={fieldClass} inputMode="numeric" value={years} onChange={e => setYears(e.target.value)} required />
          </label>
        </div>
        <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
          <label className="text-sm font-medium" htmlFor={`${id}-factor`}>Fator de atividade (opcional)
            <input id={`${id}-factor`} className={`${fieldClass} sm:max-w-40 sm:block`} inputMode="decimal" value={factor} onChange={e => setFactor(e.target.value)} aria-describedby={`${id}-factor-help`} />
          </label>
          <p id={`${id}-factor-help`} className="mt-2 text-xs leading-5 text-neutral-500">Definido pelo profissional. Se preenchido, o gasto total estimado será o resultado da equação multiplicado por esse fator.</p>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" className="mt-5 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Calcular estimativa</button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {result && <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <p className="text-xs font-semibold text-teal-800">{energyMethods[result.input.method].name}</p>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <div><dt className="text-sm text-neutral-600">{energyMethods[result.input.method].resultLabel}</dt><dd className="mt-1 text-2xl font-semibold">{format(result.restingKcal)} <span className="text-sm font-normal text-neutral-500">kcal/dia</span></dd></div>
            {result.totalKcal !== null && <div><dt className="text-sm text-neutral-600">Gasto total estimado</dt><dd className="mt-1 text-2xl font-semibold">{format(result.totalKcal)} <span className="text-sm font-normal text-neutral-500">kcal/dia</span></dd><dd className="mt-1 text-xs text-neutral-500">Fator aplicado: {initial(result.input.activityFactor)}</dd></div>}
          </dl>
          <p className="mt-4 text-xs leading-5 text-neutral-600">Estimativa por equação, não uma medição metabólica nem uma prescrição de ingestão. Sem ajustes específicos para gestação, lactação ou condições clínicas.</p>
        </div>}
      </div>
      {clienteId != null && <SavedEnergy clienteId={clienteId} energy={result?.input} />}
      <details className="mt-5 text-xs leading-6 text-neutral-500">
        <summary className="cursor-pointer font-medium text-neutral-700">Método e referência</summary>
        <p className="mt-2">Peso em kg, altura em cm e idade em anos completos. Arredondamento apenas na exibição.</p>
        <p>Masculino: {energyMethods[method].male}.</p>
        <p>Feminino: {energyMethods[method].female}.</p>
        <p>TMB e gasto energético de repouso são conceitos distintos; o título do resultado acompanha a equação escolhida.</p>
        <a className="font-medium text-teal-700 underline" href={energyMethods[method].source} target="_blank" rel="noreferrer">Consultar referência da equação</a>
      </details>
    </section>
  )
}
