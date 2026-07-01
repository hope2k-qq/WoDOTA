import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AboutIntroSection } from "./components/aboutIntro/AboutIntroSection";
import { AuthorSection } from "./components/author/AuthorSection";
import { EarlyWorksSection } from "./components/earlyWorks/EarlyWorksSection";
import { HistorySection } from "./components/history/HistorySection";
import { NewsSection } from "./components/news/NewsSection";
import styles from "./about.module.scss";

const HERO_IMAGE = "/about-devices.webp";

export const AboutPage = () => {
    const { pathname } = useLocation();
    const lang = pathname.split("/")[1] || "ru";

    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        const done = () => setImageLoaded(true);
        img.onload = done;
        img.onerror = done;
        img.src = HERO_IMAGE;
        if (img.complete) done();
    }, []);

    if (!imageLoaded) {
        return <main className={styles.div} />;
    }

    return (
        <main className={styles.div}>
            <AboutIntroSection lang={lang} />
            <HistorySection />
            <EarlyWorksSection />
            <AuthorSection />
            <NewsSection />
        </main>
    );
};
