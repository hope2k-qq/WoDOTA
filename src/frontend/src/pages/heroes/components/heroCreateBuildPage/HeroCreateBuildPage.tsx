import React, { useEffect, useState } from 'react';
import {HeroInformation} from "../../../../types/heroes";
import RenderTalents from "../heroPage/RenderTalents";

export const HeroBuildCreatePage: React.FC = () => {
    const [heroInformation, setHeroInformation] = useState<HeroInformation | null>(null);
    const [heroName, setHeroName] = useState<string | null>(null);

    const fetchHeroDataFromCache = (heroName: string) => {
        const cachedData = localStorage.getItem('heroesData');

        if (cachedData) {
            const heroesData = JSON.parse(cachedData);

            const heroData = heroesData[heroName];

            if (heroData) {
                return heroData;
            } else {
                return null;
            }
        }

        return null;
    };


    useEffect(() => {
        let data;
        if(heroName){
            data = fetchHeroDataFromCache(heroName);
        } else{
            setHeroName("axe")
            data = fetchHeroDataFromCache("axe");
        }
        if (data) {
            setHeroInformation(data);
        } else {
        }
    }, [heroName]);



    return (
        <div>
            <RenderTalents
                hero_name={heroName || 'slark'}
                talents_information={heroInformation?.talents_information || {}}
                talents_description={heroInformation?.talents_description || {}}
                isBuild={false}
            />
        </div>
    );
};
