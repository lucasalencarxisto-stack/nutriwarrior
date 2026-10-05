import {

  useState,

} from "react"



import type {

  DayRecord,

} from "../services/days"



import type {

  NutritionalGoals,

  NutritionSummary,

} from "../services/nutrition"





export type EvolutionMetric =

  | "peso"

  | "hidratacao"

  | "calorias"

  | "macronutrientes"





type Period =

  | 7

  | 30

  | 90





type PatientEvolutionPreviewProps = {

  records: DayRecord[]



  summaries?: NutritionSummary[]



  goals?:

  | NutritionalGoals

  | null



  metric?: EvolutionMetric



  onMetricChange?: (

    metric: EvolutionMetric,

  ) => void


  showSummary?: boolean
}





type ScalarPoint = {

  data: string

  value: number

}





type MacroPoint = {

  data: string

  proteinas: number

  carboidratos: number

  gorduras: number

}





function toNumber(

  value:

    | number

    | null

    | undefined,

): number | null {



  if (

    value === null ||

    value === undefined

  ) {

    return null

  }



  const number =

    Number(value)



  return Number.isFinite(

    number,

  )

    ? number

    : null

}





function formatNumber(

  value: number,

  metric: EvolutionMetric,

) {

  return new Intl.NumberFormat(

    "pt-BR",

    {

      minimumFractionDigits:

        metric === "peso"

          ? 1

          : 0,



      maximumFractionDigits:

        metric === "peso"

          ? 1

          : 0,

    },

  ).format(value)

}





function formatDateLabel(

  value: string,

) {

  const [, month, day] =

    value.split("-")



  return `${day}/${month}`

}





function createLinePath(

  points: {

    x: number

    y: number

  }[],

) {

  return points

    .map(

      (

        point,

        index,

      ) =>

        `${index === 0

          ? "M"

          : "L"

        } ${point.x} ${point.y}`,

    )

    .join(" ")

}





