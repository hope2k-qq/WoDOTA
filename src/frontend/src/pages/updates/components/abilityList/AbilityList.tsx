import { useState } from 'react';
import { getImageUrl } from '../../../../utils/r2Storage';
import type { NoteLang, PatchAbility } from '../../../../types/patchlog';
import type { Copy } from '../../updates.constants';
import { abilityKey, abilityName, fallbackOnError, noteText, PATCH_FALLBACK } from '../../updates.utils';
import { Notes } from '../notes/Notes';
import styles from './ability_list.module.scss';

const INNATE_ICON = 'https://cdn.wodota.net/abilities/innate_icon.png';

const AbilityIcon = ({ src, innate }: { src: string; innate?: boolean }) => {
    const [failed, setFailed] = useState(false);

    if (!innate) {
        return (
            <img className={styles.abilityIcon} src={src} alt="" loading="lazy" onError={fallbackOnError(PATCH_FALLBACK.ability)} />
        );
    }

    return (
        <div className={styles.abilityIconWrap}>
            <img
                className={styles.abilityIcon}
                src={failed ? INNATE_ICON : src}
                alt=""
                loading="lazy"
                onError={() => setFailed(true)}
            />
            {!failed && (
                <span className={styles.innateBadge}>
                    <img className={styles.innateBadgeImg} src={INNATE_ICON} alt="" loading="lazy" />
                </span>
            )}
        </div>
    );
};

export const AbilityList = ({
    abilities,
    lang,
}: {
    abilities: PatchAbility[];
    lang: NoteLang;
    t: Copy;
}) => (
    <>
        {abilities.map((ab) => {
            const items = ab.ability_notes.map((n) => noteText(n.note, lang)).filter(Boolean);
            const description = ab.description ? noteText(ab.description, lang) : '';
            const values = ab.ability_values || [];
            const iconKey = abilityKey(ab.image || ab.ability_id);
            if (!items.length && !description && !values.length) return null;
            return (
                <div className={styles.ability} key={ab.ability_id}>
                    <div className={styles.abilityHead}>
                        <AbilityIcon src={getImageUrl(`abilities/${iconKey}.webp`)} innate={ab.innate} />
                        <div>
                            <div className={styles.abilityName}>
                                {ab.name ? noteText(ab.name, lang) || abilityName(ab.ability_id) : abilityName(ab.ability_id)}
                            </div>
                            <Notes notes={ab.ability_notes.map((n) => n.note)} lang={lang} />
                            {description && <div className={styles.abilityDesc}>{description}</div>}
                            {values.length > 0 && (
                                <div className={styles.abilityValues}>
                                    {values.map((entry) => (
                                        <div className={styles.abilityValue} key={entry.key}>
                                            <span>{noteText(entry.label, lang)}:</span>
                                            <strong>{entry.value}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            );
        })}
    </>
);
