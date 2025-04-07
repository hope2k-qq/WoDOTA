import { useEffect } from "react";

interface DynamicTitleProps {
    title: string;
}

export const DynamicTitle: React.FC<DynamicTitleProps> = ({ title }) => {
    useEffect(() => {
        document.title = title;
    }, [title]);

    return null;
};
