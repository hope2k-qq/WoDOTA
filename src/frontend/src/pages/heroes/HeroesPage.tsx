import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/r2Storage';
import styles from './heroes_page.module.scss';
import { ReactComponent as SearchIcon } from "../../assets/icons/SearchIcon.svg";

interface Hero {
    name: string;
    primary_attr: string;
}

export const HeroesPage: React.FC = () => {
    const navigate = useNavigate();
    const [heroes, setHeroes] = useState<Hero[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<{ [key: string]: string | null }>({});
    const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchHeroesData = async () => {
            try {
                const response = await axios.get(`${API_URL}/heroes`);
                const data = response.data;
                setHeroes(data);

                const urls: { [key: string]: string | null } = {};
                for (const hero of data) {
                    const url = await getImageUrl(`images/heroes/heroesPreview/${hero.name}.webp`);
                    urls[hero.name] = url;
                }
                setImageUrl(urls);
            } catch (error) {
                console.error('Error fetching hero data:', error);
                setError('Failed to fetch hero data.');
            } finally {
                setLoading(false);
            }
        };

        fetchHeroesData().catch(err => {
            console.error('Error in fetchHeroesData:', err);
        });
    }, [API_URL]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const attributeTranslations: { [key: string]: string } = {
        str: 'СИЛА',
        agi: 'ЛОВКОСТЬ',
        int: 'ИНТЕЛЛЕКТ',
        uni: 'УНИВЕРСАЛ'
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
        return matchesSearch && matchesAttribute;
    });

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
            <div className={styles['container']}>
                <div className={styles['filter-container']}>
                    <div className={styles['filter-label']}>Фильтр</div>
                    <div className={styles['attribute-label']}>Атрибут</div>
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
                    <div className={styles['search-container']}>
                        <SearchIcon className={styles['search-icon']} />
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
                {isSearching ? (
                    filteredHeroes.length > 0 ? (
                        <div className={styles['search-category-heroes']}>
                            {filteredHeroes.map((hero, index) => (
                                <div
                                    key={index}
                                    onClick={() => navigate(`/hero/${hero.name}`)}
                                    className={styles['hero-card']}
                                >
                                    <img
                                        src={imageUrl[hero.name] || ''}
                                        alt={hero.name}
                                        className={styles['hero-image']}
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
                            <div>Герои не найдены</div>
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
                                        onClick={() => navigate(`/hero/${hero.name}`)}
                                        className={styles['hero-card']}
                                    >
                                        <img
                                            src={imageUrl[hero.name] || ''}
                                            alt={hero.name}
                                            className={styles['hero-image']}
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
