import { getImageUrl } from '../../../../utils/r2Storage';
import type { NoteLang, NoteText, PatchAbility, PatchBoss, PatchHero, PatchNeutralCreep } from '../../../../types/patchlog';
import type { Copy } from '../../updates.constants';
import { fallbackOnError, noteText, PATCH_FALLBACK, talentNumber, titleCase } from '../../updates.utils';
import { Notes } from '../notes/Notes';
import { AbilityList } from '../abilityList/AbilityList';
import { CategoryTitle } from '../categoryTitle/CategoryTitle';
import styles from './entity_block.module.scss';

type Branch = { key: 'strength' | 'agility' | 'intelligence'; label: string };

const branchBackground: Record<Branch['key'], string> = {
    strength: 'linear-gradient(to right, rgba(224, 82, 75, 0.35), rgba(224, 82, 75, 0) 60%)',
    agility: 'linear-gradient(to right, rgba(111, 191, 74, 0.35), rgba(111, 191, 74, 0) 60%)',
    intelligence: 'linear-gradient(to right, rgba(74, 168, 230, 0.35), rgba(74, 168, 230, 0) 60%)',
};

type EntityBlockProps =
    | { kind: 'hero'; hero: PatchHero; lang: NoteLang; t: Copy }
    | { kind: 'boss'; boss: PatchBoss; lang: NoteLang; t: Copy }
    | { kind: 'creep'; creep: PatchNeutralCreep; lang: NoteLang; t: Copy };

const ATTR_ICON: Record<NonNullable<PatchHero['primary_attribute']>, string> = {
    strength: '/str.png',
    agility: '/agi.png',
    intelligence: '/int.png',
    universal: '/uni.png',
};

export const EntityBlock = (props: EntityBlockProps) => {
    const { lang, t } = props;

    let portraitSrc = '';
    let portraitFallback = '';
    let name = '';
    let attrIcon: string | null = null;
    let badge: { text: string; cls: string } | null = null;
    let baseNotes: NoteText[] = [];
    let abilities: PatchAbility[] = [];
    let hero: PatchHero | null = null;

    if (props.kind === 'hero') {
        hero = props.hero;
        portraitSrc = getImageUrl(`images/heroes/heroesPreview/${hero.hero_id}.webp`);
        portraitFallback = PATCH_FALLBACK.hero;
        attrIcon = hero.primary_attribute ? ATTR_ICON[hero.primary_attribute] : null;
        name = titleCase(hero.hero_id);
        if (hero.is_new) badge = { text: t.newHeroBadge, cls: styles.newTag };
        baseNotes = (hero.hero_notes || []).map((n) => n.note);
        abilities = hero.abilities || [];
    } else if (props.kind === 'boss') {
        const boss = props.boss;
        const cleanId = boss.boss_id.replace(/_boss.*$/, '');
        portraitSrc = getImageUrl(`images/heroes/heroesPreview/${cleanId}.webp`);
        portraitFallback = PATCH_FALLBACK.hero;
        name = titleCase(boss.boss_id);
        abilities = boss.abilities || [];
    } else {
        const creep = props.creep;
        portraitSrc = PATCH_FALLBACK.creep;
        portraitFallback = PATCH_FALLBACK.creep;
        name = (creep.name ? noteText(creep.name, lang) : '') || creep.neutral_creep_id;
        baseNotes = (creep.neutral_creep_notes || []).map((n) => n.note);
        abilities = creep.abilities || [];
        if (creep.is_new) badge = { text: t.newBadge, cls: styles.newTag };
    }

    const branches: Branch[] = [
        { key: 'strength', label: t.str },
        { key: 'agility', label: t.agi },
        { key: 'intelligence', label: t.int },
    ];
    const hasBase = baseNotes.length > 0;
    const hasAbilities = abilities.length > 0;
    const hasTalents = !!hero && branches.some((b) => (hero!.talents?.[b.key] || []).length > 0);

    return (
        <div className={styles.heroBlock}>
            <div className={styles.heroHead}>
                {portraitSrc && (
                    <img
                        className={styles.heroPortrait}
                        src={portraitSrc}
                        alt={name}
                        loading="lazy"
                        onError={fallbackOnError(portraitFallback)}
                    />
                )}
                <div className={styles.heroTitle}>
                    <div className={styles.heroName}>
                        {attrIcon && <img className={styles.attrIcon} src={attrIcon} alt="" loading="lazy" />}
                        {name}
                    </div>
                    {badge && <span className={badge.cls}>{badge.text}</span>}
                </div>
            </div>
            <div className={styles.line}></div>

            {hasBase && (
                <>
                    <div className={styles.subTitle}>{t.base}</div>
                    <Notes notes={baseNotes} lang={lang} />
                </>
            )}

            {hasAbilities && (
                <>
                    <div className={styles.subTitle}>{t.abilities}</div>
                    <AbilityList abilities={abilities} lang={lang} t={t} />
                </>
            )}

            {hasTalents && hero && (
                <>
                    <div className={styles.subTitle}>{t.talents}</div>
                    {branches
                        .map((b) => ({
                            b,
                            entries: (hero!.talents?.[b.key] || []).filter((e) =>
                                (e.talent_notes || []).some((n) => noteText(n.note, lang))
                            ),
                        }))
                        .filter(({ entries }) => entries.length > 0)
                        .map(({ b, entries }) => {
                        return (
                            <div className={styles.branch} key={b.key}>
                                <div className={styles.branchHeading}>
                                    <CategoryTitle text={b.label} icon={b.key} background={branchBackground[b.key]} />
                                </div>
                                {entries.map((entry, j) => {
                                    const notes = (entry.talent_notes || []).map((n) => n.note);
                                    if (!notes.some((n) => noteText(n, lang))) return null;
                                    const num = talentNumber(hero!.hero_id, entry.talent_id);
                                    const title = entry.title ? noteText(entry.title, lang) : '';
                                    const firstRow = j === 0;
                                    return (
                                        <div className={firstRow ? `${styles.talentRow} ${styles.talentRowFirst}` : styles.talentRow} key={entry.talent_id}>
                                            {num && (
                                                <img
                                                    className={styles.talentIcon}
                                                    src={getImageUrl(`images/heroes/talents/${hero!.hero_id}/${num}.webp`)}
                                                    alt={title || `talent ${num}`}
                                                    loading="lazy"
                                                    onError={fallbackOnError(PATCH_FALLBACK.ability)}
                                                />
                                            )}
                                            <div className={styles.talentBody}>
                                                {title && <div className={styles.talentTitle}>{title}</div>}
                                                <Notes notes={notes} lang={lang} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
};
