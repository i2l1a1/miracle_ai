"use client";

import {useState} from "react";
import Image from "next/image";
import AvatarAndUsernameHolder from "@/components/holders/avatar-and-username-holder";
import {AnswerListProps, AnswerType} from "@/app/questions/types";
import voteUpIcon from "@/public/icons/vote-up.svg";
import voteDownIcon from "@/public/icons/vote-down.svg";
import {useAuth} from "@/context/AuthContext";
import {voteAnswer} from "@/lib/dataService";
import {CLIENT_API_URL} from "@/lib/apiConfig";

export default function AnswerList({
    answers,
    onRatingUpdateAction,
    onAuthRequiredAction,
}: AnswerListProps) {
    if (!answers.length) return null;
    return (
        <div>
            {answers.map((answer, index) => (
                <AnswerItem
                    key={answer.id}
                    answer={answer}
                    showTopBorder={index > 0}
                    onRatingUpdateAction={onRatingUpdateAction}
                    onAuthRequiredAction={onAuthRequiredAction}
                />
            ))}
        </div>
    );
}

function AnswerItem({
    answer,
    showTopBorder = false,
    onRatingUpdateAction,
    onAuthRequiredAction,
}: {
    answer: AnswerType;
    showTopBorder?: boolean;
    onRatingUpdateAction: (answerId: number, newRating: number | undefined, newVote: number | null) => void;
    onAuthRequiredAction: () => void;
}) {
    const {username} = useAuth();
    const [loading, setLoading] = useState(false);
    const currentVote = answer.current_vote ?? null;

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(new Date(answer.date_added));

    const handleVote = async (voteType: number) => {
        if (!username) {
            onAuthRequiredAction();
            return;
        }
        if (answer.id == null || loading) return;
        const newVote = currentVote === voteType ? null : voteType;
        onRatingUpdateAction(answer.id, undefined, newVote);
        setLoading(true);
        try {
            const data = await voteAnswer(
                {answerId: answer.id, username, voteType},
                CLIENT_API_URL
            );
            if (data.is_ok) {
                onRatingUpdateAction(answer.id, data.rating, newVote);
            } else {
                onRatingUpdateAction(answer.id, undefined, currentVote);
            }
        } catch (e) {
            console.error(e);
            onRatingUpdateAction(answer.id, undefined, currentVote);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`py-6 ${showTopBorder ? "border-t border-separator" : ""}`}>
            <AvatarAndUsernameHolder username={answer.username} isBot={answer.is_bot}/>
            <div className="mt-5">
                <p className="text-text">{answer.text}</p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleVote(1)}
                        disabled={loading}
                        className={`p-0 border-0 bg-transparent cursor-pointer disabled:opacity-50 ${currentVote === 1 ? "opacity-70" : ""}`}
                        aria-label="Vote up"
                    >
                        <Image src={voteUpIcon} alt="Vote up" width={24} height={24}/>
                    </button>
                    <span className="text-text">{answer.rating}</span>
                    <button
                        type="button"
                        onClick={() => handleVote(-1)}
                        disabled={loading}
                        className={`p-0 border-0 bg-transparent cursor-pointer disabled:opacity-50 ${currentVote === -1 ? "opacity-70" : ""}`}
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
