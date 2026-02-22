"use client";

import {useState, type ChangeEvent} from "react";
import {useAuth} from "@/context/AuthContext";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {submitAnswer} from "@/lib/dataService";
import {AnswerFormProps, AnswerType} from "@/app/questions/types";

export default function AnswerForm({questionId, onSuccessAction}: AnswerFormProps) {
    const {username} = useAuth();
    const [answerText, setAnswerText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePublish = async () => {
        if (!username || !answerText.trim()) return;
        setError(null);
        setSubmitting(true);

        await submitAnswer(
            {
                questionId,
                username,
                text: answerText.trim(),
                rating: 0,
                isBot: false,
            },
            CLIENT_API_URL,
            {
                onSuccess: (answer) => {
                    onSuccessAction(answer as AnswerType);
                },
                onError: (errorMessage) => {
                    setError(errorMessage);
                },
                onFinally: () => {
                    setSubmitting(false);
                },
                onClearText: () => {
                    setAnswerText("");
                },
            }
        );
    };

    return (
        <>
            <textarea
                placeholder="Share what you think..."
                value={answerText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAnswerText(e.target.value)}
                className="w-full p-4 rounded-[12px] border border-input-stroke focus:outline-none focus:ring-0 focus:shadow-none placeholder:text-gray-text mb-4 resize-none min-h-[120px]"
                disabled={submitting}
            />
            {error && <p className="text-danger-color mb-4">{error}</p>}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={submitting}
                    className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text disabled:opacity-50"
                >
                    {submitting ? "Publishing..." : "Publish"}
                </button>
            </div>
        </>
    );
}
