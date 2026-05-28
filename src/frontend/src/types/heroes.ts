export interface AbilityData {
    name: string;
    description: string;
    values: Record<string, string | { value?: string; [key: string]: any }>;
    [key: string]: string | Record<string, string | object>;
    valuesInfo: {
        descriptions: Record<string, string>;
        values: Record<string, string | number>;
    };
}

export interface AbilitiesProps {
    heroName: string;
    heroAbilities: { [key: string]: AbilityData } | null;
    heroInnate: { [key: string]: AbilityData } | null;
}

export interface AbilitiesPropsCharacteristics {
    heroName: string;
    characteristics: { [key: string]: string };
}

export interface RelatedTalent {
    relatedTalentName?: string;
    requiredTalentLevel?: string;
}

export interface Talent {
    id: string;
    talentInfo: string;
    level: string;
    imagePath: string;
    relatedTalent: RelatedTalent;
    conflict?: string[];
}

export interface TalentsInformation {
    [level: string]: {
        [talentKey: string]: Talent[];
    };
}

export interface talentsDescription {
    [key: string]: string
}

export interface HeroInformation {
    innate: { [key: string]: { [key: string]: string } };
    abilities: { [key: string]: { [key: string]: string } };
    characteristics: { [key: string]: string };
    talents_description: talentsDescription;
    talents_information: TalentsInformation;
}

export interface RenderTalentsProps {
    hero_name: string;
    talents_description: talentsDescription;
    talents_information: TalentsInformation;
    buildCurrentTalentLevels?: { [key: string]: { [key: string]: number } };
    buildUpgradeOrder?: string[];
    isBuild?: boolean;
}

export interface AbilitiesSectionProps {
    heroName: string;
    heroAbilities: { [key: string]: AbilityData } | null;
    heroInnate: { [key: string]: AbilityData } | null;
}




export interface AddonData {
    [key: string]: string;
}

export interface CharacteristicsData {
    [key: string]: string;
}

export interface AttributeData {
    [key: string]: string;
}