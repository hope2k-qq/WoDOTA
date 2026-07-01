import type { LegalSectionConfig } from "../../../types/legal";

export const termsSections: LegalSectionConfig[] = [
    {
        num: "1.",
        titleKey: "terms_s1_title",
        clauses: [
            {
                num: "1.1",
                introKey: "terms_s1_intro",
                definitions: [
                    { termKey: "terms_s1_def1_term", descKey: "terms_s1_def1_desc" },
                    { termKey: "terms_s1_def2_term", descKey: "terms_s1_def2_desc" },
                    { termKey: "terms_s1_def3_term", descKey: "terms_s1_def3_desc" },
                    { termKey: "terms_s1_def4_term", descKey: "terms_s1_def4_desc" },
                    { termKey: "terms_s1_def5_term", descKey: "terms_s1_def5_desc" },
                ],
            },
        ],
    },
    {
        num: "2.",
        titleKey: "terms_s2_title",
        clauses: [
            { num: "2.1", textKey: "terms_s2_c1" },
            { num: "2.2", textKey: "terms_s2_c2" },
            { num: "2.3", textKey: "terms_s2_c3" },
            { num: "2.4", textKey: "terms_s2_c4" },
        ],
    },
    {
        num: "3.",
        titleKey: "terms_s3_title",
        clauses: [
            { num: "3.1", textKey: "terms_s3_c1" },
            { num: "3.2", textKey: "terms_s3_c2" },
            { num: "3.3", textKey: "terms_s3_c3" },
        ],
    },
    {
        num: "4.",
        titleKey: "terms_s4_title",
        clauses: [
            { num: "4.1", textKey: "terms_s4_c1" },
            { num: "4.2", textKey: "terms_s4_c2" },
            { num: "4.3", textKey: "terms_s4_c3" },
            { num: "4.4", textKey: "terms_s4_c4" },
        ],
    },
    {
        num: "5.",
        titleKey: "terms_s5_title",
        clauses: [
            { num: "5.1", textKey: "terms_s5_c1" },
            { num: "5.2", textKey: "terms_s5_c2" },
            { num: "5.3", textKey: "terms_s5_c3" },
        ],
    },
    {
        num: "6.",
        titleKey: "terms_s6_title",
        clauses: [
            { num: "6.1", textKey: "terms_s6_c1" },
            { num: "6.2", textKey: "terms_s6_c2" },
            { num: "6.3", textKey: "terms_s6_c3" },
            { num: "6.4", textKey: "terms_s6_c4" },
        ],
    },
    {
        num: "7.",
        titleKey: "terms_s7_title",
        clauses: [
            { num: "7.1", textKey: "terms_s7_c1" },
            { num: "7.2", textKey: "terms_s7_c2" },
            { num: "7.3", textKey: "terms_s7_c3" },
        ],
    },
    {
        num: "8.",
        titleKey: "terms_s8_title",
        clauses: [
            { num: "8.1", textKey: "terms_s8_c1" },
            { num: "8.2", textKey: "terms_s8_c2" },
        ],
    },
    {
        num: "9.",
        titleKey: "terms_s9_title",
        clauses: [{ num: "9.1", textKey: "terms_s9_c1" }],
    },
    {
        num: "10.",
        titleKey: "terms_s10_title",
        clauses: [{ num: "10.1", textKey: "terms_s10_c1" }],
    },
];
