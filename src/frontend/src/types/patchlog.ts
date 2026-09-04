
export type NoteLang = 'ru' | 'en' | 'uk' | 'cs';

export type NoteText = Record<NoteLang, string | null>;

export interface PatchNote {
    parameter?: string;
    note: NoteText;
}

export interface PatchTalentEntry {
    talent_id?: string;
    title?: NoteText | null;
    talent_notes: PatchNote[];
}

export interface PatchEntityValue {
    key: string;
    label: NoteText;
    value: string;
}

export interface PatchDescriptionSection {
    title: NoteText;
    text: NoteText;
}

export interface PatchItem {
    item_id: string;
    image?: string | null;
    is_new?: boolean;
    category?: string | null;
    description?: NoteText | null;
    description_sections?: PatchDescriptionSection[];
    item_values?: PatchEntityValue[];
    recipe?: NoteText;
    item_notes: PatchNote[];
}

export interface PatchNeutralItem {
    neutral_item_id: string;
    image?: string | null;
    neutral_type?: 'artifact' | 'enhancement';
    is_new: boolean;
    tier: number | number[] | null;
    rank?: number | number[] | null;
    new_rank?: number | number[] | null;
    enhancement_level?: number | number[] | null;
    description?: NoteText | null;
    description_sections?: PatchDescriptionSection[];
    item_values?: PatchEntityValue[];
    recipe?: NoteText;
    neutral_item_notes: PatchNote[];
}

export interface PatchAbility {
    ability_id: string;
    name?: NoteText | null;
    image?: string | null;
    innate?: boolean;
    description?: NoteText | null;
    ability_values?: PatchEntityValue[];
    ability_notes: PatchNote[];
}

export interface PatchBoss {
    boss_id: string;
    abilities: PatchAbility[];
}

export interface PatchNeutralCreep {
    neutral_creep_id: string;
    name?: NoteText | null;
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
    is_new?: boolean;
    primary_attribute?: 'strength' | 'agility' | 'intelligence' | 'universal';
    hero_notes: PatchNote[];
    abilities: PatchAbility[];
    talents: PatchTalents;
}

export interface PatchGeneral {
    heroes: { added: string[]; removed: string[] };
    global_changes: NoteText[];
}

export interface PatchLog {
    patch_number: string;
    patch_name: string;
    patch_timestamp: number;
    general: PatchGeneral;
    neutral_items?: PatchNeutralItem[];
    items: PatchItem[];
    heroes: PatchHero[];
    bosses?: PatchBoss[];
    neutral_creeps?: PatchNeutralCreep[];
}
