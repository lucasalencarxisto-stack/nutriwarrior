import { NewPatientModal } from "../components/NewPatientModal"

import {
    Activity,
    Bell,
    Bot,
    ChevronRight,
    CircleAlert,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Search,
    Settings,
    TrendingUp,
    UserPlus,
    Users,
} from "lucide-react"

import {
    useEffect,
    useMemo,
    useState,
} from "react"

import { BrandLogo } from "../components/BrandLogo"

import {
    getCurrentDate,
    getGreeting,
} from "../utils/date"

import { getMe } from "../services/auth"
import { apiFetch } from "../services/api"


type ProfessionalUser = {
    id: number
    nome: string
    email: string
    role: "NUTRICIONISTA"
    clienteId: null
}


type PatientApiItem = {
    id?: number
    clienteId?: number
    usuarioId?: number

    nome?: string
    name?: string
    email?: string

    usuario?: {
        id?: number
        nome?: string
        email?: string
    }
}


type Patient = {
    id: number
    nome: string
    email: string
    clienteId: number | null
    usuarioId: number | null
}


function normalizePatient(
    patient: PatientApiItem,
    index: number,
): Patient {
    const usuarioId =
        patient.usuarioId ??
        patient.usuario?.id ??
        null

    const clienteId =
        patient.clienteId ??
        null

    const id =
        patient.id ??
        usuarioId ??
        clienteId ??
        index + 1

    const nome =
        patient.nome ??
        patient.name ??
        patient.usuario?.nome ??
        `Paciente ${index + 1}`

    const email =
        patient.email ??
        patient.usuario?.email ??
        "E-mail não informado"

    return {
        id,
        nome,
        email,
        clienteId,
        usuarioId,
    }
}


