const axios = require('axios');

const fetchRatingData = async () => {
    try {
        const response = await axios.get('https://data.worldofdota.net/data/get_top_rating_150.php');
        return response.data;
    } catch (error) {
        console.error('Error fetching rating data:', error.message);
        throw new Error('Failed to fetch rating data');
    }
};

const fetchArenaData = async () => {
    try {
        const response = await axios.get('https://data.worldofdota.net/data/get_top_rating_pve_arena.php');
        return response.data;
    } catch (error) {
        console.error('Error fetching arena data:', error.message);
        throw new Error('Failed to fetch arena data');
    }
};

module.exports = {
    fetchRatingData,
    fetchArenaData
};