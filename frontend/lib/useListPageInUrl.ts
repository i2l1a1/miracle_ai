"use client";

import {useCallback, useMemo} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

export function parseListPageParam(searchParams: URLSearchParams): number {
    const raw = searchParams.get("page");
    if (!raw) return 1;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.floor(n);
}

export function useListPageInUrl() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const page = useMemo(() => parseListPageParam(searchParams), [searchParams]);
    const replacePageInUrl = useCallback(
        (next: number) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next <= 1) params.delete("page");
            else params.set("page", String(next));
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, {scroll: false});
        },
        [router, pathname, searchParams]
    );
    return {page, replacePageInUrl};
}
