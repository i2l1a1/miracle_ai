"use client";

import React, {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";

export function ProtectedRoute({children}: { children: React.ReactNode }) {
    const router = useRouter();
    const {username, loading} = useAuth();

    useEffect(() => {
        if (!loading && !username) {
            router.push("/home");
        }
    }, [username, loading, router]);

    if (loading) {
        return (
            <p>Loading...</p>
        );
    }

    if (!username) {
        return null;
    }

    return <>{children}</>;
}
