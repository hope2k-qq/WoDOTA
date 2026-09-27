import React, {useEffect, useMemo, useState} from 'react';
import styles from "./abilities.module.scss";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { AbilitiesProps } from '../../../../types/heroes';
import {useTranslation} from "react-i18next";
import {useBackgroundPrefetch} from "../../../../hooks/useBackgroundPrefetch";
import {getImageUrl} from "../../../../utils/r2Storage";


const Abilities: React.FC<AbilitiesProps> = ({ heroName, heroAbilities, heroInnate  }) => {
    const {t} = useTranslation();
    const [videoLoaded, setVideoLoaded] = useState<{ [key: string]: boolean }>({});
    const [activated, setActivated] = useState<Set<string>>(new Set());

    useEffect(() => {
        setActivated(new Set());
        setVideoLoaded({});
    }, [heroName]);

    const prefetchUrls = useMemo(() => {
        const keys = [
            ...Object.keys(heroInnate ?? {}).slice(0, 1),
            ...Object.keys(heroAbilities ?? {})
        ];

        return [
            ...keys.map(key => getImageUrl(`abilities_preview/images/${heroName}/${key}.webp`)),
            ...keys.map(key => getImageUrl(`abilities_preview/video/${heroName}/${key}.webm`))
        ];
    }, [heroAbilities, heroInnate, heroName]);

    useBackgroundPrefetch(prefetchUrls);

    const renderAbility = (
        key: string,
        ability: any,
        isInnate = false
    ) => {
        const uid = isInnate ? `innate-${key}` : key;
        const isActive = activated.has(uid);

        const formattedDescription = formatAbilityDescription(
            ability.description,
            ability.values as Record<string, string>
        );

        return (
            <div
                key={uid}
                className={styles.ability}
                onMouseEnter={() => {
                    if (isActive) return;
                    setActivated(prev => new Set(prev).add(uid));
                }}
            >
                <img
                    src={
                        (isInnate
                            ? getImageUrl("abilities/innate_icon.png")
                            : getImageUrl(`abilities/${key}.webp`))
                    }
                    alt={ability.name}
                    className={styles.abilityImage}
                />

                <div className={styles.abilityDetails}>
                    <div className={styles.mediaContainer}>
                        {isActive && (
                            <>
                                <video
                                    className={styles.abilityVideo}
                                    src={getImageUrl(`abilities_preview/video/${heroName}/${key}.webm`)}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    onLoadedData={() =>
                                        setVideoLoaded(prev => ({
                                            ...prev,
                                            [uid]: true
                                        }))
                                    }
                                    onError={() =>
                                        setVideoLoaded(prev => ({
                                            ...prev,
                                            [uid]: false
                                        }))
                                    }
                                    style={{
                                        display: videoLoaded[uid] ? "block" : "none"
                                    }}
                                />

                                {!videoLoaded[uid] && (
                                    <img
                                        className={styles.abilityImage}
                                        src={getImageUrl(`abilities_preview/images/${heroName}/${key}.webp`)}
                                        alt={key}
                                        onError={(e) => {
                                            e.currentTarget.src = "/noFound.png";
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <div className={styles.ability_content}>
                        <div className={styles.ability_title}>
                            {ability.name}
                        </div>
                        {isInnate &&
                            <div className={styles.ability_innate}>
                                {t("innate_ability")}
                            </div>
                        }

                        <div
                            className={styles.ability_description}
                            dangerouslySetInnerHTML={{
                                __html: formattedDescription
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.abilitiesContainer}>
            {heroInnate &&
                (() => {
                    const key = Object.keys(heroInnate)[0];
                    if (!key) return null;

                    const ability = heroInnate[key];

                    return renderAbility(
                        key,
                        ability,
                        true
                    );
                })()
            }

            {Object.entries(heroAbilities ?? {}).map(([key, ability]) =>
                renderAbility(
                    key,
                    ability,
                    false
                )
            )}
        </div>
    );
};

export default Abilities;