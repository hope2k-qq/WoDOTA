import React, { useEffect, useState, useCallback } from 'react';
import { getImageUrl } from '../../utils/r2Storage';
import styles from './shop.module.scss';
import { ReactComponent as DonateIcon } from "../../assets/icons/DonateIcon.svg";
import { ReactComponent as SwapIcon } from "../../assets/icons/SwapIcon.svg";
import { ReactComponent as StatsIcon } from "../../assets/icons/StatsIcon.svg";
import { ReactComponent as CoinsIcon } from "../../assets/icons/CoinsIcon.svg";

interface Item {
    id: string;
    currency: string;
    value: string;
    icon: string;
    localizationKey: string;
}

const itemTypes = ['Items_Five', 'Items_pets', 'Items_emblems', 'Items_tips', 'Items_Backround'] as const;
type ItemType = typeof itemTypes[number];

export const ShopPage: React.FC = () => {
    const API_URL = process.env.REACT_APP_API_URL;

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<ItemType>('Items_Five');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [localization, setLocalization] = useState<Record<string, string>>({});
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState("RUB");
    const [supportAmount, setSupportAmount] = useState(100);

    const currencies = [
        { code: "RUB", label: "₽", name: "Рубли" },
        { code: "USD", label: "$", name: "Доллары" },
        { code: "EUR", label: "€", name: "Евро" },
        { code: "UAH", label: "₴", name: "Гривны" },
        { code: "TON", label: "TON", name: "TON" },
        { code: "TRX", label: "TRX", name: "TRX" },
        { code: "USDT_TON", label: "USDT", name: "USDT (TON)" },
    ];

    const convertedBonuses = Math.floor(supportAmount * 10);

    const fetchItems = useCallback(async (type: ItemType) => {
        if (!API_URL) {
            setError('API_URL is not defined');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_URL}/shop`);
            if (!res.ok) throw new Error('Failed to fetch items');
            const data = await res.json();
            setItems(data[type] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    const fetchLocalization = useCallback(async () => {
        if (!API_URL) {
            setError('API_URL is not defined');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/text_data`);
            if (!res.ok) throw new Error('Failed to fetch localization data');
            const data = await res.json();
            setLocalization(data);
        } catch (err: any) {
            setError(err.message);
        }
    }, [API_URL]);

    const fetchImages = useCallback(async (items: Item[]) => {
        const urls: Record<string, string> = {};

        await Promise.all(items.map(async (item) => {
            const base = `images/shop/${item.icon}`;
            urls[item.id] = await getImageUrl(`${base}.webp`) || '';
            urls[`${item.id}_open`] = await getImageUrl(`${base}_open.webp`) || '';
        }));

        setImageUrls(urls);
    }, []);

    useEffect(() => {
        fetchItems(selectedType);
        fetchLocalization();
    }, [selectedType, fetchItems, fetchLocalization]);

    useEffect(() => {
        if (items.length > 0) {
            fetchImages(items);
        }
    }, [items, fetchImages]);

    const handleBuy = () => {
        if (!selectedItem) return;
        const name = localization[selectedItem.localizationKey] || selectedItem.localizationKey;
        alert(`You bought ${name}!`);
        setSelectedItem(null);
    };

    const renderItemName = (key: string) => localization[key] || key;

    return (
        <div className={styles.shopPage}>
            <h1 className={styles.title}>МАГАЗИН</h1>
            <div className={styles.section}>
                <div className={styles.block}>
                    <h2 className={styles.blockHeading}>Поддержка сайта</h2>
                    <p className={styles.blockHeadingDescription}>
                        Пожертвования превращаются в бонусы для использования на сайте
                    </p>
                    <div className={styles.steps}>
                        <div className={styles.step}>
                            <div className={styles.iconContainer}>
                                <DonateIcon/>
                            </div>
                            <div className={styles.textContainer}>
                                <h4 className={styles.stepTitle}>Поддержка сайта</h4>
                                <p className={styles.stepDescription}>Ваше пожертвование помогает оплачивать
                                    серверы, развивать новые функции и
                                    улучшать работу сайта для всех пользователей.</p>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.iconContainer}>
                                <SwapIcon style={{width: '9.3rem', height: '9.3rem'}}/>
                            </div>
                            <div className={styles.textContainer}>
                                <h4 className={styles.stepTitle}>Начисление бонусов</h4>
                                <p className={styles.stepDescription}>За каждый 1 RUB (или эквивалент в другой
                                    валюте) вы получаете 1 бонус. Начисление
                                    происходит автоматически. Бонусы не являются платёжным средством и не подлежат
                                    обмену на реальные деньги.</p>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.iconContainer}>
                                <StatsIcon style={{width: '10rem', height: '10rem'}}/>
                            </div>
                            <div className={styles.textContainer}>
                                <h4 className={styles.stepTitle}>Использование бонусов</h4>
                                <p className={styles.stepDescription}>Вы можете использовать бонусы для получения
                                    дополнительной информации — например,
                                    статистики, собранной вручную на основе открытых данных. Мы стараемся обеспечить
                                    актуальность, однако статистика может содержать неточности и не гарантирует 100%
                                    точности.</p>
                            </div>
                        </div>
                    </div>
                    {/*<p className={styles.stepNoteRed}>*/}
                    {/*    Пожертвование идёт только на разработку и поддержку сайта, <u>не передаётся разработчику*/}
                    {/*    игры</u> и <strong>не является покупкой внутриигровой валюты</strong>.*/}
                    {/*</p>*/}
                    <div className={styles.supportContainer}>
                        <h5 className={styles.supportTitle}>Развиваем сайт вместе</h5>
                        <p className={styles.supportDescription}>Ваш вклад помогает развитию проекта, а в ответ вы
                            получаете бонусы, которые можно использовать на сайте</p>
                        <button className={styles.supportButton} onClick={() => setModalOpen(true)}>
                            Поддержать сайт
                        </button>
                    </div>


                    {modalOpen && (
                        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
                            <div className={styles.modalContent2} onClick={(e) => e.stopPropagation()}>
                                <h2>Выберите способ оплаты</h2>

                                <div className={styles.currencyCards}>
                                    {currencies.map((cur) => (
                                        <div
                                            key={cur.code}
                                            className={`${styles.currencyCard} ${selectedCurrency === cur.code ? styles.active : ""}`}
                                            onClick={() => setSelectedCurrency(cur.code)}
                                        >
                                            <span className={styles.icon}>{cur.label}</span>
                                            <span className={styles.name}>{cur.name}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.bottomRow}>
                                    <div className={styles.inputSection}>
                                        <label htmlFor="supportAmount">Сумма:</label>
                                        <input
                                            id="supportAmount"
                                            type="number"
                                            min={1}
                                            value={supportAmount}
                                            onChange={(e) => setSupportAmount(Number(e.target.value))}
                                            placeholder="Введите сумму"
                                        />
                                    </div>
                                    <div className={styles.bonusDisplay}>
                                        Вы получите <strong>{convertedBonuses}</strong> бонусов
                                    </div>
                                </div>

                                <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.line}></div>
                <div className={styles.block}>
                    <div className={styles.buyCoinsContent}>
                        <div className={styles.buyCoinsText}>
                            <h2 className={styles.blockHeading}>Поддержка разработчика кастомки</h2>
                            <p className={styles.blockHeadingDescription}>
                                Приобретайте игровые монеты — внутриигровую валюту, которую можно использовать для
                                покупки уникальных визуальных эффектов, кастомных предметов и других эксклюзивных
                                возможностей внутри игры. Каждая покупка помогает поддерживать разработчика кастомной
                                игры и способствует её дальнейшему развитию
                            </p>
                            <button className={styles.supportButton} onClick={() => setModalOpen(true)}>
                                Купить монеты
                            </button>
                        </div>
                        <div className={styles.buyCoinsContainer}>
                            <CoinsIcon className={styles.buyCoinsIcon}/>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className={styles.shopTitle}>Ассортимент</h2>
            <div className={styles.typeSelector}>
                {itemTypes.map((type, index) => (
                    <button
                        key={type}
                        className={`${styles.typeButton} ${selectedType === type ? styles.active : ''}`}
                        onClick={() => setSelectedType(type)}
                        style={{gridColumnStart: index + 1}}
                    >
                        {type}
                    </button>
                ))}

                <div
                    className={styles.indicator}
                    style={{['--col' as any]: itemTypes.indexOf(selectedType) + 1}}
                />

            </div>


            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className={styles.error}>Error: {error}</p>
            ) : (
                <div>
                    <ul className={styles.itemList}>
                        {items.map((item) => (
                            <li key={item.id} className={styles.item}>
                                <img
                                    src={imageUrls[item.id]}
                                    alt={renderItemName(item.localizationKey)}
                                    className={styles.itemImage}
                                />
                                <strong className={styles.itemText}>{renderItemName(item.localizationKey)}</strong>

                                <div className={styles.itemPriceWrapper}>
                                    <div className={styles.itemPrice}>
                                        <span className={styles.priceLabel}>Цена:</span>
                                        <div className={styles.itemCurrencyBox}>
                                            <img src="/wodacoin.png" alt="wodacoin" className={styles.itemIcon}/>
                                            <span className={styles.itemValue}>{item.value}</span>
                                        </div>
                                    </div>
                                    <span className={styles.priceNote}>Внутриигровая валюта</span>
                                </div>


                                <button className={styles.detailsButton} onClick={() => setSelectedItem(item)}>
                                    Подробнее
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {selectedItem && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <button className={styles.closeButton} onClick={() => setSelectedItem(null)}>✖</button>
                        <h2 className={styles.modalTitle}>{renderItemName(selectedItem.localizationKey)}</h2>
                        <div className={styles.modalBody}>
                            <img
                                src={imageUrls[`${selectedItem.id}_open`]}
                                alt={renderItemName(selectedItem.localizationKey)}
                                className={styles.modalImage}
                            />

                            <div className={styles.modalDetails}>
                                <p className={styles.modalDescription}>
                                    Уникальный эффект для героя.
                                </p>

                                <div className={styles.priceAndBuyContainer}>
                                    <div className={styles.itemPriceWrapper}>
                                        <div className={styles.itemPrice}>
                                            <span className={styles.priceLabel}>Цена:</span>
                                            <div className={styles.itemCurrencyBox}>
                                                <img src="/wodacoin.png" alt="wodacoin" className={styles.itemIcon}/>
                                                <span className={styles.itemValue}>{selectedItem.value}</span>
                                            </div>
                                        </div>
                                        <span className={styles.priceNote}>Внутриигровая валюта</span>
                                    </div>

                                    <button className={styles.detailsButton} onClick={handleBuy}>Купить</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            )}
        </div>
    );
};
