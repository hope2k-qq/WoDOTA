export type NoteLang = 'ru' | 'en' | 'uk' | 'cs';

export type Localized = string;

export interface PatchNote {
    parameter?: string;
    note: Localized;
    icon?: string | null;
}

export interface PatchTalentEntry {
    talent_id?: string;
    image?: string;
    title?: Localized | null;
    talent_notes: PatchNote[];
}

export interface PatchEntityValue {
    key: string;
    label: Localized;
    value: string;
    negative?: boolean;
}

export interface PatchDescriptionSection {
    title: Localized;
    text: Localized;
}

export interface StatNote {
    note: Localized;
    negative?: boolean;
}

export interface PatchItem {
    item_id: string;
    name?: string;
    image?: string | null;
    is_new?: boolean;
    is_upgrade?: boolean;
    caption?: Localized | null;
    description?: Localized | null;
    description_sections?: PatchDescriptionSection[];
    item_values?: PatchEntityValue[];
    recipe?: Localized;
    item_notes: PatchNote[];
}

export interface PatchNeutralItem {
    neutral_item_id: string;
    name?: string;
    image?: string | null;
    neutral_type?: 'artifact' | 'enhancement';
    is_new: boolean;
    tier: number | number[] | null;
    rank?: number | number[] | null;
    new_rank?: number | number[] | null;
    enhancement_level?: number | number[] | null;
    caption?: Localized | null;
    description?: Localized | null;
    description_sections?: PatchDescriptionSection[];
    item_values?: PatchEntityValue[];
    stat_notes?: StatNote[];
    recipe?: Localized;
    neutral_item_notes: PatchNote[];
}

export interface PatchAbility {
    ability_id: string;
    name?: Localized | null;
    image?: string | null;
    innate?: boolean;
    description?: Localized | Localized[] | null;
    ability_values?: PatchEntityValue[];
    ability_notes: PatchNote[];
}

export interface PatchBoss {
    boss_id: string;
    name?: string;
    image?: string;
    abilities: PatchAbility[];
}

export interface PatchNeutralCreep {
    neutral_creep_id: string;
    name?: Localized | null;
    image?: string;
    is_new?: boolean;
    neutral_creep_notes: PatchNote[];
    abilities: PatchAbility[];
}

export interface PatchTalents {
    strength: PatchTalentEntry[];
    agility: PatchTalentEntry[];
    intelligence: PatchTalentEntry[];
}

export interface PatchHero {
    hero_id: string;
    name?: string;
    image?: string;
    is_new?: boolean;
    primary_attribute?: 'strength' | 'agility' | 'intelligence' | 'universal';
    hero_notes: PatchNote[];
    abilities: PatchAbility[];
    talents: PatchTalents;
}

export interface PatchGeneral {
    global_changes: Localized[];
}

export interface PatchLog {
    patch_number: string;
    patch_name: string;
    patch_timestamp: number;
    general: PatchGeneral;
    items?: { base: PatchItem[]; upgrade: PatchItem[] };
    neutral_items?: { artifacts: PatchNeutralItem[]; enhancements: PatchNeutralItem[] };
    heroes: PatchHero[];
    bosses?: PatchBoss[];
    neutral_creeps?: PatchNeutralCreep[];
}
