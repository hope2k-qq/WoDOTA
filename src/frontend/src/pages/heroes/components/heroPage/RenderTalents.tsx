import React, {useCallback, useEffect, useRef, useState} from 'react';
import { getImageUrl } from '../../../../utils/r2Storage';
import { Talent, AddonData, RenderTalentsProps } from '../../../../types/heroes';
import axios from 'axios';
import styles from './render_talents.module.scss';
import html2canvas from "html2canvas";
import { ReactComponent as UpdateIcon } from "../../../../assets/icons/UpdateIcon.svg";
import { ReactComponent as SaveIcon } from "../../../../assets/icons/SaveIcon.svg";
import { ReactComponent as SettingsIcon } from "../../../../assets/icons/settings_icon.svg";
import { ReactComponent as ShareIcon } from "../../../../assets/icons/ShareIcon.svg";
import {IDBPDatabase, openDB} from "idb";

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
    const [isLoading, setIsLoading] = useState(false);
    // const [error, setError] = useState<string | null>(null);
    const [isUpgradeMode, setIsUpgradeMode] = useState(false); // Можно ли качать таланты?
    const [currentTalentLevels, setCurrentTalentLevels] = useState<{ [key: string]: { [key: string]: number } }>({});
    const [upgradeOrder, setUpgradeOrder] = useState<string[]>([]);
    const [showNumbers, setShowNumbers] = useState(true);
    const [showText, setShowText] = useState(true);
    const CACHE_VERSION = 3;
    const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [rotation, setRotation] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [borderClass, setBorderClass] = useState(true); // State to track 'withBorder' class
    const [partInfo, setPartInfo] = useState("1");


    const saveGridAsImage = async () => {
        setIsLoading(true);
        if (!sectionsRef.current || sectionsRef.current.length === 0) {
            console.error("Секции талантов не найдены!");
            return;
        }

        try {
            const validSections = sectionsRef.current.filter(section => section !== null);
            if (validSections.length === 0) {
                console.error("Нет доступных секций для рендеринга!");
                return;
            }

            // 📌 1️⃣ Отключаем класс с обводкой перед созданием скриншота
            setBorderClass(false); // Temporarily remove border class

            // 📌 2️⃣ Найти все картинки с классом 'grayscale' и применить фильтр
            const imagesToRestore: { img: HTMLImageElement; originalSrc: string }[] = [];
            const tempUrls: string[] = [];
            const imagePromises: Promise<void>[] = [];

            validSections.forEach((section) => {
                const images = Array.from(section!.querySelectorAll("img.grayscale")) as HTMLImageElement[];
                images.forEach((img) => {
                    const originalSrc = img.src;
                    const promise = applyGrayscaleFilter(img).then((grayscaleSrc) => {
                        img.src = grayscaleSrc;
                        tempUrls.push(grayscaleSrc);
                        imagesToRestore.push({ img, originalSrc });
                    });
                    imagePromises.push(promise);
                });
            });

            await Promise.all(imagePromises);

            // 📌 3️⃣ Делаем снимки секций с изменёнными изображениями
            const canvases = await Promise.all(
                validSections.map(section =>
                    html2canvas(section as HTMLDivElement, {
                        useCORS: true,
                        scale: 2,
                        backgroundColor: "#12131a",
                    })
                )
            );

            // 📌 4️⃣ Восстанавливаем оригинальные картинки после рендера
            imagesToRestore.forEach(({ img, originalSrc }) => {
                img.src = originalSrc;
            });

            // 📌 5️⃣ Восстанавливаем класс с обводкой после скриншота
            setBorderClass(true); // Restore the border class

            // 📌 6️⃣ Вычисляем размеры финального изображения
            const totalWidth = canvases.reduce((sum, canvas) => sum + (canvas?.width || 0), 0);
            const maxHeight = Math.max(...canvases.map(canvas => canvas?.height || 0));

            if (totalWidth === 0 || maxHeight === 0) {
                console.error("Ошибка: получены пустые изображения!");
                return;
            }

            // 📌 7️⃣ Создаём итоговый холст
            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = totalWidth;
            finalCanvas.height = maxHeight;
            const ctx = finalCanvas.getContext("2d");

            if (!ctx) {
                console.error("Ошибка при создании контекста канваса");
                return;
            }

            // 📌 8️⃣ Объединяем все секции в один холст
            let offsetX = 0;
            canvases.forEach((canvas) => {
                ctx.drawImage(canvas, offsetX, 0);
                offsetX += canvas.width;
            });

            // 📌 9️⃣ Сохраняем итоговое изображение
            const imageUrl = finalCanvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = imageUrl;
            link.download = `${hero_name}_talents.png`;
            link.click();

            // 📌 🔟 Очистка временных объектов и канвасов
            const cleanup = () => {
                tempUrls.forEach((url) => {
                    URL.revokeObjectURL(url);
                });

                tempUrls.length = 0;
                imagesToRestore.length = 0;

                canvases.forEach((canvas) => {
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                });

                const finalCtx = finalCanvas.getContext("2d");
                if (finalCtx) {
                    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
                }

                finalCanvas.width = 0;
                finalCanvas.height = 0;
                finalCanvas.remove();

                console.log("Очистка завершена.");
            };

            cleanup();

        } catch (error) {
            console.error("Ошибка при создании изображения:", error);
        } finally {
            setIsLoading(false);
        }
    };


    const applyGrayscaleFilter = async (imgElement: HTMLImageElement): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imgElement.src;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (ctx) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.filter = "grayscale(98%)";
                    ctx.drawImage(img, 0, 0);

                    // Creating a temporary URL directly from the canvas as base64 encoded string
                    const tempUrl = canvas.toDataURL("image/png");
                    resolve(tempUrl);
                }
            };

            img.onerror = () => {
                console.error("Error loading image:", img.src);
                resolve(imgElement.src); // If an error occurs, return the original src
            };
        });
    };



    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1548) {
                setPartInfo("3");
            } else {
                setPartInfo("1");
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);







    // Функция для переключения видимости текста
    const toggleTextVisibility = () => {
        setShowText(prevState => !prevState);
    };
    const toggleNumbersVisibility = () => {
        setShowNumbers(prevState => !prevState);
    };


    const API_URL = process.env.REACT_APP_API_URL;


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

    const openHeroesDB = async () => {
        const db = await openDB('talents-db', CACHE_VERSION, {
            upgrade(db, oldVersion, newVersion) {
                if (newVersion !== null && newVersion > oldVersion) {
                    if (db.objectStoreNames.contains('meta')) {
                        db.deleteObjectStore('meta');
                    }
                    if (db.objectStoreNames.contains('talents')) {
                        db.deleteObjectStore('talents');
                    }

                    db.createObjectStore('meta', { keyPath: 'key' });
                    const talentsStore = db.createObjectStore('talents', { keyPath: 'heroName' });
                    talentsStore.createIndex('heroName', 'heroName');
                }
            }
        });

        // Проверяем кеш-версию
        const currentVersion = await db.get('meta', 'CACHE_VERSION');
        if (currentVersion?.value !== CACHE_VERSION) {
            // console.log('Кеш-версия изменилась, очищаем данные...');
            await db.clear('talents'); // Очищаем кэшированные данные
            await db.put('meta', { key: 'CACHE_VERSION', value: CACHE_VERSION }); // Сохраняем новую версию
        }

        return db;
    };

    // useEffect(() => {
    //     const fetchImages = async () => {
    //         if (!talents_information) return;
    //
    //         const allParts = talents_information || {};
    //         const newImageSrcs: { [key: string]: string | null } = {};
    //
    //         const db = await openHeroesDB();  // Открываем базу данных
    //
    //         for (const part in allParts) {
    //             const talentsByLevel = allParts[part];
    //
    //             let levelIndex = 0;
    //             for (const level in talentsByLevel) {
    //                 const talents = talentsByLevel[level];
    //
    //                 for (let i = 0; i < talents.length; i++) {
    //                     const talent = talents[i];
    //
    //                     if (talent && !talent.id.includes("empty")) {
    //                         const imageSrc = await getImageForHero(talent, db);
    //                         newImageSrcs[`${part}-${levelIndex}-${i}`] = imageSrc;
    //                     } else {
    //                         newImageSrcs[`${part}-${levelIndex}-${i}`] = null;
    //                     }
    //                 }
    //                 levelIndex++;
    //             }
    //         }
    //
    //         setImageSrcs(newImageSrcs);
    //     };
    //
    //     fetchImages();
    // }, [talents_information]);



    const getImageForHero = useCallback(async (talent: Talent, db: IDBPDatabase): Promise<Blob | null> => {
        const imagePath = talent.imagePath;
        let objectKey;
        if (imagePath.includes('/')) {
            const [heroName, imageNumber] = imagePath.split('/');
            objectKey = `images/heroes/talents/${heroName}/${imageNumber}.webp`;
        } else {
            objectKey = `images/heroes/talents/other/${imagePath}.webp`;
        }

        // Получаем данные о талантах героя из базы данных
        const heroTalentsData = await db.get('talents', hero_name);

        // Если изображение найдено в базе данных, возвращаем его
        if (heroTalentsData && heroTalentsData.talents && heroTalentsData.talents[objectKey]) {
            return heroTalentsData.talents[objectKey];  // возвращаем Blob
        }

        // Если изображение не найдено в базе данных, загружаем его с сервера
        const imageUrl = await getImageUrl(objectKey);  // Получаем URL изображения
        if (imageUrl) {
            const response = await fetch(imageUrl);
            const imageBlob = await response.blob();
            return imageBlob;  // Возвращаем Blob
        } else {
            console.error(`Image not found for ${imagePath}`);
            return null;
        }
    }, [hero_name]);

    useEffect(() => {
        const fetchImages = async () => {
            if (!talents_information) return;

            const db = await openHeroesDB();
            const allParts = Object.entries(talents_information);
            const imagesToSave: { [key: string]: Blob } = {}; // For storing images to save in the database

            const heroTalentsData = await db.get('talents', hero_name);

            const loadImagePromises = [];

            for (const [part, talentsByLevel] of allParts) {
                let levelIndex = 0;

                for (const level in talentsByLevel) {
                    const talents = talentsByLevel[level];

                    for (let i = 0; i < talents.length; i++) {
                        const talent = talents[i];
                        const key = `${part}-${levelIndex}-${i}`;

                        loadImagePromises.push(
                            (async () => {
                                let imageBlob: Blob | null = null;
                                let isImageFetchedFromServer = false;

                                if (talent && !talent.id.includes("empty")) {
                                    imageBlob = await getImageForHero(talent, db);

                                    // If image was fetched from the server, set the flag
                                    if (imageBlob && !heroTalentsData?.talents?.[key]) {
                                        isImageFetchedFromServer = true;
                                    }
                                }

                                setImageSrcs((prev) => ({
                                    ...prev,
                                    [key]: imageBlob ? URL.createObjectURL(imageBlob) : null,
                                }));

                                if (imageBlob) {
                                    imagesToSave[key] = imageBlob;
                                }

                                return isImageFetchedFromServer;
                            })()
                        );
                    }
                    levelIndex++;
                }
            }

            const results = await Promise.all(loadImagePromises);

            try {
                if (Object.keys(imagesToSave).length > 0 && results.some(result => result)) {
                    if (heroTalentsData) {
                        const updatedTalents = { ...heroTalentsData?.talents, ...imagesToSave };
                        await db.put('talents', { ...heroTalentsData, talents: updatedTalents });
                    } else {
                        //console.error('No data found for hero:', hero_name);
                    }
                } else {
                    //console.log("No new images fetched from the server. Data not saved.");
                }
            } catch (error) {
                // console.error('Error saving to DB:', error);
            }
        };

        fetchImages();
    }, [talents_information, hero_name, getImageForHero]);











    const getBackgroundForHero = async (part: string, hero_name: string, db: IDBPDatabase) => {
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

        // Получаем данные о талантах героя
        const heroTalentsData = await db.get('talents', hero_name);  // Получаем данные по герою

        // Если фон уже есть в кэше
        if (heroTalentsData && heroTalentsData.backgrounds && heroTalentsData.backgrounds[objectKey]) {
            return URL.createObjectURL(heroTalentsData.backgrounds[objectKey]);
        }

        // Если фона нет в базе данных, загружаем его с сервера
        const imageUrl = await getImageUrl(objectKey);
        if (imageUrl) {
            const response = await fetch(imageUrl);
            const imageBlob = await response.blob();

            // Сохраняем фон в базе данных для этого героя
            if (!heroTalentsData) {
                // Если данных о герое нет, создаем новые
                const newHeroData = {
                    heroName: hero_name,
                    talents: {},
                    backgrounds: { [objectKey]: imageBlob },
                };
                await db.put('talents', newHeroData);  // Добавляем в хранилище talents
            } else {
                // Если данные о герое уже есть, обновляем его фоны
                const updatedBackgrounds = { ...heroTalentsData.backgrounds, [objectKey]: imageBlob };
                await db.put('talents', { ...heroTalentsData, backgrounds: updatedBackgrounds });  // Обновляем
            }

            return URL.createObjectURL(imageBlob);
        } else {
            console.error(`Background not found for ${objectKey}`);
            return null;
        }
    };

    useEffect(() => {
        const fetchBackgroundImages = async () => {
            if (!talents_information || !hero_name) return;

            const db = await openHeroesDB(); // Открываем базу данных

            for (const part in talents_information) {
                const imageSrc = await getBackgroundForHero(part, hero_name, db);

                setBackgroundImages((prev) => ({
                    ...prev,
                    [part]: imageSrc || null,
                }));
            }
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
            //console.log("Достигнут максимальный лимит талантов (40)");
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

        setUpgradeOrder((prevOrder) => [...prevOrder, `${part}-${baseKey}-${prevOrder.length + 1}`]);
    };

    const getTalentUpgradeNumbers = (part: string, baseKey: string) => {
        const numbers = upgradeOrder
            .filter((entry) => entry.startsWith(`${part}-${baseKey}`))
            .map((entry) => entry.split("-")[2])
            .join("/");

        if (numbers.length >= 7) {
            return `${numbers.slice(0, -3)}\n${numbers.slice(-2)}`;
        }

        return numbers;
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
        setRotation((prev) => prev + 180);
        setCurrentTalentLevels({});
        setUpgradeOrder([]);
    };


    const getUpgradedTalentCount = (part: string) => {
        let totalLevel = 0;  // Сумма уровней талантов

        const talentsInPart = currentTalentLevels?.[part];

        if (!talentsInPart || typeof talentsInPart !== 'object') return totalLevel;

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
        if (!talents_information) return 0;

        // Добавляем "modifier_" в начало, если его там нет
        const formattedTalentInfo = talentInfo.startsWith("modifier_") ? talentInfo : `modifier_${talentInfo}`;

        let maxLevel = 0;

        // Перебираем все части (1, 2, 3)
        Object.values(talents_information).forEach((part: any) => {
            // Перебираем уровни внутри части
            Object.values(part).forEach((talents: any) => {
                talents.forEach((talent: any) => {
                    if (talent.id === formattedTalentInfo && talent.level) {
                        maxLevel = Math.max(maxLevel, parseInt(talent.level, 10));
                    }
                });
            });
        });

        return maxLevel;
    };













    const talentData: { [key: number]: TalentImage } = {
        1: { text: "Сила", image: "/str.png" },
        2: { text: "Ловкость", image: "/agi.png" },
        3: { text: "Интеллект", image: "/int.png" },
    };

    // const getImageForHero = async (talent: Talent) => {
    //
    //     const imagePath = talent.imagePath;
    //
    //     let objectKey;
    //     if (imagePath.includes('/')) {
    //         const [heroName, imageNumber] = imagePath.split('/');
    //         objectKey = `images/heroes/talents/${heroName}/${imageNumber}.webp`;
    //     } else {
    //         objectKey = `images/heroes/talents/other/${imagePath}.webp`;
    //     }
    //
    //     const imageUrl = await getImageUrl(objectKey);
    //     if (imageUrl) {
    //         return imageUrl;
    //     } else {
    //         console.error(`Image not found for ${imagePath}`);
    //     }
    //
    //     return null;
    // };




    // if (loading) {
    //     return <div>Loading...</div>;
    // }

    // if (error) {
    //     return <div>{error}</div>;
    // }

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
                        <div key={part} className={styles.talentSection} ref={el => (sectionsRef.current[Number(part)] = el)}>
                            {talentData[Number(part)] && isUpgradeMode && (
                                <div className={styles.talentSection_title}>
                                    <img src={talentData[Number(part)].image} alt={`Talent ${part}`}/>
                                    <div>{talentData[Number(part)].text}: {getUpgradedTalentCount(part)}</div>
                                </div>
                            )}
                            <div
                                className={styles.grid}
                                style={{backgroundImage: `url(${backgroundImages[part] || ''})`}}
                            >
                                {gridData.map((row, rowIndex) => (
                                    row.map((item, colIndex) => {
                                        const imageSrc = imageSrcs[`${part}-${rowIndex}-${colIndex}`] || null;
                                        let text = item ? getTalentText(item.talentInfo, part) : null;
                                        const isUpgradeAllowed = item ?
                                            isTalentUpgradeable(item, rowIndex, part) : false;
                                        let menuClass = '';
                                        let menuClass2 = '';
                                        let menuClass3 = '';
                                        let text2 = '';
                                        let menuClassArrow = '';
                                        if (
                                            (rowIndex === 0 && colIndex >= 0 && colIndex <= 4) ||
                                            (rowIndex === 1 && colIndex >= 0 && colIndex <= 4)
                                        ) {
                                            menuClass = styles.menu_center_down;
                                            menuClassArrow = styles.square_arrow_down;
                                        } else {
                                            menuClass = styles.menu_center_up;
                                            menuClassArrow = styles.square_arrow_up;
                                        }

                                        if (colIndex >= 0 && colIndex <= 1) {
                                            if (text !== null) {
                                                text2 = text.replace(/{[^}]*}/g, '');
                                            }
                                            if(text2 && colIndex === 1 && text2.length >= 22){
                                                menuClass3 = styles.menu_type_left_location;
                                            } else if(text2 && colIndex === 1 && text2.length < 22) {
                                                menuClass3 = styles.menu_type_center_location
                                            }
                                            menuClass2 = styles.menu_type_left;
                                        } else if (colIndex === 2) {
                                            menuClass2 = styles.menu_type_center;
                                        } else if (colIndex >= 3 && colIndex <= 4) {
                                            if (text !== null) {
                                                text2 = text.replace(/{[^}]*}/g, '');
                                            }
                                            if(text2 && colIndex === 3 && text2.length >= 22){
                                                menuClass3 = styles.menu_type_right_location;
                                            } else if(text2 && colIndex === 3 && text2.length < 22) {
                                                menuClass3 = styles.menu_type_center_location
                                            }
                                            menuClass2 = styles.menu_type_right;
                                        }
                                        return (
                                            <div key={`${rowIndex}-${colIndex}`} className={`${styles.square} ${menuClassArrow}`}
                                                 onClick={() => item && isUpgradeMode && isUpgradeAllowed && upgradeTalent(item.talentInfo, rowIndex, part)}>
                                                {showText && text ? (
                                                    <div className={`${styles.menu} ${menuClass} ${menuClass2} ${menuClass3}`}>
                                                        <div>
                                                            {renderText(text)}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {imageSrc ? (
                                                    <div
                                                        className={`${styles.imageContainer}`}>
                                                        <div style={{display: "flex"}} className={`${isUpgradeMode && borderClass && isUpgradeAllowed ? styles.withBorder : ''}`}>
                                                            <img
                                                                className={`${styles.square_img} ${isUpgradeMode && item
                                                                    ? (currentTalentLevels?.[part]?.[item.talentInfo.substring(1)] ?? -1) === -1
                                                                        ? `${styles.grayscale} grayscale`
                                                                        : `${styles.noFilter}`
                                                                    : `${styles.noFilter}`}`}
                                                                src={imageSrc}
                                                                alt="item"
                                                            />
                                                        </div>

                                                        {item && isUpgradeMode && currentTalentLevels?.[part]?.[item.talentInfo.substring(1)] > 0 && (
                                                            <>
                                                                <div className={styles.progressBar}
                                                                     style={{width: calculateProgressBarWidth(item.talentInfo, part)}}/>
                                                                {showNumbers && (
                                                                    <div className={styles.upgradeNumber}>
                                                                        {getTalentUpgradeNumbers(part, item.talentInfo.substring(1))}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                    </div>
                                                ) :
                                                    text ? (
                                                        <div className={styles.loaderContainer}>
                                                            <div className={styles.loader}></div>
                                                        </div>
                                                    ) : ''}
                                            </div>
                                        );
                                    })
                                ))}
                            </div>
                            {part === partInfo && isUpgradeMode && (
                                <div className={styles.talentSection_info}>
                                    <div>Доступно для распределения: {40 - getTotalUpgradedTalentCount()}</div>
                                    <div>Всего талантов: {getTotalUpgradedTalentCount()}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return(
        <div>
            <div className={styles.render_talents_title}>ОБ ТАЛАНТАХ:</div>
            <div className={styles.menu_container}>
                <button
                    onClick={() => setIsUpgradeMode(!isUpgradeMode)}
                    className={styles.toggleUpgrade}
                >
                    {isUpgradeMode ? "Отмена" : "Начать прокачку"}
                </button>
                {isUpgradeMode && (
                    <div className={styles.additionalButtons}>
                        <button onClick={resetAllTalents} className={styles.resetButton}>
                            <UpdateIcon className={styles.icon} style={{transform: `rotate(${rotation}deg)`}}/>
                            <span>Сбросить</span>
                            <span>&nbsp;все таланты</span>
                        </button>
                        <button onClick={() => setIsSaveModalOpen(true)} className={styles.saveButton}>
                            <SaveIcon className={styles.icon}/>
                            <div className={styles.separator}></div>
                            <span>Сохранить</span>
                        </button>
                        <div className={styles.settings} onClick={() => setIsSettingsOpen(true)}>
                            <SettingsIcon/>
                        </div>
                        {isSaveModalOpen && (
                            <div className={styles.modalOverlay} onClick={() => setIsSaveModalOpen(false)}>
                                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.settings_tittle}>Как сохранить?</div>

                                    <div className={styles.ModalSaveButtonContainer}>
                                        <button onClick={saveGridAsImage} className={styles.saveButtonInModal}>
                                            {isLoading ? (
                                                <>
                                                    <span>Загрузка</span>
                                                    <span className={styles.dots}>
                                                        <span className={styles.dot}>.</span>
                                                        <span className={styles.dot}>.</span>
                                                        <span className={styles.dot}>.</span>
                                                    </span>
                                                </>
                                            ) : (
                                                'Скачать'
                                            )}
                                        </button>
                                        <button className={styles.saveButtonInModal} disabled>
                                            <ShareIcon/>
                                            Поделиться
                                        </button>
                                    </div>

                                    <button onClick={() => setIsSaveModalOpen(false)} className={styles.closeButton}>
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        )}

                        {isSettingsOpen && (
                            <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
                                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.settings_tittle}>Настройки</div>
                                    <div className={styles.additionalButtonsWrapper}>
                                        <div className={styles['container-attribute']}>
                                            <div className={styles['slider-label']}>
                                                ЦИФРЫ
                                            </div>
                                            <div className={styles['switch-container']}>
                                                <label className={styles['switch']}>
                                                    <input
                                                        type="checkbox"
                                                        checked={showNumbers}
                                                        onChange={toggleNumbersVisibility}
                                                    />
                                                    <span className={styles['slider']}></span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className={styles['container-attribute']}>
                                            <div className={styles['slider-label']}>
                                                О ТАЛАНТАХ
                                            </div>
                                            <div className={styles['switch-container']}>
                                                <label className={styles['switch']}>
                                                    <input
                                                        type="checkbox"
                                                        checked={showText}
                                                        onChange={toggleTextVisibility}
                                                    />
                                                    <span className={styles['slider']}></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsSettingsOpen(false)} className={styles.closeButton}>
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {renderTalents()}
            {isUpgradeMode && (
                <div className={styles.menu_container_bottom}>
                    <button onClick={() => setIsSaveModalOpen(true)}
                            className={`${styles.saveButton} ${styles.saveButtonDisplay}`}>
                        <SaveIcon className={styles.icon}/>
                        <div className={styles.separator}></div>
                        <span>Сохранить</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default RenderTalents;