export function PatientEvolutionPreview({

  records,

  summaries = [],

  goals = null,

  metric,

  onMetricChange,

  showSummary = false,

}: PatientEvolutionPreviewProps) {



  const [

    internalMetric,

    setInternalMetric,

  ] =

    useState<EvolutionMetric>(

      "peso",

    )





  const selectedMetric =

    metric ??

    internalMetric





  const [

    period,

    setPeriod,

  ] =

    useState<Period>(30)





  const [

    selectedPointData,

    setSelectedPointData,

  ] =

    useState<string | null>(

      null,

    )





  const [

    hoveredPointData,

    setHoveredPointData,

  ] =

    useState<string | null>(

      null,

    )





  function resetPointSelection() {

    setSelectedPointData(null)

    setHoveredPointData(null)

  }


  function changeMetric(

    nextMetric:

      EvolutionMetric,

  ) {

    resetPointSelection()



    if (

      onMetricChange

    ) {

      onMetricChange(

        nextMetric,

      )



      return

    }



    setInternalMetric(

      nextMetric,

    )

  }





  const weightData:

    ScalarPoint[] =

    records

      .filter(

        (record) =>

          record.pesoKg !==

          null,

      )

      .map(

        (record) => ({

          data:

            record.data,



          value:

            Number(

              record.pesoKg,

            ),

        }),

      )

      .sort(

        (a, b) =>

          a.data.localeCompare(

            b.data,

          ),

      )





  const hydrationData:

    ScalarPoint[] =

    records

      .filter(

        (record) =>

          record.aguaMl !==

          null,

      )

      .map(

        (record) => ({

          data:

            record.data,



          value:

            Number(

              record.aguaMl,

            ),

        }),

      )

      .sort(

        (a, b) =>

          a.data.localeCompare(

            b.data,

          ),

      )





  const caloriesData:

    ScalarPoint[] =

    summaries
      .filter((summary) => summary.quantidadeItens > 0)

      .map(

        (summary) => ({

          data:

            summary.data,



          value:

            Number(

              summary.calorias,

            ),

        }),

      )

      .filter(

        (item) =>

          Number.isFinite(

            item.value,

          ),

      )

      .sort(

        (a, b) =>

          a.data.localeCompare(

            b.data,

          ),

      )





  const macroData:

    MacroPoint[] =

    summaries
      .filter((summary) => summary.quantidadeItens > 0)

      .map(

        (summary) => ({

          data:

            summary.data,



          proteinas:

            Number(

              summary.proteinasGramas,

            ),



          carboidratos:

            Number(

              summary.carboidratosGramas,

            ),



          gorduras:

            Number(

              summary.gordurasGramas,

            ),

        }),

      )

      .filter(

        (item) =>

          Number.isFinite(

            item.proteinas,

          ) &&

          Number.isFinite(

            item.carboidratos,

          ) &&

          Number.isFinite(

            item.gorduras,

          ),

      )

      .sort(

        (a, b) =>

          a.data.localeCompare(

            b.data,

          ),

      )





  const hasWeight =

    weightData.length > 0



  const hasHydration =

    hydrationData.length > 0

const allScalarData =

    selectedMetric ===

      "peso"

      ? weightData

      : selectedMetric ===

        "hidratacao"

        ? hydrationData

        : selectedMetric ===

          "calorias"

          ? caloriesData

          : []





  const dateSource =

    selectedMetric ===

      "macronutrientes"

      ? macroData.map(

        (item) =>

          item.data,

      )

      : allScalarData.map(

        (item) =>

          item.data,

      )





  const latestDate =

    dateSource.length > 0

      ? new Date(

        `${dateSource[

        dateSource.length -

        1

        ]

        }T12:00:00`,

      )

      : null





  const periodStart =

    latestDate

      ? new Date(

        latestDate,

      )

      : null





  if (periodStart) {

    periodStart.setDate(

      periodStart.getDate() -

      (

        period -

        1

      ),

    )

  }





  function isInsidePeriod(

    date: string,

  ) {

    if (!periodStart) {

      return false

    }



    const recordDate =

      new Date(

        `${date}T12:00:00`,

      )



    return (

      recordDate >=

      periodStart

    )

  }





  const activeScalarData =

    allScalarData.filter(

      (item) =>

        isInsidePeriod(

          item.data,

        ),

    )





  const activeMacroData =

    macroData.filter(

      (item) =>

        isInsidePeriod(

          item.data,

        ),

    )





  const hasData =

    selectedMetric ===

      "macronutrientes"

      ? activeMacroData.length >

      0

      : activeScalarData.length >

      0





  const unit =

    selectedMetric ===

      "peso"

      ? "kg"

      : selectedMetric ===

        "hidratacao"

        ? "ml"

        : selectedMetric ===

          "calorias"

          ? "kcal"

          : "g"





  const metricLabel =

    selectedMetric ===

      "peso"

      ? "Peso"

      : selectedMetric ===

        "hidratacao"

        ? "Hidratação"

        : selectedMetric ===

          "calorias"

          ? "Calorias"

          : "Macronutrientes"





  const lineColor =

    selectedMetric ===

      "peso"

      ? "#10b981"

      : selectedMetric ===

        "hidratacao"

        ? "#0d9488"

        : "#f59e0b"





  const goalColor =

    "#e5484d"



  const goalBadgeBackground =

    "#fff1f2"



  const proteinColor =

    "#10b981"



  const carbsColor =

    "#0ea5e9"



  const fatColor =

    "#f59e0b"





  const scalarValues =

    activeScalarData.map(

      (item) =>

        item.value,

    )





  const currentValue =

    scalarValues.at(-1) ??

    0





  const firstValue =

    scalarValues[0] ??

    0





  const variation =

    scalarValues.length > 0

      ? currentValue -

      firstValue

      : 0





  const average =

    scalarValues.length > 0

      ? scalarValues.reduce(

        (

          total,

          value,

        ) =>

          total + value,

        0,

      ) /

      scalarValues.length

      : 0





  const maximum =

    scalarValues.length > 0

      ? Math.max(

        ...scalarValues,

      )

      : 0





  const averageProtein =

    activeMacroData.length > 0

      ? activeMacroData.reduce(

        (

          total,

          item,

        ) =>

          total +

          item.proteinas,

        0,

      ) /

      activeMacroData.length

      : 0





  const averageCarbs =

    activeMacroData.length > 0

      ? activeMacroData.reduce(

        (

          total,

          item,

        ) =>

          total +

          item.carboidratos,

        0,

      ) /

      activeMacroData.length

      : 0





  const averageFat =

    activeMacroData.length > 0

      ? activeMacroData.reduce(

        (

          total,

          item,

        ) =>

          total +

          item.gorduras,

        0,

      ) /

      activeMacroData.length

      : 0

  const scalarGoal =
    selectedMetric ===
      "peso"
      ? toNumber(
        goals?.pesoAlvoKg,
      )
      : selectedMetric ===
        "hidratacao"
        ? toNumber(
          goals?.aguaMl,
        )
        : selectedMetric ===
          "calorias"
          ? toNumber(
            goals?.calorias,
          )
          : null

  const goalReached =
    selectedMetric === "peso" &&
    scalarGoal !== null &&
    currentValue <= scalarGoal

  const proteinGoal =

    toNumber(

      goals?.proteinasGramas,

    )



  const carbsGoal =

    toNumber(

      goals?.carboidratosGramas,

    )



  const fatGoal =

    toNumber(

      goals?.gordurasGramas,

    )





  const valuesForScale =

    selectedMetric ===

      "macronutrientes"

      ? [

        ...activeMacroData.flatMap(

          (item) => [

            item.proteinas,

            item.carboidratos,

            item.gorduras,

          ],

        ),



        ...[

          proteinGoal,

          carbsGoal,

          fatGoal,

        ].filter(

          (

            value,

          ): value is number =>

            value !== null,

        ),

      ]



      : [

        ...scalarValues,



        ...(

          scalarGoal !==

            null

            ? [

              scalarGoal,

            ]

            : []

        ),

      ]





  const minValue =

    valuesForScale.length >

      0

      ? Math.min(

        ...valuesForScale,

      )

      : 0





  const maxValue =

    valuesForScale.length >

      0

      ? Math.max(

        ...valuesForScale,

      )

      : 1





  const rawRange =

    maxValue -

    minValue





  const minimumPadding =

    selectedMetric ===

      "peso"

      ? 0.5

      : selectedMetric ===

        "hidratacao"

        ? 100

        : selectedMetric ===

          "calorias"

          ? 100

          : 10





  const padding =

    Math.max(

      rawRange * 0.2,

      minimumPadding,

    )





  const scaleMin =

    selectedMetric ===

      "peso"

      ? minValue -

      padding

      : Math.max(

        0,

        minValue -

        padding,

      )





  const scaleMax =

    maxValue +

    padding





  const scaleRange =

    Math.max(

      scaleMax -

      scaleMin,

      1,

    )





  const chartLeft = 90

  const chartRight = 850

  const chartTop = 40

  const chartBottom = 210





  const chartWidth =

    chartRight -

    chartLeft





  const chartHeight =

    chartBottom -

    chartTop





  function getX(

    index: number,

    length: number,

  ) {

    if (length <= 1) {

      return (

        chartLeft +

        chartWidth / 2

      )

    }



    return (

      chartLeft +

      (

        index /

        (

          length -

          1

        )

      ) *

      chartWidth

    )

  }





  function getY(

    value: number,

  ) {

    return (

      chartBottom -

      (

        (

          value -

          scaleMin

        ) /

        scaleRange

      ) *

      chartHeight

    )

  }





  const scalarPoints =

    activeScalarData.map(

      (

        item,

        index,

      ) => ({

        ...item,



        x:

          getX(

            index,

            activeScalarData.length,

          ),



        y:

          getY(

            item.value,

          ),

      }),

    )

  const lastScalarPoint =
    scalarPoints.at(-1) ?? null

  const macroPoints =

    activeMacroData.map(

      (

        item,

        index,

      ) => ({

        ...item,



        x:

          getX(

            index,

            activeMacroData.length,

          ),



        proteinY:

          getY(

            item.proteinas,

          ),



        carbsY:

          getY(

            item.carboidratos,

          ),



        fatY:

          getY(

            item.gorduras,

          ),

      }),

    )





  const scalarLinePath =

    createLinePath(

      scalarPoints,

    )





  const areaPath =

    scalarPoints.length > 1

      ? `${scalarLinePath}

         L ${scalarPoints[

        scalarPoints.length -

        1

      ].x

      } ${chartBottom}

         L ${scalarPoints[0].x

      } ${chartBottom}

         Z`

      : ""





  const proteinLinePath =

    createLinePath(

      macroPoints.map(

        (point) => ({

          x:

            point.x,



          y:

            point.proteinY,

        }),

      ),

    )





  const carbsLinePath =

    createLinePath(

      macroPoints.map(

        (point) => ({

          x:

            point.x,



          y:

            point.carbsY,

        }),

      ),

    )





  const fatLinePath =

    createLinePath(

      macroPoints.map(

        (point) => ({

          x:

            point.x,



          y:

            point.fatY,

        }),

      ),

    )





  const gridLines =

    Array.from(

      {

        length: 4,

      },

      (

        _,

        index,

      ) => {



        const ratio =

          index / 3



        return {

          y:

            chartTop +

            ratio *

            chartHeight,



          value:

            scaleMax -

            ratio *

            scaleRange,

        }

      },

    )





  const hitPoints =

    selectedMetric ===

      "macronutrientes"

      ? macroPoints.map(

        (point) => ({

          data:

            point.data,



          x:

            point.x,

        }),

      )

      : scalarPoints.map(

        (point) => ({

          data:

            point.data,



          x:

            point.x,

        }),

      )





  const activePointData =

    hoveredPointData ??

    selectedPointData





  const activeScalarPoint =

    activePointData

      ? scalarPoints.find(

        (point) =>

          point.data ===

          activePointData,

      ) ??

      null

      : null


  const activePointReachedGoal =
    goalReached &&
    activeScalarPoint !== null &&
    activeScalarPoint.data === lastScalarPoint?.data


  const activeMacroPoint =

    activePointData

      ? macroPoints.find(

        (point) =>

          point.data ===

          activePointData,

      ) ??

      null

      : null





  const activeX =

    activeScalarPoint?.x ??

    activeMacroPoint?.x ??

    null





  const activeY =

    activeScalarPoint

      ? activeScalarPoint.y



      : activeMacroPoint

        ? Math.min(

          activeMacroPoint.proteinY,

          activeMacroPoint.carbsY,

          activeMacroPoint.fatY,

        )



        : null





  const tooltipWidth =

    selectedMetric ===

      "macronutrientes"

      ? 220

      : 160





  const tooltipHeight =

    selectedMetric ===

      "macronutrientes"

      ? 104

      : 58





  const activeTooltipHeight =
    selectedMetric === "macronutrientes"
      ? tooltipHeight
      : activePointReachedGoal
        ? 78
        : tooltipHeight

  const tooltipX =

    activeX !== null

      ? Math.min(

        Math.max(

          activeX -

          tooltipWidth /

          2,

          chartLeft,

        ),



        chartRight -

        tooltipWidth,

      )



      : 0





  const tooltipY =

    activeY !== null

      ? activeY -

        activeTooltipHeight -

        14 <

        chartTop



        ? activeY +

        16



        : activeY -

        activeTooltipHeight -

        14



      : 0





  const labelEvery =

    Math.max(

      1,



      Math.ceil(

        hitPoints.length /

        6,

      ),

    )



  const formattedVariation =

    `${variation > 0

      ? "+"

      : ""

    }${formatNumber(

      variation,

      selectedMetric,

    )} ${unit}`





  let summaryText = ""





  if (

    selectedMetric ===

    "peso" &&

    activeScalarData.length >

    0

  ) {

    summaryText =

      `O peso foi de ${formatNumber(

        firstValue,

        selectedMetric,

      )} kg para ${formatNumber(

        currentValue,

        selectedMetric,

      )} kg no período, com variação de ${formattedVariation} em ${activeScalarData.length} registro(s).`

  }





  if (

    selectedMetric ===

    "hidratacao" &&

    activeScalarData.length >

    0

  ) {

    summaryText =

      `A média registrada foi de ${formatNumber(

        average,

        selectedMetric,

      )} ml, com máximo de ${formatNumber(

        maximum,

        selectedMetric,

      )} ml em ${activeScalarData.length} registro(s).${scalarGoal !== null

        ? ` A meta cadastrada é de ${formatNumber(

          scalarGoal,

          selectedMetric,

        )} ml.`

        : ""

      }`

  }





  if (

    selectedMetric ===

    "calorias" &&

    activeScalarData.length >

    0

  ) {

    summaryText =

      `A média registrada foi de ${formatNumber(

        average,

        selectedMetric,

      )} kcal por dia, com máximo de ${formatNumber(

        maximum,

        selectedMetric,

      )} kcal em ${activeScalarData.length} dia(s).${scalarGoal !== null

        ? ` A meta cadastrada é de ${formatNumber(

          scalarGoal,

          selectedMetric,

        )} kcal.`

        : ""

      }`

  }





  if (

    selectedMetric ===

    "macronutrientes" &&

    activeMacroData.length >

    0

  ) {

    summaryText =

      `Médias do período: ${formatNumber(

        averageProtein,

        selectedMetric,

      )} g de proteínas, ${formatNumber(

        averageCarbs,

        selectedMetric,

      )} g de carboidratos e ${formatNumber(

        averageFat,

        selectedMetric,

      )} g de gorduras em ${activeMacroData.length} dia(s).`

  }





  return (

    <section className="mt-6 overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm">



      <div className="flex flex-col gap-4 border-b border-neutral-100 px-7 py-5 md:flex-row md:items-center md:justify-between">



        <div>



          <div className="flex items-center gap-3">



            <h2 className="text-lg font-semibold tracking-tight">

              Evolução geral

            </h2>



            <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-700">

              Dados reais

            </span>



          </div>



          <p className="mt-1 text-sm text-neutral-500">

            Acompanhe a evolução do paciente ao longo do tempo.

          </p>



        </div>





        <div className="flex items-center gap-2">



          {(

            [

              7,

              30,

              90,

            ] as Period[]

          ).map(

            (days) => (



              <button

                key={

                  days

                }

                type="button"

                aria-pressed={

                  period ===

                  days

                }

                onClick={() => {

                  setPeriod(

                    days,

                  )



                  resetPointSelection()

                }}

                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${period === days

                  ? "bg-neutral-950 text-white"

                  : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"

                  }`}

              >

                {days}D

              </button>



            ),

          )}



        </div>



      </div>





      <div className="px-7 py-5">



        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">



          <div className="flex flex-wrap gap-2">



            <button

              type="button"

              aria-pressed={

                selectedMetric ===

                "peso"

              }

              disabled={

                !hasWeight

              }

              onClick={() =>

                changeMetric(

                  "peso",

                )

              }

              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${selectedMetric ===

                "peso"

                ? "bg-emerald-50 text-emerald-700"

                : "bg-neutral-50 text-neutral-400 hover:text-neutral-600"

                } ${!hasWeight

                  ? "cursor-not-allowed opacity-40"

                  : ""

                }`}

            >

              Peso

            </button>





            <button

              type="button"

              aria-pressed={

                selectedMetric ===

                "hidratacao"

              }

              disabled={

                !hasHydration

              }

              onClick={() =>

                changeMetric(

                  "hidratacao",

                )

              }

              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${selectedMetric ===

                "hidratacao"

                ? "bg-teal-50 text-teal-700"

                : "bg-neutral-50 text-neutral-400 hover:text-neutral-600"

                } ${!hasHydration

                  ? "cursor-not-allowed opacity-40"

                  : ""

                }`}

            >

              Hidratação

            </button>





            <button

              type="button"

              aria-pressed={

                selectedMetric ===

                "calorias"

              }
onClick={() =>

                changeMetric(

                  "calorias",

                )

              }

              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${selectedMetric ===

                "calorias"

                ? "bg-amber-50 text-amber-700"

                : "bg-neutral-50 text-neutral-400 hover:text-neutral-600"

                }`}

            >

              Calorias

            </button>





            <button

              type="button"

              aria-pressed={

                selectedMetric ===

                "macronutrientes"

              }
onClick={() =>

                changeMetric(

                  "macronutrientes",

                )

              }

              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${selectedMetric ===

                "macronutrientes"

                ? "bg-neutral-950 text-white"

                : "bg-neutral-50 text-neutral-400 hover:text-neutral-600"

                }`}

            >

              Macronutrientes

            </button>



          </div>

          {hasData &&

            selectedMetric !==

            "macronutrientes" && (

              <div className="flex items-end gap-8">



                <div>



                  <p className="text-xs text-neutral-400">

                    {selectedMetric ===

                      "peso"

                      ? "Peso atual"

                      : selectedMetric ===

                        "hidratacao"

                        ? "Hidratação atual"

                        : "Calorias atuais"}

                  </p>



                  <div className="mt-1 flex items-baseline gap-2">



                    <span className="text-2xl font-semibold tracking-tight">

                      {formatNumber(

                        currentValue,

                        selectedMetric,

                      )}

                    </span>



                    <span className="text-sm text-neutral-400">

                      {unit}

                    </span>



                  </div>



                </div>





                <div>



                  <p className="text-xs text-neutral-400">

                    Média

                  </p>



                  <p className="mt-1 text-sm font-semibold text-teal-700">

                    {formatNumber(

                      average,

                      selectedMetric,

                    )} {unit}

                  </p>



                </div>



              </div>



            )}


          {hasData &&
            selectedMetric ===
            "macronutrientes" && (

              <div className="flex flex-wrap items-end gap-6 text-sm">

                <div>

                  <p className="text-xs text-neutral-400">
                    Proteína
                  </p>

                  <p className="mt-1 font-semibold text-emerald-700">
                    {formatNumber(
                      averageProtein,
                      selectedMetric,
                    )} g
                  </p>

                </div>


                <div>

                  <p className="text-xs text-neutral-400">
                    Carboidrato
                  </p>

                  <p className="mt-1 font-semibold text-sky-700">
                    {formatNumber(
                      averageCarbs,
                      selectedMetric,
                    )} g
                  </p>

                </div>


                <div>

                  <p className="text-xs text-neutral-400">
                    Gordura
                  </p>

                  <p className="mt-1 font-semibold text-amber-700">
                    {formatNumber(
                      averageFat,
                      selectedMetric,
                    )} g
                  </p>

                </div>

              </div>

            )}

        </div>

        {!hasData ? (

          <div className="mt-6 flex min-h-[250px] items-center justify-center rounded-2xl bg-neutral-50/60">

            <div className="text-center">
              <p className="font-semibold text-neutral-700">

                Ainda não há dados de {metricLabel.toLowerCase()}

              </p>



              <p className="mt-2 text-sm text-neutral-400">

                Os dados aparecerão aqui quando houver registros disponíveis.

              </p>



            </div>



          </div>



        ) : (



          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_220px]">



            <div className="overflow-x-auto rounded-2xl bg-neutral-50/40 px-3 py-2">



              <svg

                viewBox="0 0 900 270"

                className="min-w-[700px] w-full"

                role="img"

                aria-label={`Evolução de ${metricLabel.toLowerCase()} do paciente`}

                onClick={() =>

                  setSelectedPointData(

                    null,

                  )

                }

              >



                <defs>



                  <linearGradient

                    id="evolutionArea"

                    x1="0"

                    y1="0"

                    x2="0"

                    y2="1"

                  >



                    <stop

                      offset="0%"

                      stopColor={

                        lineColor

                      }

                      stopOpacity="0.16"

                    />



                    <stop

                      offset="100%"

                      stopColor={

                        lineColor

                      }

                      stopOpacity="0"

                    />



                  </linearGradient>



                </defs>





                {gridLines.map(

                  (line) => (



                    <g

                      key={

                        line.y

                      }

                    >



                      <line

                        x1={

                          chartLeft

                        }

                        y1={

                          line.y

                        }

                        x2={

                          chartRight

                        }

                        y2={

                          line.y

                        }

                        stroke="#edf1ef"

                      />



                      <text

                        x="18"

                        y={

                          line.y +

                          4

                        }

                        fontSize="12"

                        fill="#a3a3a3"

                      >

                        {formatNumber(

                          line.value,

                          selectedMetric,

                        )} {unit}

                      </text>



                    </g>



                  ),

                )}

                {selectedMetric !== "macronutrientes" &&
                  scalarGoal !== null && (


                    <g>

                      <line

                        x1={chartLeft}

                        x2={chartRight - 148}

                        y1={getY(scalarGoal)}

                        y2={getY(scalarGoal)}

                        stroke={goalColor}

                        strokeWidth="1.5"

                        opacity="0.85"

                      />



                      <circle

                        cx={chartRight - 148}

                        cy={getY(scalarGoal)}

                        r="3.5"

                        fill={goalColor}

                      />



                      <g

                        transform={`translate(${chartRight - 140} ${getY(scalarGoal) - 17})`}

                      >

                        <rect

                          width="140"

                          height="34"

                          rx="17"

                          fill={goalBadgeBackground}

                        />



                        <circle

                          cx="18"

                          cy="17"

                          r="7.5"

                          fill="none"

                          stroke={goalColor}

                          strokeWidth="2"

                        />



                        <circle

                          cx="18"

                          cy="17"

                          r="3.5"

                          fill="none"

                          stroke={goalColor}

                          strokeWidth="2"

                        />



                        <circle

                          cx="18"

                          cy="17"

                          r="1.5"

                          fill={goalColor}

                        />



                        <text

                          x="34"

                          y="21"

                          fontSize="12"

                          fontWeight="600"

                          fill={goalColor}

                        >

                          {`Meta ${formatNumber(
                            scalarGoal,
                            selectedMetric,
                          )} ${unit}`}

                        </text>

                      </g>



                    </g>



                  )}





                {selectedMetric ===

                  "macronutrientes" && (

                    <>



                      {proteinGoal !== null && (
                        <g>
                          <line
                            x1={chartLeft}
                            x2={chartRight}
                            y1={getY(proteinGoal)}
                            y2={getY(proteinGoal)}
                            stroke={proteinColor}
                            strokeDasharray="5 6"
                            opacity="0.6"
                          />

                          <text
                            x={chartRight}
                            y={getY(proteinGoal) - 7}
                            textAnchor="end"
                            fontSize="12"
                            fontWeight="600"
                            fill={proteinColor}
                          >
                            {`Meta proteína ${formatNumber(proteinGoal, selectedMetric)} g`}
                          </text>
                        </g>
                      )}


                      {carbsGoal !==

                        null && (



                          <line

                            x1={

                              chartLeft

                            }

                            x2={

                              chartRight

                            }

                            y1={

                              getY(

                                carbsGoal,

                              )

                            }

                            y2={

                              getY(

                                carbsGoal,

                              )

                            }

                            stroke={

                              carbsColor

                            }

                            strokeDasharray="5 6"

                            opacity="0.28"

                          />



                        )}





                      {fatGoal !==

                        null && (



                          <line

                            x1={

                              chartLeft

                            }

                            x2={

                              chartRight

                            }

                            y1={

                              getY(

                                fatGoal,

                              )

                            }

                            y2={

                              getY(

                                fatGoal,

                              )

                            }

                            stroke={

                              fatColor

                            }

                            strokeDasharray="5 6"

                            opacity="0.28"

                          />



                        )}



                    </>

                  )}





                {selectedMetric !==

                  "macronutrientes" &&

                  areaPath && (



                    <path

                      d={

                        areaPath

                      }

                      fill="url(#evolutionArea)"

                    />



                  )}





                {selectedMetric !==

                  "macronutrientes" &&

                  scalarPoints.length >

                  1 && (



                    <path

                      d={

                        scalarLinePath

                      }

                      fill="none"

                      stroke={

                        lineColor

                      }

                      strokeWidth="4"

                      strokeLinecap="round"

                      strokeLinejoin="round"

                    />



                  )}





                {selectedMetric ===

                  "macronutrientes" && (

                    <>



                      {macroPoints.length >

                        1 && (

                          <>

                            <path

                              d={

                                proteinLinePath

                              }

                              fill="none"

                              stroke={

                                proteinColor

                              }

                              strokeWidth="3"

                              strokeLinecap="round"

                              strokeLinejoin="round"

                            />



                            <path

                              d={

                                carbsLinePath

                              }

                              fill="none"

                              stroke={

                                carbsColor

                              }

                              strokeWidth="3"

                              strokeLinecap="round"

                              strokeLinejoin="round"

                            />



                            <path

                              d={

                                fatLinePath

                              }

                              fill="none"

                              stroke={

                                fatColor

                              }

                              strokeWidth="3"

                              strokeLinecap="round"

                              strokeLinejoin="round"

                            />

                          </>

                        )}



                    </>

                  )}





                {selectedMetric !==

                  "macronutrientes" &&

                  scalarPoints.map(

                    (point) => (



                      <circle

                        key={

                          point.data

                        }

                        cx={

                          point.x

                        }

                        cy={

                          point.y

                        }

                        r="6"

                        fill="white"

                        stroke={

                          lineColor

                        }

                        strokeWidth="3"

                        pointerEvents="none"

                      />



                    ),

                  )}

                {goalReached &&
                  lastScalarPoint && (
                    <g pointerEvents="none">

                      <circle
                        cx={lastScalarPoint.x}
                        cy={lastScalarPoint.y}
                        r="11"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="3"
                      />

                      <path
                        d={`
          M ${lastScalarPoint.x - 5}
            ${lastScalarPoint.y}

          L ${lastScalarPoint.x - 1}
            ${lastScalarPoint.y + 4}

          L ${lastScalarPoint.x + 6}
            ${lastScalarPoint.y - 5}
        `}
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                    </g>
                  )}



                {selectedMetric ===

                  "macronutrientes" &&

                  macroPoints.map(

                    (point) => (



                      <g

                        key={

                          point.data

                        }

                        pointerEvents="none"

                      >



                        <circle

                          cx={

                            point.x

                          }

                          cy={

                            point.proteinY

                          }

                          r="5"

                          fill="white"

                          stroke={

                            proteinColor

                          }

                          strokeWidth="3"

                        />



                        <circle

                          cx={

                            point.x

                          }

                          cy={

                            point.carbsY

                          }

                          r="5"

                          fill="white"

                          stroke={

                            carbsColor

                          }

                          strokeWidth="3"

                        />



                        <circle

                          cx={

                            point.x

                          }

                          cy={

                            point.fatY

                          }

                          r="5"

                          fill="white"

                          stroke={

                            fatColor

                          }

                          strokeWidth="3"

                        />



                      </g>



                    ),

                  )}





                {hitPoints.map(

                  (

                    point,

                    index,

                  ) => {



                    const nextX =

                      hitPoints[

                        index + 1

                      ]?.x



                    const previousX =

                      hitPoints[

                        index - 1

                      ]?.x



                    const spacing =

                      nextX !==

                        undefined

                        ? nextX -

                        point.x

                        : previousX !==

                          undefined

                          ? point.x -

                          previousX

                          : 48



                    const width =

                      Math.max(

                        36,

                        Math.min(

                          spacing,

                          72,

                        ),

                      )





                    return (



                      <rect

                        key={`hit-${point.data}`}

                        x={

                          point.x -

                          width / 2

                        }

                        y={

                          chartTop

                        }

                        width={

                          width

                        }

                        height={

                          chartHeight

                        }

                        fill="transparent"

                        role="button"

                        tabIndex={0}

                        style={{

                          cursor:

                            "pointer",

                        }}



                        aria-label={`Ver dados de ${formatDateLabel(

                          point.data,

                        )}`}



                        onPointerEnter={(

                          event,

                        ) => {

                          if (

                            event.pointerType ===

                            "mouse"

                          ) {

                            setHoveredPointData(

                              point.data,

                            )

                          }

                        }}



                        onPointerLeave={(

                          event,

                        ) => {

                          if (

                            event.pointerType ===

                            "mouse"

                          ) {

                            setHoveredPointData(

                              null,

                            )

                          }

                        }}



                        onFocus={() =>

                          setSelectedPointData(

                            point.data,

                          )

                        }



                        onBlur={() =>

                          setSelectedPointData(

                            null,

                          )

                        }



                        onClick={(

                          event,

                        ) => {

                          event.stopPropagation()



                          setSelectedPointData(

                            (

                              current,

                            ) =>

                              current ===

                                point.data

                                ? null

                                : point.data,

                          )

                        }}

                      />



                    )

                  },

                )}





                {activeX !==

                  null && (



                    <line

                      x1={

                        activeX

                      }

                      x2={

                        activeX

                      }

                      y1={

                        chartTop

                      }

                      y2={

                        chartBottom

                      }

                      stroke="#737373"

                      strokeWidth="1"

                      strokeDasharray="4 4"

                      opacity="0.35"

                      pointerEvents="none"

                    />



                  )}





                {selectedMetric !== "macronutrientes" &&
                  activeScalarPoint && (



                    <g

                      pointerEvents="none"

                    >



                      <circle

                        cx={

                          activeScalarPoint.x

                        }

                        cy={

                          activeScalarPoint.y

                        }

                        r="9"

                        fill="white"

                        stroke={

                          lineColor

                        }

                        strokeWidth="4"

                      />





                      <g

                        transform={`translate(${tooltipX} ${tooltipY})`}

                      >



                        <rect

                          width={

                            tooltipWidth

                          }

                          height={

                            activeTooltipHeight

                          }

                          rx="12"

                          fill="#171717"

                        />



                        <text

                          x="12"

                          y="21"

                          fontSize="11"

                          fill="#a3a3a3"

                        >

                          {formatDateLabel(

                            activeScalarPoint.data,

                          )}

                        </text>



                        <text

                          x="12"

                          y="43"

                          fontSize="14"

                          fontWeight="600"

                          fill="white"

                        >

                          {formatNumber(

                            activeScalarPoint.value,

                            selectedMetric,

                          )} {unit}

                          {activePointReachedGoal && "✅"}
                        </text>
                      </g>
                    </g>
                  )}

                {selectedMetric === "macronutrientes" &&
                  activeMacroPoint && (

                    <g

                      transform={`translate(${tooltipX} ${tooltipY})`}

                    >

                      <rect

                        width={tooltipWidth}

                        height={tooltipHeight}

                        rx="12"

                        fill="#171717"

                      />



                      <text

                        x="14"

                        y="21"

                        fontSize="11"

                        fill="#a3a3a3"

                      >

                        {formatDateLabel(

                          activeMacroPoint.data,

                        )}

                      </text>





                      <text

                        x="14"

                        y="45"

                        fontSize="11"

                        fill="#6ee7b7"

                      >

                        Proteína

                      </text>



                      <text

                        x={tooltipWidth - 14}

                        y="45"

                        textAnchor="end"

                        fontSize="11"

                        fontWeight="600"

                        fill="#6ee7b7"

                      >

                        {formatNumber(

                          activeMacroPoint.proteinas,

                          selectedMetric,

                        )}

                      </text>





                      <text

                        x="14"

                        y="66"

                        fontSize="11"

                        fill="#7dd3fc"

                      >

                        Carboidrato

                      </text>



                      <text

                        x={tooltipWidth - 14}

                        y="66"

                        textAnchor="end"

                        fontSize="11"

                        fontWeight="600"

                        fill="#7dd3fc"

                      >

                        {formatNumber(

                          activeMacroPoint.carboidratos,

                          selectedMetric,

                        )}

                      </text>





                      <text

                        x="14"

                        y="87"

                        fontSize="11"

                        fill="#fcd34d"

                      >

                        Gordura

                      </text>



                      <text

                        x={tooltipWidth - 14}

                        y="87"

                        textAnchor="end"

                        fontSize="11"

                        fontWeight="600"

                        fill="#fcd34d"

                      >

                        {formatNumber(

                          activeMacroPoint.gorduras,

                          selectedMetric,

                        )}

                      </text>

                    </g>



                  )}






                {hitPoints.map(

                  (

                    point,

                    index,

                  ) => {



                    const showLabel =

                      index %

                      labelEvery ===

                      0 ||

                      index ===

                      hitPoints.length -

                      1





                    if (

                      !showLabel

                    ) {

                      return null

                    }





                    return (



                      <text

                        key={`label-${point.data}`}

                        x={

                          point.x

                        }

                        y="252"

                        textAnchor="middle"

                        fontSize="11"

                        fill="#a3a3a3"

                      >

                        {formatDateLabel(

                          point.data,

                        )}

                      </text>



                    )

                  },

                )}



              </svg>



            </div>





            <div className="grid grid-cols-3 gap-3 xl:grid-cols-1">



              {selectedMetric ===
                "peso" && (
                  <>

                    {scalarGoal !== null && (

                      <InfoCard
                        label="Peso alvo"
                        value={`${formatNumber(
                          scalarGoal,
                          selectedMetric,
                        )} kg`}
                        accent
                      />

                    )}


                    <InfoCard
                      label="Variação"
                      value={
                        formattedVariation
                      }
                    />


                    <InfoCard
                      label="Média"
                      value={`${formatNumber(
                        average,
                        selectedMetric,
                      )} kg`}
                    />


                    <InfoCard
                      label="Registros"
                      value={`${activeScalarData.length}`}
                    />

                  </>
                )}





              {selectedMetric ===

                "hidratacao" && (

                  <>



                    <InfoCard

                      label={

                        scalarGoal !==

                          null

                          ? "Meta"

                          : "Máximo"

                      }

                      value={`${formatNumber(

                        scalarGoal ??

                        maximum,

                        selectedMetric,

                      )} ml`}

                      accent

                    />



                    <InfoCard

                      label="Média"

                      value={`${formatNumber(

                        average,

                        selectedMetric,

                      )} ml`}

                    />



                    <InfoCard

                      label="Registros"

                      value={`${activeScalarData.length}`}

                    />



                  </>

                )}





              {selectedMetric ===

                "calorias" && (

                  <>



                    <InfoCard

                      label={

                        scalarGoal !==

                          null

                          ? "Meta diária"

                          : "Máximo"

                      }

                      value={`${formatNumber(

                        scalarGoal ??

                        maximum,

                        selectedMetric,

                      )} kcal`}

                      accent

                    />



                    <InfoCard

                      label="Média"

                      value={`${formatNumber(

                        average,

                        selectedMetric,

                      )} kcal`}

                    />



                    <InfoCard

                      label="Dias"

                      value={`${activeScalarData.length}`}

                    />



                  </>

                )}





              {selectedMetric ===

                "macronutrientes" && (

                  <>



                    <InfoCard

                      label="Proteína média"

                      value={`${formatNumber(

                        averageProtein,

                        selectedMetric,

                      )} g`}

                      accent

                    />



                    <InfoCard

                      label="Carbo médio"

                      value={`${formatNumber(

                        averageCarbs,

                        selectedMetric,

                      )} g`}

                    />



                    <InfoCard

                      label="Gordura média"

                      value={`${formatNumber(

                        averageFat,

                        selectedMetric,

                      )} g`}

                    />



                    <InfoCard

                      label="Dias"

                      value={`${activeMacroData.length}`}

                    />



                  </>

                )}



            </div>



          </div>



        )

        }





        {

          showSummary &&

          hasData &&

          summaryText && (

            <div className="mt-5 rounded-[24px] bg-neutral-950 px-5 py-4 text-white">



              <div className="flex items-start gap-3">



                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />



                <div>



                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">

                    Resumo dos últimos {period} dias

                  </p>



                  <p className="mt-2 text-sm leading-6 text-neutral-200">

                    {summaryText}

                  </p>



                </div>



              </div>



            </div>



          )

        }





        <p className="mt-3 text-xs text-neutral-400">

          Dados obtidos dos registros diários do paciente.

        </p>



      </div >



    </section >

  )

}





type InfoCardProps = {

  label: string

  value: string

  accent?: boolean

}





function InfoCard({

  label,

  value,

  accent = false,

}: InfoCardProps) {

  return (

    <div className="rounded-2xl bg-neutral-50 px-4 py-3">



      <p className="text-[10px] uppercase tracking-wide text-neutral-400">

        {label}

      </p>



      <p

        className={`mt-1 text-base font-semibold ${accent

          ? "text-teal-700"

          : "text-neutral-950"

          }`}

      >

        {value}

      </p>



    </div>

  )

}
