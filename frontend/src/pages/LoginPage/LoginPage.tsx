import {
  Bot,
  ChartNoAxesCombined,
  ShieldCheck,
  Target,
} from "lucide-react"

import { BrandLogo } from "../../components/BrandLogo"
import { FeatureItem } from "../../components/FeatureItem"
import { LoginForm } from "../../components/LoginForm"

export function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f8faf9]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(16,155,97,0.10),transparent_35%)]" />

          <div className="relative z-10">
            <BrandLogo />
          </div>

          <div className="relative z-10 my-auto max-w-2xl">
            <h1 className="max-w-xl text-6xl font-semibold leading-[1.02] tracking-[-0.04em] text-neutral-950">
              Sua saúde,
              <br />

              com inteligência
              <br />

              <span className="text-[var(--nw-green)]">
                ao seu lado.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-7 text-neutral-500">
              O NutriWarrior une acompanhamento nutricional, tecnologia e
              inteligência artificial para tornar sua rotina mais simples,
              clara e personalizada.
            </p>

            <div className="mt-10 grid gap-6">
              <FeatureItem
                icon={Bot}
                title="Assistente de IA"
                description="Registre refeições, água e peso usando linguagem natural."
              />

              <FeatureItem
                icon={ChartNoAxesCombined}
                title="Acompanhe seu progresso"
                description="Visualize sua evolução e seus principais indicadores."
              />

              <FeatureItem
                icon={Target}
                title="Metas sob controle"
                description="Organize seus objetivos nutricionais em um só lugar."
              />

              <FeatureItem
                icon={ShieldCheck}
                title="Mais saúde, mais disciplina"
                description="Informações claras para apoiar decisões melhores no dia a dia."
              />
            </div>
          </div>

          <div className="relative z-10 flex gap-4 text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
            <span>Tecnologia</span>
            <span>•</span>
            <span>Nutrição</span>
            <span>•</span>
            <span>Resultados</span>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:bg-transparent">
          <LoginForm />
        </section>

      </div>
    </main>
  )
}