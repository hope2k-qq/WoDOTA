import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0); // Прокручиваем страницу наверх
    }, [pathname]); // Выполняется каждый раз, когда меняется путь

    return null; // Этот компонент не рендерит ничего
};

export default ScrollToTop;
