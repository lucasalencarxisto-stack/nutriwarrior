import {
  useState,
} from "react"

import type {
  DayRecord,
} from "../services/days"


type PatientEvolutionPreviewProps = {
  records: DayRecord[]
}

type Metric =
  | "peso"
  | "hidratacao"

type Period =
  | 7
  | 30
  | 90


function formatNumber(
  value: number,
  metric: Metric,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits:
        metric === "peso" ? 1 : 0,

      maximumFractionDigits:
        metric === "peso" ? 1 : 0,
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


export function PatientEvolutionPreview({
  records,
}: PatientEvolutionPreviewProps) {

  const [metric, setMetric] =
    useState<Metric>("peso")

  const [period, setPeriod] =
    useState<Period>(30)

  const [
    selectedPointData,
    setSelectedPointData,
  ] =
    useState<string | null>(null)

  const [
    hoveredPointData,
    setHoveredPointData,
  ] =
    useState<string | null>(null)


  function resetPointSelection() {
    setSelectedPointData(null)
    setHoveredPointData(null)
  }


  const weightRecords =
    records
      .filter(
        (record) =>
          record.pesoKg !== null,
      )
      .sort(
        (a, b) =>
          a.data.localeCompare(
            b.data,
          ),
      )


  const hydrationRecords =
    records
      .filter(
        (record) =>
          record.aguaMl !== null,
      )
      .sort(
        (a, b) =>
          a.data.localeCompare(
            b.data,
          ),
      )


  const allMetricRecords =
    metric === "peso"
      ? weightRecords
      : hydrationRecords


  const latestDate =
    allMetricRecords.length > 0
      ? new Date(
          `${allMetricRecords[
            allMetricRecords.length - 1
          ].data}T12:00:00`,
        )
      : null


  const periodStart =
    latestDate
      ? new Date(latestDate)
      : null


  if (periodStart) {
    periodStart.setDate(
      periodStart.getDate() -
        (period - 1),
    )
  }


  const activeRecords =
    allMetricRecords.filter(
      (record) => {

        if (!periodStart) {
          return false
        }

        const recordDate =
          new Date(
            `${record.data}T12:00:00`,
          )

        return (
          recordDate >=
          periodStart
        )
      },
    )


  const isWeight =
    metric === "peso"


  const unit =
    isWeight
      ? "kg"
      : "ml"


  const metricLabel =
    isWeight
      ? "Peso"
      : "Hidratação"


  const currentLabel =
    isWeight
      ? "Peso atual"
      : "Hidratação atual"


  const emptyLabel =
    isWeight
      ? "Ainda não há registros de peso"
      : "Ainda não há registros de hidratação"


  const lineColor =
    isWeight
      ? "#10b981"
      : "#0d9488"


  const values =
    activeRecords.map(
      (record) =>
        Number(
          isWeight
            ? record.pesoKg
            : record.aguaMl,
        ),
    )


  const hasData =
    values.length > 0


  const firstValue =
    values[0] ?? 0


  const currentValue =
    values[
      values.length - 1
    ] ?? 0


  const variation =
    hasData
      ? currentValue -
        firstValue
      : 0


  const average =
    hasData
      ? values.reduce(
          (total, value) =>
            total + value,
          0,
        ) / values.length
      : 0


  const minValue =
    hasData
      ? Math.min(...values)
      : 0


  const maxValue =
    hasData
      ? Math.max(...values)
      : 0


  const rawRange =
    maxValue - minValue


  const minimumPadding =
    isWeight
      ? 0.5
      : 100


  const padding =
    hasData
      ? Math.max(
          rawRange * 0.25,
          minimumPadding,
        )
      : minimumPadding


  const scaleMin =
    isWeight
      ? minValue - padding
      : Math.max(
          0,
          minValue - padding,
        )


  const scaleMax =
    maxValue + padding


  const scaleRange =
    scaleMax - scaleMin


  const chartLeft = 90
  const chartRight = 850
  const chartTop = 40
  const chartBottom = 190


  const chartWidth =
    chartRight -
    chartLeft


  const chartHeight =
    chartBottom -
    chartTop


  const points =
    activeRecords.map(
      (record, index) => {

        const value =
          Number(
            isWeight
              ? record.pesoKg
              : record.aguaMl,
          )


        const x =
          activeRecords.length === 1
            ? chartLeft +
              chartWidth / 2
            : chartLeft +
              (
                index /
                (
                  activeRecords.length -
                  1
                )
              ) *
              chartWidth


        const y =
          chartBottom -
          (
            (
              value -
              scaleMin
            ) /
            scaleRange
          ) *
          chartHeight


        return {
          x,
          y,
          value,
          data: record.data,
        }
      },
    )


  const activePointData =
    hoveredPointData ??
    selectedPointData


  const activePoint =
    activePointData
      ? points.find(
          (point) =>
            point.data ===
            activePointData,
        ) ?? null
      : null


  const tooltipWidth = 150
  const tooltipHeight = 54


  const tooltipX =
    activePoint
      ? Math.min(
          Math.max(
            activePoint.x -
              tooltipWidth / 2,
            chartLeft,
          ),
          chartRight -
            tooltipWidth,
        )
      : 0


  const tooltipY =
    activePoint
      ? activePoint.y -
            tooltipHeight -
            14 <
          chartTop
        ? activePoint.y + 16
        : activePoint.y -
          tooltipHeight -
          14
      : 0


  const linePath =
    points
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


  const areaPath =
    points.length > 1
      ? `${linePath}
         L ${points[points.length - 1].x} ${chartBottom}
         L ${points[0].x} ${chartBottom}
         Z`
      : ""


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


  const labelEvery =
    Math.max(
      1,
      Math.ceil(
        points.length / 6,
      ),
    )


  const variationArrow =
    variation < 0
      ? "↓"
      : variation > 0
        ? "↑"
        : "→"


  const formattedVariation =
    `${variation > 0
      ? "+"
      : ""
    }${formatNumber(
      variation,
      metric,
    )} ${unit}`


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

          {([7, 30, 90] as Period[]).map(
            (days) => (

              <button
                key={days}
                type="button"
                aria-pressed={
                  period === days
                }
                onClick={() => {
                  setPeriod(days)
                  resetPointSelection()
                }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  period === days
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
                metric === "peso"
              }
              onClick={() => {
                setMetric("peso")
                resetPointSelection()
              }}
              disabled={
                weightRecords.length === 0
              }
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                metric === "peso"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-neutral-50 text-neutral-400 hover:text-neutral-600"
              } ${
                weightRecords.length === 0
                  ? "cursor-not-allowed opacity-40"
                  : ""
              }`}
            >
              Peso
            </button>


            <button
              type="button"
              aria-pressed={
                metric === "hidratacao"
              }
              onClick={() => {
                setMetric(
                  "hidratacao",
                )
                resetPointSelection()
              }}
              disabled={
                hydrationRecords.length === 0
              }
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                metric === "hidratacao"
                  ? "bg-teal-50 text-teal-700"
                  : "bg-neutral-50 text-neutral-400 hover:text-neutral-600"
              } ${
                hydrationRecords.length === 0
                  ? "cursor-not-allowed opacity-40"
                  : ""
              }`}
            >
              Hidratação
            </button>


            <button
              type="button"
              disabled
              title="Disponível em breve"
              className="cursor-not-allowed rounded-xl bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-300"
            >
              Calorias
            </button>


            <button
              type="button"
              disabled
              title="Disponível em breve"
              className="cursor-not-allowed rounded-xl bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-300"
            >
              Macronutrientes
            </button>

          </div>


          {hasData && (

            <div className="flex items-end gap-8">

              <div>

                <p className="text-xs text-neutral-400">
                  {currentLabel}
                </p>

                <div className="mt-1 flex items-baseline gap-2">

                  <span className="text-2xl font-semibold tracking-tight">
                    {formatNumber(
                      currentValue,
                      metric,
                    )}
                  </span>

                  <span className="text-sm text-neutral-400">
                    {unit}
                  </span>

                </div>

              </div>


              <div>

                <p className="text-xs text-neutral-400">
                  {isWeight
                    ? "Variação"
                    : "Média"
                  }
                </p>

                <p className="mt-1 text-sm font-semibold text-teal-700">

                  {isWeight ? (
                    <>
                      {variationArrow}{" "}

                      {formatNumber(
                        Math.abs(
                          variation,
                        ),
                        metric,
                      )} {unit}
                    </>
                  ) : (
                    <>
                      {formatNumber(
                        average,
                        metric,
                      )} {unit}
                    </>
                  )}

                </p>

              </div>

            </div>

          )}

        </div>


        {!hasData ? (

          <div className="mt-6 flex min-h-[240px] items-center justify-center rounded-2xl bg-neutral-50/60">

            <div className="text-center">

              <p className="font-semibold text-neutral-700">
                {emptyLabel}
              </p>

              <p className="mt-2 text-sm text-neutral-400">
                A evolução aparecerá aqui quando o paciente registrar dados.
              </p>

            </div>

          </div>

        ) : (

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_220px]">

            <div className="overflow-x-auto rounded-2xl bg-neutral-50/40 px-3 py-2">

              <svg
                viewBox="0 0 900 250"
                className="min-w-[700px] w-full"
                role="img"
                aria-label={`Evolução real de ${metricLabel.toLowerCase()} do paciente`}
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
                          line.y + 4
                        }
                        fontSize="12"
                        fill="#a3a3a3"
                      >
                        {formatNumber(
                          line.value,
                          metric,
                        )} {unit}
                      </text>

                    </g>

                  ),
                )}


                {areaPath && (

                  <path
                    d={
                      areaPath
                    }
                    fill="url(#evolutionArea)"
                  />

                )}


                {points.length > 1 && (

                  <path
                    d={
                      linePath
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


                {points.map(
                  (point) => (

                    <g
                      key={
                        point.data
                      }
                    >

                      <circle
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


                      <circle
                        cx={
                          point.x
                        }
                        cy={
                          point.y
                        }
                        r="20"
                        fill="transparent"
                        role="button"
                        tabIndex={0}
                        style={{
                          cursor:
                            "pointer",
                        }}
                        aria-label={`${formatDateLabel(
                          point.data,
                        )}: ${formatNumber(
                          point.value,
                          metric,
                        )} ${unit}`}

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

                    </g>

                  ),
                )}


                {activePoint && (

                  <g
                    pointerEvents="none"
                  >

                    <line
                      x1={
                        activePoint.x
                      }
                      y1={
                        activePoint.y
                      }
                      x2={
                        activePoint.x
                      }
                      y2={
                        chartBottom
                      }
                      stroke={
                        lineColor
                      }
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.35"
                    />


                    <circle
                      cx={
                        activePoint.x
                      }
                      cy={
                        activePoint.y
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
                          tooltipHeight
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
                          activePoint.data,
                        )}
                      </text>


                      <text
                        x="12"
                        y="41"
                        fontSize="14"
                        fontWeight="600"
                        fill="white"
                      >
                        {formatNumber(
                          activePoint.value,
                          metric,
                        )} {unit}
                      </text>

                    </g>

                  </g>

                )}


                {points.map(
                  (
                    point,
                    index,
                  ) => {

                    const showLabel =
                      index %
                      labelEvery ===
                      0 ||
                      index ===
                      points.length -
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
                        y="235"
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

              {isWeight ? (

                <>

                  <div className="rounded-2xl bg-neutral-50 px-4 py-3">

                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                      Variação
                    </p>

                    <p className="mt-1 text-base font-semibold text-teal-700">
                      {formattedVariation}
                    </p>

                  </div>


                  <div className="rounded-2xl bg-neutral-50 px-4 py-3">

                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                      Média
                    </p>

                    <p className="mt-1 text-base font-semibold">
                      {formatNumber(
                        average,
                        metric,
                      )} {unit}
                    </p>

                  </div>


                  <div className="rounded-2xl bg-neutral-50 px-4 py-3">

                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                      Registros
                    </p>

                    <p className="mt-1 text-base font-semibold">
                      {activeRecords.length}
                    </p>

                  </div>

                </>

              ) : (

                <>

                  <div className="rounded-2xl bg-neutral-50 px-4 py-3">

                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                      Máximo
                    </p>

                    <p className="mt-1 text-base font-semibold text-teal-700">
                      {formatNumber(
                        maxValue,
                        metric,
                      )} {unit}
                    </p>

                  </div>


                  <div className="rounded-2xl bg-neutral-50 px-4 py-3">

                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                      Variação
                    </p>

                    <p className="mt-1 text-base font-semibold">
                      {formattedVariation}
                    </p>

                  </div>


                  <div className="rounded-2xl bg-neutral-50 px-4 py-3">

                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                      Registros
                    </p>

                    <p className="mt-1 text-base font-semibold">
                      {activeRecords.length}
                    </p>

                  </div>

                </>

              )}

            </div>

          </div>

        )}


        <p className="mt-3 text-xs text-neutral-400">
          Dados obtidos dos registros diários do paciente.
        </p>

      </div>

    </section>
  )
}