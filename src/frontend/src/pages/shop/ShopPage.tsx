import React, { useState, CSSProperties } from 'react';
import {Scene} from "./components/scene/Scene";

export const ShopPage: React.FC = () => {
    const [showScene, setShowScene] = useState(false);

    const handleToggleScene = () => {
        setShowScene(!showScene);
    };

    return (
        <div style={styles.container}>
            <button onClick={handleToggleScene}>
                {showScene ? 'Hide Scene' : 'Show Scene'}
            </button>
            {showScene && <Scene />}
        </div>
    );
};

const styles: { [key: string]: CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
    },
};
