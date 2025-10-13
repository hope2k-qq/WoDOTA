import { useEffect, useState } from "react";
import "./RelocationNotice.scss";

const OLD_DOMAIN = "wodota.pro";

const RelocationNotice: React.FC = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const ref = document.referrer;
        const fromOldDomain = ref.includes(OLD_DOMAIN);

        if (fromOldDomain) {
            setShow(true);
        }
    }, []);

    if (!show) return null;

    return (
        <div className="relocation-overlay" onClick={() => setShow(false)}>
            <div className="relocation-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Мы переехали 🚀</h2>
                <p>
                    Наш сайт теперь живёт на новом домене:
                    <br />
                    <a href="https://wodota.net" target="_blank" rel="noopener noreferrer">
                        https://wodota.net
                    </a>
                </p>
                <button onClick={() => setShow(false)}>Понятно</button>
            </div>
        </div>
    );
};

export default RelocationNotice;
