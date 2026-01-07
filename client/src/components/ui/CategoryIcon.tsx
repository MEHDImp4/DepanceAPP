import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
    icon: string;
    size?: number;
    className?: string;
    strokeWidth?: number;
}

export function CategoryIcon({ icon, size = 20, className = "", strokeWidth = 2 }: CategoryIconProps) {
    // Try to find a Lucide icon with the given name
    const IconComponent = (LucideIcons as any)[icon];

    if (IconComponent) {
        return <IconComponent size={size} className={className} strokeWidth={strokeWidth} />;
    }

    // Fallback to rendering the string as-is (covering emojis)
    return (
        <span
            className={cn("flex items-center justify-center leading-none", className)}
            style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
        >
            {icon}
        </span>
    );
}
