import { useEffect, useState } from "react";
import axios from "axios";
import { CACHE_VERSION } from "../constants/api";
import { HeroInformation } from "../types/heroes";

const API_URL = process.env.REACT_APP_API_URL;

const cache = new Map<string, HeroInformation>();

export type HeroDataState = {
    heroData: HeroInformation | null;
    loading: boolean;
    notFound: boolean;
};

const idle: HeroDataState = { heroData: null, loading: false, notFound: false };

export function useHeroData(name?: string | null, lang?: string | null): HeroDataState {
    const key = name && lang ? `${lang}/${name}` : null;

    const [state, setState] = useState<HeroDataState>(() => {
        if (!key) return idle;
        const cached = cache.get(key);
        if (cached) return { heroData: cached, loading: false, notFound: false };
        return { heroData: null, loading: true, notFound: false };
    });

    useEffect(() => {
        if (!key || !name || !lang) {
            setState(idle);
            return;
        }

        const cached = cache.get(key);
        if (cached) {
            setState({ heroData: cached, loading: false, notFound: false });
            return;
        }

        let cancelled = false;
        setState({ heroData: null, loading: true, notFound: false });

        axios
            .get<HeroInformation>(`${API_URL}/hero-data/${lang}/${name}?v=${CACHE_VERSION}`)
            .then((response) => {
                if (cancelled) return;
                cache.set(key, response.data);
                setState({ heroData: response.data, loading: false, notFound: false });
            })
            .catch((error) => {
                if (cancelled) return;
                const status = error?.response?.status;
                setState({ heroData: null, loading: false, notFound: status === 404 || status === 400 });
            });

        return () => {
            cancelled = true;
        };
    }, [key, name, lang]);

    return state;
}
