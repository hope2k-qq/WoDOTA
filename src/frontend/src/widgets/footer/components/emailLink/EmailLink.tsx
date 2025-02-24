import React, { useEffect, useState } from "react";
import styles from "./email_link.module.scss"

export const EmailLink: React.FC = () => {
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        setEmail("wodota.help" + "@" + "gmail.com");
    }, []);

    return email ? <div className={styles.text}>{email}</div> : null;
};