function getInitials(name?: string) {
    if (!name) {
        return "NW"
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
}


export function ProfessionalDashboard() {
    const [newPatientModalOpen, setNewPatientModalOpen] =
        useState(false)

    const [user, setUser] =
        useState<ProfessionalUser | null>(null)

    const [patients, setPatients] =
        useState<Patient[]>([])

    const [search, setSearch] =
        useState("")

    const [loadingPatients, setLoadingPatients] =
        useState(true)

    const [patientsError, setPatientsError] =
        useState<string | null>(null)


        async function loadPatients() {
            try {
                setLoadingPatients(true)
                setPatientsError(null)

                const response = await apiFetch(
                    "/nutricionistas/me/pacientes",
                )

                const list: PatientApiItem[] =
                    Array.isArray(response)
                        ? response
                        : []

                if (import.meta.env.DEV) {
                    console.log(
                        "Pacientes recebidos da API:",
                        list,
                    )
                }

                setPatients(
                    list.map(
                        (patient, index) =>
                            normalizePatient(
                                patient,
                                index,
                            ),
                    ),
                )
            } catch (error) {
                console.error(
                    "Erro ao carregar pacientes:",
                    error,
                )

                setPatientsError(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar os pacientes.",
                )
            } finally {
                setLoadingPatients(false)
            }
        }


        useEffect(() => {
            async function loadDashboard() {
                try {
                    const me = await getMe()

                    setUser(me)
                } catch (error) {
                    console.error(
                        "Erro ao carregar usuário:",
                        error,
                    )
                }

                await loadPatients()
            }

            loadDashboard()
        }, [])


        const filteredPatients =
            useMemo(() => {
                const term =
                    search
                        .trim()
                        .toLowerCase()

                if (!term) {
                    return patients
                }

                return patients.filter(
                    (patient) =>
                        patient.nome
                            .toLowerCase()
                            .includes(term) ||
                        patient.email
                            .toLowerCase()
                            .includes(term),
                )
            }, [
                patients,
                search,
            ])


        return (
            <div className="min-h-screen bg-[#f8faf9] text-neutral-950">

                <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white lg:flex lg:flex-col">

                    <div className="px-7 py-7">
                        <BrandLogo />
                    </div>

                    <nav className="mt-4 flex-1 px-4">

                        <div className="space-y-2">

                            <button className="flex w-full items-center gap-3 rounded-2xl bg-neutral-950 px-4 py-3 text-left text-sm font-medium text-white">
                                <LayoutDashboard size={19} />
                                Visão geral
                            </button>

                            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
                                <Users size={19} />
                                Pacientes
                            </button>

                            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
                                <ClipboardList size={19} />
                                Relatórios
                            </button>

                            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
                                <Bot size={19} />
                                Insights de IA
                            </button>

                        </div>

                        <div className="my-6 border-t border-neutral-200" />

                        <div className="space-y-2">

                            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
                                <Settings size={19} />
                                Configurações
                            </button>

                        </div>

                    </nav>

                    <div className="border-t border-neutral-200 p-4">

                        <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950">
                            <LogOut size={19} />
                            Sair
                        </button>

                    </div>

                </aside>


                <main className="lg:ml-64">

                    <header className="flex h-20 items-center justify-between border-b border-neutral-200 bg-white px-6 lg:px-10">

                        <div>

                            <p className="text-sm text-neutral-500">
                                NutriWarrior Professional
                            </p>

                            <h1 className="text-xl font-semibold tracking-tight">
                                Painel do Nutricionista
                            </h1>

                        </div>


                        <div className="flex items-center gap-4">

                            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50">

                                <Bell size={18} />

                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--nw-green)]" />

                            </button>


                            <div className="hidden text-right sm:block">

                                <p className="text-sm font-semibold">
                                    {user?.nome ?? "Nutricionista"}
                                </p>

                                <p className="text-xs text-neutral-500">
                                    Plano Professional
                                </p>

                            </div>


                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
                                {getInitials(user?.nome)}
                            </div>

                        </div>

                    </header>


                    <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">

                        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

                            <div>

                                <p className="text-sm font-medium text-[var(--nw-green)]">
                                    {getCurrentDate()}
                                </p>

                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                    {getGreeting()}, Dr.{" "}
                                    {user?.nome ?? "Nutricionista"}.
                                </h2>

                                <p className="mt-2 text-neutral-500">
                                    Aqui está o panorama dos seus pacientes hoje.
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setNewPatientModalOpen(true)
                                }
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                            >
                                <UserPlus size={18} />
                                Novo paciente
                            </button>

                        </section>

                        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                            <MetricCard
                                icon={Users}
                                label="Pacientes ativos"
                                value={
                                    loadingPatients
                                        ? "..."
                                        : String(patients.length)
                                }
                                detail="vinculados à sua conta"
                            />

                            <MetricCard 
                                icon={TrendingUp}
                                label="Adesão média"
                                value="—"
                                detail="aguardando dados de adesão"
                            />

                            <MetricCard
                                icon={Activity}
                                label="Registros hoje"
                                value="—"
                                detail="integração com registros"
                            />

                            <MetricCard
                                icon={CircleAlert}
                                label="Precisam de atenção"
                                value="—"
                                detail="aguardando análise"
                                alert
                            />

                        </section>


                        <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">

                            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">

                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                                    <div>

                                        <h3 className="text-lg font-semibold">
                                            Seus pacientes
                                        </h3>

                                        <p className="mt-1 text-sm text-neutral-500">

                                            {loadingPatients
                                                ? "Carregando sua carteira..."
                                                : patients.length === 0
                                                    ? "Nenhum paciente vinculado a esta conta."
                                                    : `${patients.length} ${patients.length === 1
                                                        ? "paciente vinculado"
                                                        : "pacientes vinculados"
                                                    }.`}

                                        </p>

                                    </div>


                                    <div className="flex h-11 items-center gap-2 rounded-2xl border border-neutral-200 px-4">

                                        <Search
                                            size={17}
                                            className="text-neutral-400"
                                        />

                                        <input
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Buscar paciente"
                                            className="w-44 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                                        />

                                    </div>

                                </div>


                                {loadingPatients && (

                                    <div className="flex min-h-[280px] items-center justify-center">

                                        <p className="text-sm text-neutral-500">
                                            Carregando pacientes...
                                        </p>

                                    </div>

                                )}


                                {!loadingPatients &&
                                    patientsError && (

                                        <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/30 px-6 text-center">

                                            <CircleAlert
                                                size={28}
                                                className="text-red-500"
                                            />

                                            <p className="mt-4 font-semibold text-red-700">
                                                Não foi possível carregar os pacientes
                                            </p>

                                            <p className="mt-2 text-sm text-red-600">
                                                {patientsError}
                                            </p>

                                        </div>

                                    )}


                                {!loadingPatients &&
                                    !patientsError &&
                                    patients.length === 0 && (

                                        <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">

                                                <Users
                                                    size={21}
                                                    className="text-neutral-500"
                                                />

                                            </div>

                                            <h4 className="mt-4 font-semibold">
                                                Sua carteira está vazia
                                            </h4>

                                            <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
                                                Ainda não existem pacientes vinculados a este
                                                nutricionista.
                                            </p>

                                            <button
                                                onClick={() =>
                                                    setNewPatientModalOpen(true)
                                                }
                                                className="mt-5 flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                                            >
                                                <UserPlus size={17} />
                                                Novo paciente
                                            </button>

                                        </div>

                                    )}


                                {!loadingPatients &&
                                    !patientsError &&
                                    patients.length > 0 && (

                                        <div className="mt-6 overflow-x-auto">

                                            <table className="w-full min-w-[700px] text-left">

                                                <thead>

                                                    <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">

                                                        <th className="pb-4 font-medium">
                                                            Paciente
                                                        </th>

                                                        <th className="pb-4 font-medium">
                                                            ID
                                                        </th>

                                                        <th className="pb-4 font-medium">
                                                            Cliente
                                                        </th>

                                                        <th className="pb-4 font-medium">
                                                            Status
                                                        </th>

                                                        <th className="pb-4" />

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {filteredPatients.map(
                                                        (patient) => (

                                                            <tr
                                                                key={`${patient.id}-${patient.email}`}
                                                                className="border-b border-neutral-100 last:border-none"
                                                            >

                                                                <td className="py-5">

                                                                    <div className="flex items-center gap-3">

                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold">

                                                                            {getInitials(
                                                                                patient.nome,
                                                                            )}

                                                                        </div>

                                                                        <div>

                                                                            <p className="text-sm font-semibold">
                                                                                {patient.nome}
                                                                            </p>

                                                                            <p className="mt-1 text-xs text-neutral-400">
                                                                                {patient.email}
                                                                            </p>

                                                                        </div>

                                                                    </div>

                                                                </td>


                                                                <td className="py-5 text-sm text-neutral-500">
                                                                    #{patient.id}
                                                                </td>


                                                                <td className="py-5">

                                                                    {patient.clienteId ? (

                                                                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                                                            #{patient.clienteId}
                                                                        </span>

                                                                    ) : (

                                                                        <span className="text-sm text-neutral-400">
                                                                            —
                                                                        </span>

                                                                    )}

                                                                </td>


                                                                <td className="py-5">

                                                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                                        Vinculado
                                                                    </span>

                                                                </td>


                                                                <td className="py-5 text-right">

                                                                    <button className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950">

                                                                        <ChevronRight size={18} />

                                                                    </button>

                                                                </td>

                                                            </tr>

                                                        ),
                                                    )}

                                                </tbody>

                                            </table>


                                            {filteredPatients.length === 0 && (

                                                <div className="py-12 text-center">

                                                    <p className="text-sm text-neutral-500">
                                                        Nenhum paciente encontrado para "{search}".
                                                    </p>

                                                </div>

                                            )}

                                        </div>

                                    )}


                                {patients.length > 0 && (

                                    <button className="mt-5 text-sm font-semibold text-[var(--nw-green)]">
                                        Ver todos os pacientes
                                    </button>

                                )}

                            </div>


                            <div className="space-y-6">

                                <div className="rounded-[28px] bg-neutral-950 p-6 text-white">

                                    <div className="flex items-center justify-between">

                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                                            <Bot size={21} />
                                        </div>

                                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                            IA ativa
                                        </span>

                                    </div>


                                    <h3 className="mt-6 text-xl font-semibold">
                                        Insights NutriWarrior
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-neutral-400">

                                        A inteligência do sistema analisará os registros
                                        dos pacientes para destacar padrões relevantes.

                                    </p>


                                    <div className="mt-6 space-y-3">

                                        <InsightItem 
                                            text={
                                                loadingPatients
                                                    ? "Carregando informações da carteira..."
                                                    : `${patients.length} ${patients.length === 1
                                                        ? "paciente está vinculado"
                                                        : "pacientes estão vinculados"
                                                    } a esta conta.`
                                            }
                                        />

                                        <InsightItem
                                            text="Os indicadores de adesão serão calculados a partir dos registros reais."
                                        />

                                        <InsightItem
                                            text="Alertas de hidratação, peso e refeições aparecerão aqui."
                                        />

                                    </div>


                                    <button className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-300">

                                        Ver todos os insights

                                        <ChevronRight size={16} />

                                    </button>

                                </div>


                                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">

                                            <CircleAlert size={19} />

                                        </div>


                                        <div>

                                            <h3 className="font-semibold">
                                                Atenção necessária
                                            </h3>

                                            <p className="text-sm text-neutral-500">
                                                Aguardando análise
                                            </p>

                                        </div>

                                    </div>


                                    <p className="mt-5 text-sm leading-6 text-neutral-500">

                                        Os alertas serão exibidos quando os dados de
                                        atividade e adesão estiverem integrados.

                                    </p>


                                    <button className="mt-5 flex items-center gap-2 text-sm font-semibold text-neutral-950">

                                        Revisar pacientes

                                        <ChevronRight size={16} />

                                    </button>

                                </div>

                            </div>

                        </section>

                    </div>

                </main>

                <NewPatientModal
                    open={newPatientModalOpen}
                    onClose={() =>
                        setNewPatientModalOpen(false)
                    }
                    onCreated={loadPatients}
                />
            </div>
        )
    }


type MetricCardProps = {
        icon: typeof Users
    label: string
    value: string
    detail: string
    alert?: boolean
    }


function MetricCard({
        icon: Icon,
        label,
        value,
        detail,
        alert = false,
    }: MetricCardProps) {
            return (
                <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${alert
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-[var(--nw-green)]"
                                }`}
                        >

                            <Icon size={20} />

                        </div>


                        <span className="text-xs text-neutral-400">
                            dados atuais
                        </span>

                    </div>


                    <p className="mt-5 text-sm text-neutral-500">
                        {label}
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                        {value}
                    </p>

                    <p className="mt-2 text-xs text-neutral-400">
                        {detail}
                    </p>

                </div>
            )
        }


function InsightItem({
            text,
        }: {
            text: string
        }) {
            return (
                <div className="rounded-2xl bg-white/5 px-4 py-3">

                    <p className="text-sm leading-5 text-neutral-300">
                        {text}
                    </p>

                </div>
            )
        }