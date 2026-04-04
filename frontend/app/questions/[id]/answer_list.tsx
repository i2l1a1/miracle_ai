"use client";

import {useState} from "react";
import Image from "next/image";
import AvatarAndUsernameHolder from "@/components/holders/avatar-and-username-holder";
import {AnswerListProps, AnswerType} from "@/app/questions/types";
import voteUpIcon from "@/public/icons/vote-up.svg";
import voteDownIcon from "@/public/icons/vote-down.svg";
import DeleteOverflowMenu from "@/components/menus/delete-overflow-menu";
import {useAuth} from "@/context/AuthContext";
import {deleteAnswer, voteAnswer} from "@/lib/dataService";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import MultilineText from "@/components/text/multiline-text";

export default function AnswerList({
    answers,
    onRatingUpdateAction,
    onAuthRequiredAction,
    onAnswerDeleted,
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
                    onAnswerDeleted={onAnswerDeleted}
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
    onAnswerDeleted,
}: {
    answer: AnswerType;
    showTopBorder?: boolean;
    onRatingUpdateAction: (answerId: number, newRating: number | undefined, newVote: number | null) => void;
    onAuthRequiredAction: () => void;
    onAnswerDeleted: (answerId: number) => void;
}) {
    const {userId} = useAuth();
    const [loading, setLoading] = useState(false);
    const currentVote = answer.current_vote ?? null;
    const aid = answer.id;

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(new Date(answer.date_added));

    const handleVote = async (voteType: number) => {
        if (!userId) {
            onAuthRequiredAction();
            return;
        }
        if (aid == null || loading) return;
        const newVote = currentVote === voteType ? null : voteType;
        onRatingUpdateAction(aid, undefined, newVote);
        setLoading(true);
        try {
            const data = await voteAnswer({answerId: aid, userId, voteType}, CLIENT_API_URL);
            if (data.is_ok) {
                onRatingUpdateAction(aid, data.rating, newVote);
            } else {
                onRatingUpdateAction(aid, undefined, currentVote);
            }
        } catch (e) {
            console.error(e);
            onRatingUpdateAction(aid, undefined, currentVote);
        } finally {
            setLoading(false);
        }
    };

    const canDelete =
        userId != null && answer.user_id === userId && aid != null && !answer.is_bot;

    return (
        <div className={`py-6 ${showTopBorder ? "border-t border-separator" : ""}`}>
            <div className="flex items-center justify-between gap-2 w-full">
                <AvatarAndUsernameHolder username={answer.username} isBot={answer.is_bot}/>
                {canDelete && (
                    <DeleteOverflowMenu
                        ariaLabel="Answer actions"
                        onDelete={() => deleteAnswer(aid, CLIENT_API_URL)}
                        onDeleted={() => onAnswerDeleted(aid)}
                    />
                )}
            </div>
            <div className="mt-5">
                <MultilineText text={answer.text} className="text-text"/>
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
