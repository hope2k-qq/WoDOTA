import {AbilitiesPropsCharacteristics} from '../../../../types/heroes';
import styles from "./hero_characteristics.module.scss";
import {useTranslation} from "react-i18next";


export const HeroCharacteristics: React.FC<AbilitiesPropsCharacteristics> = ({ heroName, characteristics }) => {
    const { t } = useTranslation();

    return (
        <div className={styles.hero_characteristics_main}>
            {characteristics && (
                <div className={styles.hero_characteristics_wrapper}>
                    <div className={styles.left_block}>
                        <div className={styles.attribute_block}>
                            <div className={styles.attribute_title}>{t('strength').toUpperCase()}</div>
                            <div className={styles.attribute_value}>
                                <img src='/str.png' alt='strength'/>
                                <div>{characteristics.attributebasestrength} + {characteristics.attributestrengthgain}</div>
                            </div>
                        </div>
                        <div className={styles.attribute_block}>
                            <div className={styles.attribute_title}>{t('agility').toUpperCase()}</div>
                            <div className={styles.attribute_value}>
                                <img src='/agi.png' alt='agility'/>
                                <div>{characteristics.attributebaseagility} + {characteristics.attributeagilitygain}</div>
                            </div>
                        </div>
                        <div className={styles.attribute_block}>
                            <div className={styles.attribute_title}>{t('intelligence').toUpperCase()}</div>
                            <div className={styles.attribute_value}>
                                <img src='/int.png' alt='intelligence'/>
                                <div>{characteristics.attributebaseintelligence} + {characteristics.attributeintelligencegain}</div>
                            </div>
                        </div>
                        <div className={styles.info_block_attribute}>
                            <div className={styles.attributeTitle}>{t('attributes')}</div>
                            <div className={styles.attribute_container}>
                                <div className={styles.attribute_item}>
                                    <div className={styles.attribute_icon}>
                                        <img src='/str.png' alt='strength'/>
                                        <div>{t('strength').toUpperCase()}</div>
                                    </div>
                                    <div className={styles.attribute_description}>
                                        {t('attribute_description_strength')}
                                    </div>
                                </div>
                                <div className={styles.attribute_item}>
                                    <div className={styles.attribute_icon}>
                                        <img src='/agi.png' alt='agility'/>
                                        <div>{t('agility').toUpperCase()}</div>
                                    </div>
                                    <div className={styles.attribute_description}>
                                        {t('attribute_description_agility')}
                                    </div>
                                </div>
                                <div className={styles.attribute_item}>
                                    <div className={styles.attribute_icon}>
                                        <img src='/int.png' alt='intelligence'/>
                                        <div>{t('intelligence').toUpperCase()}</div>
                                    </div>
                                    <div className={styles.attribute_description}>
                                        {t('attribute_description_intelligence')}
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                    <div className={styles.right_block}>
                        <div className={styles.main_stats}>
                            <div>
                                <img src="/icon_damage.png" alt="Attack Damage"/>
                                <div>{characteristics.attackdamagemin} - {characteristics.attackdamagemax}</div>
                                <div className={styles.tooltip}>{t('damage')}</div>
                            </div>
                            <div>
                                <img src="/icon_armor.png" alt="Armor"/>
                                <div>{characteristics.armorphysical}</div>
                                <div className={styles.tooltip}>{t('armor')}</div>
                            </div>
                            <div>
                                <img src="/icon_movement_speed.png" alt="Movement Speed"/>
                                <div>{characteristics.movementspeed}</div>
                                <div className={styles.tooltip}>{t('movement_speed')}</div>
                            </div>
                            <div>
                                <img src="/icon_attack_time.png" alt="Base Attack Time"/>
                                <div>{characteristics.attackrate}</div>
                                <div className={styles.tooltip}>{t('base_attack_time')}</div>
                            </div>
                            <div>
                                <img src="/icon_base_attack_speed.png" alt="Base Attack Speed"/>
                                <div>{characteristics.baseattackspeed}</div>
                                <div className={styles.tooltip}>{t('attack_speed')}</div>
                            </div>
                            <div>
                                <img src="/icon_attack_range.png" alt="Attack Range"/>
                                <div>{characteristics.attackrange}</div>
                                <div className={styles.tooltip}>{t('attack_range')}</div>
                            </div>
                        </div>


                        <div className={styles.health_mana_block}>
                            <div className={styles.health_block}>
                                <div className={styles.stat_title}>{t('max_health')}</div>
                                <div className={styles.stat_health_container}>
                                    <div className={styles.healthValue}>{characteristics.health}</div>
                                    <div className={styles.healthRegen}>{characteristics.healthregen}</div>
                                </div>
                            </div>
                            <div className={styles.mana_block}>
                                <div className={styles.stat_title}>{t('max_mana')}</div>
                                <div className={styles.stat_mana_container}>
                                    <div className={styles.manaValue}>{characteristics.mana}</div>
                                    <div className={styles.manaRegen}>{characteristics.manaregen}</div>
                                </div>
                            </div>
                            <div className={styles.infoBlock}>
                                <div className={styles.infoBlockTitle}>{t('health_mana')}</div>
                                <div className={styles.stat_health_container}>
                                    <div className={styles.healthValue}>{t('max_health')}</div>
                                    <div className={styles.healthRegen}>{t('health_regen')}</div>
                                </div>
                                <div className={styles.infoBlockText}>{t('health_regen_description')}</div>
                                <div className={styles.stat_mana_container}>
                                    <div className={styles.manaValue}>{t('max_mana')}</div>
                                    <div className={styles.manaRegen}>{t('mana_regen')}</div>
                                </div>
                                <div className={styles.infoBlockText}>{t('mana_regen_description')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
