"use client";

import {useEffect, useState} from "react";
import {formatDateTime} from "@/lib/formatDateTime";

export default function ClientDateTime({
    iso,
    className,
}: {
    iso: string;
    className?: string;
}) {
    const [text, setText] = useState("");

    useEffect(() => {
        setText(formatDateTime(iso));
    }, [iso]);

    return (
        <p className={className} suppressHydrationWarning>
            {text || "\u00a0"}
        </p>
    );
}
