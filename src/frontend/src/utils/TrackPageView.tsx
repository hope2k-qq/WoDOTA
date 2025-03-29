import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

export const TrackPageView = () => {
    const location = useLocation();

    useEffect(() => {
        if (window.location.hostname === "wodota.pro" && !window.GA_INITIALIZED) {
            const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
            console.log(measurementId)
            if (measurementId) {
                ReactGA.initialize(measurementId);
                window.GA_INITIALIZED = true;
            } else {
                console.error("GA Measurement ID is missing in the environment variables");
            }
        }

        ReactGA.send({ hitType: "pageview", page: location.pathname });

        const trackOutboundLinks = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const link = target.closest("a") as HTMLAnchorElement | null;
            if (link && link.href && !link.href.includes(window.location.origin)) {
                ReactGA.event("click", {
                    category: "Outbound Link",
                    action: "Click",
                    label: link.href,
                });
            }
        };

        const trackScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight;
            const pageHeight = document.documentElement.scrollHeight;
            if (scrollPosition / pageHeight > 0.9) {
                ReactGA.event("scroll", {
                    category: "Page",
                    action: "Scrolled 90%",
                });
            }
        };

        const trackButtonClicks = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const button = target.closest("button") as HTMLButtonElement | null;
            if (button) {
                ReactGA.event("click", {
                    category: "Button",
                    action: "Click",
                    label: button.innerText.trim() || button.getAttribute("aria-label") || "Unnamed Button",
                });
            }
        };

        const trackFormSubmit = (event: Event) => {
            const form = event.target as HTMLFormElement | null;
            if (!form) return;

            ReactGA.event("submit", {
                category: "Form",
                action: "Submitted",
                label: form.getAttribute("name") || "Unnamed Form",
            });
        };

        document.addEventListener("click", trackOutboundLinks);
        document.addEventListener("click", trackButtonClicks);
        document.addEventListener("submit", trackFormSubmit);
        window.addEventListener("scroll", trackScroll);

        return () => {
            document.removeEventListener("click", trackOutboundLinks);
            document.removeEventListener("click", trackButtonClicks);
            document.removeEventListener("submit", trackFormSubmit);
            window.removeEventListener("scroll", trackScroll);
        };
    }, [location]);

    return null;
};
