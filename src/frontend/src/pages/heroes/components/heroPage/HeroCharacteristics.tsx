import {AbilitiesPropsCharacteristics} from '../../../../types/heroes';
import styles from "./hero_characteristics.module.scss";


export const HeroCharacteristics: React.FC<AbilitiesPropsCharacteristics> = ({ heroName, characteristics }) => {
    // const [characteristics, setCharacteristics] = useState<CharacteristicsData | null>(null);

    // useEffect(() => {
    //     axios.get(`${API_URL}/hero/${heroName}`)
    //         .then(response => {
    //             setCharacteristics(response.data.characteristics);
    //         })
    //         .catch(error => {
    //             console.error('Error fetching hero data:', error);
    //         });
    // }, [API_URL, heroName]);

    return (
        <div className={styles.hero_characteristics_main}>
            {characteristics && (
                <div className={styles.hero_characteristics_wrapper}>
                    <div className={styles.left_block}>
                        <div className={styles.attribute_block}>
                            <div className={styles.attribute_title}>СИЛА</div>
                            <div className={styles.attribute_value}>
                                <img src='/str.png' alt='strength'/>
                                <div>{characteristics.attributebasestrength} + {characteristics.attributestrengthgain}</div>
                            </div>
                        </div>
                        <div className={styles.attribute_block}>
                            <div className={styles.attribute_title}>ЛОВКОСТЬ</div>
                            <div className={styles.attribute_value}>
                                <img src='/agi.png' alt='agility'/>
                                <div>{characteristics.attributebaseagility} + {characteristics.attributeagilitygain}</div>
                            </div>
                        </div>
                        <div className={styles.attribute_block}>
                            <div className={styles.attribute_title}>ИНТЕЛЛЕКТ</div>
                            <div className={styles.attribute_value}>
                                <img src='/int.png' alt='intelligence'/>
                                <div>{characteristics.attributebaseintelligence} + {characteristics.attributeintelligencegain}</div>
                            </div>
                        </div>
                        <div className={styles.info_block_attribute}>
                            <div className={styles.attributeTitle}>АТРИБУТЫ</div>
                            <div className={styles.attribute_container}>
                                <div className={styles.attribute_item}>
                                    <div className={styles.attribute_icon}>
                                        <img src='/str.png' alt='strength'/>
                                        <div>Сила</div>
                                    </div>
                                    <div className={styles.attribute_description}>
                                        Каждое очко силы даёт +22 к здоровью и +0,09 к его восстановлению.
                                    </div>
                                </div>
                                <div className={styles.attribute_item}>
                                    <div className={styles.attribute_icon}>
                                        <img src='/agi.png' alt='agility'/>
                                        <div>Ловкость</div>
                                    </div>
                                    <div className={styles.attribute_description}>
                                        Каждое очко ловкости даёт +1 к скорости атаки и +0,16 к броне.
                                    </div>
                                </div>
                                <div className={styles.attribute_item}>
                                    <div className={styles.attribute_icon}>
                                        <img src='/int.png' alt='intelligence'/>
                                        <div>Интеллект</div>
                                    </div>
                                    <div className={styles.attribute_description}>
                                        Каждое очко интеллекта увеличивает запас маны на 12, её восстановление на 0,05 и
                                        сопротивление магии на 0,1%.
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
                                <div className={styles.tooltip}>Урон</div>
                            </div>
                            <div>
                                <img src="/icon_armor.png" alt="Armor"/>
                                <div>{characteristics.armorphysical}</div>
                                <div className={styles.tooltip}>Броня</div>
                            </div>
                            <div>
                                <img src="/icon_movement_speed.png" alt="Movement Speed"/>
                                <div>{characteristics.movementspeed}</div>
                                <div className={styles.tooltip}>Скорость передвижения</div>
                            </div>
                            <div>
                                <img src="/icon_attack_time.png" alt="Attack Rate"/>
                                <div>{characteristics.attackrate}</div>
                                <div className={styles.tooltip}>Базовый интервал атак</div>
                            </div>
                            <div>
                                <img src="/icon_base_attack_speed.png" alt="Base Attack Speed"/>
                                <div>{characteristics.baseattackspeed}</div>
                                <div className={styles.tooltip}>Скорость атаки</div>
                            </div>
                            <div>
                                <img src="/icon_attack_range.png" alt="Attack Range"/>
                                <div>{characteristics.attackrange}</div>
                                <div className={styles.tooltip}>Дальность атаки</div>
                            </div>
                        </div>


                        <div className={styles.health_mana_block}>
                            <div className={styles.health_block}>
                                <div className={styles.stat_title}>ЗАПАС ЗДОРОВЬЯ</div>
                                <div className={styles.stat_health_container}>
                                    <div className={styles.healthValue}>{characteristics.health}</div>
                                    <div className={styles.healthRegen}>{characteristics.healthregen}</div>
                                </div>
                            </div>
                            <div className={styles.mana_block}>
                                <div className={styles.stat_title}>ЗАПАС МАНЫ</div>
                                <div className={styles.stat_mana_container}>
                                    <div className={styles.manaValue}>{characteristics.mana}</div>
                                    <div className={styles.manaRegen}>{characteristics.manaregen}</div>
                                </div>
                            </div>
                            <div className={styles.infoBlock}>
                                <div className={styles.infoBlockTitle}>ЗДОРОВЬЕ И МАНА</div>
                                <div className={styles.stat_health_container}>
                                    <div className={styles.healthValue}>ЗАПАС ЗДОРОВЬЯ</div>
                                    <div className={styles.healthRegen}>ВОССТАНОВЛЕНИЕ</div>
                                </div>
                                <div className={styles.infoBlockText}>Чем больше у героя здоровья, тем больше урона он может получить, прежде чем умрёт.
                                    Каждое очко силы увеличивает запас здоровья и скорость его восстановления.
                                </div>
                                <div className={styles.stat_mana_container}>
                                    <div className={styles.manaValue}>ЗАПАС МАНЫ</div>
                                    <div className={styles.manaRegen}>ВОССТАНОВЛЕНИЕ</div>
                                </div>
                                <div className={styles.infoBlockText}>Мана расходуется при использовании способностей. Каждое очко интеллекта увеличивает
                                    запас маны и скорость её восстановления.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
