export interface LegalDefinitionConfig {
    termKey: string;
    descKey: string;
}

export interface LegalClauseConfig {
    num: string;
    textKey?: string;
    introKey?: string;
    definitions?: LegalDefinitionConfig[];
}

export interface LegalSectionConfig {
    num: string;
    titleKey: string;
    clauses: LegalClauseConfig[];
}

export interface PrivacySectionConfig {
    titleKey: string;
    textKey: string;
}
