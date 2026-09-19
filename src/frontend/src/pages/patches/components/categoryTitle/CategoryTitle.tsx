import styles from './category_title.module.scss';

type CategoryAttr = 'strength' | 'agility' | 'intelligence';

const attrIcon: Record<CategoryAttr, string> = {
    strength: '/str.png',
    agility: '/agi.png',
    intelligence: '/int.png',
};

type CategoryTitleProps = {
    text: string;
    icon?: CategoryAttr;
};

export const CategoryTitle = ({ text, icon }: CategoryTitleProps) => (
    <div className={`${styles.title}${icon ? ` ${styles[icon]}` : ''}`}>
        {icon && <img className={styles.icon} src={attrIcon[icon]} alt={icon} />}
        {text}
    </div>
);
