"use client";

import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";
import Question from "@/components/questions/Question";
import {QuestionMode} from "@/global_types/types";
import AnswerList from "@/app/questions/[id]/answer_list";
import AnswerForm from "@/app/questions/[id]/answer_form";
import AnswerFormLoginPrompt from "@/app/questions/[id]/answer_form_login_prompt";
import AnswerFormLoading from "@/app/questions/[id]/answer_form_loading";
import AuthPopup from "@/components/auth/auth-popup";
import {AnswerType, QuestionDetailContentProps} from "@/app/questions/types";
import {fetchData, generateAiAnswer} from "@/lib/dataService";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import type {GenerateAiAnswerResponse} from "@/lib/dataService";

const aiAnswerInflight = new Map<number, Promise<GenerateAiAnswerResponse>>();

export default function QuestionDetailContent({question, initialAnswers}: QuestionDetailContentProps) {
    const router = useRouter();
    const {userId, loading} = useAuth();
    const [answers, setAnswers] = useState<AnswerType[]>(initialAnswers);
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const answersRef = useRef(answers);

    useLayoutEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        setAiLoading(false);
    }, [question.id]);

    useEffect(() => {
        if (!userId || !question.id) return;
        fetchData(`${CLIENT_API_URL}/get_question/${question.id}`)
            .then((data: { is_ok: boolean; answers: AnswerType[] }) => {
                if (!data.is_ok) return;
                const voteById = Object.fromEntries(
                    (data.answers ?? []).filter((a) => a.id != null).map((a) => [a.id as number, a.current_vote])
                );
                setAnswers((prev) =>
                    prev.map((a) => ({ ...a, current_vote: a.id != null ? voteById[a.id] : undefined }))
                );
            })
            .catch(() => {});
    }, [userId, question.id]);

    useEffect(() => {
        if (loading || !userId || !question.id) return;
        if (question.user_id !== userId) return;
        if (answersRef.current.some((a) => a.is_bot)) return;

        let cancelled = false;
        setAiLoading(true);

        let p = aiAnswerInflight.get(question.id);
        if (!p) {
            p = generateAiAnswer(question.id, CLIENT_API_URL).finally(() => {
                aiAnswerInflight.delete(question.id);
            });
            aiAnswerInflight.set(question.id, p);
        }

        p.then((data) => {
            if (cancelled || !data.is_ok || !data.answer) return;
            const mapped: AnswerType = {
                id: data.answer.id,
                user_id: data.answer.user_id,
                username: data.answer.username,
                text: data.answer.text,
                rating: data.answer.rating ?? 0,
                is_bot: data.answer.is_bot ?? true,
                date_added: data.answer.date_added,
            };
            setAnswers((prev) => {
                if (prev.some((a) => a.is_bot)) return prev;
                return [...prev.filter((a) => !a.is_bot), mapped];
            });
        })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setAiLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [loading, userId, question.id, question.user_id]);

    const handleRatingUpdate = (answerId: number, newRating: number | undefined, newVote: number | null) => {
        setAnswers((prev) =>
            prev.map((a) => {
                if (a.id !== answerId) return a;
                return {
                    ...a,
                    ...(newRating !== undefined && { rating: newRating }),
                    ...(newVote !== undefined && { current_vote: newVote ?? undefined }),
                };
            })
        );
    };

    return (
        <div className="flex flex-col">
            <Question
                question={question}
                mode={QuestionMode.QUESTION_INNER}
                showOwnerMenu={userId != null && question.user_id === userId}
                onQuestionDeleted={() => router.push("/home")}
            />
            <div className="border-t border-b border-separator -mx-4 px-4 py-6">
                <h2 className="text-block-header text-gray-text mb-5">Your Answer</h2>
                {loading && <AnswerFormLoading/>}
                {!loading && userId && (
                    <AnswerForm questionId={question.id} onSuccessAction={(answer) => setAnswers((prev) => [...prev, answer])}/>
                )}
                {!loading && !userId && <AnswerFormLoginPrompt onLoginClickAction={() => setShowAuthPopup(true)}/>}
            </div>
            {aiLoading && (
                <div className="border-t border-separator -mx-4 px-4 py-6">
                    <p className="text-gray-text">Loading...</p>
                </div>
            )}
            <AnswerList
                answers={answers}
                onRatingUpdateAction={handleRatingUpdate}
                onAuthRequiredAction={() => setShowAuthPopup(true)}
                onAnswerDeleted={(id) => setAnswers((prev) => prev.filter((a) => a.id !== id))}
            />
            {showAuthPopup && <AuthPopup onCloseAction={() => setShowAuthPopup(false)}/>}
        </div>
    );
}
