import axios from 'axios';
import { useEffect, useState } from 'react';

interface Player {
    steamid: string;
    rating: number;
    avatar?: string;
    profileUrl?: string;
}

interface PlayerGroup {
    steamids: string[];
    wave_count: string;
    heroes: string[];
    avatars: string[];
    profileUrls: string[];
}

export const LeaderboardPage = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [arenaPlayers, setArenaPlayers] = useState<Record<string, PlayerGroup[]>>({});
    const [loadingRating, setLoadingRating] = useState<boolean>(true);
    const [loadingArena, setLoadingArena] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState<string>('rating');
    const [arenaGroup, setArenaGroup] = useState<string>('1');

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchRatingData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/leaderboard_rating`);
            const playersData: Player[] = response.data.map((player: { steamid: string; rating: string; avatar?: string; profileUrl?: string }) => ({
                steamid: player.steamid,
                rating: parseInt(player.rating, 10),
                avatar: player.avatar,
                profileUrl: player.profileUrl
            }));
            setPlayers(playersData);
        } catch (err) {
            setError('Error fetching rating data');
        } finally {
            setLoadingRating(false);
        }
    };

    const fetchArenaData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/leaderboard_arena`);
            setArenaPlayers(response.data);
        } catch (err) {
            setError('Error fetching arena data');
        } finally {
            setLoadingArena(false);
        }
    };

    useEffect(() => {
        fetchRatingData();
        fetchArenaData();
    }, []);

    const handleRatingChange = (rating: string) => {
        setSelectedRating(rating);
    };

    const handleArenaGroupChange = (group: string) => {
        setArenaGroup(group);
    };

    if (loadingRating) {
        return <div>Loading rating...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const renderRatingPlayers = () => {
        return players.map((player, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <img src={player.avatar} alt="avatar" style={{ width: 50, height: 50, marginRight: 10 }} />
                SteamID: {player.steamid} — Rating: {player.rating}
                {player.profileUrl && (
                    <a href={player.profileUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 10 }}>
                        View Profile
                    </a>
                )}
            </li>
        ));
    };

    const renderArenaPlayers = () => {
        return arenaPlayers[arenaGroup]?.map((playerGroup, index) => (
            <li key={index}>
                <div>
                    <strong>Players:</strong>
                    {playerGroup.steamids.map((steamid, idx) => (
                        <div key={idx}>
                            <img src={playerGroup.avatars[idx]} alt="avatar" style={{ width: 50, height: 50, marginRight: 10 }} />
                            SteamID: {steamid} <br />
                            <a href={playerGroup.profileUrls[idx]} target="_blank" rel="noopener noreferrer">View Profile</a>
                        </div>
                    ))}
                    <div><strong>Wave Count:</strong> {playerGroup.wave_count}</div>
                    <div><strong>Heroes:</strong> {playerGroup.heroes.join(', ')}</div>
                </div>
            </li>
        ));
    };

    return (
        <div style={{ background: "yellow", width: "100%", height: "100%" }}>
            <h1>WoDOTA Leaderboard</h1>

            <div style={{ marginBottom: "20px" }}>
                <button
                    style={{
                        padding: '10px 20px',
                        marginRight: '10px',
                        backgroundColor: selectedRating === 'rating' ? 'green' : 'gray',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => handleRatingChange('rating')}
                >
                    Rating
                </button>
                <button
                    style={{
                        padding: '10px 20px',
                        backgroundColor: selectedRating === 'arena' ? 'green' : 'gray',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => handleRatingChange('arena')}
                >
                    Arena
                </button>
            </div>

            {selectedRating === 'rating' && (
                <ul>
                    {renderRatingPlayers()}
                </ul>
            )}

            {selectedRating === 'arena' && (
                <>
                    <div style={{ marginBottom: "20px" }}>
                        <button
                            style={{
                                padding: '10px 20px',
                                marginRight: '10px',
                                backgroundColor: arenaGroup === '1' ? 'green' : 'gray',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleArenaGroupChange('1')}
                        >
                            Group 1
                        </button>
                        <button
                            style={{
                                padding: '10px 20px',
                                marginRight: '10px',
                                backgroundColor: arenaGroup === '2' ? 'green' : 'gray',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleArenaGroupChange('2')}
                        >
                            Group 2
                        </button>
                        <button
                            style={{
                                padding: '10px 20px',
                                backgroundColor: arenaGroup === '3' ? 'green' : 'gray',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleArenaGroupChange('3')}
                        >
                            Group 3
                        </button>
                    </div>

                    {loadingArena ? <div>Loading arena data...</div> : <ul>{renderArenaPlayers()}</ul>}
                </>
            )}
        </div>
    );
};
