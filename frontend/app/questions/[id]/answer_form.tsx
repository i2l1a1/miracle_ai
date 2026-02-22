"use client";

import {useState, type ChangeEvent} from "react";

export default function AnswerForm() {
    const [answerText, setAnswerText] = useState("");

    const handlePublish = () => {
        alert(answerText);
    };

    return (
        <div className="border-t border-b border-separator -mx-4 px-4 py-6">
            <h2 className="text-block-header text-gray-text mb-5">Your Answer</h2>
            <textarea
                placeholder="Share what you think..."
                value={answerText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAnswerText(e.target.value)}
                className="w-full p-4 rounded-[12px] border border-input-stroke focus:outline-none focus:ring-0 focus:shadow-none placeholder:text-gray-text mb-4 resize-none min-h-[120px]"
            />
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handlePublish}
                    className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text"
                >
                    Publish
                </button>
            </div>
        </div>
    );
}
