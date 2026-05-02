"use client";

import {useState} from "react";
import {useAuth} from "@/context/AuthContext";
import MultilineInputField from "@/components/input/multiline-input-field";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {submitAnswer} from "@/lib/dataService";
import {AnswerFormProps, AnswerType} from "@/app/questions/types";

export default function AnswerForm({questionId, onSuccessAction}: AnswerFormProps) {
    const {username, userId} = useAuth();
    const [answerText, setAnswerText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePublish = async () => {
        if (!userId || !answerText.trim()) return;
        setError(null);
        setSubmitting(true);

        await submitAnswer(
            {
                questionId,
                userId,
                username: username as string,
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
            <div className="mb-4">
                <MultilineInputField
                    name="answer"
                    placeholder="Напишите, что думаете..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={submitting}
                />
            </div>
            {error && <p className="text-danger-color mb-4">{error}</p>}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={submitting}
                    className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text disabled:opacity-50"
                >
                  {submitting ? "Идёт публикация..." : "Опубликовать"}
                </button>
            </div>
        </>
    );
}
