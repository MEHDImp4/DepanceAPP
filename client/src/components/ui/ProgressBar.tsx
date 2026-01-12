import { cn } from "@/lib/utils"

interface ProgressBarProps {
    value: number
    max: number
    className?: string
    color?: string
}

export function ProgressBar({ value, max, className, color = "bg-primary" }: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
        <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary/30", className)}>
            <div
                className={cn("h-full transition-all duration-500 ease-in-out", color)}
                style={{ width: `${percentage}%` }}
            />
        </div>
    )
}
