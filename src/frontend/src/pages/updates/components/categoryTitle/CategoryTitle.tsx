import styles from './category_title.module.scss';

type CategoryAttr = 'strength' | 'agility' | 'intelligence';

const attrIcon: Record<CategoryAttr, string> = {
    strength: '/str.png',
    agility: '/agi.png',
    intelligence: '/int.png',
};

type CategoryTitleProps = {
    text: string;
    background?: string;
    icon?: CategoryAttr;
};

export const CategoryTitle = ({ text, background, icon }: CategoryTitleProps) => (
    <div className={styles.title} style={background ? { background } : undefined}>
        {icon && <img className={styles.icon} src={attrIcon[icon]} alt={icon} />}
        {text}
    </div>
);
