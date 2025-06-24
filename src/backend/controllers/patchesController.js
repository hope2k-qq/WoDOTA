const fs = require('fs');
const path = require('path');
const { extractAbilityValues, createPatchItems } = require('../utils/itemUtils');
const { extractHeroModifiers, createHeroPatch } = require('../utils/heroesUtils');

exports.getPatches = async (req, res) => {
    try {
        const patch = {};
        
        const itemsOld = fs.readFileSync(path.join(__dirname, '../assets/npc_items_custom.txt'), 'utf-8');
        const itemsNew = fs.readFileSync(path.join(__dirname, '../assets/npc_items_custom1.txt'), 'utf-8');

        const itemsData = extractAbilityValues(itemsOld);
        const updatedItemsData = extractAbilityValues(itemsNew);

        patch.items = createPatchItems(itemsData, updatedItemsData);

        const heroesOld = fs.readFileSync(path.join(__dirname, '../assets/addon_russian1.txt'), 'utf-8');
        const heroesNew = fs.readFileSync(path.join(__dirname, '../assets/addon_russian2.txt'), 'utf-8');

        const heroesData =  extractHeroModifiers(heroesOld);
        const updatedHeroesData = extractHeroModifiers(heroesNew);

        patch.heroes = createHeroPatch(heroesData, updatedHeroesData);

        res.status(200).json({
            success: true,
            message: 'Patch successfully generated',
            patch
        });
    } catch (err) {
        console.error('Error generating patch:', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while generating the patch',
            error: err.message
        });
    }
};