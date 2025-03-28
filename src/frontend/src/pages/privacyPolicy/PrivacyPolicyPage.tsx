import { useEffect, useState } from "react";
import styles from "./privacy_policy.module.scss";

export const PrivacyPolicyPage = () => {
    const [policyHtml, setPolicyHtml] = useState<string>("Загрузка...");

    useEffect(() => {
        fetch("/privacy-policy.html")
            .then((response) => response.text())
            .then((html) => setPolicyHtml(html))
            .catch((error) => {
                console.error("Ошибка загрузки политики:", error);
                setPolicyHtml("Ошибка загрузки политики.");
            });
    }, []);

    return (
        <div className={styles.policy_container} dangerouslySetInnerHTML={{ __html: policyHtml }} />
    );
};
