// context/UnreadNewsContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface UnreadNewsContextType {
    unreadNewsCount: number;
    setUnreadNewsCount: React.Dispatch<React.SetStateAction<number>>;
    updateUnreadNewsCount: (newsIds: number[]) => void;
    markNewsAsRead: (id: number) => void;
}

const UnreadNewsContext = createContext<UnreadNewsContextType | undefined>(undefined);

export const UnreadNewsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [unreadNewsCount, setUnreadNewsCount] = useState<number>(0);
    const API_URL = process.env.REACT_APP_API_URL;

    // Загружаем количество непрочитанных новостей из localStorage и API при старте приложения
    useEffect(() => {
        const loadNewsData = async () => {
            try {
                // Получаем новости с сервера
                const res = await fetch(`${API_URL}/news`);
                const data = await res.json();

                const fetchedNews = Array.isArray(data) ? data : data.news || [];

                // Получаем из localStorage, какие новости уже прочитаны
                const storedReadNews = JSON.parse(localStorage.getItem('readNews') || '[]');

                // Определяем непрочитанные новости
                const unreadNewsIds = fetchedNews
                    .map((news: { id: number }) => news.id)
                    .filter((id: number) => !storedReadNews.includes(id));

                // Обновляем количество непрочитанных новостей
                setUnreadNewsCount(unreadNewsIds.length);

                // Сохраняем количество непрочитанных новостей в localStorage
                localStorage.setItem('unreadNewsCount', unreadNewsIds.length.toString());

            } catch (err) {
                console.error("Ошибка загрузки новостей:", err);
            }
        };

        loadNewsData();
    }, [API_URL]);

    // Функция для обновления количества непрочитанных новостей
    const updateUnreadNewsCount = (newsIds: number[]) => {
        const storedReadNews = JSON.parse(localStorage.getItem('readNews') || '[]');

        // Определяем непрочитанные новости
        const unreadNewsIds = newsIds.filter((id) => !storedReadNews.includes(id));
        setUnreadNewsCount(unreadNewsIds.length);

        // Сохраняем количество непрочитанных новостей в localStorage
        localStorage.setItem('unreadNewsCount', unreadNewsIds.length.toString());
    };

    // Помечаем новость как прочитанную
    const markNewsAsRead = (id: number) => {
        const storedReadNews = JSON.parse(localStorage.getItem('readNews') || '[]');
        if (!storedReadNews.includes(id)) {
            storedReadNews.push(id);
            localStorage.setItem('readNews', JSON.stringify(storedReadNews));

            // Обновляем количество непрочитанных новостей
            updateUnreadNewsCount([]);
        }
    };

    const value = { unreadNewsCount, setUnreadNewsCount, updateUnreadNewsCount, markNewsAsRead };

    return (
        <UnreadNewsContext.Provider value={value}>
            {children}
        </UnreadNewsContext.Provider>
    );
};

// Хук для использования контекста
export const useUnreadNews = (): UnreadNewsContextType => {
    const context = useContext(UnreadNewsContext);
    if (!context) {
        throw new Error('useUnreadNews must be used within a UnreadNewsProvider');
    }
    return context;
};
