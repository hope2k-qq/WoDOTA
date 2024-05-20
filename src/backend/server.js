const luaparse = require('luaparse');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());

const replacements = {
    'meepo': 'aghanim',
    'skeleton_king': 'wraith_king',
};

let herotalents = null;

try {
    const data = fs.readFileSync('./talents.lua', 'utf8');
    
    const parsedLua = luaparse.parse(data);
    
    parsedLua.body.forEach(node => {
        if (node.type === 'LocalStatement') {
            node.variables.forEach(variable => {
                if (variable.name === 'herotalents') {
                    herotalents = node.init[0];
                }
            });
        }
    });

    if (!herotalents) {
        throw new Error('No herotalents found in talents.lua');
    }

    const processHerotalents = (talents) => {
        const result = {};
        talents.fields.forEach(heroField => {
            const heroName = heroField.key.raw.replace(/"/g, '').replace('npc_dota_hero_', '');
            result[heroName] = {};
            heroField.value.fields.forEach(levelField => {
                const level = levelField.key.value;
                result[heroName][level] = {};
                levelField.value.fields.forEach(talentField => {
                    const talentIndex = talentField.key.value;
                    const talentDetails = (talentField.value.fields || []).map(talentDetail => {
                        if (!talentDetail.value.fields) {
                            console.log(`No fields in talentDetail for talentIndex ${talentIndex} at level ${level} for hero ${heroName}`);
                            return [];
                        }
                        
                        return talentDetail.value.fields.map(detail => {
                            if (detail.value && detail.value.fields) {
                                const subDetails = detail.value.fields.map(subDetail => {
                                    if (subDetail.value) {
                                        const rawValue = subDetail.value.raw || subDetail.value.value;
                                        return rawValue.replace(/"/g, '');
                                    } else if (subDetail.raw) {
                                        return subDetail.raw.replace(/"/g, '');
                                    } else {
                                        console.log(`Unhandled subDetail structure: ${JSON.stringify(subDetail)}`);
                                        return null;
                                    }
                                });
                                return `{${subDetails.join(', ')}}`;
                            } else if (detail.value) {
                                const rawValue = detail.value.raw || detail.value.value;
                                return rawValue.replace(/"/g, '');
                            } else if (detail.raw) {
                                return detail.raw.replace(/"/g, '');
                            } else {
                                console.log(`Unhandled detail structure: ${JSON.stringify(detail)}`);
                                return null;
                            }
                        }).join(', ');
                    }).flat();
                    
                    result[heroName][level][talentIndex] = talentDetails;
                });
            });
        });
        return result;
    };
    
    herotalents = processHerotalents(herotalents);
    
    Object.keys(replacements).forEach(oldName => {
        const newName = replacements[oldName];
        if (herotalents[oldName]) {
            const oldIndex = Object.keys(herotalents).indexOf(oldName);
            if (oldIndex !== -1) {
                const aghanimTalents = herotalents[oldName];
                delete herotalents[oldName];
                const heroNames = Object.keys(herotalents);
                heroNames.splice(oldIndex, 0, newName);
                herotalents = heroNames.reduce((acc, name) => {
                    acc[name] = name === newName ? aghanimTalents : herotalents[name];
                    return acc;
                }, {});
            }
        }
    });
    

} catch (error) {
    console.error('Error parsing Lua:', error);
}

app.get('/hero/:id', (req, res) => {
    const heroName = req.params.id;
    
    if (!herotalents) {
        res.json({ error: 'Talents data not loaded yet' });
    } else {
        const heroTalents = herotalents[heroName];
        if (heroTalents) {
            res.json(heroTalents);
        } else {
            res.status(404).json({ error: 'Hero not found' });
        }
    }
});

app.get('/heroes', (req, res) => {
    if (!herotalents) {
        res.json({ error: 'Talents data not loaded yet' });
    } else {
        const heroNames = Object.keys(herotalents);
        res.json(heroNames);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
