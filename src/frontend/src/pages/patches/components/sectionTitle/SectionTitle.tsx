import styles from './section_title.module.scss';

export const SectionTitle = ({ text }: { text: string }) => (
    <div className={styles.sectionTitle}><span>{text}</span></div>
);
