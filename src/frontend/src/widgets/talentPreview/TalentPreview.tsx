import { useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import styles from './talent_preview.module.scss';

export type TalentPreviewVertical = 'up' | 'down';
export type TalentPreviewAlign = 'left' | 'near-left' | 'center' | 'near-right' | 'right';

interface TalentPreviewProps extends HTMLAttributes<HTMLDivElement> {
    text?: string | null;
    vertical?: TalentPreviewVertical;
    align?: TalentPreviewAlign;
    enabled?: boolean;
    arrow?: boolean;
    autoFlip?: boolean;
    children: ReactNode;
}

const VERTICAL_CLASS: Record<TalentPreviewVertical, string> = {
    up: styles.up,
    down: styles.down,
};

const ALIGN_CLASS: Record<TalentPreviewAlign, string> = {
    left: styles.align_left,
    'near-left': styles.align_near_left,
    center: styles.align_center,
    'near-right': styles.align_near_right,
    right: styles.align_right,
};

const formatText = (text: string) => text
    .replace(/\n\n/g, '<div style="margin-bottom: 1.2rem"></div>')
    .replace(/\n/g, '<br>');

const visibleBounds = (el: HTMLElement) => {
    let top = 0;
    let bottom = window.innerHeight;
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflowY === 'visible') continue;
        const rect = parent.getBoundingClientRect();
        top = Math.max(top, rect.top);
        bottom = Math.min(bottom, rect.bottom);
    }
    return { top, bottom };
};

export const TalentPreview = ({
    text,
    vertical = 'down',
    align = 'left',
    enabled = true,
    arrow = true,
    autoFlip = false,
    className,
    children,
    onMouseEnter,
    ...rest
}: TalentPreviewProps) => {
    const show = enabled && !!text;
    const rootRef = useRef<HTMLDivElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const [flipped, setFlipped] = useState<TalentPreviewVertical | null>(null);
    const side = autoFlip && flipped ? flipped : vertical;

    const placeBubble = (event: MouseEvent<HTMLDivElement>) => {
        onMouseEnter?.(event);
        const root = rootRef.current;
        const bubble = bubbleRef.current;
        if (!root || !bubble) return;
        const anchor = root.getBoundingClientRect();
        const box = bubble.getBoundingClientRect();
        const gap = side === 'up' ? anchor.top - box.bottom : box.top - anchor.bottom;
        const { top, bottom } = visibleBounds(root);
        const fitsPreferred = vertical === 'up'
            ? anchor.top - gap - box.height >= top
            : anchor.bottom + gap + box.height <= bottom;
        const next = fitsPreferred ? vertical : (vertical === 'up' ? 'down' : 'up');
        if (next !== side) flushSync(() => setFlipped(next));
    };

    return (
        <div
            ref={rootRef}
            className={className ? `${styles.preview} ${className}` : styles.preview}
            onMouseEnter={autoFlip && show ? placeBubble : onMouseEnter}
            {...rest}
        >
            {children}
            {show && (
                <>
                    {arrow && <span className={`${styles.arrow} ${VERTICAL_CLASS[side]}`} aria-hidden="true" />}
                    <div className={`${styles.bubble} ${VERTICAL_CLASS[side]} ${ALIGN_CLASS[align]}`} role="tooltip">
                        <div ref={bubbleRef} dangerouslySetInnerHTML={{ __html: formatText(text!) }} />
                    </div>
                </>
            )}
        </div>
    );
};

export default TalentPreview;
