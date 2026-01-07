import { useMediaQuery } from "@/hooks/use-media-query";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";

export function ResponsiveWrapper() {
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    if (isDesktop) {
        return <DesktopLayout />;
    }

    return <MobileLayout />;
}
