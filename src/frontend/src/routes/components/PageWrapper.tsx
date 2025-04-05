import React, { ReactNode } from 'react';

interface PageWrapperProps {
    children: ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
    return (
        <div style={{ paddingTop: '118px' }}>
            {children}
        </div>
    );
};
