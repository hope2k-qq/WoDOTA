import type { ContactChannel, ContactDocument } from "../../../types/contacts";
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "../../../constants/contacts";
import { ReactComponent as ShieldIcon } from "../../../assets/icons/ShieldIcon.svg";
import { ReactComponent as FileTextIcon } from "../../../assets/icons/FileTextIcon.svg";
import { ReactComponent as CookieIcon } from "../../../assets/icons/CookieIcon.svg";
import { ReactComponent as MessageIcon1 } from "../../../assets/icons/MessageIcon1.svg";
import { ReactComponent as TelegramIcon } from "../../../assets/icons/TelegramIcon.svg";
import { ReactComponent as DiscordIcon } from "../../../assets/icons/DiscordIcon.svg";

export const documents: ContactDocument[] = [
    {
        titleKey: "contacts_doc_privacy",
        path: "/privacy",
        icon: <ShieldIcon />,
    },
    {
        titleKey: "contacts_doc_terms",
        path: "/terms",
        icon: <FileTextIcon />,
    },
    {
        titleKey: "contacts_doc_cookies",
        path: "/cookies",
        icon: <CookieIcon />,
    },
];

export const channels: ContactChannel[] = [
    {
        label: "Email",
        value: SUPPORT_EMAIL,
        href: SUPPORT_EMAIL_HREF,
        icon: <MessageIcon1 />,
    },
    {
        label: "Telegram",
        value: "@wodota_q",
        href: "https://t.me/wodota_q",
        external: true,
        icon: <TelegramIcon />,
    },
    {
        label: "Discord",
        value: "@hope2k",
        href: "https://discord.com/users/554572803580624897",
        external: true,
        icon: <DiscordIcon />,
    },
];
