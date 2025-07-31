const matches = require('../data/matches_data.json');

exports.getMetaStats = (req, res) => {
    try {
        const heroStats = {};
        let totalGames = 0;

        matches.forEach(match => {
            totalGames += 1;
            match.players.forEach(player => {
                const name = player.hero;

                if (!heroStats[name]) {
                    heroStats[name] = {
                        games: 0,
                        wins: 0,
                        kills: 0,
                        deaths: 0,
                        assists: 0,
                    };
                }

                heroStats[name].games += 1;
                if (player.is_winner) heroStats[name].wins += 1;
                heroStats[name].kills += player.kills;
                heroStats[name].deaths += player.deaths;
                heroStats[name].assists += player.assists;
            });
        });

        // Функция расчёта лояльности в процентах по количеству игр (максимум 70 игр = 100%)
        const MAX_GAMES_FOR_LOYALTY = 70;

        function loyaltyByGames(games) {
            if (games >= MAX_GAMES_FOR_LOYALTY) return 100;
            return Number(((games / MAX_GAMES_FOR_LOYALTY) * 100).toFixed(2));
        }

        // Функция определения цвета по лояльности
        function getLoyaltyColor(percent) {
            if (percent <= 20) return '#ff4d4d';      // Очень низкая — красный
            if (percent <= 40) return '#ff944d';      // Низкая — оранжевый
            if (percent <= 60) return '#ffd24d';      // Средняя — желтый
            if (percent <= 80) return '#a6ff4d';      // Высокая — светло-зеленый
            return '#4dff88';                         // Очень высокая — зеленый
        }

        // Базовые расчёты
        let metaData = Object.entries(heroStats).map(([name, stats]) => {
            const games = stats.games;
            const loyaltyScore = loyaltyByGames(games);
            const loyaltyColor = getLoyaltyColor(loyaltyScore);
            return {
                hero: name,
                games,
                winRate: Number(((stats.wins / games) * 100).toFixed(1)),
                pickRate: Number(((games / totalGames) * 100).toFixed(2)),
                avgKDA: Number(((stats.kills + stats.assists) / (stats.deaths || 1)).toFixed(2)),
                avgKills: Number((stats.kills / games).toFixed(2)),
                avgDeaths: Number((stats.deaths / games).toFixed(2)),
                avgAssists: Number((stats.assists / games).toFixed(2)),
                loyaltyScore,
                loyaltyColor,
            };
        });

        // Фильтр для расчётов минитаблиц
        const MIN_GAMES = 15;
        const pool = metaData.filter(h => h.games >= MIN_GAMES);

        // ---- Система score ----
        const maxWin = Math.max(...pool.map(h => h.winRate));
        const maxPick = Math.max(...pool.map(h => h.pickRate));
        const maxKDA = Math.max(...pool.map(h => h.avgKDA));

        const W_WIN = 0.5;
        const W_PICK = 0.3;
        const W_KDA = 0.2;

        const scored = pool.map(h => {
            const normWin = maxWin ? (h.winRate / maxWin) * 100 : 0;
            const normPick = maxPick ? (h.pickRate / maxPick) * 100 : 0;
            const normKDA = maxKDA ? (h.avgKDA / maxKDA) * 100 : 0;
            const score = (normWin * W_WIN) + (normPick * W_PICK) + (normKDA * W_KDA);
            return { ...h, score: Number(score.toFixed(2)) }; // уже в 0–100
        });

        const topScore = [...scored]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(h => ({ hero: h.hero, score: h.score, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));

        const worstScore = [...scored]
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .reverse()
            .map(h => ({ hero: h.hero, score: h.score, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));



        // ---- Топы по убийствам ----
        const topKills = [...pool]
            .sort((a, b) => b.avgKills - a.avgKills)
            .slice(0, 3)
            .map(h => ({ hero: h.hero, avgKills: h.avgKills, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));

        const worstKills = [...pool]
            .sort((a, b) => a.avgKills - b.avgKills)
            .slice(0, 3)
            .reverse()
            .map(h => ({ hero: h.hero, avgKills: h.avgKills, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));


        // ---- Топы по смертям ----
        const topDeaths = [...pool]
            .sort((a, b) => b.avgDeaths - a.avgDeaths)
            .slice(0, 3)
            .map(h => ({ hero: h.hero, avgDeaths: h.avgDeaths, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));

        const worstDeaths = [...pool]
            .sort((a, b) => a.avgDeaths - b.avgDeaths)
            .slice(0, 3)
            .reverse()
            .map(h => ({ hero: h.hero, avgDeaths: h.avgDeaths, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));


        // ---- Топы по ассистам ----
        const topAssists = [...pool]
            .sort((a, b) => b.avgAssists - a.avgAssists)
            .slice(0, 3)
            .map(h => ({ hero: h.hero, avgAssists: h.avgAssists, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));

        const worstAssists = [...pool]
            .sort((a, b) => a.avgAssists - b.avgAssists)
            .slice(0, 3)
            .reverse()
            .map(h => ({ hero: h.hero, avgAssists: h.avgAssists, loyaltyScore: h.loyaltyScore, loyaltyColor: h.loyaltyColor }));


        res.json({
            heroes: metaData,
            loyaltyMaxGames: MAX_GAMES_FOR_LOYALTY,
            scoreTable: { top: topScore, worst: worstScore },
            killsTable: { top: topKills, worst: worstKills },
            deathsTable: { top: topDeaths, worst: worstDeaths },
            assistsTable: { top: topAssists, worst: worstAssists }
        });

    } catch (error) {
        console.error('Error generating meta stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
