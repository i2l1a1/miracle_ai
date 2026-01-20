"use client"

import closeAuth from "@/public/icons/close-auth.svg"
import Image from "next/image";
import {momoTrustDisplay} from "@/app/fonts";
import SingleLineInputField from "@/components/input/single-line-input-field";
import AuthButtonBig from "@/components/buttons/auth-button-big";
import {FormEvent, useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";

export default function AuthPopup({onCloseAction}: { onCloseAction: () => void }) {
    const router = useRouter();
    const {setUsername: setAuthUsername} = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegister, setIsRegister] = useState(false);

    const validateForm = () => {
        if (!username || !password) {
            setError("Username and password are required");
            return false;
        }
        setError("");
        return true;
    };

    const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;
        setError("");

        try {
            const response = await fetch(`http://localhost:8080/register`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            if (response.ok) {
                await handleLogin();
            } else {
                const errorData = await response.json();
                if (response.status === 400 && errorData.detail === "Username already registered") {
                    setError("Username already registered");
                } else {
                    setError(errorData.detail || "Registration failed!");
                }
            }
        } catch (err) {
            setError("An error occurred. Please try again later.");
        }
    };

    const handleLogin = async (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault(); // Предотвращаем дефолтное поведение только если event передан
        if (!validateForm()) return;
        setError("");

        const formDetails = new URLSearchParams();
        formDetails.append("username", username);
        formDetails.append("password", password);

        try {
            const response = await fetch(`http://localhost:8080/token`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formDetails,
            });

            if (response.ok) {
                setAuthUsername(username);
                onCloseAction();
            } else {
                const errorData = await response.json();
                setError(errorData.detail || "Authentication failed!");
            }
        } catch (err) {
            setError("An error occurred. Please try again later.");
        }
    };

    const toggleMode = () => {
        setIsRegister((prev) => !prev);
        setError("");
        setUsername("");
        setPassword("");
    };

    useEffect(() => {
        document.body.classList.add("overflow-hidden");
        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, [onCloseAction]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background px-4">
            <div onClick={onCloseAction} className="self-end mt-4 cursor-pointer">
                <Image src={closeAuth} alt="Close"/>
            </div>

            <div className="flex flex-col mt-6">
                <p className={`${momoTrustDisplay.className} text-welcome-label text-center`}>Welcome!</p>
                <form
                    className="mt-4 w-full"
                    onSubmit={isRegister ? handleRegister : handleLogin}
                >
                    <div className="flex flex-col gap-4">
                        <SingleLineInputField name={"username"} placeholder={"Enter username"}
                                              onChange={(e) => setUsername(e.target.value)}/>
                        <SingleLineInputField type={"password"} name={"password"}
                                              placeholder={"Enter password"}
                                              onChange={(e) => setPassword(e.target.value)}/>
                    </div>
                    <div className="mt-5 text-right">
                        {isRegister ? "Have an account? " : "New here? "}
                        <button
                            type="button"
                            onClick={toggleMode}
                        >
                            <span className="underline text-accent cursor-pointer">
                                {isRegister ? "Log in!" : "Sign up!"}
                            </span>

                        </button>
                    </div>
                    <AuthButtonBig text={isRegister ? "Sign up!" : "Log in!"}/>
                </form>
            </div>
        </div>
    );
}
