"use client";

import {AnswerFormLoginPromptProps} from "@/app/questions/types";

export default function AnswerFormLoginPrompt({onLoginClickAction}: AnswerFormLoginPromptProps) {
    return (
        <>
            <p className="text-gray-text mb-4">
                Чтобы добавить ответ, пожалуйста, войдите в аккаунт или зарегистрируйтесь.
            </p>
            <button
                type="button"
                onClick={onLoginClickAction}
                className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text">
                Войти
            </button>
        </>
    );
}
