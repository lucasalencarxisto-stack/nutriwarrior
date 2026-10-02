import { PatientSections } from "../components/PatientSections"
import {

    ArrowLeft,

    Mail,

    Phone,

} from "lucide-react"



import {

    useEffect,

    useState,

} from "react"



import {

    useNavigate,

    useParams,

} from "react-router-dom"



import whatsappIcon from "../assets/whatsapp_icone.png"



import {

    PatientEvolutionPreview,

    type EvolutionMetric,

} from "../components/PatientEvolutionPreview"



import {

    getPatientById,

    type Patient,

} from "../services/patients"



import {

    getPatientDays,

    type DayRecord,

} from "../services/days"



import {

    getNutritionalGoals,

    getNutritionSummaries,

    type NutritionalGoals,

    type NutritionSummary,

} from "../services/nutrition"





function getInitials(

    name?: string,

) {

    if (!name) {

        return "NW"

    }



    return name

        .trim()

        .split(/\s+/)

        .slice(0, 2)

        .map(

            (part) =>

                part[0],

        )

        .join("")

        .toUpperCase()

}





function formatPhone(

    phone: string,

) {

    let digits =

        phone.replace(

            /\D/g,

            "",

        )



    if (

        digits.startsWith(

            "55",

        )

    ) {

        digits =

            digits.slice(2)

    }



    if (

        digits.length === 11

    ) {

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`

    }



    if (

        digits.length === 10

    ) {

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

    }



    return phone

}





function getWhatsAppLink(

    phone: string,

) {

    const digits =

        phone.replace(

            /\D/g,

            "",

        )



    return `https\://wa.me/${digits}`

}





function calculateAge(

    dataNascimento?:

        | string

        | null,

): number | null {



    if (!dataNascimento) {

        return null

    }



    const match =

        /^(\d{4})-(\d{2})-(\d{2})/.exec(

            dataNascimento,

        )



    if (!match) {

        return null

    }



    const year =

        Number(match[1])



    const month =

        Number(match[2])



    const day =

        Number(match[3])



    const birthDate =

        new Date(0)



    birthDate.setFullYear(

        year,

        month - 1,

        day,

    )





    if (

        birthDate.getFullYear() !==

        year ||

        birthDate.getMonth() !==

        month - 1 ||

        birthDate.getDate() !==

        day

    ) {

        return null

    }





    const today =

        new Date()



    let age =

        today.getFullYear() -

        year





    if (

        today.getMonth() <

        month - 1 ||

        (

            today.getMonth() ===

            month - 1 &&

            today.getDate() <

            day

        )

    ) {

        age -= 1

    }





    return age >= 0

        ? age

        : null

}





function formatMetric(

    value: number,

) {

    return new Intl.NumberFormat(

        "pt-BR",

        {

            minimumFractionDigits: 1,

            maximumFractionDigits: 1,

        },

    ).format(value)

}





function formatHeight(

    alturaCm?:

        | number

        | null,

) {



    if (

        alturaCm == null ||

        !Number.isFinite(

            alturaCm,

        ) ||

        alturaCm <= 0

    ) {

        return "—"

    }





    const height =

        new Intl.NumberFormat(

            "pt-BR",

            {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2,

            },

        ).format(

            alturaCm / 100,

        )





    return `${height} m`

}





function getBmiStatus(
    bmi: number | null,
    age: number | null,
) {
    if (
        bmi == null ||
        age == null ||
        age < 18
    ) {
        return null
    }

    if (bmi < 18.5) {
        return {
            label: "Abaixo da faixa",
            symbol: "↓",
            valueClass: "text-violet-700",
            badgeClass: "bg-violet-50 text-violet-700 ring-violet-100",
        }
    }

    if (bmi < 25) {
        return {
            label: "Faixa adequada",
            symbol: "✓",
            valueClass: "text-emerald-700",
            badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        }
    }

    if (bmi < 30) {
        return {
            label: "Acima da faixa",
            symbol: "↑",
            valueClass: "text-amber-700",
            badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
        }
    }

    return {
        label: "Elevado",
        symbol: "!",
        valueClass: "text-red-700",
        badgeClass: "bg-red-50 text-red-700 ring-red-100",
    }
}


export function PatientDetailsPage() {



    const navigate =

        useNavigate()



    const { clienteId } =

        useParams()



    const [

        showEvolutionSummary,

        setShowEvolutionSummary,

    ] = useState(false)



    const [

        dayRecords,

        setDayRecords,

    ] =

        useState<DayRecord[]>([])





    const [

        summaries,

        setSummaries,

    ] =

        useState<

            NutritionSummary[]

        >([])





    const [

        goals,

        setGoals,

    ] =

        useState<

            NutritionalGoals | null

        >(null)





    const [

        evolutionMetric,

        setEvolutionMetric,

    ] =

        useState<EvolutionMetric>(

            "peso",

        )





    const [

        patient,

        setPatient,

    ] =

        useState<Patient | null>(

            null,

        )





    const [

        loading,

        setLoading,

    ] =

        useState(true)





    const [

        error,

        setError,

    ] =

        useState<string | null>(

            null,

        )





    const latestWeightRecord =

        dayRecords

            .filter(

                (record) =>

                    record.pesoKg != null &&

                    Number.isFinite(

                        Number(

                            record.pesoKg,

                        ),

                    ) &&

                    Number(

                        record.pesoKg,

                    ) > 0,

            )

            .sort(

                (a, b) =>

                    a.data.localeCompare(

                        b.data,

                    ),

            )

            .at(-1)





    const currentWeightKg =

        latestWeightRecord?.pesoKg !=

            null

            ? Number(

                latestWeightRecord.pesoKg,

            )

            : null





    const heightMeters =

        patient?.alturaCm != null &&

            Number.isFinite(

                patient.alturaCm,

            ) &&

            patient.alturaCm > 0

            ? patient.alturaCm /

            100

            : null





    const bodyMassIndex =

        currentWeightKg != null &&

            heightMeters != null

            ? currentWeightKg /

            (

                heightMeters **

                2

            )

            : null





    const age =

        calculateAge(

            patient?.dataNascimento,

        )

    const bmiStatus =
        getBmiStatus(
            bodyMassIndex,
            age,
        )


    function selectEvolutionMetric(
        metric: EvolutionMetric,
    ) {
        const sameMetric =
            evolutionMetric === metric

        setEvolutionMetric(
            metric,
        )

        setShowEvolutionSummary(
            (current) =>
                sameMetric
                    ? !current
                    : true,
        )

        requestAnimationFrame(
            () => {
                document
                    .getElementById(
                        "patient-evolution",
                    )
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    })
            },
        )
    }

    useEffect(

        () => {



            async function loadPatient() {



                const id =

                    Number(clienteId)





                if (

                    !Number.isInteger(

                        id,

                    )

                ) {

                    setError(

                        "Paciente inválido.",

                    )



                    setLoading(false)

                    return

                }



                setShowEvolutionSummary(

                    false,

                )





                try {

                    setLoading(true)

                    setError(null)





                    const [

                        patientResponse,

                        daysResponse,

                    ] =

                        await Promise.all([

                            getPatientById(

                                id,

                            ),



                            getPatientDays(

                                id,

                            ),

                        ])





                    setPatient(

                        patientResponse,

                    )



                    setDayRecords(

                        daysResponse,

                    )





                    const [

                        goalsResult,

                        summaryResult,

                    ] =

                        await Promise.all([

                            getNutritionalGoals(

                                id,

                            ).catch(

                                () =>

                                    null,

                            ),



                            getNutritionSummaries(

                                id,

                                daysResponse.map(

                                    (day) =>

                                        day.data,

                                ),

                            ),

                        ])





                    setGoals(

                        goalsResult,

                    )



                    setSummaries(

                        summaryResult,

                    )





                } catch (err) {



                    setError(

                        err instanceof Error

                            ? err.message

                            : "Não foi possível carregar o paciente.",

                    )



                } finally {



                    setLoading(false)



                }

            }





            loadPatient()



        },

        [

            clienteId,

        ],

    )





    if (loading) {

        return (

            <div className="flex min-h-screen items-center justify-center bg-[#f8faf9]">



                <p className="text-sm text-neutral-500">

                    Carregando paciente...

                </p>



            </div>

        )

    }





    if (

        error ||

        !patient

    ) {

        return (

            <div className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-6">



                <div className="max-w-md rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-sm">



                    <p className="font-semibold text-neutral-950">

                        Não foi possível abrir este paciente

                    </p>



                    <p className="mt-2 text-sm text-neutral-500">

                        {error}

                    </p>



                    <button

                        type="button"

                        onClick={() =>

                            navigate(

                                "/professional",

                            )

                        }

                        className="mt-6 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"

                    >

                        Voltar ao painel

                    </button>



                </div>



            </div>

        )

    }





    return (

        <div className="min-h-screen bg-[#f8faf9] text-neutral-950">



            <header className="border-b border-neutral-200 bg-white">



                <div className="mx-auto flex h-20 max-w-[1280px] items-center px-6 lg:px-10">



                    <button

                        type="button"

                        onClick={() =>

                            navigate(

                                "/professional",

                            )

                        }

                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"

                    >

                        <ArrowLeft

                            size={18}

                        />



                        Voltar

                    </button>



                </div>



            </header>





            <main className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">



                <div className="rounded-[30px] border border-neutral-200 bg-white p-7 shadow-sm lg:p-9">



                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">



                        <div className="flex items-center gap-5">



                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xl font-semibold text-white">



                                {getInitials(

                                    patient.nome,

                                )}



                            </div>





                            <div>



                                <div className="flex items-center gap-3">



                                    <h1 className="text-2xl font-semibold tracking-tight">

                                        {patient.nome}

                                    </h1>



                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                                        Vinculado

                                    </span>



                                </div>





                                <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-500">



                                    <div className="flex items-center gap-2">



                                        <Mail

                                            size={16}

                                        />



                                        {patient.email}



                                    </div>





                                    {patient.telefone ? (



                                        <div className="flex items-center gap-3">



                                            <div className="flex items-center gap-2">



                                                <Phone

                                                    size={16}

                                                />



                                                {formatPhone(

                                                    patient.telefone,

                                                )}



                                            </div>





                                            <a

                                                href={getWhatsAppLink(

                                                    patient.telefone,

                                                )}

                                                target="_blank"

                                                rel="noreferrer"

                                                title="Abrir conversa no WhatsApp"

                                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100 transition hover:bg-emerald-50"

                                            >



                                                <img

                                                    src={

                                                        whatsappIcon

                                                    }

                                                    alt=""

                                                    className="h-5 w-5 object-contain"

                                                />



                                            </a>



                                        </div>



                                    ) : (



                                        <div className="flex items-center gap-2">



                                            <Phone

                                                size={16}

                                            />



                                            Telefone não informado



                                        </div>



                                    )}



                                </div>



                            </div>



                        </div>





                        <div className="grid grid-cols-2 gap-3">



                            <div className="min-w-32 rounded-2xl bg-neutral-50 px-5 py-4">



                                <p className="text-xs uppercase tracking-wide text-neutral-400">

                                    Usuário

                                </p>



                                <p className="mt-1 font-semibold">

                                    #{patient.id}

                                </p>



                            </div>





                            <div className="min-w-32 rounded-2xl bg-neutral-50 px-5 py-4">



                                <p className="text-xs uppercase tracking-wide text-neutral-400">

                                    Cliente

                                </p>



                                <p className="mt-1 font-semibold">

                                    #{patient.clienteId ??

                                        "—"}

                                </p>



                            </div>



                        </div>



                    </div>



                </div>





                <PatientSections clienteId={Number(clienteId)} summaries={summaries} key={clienteId} age={age} records={dayRecords} heightCm={patient.alturaCm} currentWeight={currentWeightKg} bmi={bodyMassIndex}>
                <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">



                    <button

                        type="button"

                        onClick={() =>

                            selectEvolutionMetric(

                                "peso",

                            )

                        }

                        className="rounded-[28px] border border-neutral-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"

                    >



                        <p className="text-sm text-neutral-500">

                            Peso atual

                        </p>



                        <p className="mt-3 text-2xl font-semibold">

                            {currentWeightKg ==

                                null

                                ? "—"

                                : `${formatMetric(

                                    currentWeightKg,

                                )} kg`}

                        </p>



                        <p className="mt-2 text-xs font-medium text-emerald-600">

                            Ver evolução

                        </p>



                    </button>





                    <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">



                        <p className="text-sm text-neutral-500">

                            Altura

                        </p>



                        <p className="mt-3 text-2xl font-semibold">

                            {formatHeight(

                                patient.alturaCm,

                            )}

                        </p>



                    </div>





                    <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">



                        <p className="text-sm text-neutral-500">

                            Idade

                        </p>



                        <p className="mt-3 text-2xl font-semibold">



                            {age == null

                                ? "—"

                                : `${age} ${age === 1

                                    ? "ano"

                                    : "anos"

                                }`}



                        </p>



                    </div>





                    <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">

                        <p className="text-sm text-neutral-500">
                            IMC
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">

                            <p
                                className={`text-2xl font-semibold ${bmiStatus
                                    ? bmiStatus.valueClass
                                    : "text-neutral-950"
                                    }`}
                            >
                                {bodyMassIndex == null
                                    ? "—"
                                    : formatMetric(bodyMassIndex)}
                            </p>

                            {bmiStatus && (
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${bmiStatus.badgeClass}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="font-bold"
                                    >
                                        {bmiStatus.symbol}
                                    </span>

                                    {bmiStatus.label}
                                </span>
                            )}

                        </div>

                    </div>



                </section>





                <div

                    id="patient-evolution"

                    className="scroll-mt-6"

                >



                    <PatientEvolutionPreview

                        records={

                            dayRecords

                        }

                        summaries={

                            summaries

                        }

                        goals={

                            goals

                        }

                        metric={

                            evolutionMetric

                        }

                        onMetricChange={

                            setEvolutionMetric

                        }

                        showSummary={

                            showEvolutionSummary

                        }

                    />



                </div>



                </PatientSections>
            </main>



        </div>

    )

}