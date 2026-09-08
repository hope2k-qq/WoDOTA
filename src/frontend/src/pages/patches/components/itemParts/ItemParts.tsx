import type { Localized, PatchDescriptionSection, PatchEntityValue } from '../../../../types/patchlog';
import { noteText } from '../../patches.utils';
import styles from './item_parts.module.scss';

export const ItemDescription = ({
    description,
    sections,
}: {
    description?: Localized | null;
    sections?: PatchDescriptionSection[];
}) => {
    if (sections?.length) {
        return (
            <div className={styles.item_description_sections}>
                {sections.map((section, index) => (
                    <div className={styles.item_description_section} key={`${noteText(section.title)}-${index}`}>
                        <div className={styles.item_description_title}>{noteText(section.title)}</div>
                        <div className={styles.item_description_text}>{noteText(section.text)}</div>
                    </div>
                ))}
            </div>
        );
    }
    const text = description ? noteText(description) : '';
    return text ? <div className={styles.item_description}>{text}</div> : null;
};

export const ItemValues = ({ values }: { values?: PatchEntityValue[] }) => {
    if (!values?.length) return null;
    return (
        <div className={styles.item_values}>
            {values.map((entry) => (
                <div className={styles.item_value} key={entry.key}>
                    <strong>{entry.value}</strong>
                    <span>{noteText(entry.label)}</span>
                </div>
            ))}
        </div>
    );
};

export const ItemRecipe = ({ recipe }: { recipe?: Localized }) => {
    if (!recipe) return null;
    return <div className={styles.item_recipe}>{noteText(recipe)}</div>;
};
