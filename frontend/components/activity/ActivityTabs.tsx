"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

export default function ActivityTabs() {
    const pathname = usePathname();
    const isQuestions = pathname === "/activity/my-questions";
    const isAnswers = pathname === "/activity/my-answers";

    return (
        <div className="mt-3 content-max-800">
            <nav className="flex gap-5 border-b border-separator">
                <Link
                    href="/activity/my-questions"
                    className={`relative pt-2 pb-[17px] px-1 text-[16px] -mb-px ${
                        isQuestions
                            ? "font-bold text-text after:content-[''] after:absolute after:bottom-0 after:left-[-4px] after:right-[-4px] after:h-[3px] after:bg-accent after:rounded-full"
                            : "font-normal text-dark-gray-text"
                    }`}
                >
                    Вопросы
                </Link>
                <Link
                    href="/activity/my-answers"
                    className={`relative pt-2 pb-[17px] px-1 text-[16px] -mb-px ${
                        isAnswers
                            ? "font-bold text-text after:content-[''] after:absolute after:bottom-0 after:left-[-4px] after:right-[-4px] after:h-[3px] after:bg-accent after:rounded-full"
                            : "font-normal text-dark-gray-text"
                    }`}
                >
                    Ответы
                </Link>
            </nav>
        </div>
    );
}
