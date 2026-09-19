import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import type { PatchLog, PatchGlobalEntry, PatchGlobalTitle, PatchGlobalSubtitle } from '../../types/patchlog';
import { copy } from './patches.constants';
import { getLang, noteText } from './patches.utils';
import { SectionTitle } from './components/sectionTitle/SectionTitle';
import { CategoryTitle } from './components/categoryTitle/CategoryTitle';
import { Notes } from './components/notes/Notes';
import { EntityBlock } from './components/entityBlock/EntityBlock';
import { RegularItems, NeutralItems } from './components/items/Items';
import { ReactComponent as ArrowDescIcon } from '../../assets/icons/ArrowDescIcon.svg';
import styles from './patches.module.scss';

const API_URL = process.env.REACT_APP_API_URL;

export const PatchesPage = () => {
    const { i18n } = useTranslation();
    const lang = getLang(i18n.language || 'ru');
    const t = copy[lang];

    const { version: versionParam } = useParams<{ version?: string }>();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const langPrefix = pathname.split('/')[1];

    const [versions, setVersions] = useState<string[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [data, setData] = useState<PatchLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isVersionSelectOpen, setIsVersionSelectOpen] = useState(false);
    const versionSelectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!versionSelectRef.current?.contains(event.target as Node)) {
                setIsVersionSelectOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    useEffect(() => {
        let alive = true;
        axios
            .get(`${API_URL}/patches/published/versions`)
            .then((res) => {
                if (!alive) return;
                const list: string[] = res.data?.versions || [];
                setVersions(list);
                if (!list.length) { setLoading(false); }
            })
            .catch(() => { if (alive) { setError(true); setLoading(false); } });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (!versions.length) return;
        const matched = versionParam
            ? versions.find((v) => v === versionParam)
            : undefined;
        if (matched) {
            setSelected(matched);
        } else {
            const latest = versions[versions.length - 1];
            navigate(`/${langPrefix}/patches/${latest}`, { replace: true });
        }
    }, [versions, versionParam, langPrefix, navigate]);

    useEffect(() => {
        if (!selected) return;
        let alive = true;
        setLoading(true);
        setError(false);
        axios
            .get(`${API_URL}/patches/${selected}`, { params: { lang } })
            .then((res) => { if (alive) { setData(res.data?.changelog || null); setLoading(false); } })
            .catch(() => { if (alive) { setError(true); setLoading(false); } });
        return () => { alive = false; };
    }, [selected, lang]);

    const versionLabel = useMemo(
        () => data?.patch_number || selected || '',
        [data, selected]
    );

    const globalChanges = useMemo(() => data?.general?.global_changes || [], [data]);
    const hasGeneral = globalChanges.length > 0;
    const isTitle = (e: PatchGlobalEntry): e is PatchGlobalTitle =>
        !!e && typeof e === 'object' && 'title' in e;
    const isSubtitle = (e: PatchGlobalEntry): e is PatchGlobalSubtitle =>
        !!e && typeof e === 'object' && 'subtitle' in e;
    type PlainNote = Exclude<PatchGlobalEntry, PatchGlobalTitle | PatchGlobalSubtitle>;
    const globalGroups = useMemo(() => {
        const groups: { title: string | null; blocks: { subtitle: string | null; notes: PlainNote[] }[] }[] = [];
        const lastGroup = () => {
            if (!groups.length) groups.push({ title: null, blocks: [] });
            return groups[groups.length - 1];
        };
        const lastBlock = (g: (typeof groups)[number]) => {
            if (!g.blocks.length) g.blocks.push({ subtitle: null, notes: [] });
            return g.blocks[g.blocks.length - 1];
        };
        for (const entry of globalChanges) {
            if (isTitle(entry)) { groups.push({ title: noteText(entry.title), blocks: [] }); continue; }
            if (isSubtitle(entry)) { lastGroup().blocks.push({ subtitle: noteText(entry.subtitle), notes: [] }); continue; }
            lastBlock(lastGroup()).notes.push(entry as PlainNote);
        }
        return groups.filter((g) => g.title || g.blocks.length);
    }, [globalChanges]);
    const neutralArtifacts = data?.neutral_items?.artifacts || [];
    const neutralEnhancements = data?.neutral_items?.enhancements || [];
    const neutralItems = [...neutralArtifacts, ...neutralEnhancements];
    const baseItems = data?.items?.base || [];
    const upgradeItems = data?.items?.upgrade || [];
    const items = [...baseItems, ...upgradeItems];
    const heroes = data?.heroes || [];
    const bosses = data?.bosses || [];
    const neutralCreeps = data?.neutral_creeps || [];

    return (
        <div className={styles.div}>
            <Helmet>
                <title>{versionLabel ? `${t.pageTitle} — ${versionLabel}` : t.pageTitle}</title>
            </Helmet>

            <div className={styles.patch_header}>
                <div className={styles.patch_content}>
                    <div>
                        <div className={styles.eyebrow}>{t.eyebrow}</div>
                        <div className={styles.version}>{versionLabel || '—'}</div>
                    </div>
                    {versions.length > 0 && (
                        <div
                            className={styles.select_wrap}
                            ref={versionSelectRef}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') setIsVersionSelectOpen(false);
                            }}
                        >
                            <button
                                className={styles.select}
                                type="button"
                                aria-haspopup="listbox"
                                aria-expanded={isVersionSelectOpen}
                                onClick={() => setIsVersionSelectOpen((isOpen) => !isOpen)}
                            >
                                <span>{selected}</span>
                                <ArrowDescIcon
                                    className={`${styles.select_arrow} ${isVersionSelectOpen ? styles.select_arrow_open : ''}`}
                                    aria-hidden="true"
                                />
                            </button>
                            {isVersionSelectOpen && (
                                <div className={styles.select_list} role="listbox">
                                    {[...versions].reverse().map((version) => (
                                        <button
                                            className={`${styles.option} ${version === selected ? styles.option_active : ''}`}
                                            type="button"
                                            role="option"
                                            aria-selected={version === selected}
                                            key={version}
                                            onClick={() => {
                                                navigate(`/${langPrefix}/patches/${version}`);
                                                setIsVersionSelectOpen(false);
                                            }}
                                        >
                                            {version}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {loading && <div></div>}

            {!loading && error && (
                <div></div>
            )}

            {!loading && !error && data && (
                <div className={styles.container}>
                    {!hasGeneral && !neutralItems.length && !items.length && !heroes.length && !bosses.length && !neutralCreeps.length && (
                        <div className={styles.status}>{t.empty}</div>
                    )}

                    {hasGeneral && (
                        <div>
                            <SectionTitle text={t.general} />
                            <div className={styles.panel}>
                                {globalGroups.map((group, i) => (
                                    <div className={styles.general_card} key={group.title || `group-${i}`}>
                                        {group.title && (
                                            <div className={styles.general_heading}>
                                                <CategoryTitle text={group.title} />
                                            </div>
                                        )}
                                        {group.blocks.map((block, j) => (
                                            <div
                                                key={block.subtitle || `block-${j}`}
                                                className={j === 0 && !block.subtitle ? styles.group_first : undefined}
                                            >
                                                {block.subtitle && (
                                                    <div className={styles.group_subtitle}>{block.subtitle}</div>
                                                )}
                                                <Notes notes={block.notes} />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {bosses.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.bosses} />
                            <div className={styles.panel}>
                                {bosses.map((b) => (
                                    <EntityBlock kind="boss" key={b.boss_id} boss={b} t={t} version={selected} />
                                ))}
                            </div>
                        </div>
                    )}

                    {neutralCreeps.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.neutralCreeps} />
                            <div className={styles.panel}>
                                {neutralCreeps.map((c) => (
                                    <EntityBlock kind="creep" key={c.neutral_creep_id} creep={c} t={t} version={selected} />
                                ))}
                            </div>
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.items} />
                            <div className={styles.panel}>
                                {baseItems.length > 0 && (
                                    <RegularItems title={t.baseItems} list={baseItems} version={selected} />
                                )}
                                {upgradeItems.length > 0 && (
                                    <RegularItems title={t.upgradeItems} list={upgradeItems} version={selected} />
                                )}
                            </div>
                        </div>
                    )}

                    {neutralItems.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.neutralItems} />
                            <div className={styles.panel}>
                                {neutralArtifacts.length > 0 && (
                                    <NeutralItems title={t.neutralArtifacts} list={neutralArtifacts} version={selected} />
                                )}
                                {neutralEnhancements.length > 0 && (
                                    <NeutralItems title={t.neutralEnhancements} list={neutralEnhancements} version={selected} />
                                )}
                            </div>
                        </div>
                    )}

                    {heroes.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.heroes} />
                            <div className={styles.panel}>
                                {heroes.map((h) => (
                                    <EntityBlock kind="hero" key={h.hero_id} hero={h} t={t} version={selected} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
