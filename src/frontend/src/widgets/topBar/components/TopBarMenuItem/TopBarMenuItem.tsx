import styles from "./top_bar_menu_item.module.scss";
import { ReactComponent as ArrowIcon } from "../../../../assets/icons/ArrowIcon.svg";

interface Props {
    title: string;
    onNavigate?: () => void;
    icon?: React.ReactNode;
    isActive?: boolean;
    menuOpen: boolean;
    subItems?: { title: string; icon: React.ReactNode; onNavigate: () => void }[];
}

export const TopBarMenuItem: React.FC<Props> = ({ title, onNavigate, isActive, menuOpen, icon, subItems }) => {
    return (
        <div
            className={`${subItems ? styles.menuItemSub : styles.menuItem} ${isActive ? styles.active : ''} ${menuOpen ? styles.open : ''}`}
            onClick={onNavigate}
            style={{
                ...(menuOpen ? { margin: 0 } : {}),
            }}
        >
            {icon}
            <div className={styles.title} style={menuOpen ? { color: "#9b9db1" } : undefined}>
                {title}
                {subItems && subItems.length > 0 && (
                    <ArrowIcon className={styles.arrow}/>
                )}
            </div>

            {subItems && subItems.length > 0 && (
                <div className={styles.subMenu}>
                    {subItems.map((item, idx) => (
                        <div key={idx} className={styles.subMenuItem} onClick={item.onNavigate}>
                            {item.icon}
                            <p>{item.title}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
