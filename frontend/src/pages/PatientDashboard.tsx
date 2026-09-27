export function PatientDashboard() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8faf9]">
      <div className="text-center">
        <span className="text-sm font-medium text-[var(--nw-green)]">
          NutriWarrior
        </span>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Painel do Paciente
        </h1>

        <p className="mt-3 text-neutral-500">
          Seu acompanhamento começa aqui.
        </p>
      </div>
    </main>
  )
}