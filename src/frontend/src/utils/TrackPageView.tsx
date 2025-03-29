import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

export const TrackPageView = () => {
    const location = useLocation();

    useEffect(() => {
        if (window.location.hostname === "wodota.pro" && !window.GA_INITIALIZED) {
            const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
            if (measurementId) {
                ReactGA.initialize(measurementId);
                window.GA_INITIALIZED = true;
            } else {
                console.error("GA Measurement ID is missing in the environment variables");
            }
        }


        ReactGA.send({ hitType: "pageview", page: location.pathname });

        return () => {};
    }, [location]);

    return null;
};
