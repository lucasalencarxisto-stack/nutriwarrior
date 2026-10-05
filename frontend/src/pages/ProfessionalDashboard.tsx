import { FollowUpPanel } from "../components/FollowUpPanel"
import { AgendaOverview } from "../components/AgendaOverview"
import { AssistantPanel } from "../components/AssistantPanel"
import { NotificationBell } from "../components/NotificationBell"
import { NewPatientModal } from "../components/NewPatientModal"
import { useNavigate } from "react-router-dom"
import whatsappIcon from "../assets/whatsapp_icone.png"
import { DeletePatientModal } from "../components/DeletePatientModal"

import {
    Activity,
    Bot,
    ChevronRight,
    CircleAlert,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Pencil,
    Search,
    Settings,
    TrendingUp,
    UserPlus,
    Users,
    Trash2,
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
    telefone?: string

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
    telefone: string | null
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

    const telefone =
        patient.telefone ??
        null

    return {
        id,
        nome,
        email,
        telefone,
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

function formatPhone(phone: string) {
    let digits = phone.replace(/\D/g, "")

    if (digits.startsWith("55")) {
        digits = digits.slice(2)
    }

    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }

    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }

    return phone
}

function getWhatsAppLink(phone: string) {
    const digits =
        phone.replace(/\D/g, "")

    return `https://wa.me/${digits}`
}

export function ProfessionalDashboard() {
    const navigate = useNavigate()

    const [newPatientModalOpen, setNewPatientModalOpen] =
        useState(false)

    const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null)

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

    const [patientToDelete, setPatientToDelete] =
        useState<Patient | null>(null)

    const [assistantPatientId, setAssistantPatientId] =
        useState<number | null>(null)


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

    const assistantPatients = useMemo(
        () => patients.filter((patient) => patient.clienteId !== null),
        [patients],
    )

    useEffect(() => {
        if (assistantPatients.length === 0) {
            setAssistantPatientId(null)
            return
        }

        const currentStillExists = assistantPatients.some(
            (patient) => patient.clienteId === assistantPatientId,
        )

        if (!currentStillExists) {
            setAssistantPatientId(assistantPatients[0].clienteId)
        }
    }, [assistantPatients, assistantPatientId])

    const assistantPatient =
        assistantPatients.find(
            (patient) => patient.clienteId === assistantPatientId,
        ) ?? assistantPatients[0] ?? null


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

                        <button
                            type="button"
                            onClick={() => navigate("/professional/insights")}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
                        >
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

                        <NotificationBell />


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

                                        <table className="w-full min-w-[850px] text-left">

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
                                                        Contato
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

                                                                {patient.telefone ? (

                                                                    <div className="flex items-center gap-3">

                                                                        <span className="whitespace-nowrap text-sm text-neutral-500">
                                                                            {formatPhone(
                                                                                patient.telefone,
                                                                            )}
                                                                        </span>

                                                                        <a
                                                                            href={getWhatsAppLink(
                                                                                patient.telefone,
                                                                            )}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            aria-label={`Abrir WhatsApp de ${patient.nome}`}
                                                                            title={`Conversar com ${patient.nome} pelo WhatsApp`}
                                                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white transition hover:bg-emerald-50"
                                                                        >
                                                                            <img
                                                                                src={whatsappIcon}
                                                                                alt=""
                                                                                className="h-5 w-5 object-contain"
                                                                            />
                                                                        </a>
                                                                    </div>

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

                                                                <div className="flex items-center justify-end gap-1">

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (patient.clienteId) {
                                                                                navigate(
                                                                                    `/professional/patients/${patient.clienteId}`,
                                                                                )
                                                                            }
                                                                        }}
                                                                        disabled={!patient.clienteId}
                                                                        className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-30"
                                                                        aria-label={`Abrir ${patient.nome}`}
                                                                        title="Abrir ficha do paciente"
                                                                    >
                                                                        <ChevronRight size={18} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950"
                                                                        onClick={() => setPatientToEdit(patient)}
                                                                        disabled={!patient.clienteId}
                                                                        aria-label={`Editar ${patient.nome}`}
                                                                        title="Editar paciente"
                                                                    >
                                                                        <Pencil size={18} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPatientToDelete(patient)
                                                                        }
                                                                        disabled={!patient.clienteId}
                                                                        className="rounded-xl p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                                                        aria-label={`Deletar ${patient.nome}`}
                                                                        title="Deletar paciente"
                                                                    >
                                                                        <Trash2 size={17} />
                                                                    </button>
                                                                </div>

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


                        <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                                        Assistente clínico
                                    </p>
                                    <p className="mt-1 text-sm text-neutral-500">
                                        Consulte e atualize os registros de um paciente sem sair da visão geral.
                                    </p>
                                </div>

                                {assistantPatients.length > 1 && (
                                    <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                                        Paciente
                                        <select
                                            value={assistantPatient?.clienteId ?? ""}
                                            onChange={(event) =>
                                                setAssistantPatientId(
                                                    Number(event.target.value),
                                                )
                                            }
                                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 outline-none focus:border-emerald-300"
                                        >
                                            {assistantPatients.map((patient) => (
                                                <option
                                                    key={patient.id}
                                                    value={patient.clienteId ?? ""}
                                                >
                                                    {patient.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                            </div>

                            {assistantPatient?.clienteId ? (
                                <AssistantPanel
                                    key={assistantPatient.clienteId}
                                    clienteId={assistantPatient.clienteId}
                                    patientName={assistantPatient.nome}
                                    variant="compact"
                                />
                            ) : (
                                <div className="flex min-h-[560px] items-center justify-center rounded-[28px] border border-dashed border-neutral-200 bg-white px-6 text-center shadow-sm">
                                    <div>
                                        <Bot
                                            size={28}
                                            className="mx-auto text-neutral-300"
                                        />
                                        <p className="mt-4 font-semibold">
                                            Assistente aguardando paciente
                                        </p>
                                        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                                            Vincule um paciente com ficha ativa para usar o NutriWarrior Assistant nesta tela.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </section>

                </div>

                <AgendaOverview />
                <FollowUpPanel />
            </main>

            {(newPatientModalOpen || patientToEdit !== null) && <NewPatientModal
                key={patientToEdit?.clienteId ?? "new"}
                open
                patient={patientToEdit ?? undefined}
                onClose={() => {
                    setNewPatientModalOpen(false)
                    setPatientToEdit(null)
                }}
                onCreated={loadPatients}
            />}

            <DeletePatientModal
                open={patientToDelete !== null}
                patientName={
                    patientToDelete?.nome ?? ""
                }
                clienteId={
                    patientToDelete?.clienteId ?? null
                }
                onClose={() =>
                    setPatientToDelete(null)
                }
                onDeleted={async () => {
                    await loadPatients()
                    setPatientToDelete(null)
                }}
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
