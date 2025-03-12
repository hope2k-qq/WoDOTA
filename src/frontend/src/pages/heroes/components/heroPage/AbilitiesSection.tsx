import React, { useEffect, useState } from 'react';
import styles from "./abilities_section.module.scss";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { AbilitiesSectionProps } from '../../../../types/heroes';




const AbilitiesSection: React.FC<AbilitiesSectionProps> = ({ heroName, abilities, abilitiesSrcs, videoSrc, imageSrc, heroAbilities }) => {

    const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

    const [isFading, setIsFading] = useState(false); // Стейт для контроля анимации

    useEffect(() => {
        if (selectedAbility) {
            setIsFading(true);
            setTimeout(() => setIsFading(false), 400);
        }
    }, [selectedAbility]);



    useEffect(() => {
        if (heroAbilities && !selectedAbility) {
            const firstAbility = Object.keys(heroAbilities)[0];
            setSelectedAbility(firstAbility);
        }
    }, [heroAbilities, selectedAbility]);


    const parseAbilityDescription = (description: string) => {
        return description
            .replace('\\n', '')
            .split(/(\{"text":.*?\})/g)
            .map((part, index) => {
                try {
                    const parsed = JSON.parse(part);
                    if (parsed.text && parsed.color) {
                        return (
                            <span key={index} style={{ color: parsed.color }}>
                                {parsed.text}
                            </span>
                        );
                    }
                } catch (e) {
                    return part;
                }
                return part;
            });
    };

    const renderAbilities2 = () => {
        if (!heroAbilities || Object.keys(heroAbilities).length === 0) {
            return <div></div>;
        }

        return (
            <div>
                <div className={styles.render_talents_title}>СПОСОБНОСТИ:</div>
                <div className={styles.render2Container}>
                    <div className={styles.render2AbilityWrapper}>
                        <div
                            className={`${styles.render2VideoWrapper}`}
                        >
                            {isFading && <div className={styles.fadeOverlay}></div>}
                            {selectedAbility && imageSrc[selectedAbility] && (
                                <video
                                    className={styles.render2videoElement}
                                    src={videoSrc[selectedAbility] ? videoSrc[selectedAbility] : ""}
                                    autoPlay
                                    loop
                                    muted
                                    poster={imageSrc[selectedAbility]}
                                />

                            )}
                        </div>
                        <div className={styles.render2AbilitiesList}>
                            {Object.keys(heroAbilities).map((key) => {
                                const ability = heroAbilities[key] as {
                                    name: string;
                                    description: string;
                                    values: Record<string, any>;

                                };
                                const imageUrl = abilitiesSrcs[key];
                                const selectedAbilityKey = selectedAbility != null
                                    ? Object.keys(heroAbilities).find(key => heroAbilities[key] === heroAbilities[selectedAbility])
                                    : null;
                                const isGrayScale = selectedAbilityKey === key;

                                return (
                                    <div key={key} className={styles.render2ImageWrapper}>
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={ability.name}
                                                className={`${styles.render2ImageSmall} ${isGrayScale ? '' : styles.grayscale}`}
                                                onClick={() => {
                                                    setSelectedAbility(key);

                                                }}

                                            />
                                        ) : (
                                            <span></span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.render2AbilityInfo}>
                        {selectedAbility && heroAbilities[selectedAbility] && (
                            <div>
                                <div className={styles.render2AbilityInfoContainer}>
                                    <img
                                        src={abilitiesSrcs[`${Object.keys(heroAbilities).find(key => heroAbilities[key] === heroAbilities[selectedAbility])}`] ?? undefined}
                                        alt={`${heroAbilities[selectedAbility].name}`}
                                    />

                                    <div>
                                        <div className={styles.render2AbilityName}>
                                            {heroAbilities[selectedAbility].name}
                                        </div>
                                        <div
                                            className={styles.render2AbilityDescription}
                                            dangerouslySetInnerHTML={{
                                                __html: formatAbilityDescription(
                                                    heroAbilities[selectedAbility].description,
                                                    Object.fromEntries(
                                                        Object.entries(heroAbilities[selectedAbility].values).map(([key, value]) => [
                                                            key,
                                                            typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)
                                                        ])
                                                    )
                                                )
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.render2AbilityValuesContainer}>
                                    <div className={styles.render2AbilityValues}>
                                        {heroAbilities[selectedAbility]?.valuesInfo?.descriptions &&
                                            Object.keys(heroAbilities[selectedAbility].valuesInfo.descriptions).map((key) => (
                                                <div key={key} className={styles.abilityValueItem}>
                                                <span className={styles.abilityDescription}>
                                                    {parseAbilityDescription(heroAbilities[selectedAbility]?.valuesInfo.descriptions[key])}
                                                </span>
                                                    <span className={styles.abilityValue}>
                                                    {heroAbilities[selectedAbility]?.valuesInfo.values[key]}
                                                </span>
                                                </div>
                                            ))}
                                    </div>
                                    <div className={styles.render2AbilityFields}>
                                        {heroAbilities[selectedAbility]?.values?.abilitycooldown && heroAbilities[selectedAbility]?.values?.abilitycooldown !== "0" && (
                                            <div className={styles.render2FieldItem}>
                                                <img src={"/cooldown.png"} alt={"cooldown"}/>
                                                {typeof heroAbilities[selectedAbility].values.abilitycooldown === 'string'
                                                    ? heroAbilities[selectedAbility].values.abilitycooldown.split(' ').join(' / ')
                                                    : heroAbilities[selectedAbility].values.abilitycooldown}
                                            </div>
                                        )}
                                        {heroAbilities[selectedAbility]?.values?.abilitymanacost && heroAbilities[selectedAbility]?.values?.abilitymanacost !== "0" && (
                                            <div className={styles.render2FieldItem}>
                                                <div className={styles.mana_icon}></div>
                                                {typeof heroAbilities[selectedAbility].values.abilitymanacost === 'string'
                                                    ? heroAbilities[selectedAbility].values.abilitymanacost.split(' ').join(' / ')
                                                    : heroAbilities[selectedAbility].values.abilitymanacost}
                                            </div>
                                        )}
                                        {heroAbilities[selectedAbility]?.values?.abilitycastrange && heroAbilities[selectedAbility]?.values?.abilitycastrange !== "0" && (
                                            <div className={styles.render2FieldItem}>
                                                <img src={"/castrange.png"} alt={"castrange"}/>
                                                {typeof heroAbilities[selectedAbility].values.abilitycastrange === 'string'
                                                    ? heroAbilities[selectedAbility].values.abilitycastrange.split(' ').join(' / ')
                                                    : heroAbilities[selectedAbility].values.abilitycastrange}
                                            </div>
                                        )}
                                    </div>

                                    {heroAbilities[selectedAbility]?.lore && (
                                        <div className={styles.lore_container}>
                                            <div>
                                                {`${heroAbilities[selectedAbility].lore}`}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        renderAbilities2()
    );
};

export default AbilitiesSection;
