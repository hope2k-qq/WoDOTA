import React, { useState } from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import styles from './heroes_page.module.scss';
import { ReactComponent as SearchIcon } from "../../assets/icons/SearchIcon.svg";
import {useTranslation} from "react-i18next";
import {getImageUrl} from "../../utils/r2Storage";
import {useMyData} from "../../context/HeroesDataContext";

interface Hero {
    name: string;
    primary_attr: string;
    custom_hero: boolean;
    image?: string | null;
}

export const HeroesPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { heroesAttributes, languageReady } = useMyData();
    const heroes: Hero[] = heroesAttributes || [];
    const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [showCustomOnly, setShowCustomOnly] = useState<boolean>(false);
    const currentLang = location.pathname.split('/')[1];

    if (!languageReady) {
        return <div></div>;
    }

    if (!heroesAttributes) {
        return <div>Failed to fetch hero data.</div>;
    }

    const attributeTranslations: { [key: string]: string } = {
        str: t('strength'),
        agi: t('agility'),
        int: t('intelligence'),
        uni: t('universal')
    };

    const getAttributeImage = (attr: string) => {
        switch (attr) {
            case 'str':
                return '/str.png';
            case 'agi':
                return '/agi.png';
            case 'int':
                return '/int.png';
            case 'uni':
                return '/uni.png';
            default:
                return '';
        }
    };

    const filteredHeroes = heroes.filter(hero => {
        const matchesSearch = hero.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAttribute = isSearching || !selectedAttribute ? true : hero.primary_attr === selectedAttribute;
        const matchesCustom = !showCustomOnly || hero.custom_hero;
        return matchesSearch && matchesAttribute && matchesCustom;
    });


    const handleCustomOnlyChange = () => {
        setShowCustomOnly(prevState => !prevState);
    };



    const groupedHeroes = filteredHeroes.reduce((groups, hero) => {
        const { primary_attr } = hero;
        if (!groups[primary_attr]) {
            groups[primary_attr] = [];
        }
        groups[primary_attr].push(hero);
        return groups;
    }, {} as { [key: string]: Hero[] });

    const attributeOrder = ['str', 'agi', 'int', 'uni'];

    const sortedGroupedHeroes = Object.keys(groupedHeroes)
        .sort((a, b) => attributeOrder.indexOf(a) - attributeOrder.indexOf(b))
        .reduce((sorted, key) => {
            sorted[key] = groupedHeroes[key];
            return sorted;
        }, {} as { [key: string]: Hero[] });

    const handleAttributeClick = (attr: string) => {
        if (selectedAttribute === attr) {
            setSelectedAttribute(null);
        } else {
            setSelectedAttribute(attr);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        setIsSearching(value !== '');
    };

    return (
        <div className={styles['main-container']}>
            <div className={styles.title}>{t('choose_hero')}</div>
            <div className={styles['container']}>
                <div className={styles['filter-container']}>
                    <div className={styles['filter-label']}>{t('filter')}</div>
                    <div className={styles['filter-container_center']}>
                        <div className={styles['container-attribute']}>
                            <div className={styles['attribute-label']}>{t('custom')}</div>
                            <div className={styles['switch-container']}>
                                <label className={styles['switch']}>
                                    <input
                                        type="checkbox"
                                        checked={showCustomOnly}
                                        onChange={handleCustomOnlyChange}
                                    />
                                    <span className={styles['slider']}></span>
                                </label>
                            </div>
                        </div>

                        <div className={styles['container-attribute']}>
                            <div className={styles['attribute-label']}>{t('attribute')}</div>
                            <div className={styles['filter-buttons']}>
                                {['str', 'agi', 'int', 'uni'].map((attr) => (
                                    <img
                                        key={attr}
                                        src={getAttributeImage(attr)}
                                        alt={attr}
                                        className={`${styles['filter-attribute-icon']} ${selectedAttribute === attr &&
                                        !isSearching ? styles['active-icon'] : ''}`}
                                        onClick={() => handleAttributeClick(attr)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles['search-container']}>
                        <SearchIcon className={styles['search-icon']}/>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className={styles['search-input']}
                        />
                    </div>
                </div>
            </div>

            <div>
                {isSearching || showCustomOnly ? (
                    filteredHeroes.length > 0 ? (
                        <div className={styles['search-category-heroes']}>
                            {filteredHeroes.map((hero, index) => (
                                <div
                                    key={index}
                                    onClick={() => navigate(`/${currentLang}/hero/${hero.name}`)}
                                    className={styles['hero-card']}
                                >
                                    <img
                                        src={getImageUrl(`images/heroes/heroesPreview/${hero.name}.webp`)}
                                        alt={hero.name}
                                        className={styles['hero-image']}
                                        loading="lazy"
                                    />
                                    <div className={styles['hero-info']}>
                                        <img
                                            src={getAttributeImage(hero.primary_attr)}
                                            alt={hero.primary_attr}
                                            className={styles['attribute-image']}
                                        />
                                        <span className={styles['hero-name']}>
                                            {hero.name.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles['no-heroes-found-container']}>
                            <div>{t('heroes_not_found')}</div>
                        </div>

                    )
                ) : (
                    Object.keys(sortedGroupedHeroes).map((attr) => (
                        <div key={attr} className={styles.category}>
                            <div className={styles['attribute-container']}>
                                <img
                                    src={getAttributeImage(attr)}
                                    alt={attr}
                                    className={styles['attribute-icon']}
                                />
                                <div className={styles['attribute-name']}>
                                    {attributeTranslations[attr]}
                                </div>
                            </div>
                            <div className={styles['category-heroes']}>
                                {sortedGroupedHeroes[attr].map((hero, index) => (
                                    <div
                                        key={index}
                                        onClick={() => navigate(`/${currentLang}/hero/${hero.name}`)}
                                        className={styles['hero-card']}
                                    >
                                        <img
                                            src={getImageUrl(`images/heroes/heroesPreview/${hero.name}.webp`)}
                                            alt={hero.name}
                                            className={styles['hero-image']}
                                            loading="lazy"
                                        />
                                        <div className={styles['hero-info']}>
                                            <img
                                                src={getAttributeImage(hero.primary_attr)}
                                                alt={hero.primary_attr}
                                                className={styles['attribute-image']}
                                            />
                                            <span className={styles['hero-name']}>
                                                {hero.name.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
