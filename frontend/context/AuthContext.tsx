"use client";

import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {CLIENT_API_URL} from "@/lib/apiConfig";

type AuthContextValue = {
    username: string | null;
    userId: number | null;
    setAuth: (username: string | null, userId: number | null) => void;
    resetAuth: () => void;
    loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const setAuth = (name: string | null, id: number | null) => {
        setUsername(name);
        setUserId(id);
    };

    const resetAuth = () => setAuth(null, null);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await fetch(`${CLIENT_API_URL}/verify-token`, {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setAuth(data.username ?? null, data.user_id ?? null);
                } else {
                    resetAuth();
                }
            } catch (error) {
                console.error("Failed to verify token:", error);
                resetAuth();
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, []);

    return (
        <AuthContext.Provider value={{username, userId, setAuth, resetAuth, loading}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
