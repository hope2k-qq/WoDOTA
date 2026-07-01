import React, { useCallback, useEffect, useState } from 'react';
import {HeroInformation} from "../../../../types/heroes";
import RenderTalents from "../heroPage/RenderTalents";
import {useMyData} from "../../../../context/HeroesDataContext";

export const HeroBuildCreatePage: React.FC = () => {
    const { heroesData } = useMyData();
    const [heroInformation, setHeroInformation] = useState<HeroInformation | null>(null);
    const [heroName, setHeroName] = useState<string | null>(null);

    const fetchHeroDataFromCache = useCallback((heroName: string) => {
        if (heroesData) {
            const heroData = heroesData[heroName];

            if (heroData) {
                return heroData;
            } else {
                return null;
            }
        }

        return null;
    }, [heroesData]);


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
    }, [heroName, heroesData, fetchHeroDataFromCache]);



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
