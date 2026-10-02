import type { CareRecord } from "../services/care"
import { dateLabel } from "../services/care"
export function PlanView({ plan }: { plan: CareRecord }) {
  return <article className="rounded-2xl border border-neutral-200 bg-white p-5">
    <h3 className="font-semibold">{plan.title}</h3>
    <p className="mt-1 text-xs text-neutral-500">Versão {plan.version} · {dateLabel(plan.date)} · {plan.author}</p>
    {plan.notes && <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{plan.notes}</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{plan.payload.meals?.map((meal,index) => <section key={index} className="rounded-xl bg-neutral-50 p-4">
      <h4 className="text-sm font-semibold text-teal-800">{meal.name}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{meal.portions}</p>
      {meal.substitutions && <><p className="mt-3 text-xs font-semibold text-neutral-500">Substituições orientadas</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{meal.substitutions}</p></>}
    </section>)}</div>
  </article>
}
