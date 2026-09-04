import type { NoteLang, NoteText, PatchDescriptionSection, PatchEntityValue } from '../../../../types/patchlog';
import { noteText } from '../../updates.utils';
import styles from './item_parts.module.scss';

export const ItemDescription = ({
    description,
    sections,
    lang,
}: {
    description?: NoteText | null;
    sections?: PatchDescriptionSection[];
    lang: NoteLang;
}) => {
    if (sections?.length) {
        return (
            <div className={styles.itemDescriptionSections}>
                {sections.map((section, index) => (
                    <div className={styles.itemDescriptionSection} key={`${noteText(section.title, lang)}-${index}`}>
                        <div className={styles.itemDescriptionTitle}>{noteText(section.title, lang)}</div>
                        <div className={styles.itemDescriptionText}>{noteText(section.text, lang)}</div>
                    </div>
                ))}
            </div>
        );
    }
    const text = description ? noteText(description, lang) : '';
    return text ? <div className={styles.item_description}>{text}</div> : null;
};

export const ItemValues = ({ values, lang }: { values?: PatchEntityValue[]; lang: NoteLang }) => {
    if (!values?.length) return null;
    return (
        <div className={styles.itemValues}>
            {values.map((entry) => (
                <div className={styles.itemValue} key={entry.key}>
                    <strong>{entry.value}</strong>
                    <span>{noteText(entry.label, lang)}</span>
                </div>
            ))}
        </div>
    );
};

export const ItemRecipe = ({ recipe, lang }: { recipe?: NoteText; lang: NoteLang }) => {
    if (!recipe) return null;
    return <div className={styles.itemRecipe}>{noteText(recipe, lang)}</div>;
};
