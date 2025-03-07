const axios = require('axios');

exports.getProxy = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const videoResponse = await axios.get(url, {
            responseType: 'stream',
        });
        
        res.setHeader('Content-Type', 'video/webm');
        
        videoResponse.data.pipe(res);

    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).send('Error fetching video');
    }
};
