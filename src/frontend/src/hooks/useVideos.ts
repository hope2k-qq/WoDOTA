import { useEffect, useState } from "react";
import axios from "axios";
import { Video } from "../types/video";

export const useVideos = (API_URL: string | undefined) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!API_URL) return;

        const fetchVideos = async () => {
            try {
                const res = await axios.get(`${API_URL}/youtube`);
                setVideos(res.data);
            } catch (error) {
                console.error("Ошибка при загрузке видео:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [API_URL]);

    return { videos, loading };
};
