import { Fragment, type ReactNode } from 'react';
import { getImageUrl } from '../../../../utils/r2Storage';
import type { NoteLang, NoteText, PatchDescriptionSection, PatchEntityValue, PatchItem, PatchNeutralItem } from '../../../../types/patchlog';
import type { Copy } from '../../updates.constants';
import { fallbackOnError, itemImageKey, itemName, PATCH_FALLBACK, titleCase } from '../../updates.utils';
import { Notes } from '../notes/Notes';
import { ItemDescription, ItemValues, ItemRecipe } from '../itemParts/ItemParts';
import { CategoryTitle } from '../categoryTitle/CategoryTitle';
import styles from './items.module.scss';

type NeutralKind = 'artifact' | 'enhancement';


type ItemCardProps = {
    id: string;
    image?: string | null;
    badges?: ReactNode;
    description?: NoteText | null;
    sections?: PatchDescriptionSection[];
    values?: PatchEntityValue[];
    recipe?: NoteText;
    notes: NoteText[];
    lang: NoteLang;
    divider?: boolean;
};

const ItemCard = ({ id, image, badges, description, sections, values, recipe, notes, lang, divider = true }: ItemCardProps) => (
    <div className={divider ? styles.item_container : `${styles.item_container} ${styles.item_container_first}`}>
        {divider && <div className={styles.line}></div>}
        <div className={styles.item}>
            <img
                className={styles.item_image}
                src={getImageUrl(`images/items/${itemImageKey(id, image)}.webp`)}
                alt={id}
                loading="lazy"
                onError={fallbackOnError(PATCH_FALLBACK.item)}
            />
            <div className={styles.item_name}>
                {itemName(id)}
                {badges && <span className={styles.item_badges}>{badges}</span>}
            </div>
        </div>
        <ItemDescription description={description} sections={sections} lang={lang} />
        <ItemValues values={values} lang={lang} />
        <ItemRecipe recipe={recipe} lang={lang} />
        <Notes notes={notes} lang={lang} />
    </div>
);


type RegularItemsProps = { list: PatchItem[]; lang: NoteLang; t: Copy };

export const RegularItems = ({ list, lang, t }: RegularItemsProps) => (
    <div className={styles.item_card}>
        {list.map((it, i) => {
            const category = it.is_new && it.category
                ? (t.shopCategories as Record<string, string>)[it.category] || titleCase(it.category)
                : '';
            const badges = it.is_new ? (
                <>
                    <span className={`${styles.badge} ${styles.badge_new}`}>{t.newItemBadge}</span>
                    {category && (
                        <span className={`${styles.badge} ${styles.badge_category}`}>{t.category}: {category}</span>
                    )}
                </>
            ) : null;
            return (
                <ItemCard
                    key={it.item_id}
                    id={it.item_id}
                    image={it.image}
                    badges={badges}
                    description={it.description}
                    sections={it.description_sections}
                    values={it.item_values}
                    recipe={it.recipe}
                    notes={it.item_notes.map((n) => n.note)}
                    lang={lang}
                    divider={i !== 0}
                />
            );
        })}
    </div>
);


export const isNeutralEnhancement = (it: PatchNeutralItem) =>
    it.neutral_type === 'enhancement' || it.neutral_item_id.startsWith('item_enhancement_');

const badgeValue = (value: number | number[] | null | undefined) =>
    Array.isArray(value) ? value.join(', ') : value;

const rankText = (value: number | number[] | null | undefined) => {
    if (Array.isArray(value)) return value.join(', ');
    return value == null ? '' : `${value}-го`;
};

const neutralAdditionRank = (it: PatchNeutralItem) => {
    if (isNeutralEnhancement(it)) return it.new_rank ?? (it.is_new ? it.rank : null);
    return it.is_new ? it.tier : null;
};

const neutralAdditionTitle = (lang: NoteLang, kind: NeutralKind, value: number | number[] | null | undefined) => {
    const readable = badgeValue(value);
    const ordinal = rankText(value);
    if (lang === 'ru') return kind === 'enhancement'
        ? `Новые чары ${ordinal} разряда`
        : `Новые артефакты ${ordinal} разряда`;
    if (lang === 'uk') return kind === 'enhancement'
        ? `Нові чари ${readable}-го розряду`
        : `Нові артефакти ${readable}-го розряду`;
    if (lang === 'cs') return kind === 'enhancement'
        ? `Nová vylepšení ranku ${readable}`
        : `Nové artefakty ranku ${readable}`;
    return kind === 'enhancement'
        ? `New rank ${readable} enhancements`
        : `New rank ${readable} artifacts`;
};

const NeutralItemCard = ({ it, lang, t, first }: { it: PatchNeutralItem; lang: NoteLang; t: Copy; first?: boolean }) => (
    <ItemCard
        id={it.neutral_item_id}
        image={it.image}
        badges={it.is_new ? <span className={`${styles.badge} ${styles.badge_new}`}>{t.newBadge}</span> : null}
        description={it.description}
        sections={it.description_sections}
        values={it.item_values}
        recipe={it.recipe}
        notes={it.neutral_item_notes.map((n) => n.note)}
        lang={lang}
        divider={!first}
    />
);

type NeutralItemsProps = {
    title: string;
    kind: NeutralKind;
    list: PatchNeutralItem[];
    lang: NoteLang;
    t: Copy;
};

export const NeutralItems = ({ title, kind, list, lang, t }: NeutralItemsProps) => {
    const grouped = new Map<string, { value: number | number[]; items: PatchNeutralItem[] }>();
    const regular: PatchNeutralItem[] = [];
    for (const item of list) {
        const value = neutralAdditionRank(item);
        if (value == null) {
            regular.push(item);
            continue;
        }
        const key = Array.isArray(value) ? value.join(',') : String(value);
        if (!grouped.has(key)) grouped.set(key, { value, items: [] });
        grouped.get(key)!.items.push(item);
    }
    let index = 0;
    const renderCard = (it: PatchNeutralItem) => (
        <NeutralItemCard it={it} lang={lang} t={t} first={index++ === 0} key={it.neutral_item_id} />
    );
    return (
        <div className={styles.item_card}>
            <div className={styles.section_title}>
                <CategoryTitle text={title} />
            </div>
            {Array.from(grouped.values()).map((group) => (
                <Fragment key={`${kind}-${badgeValue(group.value)}`}>
                    <div className={styles.neutralGroupTitle}>{neutralAdditionTitle(lang, kind, group.value)}</div>
                    {group.items.map(renderCard)}
                </Fragment>
            ))}
            {regular.map(renderCard)}
        </div>
    );
};
