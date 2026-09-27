import type { LucideIcon } from "lucide-react"

type FeatureItemProps = {
    icon: LucideIcon
    title: string
    description: string
}

export function FeatureItem({
    icon: Icon,
    title,
    description,
}: FeatureItemProps) {
    return (
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2x1 border border-neutral-200 bg-withe shadow-sm">
            <Icon size={21} strokeWidth={1.7} />
          </div>

        <div>
            <h3 className="mt-1 max-w-sm text-sm leading-5 text-neutral-500">{title}</h3>

            <p className="mt-1 max-w-sm text leading-5 text-neutral-500">
                {description}
            </p>
           </div>
          </div>
    )
}