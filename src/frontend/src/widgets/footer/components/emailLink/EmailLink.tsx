import React, { useEffect, useState } from "react";
import styles from "./email_link.module.scss";

export const EmailLink: React.FC = () => {
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const part1 = "wodota.help";
        const part2 = "@";
        const part3 = "gmail.com";
        setEmail(part1 + part2 + part3);
    }, []);

    return email ? (
        <div className={styles.text}>
            <a href={`mailto:${email}`}>{email}</a>
        </div>
    ) : null;
};
