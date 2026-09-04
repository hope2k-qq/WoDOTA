import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import type { PatchLog } from '../../types/patchlog';
import { copy } from './updates.constants';
import { getLang, titleCase } from './updates.utils';
import { SectionTitle } from './components/SectionTitle/SectionTitle';
import { Notes } from './components/notes/Notes';
import { EntityBlock } from './components/entityBlock/EntityBlock';
import { RegularItems, NeutralItems, isNeutralEnhancement } from './components/items/Items';
import { ReactComponent as ArrowDescIcon } from '../../assets/icons/ArrowDescIcon.svg';
import styles from './UpdatesPage.module.scss';

const API_URL = process.env.REACT_APP_API_URL;

export const UpdatesPage = () => {
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
            ? versions.find((v) => v.replace(',', '.') === versionParam)
            : undefined;
        if (matched) {
            setSelected(matched);
        } else {
            const latest = versions[versions.length - 1];
            navigate(`/${langPrefix}/patches/${latest.replace(',', '.')}`, { replace: true });
        }
    }, [versions, versionParam, langPrefix, navigate]);

    useEffect(() => {
        if (!selected) return;
        let alive = true;
        setLoading(true);
        setError(false);
        axios
            .get(`${API_URL}/patches/${selected}`)
            .then((res) => { if (alive) { setData(res.data?.changelog || null); setLoading(false); } })
            .catch(() => { if (alive) { setError(true); setLoading(false); } });
        return () => { alive = false; };
    }, [selected]);

    const versionLabel = useMemo(
        () => (data?.patch_number || selected || '').replace(',', '.'),
        [data, selected]
    );

    const globalChanges = data?.general?.global_changes || [];
    const heroesAdded = data?.general?.heroes?.added || [];
    const heroesRemoved = data?.general?.heroes?.removed || [];
    const hasGeneral = globalChanges.length > 0 || heroesAdded.length > 0 || heroesRemoved.length > 0;
    const neutralItems = data?.neutral_items || [];
    const neutralArtifacts = neutralItems.filter((it) => !isNeutralEnhancement(it));
    const neutralEnhancements = neutralItems.filter((it) => isNeutralEnhancement(it));
    const items = data?.items || [];
    const heroes = data?.heroes || [];
    const bosses = data?.bosses || [];
    const neutralCreeps = data?.neutral_creeps || [];

    return (
        <div className={styles.div}>
            <div className={styles.hero}>
                <div className={styles.heroInner}>
                    <div>
                        <div className={styles.eyebrow}>{t.eyebrow}</div>
                        <div className={styles.version}>{versionLabel || '—'}</div>
                    </div>
                    {versions.length > 0 && (
                        <div
                            className={styles.selectWrap}
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
                                <span>{selected.replace(',', '.')}</span>
                                <ArrowDescIcon
                                    className={`${styles.selectArrow} ${isVersionSelectOpen ? styles.selectArrowOpen : ''}`}
                                    aria-hidden="true"
                                />
                            </button>
                            {isVersionSelectOpen && (
                                <div className={styles.selectList} role="listbox">
                                    {[...versions].reverse().map((version) => (
                                        <button
                                            className={`${styles.option} ${version === selected ? styles.optionActive : ''}`}
                                            type="button"
                                            role="option"
                                            aria-selected={version === selected}
                                            key={version}
                                            onClick={() => {
                                                navigate(`/${langPrefix}/patches/${version.replace(',', '.')}`);
                                                setIsVersionSelectOpen(false);
                                            }}
                                        >
                                            {version.replace(',', '.')}
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
                                <div className={styles.subTitle}>{t.global}</div>
                                <Notes notes={globalChanges} lang={lang} />
                                {(heroesAdded.length > 0 || heroesRemoved.length > 0) && (
                                    <ul>
                                        {heroesAdded.map((h) => (
                                            <li key={`a-${h}`}>
                                                <span>{t.added}:</span>{titleCase(h)}
                                            </li>
                                        ))}
                                        {heroesRemoved.map((h) => (
                                            <li key={`r-${h}`} className={styles.note}>
                                                <span>{t.removed}:</span>{titleCase(h)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {bosses.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.bosses} />
                            <div className={styles.panel}>
                                {bosses.map((b) => (
                                    <EntityBlock kind="boss" key={b.boss_id} boss={b} lang={lang} t={t} />
                                ))}
                            </div>
                        </div>
                    )}

                    {neutralCreeps.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.neutralCreeps} />
                            <div className={styles.panel}>
                                {neutralCreeps.map((c) => (
                                    <EntityBlock kind="creep" key={c.neutral_creep_id} creep={c} lang={lang} t={t} />
                                ))}
                            </div>
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.items} />
                            <div className={styles.panel}>
                                <RegularItems list={items} lang={lang} t={t} />
                            </div>
                        </div>
                    )}

                    {neutralItems.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.neutralItems} />
                            <div className={styles.panel}>
                                {neutralArtifacts.length > 0 && (
                                    <NeutralItems title={t.neutralArtifacts} kind="artifact" list={neutralArtifacts} lang={lang} t={t} />
                                )}
                                {neutralEnhancements.length > 0 && (
                                    <NeutralItems title={t.neutralEnhancements} kind="enhancement" list={neutralEnhancements} lang={lang} t={t} />
                                )}
                            </div>
                        </div>
                    )}

                    {heroes.length > 0 && (
                        <div className={styles.section}>
                            <SectionTitle text={t.heroes} />
                            <div className={styles.panel}>
                                {heroes.map((h) => (
                                    <EntityBlock kind="hero" key={h.hero_id} hero={h} lang={lang} t={t} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UpdatesPage;
