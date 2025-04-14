// pages/NewsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './news.module.scss';
import { useUnreadNews } from '../../context/UnreadNewsContext';
import { ReactComponent as CheckmarkIcon } from "../../assets/icons/CheckmarkIcon.svg";
import {useTranslation} from "react-i18next";

interface NewsItem {
    id: number;
    title: string;
    content: string;
}

export const NewsPage: React.FC = () => {
    const { t } = useTranslation();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;
    const [openNewsIds, setOpenNewsIds] = useState<number[]>([]);
    const [heights, setHeights] = useState<{ [key: number]: number }>({});
    const contentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const { markNewsAsRead, updateUnreadNewsCount  } = useUnreadNews();

    const toggleContent = (id: number) => {
        const isOpen = openNewsIds.includes(id);

        if (isOpen) {
            setOpenNewsIds(openNewsIds.filter((newsId) => newsId !== id));
        } else {
            setOpenNewsIds([...openNewsIds, id]);
        }

        markNewsAsRead(id);
    };

    const updateHeight = (id: number) => {
        const contentRef = contentRefs.current[id];
        if (contentRef) {
            const newHeight = contentRef.scrollHeight;
            setHeights((prevHeights) => ({
                ...prevHeights,
                [id]: prevHeights[id] ? prevHeights[id] : newHeight,
            }));
        }
    };

    useEffect(() => {
        openNewsIds.forEach((id) => {
            if (!heights[id]) {
                updateHeight(id);
            }
        });

        const handleResize = () => {
            openNewsIds.forEach((id) => {
                updateHeight(id);
            });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [openNewsIds, heights]);

    useEffect(() => {
        // Загрузка новостей с сервера
        fetch(`${API_URL}/news`)
            .then((res) => res.json())
            .then((data) => {
                const fetchedNews = Array.isArray(data) ? data : data.news || [];
                setNews(fetchedNews);

                // Обновляем количество непрочитанных новостей
                updateUnreadNewsCount(fetchedNews.map((news: NewsItem) => news.id));
            })
            .catch((err) => {
                console.error('Ошибка загрузки:', err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, [API_URL, updateUnreadNewsCount]);


    if (loading) return <p></p>;
    if (error) return <p>Ошибка: {error}</p>;

    return (
        <div className={styles.main_container}>
            <div className={styles.title_main}>{t('news')}</div>
            {news.length === 0 ? (
                <div></div>
            ) : (
                <div className={styles.container}>
                    {news
                        .slice()
                        .reverse()
                        .map((item) => {
                        const isRead = JSON.parse(localStorage.getItem('readNews') || '[]').includes(item.id);

                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleContent(item.id)}
                                className={styles.container_news}
                                style={{border: openNewsIds.includes(item.id) ? '1px solid #f4bf58' : '0'}}
                            >
                                <div className={styles.title}>
                                    <div>{item.title}</div>
                                    {isRead && <div><CheckmarkIcon className={styles.checkmark_iron}/></div>}
                                </div>
                                <div
                                    ref={(el) => (contentRefs.current[item.id] = el)}
                                    className={styles.content}
                                    style={{
                                        height: openNewsIds.includes(item.id)
                                            ? `${heights[item.id] + 30}px`
                                            : '0',
                                        paddingTop: openNewsIds.includes(item.id) ? '15px' : '0',
                                        paddingBottom: openNewsIds.includes(item.id) ? '15px' : '0',
                                        borderTop: openNewsIds.includes(item.id) ? '1px solid rgba(244, 191, 88, 0.2)' : '0px solid rgba(244, 191, 88, 0)',
                                    }}
                                >
                                    {item.content.split('/n').map((line, index) => (
                                        <ul key={index}
                                            style={{paddingInlineStart: '0', margin: '0.5rem', listStyleType: 'none'}}>
                                            <li style={{position: 'relative', paddingLeft: '20px'}}>
                                                <span style={{position: 'absolute', left: '0', top: '0'}}>-</span>
                                                {line}
                                            </li>
                                        </ul>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
