import React, { useEffect, useState } from 'react';
import styles from "./hero_page.module.scss";
import axios from "axios";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { handleAbilitiesData } from '../../../../utils/handleAbilitiesData';
import {fetchAbilityImages} from "../../../../utils/abilityUtils";

interface AbilityData {
    name: string;
    description: string;
    values: Record<string, string | { value?: string; [key: string]: any }>;
    [key: string]: string | Record<string, string | object>;
}

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
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        axios.get(`${API_URL}/hero/${heroName}`)
            .then(response => {
                handleAbilitiesData(response.data.abilities, setHeroAbilities);
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

    const renderAbilities2 = () => {
        if (!heroAbilities || Object.keys(heroAbilities).length === 0) {
            return <div>No abilities available for this hero.</div>;
        }

        return (
            <div className={styles.render2Container}>
                <div className={styles.render2AbilityWrapper}>
                    <div className={styles.render2VideoWrapper}>
                        {selectedAbility && !isVideoLoaded && (
                            <img
                                src={`https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/abilities/${heroName}/${selectedAbility}.jpg`}
                                alt="Ability preview"
                                className={styles.render2ImageSmall}
                            />
                        )}
                        <video
                            className={styles.render2videoElement}
                            src={`https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/abilities/${heroName}/${selectedAbility}.webm`}
                            autoPlay
                            loop
                            muted
                            onLoadedData={() => setVideoLoaded(true)}
                            style={{display: isVideoLoaded ? 'block' : 'none'}}
                        />
                    </div>

                    <div className={styles.render2AbilitiesList}>
                        {Object.keys(heroAbilities).map((key) => {
                            const ability = heroAbilities[key] as {
                                name: string;
                                description: string;
                                values: Record<string, any>;
                            };
                            const imageUrl = abilitiesSrcs[key];

                            return (
                                <div key={key} className={styles.render2ImageWrapper}>
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={ability.name}
                                            className={styles.render2ImageSmall}
                                            onClick={() => setSelectedAbility(key)} // При клике на изображение меняем выбранную способность
                                        />
                                    ) : (
                                        <span>Image not available</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.render2AbilityInfo}>
                    {selectedAbility && heroAbilities[selectedAbility] && (
                        <>
                            {/* Название способности */}
                            <h3 className={styles.render2AbilityName}>
                                {heroAbilities[selectedAbility].name}
                            </h3>

                            {/* Описание способности */}
                            <p
                                className={styles.render2AbilityDescription}
                                dangerouslySetInnerHTML={{
                                    __html: formatAbilityDescription(
                                        heroAbilities[selectedAbility].description,
                                        // Преобразуем все значения в строки
                                        Object.fromEntries(
                                            Object.entries(heroAbilities[selectedAbility].values).map(([key, value]) => [
                                                key,
                                                typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)
                                            ])
                                        )
                                    )
                                }}
                            />


                            {/* Проверяем значения в "values" и потом ищем в обычных полях */}
                            <div className={styles.render2AbilityValues}>
                                {heroAbilities[selectedAbility]?.values &&
                                    Object.entries(heroAbilities[selectedAbility].values).map(([valueKey, value]) => {
                                        let valueFromNormalFields = heroAbilities[selectedAbility][valueKey];

                                        // Если ключ заканчивается на "width" и значения нет, пробуем заменить "width" на "length"
                                        if (!valueFromNormalFields && valueKey.endsWith("width")) {
                                            const lengthKey = valueKey.replace("width", "length");
                                            valueFromNormalFields = heroAbilities[selectedAbility][lengthKey];
                                        }

                                        // Убедимся, что valueFromNormalFields является строкой
                                        if (typeof valueFromNormalFields !== "string") {
                                            valueFromNormalFields = "";
                                        }

                                        // Если значение из обычных полей пустое или undefined, пропускаем
                                        if (!valueFromNormalFields || valueFromNormalFields === "0" || valueFromNormalFields === "0%") {
                                            return null;
                                        }

                                        // Проверяем, начинается ли обычное поле с `%`
                                        let prefix = "";
                                        if (valueFromNormalFields.startsWith("%")) {
                                            prefix = "%";
                                            valueFromNormalFields = valueFromNormalFields.slice(1).trim(); // Убираем `%`
                                        }

                                        // Проверяем, является ли значение объектом, и извлекаем поле "value", если оно существует
                                        const formattedValue =
                                            typeof value === "object" && value !== null && "value" in value
                                                ? (value as { value: string }).value || JSON.stringify(value)
                                                : value;

                                        // Разбиваем строку на числа и добавляем `%` (если нужно), а затем меняем пробелы на "/"
                                        const valueArray = formattedValue
                                            .toString()
                                            .split(" ")
                                            .map((num: string) => {
                                                // Убираем любые лишние пробелы и добавляем "%" к числам
                                                const trimmedNum = num.trim();
                                                return `${trimmedNum}${prefix}`;
                                            });

                                        // Убираем дублирующиеся значения
                                        const uniqueValues = Array.from(new Set(valueArray));

                                        // Фильтруем нули из значений (как "0", так и "0%")
                                        const filteredValues = uniqueValues.filter((val) => val !== "0" && val !== "0%" && val !== undefined && val !== null);

                                        // Если значения из values или обычных полей равны 0, не выводим
                                        if (filteredValues.length === 0) {
                                            return null;
                                        }

                                        // Если есть отформатированное значение, выводим его
                                        return (
                                            <div key={valueKey} className={styles.render2ValueItem}>
                                                {`${valueFromNormalFields} ${filteredValues.join(" / ")}`}
                                            </div>
                                        );
                                    })}
                            </div>
                            <div className={styles.render2AbilityFields}>
                                {heroAbilities[selectedAbility]?.values?.abilitycooldown && (
                                    <div className={styles.render2FieldItem}>
                                        {`Cooldown: ${heroAbilities[selectedAbility].values.abilitycooldown}`}
                                    </div>
                                )}
                                {heroAbilities[selectedAbility]?.values?.abilitymanacost && (
                                    <div className={styles.render2FieldItem}>
                                        {`Mana: ${heroAbilities[selectedAbility].values.abilitymanacost}`}
                                    </div>
                                )}
                                {heroAbilities[selectedAbility]?.values?.abilitycastrange && (
                                    <div className={styles.render2FieldItem}>
                                        {`Сast range: ${heroAbilities[selectedAbility].values.abilitycastrange}`}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>


            </div>
        );
    };

    return (
        renderAbilities2()
    );
};

export default AbilitiesSection;
