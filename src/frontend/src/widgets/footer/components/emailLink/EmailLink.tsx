import React from "react";
import styles from "./email_link.module.scss"
import { SUPPORT_EMAIL } from "../../../../constants/contacts";

export const EmailLink: React.FC = () => {
    return <div className={styles.text}>{SUPPORT_EMAIL}</div>;
};
