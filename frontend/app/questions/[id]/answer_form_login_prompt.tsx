"use client";

import {AnswerFormLoginPromptProps} from "@/app/questions/types";

export default function AnswerFormLoginPrompt({onLoginClickAction}: AnswerFormLoginPromptProps) {
    return (
        <>
            <p className="text-gray-text mb-4">
                To add an answer, please register or log in.
            </p>
            <button
                type="button"
                onClick={onLoginClickAction}
                className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text">
                Log in
            </button>
        </>
    );
}
