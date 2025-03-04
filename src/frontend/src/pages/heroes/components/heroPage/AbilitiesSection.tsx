import React, { useEffect, useState } from 'react';
import styles from "./abilities_section.module.scss";
import axios from "axios";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { handleAbilitiesData } from '../../../../utils/handleAbilitiesData';
import { AbilityData } from '../../../../utils/handleAbilitiesData';
import {fetchAbilityImages} from "../../../../utils/abilityUtils";

const replacements_heroes: { [key: string]: string } = {
    'roshan': 'arc_warden',
    'creep': 'chen',
    'aghanim': 'meepo',
    'wraith_king': 'skeleton_king',
    'shadow_fiend': 'nevermore',
    'necrophos': 'necrolyte',
    'nature\'s_prophet': 'furion',
    'vengeful_spirit': 'vengefulspirit',
    'anti-mage': 'antimage',
    'zeus': 'zuus',
};



interface AbilitiesSectionProps {
    heroName: string;
}

const AbilitiesSection: React.FC<AbilitiesSectionProps> = ({ heroName }) => {
    const [heroAbilities, setHeroAbilities] = useState<{
        [key: string]: AbilityData;
    } | null>(null);

    const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
    const [isVideoLoaded, setVideoLoaded] = useState(false);
    const [abilitiesSrcs, setAbilitiesSrcs] = useState<{ [key: string]: string | null }>({});
    const [imageSrc, setImageSrc] = useState('');
    const [videoSrc, setVideoSrc] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        axios.get(`${API_URL}/hero/${heroName}`)
            .then(response => {
                handleAbilitiesData(response.data.abilities, setHeroAbilities);
                console.log(response.data.abilities)
            })
            .catch(error => {
                console.error('Error fetching hero data:', error);
            });
    }, [API_URL, heroName]);

    useEffect(() => {
        if (heroAbilities) {
            const fetchImages = async () => {
                try {
                    const images = await fetchAbilityImages(heroAbilities);
                    setAbilitiesSrcs(images);
                } catch (error) {
                    console.error('Error fetching ability images:', error);
                }
            };

            fetchImages();
        }
    }, [heroAbilities]);

    const tryLoadResource = (type: 'jpg' | 'webm', name: string, selectedAbility: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const src = `https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/abilities/${name}/${selectedAbility}.${type}`;
            const resource = type === 'jpg' ? new Image() : document.createElement('video');
            resource.src = src;

            if (type === 'jpg') {
                resource.onload = () => resolve(src);
                resource.onerror = () => reject();
            } else if (type === 'webm') {
                resource.onloadeddata = () => resolve(src);
                resource.onerror = () => reject();
            }
        });
    };



    useEffect(() => {
        const attemptLoadResources = async () => {
            if (!selectedAbility || !heroName) return;
            setIsLoading(true);
            let modifiedHeroName = heroName;
            let modifiedAbility = selectedAbility;

            const replacementHeroName = replacements_heroes[heroName];
            if (replacementHeroName) {
                modifiedHeroName = replacementHeroName;
                modifiedAbility = selectedAbility.replace(heroName, replacementHeroName);
            }

            try {
                const pendingImageSrc = await tryLoadResource('jpg', modifiedHeroName, modifiedAbility);
                const pendingVideoSrc = await tryLoadResource('webm', modifiedHeroName, modifiedAbility);

                setImageSrc(pendingImageSrc);
                setVideoSrc(pendingVideoSrc);
            } catch (e) {
                setVideoSrc('noFound');
            } finally {
                setIsLoading(false);
            }
        };

        attemptLoadResources();
    }, [heroName, selectedAbility]);





    useEffect(() => {
        if (heroAbilities && !selectedAbility) {
            const firstAbility = Object.keys(heroAbilities)[0];
            setSelectedAbility(firstAbility);
        }
    }, [heroAbilities]);

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
                            {selectedAbility && imageSrc && !isVideoLoaded && (
                                <img
                                    src={imageSrc}
                                    alt="Ability preview"
                                    className={styles.render2ImageSmall}
                                />
                            )}
                            {videoSrc && videoSrc !== 'noFound' ? (
                                    <video
                                        className={styles.render2videoElement}
                                        src={videoSrc}
                                        autoPlay
                                        loop
                                        muted
                                        onLoadedData={() => setVideoLoaded(true)}
                                        style={{display: isVideoLoaded ? 'block' : 'none'}}
                                    />
                                ) :
                                <img className={styles.render2ImageSmall} src={"/noFound.png"} alt="noFound"/>
                            }
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
                                                onClick={() => setSelectedAbility(key)}
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
