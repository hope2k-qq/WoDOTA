import type { Localized, PatchDescriptionSection, PatchEntityValue, PatchItem, PatchNeutralItem, StatNote } from '../../../../types/patchlog';
import { noteText, patchImageUrl } from '../../patches.utils';
import { Notes } from '../notes/Notes';
import { ItemDescription, ItemValues, ItemRecipe } from '../itemParts/ItemParts';
import { CategoryTitle } from '../categoryTitle/CategoryTitle';
import styles from './items.module.scss';
import notes_styles from '../notes/notes.module.scss';

const NEGATIVE_COLOR = '#e03e2e';

type ItemCardProps = {
    id: string;
    name?: string;
    image?: string | null;
    caption?: string | null;
    headNotes?: Localized[];
    statNotes?: StatNote[];
    description?: Localized | null;
    sections?: PatchDescriptionSection[];
    values?: PatchEntityValue[];
    recipe?: Localized;
    notes: Localized[];
    divider?: boolean;
    version?: string;
};

const ItemCard = ({ id, name, image, caption, headNotes, statNotes, description, sections, values, recipe, notes, divider = true, version }: ItemCardProps) => (
    <div className={divider ? styles.item_container : `${styles.item_container} ${styles.item_container_first}`}>
        {divider && <div className={styles.line}></div>}
        <div className={styles.item}>
            <img
                className={styles.item_image}
                src={patchImageUrl(image || undefined, version)}
                alt={id}
                loading="lazy"
            />
            <div className={styles.item_title}>
                <div className={styles.item_name}>
                    {name}
                </div>
                {caption && <span className={styles.tag}>{caption}</span>}
            </div>
        </div>
        {headNotes?.length ? <Notes notes={headNotes} /> : null}
        {statNotes && statNotes.length > 0 && (
            <ul className={notes_styles.notes}>
                {statNotes.map((s, i) => {
                    const text = noteText(s.note);
                    if (!text) return null;
                    return (
                        <li key={i} className={notes_styles.note} style={s.negative ? { color: NEGATIVE_COLOR } : undefined}>
                            <div className={notes_styles.dot} />
                            {text}
                        </li>
                    );
                })}
            </ul>
        )}
        <ItemDescription description={description} sections={sections} />
        <ItemValues values={values} />
        <ItemRecipe recipe={recipe} />
        <Notes notes={notes} />
    </div>
);


type RegularItemsProps = { title?: string; list: PatchItem[]; version?: string };

export const RegularItems = ({ title, list, version }: RegularItemsProps) => (
    <div className={styles.item_card}>
        {title && (
            <div className={styles.section_title}>
                <CategoryTitle text={title} />
            </div>
        )}
        {list.map((it, i) => (
            <ItemCard
                key={it.item_id}
                id={it.item_id}
                name={it.name}
                image={it.image}
                caption={it.caption ? noteText(it.caption) : null}
                headNotes={it.item_notes.map((n) => n.note)}
                notes={[]}
                divider={i !== 0}
                version={version}
            />
        ))}
    </div>
);


const NeutralItemCard = ({ it, first, version }: { it: PatchNeutralItem; first?: boolean; version?: string }) => (
    <ItemCard
        id={it.neutral_item_id}
        name={it.name}
        image={it.image}
        caption={it.caption ? noteText(it.caption) : null}
        headNotes={it.description ? [it.description] : []}
        statNotes={it.stat_notes}
        values={it.item_values}
        recipe={it.recipe}
        notes={it.neutral_item_notes.map((n) => n.note)}
        divider={!first}
        version={version}
    />
);

type NeutralItemsProps = {
    title: string;
    list: PatchNeutralItem[];
    version?: string;
};

export const NeutralItems = ({ title, list, version }: NeutralItemsProps) => (
    <div className={styles.item_card}>
        <div className={styles.section_title}>
            <CategoryTitle text={title} />
        </div>
        {list.map((it, i) => (
            <NeutralItemCard it={it} first={i === 0} key={it.neutral_item_id} version={version} />
        ))}
    </div>
);
