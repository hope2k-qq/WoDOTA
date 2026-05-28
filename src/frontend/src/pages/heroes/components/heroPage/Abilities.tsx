import React, {useEffect, useState} from 'react';
import styles from "./abilities.module.scss";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { AbilitiesProps } from '../../../../types/heroes';
import {useTranslation} from "react-i18next";


const Abilities: React.FC<AbilitiesProps> = ({ heroName, heroAbilities, heroInnate  }) => {
    const {t} = useTranslation();
    const [videoLoaded, setVideoLoaded] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (!heroAbilities) return;

        Object.keys(heroAbilities).forEach((key) => {
            const img = new Image();
            img.src = `https://cdn.wodota.net/abilities_preview/images/${heroName}/${key}.webp`;
        });
    }, [heroAbilities, heroName]);

    const renderAbility = (
        key: string,
        ability: any,
        isInnate = false
    ) => {
        const formattedDescription = formatAbilityDescription(
            ability.description,
            ability.values as Record<string, string>
        );

        return (
            <div
                key={isInnate ? `innate-${key}` : key}
                className={styles.ability}
            >
                <img
                    src={
                        (isInnate
                            ? "https://cdn.wodota.net/abilities/innate_icon.png"
                            : `https://cdn.wodota.net/abilities/${key}.webp`)
                    }
                    alt={ability.name}
                    className={styles.abilityImage}
                />

                <div className={styles.abilityDetails}>
                    <div className={styles.mediaContainer}>
                        <video
                            className={styles.abilityVideo}
                            src={`https://cdn.wodota.net/abilities_preview/video/${heroName}/${key}.webm`}
                            autoPlay
                            loop
                            muted
                            onLoadedData={() =>
                                setVideoLoaded(prev => ({
                                    ...prev,
                                    [key]: true
                                }))
                            }
                            onError={() =>
                                setVideoLoaded(prev => ({
                                    ...prev,
                                    [key]: false
                                }))
                            }
                            style={{
                                display: videoLoaded[key] ? "block" : "none"
                            }}
                        />

                        {!videoLoaded[key] && (
                            <img
                                className={styles.abilityImage}
                                src={`https://cdn.wodota.net/abilities_preview/images/${heroName}/${key}.webp`}
                                alt={key}
                                onError={(e) => {
                                    e.currentTarget.src = "/noFound.png";
                                }}
                            />
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