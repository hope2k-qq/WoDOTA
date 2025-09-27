import React from "react";
import styles from "./tournament_table_head.module.scss";

interface Props {
    type: string;
    t: (key: string) => string;
}

const TournamentTableHead: React.FC<Props> = ({ type, t }) => {
    return (
        <thead>
        <tr className={styles.table_info}>
            <th>
                <div className={styles.th_place}>{t('place')}</div>
                <div className={styles.th_lattice}>#</div>
            </th>

            {type === "duo" ? (
                <>
                    <th><div>{t("nickname")} #1</div></th>
                    <th><div>{t("nickname")} #2</div></th>
                </>
            ) : (
                <>
                    <th><div>{t("nickname")}</div></th>
                    <th><div>DOTA ID</div></th>
                </>
            )}

            <th>{t("points")}</th>
        </tr>
        </thead>
    );
};

export default TournamentTableHead;
