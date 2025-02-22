import React, { useEffect, useState } from 'react';
import styles from "./abilities.module.scss";
import axios from "axios";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { handleAbilitiesData } from '../../../../utils/handleAbilitiesData';
import {fetchAbilityImages} from "../../../../utils/abilityUtils";
import { AbilityData, AbilitiesProps } from '../../../../types/heroes';


const Abilities: React.FC<AbilitiesProps> = ({ heroName }) => {
    const [heroAbilities, setHeroAbilities] = useState<{
        [key: string]: AbilityData;
    } | null>(null);
    const [abilitiesSrcs, setAbilitiesSrcs] = useState<{ [key: string]: string | null }>({});
    const [isVideoLoaded, setVideoLoaded] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL;


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


    useEffect(() => {
        axios.get(`${API_URL}/hero/${heroName}`)
            .then(response => {
                handleAbilitiesData(response.data.abilities, setHeroAbilities);
            })
            .catch(error => {
                console.error('Error fetching hero data:', error);
            });
    }, [API_URL, heroName]);

    const renderAbilities = () => {
        if (!heroAbilities || Object.keys(heroAbilities).length === 0) {
            return <div>No abilities available for this hero.</div>;
        }

        return (
            <div className={styles.abilitiesContainer}>
                {Object.keys(heroAbilities).map((key, index) => {
                    const ability = heroAbilities[key] as {
                        name: string;
                        description: string;
                        values: Record<string, any>;
                    };
                    const imageUrl = abilitiesSrcs[key];

                    const videoPath = `https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/abilities/${heroName}/${key}.webm`;
                    const imagePath = `https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/abilities/${heroName}/${key}.jpg`;
                    const formattedDescription = formatAbilityDescription(ability.description, ability.values);

                    return (
                        <div key={index} className={styles.ability}>
                            {imageUrl ? (
                                <img src={imageUrl} alt={ability.name} className={styles.abilityImage} />
                            ) : (
                                <span>Image not available</span>
                            )}
                            <div className={styles.abilityDetails}>
                                <div className={styles.mediaContainer}>
                                    {!isVideoLoaded && (
                                        <img
                                            src={imagePath}
                                            alt={ability.name}
                                            className={styles.abilityImage}
                                        />
                                    )}
                                    <video
                                        className={styles.abilityVideo}
                                        src={videoPath}
                                        autoPlay
                                        loop
                                        muted
                                        onLoadedData={() => setVideoLoaded(true)}
                                        style={{display: isVideoLoaded ? "block" : "none"}}
                                    ></video>
                                </div>
                                <div className={styles.ability_content}>
                                    <div className={styles.ability_title}>{ability.name}</div>
                                    <div className={styles.ability_description}
                                       dangerouslySetInnerHTML={{__html: formattedDescription}}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        renderAbilities()
    );
};

export default Abilities;
