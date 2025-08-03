const axios = require('axios');

let cachedCreatorsVideosData = null;
let updating = false;

const API_KEY = process.env.YOUTUBE_API_KEY;

const KEYWORDS = ['world of dota', 'wodota', 'ворлд оф дота', 'водота', 'worldofdota', 'wodota', 'ворлдофдота'];
const CHANNEL_IDS = [
    'UC7nvh2EPxWEprPjxMq9c0Kg', //zaquel
    'UCIzjwAo-8i1z745n1uJZGKA', //frfrwoda
    'UC4AnU0aWdnpB95KEXGTLU8g', //golden pig
    'UC766KqQoEYti6Z7nTpFv0hw', //KeyFear
    'UCrW1iPTx5mTvw2z2wQ9MG_A', //hailvkid
    'UChWJUWzPy6dafQtIp1Ynp6Q', //Panda Live
];

const CHANNEL_IDS2 = [
    'UCuSuhIjtpJ1lCkR3z_WZQaQ', //Shadow
    'UCS618757Yo1vOBsFvdulcUw', //Drainblade
    'UCqjKGSC3YsNJSQOQGZZSH5g', //raze1x6
    'UCYaGSZCnij0ereDzFaPYpkg', //luikapov
    'UCn5XpY0AoF7KSMplGHvKqkg', //Shidorobi
    'UCrY4xd3S9Rar3OFTZpmMsIQ', //Paradox_1s
];

async function getUploadsPlaylistId(channelId) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;
    const response = await axios.get(url);
    const items = response.data.items;

    if (!items || items.length === 0) {
        throw new Error(`Канал с ID "${channelId}" не найден`);
    }

    return items[0].contentDetails.relatedPlaylists.uploads;
}

async function getChannelInfo(channelId) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
    const response = await axios.get(url);
    const items = response.data.items;

    if (!items || items.length === 0) {
        throw new Error(`Канал с ID "${channelId}" не найден`);
    }

    const snippet = items[0].snippet;
    const statistics = items[0].statistics;

    return {
        authorName: snippet.title,
        authorAvatar: snippet.thumbnails.default.url,
        subscriberCount: statistics.hiddenSubscriberCount ? null : parseInt(statistics.subscriberCount),
        authorUrl: `https://www.youtube.com/channel/${channelId}`,
    };
}



async function getVideosFromPlaylist(playlistId, maxResults = 50) {
    let videos = [];
    let nextPageToken = '';

    while (videos.length < maxResults) {
        const maxFetch = Math.min(50, maxResults - videos.length);
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxFetch}&playlistId=${playlistId}&key=${API_KEY}` +
            (nextPageToken ? `&pageToken=${nextPageToken}` : '');
        const response = await axios.get(url);

        videos.push(...response.data.items);
        nextPageToken = response.data.nextPageToken;

        if (!nextPageToken) break;
    }

    return videos;
}

async function filterOutLiveAndStreamRecords(videos) {
    if (videos.length === 0) return [];

    const videoIds = videos.map(v => v.snippet.resourceId.videoId).join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,contentDetails&id=${videoIds}&key=${API_KEY}`;
    const response = await axios.get(url);

    const filteredVideoIds = response.data.items
        .filter(video => {
            const snippet = video.snippet;
            const liveDetails = video.liveStreamingDetails;
            const duration = video.contentDetails.duration;
            const publishedAt = new Date(snippet.publishedAt);
            const actualStart = liveDetails?.actualStartTime ? new Date(liveDetails.actualStartTime) : null;
            const isPremiere = actualStart && publishedAt.getTime() === actualStart.getTime();
            if (
                (snippet.liveBroadcastContent !== 'none' ||
                    (liveDetails && liveDetails.actualEndTime)) && !isPremiere
            ) {
                return false;
            }
            const seconds = parseISO8601Duration(duration);
            if (seconds <= 181) {
                return false;
            }
            return true;
        })
        .map(video => video.id);

    return videos.filter(v => filteredVideoIds.includes(v.snippet.resourceId.videoId));
}

function parseISO8601Duration(duration) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = duration.match(regex);
    if (!match) return 0;

    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;

    return hours * 3600 + minutes * 60 + seconds;
}




function filterByKeywords(videos, keywords) {
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    return videos.filter(video => {
        const title = video.snippet.title.toLowerCase();
        return lowerKeywords.some(keyword => title.includes(keyword));
    });
}



const updateCreatorsVideosData = async (app) => {
    if (updating) return;
    updating = true;
    try {
        let allVideos = [];

        const allChannelIds = [...CHANNEL_IDS, ...CHANNEL_IDS2];

        for (const channelId of allChannelIds) {
            try {
                const playlistId = await getUploadsPlaylistId(channelId);
                const channelInfo = await getChannelInfo(channelId);
                let videos = await getVideosFromPlaylist(playlistId, 50);

                videos = await filterOutLiveAndStreamRecords(videos);
                
                if (CHANNEL_IDS2.includes(channelId)) {
                    videos = filterByKeywords(videos, KEYWORDS);
                }

                console.log(`Канал ${channelId}: после всех фильтров — ${videos.length}`);

                const videosWithAuthor = videos.map(video => ({
                    title: video.snippet.title,
                    videoId: video.snippet.resourceId.videoId,
                    publishedAt: video.snippet.publishedAt,
                    images:
                        video.snippet.thumbnails.maxres?.url ||
                        video.snippet.thumbnails.high?.url ||
                        video.snippet.thumbnails.medium?.url ||
                        video.snippet.thumbnails.default?.url ||
                        null,
                    authorName: channelInfo.authorName,
                    authorAvatar: channelInfo.authorAvatar,
                    subscriberCount: channelInfo.subscriberCount,
                    authorUrl: channelInfo.authorUrl,
                }));

                allVideos = allVideos.concat(videosWithAuthor);

            } catch (err) {
                console.error(`Ошибка при обработке канала ${channelId}:`, err.response?.data || err.message);
            }
        }

        cachedCreatorsVideosData = allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        const collection = app;
        const currentDate = new Date().toISOString();

        await collection.updateOne(
            { loc: 'https://wodota.pro/creators/videos' },
            {
                $set: {
                    lastmod: currentDate,
                }
            }
        );
    } catch (err) {
        console.error('Общая ошибка:', err.response?.data || err.message);
    } finally {
        updating = false;
    }
};

const getCreatorsVideos = (req, res) => {
    if (cachedCreatorsVideosData) {
        res.json(cachedCreatorsVideosData);
    } else {
        res.json([]);
    }
};

const getProxyImage = async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        const response = await fetch(imageUrl, {
            headers: { Referer: '' }
        });

        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image');
        }

        const contentType = response.headers.get('content-type');
        res.set('Content-Type', contentType);

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};


module.exports = {
    updateCreatorsVideosData,
    getCreatorsVideos,
    getProxyImage,
};
