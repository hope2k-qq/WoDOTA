const getClientIp = (req) => {
    const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.ip || '';
    return ip.replace(/^::ffff:/, '');
};

module.exports = { getClientIp };
