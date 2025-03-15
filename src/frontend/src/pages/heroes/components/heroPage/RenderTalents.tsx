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
import { ReactComponent as BackIcon } from "../../../../assets/icons/BackIcon.svg";
import { ReactComponent as ErrorIcon } from "../../../../assets/icons/ErrorIcon.svg";
import { ReactComponent as SuccessIcon } from "../../../../assets/icons/SuccessIcon.svg";
import {
    CACHE_VERSION,
    cacheImage,
    clearCache,
    getCachedImage,
    getCacheVersion,
    setCacheVersion
} from "../../../../utils/dbUtils";

interface TalentImage {
    text: string;
    image: string;
}

const RenderTalents: React.FC<RenderTalentsProps> = ({ hero_name, talents_information,
                                                         talents_description,
                                                         buildCurrentTalentLevels,
                                                         buildUpgradeOrder,
                                                         isBuild}) => {
    const [generalTalents, setGeneralTalents] = useState<AddonData | null>(null);
    const [imageSrcs, setImageSrcs] = useState<{ [key: string]: string | null }>({});
    const [backgroundImages, setBackgroundImages] = useState<{ [key: string]: string | null }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isUpgradeMode, setIsUpgradeMode] = useState(false);
    const [currentTalentLevels, setCurrentTalentLevels] = useState<{ [key: string]: { [key: string]: number } }>({});
    const [upgradeOrder, setUpgradeOrder] = useState<string[]>([]);
    const [showNumbers, setShowNumbers] = useState(true);
    const [showText, setShowText] = useState(true);
    const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [rotation, setRotation] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [borderClass, setBorderClass] = useState(true);
    const [partInfo, setPartInfo] = useState("1");
    const [isOpenShare, setIsOpenShare] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success' | '' }>({ message: '', type: '' });
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;
    const [buildName, setBuildName] = useState('');
    const [buildDescription, setBuildDescription] = useState('');
    const saveGridAsImage = async () => {
        setIsLoading(true);
        if (!sectionsRef.current || sectionsRef.current.length === 0) {
            //console.error("Секции талантов не найдены!");
            return;
        }

        try {
            const validSections = sectionsRef.current.filter(section => section !== null);
            if (validSections.length === 0) {
                //console.error("Нет доступных секций для рендеринга!");
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
                //console.error("Ошибка: получены пустые изображения!");
                return;
            }

            // 📌 7️⃣ Создаём итоговый холст
            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = totalWidth;
            finalCanvas.height = maxHeight;
            const ctx = finalCanvas.getContext("2d");

            if (!ctx) {
                //console.error("Ошибка при создании контекста канваса");
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

                //console.log("Очистка завершена.");
            };

            cleanup();

        } catch (error) {
            //console.error("Ошибка при создании изображения:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFormShare = () => {
        setIsOpenShare(prevState => !prevState);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBuildName(e.target.value);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBuildDescription(e.target.value);
    };

    const validateBuild = () => {
        if (upgradeOrder.length === 0) {
            showNotification("Вы не распределили очки талантов!", "error");
            return false;
        }

        if (buildName.length < 4) {
            showNotification("Название не может быть меньше 4 символов!", "error");
            return false;
        }

        showNotification("Успешно скопировано в буфер обмена!", "success");
        return true;
    };


    const showNotification = (message: string, type: 'error' | 'success') => {
        if (timerId) {
            clearTimeout(timerId);
        }

        const oldNotificationElement = document.querySelector(`.${styles.notification}`);
        if (oldNotificationElement) {
            oldNotificationElement.classList.add(styles.hide);
            setNotification({ message: '', type: '' });
        }

        setNotification({ message, type });

        setTimeout(() => {
            const notificationElement = document.querySelector(`.${styles.notification}`);
            if (notificationElement) {
                notificationElement.classList.remove(styles.hide);
                notificationElement.classList.add(styles.show);
            }
        }, 50);

        const newTimerId = setTimeout(() => {
            const notificationElement = document.querySelector(`.${styles.notification}`);
            if (notificationElement) {
                notificationElement.classList.add(styles.hide);
            }
        }, 2500);

        setTimerId(newTimerId);
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
                //console.error("Error loading image:", img.src);
                resolve(imgElement.src); // If an error occurs, return the original src
            };
        });
    };

    const createHeroBuild = async () => {
        const now = Date.now();
        const lastSubmit = localStorage.getItem('lastHeroBuildSubmit');
        const oneMinute = 60 * 1000;
        const formatTime = (time: number) => {
            if (time % 10 === 1 && time % 100 !== 11) {
                return `${time} секунду`;
            } else if ((time % 10 >= 2 && time % 10 <= 4) && (time % 100 < 10 || time % 100 >= 20)) {
                return `${time} секунды`;
            } else {
                return `${time} секунд`;
            }
        };
        if (lastSubmit && now - parseInt(lastSubmit, 10) < oneMinute) {
            const remainingTime = Math.ceil((oneMinute - (now - parseInt(lastSubmit, 10))) / 1000);
            showNotification(`Вы можете создать новый билд через ${formatTime(remainingTime)}.`, "error");
            return;
        }

        if (!validateBuild()) return;

        try {
            const response = await fetch(`${API_URL}/create-hero-build`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    heroName: hero_name,
                    buildName,
                    buildDescription,
                    currentTalentLevels,
                    upgradeOrder,
                }),
            });

            if (!response.ok) {
                // console.error('Error:', response.statusText);
                return;
            }

            const data = await response.json();

            const currentDomain = window.location.origin;

            const updatedLink = data.link.replace(API_URL, currentDomain);


            await navigator.clipboard.writeText(updatedLink);

            localStorage.setItem('lastHeroBuildSubmit', now.toString());
            handleCloseModal();
        } catch (error) {
            // console.error('Error:', error);
        }
    };

    const handleCloseModal = () => {
        setIsSaveModalOpen(false);
        setIsOpenShare(false);
        setBuildName('');
        setBuildDescription('');
    };



    useEffect(() => {
        if (buildCurrentTalentLevels) {
            setCurrentTalentLevels(buildCurrentTalentLevels);
        }
        if (buildUpgradeOrder) {
            setUpgradeOrder(buildUpgradeOrder);
        }
    }, [buildCurrentTalentLevels, buildUpgradeOrder]);




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



    useEffect(() => {
        const fetchGeneralTalentsData = async () => {
            const cachedData = sessionStorage.getItem('generalTalents');

            if (cachedData) {
                setGeneralTalents(JSON.parse(cachedData));
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/general_talents`);
                setGeneralTalents(response.data);
                sessionStorage.setItem('generalTalents', JSON.stringify(response.data));
            } catch (error) {
                //console.error('Ошибка при получении данных:', error);
            }
        };

        fetchGeneralTalentsData().catch((error) => {
            //console.error('Promise rejected in fetchGeneralTalentsData:', error);
        });
    }, [API_URL]);


    const getBackgroundForHero = useCallback(async (part: string, hero_name: string): Promise<string | null> => {
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

        const cachedBackground = await getCachedImage(objectKey);
        if (cachedBackground) {
            //console.log("Loaded background from cache:", objectKey);
            return cachedBackground;
        }

        const imageUrl = await getImageUrl(objectKey);
        if (imageUrl) {
            try {
                const response = await fetch(imageUrl);
                const imageBlob = await response.blob();

                await cacheImage(objectKey, imageBlob);

                return URL.createObjectURL(imageBlob);
            } catch (error) {
                //console.error(`Error fetching background for ${objectKey}`, error);
                return null;
            }
        } else {
            return null;
        }
    }, []);

    useEffect(() => {
        const fetchBackgroundImages = async () => {
            if (!talents_information || !hero_name) return;

            const imageFetchPromises = Object.keys(talents_information).map(async (part) => {
                const imageSrc = await getBackgroundForHero(part, hero_name);
                setBackgroundImages((prev) => ({
                    ...prev,
                    [part]: imageSrc || null,
                }));
            });

            await Promise.all(imageFetchPromises);
        };

        fetchBackgroundImages();
    }, [talents_information, hero_name, getBackgroundForHero]);

    const getImageForHero = useCallback(async (talent: Talent): Promise<string | null> => {
        if (!talent || talent.id.includes("empty")) return null;

        const imagePath = talent.imagePath;
        const objectKey = imagePath.includes("/")
            ? `images/heroes/talents/${imagePath.replace("/", "/")}.webp`
            : `images/heroes/talents/other/${imagePath}.webp`;

        const cachedVersion = await getCacheVersion();
        if (cachedVersion !== CACHE_VERSION) {
            await clearCache();
            await setCacheVersion();
        }

        const cachedImage = await getCachedImage(objectKey);
        if (cachedImage) {
            //console.log("Loaded from cache:", objectKey);
            return cachedImage;
        }

        const loadingImage = "path/to/loading-placeholder.jpg";
        setImageSrcs(prev => ({ ...prev, [objectKey]: loadingImage }));

        try {
            const imageUrl = await getImageUrl(objectKey);
            if (!imageUrl) throw new Error(`Image not found for ${imagePath}`);

            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Сохраняем изображение в кеш
            await cacheImage(objectKey, blob);
            const imageUrlObject = URL.createObjectURL(blob);

            // Обновляем картинку в состоянии
            setImageSrcs(prev => ({ ...prev, [objectKey]: imageUrlObject }));

            return imageUrlObject;
        } catch (error) {
            //console.error(error);
            return null;
        }
    }, []);

    useEffect(() => {
        if (!talents_information) return;

        const fetchImages = async () => {
            const imagePromises: Promise<{ key: string; src: string | null }>[] = [];
            const chunkSize = 7;

            Object.entries(talents_information).forEach(([part, talentsByLevel]) => {
                let levelIndex = 0;
                Object.keys(talentsByLevel).forEach((level) => {
                    const talents = talentsByLevel[level];
                    talents.forEach((talent, i) => {
                        const key = `${part}-${levelIndex}-${i}`;
                        imagePromises.push(
                            getImageForHero(talent).then((src) => ({ key, src }))
                        );
                    });
                    levelIndex++;
                });
            });

            const processChunks = async (chunks: Promise<{ key: string; src: string | null }>[][]) => {
                for (const chunk of chunks) {
                    const results = await Promise.all(chunk);
                    const newImageSrcs: Record<string, string | null> = {};
                    results.forEach(({ key, src }) => {
                        newImageSrcs[key] = src;
                    });
                    setImageSrcs((prev) => ({ ...prev, ...newImageSrcs }));
                }
            };

            // Создаем массив чанкованных обещаний
            const chunks: Promise<{ key: string; src: string | null }>[][] = [];
            for (let i = 0; i < imagePromises.length; i += chunkSize) {
                chunks.push(imagePromises.slice(i, i + chunkSize));
            }

            // Обрабатываем каждый чанк обещаний
            await processChunks(chunks);
        };
        fetchImages();
    }, [talents_information, getImageForHero]);










    const getTalentText = (talent: string, part: string) => {
        if (!talent) return null;

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

        if (talent.conflict) {
            for (const conflict of talent.conflict) {
                for (let i = 0; i <= 3; i++) {
                    if (currentTalentLevels?.[i]?.[conflict] > 0 && talent.id !== conflict) {
                        return false;
                    }
                }
            }
        }

        const upgradedCount = getUpgradedTalentCount(part);
        const maxUnlockedRow = Math.floor(upgradedCount / 4);

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
            .filter((entry) => new RegExp(`^${part}-${baseKey}-`).test(entry))
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

    const removeLastUpgrade = () => {
        if (upgradeOrder.length === 0) return;

        const lastUpgrade = upgradeOrder[upgradeOrder.length - 1];
        const [part, baseKey] = lastUpgrade.split("-");

        setUpgradeOrder((prevOrder) => prevOrder.slice(0, -1));

        setCurrentTalentLevels((prev) => {
            const newPart = { ...prev[part] };

            const newLevel = Math.max((prev[part]?.[baseKey] ?? 1) - 1, 0);

            if (newLevel === 0) {
                delete newPart[baseKey];
            } else {
                newPart[baseKey] = newLevel;
            }

            return {
                ...prev,
                [part]: newPart,
            };
        });
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

        function formatText(text: string) {
            text = text.replace(/\n\n/g, '<div style="margin-bottom: 1.2rem"></div>');
            text = text.replace(/\n/g, '<br>');
            return text;
        }



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
                        <div key={part} className={styles.talentSection}
                             ref={el => (sectionsRef.current[Number(part)] = el)}>
                            {talentData[Number(part)] && (!isBuild ? isUpgradeMode : true) && (
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
                                            if (text2 && colIndex === 1 && text2.length >= 22) {
                                                menuClass3 = styles.menu_type_left_location;
                                            } else if (text2 && colIndex === 1 && text2.length < 22) {
                                                menuClass3 = styles.menu_type_center_location
                                            }
                                            menuClass2 = styles.menu_type_left;
                                        } else if (colIndex === 2) {
                                            menuClass2 = styles.menu_type_center;
                                        } else if (colIndex >= 3 && colIndex <= 4) {
                                            if (text !== null) {
                                                text2 = text.replace(/{[^}]*}/g, '');
                                            }
                                            if (text2 && colIndex === 3 && text2.length >= 22) {
                                                menuClass3 = styles.menu_type_right_location;
                                            } else if (text2 && colIndex === 3 && text2.length < 22) {
                                                menuClass3 = styles.menu_type_center_location
                                            }
                                            menuClass2 = styles.menu_type_right;
                                        }
                                        return (
                                            <div key={`${rowIndex}-${colIndex}`}
                                                 className={`${styles.square} ${menuClassArrow}`}
                                                 onClick={() => item && isUpgradeMode && !isBuild && isUpgradeAllowed && upgradeTalent(item.talentInfo, rowIndex, part)}>
                                                {showText && text ? (
                                                    <div
                                                        className={`${styles.menu} ${menuClass} ${menuClass2} ${menuClass3}`}>
                                                        <div dangerouslySetInnerHTML={{__html:  formatText(text)}}/>
                                                    </div>
                                                ) : null}
                                                {imageSrc ? (
                                                        <div
                                                            className={`${styles.imageContainer} ${showText ? '' : styles.noPseudo}`}>
                                                            <div style={{display: "flex"}}
                                                                 className={`${isUpgradeMode && !isBuild && borderClass && isUpgradeAllowed ? styles.withBorder : ''}`}>
                                                                <img
                                                                    className={`${styles.square_img} ${(!isBuild ? isUpgradeMode : true) && item
                                                                        ? (currentTalentLevels?.[part]?.[item.talentInfo.substring(1)] ?? -1) === -1
                                                                            ? `${styles.grayscale} grayscale`
                                                                            : `${styles.noFilter}`
                                                                        : `${styles.noFilter}`}`}
                                                                    src={imageSrc}
                                                                    alt="item"
                                                                />
                                                            </div>

                                                            {item && (!isBuild ? isUpgradeMode : true) && currentTalentLevels?.[part]?.[item.talentInfo.substring(1)] > 0 && (
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
                                                        <div className={`${styles.loaderContainer}`}>
                                                            <img className={`${styles.square_img}`} src={"/load_img.png"} alt="loader" />
                                                            <div className={styles.loader}></div>
                                                        </div>
                                                    ) : ''}
                                            </div>
                                        );
                                    })
                                ))}
                            </div>
                            {part === partInfo && (!isBuild ? isUpgradeMode : true) && (
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
            {!isBuild && (
                <div className={styles.render_talents_title}>О ТАЛАНТАХ:</div>
            )}
            {!isBuild && (
                <div className={styles.div_container}>
                    {notification.message && (
                        <div
                            className={`${styles.notification} ${styles.show} ${notification.type === 'error' ? styles.error : styles.success}`}>
                            {notification.type === 'error' ? <ErrorIcon/> : <SuccessIcon/>}
                            <div>{notification.message}</div>
                        </div>
                    )}


                    <div className={styles.menu_container}>
                        <button
                            onClick={() => setIsUpgradeMode(!isUpgradeMode)}
                            className={styles.toggleUpgrade}
                        >
                            {isUpgradeMode ? "Отмена" : "Начать прокачку"}
                        </button>
                        {isUpgradeMode && (
                            <div className={styles.additionalButtons}>
                                <div className={styles.back_container} onClick={removeLastUpgrade}><BackIcon/></div>
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
                                    <div className={styles.modalOverlay}>
                                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                            <div className={styles.cross} onClick={handleCloseModal}>
                                                <div className={styles.line}></div>
                                                <div className={styles.line}></div>
                                            </div>
                                            <div className={styles.settings_tittle}>Как сохранить?</div>

                                            <div className={styles.ModalSaveButtonContainer}>
                                                <button onClick={saveGridAsImage}
                                                        className={styles.saveButtonInModal}>
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
                                                <button className={styles.shareButtonInModal}
                                                        onClick={toggleFormShare}>
                                                    <ShareIcon/>
                                                    Поделиться
                                                </button>
                                                {isOpenShare && (
                                                    <div className={styles.shareInfo}>
                                                        <input
                                                            type="text"
                                                            placeholder="Название билда"
                                                            maxLength={100}
                                                            className={styles.heroNameInput}
                                                            value={buildName}
                                                            onChange={handleNameChange}
                                                        />
                                                        <textarea
                                                            placeholder="Описание билда"
                                                            className={styles.heroDescriptionInput}
                                                            maxLength={5000}
                                                            rows={3}
                                                            value={buildDescription}
                                                            onChange={handleDescriptionChange}
                                                        />
                                                        <div className={styles.button_container}>
                                                            <button className={styles.button_confirm}
                                                                    onClick={createHeroBuild}>
                                                                Сохранить билд
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={() => setIsSaveModalOpen(false)}
                                                    className={styles.closeButton}>
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
                                            <button onClick={() => setIsSettingsOpen(false)}
                                                    className={styles.closeButton}>
                                                Закрыть
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
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
