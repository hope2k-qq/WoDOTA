import React, {useEffect, useMemo, useState} from 'react';
import styles from "./abilities_section.module.scss";
import {formatAbilityDescription} from '../../../../utils/formatAbilityDescription';
import {AbilitiesSectionProps} from '../../../../types/heroes';
import {useTranslation} from "react-i18next";
import {useAltKey} from "../../../../hooks/useAltKey";


const AbilitiesSection: React.FC<AbilitiesSectionProps> = ({
                                                               heroName,
                                                               heroAbilities,
                                                               heroInnate
                                                           }) => {
    const {t} = useTranslation();
    const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
    const [videoError, setVideoError] = useState(false);
    const [imgSrc, setImgSrc] = useState("");
    const altPressed = useAltKey();

    const combinedAbilities = useMemo(() => {
        const result: any[] = [];

        if (heroInnate) {
            const innateKey = Object.keys(heroInnate)[0];

            if (innateKey) {
                result.push({
                    key: `innate_${innateKey}`,
                    originalKey: innateKey,
                    ...heroInnate[innateKey],
                    isInnate: true
                });
            }
        }

        // NORMAL abilities
        if (heroAbilities) {
            Object.entries(heroAbilities).forEach(([key, value]) => {
                result.push({
                    key,
                    originalKey: key,
                    ...value,
                    isInnate: false
                });
            });
        }

        return result;
    }, [heroInnate, heroAbilities]);


    // Анимация fade
    // useEffect(() => {
    //     if (selectedAbility) {
    //
    //         setIsFading(true);
    //
    //         const timeout = setTimeout(() => {
    //             setIsFading(false);
    //         }, 400);
    //
    //         return () => clearTimeout(timeout);
    //     }
    // }, [selectedAbility]);

    useEffect(() => {
        setVideoError(false);
    }, [selectedAbility]);

    useEffect(() => {
        if (!combinedAbilities.length) return;

        setSelectedAbility(prev =>
            prev && combinedAbilities.some(a => a.key === prev)
                ? prev
                : combinedAbilities[0].key
        );
    }, [combinedAbilities]);

    const parseAbilityDescription = (description: string = "") => {

        return description
            .replace('\\n', '')
            .split(/(\{"text":.*?\})/g)
            .map((part, index) => {

                try {

                    const parsed = JSON.parse(part);

                    if (parsed.text && parsed.color) {

                        return (
                            <span
                                key={index}
                                style={{color: parsed.color}}
                            >
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

    const getAbilityIcon = (key: string, ability: any) => {
        if (ability?.isInnate) {
            return "https://cdn.wodota.net/abilities/innate_icon.png";
        }

        return `https://cdn.wodota.net/abilities/${key}.webp`;
    };

    const selected = useMemo(() => {
        return combinedAbilities.find(a => a.key === selectedAbility) || null;
    }, [combinedAbilities, selectedAbility]);

    useEffect(() => {
        if (!selected?.originalKey) return;

        const primarySrc = `https://cdn.wodota.net/abilities/${selected.originalKey}.webp`;

        const fallbackSrc =
            "https://cdn.wodota.net/abilities/innate_icon.png";

        const img = new Image();

        img.onload = () => {
            setImgSrc(primarySrc);
        };

        img.onerror = () => {
            setImgSrc(fallbackSrc);
        };

        img.src = primarySrc;
    }, [selected?.originalKey]);


    const renderAbilities2 = () => {

        if (
            !combinedAbilities ||
            Object.keys(combinedAbilities).length === 0
        ) {
            return <div></div>;
        }

        return (

            <div>

                <div className={styles.render_talents_title}>
                    {t('abilities')}
                </div>

                <div className={styles.render2Container}>

                    {/* LEFT SIDE */}
                    <div className={styles.render2AbilityWrapper}>

                        {/* VIDEO */}
                        <div className={styles.render2VideoWrapper}>


                            {selected && (
                                <>
                                    {!videoError ? (
                                        <video
                                            className={styles.render2videoElement}
                                            src={`https://cdn.wodota.net/abilities_preview/video/${heroName}/${selected?.originalKey}.webm`}
                                            autoPlay
                                            loop
                                            muted
                                            poster={`https://cdn.wodota.net/abilities_preview/images/${heroName}/${selected.originalKey}.webp`}
                                            onError={(e) => {
                                                e.currentTarget.poster = "/noFound.png";
                                            }}
                                        />
                                    ) : (
                                        <img
                                            className={styles.render2videoElement}
                                            src="/noFound.png"
                                            alt="not found"
                                            loading="lazy"
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        <div className={styles.render2AbilitiesList}>
                            {combinedAbilities.length > 1 &&
                                combinedAbilities.map((ability) => {
                                    const isSelected = selectedAbility === ability.key;

                                    return (
                                        <div
                                            key={ability.key}
                                            className={`${styles.render2ImageWrapper} ${
                                                ability.isInnate ? '' : styles.render2ImageWrapperAbilities
                                            }`}
                                        >
                                            <img
                                                src={getAbilityIcon(ability.key, ability)}
                                                loading="lazy"
                                                alt={ability?.name || "ability"}
                                                className={`${styles.render2ImageSmall} ${
                                                    !isSelected ? styles.grayscale : ''
                                                }`}
                                                onClick={() => setSelectedAbility(ability.key)}
                                            />
                                        </div>
                                    );
                                })}
                        </div>

                    </div>

                    {/* RIGHT SIDE */}
                    <div className={styles.render2AbilityInfo}>

                        {selected && (
                            <div>
                                {/* HEADER */}
                                <div className={styles.render2AbilityInfoContainer}>

                                    <img
                                        src={imgSrc}
                                        loading="lazy"
                                        alt={selected?.name || "ability"}
                                        className={selected?.isInnate ? '' : styles.render2ImageWrapperAbilities}
                                    />
                                    <div>

                                        <div className={styles.render2AbilityName}>
                                            {selected.name || "Unknown Ability"}
                                        </div>
                                        {selected?.isInnate &&
                                            <div className={styles.render2AbilityInnate}>
                                                {t("innate_ability")}
                                            </div>
                                        }
                                        {/* DESCRIPTION */}
                                        <div
                                            className={styles.render2AbilityDescription}
                                            dangerouslySetInnerHTML={{
                                                __html: formatAbilityDescription(
                                                    selected?.description || "",
                                                    Object.fromEntries(
                                                        Object.entries(
                                                            selected?.values || {}
                                                        ).map(([key, value]) => [

                                                            key,

                                                            typeof value === "object" &&
                                                            value !== null
                                                                ? JSON.stringify(value)
                                                                : String(value)

                                                        ])
                                                    )
                                                )
                                            }}
                                        />

                                    </div>

                                </div>

                                {/* VALUES */}
                                <div className={styles.render2AbilityValuesContainer}>

                                    {/* STATS */}
                                    <div className={styles.render2AbilityValues}>

                                        {selected?.valuesInfo?.descriptions &&
                                            Object.keys(
                                                selected
                                                    ?.valuesInfo
                                                    ?.descriptions
                                            ).map((key) => (

                                                <div
                                                    key={key}
                                                    className={styles.abilityValueItem}
                                                >

                                                        <span className={styles.abilityDescription}>
    {(() => {
        const desc =
            selected?.valuesInfo?.descriptions?.[key] || "";

        return parseAbilityDescription(
            desc.startsWith("%") ? desc.slice(1).trim() : desc
        );
    })()}
</span>

                                                    {/*<span className={styles.abilityValue}>*/}
                                                    {/*    {*/}
                                                    {/*        selected*/}
                                                    {/*            ?.valuesInfo*/}
                                                    {/*            ?.values?.[key]*/}
                                                    {/*    }*/}
                                                    {/*</span>*/}
                                                    <span className={styles.abilityValue}>
{(() => {
    const baseValue = selected?.valuesInfo?.values?.[key];
    const levelUpKey = `${key}_hero_levelup`;
    const intervalKey = `${key}_levelup_interval`;

    const levelUpValue = selected?.valuesInfo?.values?.[levelUpKey];
    const interval = selected?.valuesInfo?.values?.[intervalKey];
    const intervalNum = Number(interval);
    const shouldNotSum = intervalNum > 1;

    const desc =
        selected?.valuesInfo?.descriptions?.[key] || "";

    const isPercent = desc.startsWith("%");

    const format = (v: string | number | undefined | null) =>
        v !== undefined && v !== null
            ? (() => {
                const num = Number(String(v).replace(",", "."));
                if (isNaN(num)) return v;

                const rounded = Math.round(num * 100) / 100;

                const final =
                    Number.isInteger(rounded)
                        ? Math.trunc(rounded)
                        : rounded;

                return `${final}${isPercent ? "%" : ""}`;
            })()
            : v;

    const levelText =
        intervalNum > 1
            ? `${t("every_levels1")} ${intervalNum}${t("every_levels2")}`
            : t("per_level");


    const finalValue =
        shouldNotSum
            ? baseValue
            : Number(baseValue) + Number(levelUpValue);

    if (levelUpValue && baseValue !== undefined) {
        return (
            <>
                {format(finalValue)}
                <span className={styles.heroLevelup}>
                    {altPressed ? (
                        <span className={styles.heroLevelupTextAlt}>
                            {" "}(
                            {Number(baseValue) === 0
                                ? `${format(levelUpValue)} ${levelText})`
                                : `${format(baseValue)} ${
                                    Number(levelUpValue) < 0 ? "-" : "+"
                                } ${format(Math.abs(Number(levelUpValue)))} ${levelText})`
                            }
                        </span>
                    ) : (
                        <img
                            src="https://cdn.wodota.net/abilities/innate_icon_small.png"
                            alt="level up"
                            className={styles.levelupIcon}
                        />
                    )}
                </span>
            </>
        );
    }

    return format(baseValue);
})()}
</span>

                                                </div>
                                            ))}

                                    </div>

                                    {/* FIELDS */}
                                    <div className={styles.render2AbilityFields}>

                                        {/* COOLDOWN */}
                                        {selected?.values?.abilitycooldown &&
                                            selected?.values?.abilitycooldown !== "0" && (() => {

                                                const cooldown = selected?.values?.abilitycooldown;
                                                const levelup = Number(
                                                    selected?.values?.abilitycooldown_hero_levelup || 0
                                                );

                                                const formatCooldown = (value: string | number) => {
                                                    if (typeof value === "string") {
                                                        return value
                                                            .split(" ")
                                                            .map(v => Number(v) + levelup)
                                                            .join(" / ");
                                                    }

                                                    return Number(value) + levelup;
                                                };

                                                return (
                                                    <div className={styles.render2FieldItem}>
                                                        <img
                                                            src={"/cooldown.png"}
                                                            alt={"cooldown"}
                                                            loading="lazy"
                                                        />

                                                        {formatCooldown(cooldown)}
                                                    </div>
                                                );
                                            })()}

                                        {/* MANA */}
                                        {selected?.values?.abilitymanacost &&
                                            selected?.values?.abilitymanacost !== "0" && (

                                                <div className={styles.render2FieldItem}>

                                                    <div className={styles.mana_icon}></div>

                                                    {typeof selected
                                                        ?.values
                                                        ?.abilitymanacost === 'string'

                                                        ? selected
                                                            .values
                                                            .abilitymanacost
                                                            .split(' ')
                                                            .join(' / ')

                                                        : selected
                                                            ?.values
                                                            ?.abilitymanacost
                                                    }

                                                </div>
                                            )}

                                        {/* CAST RANGE */}
                                        {selected?.values?.abilitycastrange &&
                                            selected?.values?.abilitycastrange !== "0" && (

                                                <div className={styles.render2FieldItem}>

                                                    <img
                                                        src={"/castrange.png"}
                                                        alt={"castrange"}
                                                        loading="lazy"
                                                    />

                                                    {typeof selected
                                                        ?.values
                                                        ?.abilitycastrange === 'string'

                                                        ? selected
                                                            .values
                                                            .abilitycastrange
                                                            .split(' ')
                                                            .join(' / ')

                                                        : selected
                                                            ?.values
                                                            ?.abilitycastrange
                                                    }

                                                </div>
                                            )}

                                    </div>

                                    {/* LORE */}
                                    {selected?.lore && (

                                        <div className={styles.lore_container}>
                                            <div>
                                                {selected?.lore}
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

    return renderAbilities2();
};

export default AbilitiesSection;