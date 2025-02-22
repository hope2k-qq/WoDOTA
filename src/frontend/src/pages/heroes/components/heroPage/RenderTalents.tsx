import React, {useEffect, useRef, useState} from 'react';
import { getImageUrl } from '../../../../utils/r2Storage';
import { Talent, AddonData, RenderTalentsProps } from '../../../../types/heroes';
import axios from 'axios';
import styles from './render_talents.module.scss';

interface TalentImage {
    text: string;
    image: string;
}

const RenderTalents: React.FC<RenderTalentsProps> = ({ hero_name, talents_information, talents_description }) => {
    // const [heroTalents, setHeroTalents] = useState<HeroInformation | null>(null);
    const [generalTalents, setGeneralTalents] = useState<AddonData | null>(null);
    const [imageSrcs, setImageSrcs] = useState<{ [key: string]: string | null }>({});
    const [backgroundImages, setBackgroundImages] = useState<{ [key: string]: string | null }>({});
    // const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpgradeMode, setIsUpgradeMode] = useState(false); // Можно ли качать таланты?
    const [currentTalentLevels, setCurrentTalentLevels] = useState<{ [key: string]: { [key: string]: number } }>({});


    const API_URL = process.env.REACT_APP_API_URL;

    // useEffect(() => {
    //     const fetchHeroData = async () => {
    //         try {
    //             const response = await axios.get<HeroInformation>(`${API_URL}/hero/${heroName}`);
    //             setHeroTalents(response.data);
    //         } catch (error) {
    //             console.error('Error fetching hero data:', error);
    //             setError('Failed to fetch hero data.');
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //
    //     fetchHeroData();
    // }, [API_URL, hero_name]);

    useEffect(() => {
        const fetchGeneralTalentsData = async () => {
            try {
                const response = await axios.get(`${API_URL}/general_talents`);
                setGeneralTalents(response.data as AddonData);
            } catch (error) {
                console.error('Ошибка при получении данных:', error);
            }
        };

        fetchGeneralTalentsData().catch((error) => {
            console.error('Promise rejected in fetchGeneralTalentsData:', error);
        });
    }, [API_URL]);

    useEffect(() => {
        const fetchImages = async () => {
            if (!talents_information) return;

            const allParts = talents_information|| {};
            const newImageSrcs: { [key: string]: string | null } = {};

            for (const part in allParts) {
                const talentsByLevel = allParts[part];

                let levelIndex = 0;
                for (const level in talentsByLevel) {
                    const talents = talentsByLevel[level];

                    for (let i = 0; i < talents.length; i++) {
                        const talent = talents[i];
                        // console.log(talent)

                        if (talent && !talent.id.includes("empty")) {
                            const imageSrc = await getImageForHero(talent);
                            newImageSrcs[`${part}-${levelIndex}-${i}`] = imageSrc;
                        } else {
                            newImageSrcs[`${part}-${levelIndex}-${i}`] = null;
                        }
                    }
                    levelIndex++;
                }
            }

            setImageSrcs(newImageSrcs);
        };

        fetchImages();
    }, [talents_information]);

    useEffect(() => {
        const fetchBackgroundImages = async () => {
            if (!talents_information) return;

            const backgroundImages: { [key: string]: string | null } = {};

            for (const part in talents_information) {
                let backgroundFileName;
                switch (part) {
                    case '1':
                        backgroundFileName = 'background_str';
                        break;
                    case '2':
                        backgroundFileName = 'background_agi';
                        break;
                    case '3':
                        backgroundFileName = 'background_int';
                        break;
                    default:
                        backgroundFileName = 'background_str';
                }

                const objectKey = `images/heroes/talents/talents_backgrounds/${hero_name}_${backgroundFileName}.webp`;
                const imageUrl = await getImageUrl(objectKey);

                backgroundImages[part] = imageUrl || null;
            }

            setBackgroundImages(backgroundImages);
        };

        fetchBackgroundImages();
    }, [talents_information, hero_name]);

    const getTalentText = (talent: string, part: string) => {
        if (!talent) return null;

        // 🔹 Героические таланты (modifier_)
        if (talent.includes('modifier_') && talents_description) {
            const baseKey = talent.substring(1);
            const currentLevel = currentTalentLevels?.[part]?.[baseKey] ?? -1;
            const key = `${baseKey}_${currentLevel >= 0 ? currentLevel : 0}`;
            return talents_description[key] || null;
        }

        // 🔹 Стандартные таланты (woda_talent_)
        if (talent.includes('woda_talent_') && generalTalents) {
            const baseKey = talent.substring(1);
            const currentLevel = currentTalentLevels?.[part]?.[baseKey] ?? -1;
            const key = `${baseKey}_${currentLevel >= 0 ? currentLevel : 0}`;
            return generalTalents[key] || null;
        }
        return null;
    };

    const isTalentUpgradeable = (talent: Talent, rowIndex: number, part: string) => {
        // Убедитесь, что находитесь в режиме прокачки и талант не пустой
        if (!isUpgradeMode || !talent) return false;

        const totalUpgradedCount = getTotalUpgradedTalentCount();

        if (totalUpgradedCount >= 40) {
            console.log("Достигнут максимальный лимит талантов (40)");
            return false;
        }

        // Получаем количество улучшенных талантов и максимальный разблокированный ряд
        const upgradedCount = getUpgradedTalentCount(part);
        const maxUnlockedRow = Math.floor(upgradedCount / 4);

        // Проверка, что rowIndex <= maxUnlockedRow
        if (rowIndex > maxUnlockedRow) return false;

        // Если талант пустой, не прокачиваем
        if (talent.id.includes('empty_')) return false;

        const baseKey = talent.talentInfo.substring(1);

        if (talent.relatedTalent && Object.keys(talent.relatedTalent).length > 0) {
            let { relatedTalentName, requiredTalentLevel } = talent.relatedTalent;

            // Ensure relatedTalentName and requiredTalentLevel are defined
            if (relatedTalentName && requiredTalentLevel) {
                // Attempt to find the current level of the related talent
                let relatedTalentCurrentLevel = currentTalentLevels?.[part]?.[relatedTalentName];

                // If not found, try removing the 'modifier_' prefix and search again
                if (relatedTalentCurrentLevel === undefined && relatedTalentName.startsWith('modifier_')) {
                    relatedTalentName = relatedTalentName.replace(/^modifier_/, '');
                    relatedTalentCurrentLevel = currentTalentLevels?.[part]?.[relatedTalentName];
                }

                // Default to level 0 if still not found
                relatedTalentCurrentLevel = relatedTalentCurrentLevel ?? 0;

                const requiredLevel = parseInt(requiredTalentLevel, 10);

                // If the related talent hasn't reached the required level, cannot upgrade
                if (relatedTalentCurrentLevel < requiredLevel) return false;
            }
        }

        if (baseKey.includes('modifier_') && talents_description) {
            const currentLevel = currentTalentLevels?.[part]?.[baseKey] ?? 0;
            const nextLevel = currentLevel + 1;
            const nextKey = `${baseKey}_${nextLevel}`;

            if (!talents_description[nextKey]) return false;
        }



        if (baseKey.includes('woda_talent_') && generalTalents) {
            const currentLevel = currentTalentLevels?.[part]?.[baseKey] ?? 0;
            const nextLevel = currentLevel + 1;
            const nextKey = `${baseKey}_${nextLevel}`;

            if (!generalTalents[nextKey]) return false;
        }

        // Если все условия выполнены, талант можно прокачать
        return true;
    };

    const upgradeTalent = (talent: string, rowIndex: number, part: string) => {
        if (!isUpgradeMode || !talent || !part) return;

        const baseKey = talent.substring(1);
        const currentLevel = currentTalentLevels?.[part]?.[baseKey] ?? 0;
        const nextLevel = currentLevel + 1;

        setCurrentTalentLevels((prev) => ({
            ...prev,
            [part]: {
                ...prev[part],
                [baseKey]: nextLevel,
            },
        }));
    };

    const getTotalUpgradedTalentCount = () => {
        let total = 0;
        // Перебираем все части и считаем количество прокачанных талантов
        Object.keys(currentTalentLevels).forEach((part) => {
            const talents = currentTalentLevels[part] || {};
            total += Object.values(talents).reduce((sum, level) => sum + level, 0);
        });
        return total;
    };

    const resetAllTalents = () => {
        setCurrentTalentLevels({});
    };


    const getUpgradedTalentCount = (part: string) => {
        let totalLevel = 0;  // Сумма уровней талантов

        const talentsInPart = currentTalentLevels?.[part];

        if (!talentsInPart || typeof talentsInPart !== 'object') return totalLevel; // Если в этой части нет талантов или не объект, возвращаем 0

        Object.entries(talentsInPart).forEach(([key, level]) => {
            // Проверяем, что уровень таланта больше 0
            if (level >= 1) {
                // Проверяем, что ключ соответствует определенным критериям
                if (key.includes("modifier_") || key.includes("woda_talent_")) {
                    totalLevel += level;  // Прибавляем уровень таланта к общей сумме
                }
            }
        });

        return totalLevel;
    };

    const calculateProgressBarWidth = (talentInfo: string, part: string) => {
        const currentLevel = currentTalentLevels?.[part]?.[talentInfo.substring(1)] ?? 0;
        const maxLevel = getMaxTalentLevel(talentInfo.substring(1));

        if (currentLevel === 0) {
            return '0%';
        }

        const levelWidths: { [key: number]: string | string[] } = {
            1: '100%',
            2: ['50%', '100%'],
            3: ['33%', '66%', '100%'],
        };

        if (maxLevel in levelWidths) {
            const widths = levelWidths[maxLevel];

            if (Array.isArray(widths)) {
                return widths[currentLevel - 1] ?? '0%';
            }

            return widths;
        }

        return '0%';
    };




    const getMaxTalentLevel = (talentInfo: string) => {
        const getMaxLevelFromTalentKeys = (talentKeys: string[]) => {
            const talentLevels = talentKeys.filter(key => key.startsWith(talentInfo));

            if (talentLevels.length > 0) {
                return Math.max(...talentLevels.map(level => {
                    const levelMatch = level.match(/_(\d+)$/);
                    return levelMatch ? parseInt(levelMatch[1], 10) : 0;
                }));
            }

            return 0;
        };

        if (talentInfo.includes('woda_talent_') && generalTalents) {
            const talentLevels = Object.keys(generalTalents);
            const maxLevel = getMaxLevelFromTalentKeys(talentLevels);
            if (maxLevel > 0) {
                console.log(maxLevel);
                return maxLevel;
            }
        }

        if (talentInfo.includes('modifier_') && talents_description) {
            const talentLevels = Object.keys(talents_description);
            const maxLevel = getMaxLevelFromTalentKeys(talentLevels);
            if (maxLevel > 0) {
                return maxLevel;
            }
        }

        return 0;
    };











    const talentData: { [key: number]: TalentImage } = {
        1: { text: "Сила", image: "/str.png" },
        2: { text: "Ловкость", image: "/agi.png" },
        3: { text: "Интеллект", image: "/int.png" },
    };

    const getImageForHero = async (talent: Talent) => {

        const imagePath = talent.imagePath;

        let objectKey;
        if (imagePath.includes('/')) {
            const [heroName, imageNumber] = imagePath.split('/');
            objectKey = `images/heroes/talents/${heroName}/${imageNumber}.webp`;
        } else {
            objectKey = `images/heroes/talents/other/${imagePath}.webp`;
        }

        const imageUrl = await getImageUrl(objectKey);
        if (imageUrl) {
            return imageUrl;
        } else {
            console.error(`Image not found for ${imagePath}`);
        }

        return null;
    };


    // if (loading) {
    //     return <div>Loading...</div>;
    // }

    if (error) {
        return <div>{error}</div>;
    }

    if (!talents_information || !talents_description) {
        return <div>No data available for this hero.</div>;
    }

    const renderTalents = () => {
        const talents = talents_information;

        if (!talents) {
            return <div>No talents available.</div>;
        }



        const renderText = (text: string) => {
            return text.split('\n').map((line, index) => {
                const jsonMatches = line.match(/{.*?}/g);

                if (jsonMatches) {
                    let processedLine = [];
                    let lastIndex = 0;

                    jsonMatches.forEach((match) => {
                        const beforeJson = line.slice(lastIndex, line.indexOf(match));
                        const parsedLine = JSON.parse(match);

                        processedLine.push(beforeJson);
                        processedLine.push(
                            <span key={lastIndex} style={{ color: parsedLine.color, fontWeight: "bold" }}>
                        {parsedLine.text}
                    </span>
                        );

                        lastIndex = line.indexOf(match) + match.length;
                    });

                    processedLine.push(line.slice(lastIndex));

                    return <div key={index}>{processedLine}</div>;
                } else {
                    return <div key={index} style={line.trim() === '' ? { marginBottom: '1em' } : {}}>{line}</div>;
                }
            });
        };



        return (
            <div className={styles.container}>
                {Object.keys(talents).map((part) => {
                    const selectedTalents = talents[part];
                    const gridData: (Talent | null)[][] = [];

                    for (let i = 0; i < 7; i++) {
                        const talentIndex = i + 1;
                        if (selectedTalents[talentIndex]) {
                            gridData.push(selectedTalents[talentIndex]);
                        } else {
                            gridData.push(Array(5).fill(null));
                        }
                    }

                    return (
                        <div key={part} className={styles.talentSection}>
                            {talentData[Number(part)] && (
                                <div className={styles.talentSection_title}>
                                    <img src={talentData[Number(part)].image} alt={`Talent ${part}`} />
                                    <div>{talentData[Number(part)].text}: {getUpgradedTalentCount(part)}</div>
                                </div>
                            )}
                            <div
                                className={styles.grid}
                                style={{ backgroundImage: `url(${backgroundImages[part] || ''})` }}
                            >
                                {gridData.map((row, rowIndex) => (
                                    row.map((item, colIndex) => {
                                        const imageSrc = imageSrcs[`${part}-${rowIndex}-${colIndex}`] || null;
                                        let text = item ? getTalentText(item.talentInfo, part) : null;
                                        const upgradedCount = getUpgradedTalentCount(part);
                                        const hasBorder = rowIndex <= Math.floor(upgradedCount / 4);
                                        const isUpgradeAllowed = item ?
                                            isTalentUpgradeable(item, rowIndex, part) : false;
                                        let menuClass = '';
                                        if (part === '1') {
                                            menuClass = styles.menu_right;
                                        } else if (part === '2') {
                                            if (
                                                (rowIndex === 0 && colIndex >= 0 && colIndex <= 4) ||
                                                (rowIndex === 1 && colIndex >= 0 && colIndex <= 4)
                                            ) {
                                                menuClass = styles.menu_center_down;
                                            } else {
                                                menuClass = styles.menu_center_up;
                                            }

                                        } else if (part === '3') {
                                            menuClass = styles.menu_left;
                                        }
                                        return (
                                            <div key={`${rowIndex}-${colIndex}`} className={`${styles.square}`}
                                                 onClick={() => item && isUpgradeMode && isUpgradeAllowed && upgradeTalent(item.talentInfo, rowIndex, part)}>
                                                {text ? (
                                                    <div className={`${styles.menu} ${menuClass}`}>
                                                        <div>
                                                            {renderText(text)}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {imageSrc ? (
                                                    <div className={`${styles.imageContainer} ${isUpgradeMode && isUpgradeAllowed ? styles.withBorder : ''}`}>
                                                        <img
                                                            className={`${styles.square_img}`}
                                                            src={imageSrc}
                                                            alt="item"
                                                            style={{
                                                                filter: isUpgradeMode && item
                                                                    ? (currentTalentLevels?.[part]?.[item.talentInfo.substring(1)] ?? -1) === -1
                                                                        ? "grayscale(98%)"
                                                                        : "none"
                                                                    : "none",
                                                            }}
                                                        />

                                                        {item && currentTalentLevels?.[part]?.[item.talentInfo.substring(1)] > 0 && (
                                                            <div
                                                                className={styles.progressBar}
                                                                style={{
                                                                    width: calculateProgressBarWidth(item.talentInfo, part)
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                ) : ''}
                                            </div>
                                        );
                                    })
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return(
        <div>
            <div>
                <div>Доступно для рапределения: {40 - getTotalUpgradedTalentCount()}</div>
                <div>Всего талантов: {getTotalUpgradedTalentCount()}</div>
                <button onClick={resetAllTalents}>Удалить все таланты</button>
            </div>
            <button onClick={() => setIsUpgradeMode(!isUpgradeMode)} className={styles.toggleUpgrade}>
                {isUpgradeMode ? "Завершить прокачку" : "Начать прокачку"}
            </button>
            {renderTalents()}
        </div>
    );
};

export default RenderTalents;
