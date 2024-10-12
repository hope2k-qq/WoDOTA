import React, { useEffect, useState, CSSProperties, useCallback } from 'react';
import { Scene } from './components/scene/Scene';

interface Item {
    id: string;
    currency: string;
    value: string;
    icon: string;
    localizationKey: string;
}

const itemTypes = ['Items_Five', 'Items_pets', 'Items_emblems', 'Items_tips'] as const;
type ItemType = typeof itemTypes[number];

const images = require.context('../../assets/images/shop', false, /\.png$/);

export const ShopPage: React.FC = () => {
    const [showScene, setShowScene] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItemType, setSelectedItemType] = useState<ItemType>('Items_Five');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [localizationData, setLocalizationData] = useState<{ [key: string]: string }>({});

    const handleToggleScene = () => {
        setShowScene(!showScene);
    };

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchItems = useCallback(async (itemType: ItemType) => {
        if (!API_URL) {
            setError('API_URL is not defined');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/shop`);
            if (!response.ok) {
                setError('Failed to fetch items');
                return;
            }
            const data = await response.json();
            setItems(data[itemType] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    const fetchLocalizationData = useCallback(async () => {
        if (!API_URL) {
            setError('API_URL is not defined');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/text_data`);
            if (!response.ok) {
                setError('Failed to fetch localization data');
                return;
            }
            const data = await response.json();
            setLocalizationData(data);
        } catch (error) {
            console.error('Error loading localization data:', error);
            setError('Error loading localization data');
        }
    }, [API_URL]);

    useEffect(() => {
        (async () => {
            await fetchItems(selectedItemType);
            await fetchLocalizationData();
        })();
    }, [selectedItemType, fetchItems, fetchLocalizationData]);

    const openModal = (item: Item) => {
        setSelectedItem(item);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedItem(null);
    };

    const handleBuy = () => {
        alert(`You bought ${localizationData[selectedItem?.localizationKey!] || selectedItem?.localizationKey}!`);
        closeModal();
    };

    return (
        <div style={styles.container}>
            <button onClick={handleToggleScene}>
                {showScene ? 'Hide Scene' : 'Show Scene'}
            </button>
            {showScene && <Scene />}

            <div style={styles.buttonContainer}>
                {itemTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedItemType(type)}
                        style={{
                            backgroundColor: selectedItemType === type ? '#ddd' : '#fff',
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>Error: {error}</p>
            ) : (
                <div>
                    <h2>{selectedItemType} Items</h2>
                    <ul>
                        {items.map((item) => (
                            <li key={item.id}>
                                <strong>{localizationData[item.localizationKey] || item.localizationKey}:</strong> {item.value} {item.currency}
                                <img
                                    src={images(`./${item.icon}_png.png`)}
                                    alt={localizationData[item.localizationKey] || item.localizationKey}
                                />
                                <button style={{ cursor: 'pointer' }} onClick={() => openModal(item)}>
                                    Buy
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {modalOpen && selectedItem && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <button onClick={closeModal} style={styles.closeButton}>✖</button>
                        <h2>{localizationData[selectedItem.localizationKey] || selectedItem.localizationKey}</h2>
                        <img
                            src={images(`./${selectedItem.icon}_open_png.png`)}
                            alt={localizationData[selectedItem.localizationKey] || selectedItem.localizationKey}
                            style={styles.modalImage}
                        />
                        <p>Price: {selectedItem.value} {selectedItem.currency}</p>
                        <button onClick={handleBuy}>Buy</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: 'auto',
        minHeight: '100vh',
        backgroundColor: '#202125',
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modal: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        position: 'relative',
        minWidth: '300px',
    },
    modalImage: {
        width: '100%',
        height: 'auto',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
    },
};
