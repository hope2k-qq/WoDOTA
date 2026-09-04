const replacements_heroes = {
    'arc_warden': 'roshan',
    'chen': 'creep',
    'meepo': 'aghanim',
    'skeleton_king': 'wraith_king',
    'nevermore': 'shadow_fiend',
    'necrolyte': 'necrophos',
    'furion': 'nature\'s_prophet',
    'vengefulspirit': 'vengeful_spirit',
    'antimage': 'anti-mage',
    'zuus': 'zeus',
    'doom_bringer': 'doom',
    'windrunner': 'windranger',
    'wisp': 'io',
};

const reversedHeroes = Object.fromEntries(
    Object.entries(replacements_heroes).map(([k, v]) => [v, k])
);

module.exports = {
    replacementsHeroes: replacements_heroes,
    reversedHeroes
};
