import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './hero_page.module.scss';

interface HeroTalents {
    [key: string]: any;
}

interface AddonData {
    [key: string]: string;
}

const replacements: { [key: string]: string } = {
    'roshan': 'arc_warden',
    'creep': 'chen',
    'aghanim': 'meepo',
    'wraith_king': 'skeleton_king',
};

const HeroPage: React.FC = () => {
    const { name } = useParams<{ name: string }>();
    const [heroTalents, setHeroTalents] = useState<HeroTalents | null>(null);
    const [selectedPart, setSelectedPart] = useState<string>('1');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [addonData, setAddonData] = useState<AddonData | null>(null);


    useEffect(() => {
        const fetchAddonData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/text_data');
                setAddonData(response.data as AddonData);
            } catch (error) {
                console.error('Ошибка при получении данных:', error);
            }
        };

        fetchAddonData();
    }, []);

    useEffect(() => {
        axios.get(`http://localhost:5000/hero/${name}`)
            .then(response => {
                setHeroTalents(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching hero data:', error);
                setError('Failed to fetch hero data.');
                setLoading(false);
            });
    }, [name]);

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

    const getImageForHero = (talent: string) => {
        const parts = talent.split(', ');
        if (parts.length > 3) {
            const heroInfo = parts[3];
            if (heroInfo.includes('/')) {
                const [heroName, imageNumber] = heroInfo.split('/');
                try {
                    return require(`../../../../assets/images/heroes/talents/${heroName}/${imageNumber}_png.png`);
                } catch (err) {
                    console.error(`Image not found for ${heroName}/${imageNumber}`);
                }
            } else {
                try {
                    return require(`../../../../assets/images/heroes/talents/${heroInfo}_png.png`);
                } catch (err) {
                    console.error(`Image not found for ${heroInfo}`);
                }
            }
        }
        return null;
    };

    const getTalantText = (talent: string) => {
        const parts = talent.split(', ');
        if (parts.length > 1) {
            const talantText = parts[1];
            if (talantText.includes('#') && addonData != null) {
                const key = talantText.substring(1) + '_0';
                return addonData[key];
            } else {
                return null;
            }
        }
        return null;
    };

    const renderTalents = (part: string) => {
        const talents = heroTalents[part];
        if (!talents) {
            return <div>No talents available for this part.</div>;
        }
        const gridData: (string | null)[][] = [];
        for (let i = 0; i < 7; i++) {
            const talentIndex = i + 1;
            if (talents[talentIndex]) {
                gridData.push(talents[talentIndex]);
            } else {
                gridData.push(Array(5).fill(null));
            }
        }
        let backgroundFileName;
        switch (selectedPart) {
            case '1':
                backgroundFileName = 'background_str_png';
                break;
            case '2':
                backgroundFileName = 'background_agi_png';
                break;
            case '3':
                backgroundFileName = 'background_int_png';
                break;
            default:
                backgroundFileName = 'background_str_png';
        }
        const backgroundImage = require(`../../../../assets/images/heroes/talents/${(name ? replacements[name] || name 
            : null)}_${backgroundFileName}.png`);

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
                <div className={styles.grid} style={{backgroundImage: `url(${backgroundImage})`}}>
                    {gridData.map((row, rowIndex) => (
                        row.map((item, colIndex) => {
                            const imageSrc = item ? getImageForHero(item) : null;
                            let text = item ? getTalantText(item) : null;

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
