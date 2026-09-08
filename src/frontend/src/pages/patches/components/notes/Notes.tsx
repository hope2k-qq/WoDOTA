import type { Localized, PatchNote } from '../../../../types/patchlog';
import { noteText } from '../../patches.utils';
import styles from './notes.module.scss';

type NoteInput = PatchNote | Localized;

const isPatchNote = (n: NoteInput): n is PatchNote =>
    n != null && typeof n === 'object' && 'note' in n;

export const Notes = ({ notes }: { notes: NoteInput[] }) => {
    const items = notes
        .map((n) => isPatchNote(n)
            ? { text: noteText(n.note), icon: n.icon ?? undefined }
            : { text: noteText(n), icon: undefined })
        .filter((item) => item.text);
    if (!items.length) return null;
    return (
        <ul className={styles.notes}>
            {items.map(({ text, icon }, i) => (
                <li key={i} className={styles.note}>
                    {icon
                        ? <img className={styles.icon} src={icon} alt="" loading="lazy" />
                        : <div className={styles.dot} />}
                    {text}
                </li>
            ))}
        </ul>
    );
};
