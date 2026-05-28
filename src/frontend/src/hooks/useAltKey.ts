import { useEffect, useState } from "react";

export function useAltKey() {
    const [altPressed, setAltPressed] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "Alt") {
                e.preventDefault();
                setAltPressed(true);
            }
        };

        const up = (e: KeyboardEvent) => {
            if (e.key === "Alt") {
                setAltPressed(false);
            }
        };

        window.addEventListener("keydown", down, true);
        window.addEventListener("keyup", up, true);

        return () => {
            window.removeEventListener("keydown", down, true);
            window.removeEventListener("keyup", up, true);
        };
    }, []);

    return altPressed;
}