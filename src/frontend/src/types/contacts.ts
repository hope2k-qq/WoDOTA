import type { ReactNode } from "react";

export interface ContactDocument {
    titleKey: string;
    path: string;
    icon: ReactNode;
}

export interface ContactChannel {
    label: string;
    value: string;
    href: string;
    external?: boolean;
    icon: ReactNode;
}
