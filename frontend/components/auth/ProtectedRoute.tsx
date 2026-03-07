"use client";

import React, {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";

export function ProtectedRoute({children}: { children: React.ReactNode }) {
    const router = useRouter();
    const {userId, loading} = useAuth();

    useEffect(() => {
        if (!loading && !userId) {
            router.push("/home");
        }
    }, [userId, loading, router]);

    if (loading) {
        return (
            <p>Loading...</p>
        );
    }

    if (!userId) {
        return null;
    }

    return <>{children}</>;
}
