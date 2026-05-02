"use client";

import Image from "next/image";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {ProtectedRoute} from "@/components/auth/ProtectedRoute";
import {useAuth} from "@/context/AuthContext";
import SingleLineInputField from "@/components/input/single-line-input-field";
import UserAvatar from "@/public/icons/user-green.svg";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {deleteAccount, getMe, updateMe, logoutUser} from "@/lib/dataService";
import {pluralRu} from "@/lib/pluralize";

export default function SettingsPage() {
    const router = useRouter();
    const {username, userId, setAuth, resetAuth} = useAuth();
    const [usernameInput, setUsernameInput] = useState("");
    const [language, setLanguage] = useState<"en" | "ru">("en");
    const [questionsCount, setQuestionsCount] = useState(0);
    const [answersCount, setAnswersCount] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (username) {
            setUsernameInput(username);
        }
    }, [username]);

    useEffect(() => {
        const loadMe = async () => {
            try {
                const data = await getMe(CLIENT_API_URL);
                if (data.username) {
                    setUsernameInput(data.username);
                }
                if (data.language === "ru" || data.language === "en") {
                    setLanguage(data.language);
                }
                setQuestionsCount(data.questions_count ?? 0);
                setAnswersCount(data.answers_count ?? 0);
            } catch {
                setQuestionsCount(0);
                setAnswersCount(0);
            }
        };
        loadMe();
    }, []);

    const handleSave = async () => {
        const trimmed = usernameInput.trim();
        if (!trimmed || !username) return;
        setSaving(true);
        try {
            const data = await updateMe({username: trimmed, language}, CLIENT_API_URL);
            setAuth(data.username ?? trimmed, userId);
            setQuestionsCount(data.questions_count ?? questionsCount);
            setAnswersCount(data.answers_count ?? answersCount);
            if (data.language === "ru" || data.language === "en") {
                setLanguage(data.language);
            }
        } finally {
            setSaving(false);
        }
    };

    const statsText =
        questionsCount === 0 && answersCount === 0
            ? "Пока нет активности."
            : `${questionsCount} ${pluralRu(questionsCount, "вопрос", "вопроса", "вопросов")} · ${answersCount} ${pluralRu(answersCount, "ответ", "ответа", "ответов")}`;

    return (
        <ProtectedRoute>
            <div className="content-max-800 mt-6">
                <div className="flex items-center gap-4">
                    <Image src={UserAvatar} alt="Avatar" width={60} height={60}/>
                    <div className="flex flex-col gap-1">
                        <p className="text-question-header font-bold text-text">
                            {username ? `@${username}` : "@user"}
                        </p>
                        <p className="text-button-text text-gray-text">{statsText}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-block-header text-gray-text">Профиль</p>
                    <div className="mt-5">
                        <p className="text-text">Имя пользователя</p>
                        <div className="mt-3">
                            <SingleLineInputField
                                name="username"
                                placeholder="Имя пользователя"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                disabled={saving}
                            />
                        </div>
                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text disabled:opacity-50"
                            >
                                {saving ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-block-header text-gray-text">Аккаунт</p>
                    <div className="mt-5">
                        <button
                            type="button"
                            className="text-danger-color underline cursor-pointer text-button-text disabled:opacity-50"
                            disabled={saving}
                            onClick={async () => {
                                if (!userId) return;
                                setSaving(true);
                                try {
                                    await deleteAccount(CLIENT_API_URL);
                                    await logoutUser(CLIENT_API_URL);
                                    resetAuth();
                                    router.push("/home");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                        >
                            Удалить мой аккаунт
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}