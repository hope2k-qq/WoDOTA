import { useEffect, useRef, useState } from 'react';
import {useTranslation} from "react-i18next";
import { ReactComponent as ArrowDescIcon } from "../../../assets/icons/ArrowDescIcon.svg";
import { buildStepImages, faqIds } from "./faq.constants";
import type { BuildStep, FaqItem } from "../../../types/faq";
import styles from "./faq.module.scss";

export const FaqPage = () => {
    const { t } = useTranslation();

    const faq: FaqItem[] = faqIds.map((id) => ({
        id,
        question: t(`faq_q${id}`),
        answer: t(`faq_a${id}`),
    }));

    const buildSteps: BuildStep[] = buildStepImages.map((image, index) => ({
        id: index + 1,
        image,
        text: t(`faq_step${index + 1}`),
    }));

    const [openFaqIds, setOpenFaqIds] = useState<number[]>([]);
    const [heights, setHeights] = useState<{ [key: number]: number }>({});
    const contentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    const toggleContent = (id: number) => {
        setOpenFaqIds((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id]
        );
    };

    const updateHeight = (id: number) => {
        const el = contentRefs.current[id];
        if (!el) return;

        setHeights((prev) => ({
            ...prev,
            [id]: prev[id] ?? el.scrollHeight,
        }));
    };

    useEffect(() => {
        openFaqIds.forEach(updateHeight);

        const handleResize = () => {
            openFaqIds.forEach(updateHeight);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [openFaqIds]);


    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{t("faq_title")}</h1>
                </header>

                <section className={styles.section}>
                    <h2 className={styles.section_title}>{t("faq_build_title")}</h2>

                    <div className={styles.steps}>
                        {buildSteps.map((item, index) => (
                            <div key={item.id} className={styles.step_card}>
                                <div className={styles.step_media}>
                                    <span className={styles.step_num}>{index + 1}</span>
                                    <img
                                        src={item.image}
                                        alt={`${t("faq_step_alt")} ${index + 1}`}
                                        className={styles.step_img}
                                    />
                                </div>
                                <p className={styles.step_text}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {faq.length === 0 ? null : (
                    <section className={styles.section}>
                        <h2 className={styles.section_title}>{t("faq_qa_title")}</h2>

                        <div className={styles.faq_main}>
                            {faq.map((item) => {
                                const isOpen = openFaqIds.includes(item.id);

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleContent(item.id)}
                                        className={`${styles.container_faq} ${isOpen ? styles.container_faq_open : ""}`}
                                    >
                                        <div className={styles.faq_title}>
                                            <span>{item.question}</span>
                                            <ArrowDescIcon
                                                className={`${styles.icon} ${isOpen ? styles.open : ""}`}
                                            />
                                        </div>

                                        <div
                                            ref={(el) => (contentRefs.current[item.id] = el)}
                                            className={styles.content}
                                            style={{
                                                height: isOpen ? `${heights[item.id] + 30}px` : "0",
                                                paddingTop: isOpen ? "15px" : "0",
                                                paddingBottom: isOpen ? "15px" : "0",
                                                borderTopWidth: isOpen ? "1px" : "0",
                                            }}
                                        >
                                            {item.answer.split("\n").map((line, index) => (
                                                <p key={index} className={styles.answer_line}>
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
