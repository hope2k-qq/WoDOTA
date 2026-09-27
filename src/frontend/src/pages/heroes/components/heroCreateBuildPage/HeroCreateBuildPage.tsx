import React from 'react';
import RenderTalents from "../heroPage/RenderTalents";
import {useHeroData} from "../../../../hooks/useHeroData";
import {useLang} from "../../../../hooks/useLang";

const DEFAULT_HERO = 'axe';

export const HeroBuildCreatePage: React.FC = () => {
    const lang = useLang();
    const { heroData } = useHeroData(DEFAULT_HERO, lang);

    return (
        <div>
            <RenderTalents
                hero_name={DEFAULT_HERO}
                talents_information={heroData?.talents_information || {}}
                talents_description={heroData?.talents_description || {}}
                isBuild={false}
            />
        </div>
    );
};
