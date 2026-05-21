"use client";

import {useEffect, useLayoutEffect, useRef, useState} from "react";
import Image from "next/image";
import AvatarAndUsernameHolder from "@/components/holders/avatar-and-username-holder";
import {AnswerListProps, AnswerType} from "@/app/questions/types";
import voteUpIcon from "@/public/icons/vote-up.svg";
import voteDownIcon from "@/public/icons/vote-down.svg";
import DeleteOverflowMenu from "@/components/menus/delete-overflow-menu";
import {useAuth} from "@/context/AuthContext";
import {acceptAnswer, deleteAnswer, unacceptAnswer, voteAnswer} from "@/lib/dataService";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import RichText from "@/components/text/rich-text";

export default function AnswerList({
    answers,
    questionOwnerId,
    onRatingUpdateAction,
    onAuthRequiredAction,
    onAnswerDeleted,
    onAnswerAccepted,
}: AnswerListProps) {
    const [animatedAnswerId, setAnimatedAnswerId] = useState<number | null>(null);
    const handledHashRef = useRef<string | null>(null);
    const isFirstHashHandleRef = useRef(true);

    useLayoutEffect(() => {
        const parseHashAnswerId = () => {
            if (typeof window === "undefined") return null;
            const match = window.location.hash.match(/^#answer-(\d+)$/);
            if (!match) return null;
            return Number.parseInt(match[1], 10);
        };

        const focusAnswerByHash = (scrollManually: boolean) => {
            const rawHash = typeof window !== "undefined" ? window.location.hash : "";
            if (!rawHash) return;
            if (handledHashRef.current === rawHash) return;
            const answerId = parseHashAnswerId();
            if (!answerId) return;
            const el = document.getElementById(`answer-${answerId}`);
            if (!el) return;
            handledHashRef.current = rawHash;
            const runHighlight = () => {
                setAnimatedAnswerId(answerId);
                window.setTimeout(() => {
                    setAnimatedAnswerId((prev) => (prev === answerId ? null : prev));
                }, 1000);
            };

            if (scrollManually) {
                window.requestAnimationFrame(() => {
                    el.scrollIntoView({behavior: "auto", block: "start"});
                    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
                    runHighlight();
                });
                return;
            }

            window.scrollTo(0, 0);
            window.setTimeout(() => {
                el.scrollIntoView({behavior: "smooth", block: "start"});
                window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
                runHighlight();
            }, 80);
        };

        focusAnswerByHash(false);
        isFirstHashHandleRef.current = false;

        const onHashChange = () => {
            focusAnswerByHash(!isFirstHashHandleRef.current);
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, [answers]);

    if (!answers.length) return null;
    return (
        <div>
            {answers.map((answer, index) => (
                <AnswerItem
                    key={answer.id}
                    answer={answer}
                    questionOwnerId={questionOwnerId}
                    showTopBorder={index > 0}
                    onRatingUpdateAction={onRatingUpdateAction}
                    onAuthRequiredAction={onAuthRequiredAction}
                    onAnswerDeleted={onAnswerDeleted}
                    onAnswerAccepted={onAnswerAccepted}
                    animateText={animatedAnswerId != null && answer.id === animatedAnswerId}
                />
            ))}
        </div>
    );
}

function AnswerItem({
    answer,
    questionOwnerId,
    showTopBorder = false,
    onRatingUpdateAction,
    onAuthRequiredAction,
    onAnswerDeleted,
    onAnswerAccepted,
    animateText = false,
}: {
    answer: AnswerType;
    questionOwnerId: number;
    showTopBorder?: boolean;
    onRatingUpdateAction: (answerId: number, newRating: number | undefined, newVote: number | null) => void;
    onAuthRequiredAction: () => void;
    onAnswerDeleted: (answerId: number) => void;
    onAnswerAccepted: (answerId: number | null) => void;
    animateText?: boolean;
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
    const canSetAccepted =
        userId != null &&
        questionOwnerId === userId &&
        aid != null &&
        true;

    const copyAnswerLink = async (answerId: number) => {
        if (typeof window === "undefined") return;
        const link = `${window.location.origin}${window.location.pathname}#answer-${answerId}`;
        await navigator.clipboard.writeText(link);
    };

    return (
        <div
            id={aid != null ? `answer-${aid}` : undefined}
            className={`py-6 ${showTopBorder ? "border-t border-separator" : ""}`}
        >
            <div className="flex items-center justify-between gap-2 w-full">
                <AvatarAndUsernameHolder username={answer.username} isBot={answer.is_bot}/>
                <div className="flex items-center gap-2">
                    {answer.is_accepted && (
                        <span className="text-accepted-answer text-button-text font-bold">
                            Правильный ответ
                        </span>
                    )}
                    {!answer.is_accepted && answer.rating <= -3 && (
                        <span className="text-danger-color text-button-text font-bold">
                            Скорее всего неверный
                        </span>
                    )}
                    {aid != null && (
                        <DeleteOverflowMenu
                            ariaLabel="Answer actions"
                            onCopyLink={() => copyAnswerLink(aid)}
                            onDelete={canDelete ? () => deleteAnswer(aid, CLIENT_API_URL) : undefined}
                            onDeleted={canDelete ? () => onAnswerDeleted(aid) : undefined}
                            secondaryLabel={canSetAccepted ? (answer.is_accepted ? "Снять отметку" : "Принять ответ") : undefined}
                            onSecondaryAction={
                                canSetAccepted
                                    ? () =>
                                        (answer.is_accepted
                                            ? unacceptAnswer(aid, CLIENT_API_URL)
                                            : acceptAnswer(aid, CLIENT_API_URL)
                                        ).then(() => undefined)
                                    : undefined
                            }
                            onSecondaryDone={canSetAccepted ? () => onAnswerAccepted(answer.is_accepted ? null : aid) : undefined}
                        />
                    )}
                </div>
            </div>
            <div className="mt-5">
                <RichText
                    text={answer.text}
                    className={`transition-colors duration-1000 ${animateText ? "text-dark-gray-text" : "text-text"}`}
                />
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
