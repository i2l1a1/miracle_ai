"use client";

import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import ellipsisMenu from "@/public/icons/ellipsis-menu.svg";

export default function DeleteOverflowMenu({
    ariaLabel,
    onDelete,
    onDeleted,
    onSecondaryAction,
    onSecondaryDone,
    secondaryLabel,
    onCopyLink,
    copyLabel = "Скопировать ссылку",
}: {
    ariaLabel: string;
    onDelete?: () => Promise<void>;
    onDeleted?: () => void;
    onSecondaryAction?: () => Promise<void>;
    onSecondaryDone?: () => void;
    secondaryLabel?: string;
    onCopyLink?: () => Promise<void>;
    copyLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current?.contains(e.target as Node)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative shrink-0 z-20 pointer-events-auto">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={busy}
                className="flex items-center justify-center w-10 h-10 -mr-1 rounded-[10px] text-gray-text hover:bg-separator hover:text-bright-text transition-all duration-150 disabled:opacity-50 cursor-pointer"
                aria-label={ariaLabel}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <Image src={ellipsisMenu} alt="" width={15} height={4} />
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute top-full right-0 mt-1 py-1 px-[4px] rounded-xl border border-separator bg-blur-background"
                >
                    {onCopyLink && (
                        <button
                            type="button"
                            role="menuitem"
                            disabled={busy}
                            onClick={() => {
                                setBusy(true);
                                onCopyLink()
                                    .then(() => {
                                        setOpen(false);
                                    })
                                    .catch(() => {})
                                    .finally(() => setBusy(false));
                            }}
                            className="block w-full whitespace-nowrap text-left cursor-pointer transition-all duration-150 hover:bg-separator rounded-[10px] px-2 py-2 text-question-header font-bold text-text disabled:opacity-50"
                        >
                            {copyLabel}
                        </button>
                    )}
                    {secondaryLabel && onSecondaryAction && (
                        <button
                            type="button"
                            role="menuitem"
                            disabled={busy}
                            onClick={() => {
                                setBusy(true);
                                onSecondaryAction()
                                    .then(() => {
                                        setOpen(false);
                                        onSecondaryDone?.();
                                    })
                                    .catch(() => {})
                                    .finally(() => setBusy(false));
                            }}
                            className="block w-full whitespace-nowrap text-left cursor-pointer transition-all duration-150 hover:bg-separator rounded-[10px] px-2 py-2 text-question-header font-bold text-text disabled:opacity-50"
                        >
                            {secondaryLabel}
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            role="menuitem"
                            disabled={busy}
                            onClick={() => {
                                setBusy(true);
                                onDelete()
                                    .then(() => {
                                        setOpen(false);
                                        onDeleted?.();
                                    })
                                    .catch(() => {})
                                    .finally(() => setBusy(false));
                            }}
                            className="block w-full whitespace-nowrap text-left cursor-pointer transition-all duration-150 hover:bg-separator rounded-[10px] px-2 py-2 text-question-header font-bold text-text hover:text-[var(--color-danger-color)] disabled:opacity-50"
                        >
                            Удалить
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
