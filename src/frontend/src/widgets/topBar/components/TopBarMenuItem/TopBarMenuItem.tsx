import styles from "./top_bar_menu_item.module.scss";

interface Props {
    title: string;
    onNavigate: () => void;
    icon?: React.ReactNode;
    isActive?: boolean;
    menuOpen: boolean;
}

export const TopBarMenuItem: React.FC<Props> = ({ title, onNavigate, isActive, menuOpen, icon }) => {
    return (
        <div
            className={`${styles.menuItem} ${isActive ? styles.active : ''} ${menuOpen ? styles.open : ''}`}
            onClick={onNavigate}
        >
            {icon}
            <div className={styles.title} style={menuOpen ? {color: "#9b9db1"} : undefined}>{title}</div>
        </div>
    );
};
