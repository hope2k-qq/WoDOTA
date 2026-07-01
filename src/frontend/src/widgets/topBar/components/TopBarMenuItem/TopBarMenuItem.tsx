import { Link } from "react-router-dom";
import styles from "./top_bar_menu_item.module.scss";
import { ReactComponent as ArrowIcon } from "../../../../assets/icons/ArrowIcon.svg";

interface SubItem {
    title: string;
    icon: React.ReactNode;
    to?: string;
    onNavigate?: () => void;
}

interface Props {
    title: string;
    to?: string;
    onNavigate?: () => void;
    icon?: React.ReactNode;
    isActive?: boolean;
    menuOpen: boolean;
    subItems?: SubItem[];
}

export const TopBarMenuItem: React.FC<Props> = ({ title, to, onNavigate, isActive, menuOpen, icon, subItems }) => {
    const className = `${subItems ? styles.menuItemSub : styles.menuItem} ${isActive ? styles.active : ''} ${menuOpen ? styles.open : ''}`;
    const style = menuOpen ? { margin: 0 } : undefined;

    const content = (
        <>
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
                        item.to ? (
                            <Link key={idx} className={styles.subMenuItem} to={item.to}>
                                {item.icon}
                                <p>{item.title}</p>
                            </Link>
                        ) : (
                            <div key={idx} className={styles.subMenuItem} onClick={item.onNavigate}>
                                {item.icon}
                                <p>{item.title}</p>
                            </div>
                        )
                    ))}
                </div>
            )}
        </>
    );

    // Пункт с подменю — это триггер дропдауна без своей страницы, поэтому
    // его нельзя оборачивать в <a> (вложенные ссылки запрещены).
    if (to && !subItems) {
        return (
            <Link className={className} to={to} style={style}>
                {content}
            </Link>
        );
    }

    return (
        <div className={className} onClick={onNavigate} style={style}>
            {content}
        </div>
    );
};
