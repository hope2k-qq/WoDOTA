import { convertUnknownFieldsToString } from './convertUnknownFieldsToString';

interface AbilityData {
    name: string;
    description: string;
    values: Record<string, any>;
    [key: string]: any;
}

export const handleAbilitiesData = (
    data: Record<string, any>,
    setHeroAbilities: (abilities: { [key: string]: AbilityData }) => void
): void => {
    const updatedHeroAbilities: { [key: string]: AbilityData } = {};

    Object.entries(data).forEach(([abilityKey, abilityData]) => {
        updatedHeroAbilities[abilityKey] = {
            name: abilityData.name,
            description: abilityData.description,
            values: abilityData.values || {},
            ...convertUnknownFieldsToString(abilityData),
        };
    });

    setHeroAbilities(updatedHeroAbilities);
};
