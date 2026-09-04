import type { NoteLang, NoteText } from '../../../../types/patchlog';
import { noteText } from '../../updates.utils';
import styles from './notes.module.scss';

export const Notes = ({ notes, lang }: { notes: NoteText[]; lang: NoteLang }) => {
    const items = notes.map((n) => noteText(n, lang)).filter(Boolean);
    if (!items.length) return null;
    return (
        <ul className={styles.notes}>
            {items.map((text, i) => (
                <li key={i} className={styles.note}>
                    <div className={styles.dot} />
                    {text}
                </li>
            ))}
        </ul>
    );
};
