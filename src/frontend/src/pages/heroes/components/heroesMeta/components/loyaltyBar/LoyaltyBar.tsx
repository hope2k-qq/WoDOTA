import React from "react";
import styles from "./loyalty_bar.module.scss";

interface LoyaltyBarProps {
    pct: number;
    color: string;
    label: number;
    showPercent?: boolean;
}

export const LoyaltyBar: React.FC<LoyaltyBarProps> = ({
                                                          pct,
                                                          color,
                                                          label,
                                                          showPercent = true
                                                      }) => {
    const width = Math.max(0, Math.min(100, pct));

    return (
        <div
            className={styles.loyaltyWrapper}
        >
            <div className={styles.loyaltyPercent}>{label}
                {showPercent && '%'}</div>
            <div className={styles.loyaltyTrack}>
                <div
                    className={styles.loyaltyFill}
                    style={{ width: `${width}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};
