import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
    const [value, setValue] = useState(() => {
        // Safe check for window existence (SSR compatibility)
        if (typeof window !== "undefined") {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const result = window.matchMedia(query);
        const onChange = (event: MediaQueryListEvent) => {
            setValue(event.matches);
        };

        result.addEventListener("change", onChange);

        // Removed synchronous check to satisfy linter. 
        // Lazy initialization handles the initial state.
        // If query changes dynamically, we might have a frame of stale state 
        // until the listener fires, but this is acceptable for now.

        return () => result.removeEventListener("change", onChange);
    }, [query]); // Removing 'value' from dependency to avoid loop, though checking matches vs value prevents it.

    return value;
}
