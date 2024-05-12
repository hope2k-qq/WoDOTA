import styles from "./side_bar_menu_item.module.scss"

interface Props {
    title: string;
    icon: React.ReactNode;
    onNavigate: () => void;
}

export const SideBarMenuItem: React.FC<Props> = ({title, icon, onNavigate}) => {

    return (
        <div className={styles.div} onClick={() => onNavigate()}>
            {icon}
            <div>{title}</div>
        </div>
    );
};