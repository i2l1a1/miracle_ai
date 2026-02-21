"use client";

import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {CLIENT_API_URL} from "@/lib/apiConfig";

type AuthContextValue = {
    username: string | null;
    setUsername: (value: string | null) => void;
    resetAuth: () => void;
    loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const resetAuth = () => setUsername(null);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await fetch(`${CLIENT_API_URL}/verify-token`, {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                } else {
                    setUsername(null);
                }
            } catch (error) {
                console.error("Failed to verify token:", error);
                setUsername(null);
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, []);

    return (
        <AuthContext.Provider value={{username, setUsername, resetAuth, loading}}>
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
