import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import Cookies from 'js-cookie';
import {useUser} from "./UserContext";

interface UnreadNewsContextType {
    unreadNewsCount: number;
    setUnreadNewsCount: React.Dispatch<React.SetStateAction<number>>;
    updateUnreadNewsCount: (newsIds: number[]) => void;
    markNewsAsRead: (id: number) => void;
    allNewsIds: number[];
    setAllNewsIds: React.Dispatch<React.SetStateAction<number[]>>;
}

const UnreadNewsContext = createContext<UnreadNewsContextType | undefined>(undefined);

export const UnreadNewsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [unreadNewsCount, setUnreadNewsCount] = useState<number>(0);
    const [allNewsIds, setAllNewsIds] = useState<number[]>([]);
    const API_URL = process.env.REACT_APP_API_URL;
    const { user, loading  } = useUser();
    useEffect(() => {
        const loadNewsData = async () => {
            try {
                const res = await fetch(`${API_URL}/news/en`);
                const data = await res.json();

                const fetchedNews = Array.isArray(data) ? data : data.news || [];
                const fetchedNewsIds = fetchedNews.map((news: { id: number }) => news.id);
                setAllNewsIds(fetchedNewsIds);

                const localRead = Cookies.get('readNews');
                const localReadNews = localRead ? JSON.parse(localRead) : [];

                let mergedReadNews = [...localReadNews];

                if (user) {
                    const serverReadRes = await fetch(`${API_URL}/account/news/read`, { credentials: 'include' });
                    const serverReadData = await serverReadRes.json();
                    const serverReadNews = serverReadData.readNews || [];

                    mergedReadNews = Array.from(new Set([...localReadNews, ...serverReadNews]));

                    if (serverReadNews.length !== mergedReadNews.length) {
                        await fetch(`${API_URL}/account/settings`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ readNews: mergedReadNews }),
                        });
                    }

                    Cookies.set('readNews', JSON.stringify(mergedReadNews));
                }

                const unread = fetchedNewsIds.filter((id: number) => !mergedReadNews.includes(id));
                setUnreadNewsCount(unread.length);
                Cookies.set('unreadNewsCount', unread.length.toString());

            } catch (err) {
                console.error("Ошибка загрузки новостей:", err);
            }
        };

        if (!loading) {
            loadNewsData();
        }
    }, [API_URL, loading, user]);

    const updateUnreadNewsCount = (newsIds: number[]) => {
        const storedReadNewsStr = Cookies.get('readNews');
        const storedReadNews = storedReadNewsStr ? JSON.parse(storedReadNewsStr) : [];

        const unreadNewsIds = newsIds.filter((id) => !storedReadNews.includes(id));
        setUnreadNewsCount(unreadNewsIds.length);
        Cookies.set('unreadNewsCount', unreadNewsIds.length.toString());
    };

    const markNewsAsRead = async (id: number) => {
        const storedReadNewsStr = Cookies.get('readNews');
        const storedReadNews = storedReadNewsStr ? JSON.parse(storedReadNewsStr) : [];

        if (!storedReadNews.includes(id)) {
            const updatedReadNews = [...storedReadNews, id];
            Cookies.set('readNews', JSON.stringify(updatedReadNews));
            updateUnreadNewsCount(allNewsIds);


            if (user) {
                try {
                    await fetch(`${API_URL}/account/settings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ readNews: updatedReadNews }),
                    });
                } catch (error) {
                    console.error('Ошибка при сохранении прочитанных новостей:', error);
                }
            }
        }
    };

    const value = {
        unreadNewsCount,
        setUnreadNewsCount,
        updateUnreadNewsCount,
        markNewsAsRead,
        allNewsIds,
        setAllNewsIds,
    };

    return (
        <UnreadNewsContext.Provider value={value}>
            {children}
        </UnreadNewsContext.Provider>
    );
};

export const useUnreadNews = (): UnreadNewsContextType => {
    const context = useContext(UnreadNewsContext);
    if (!context) {
        throw new Error('useUnreadNews must be used within a UnreadNewsProvider');
    }
    return context;
};
