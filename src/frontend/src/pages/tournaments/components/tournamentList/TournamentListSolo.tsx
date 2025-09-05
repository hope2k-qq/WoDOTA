import styles from "./touranament_list_solo.module.scss";
import {useTranslation} from "react-i18next";

interface Team {
    player_info: {
        player: string;
        dota_id: string;
        avatar: string;
        profileUrl: string;
    };
}

interface TournamentListProps {
    data: Team[];
}

export const TournamentListSolo: React.FC<TournamentListProps> = ({ data }) => {
    const { t } = useTranslation();


    return (
        <div>
            <table className={styles.table}>
                <thead>
                <tr className={styles.table_info}>
                    <th>#</th>
                    <th>{t('nickname')}</th>
                    <th>DOTA ID</th>
                </tr>
                </thead>
                <tbody>
                {data.map((team, index) => (
                    <tr key={index + 1} className={styles.table_data}>
                        <td>{index + 1}</td>
                        <td>
                            <div className={styles.container_table_data}>
                                <div className={styles.player_container}>
                                    <img src={team.player_info.avatar} alt={"avatar"} className={styles.avatar}/>
                                    <div className={styles.ellipsis}>{team.player_info.player}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div className={styles.container_table_data} style={{justifyContent: 'center'}}>
                                <div className={styles.player_container}>
                                    <div className={styles.ellipsis}>{team.player_info.dota_id}</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};
