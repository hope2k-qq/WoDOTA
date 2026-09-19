import { useLocation } from 'react-router-dom';
import type { PatchAbility, PatchBoss, PatchHero, PatchNeutralCreep, PatchNote } from '../../../../types/patchlog';
import type { Copy } from '../../patches.constants';
import { noteText, patchImageUrl } from '../../patches.utils';
import { Notes } from '../notes/Notes';
import { AbilityList } from '../abilityList/AbilityList';
import { CategoryTitle } from '../categoryTitle/CategoryTitle';
import { TalentPreview } from '../../../../widgets/talentPreview/TalentPreview';
import styles from './entity_block.module.scss';

type Branch = { key: 'strength' | 'agility' | 'intelligence'; label: string };

type EntityBlockProps =
    | { kind: 'hero'; hero: PatchHero; t: Copy; version?: string }
    | { kind: 'boss'; boss: PatchBoss; t: Copy; version?: string }
    | { kind: 'creep'; creep: PatchNeutralCreep; t: Copy; version?: string };

const ATTR_ICON: Record<NonNullable<PatchHero['primary_attribute']>, string> = {
    strength: '/str.png',
    agility: '/agi.png',
    intelligence: '/int.png',
    universal: '/uni.png',
};

export const EntityBlock = (props: EntityBlockProps) => {
    const { t } = props;
    const { pathname } = useLocation();
    const heroHref = props.kind === 'hero' ? `/${pathname.split('/')[1]}/hero/${props.hero.hero_id}` : null;

    let portraitSrc = '';
    let name = '';
    let attrIcon: string | null = null;
    let badge: { text: string; cls: string } | null = null;
    let baseNotes: PatchNote[] = [];
    let abilities: PatchAbility[] = [];
    let hero: PatchHero | null = null;

    const imgSrc = (image?: string) => patchImageUrl(image, props.version);

    if (props.kind === 'hero') {
        hero = props.hero;
        portraitSrc = imgSrc(hero.image);
        attrIcon = hero.primary_attribute ? ATTR_ICON[hero.primary_attribute] : null;
        name = hero.name ?? '';
        if (hero.is_new) badge = { text: t.newHeroBadge, cls: styles.tag };
        baseNotes = hero.hero_notes || [];
        abilities = hero.abilities || [];
    } else if (props.kind === 'boss') {
        const boss = props.boss;
        portraitSrc = imgSrc(boss.image);
        name = boss.name ?? '';
        abilities = boss.abilities || [];
    } else {
        const creep = props.creep;
        portraitSrc = imgSrc(creep.image);
        name = (creep.name ? noteText(creep.name) : '') || creep.neutral_creep_id;
        baseNotes = creep.neutral_creep_notes || [];
        abilities = creep.abilities || [];
        if (creep.is_new) badge = { text: t.newBadge, cls: styles.tag };
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
        <div className={styles.entity_block}>
            <div className={styles.entity_head}>
                {portraitSrc && heroHref && (
                    <a
                        className={styles.portrait_link}
                        href={heroHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={name}
                    >
                        <img
                            className={styles.entity_portrait}
                            src={portraitSrc}
                            alt={name}
                            loading="lazy"
                        />
                    </a>
                )}
                {portraitSrc && !heroHref && (
                    <img
                        className={styles.entity_portrait}
                        src={portraitSrc}
                        alt={name}
                        loading="lazy"
                    />
                )}
                <div className={styles.entity_title}>
                    <div className={styles.entity_name}>
                        {attrIcon && <img className={styles.attr_icon} src={attrIcon} alt="" loading="lazy" />}
                        {name}
                    </div>
                    {badge && <span className={badge.cls}>{badge.text}</span>}
                </div>
            </div>
            <div className={styles.line}></div>

            {hasBase && (
                <div className={styles.base_notes}>
                    <div className={styles.sub_title}>{t.base}</div>
                    <Notes notes={baseNotes} />
                </div>
            )}

            {hasAbilities && (
                <>
                    <div className={styles.sub_title}>{t.abilities}</div>
                    <AbilityList abilities={abilities} version={props.version} />
                </>
            )}

            {hasTalents && hero && (
                <>
                    <div className={styles.sub_title}>{t.talents}</div>
                    {branches
                        .map((b) => ({
                            b,
                            entries: (hero!.talents?.[b.key] || []).filter((e) =>
                                (e.talent_notes || []).some((n) => noteText(n.note))
                            ),
                        }))
                        .filter(({ entries }) => entries.length > 0)
                        .map(({ b, entries }) => {
                        return (
                            <div className={styles.branch} key={b.key}>
                                <div className={styles.branch_heading}>
                                    <CategoryTitle text={b.label} icon={b.key} />
                                </div>
                                {entries.map((entry, j) => {
                                    const notes = entry.talent_notes || [];
                                    if (!notes.some((n) => noteText(n.note))) return null;
                                    const title = entry.title ? noteText(entry.title) : '';
                                    const firstRow = j === 0;
                                    return (
                                        <div className={firstRow ? `${styles.talent_row} ${styles.talent_row_first}` : styles.talent_row} key={entry.talent_id}>
                                            {entry.image && (
                                                <TalentPreview
                                                    className={entry.talent_text
                                                        ? `${styles.talent_preview} ${styles.talent_preview_hint}`
                                                        : styles.talent_preview}
                                                    vertical="up"
                                                    autoFlip
                                                    text={entry.talent_text ? noteText(entry.talent_text) : ''}
                                                >
                                                    <img
                                                        className={styles.talent_icon}
                                                        src={patchImageUrl(entry.image, props.version)}
                                                        alt={name}
                                                        loading="lazy"
                                                    />
                                                </TalentPreview>
                                            )}
                                            <div className={styles.talent_body}>
                                                {title && <div className={styles.talent_title}>{title}</div>}
                                                <Notes notes={notes} />
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
