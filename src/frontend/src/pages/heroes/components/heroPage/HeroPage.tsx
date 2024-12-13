import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './hero_page.module.scss';
import { getImageUrl } from '../../../../utils/r2Storage';

interface HeroTalents {
    [key: string]: any;
}

interface AddonData {
    [key: string]: string;
}

const HeroPage: React.FC = () => {
    const { name } = useParams<{ name: string }>();
    const [heroTalents, setHeroTalents] = useState<HeroTalents | null>(null);
    const [selectedPart, setSelectedPart] = useState<string>('1');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [generalTalents, setGeneralTalents] = useState<AddonData | null>(null);
    const [imageSrcs, setImageSrcs] = useState<{ [key: string]: string | null }>({});
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

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

    useEffect(() => {
        axios.get(`${API_URL}/hero/${name}`)
            .then(response => {
                setHeroTalents(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching hero data:', error);
                setError('Failed to fetch hero data.');
                setLoading(false);
            });
    }, [API_URL, name]);

    useEffect(() => {
        const fetchImages = async () => {
            console.log(1)
            const parts = heroTalents?.talents_information[selectedPart] || {};
            const newImageSrcs: { [key: string]: string | null } = {};

            let levelIndex = 0;
            for (const level in parts) {
                const talents = parts[level];

                for (let i = 0; i < talents.length; i++) {
                    const talent = talents[i];

                    if (talent && !talent.includes("empty")) {
                        const imageSrc = await getImageForHero(talent);
                        newImageSrcs[`${levelIndex}-${i}`] = imageSrc;
                    } else {
                        newImageSrcs[`${levelIndex}-${i}`] = null;
                    }
                }
                levelIndex++;
            }

            setImageSrcs(newImageSrcs);
        };

        if (heroTalents) {
            fetchImages();
        }
    }, [heroTalents, selectedPart]);

    useEffect(() => {
        const fetchBackgroundImage = async () => {
            let backgroundFileName;
            switch (selectedPart) {
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

            const objectKey = `images/heroes/talents/talents_backgrounds/${name}_${backgroundFileName}.webp`;

            const imageUrl = await getImageUrl(objectKey);
            if (imageUrl) {
                setBackgroundImage(imageUrl);
            }
        };

        fetchBackgroundImage();
    }, [selectedPart, name]);

    const handleButtonClick = (part: string) => {
        setSelectedPart(part);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!heroTalents) {
        return <div>No data available for this hero.</div>;
    }

    const getImageForHero = async (talent: string) => {
        const parts = talent.split(', ');

        if (parts.length > 3) {
            const heroInfo = parts[3];
            let objectKey;

            if (heroInfo.includes('/')) {
                const [heroName, imageNumber] = heroInfo.split('/');
                objectKey = `images/heroes/talents/${heroName}/${imageNumber}.webp`;
            } else {
                objectKey = `images/heroes/talents/other/${heroInfo}.webp`;
            }

            const imageUrl = await getImageUrl(objectKey);
            if (imageUrl) {
                return imageUrl;
            } else {
                console.error(`Image not found for ${heroInfo}`);
            }
        }
        return null;
    };

    const getTalentText = (talent: string) => {
        const parts = talent.split(', ');
        if (parts.length > 1) {
            const talentText = parts[1];
            if (talentText.includes('modifier_') && heroTalents.talents_description) {
                const key = talentText.substring(1) + '_0';
                return heroTalents.talents_description[key] || null;
            } else if (talentText.includes('woda_talent_') && generalTalents) {
                const key = talentText.substring(1) + '_0';
                return generalTalents[key] || null;
            }
        }
        return null;
    };

    const renderTalents = (part: string) => {
        const talents = heroTalents.talents_information;

        if (!talents || !talents[part]) {
            return <div>No talents available for this part.</div>;
        }

        const selectedTalents = talents[part];
        const gridData: (string | null)[][] = [];

        for (let i = 0; i < 7; i++) {
            const talentIndex = i + 1;
            if (selectedTalents[talentIndex]) {
                gridData.push(selectedTalents[talentIndex]);
            } else {
                gridData.push(Array(5).fill(null));
            }
        }

        const renderText = (text: string) => {
            return text.split('\n').map((line, index) => {
                let content;
                try {
                    const parsedLine = JSON.parse(line);
                    if (parsedLine.text && parsedLine.color) {
                        content = <div key={index} style={{ color: parsedLine.color }}>{parsedLine.text}</div>;
                    } else {
                        content = <div key={index}>{line}</div>;
                    }
                } catch (e) {
                    content = <div key={index}>{line}</div>;
                }

                return (
                    <div key={index} style={line.trim() === '' ? { marginBottom: '1em' } : {}}>
                        {content}
                    </div>
                );
            });
        };

        return (
            <div className={styles.container}>
                <div className={styles.div_container_sides}>
                    <div className={styles.div_text}>1</div>
                    <div className={styles.arrows_container}>
                        <div className={`${styles.arrow} ${styles.arrow_left}`}>
                            <div className={`${styles.arrow_line} ${styles.arrow_line_1}`}></div>
                            <div className={`${styles.arrow_line} ${styles.arrow_line_2}`}></div>
                        </div>
                    </div>
                    <div className={styles.div_text}>2</div>
                </div>
                <div className={styles.grid} style={{ backgroundImage: `url(${backgroundImage})`}}>
                    {gridData.map((row, rowIndex) => (
                        row.map((item, colIndex) => {
                            const imageSrc = imageSrcs[`${rowIndex}-${colIndex}`] || null;
                            let text = item ? getTalentText(item) : null;
                            return (
                                <div key={`${rowIndex}-${colIndex}`} className={styles.square}>
                                    {text ?
                                        <div className={styles.menu}>
                                            <div>{renderText(text)}</div>
                                        </div>
                                        : null}
                                    {imageSrc ? <img className={styles.square_img} src={imageSrc} alt={"item"}/> : ''}
                                </div>
                            );
                        })
                    ))}
                </div>
                <div className={styles.div_container_sides}>
                    <div className={styles.arrows_container}>
                        <div className={`${styles.arrow} ${styles.arrow_right}`}>
                            <div className={`${styles.arrow_line} ${styles.arrow_line_1}`}></div>
                            <div className={`${styles.arrow_line} ${styles.arrow_line_2}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.div}>
            <div className={styles.div_hero}>
                <div className={styles.div_name_hero}>{name} Talents</div>
                <div className={styles.div_hero_talents}>
                    <button onClick={() => handleButtonClick('1')}>str</button>
                    <button onClick={() => handleButtonClick('2')}>agi</button>
                    <button onClick={() => handleButtonClick('3')}>int</button>
                </div>
            </div>
            {renderTalents(selectedPart)}
            <div className={styles.div_soon}>Soon...</div>
        </div>
    );
};

export default HeroPage;
