"use client";

import Image from "next/image";
import {useEffect, useState} from "react";
import {ProtectedRoute} from "@/components/auth/ProtectedRoute";
import {useAuth} from "@/context/AuthContext";
import SingleLineInputField from "@/components/input/single-line-input-field";
import UserAvatar from "@/public/icons/user-green.svg";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {getMe, updateMe} from "@/lib/dataService";

export default function SettingsPage() {
    const {username, setUsername} = useAuth();
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
                    if (!username) {
                        setUsername(data.username);
                    }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        const trimmed = usernameInput.trim();
        if (!trimmed || !username) return;
        setSaving(true);
        try {
            const data = await updateMe({username: trimmed, language}, CLIENT_API_URL);
            setUsername(data.username ?? trimmed);
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
            ? "No activity yet"
            : `${questionsCount} questions · ${answersCount} answers`;

    return (
        <ProtectedRoute>
            <div className="mt-6">
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
                    <p className="text-block-header text-gray-text">Profile &amp; Language</p>
                    <div className="mt-5">
                        <p className="text-text">Username</p>
                        <div className="mt-3">
                            <SingleLineInputField
                                name="username"
                                placeholder="Username"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                disabled={saving}
                            />
                        </div>
                        <div className="mt-4">
                            <p className="text-text">Language</p>
                            <select
                                className="mt-3 w-full p-4 rounded-[12px] border border-input-stroke bg-transparent focus:outline-none focus:ring-0 focus:shadow-none text-text"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value === "ru" ? "ru" : "en")}
                                disabled={saving}
                            >
                                <option value="en">English</option>
                                <option value="ru">Русский</option>
                            </select>
                        </div>
                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-block-header text-gray-text">Account Management</p>
                    <div className="mt-5">
                        <button
                            type="button"
                            className="text-danger-color underline cursor-pointer text-button-text"
                        >
                            Delete my account
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}