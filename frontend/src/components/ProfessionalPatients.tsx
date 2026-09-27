import {
  ChevronRight,
  Search,
  UserPlus,
  Users,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  getMyPatients,
  type Patient,
} from "../services/patients"

export function ProfessionalPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await getMyPatients()

        setPatients(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os pacientes.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadPatients()
  }, [])

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return patients
    }

    return patients.filter((patient) => {
      return (
        patient.nome.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term)
      )
    })
  }, [patients, search])

  if (loading) {
    return (
      <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">
          Carregando pacientes...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h3 className="text-lg font-semibold">
            Seus pacientes
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {patients.length === 0
              ? "Nenhum paciente cadastrado ainda."
              : `${patients.length} paciente${
                  patients.length === 1 ? "" : "s"
                } na sua carteira.`}
          </p>
        </div>

        <div className="flex gap-3">

          <div className="flex h-11 items-center gap-2 rounded-2xl border border-neutral-200 px-4">
            <Search
              size={17}
              className="text-neutral-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar paciente"
              className="w-44 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>

          <button className="flex h-11 items-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800">
            <UserPlus size={17} />
            Novo
          </button>

        </div>
      </div>

      {patients.length === 0 ? (
        <div className="mt-8 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Users
              size={21}
              className="text-neutral-500"
            />
          </div>

          <h4 className="mt-4 font-semibold">
            Sua carteira está vazia
          </h4>

          <p className="mt-1 max-w-sm text-center text-sm text-neutral-500">
            Cadastre seu primeiro paciente para começar o
            acompanhamento no NutriWarrior.
          </p>

        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">

          <table className="w-full min-w-[650px] text-left">

            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">

                <th className="pb-4 font-medium">
                  Paciente
                </th>

                <th className="pb-4 font-medium">
                  E-mail
                </th>

                <th className="pb-4 font-medium">
                  Cliente
                </th>

                <th className="pb-4" />

              </tr>
            </thead>

            <tbody>
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-neutral-100 last:border-none"
                >
                  <td className="py-5">
                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold">
                        {patient.nome
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>

                      <p className="text-sm font-semibold">
                        {patient.nome}
                      </p>

                    </div>
                  </td>

                  <td className="py-5 text-sm text-neutral-500">
                    {patient.email}
                  </td>

                  <td className="py-5">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {patient.clienteId
                        ? `#${patient.clienteId}`
                        : "Vinculado"}
                    </span>
                  </td>

                  <td className="py-5 text-right">
                    <button className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950">
                      <ChevronRight size={18} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

          {filteredPatients.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-500">
              Nenhum paciente encontrado.
            </p>
          )}

        </div>
      )}
    </div>
  )
}