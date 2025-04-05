import {HeroSection} from "./components/HeroSection";
import {AboutSection} from "./components/AboutSection";
import {FeaturesSection} from "./components/FeaturesSection";
import HeroesSection from "./components/HeroesSection";
import {JoinSection} from "./components/JoinSection";
import styles from "./home.module.scss";

export const HomePage = () => {
    return (
        <div className={styles.div}>
            <HeroSection />
            <AboutSection />
            <FeaturesSection />
            <HeroesSection />
            <JoinSection />
        </div>
    );
};