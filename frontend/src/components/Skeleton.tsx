type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse rounded-xl bg-neutral-200/70",
        className,
      ].join(" ")}
    />
  )
}

export function PatientListSkeleton() {
  return (
    <div className="mt-5 grid gap-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[24px] border border-neutral-200 bg-white p-5"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="min-w-56 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-52" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardTableSkeleton() {
  return (
    <div className="mt-6 space-y-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          <div className="hidden gap-3 md:flex">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}


export function ReportPreviewSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="mt-7 rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </section>
  )
}
