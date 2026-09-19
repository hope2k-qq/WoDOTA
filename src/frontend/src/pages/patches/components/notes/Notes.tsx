import { Fragment, type ReactNode } from 'react';
import type { Localized, PatchNote } from '../../../../types/patchlog';
import { noteText, patchImageUrl } from '../../patches.utils';
import styles from './notes.module.scss';

type NoteInput = PatchNote | Localized;

const INFO_ICON = patchImageUrl('pages/patches/icon_info.png');

const isPatchNote = (n: NoteInput): n is PatchNote =>
    n != null && typeof n === 'object' && 'note' in n;

const FONT_RE = /<font\s+color=['"]?(#[0-9a-fA-F]{3,6})['"]?>([\s\S]*?)<\/font>/gi;
const renderRich = (text: string): ReactNode => {
    if (!text.includes('<font')) return text;
    const parts: ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    FONT_RE.lastIndex = 0;
    while ((m = FONT_RE.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        parts.push(
            <span key={m.index} style={{ color: m[1] }}>{m[2]}</span>
        );
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
};

const KEEP_ON_SCREEN = 8;
const fitTooltip = (event: { currentTarget: HTMLElement }) => {
    const bubble = event.currentTarget.querySelector<HTMLElement>('[data-tooltip-bubble]');
    if (!bubble) return;
    bubble.style.right = '';
    requestAnimationFrame(() => {
        const rect = bubble.getBoundingClientRect();
        const overflowLeft = KEEP_ON_SCREEN - rect.left;
        const base = 12;
        if (overflowLeft > 0) bubble.style.right = `${-(base + overflowLeft)}px`;
    });
};

export const Notes = ({ notes }: { notes: NoteInput[] }) => {
    const items = notes
        .map((n) => isPatchNote(n)
            ? {
                text: noteText(n.note),
                icon: n.icon ?? undefined,
                indent: n.indent ?? 1,
                tooltip: n.tooltip ? noteText(n.tooltip) : '',
            }
            : { text: noteText(n), icon: undefined, indent: 1, tooltip: '' })
        .filter((item) => item.text);
    if (!items.length) return null;
    return (
        <ul className={styles.notes}>
            {items.map(({ text, icon, indent, tooltip }, i) => (
                <li
                    key={i}
                    className={styles.note}
                    style={indent > 1 ? { paddingLeft: `${(indent - 1) * 22}px` } : undefined}
                >
                    {icon
                        ? <img className={styles.icon} src={icon} alt="" loading="lazy" />
                        : <div className={styles.dot} />}
                    <span className={styles.text}>
                        {renderRich(text)}
                        {tooltip && (
                            <span
                                className={styles.info}
                                tabIndex={0}
                                aria-label={tooltip}
                                onMouseEnter={fitTooltip}
                                onFocus={fitTooltip}
                            >
                                <img className={styles.info_icon} src={INFO_ICON} alt="" />
                                <span className={styles.info_bubble} role="tooltip" data-tooltip-bubble>
                                    {tooltip}
                                </span>
                            </span>
                        )}
                    </span>
                </li>
            ))}
        </ul>
    );
};
