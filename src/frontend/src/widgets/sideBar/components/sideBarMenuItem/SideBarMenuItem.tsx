import styles from "./side_bar_menu_item.module.scss"

interface Props {
    title: string;
    icon: React.ReactNode;
    onNavigate: () => void;
    isActive: boolean;
}

export const SideBarMenuItem: React.FC<Props> = ({title, icon, onNavigate, isActive}) => {

    return (
        <div className={`${styles.div} ${isActive ? styles.active : '' }`} onClick={() => onNavigate()} >
            {icon}
            <div>{title}</div>
        </div>
    );
};