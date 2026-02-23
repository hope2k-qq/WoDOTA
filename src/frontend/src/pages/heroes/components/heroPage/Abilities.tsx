import React, { useState } from 'react';
import styles from "./abilities.module.scss";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { AbilitiesProps } from '../../../../types/heroes';


const Abilities: React.FC<AbilitiesProps> = ({ heroName, abilities, abilitiesSrcs,videoSrc, imageSrc, heroAbilities  }) => {
    const [videoLoaded, setVideoLoaded] = useState<{ [key: string]: boolean }>({});




    const renderAbilities = () => {
        if (!heroAbilities || Object.keys(heroAbilities).length === 0) {
            return <div></div>;
        }

        return (
            <div className={styles.abilitiesContainer}>
                {Object.keys(heroAbilities).map((key, index) => {
                    const ability = heroAbilities[key];
                    const imageUrl = abilitiesSrcs[key];

                    const formattedDescription = formatAbilityDescription(ability.description, ability.values as Record<string, string>);

                    return (
                        <div key={index} className={styles.ability}>
                            {imageUrl ? (
                                <img src={imageUrl} alt={ability.name} className={styles.abilityImage} />
                            ) : (
                                <span></span>
                            )}
                            <div className={styles.abilityDetails}>
                                <div className={styles.mediaContainer}>
                                    {videoSrc[key] ? (
                                        <video
                                            className={styles.abilityVideo}
                                            src={videoSrc[key]}
                                            autoPlay
                                            loop
                                            muted
                                            onLoadedData={() => setVideoLoaded((prev) => ({ ...prev, [key]: true }))}
                                            onError={() => setVideoLoaded((prev) => ({ ...prev, [key]: false }))}
                                            style={{ display: videoLoaded[key] ? "block" : "none" }}
                                        ></video>
                                    ) : null}

                                    {!videoLoaded[key] && <img className={styles.abilityImage} src={"/noFound.png"} alt="no found" />}
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