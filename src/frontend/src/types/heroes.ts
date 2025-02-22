export interface AbilityData {
    name: string;
    description: string;
    values: Record<string, string | { value?: string; [key: string]: any }>;
    [key: string]: string | Record<string, string | object>;
}

export interface AbilitiesProps {
    heroName: string;
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
    abilities: { [key: string]: { [key: string]: string } };
    characteristics: { [key: string]: string };
    talents_description: talentsDescription;
    talents_information: TalentsInformation;
}

export interface RenderTalentsProps {
    hero_name: string;
    talents_description: talentsDescription;
    talents_information: TalentsInformation;
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