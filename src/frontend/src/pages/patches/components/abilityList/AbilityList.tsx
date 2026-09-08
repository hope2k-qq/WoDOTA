import type { PatchAbility } from '../../../../types/patchlog';
import { noteText, patchImageUrl } from '../../patches.utils';
import { Notes } from '../notes/Notes';
import styles from './ability_list.module.scss';

const innate_icon = 'https://cdn.wodota.net/abilities/innate_icon.png';

const AbilityIcon = ({ src, innate }: { src: string; innate?: boolean }) => {
    if (!innate) {
        return <img className={styles.ability_icon} src={src} alt="" loading="lazy" />;
    }
    return (
        <div className={styles.ability_icon_wrap}>
            <img className={styles.ability_icon} src={src} alt="" loading="lazy" />
            <span className={styles.innate_badge}>
                <img className={styles.innate_badge_img} src={innate_icon} alt="" loading="lazy" />
            </span>
        </div>
    );
};

export const AbilityList = ({
    abilities,
    version,
}: {
    abilities: PatchAbility[];
    version?: string;
}) => (
    <>
        {abilities.map((ab) => {
            const items = ab.ability_notes.map((n) => noteText(n.note)).filter(Boolean);
            const descriptions = ab.description
                ? (Array.isArray(ab.description) ? ab.description : [ab.description])
                : [];
            if (!items.length && !descriptions.length) return null;
            return (
                <div className={styles.ability} key={ab.ability_id}>
                    <div className={styles.ability_head}>
                        <AbilityIcon src={patchImageUrl(ab.image, version)} innate={ab.innate && ab.image !== 'abilities/innate_icon.png'} />
                        <div>
                            <div className={styles.ability_name}>
                                {noteText(ab.name)}
                            </div>
                            <Notes notes={ab.ability_notes.map((n) => n.note)} />
                            {descriptions.length > 0 && (
                                <div className={styles.ability_desc}>
                                    <Notes notes={descriptions} />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            );
        })}
    </>
);
