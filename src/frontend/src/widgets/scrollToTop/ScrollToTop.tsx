import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();

const ScrollToTop = () => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const key = location.key;

    useEffect(() => {
        const container = document.getElementById("app-scroll-container");
        if (!container) return;

        if (navigationType === "POP") {
            const saved = scrollPositions.get(key) ?? 0;
            requestAnimationFrame(() => container.scrollTo(0, saved));
        } else {
            container.scrollTo(0, 0);
        }

        const handleScroll = () => {
            scrollPositions.set(key, container.scrollTop);
        };
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [key, navigationType]);

    return null;
};

export default ScrollToTop;
