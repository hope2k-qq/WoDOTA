import React, {useEffect, useState} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './hero_page.module.scss'

interface HeroTalents {
    [key: string]: any;
}

export const HeroPage: React.FC = () => {
    const { name } = useParams<{ name: string }>();
    const [heroTalents, setHeroTalents] = useState<HeroTalents | null>(null);
    const [selectedPart, setSelectedPart] = useState<string>('1'); // Default to '1'
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    const renderTalents = (part: string) => {
        const talents = heroTalents[part];
        const gridData: (string | null)[][] = [];
        for (let i = 0; i < 7; i++) {
            const talentIndex = i + 1;
            if (talents[talentIndex]) {
                gridData.push(talents[talentIndex]);
            } else {
                gridData.push(Array(5).fill(null));
            }
        }

        return (
            <div className={styles.grid}>
                {gridData.map((row, rowIndex) => (
                    row.map((item, colIndex) => (
                        <div key={`${rowIndex}-${colIndex}`} className={styles.square}>
                            {item}
                        </div>
                    ))
                ))}
            </div>
        );
    };



    return (
        <div style={{background: "yellow", width: "100%", height: "100%"}}>
            <h1>{name} Talents</h1>
            <div>
                <button onClick={() => handleButtonClick('1')}>1</button>
                <button onClick={() => handleButtonClick('2')}>2</button>
                <button onClick={() => handleButtonClick('3')}>3</button>
            </div>
            {renderTalents(selectedPart)}
        </div>
    );
};
