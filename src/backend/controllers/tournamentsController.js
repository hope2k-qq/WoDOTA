const path = require('path');
const fs = require('fs').promises;
const { readJsonFile } = require('../utils/fileUtils');
const { processTournamentData } = require('../services/tournamentService');
const tournamentsPath = path.join(__dirname, '../data/tournaments.json');

exports.getTournamentListAll = async (req, res) => {
    try {
        const tournaments = await readJsonFile(tournamentsPath);
        res.json(tournaments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Не удалось прочитать список турниров' });
    }
};

exports.getTournamentGenerate = async (req, res) => {
    try {
        const { key } = req.params;
        const tournaments = await readJsonFile(tournamentsPath);
        const tournament = tournaments.find(t => t.key === key);
        if (!tournament) return res.status(404).json({ error: "Tournament not found" });

        const stages = ["", "Qualifiers", "Playoffs", "Final"];
        const fullTournamentData = {};

        for (const stage of stages) {
            try {
                fullTournamentData[stage === "" ? "list" : stage.toLowerCase()] = 
                    await processTournamentData(tournament.dataFile, req.app.locals.steam_data_players, stage);
            } catch (err) {
                console.error(`Error processing stage ${stage}:`, err);
            }
        }

        const tournamentResponse = { ...tournament, data: fullTournamentData };
        
        const outputPath = path.join(__dirname, '../data/tournaments', `${tournament.key}.json`);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(tournamentResponse, null, 2), 'utf-8');
        
        res.json(tournamentResponse);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getTournament = async (req, res) => {
    try {
        const { key } = req.params;
        
        const filePath = path.join(__dirname, '../data/tournaments', `${key}.json`);
        
        const jsonData = await readJsonFile(filePath);
        
        res.json(jsonData);
    } catch (err) {
        console.error(err);
        res.status(404).json({ error: "Tournament not found" });
    }
};

exports.getLatestTournament = async (req, res) => {
    try {
        const tournaments = await readJsonFile(tournamentsPath);
        if (!tournaments.length) {
            return res.status(404).json({ error: "No tournaments found" });
        }
        
        const latest = tournaments.reduce((max, t) => (t.id > max.id ? t : max), tournaments[0]);
        
        const filePath = path.join(__dirname, '../data/tournaments', `${latest.key}.json`);
        const data = await readJsonFile(filePath);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
