"use client";

import Image from "next/image";
import AvatarAndUsernameHolder from "@/components/holders/avatar-and-username-holder";
import {AnswerListProps, AnswerType} from "@/app/questions/types";
import voteUpIcon from "@/public/icons/vote-up.svg";
import voteDownIcon from "@/public/icons/vote-down.svg";

export default function AnswerList({answers}: AnswerListProps) {
    if (!answers?.length) {
        return null;
    }

    return (
        <div>
            {answers.map((answer) => (
                <AnswerItem key={answer.id} answer={answer}/>
            ))}
        </div>
    );
}

function AnswerItem({answer}: { answer: AnswerType }) {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(new Date(answer.date_added));

    return (
        <div className="border-t border-separator py-6">
            <AvatarAndUsernameHolder username={answer.username} isBot={answer.is_bot}/>
            <div className="mt-5">
                <p className="text-text">{answer.text}</p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => alert("Vote up")}
                        className="p-0 border-0 bg-transparent cursor-pointer"
                        aria-label="Vote up"
                    >
                        <Image src={voteUpIcon} alt="Vote up" width={24} height={24}/>
                    </button>
                    <span className="text-text">{answer.rating}</span>
                    <button
                        type="button"
                        onClick={() => alert("Vote down")}
                        className="p-0 border-0 bg-transparent cursor-pointer"
                        aria-label="Vote down"
                    >
                        <Image src={voteDownIcon} alt="Vote down" width={24} height={24}/>
                    </button>
                </div>
                <p className="text-gray-text">{formattedDate}</p>
            </div>
        </div>
    );
}
