import React, { createContext, useContext, useState, useEffect } from 'react';

interface SteamUser {
    steamId: string;
    name: string;
    avatar: string;
    settings?: {
        showNumbers?: boolean;
        showText?: boolean;
    };
}

interface UserContextType {
    user: SteamUser | null;
    setUser: React.Dispatch<React.SetStateAction<SteamUser | null>>;
    loading: boolean;
    showNumbers: boolean;
    showText: boolean;
    setShowNumbers: React.Dispatch<React.SetStateAction<boolean>>;
    setShowText: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [user, setUser] = useState<SteamUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showNumbers, setShowNumbers] = useState(true);
    const [showText, setShowText] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetch(`${API_URL}/account`, {
            credentials: 'include',
        })
            .then(res => (res.ok ? res.json() : Promise.reject()))
            .then((data: SteamUser) => {
                setUser(data);

                if (data.settings) {
                    if (typeof data.settings.showNumbers === 'boolean') {
                        setShowNumbers(data.settings.showNumbers);
                    }
                    if (typeof data.settings.showText === 'boolean') {
                        setShowText(data.settings.showText);
                    }
                }
            })
            .catch(() => {
                setUser(null);
                setShowNumbers(true);
                setShowText(true);
            })
            .finally(() => setLoading(false));
    }, [API_URL]);

    return (
        <UserContext.Provider value={{ user, setUser, loading, showNumbers, showText,  setShowNumbers, setShowText }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
