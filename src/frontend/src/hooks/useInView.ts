import { RefObject, useEffect, useState } from "react";

export function useInView(ref: RefObject<Element | null>, rootMargin = "200px"): boolean {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || inView) return;

        if (typeof IntersectionObserver === "undefined") {
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setInView(true);
                observer.disconnect();
            }
        }, { rootMargin });

        observer.observe(element);

        return () => observer.disconnect();
    }, [ref, rootMargin, inView]);

    return inView;
}
