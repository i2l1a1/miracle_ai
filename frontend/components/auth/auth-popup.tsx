"use client";

import closeAuth from "@/public/icons/close-auth.svg";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {momoTrustDisplay} from "@/app/fonts";
import SingleLineInputField from "@/components/input/single-line-input-field";
import AuthButtonBig from "@/components/buttons/auth-button-big";
import {FormEvent, useState, useEffect} from "react";
import {useAuth} from "@/context/AuthContext";
import {CLIENT_API_URL} from "@/lib/apiConfig";

export default function AuthPopup({onCloseAction}: { onCloseAction: () => void }) {
  const router = useRouter();
  const {setAuth} = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const validateForm = () => {
    if (!username || !password) {
      setError("Заполните имя пользователя и пароль");
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
      const response = await fetch(`${CLIENT_API_URL}/register`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password}),
      });

      if (response.ok) {
        await handleLogin();
      } else {
        const errorData = await response.json();
        if (response.status === 400 && errorData.detail === "Username already registered") {
          setError("Имя пользователя уже занято");
        } else {
          setError(errorData.detail || "Не удалось зарегистрироваться");
        }
      }
    } catch (err) {
      setError("Произошла ошибка. Пожалуйста, попробуйте позже.");
    }
  };

  const handleLogin = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!validateForm()) return;
    setError("");

    const formDetails = new URLSearchParams();
    formDetails.append("username", username);
    formDetails.append("password", password);

    try {
      const response = await fetch(`${CLIENT_API_URL}/token`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: formDetails,
      });

      if (response.ok) {
        const data = await response.json();
        setAuth(data.username ?? username, data.user_id ?? null);
        onCloseAction();
        const redirect = sessionStorage.getItem("redirectAfterLogin");
        if (redirect) {
          sessionStorage.removeItem("redirectAfterLogin");
          router.push(redirect);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Произошла ошибка. Пожалуйста, попробуйте позже.");
      }
    } catch (err) {
      setError("Произошла ошибка. Пожалуйста, попробуйте позже.");
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
    return () => document.body.classList.remove("overflow-hidden");
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background px-4 h-full">
      <div onClick={onCloseAction} className="self-end mt-4 cursor-pointer">
        <Image src={closeAuth} alt="Close"/>
      </div>

      <form
        className="flex flex-col flex-1 content-max-500 mx-auto w-full"
        onSubmit={isRegister ? handleRegister : handleLogin}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            <p className={`text-welcome-label text-center mb-4`}>
              Приветствуем!
            </p>
            <div className="flex flex-col gap-4 mt-4">
              <SingleLineInputField
                name="username"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <SingleLineInputField
                type="password"
                name="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mt-5 text-right">
              {isRegister ? "Уже есть аккаунт? " : "Ещё нет аккаунта? "}
              <button type="button" onClick={toggleMode}>
                                <span className="underline text-accent cursor-pointer">
                                    {isRegister ? "Войти" : "Зарегистрироваться"}
                                </span>
              </button>
            </div>
            {error && <div className="text-danger-color text-sm mt-2">{error}</div>}
          </div>
        </div>

        <div className="mt-auto mb-6 flex justify-center">
          <AuthButtonBig text={isRegister ? "Зарегистрироваться" : "Войти"}/>
        </div>
      </form>
    </div>
  );
}