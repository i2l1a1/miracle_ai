"use client";

import {useEffect, useState} from "react";
import {useAuth} from "@/context/AuthContext";
import Question from "@/components/questions/Question";
import {QuestionMode} from "@/global_types/types";
import AnswerList from "@/app/questions/[id]/answer_list";
import AnswerForm from "@/app/questions/[id]/answer_form";
import AnswerFormLoginPrompt from "@/app/questions/[id]/answer_form_login_prompt";
import AnswerFormLoading from "@/app/questions/[id]/answer_form_loading";
import AuthPopup from "@/components/auth/auth-popup";
import {AnswerType, QuestionDetailContentProps} from "@/app/questions/types";
import {fetchData} from "@/lib/dataService";
import {CLIENT_API_URL} from "@/lib/apiConfig";

export default function QuestionDetailContent({question, initialAnswers}: QuestionDetailContentProps) {
    const {username, loading} = useAuth();
    const [answers, setAnswers] = useState<AnswerType[]>(initialAnswers);
    const [showAuthPopup, setShowAuthPopup] = useState(false);

    useEffect(() => {
        if (!username || !question.id) return;
        fetchData(`${CLIENT_API_URL}/get_question/${question.id}?username=${encodeURIComponent(username)}`)
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
    }, [username, question.id]);

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
            <Question question={question} mode={QuestionMode.QUESTION_INNER}/>
            <div className="border-t border-b border-separator -mx-4 px-4 py-6">
                <h2 className="text-block-header text-gray-text mb-5">Your Answer</h2>
                {loading && <AnswerFormLoading/>}
                {!loading && username && (
                    <AnswerForm questionId={question.id} onSuccessAction={(answer) => setAnswers((prev) => [...prev, answer])}/>
                )}
                {!loading && !username && <AnswerFormLoginPrompt onLoginClickAction={() => setShowAuthPopup(true)}/>}
            </div>
            <AnswerList
                answers={answers}
                onRatingUpdateAction={handleRatingUpdate}
                onAuthRequiredAction={() => setShowAuthPopup(true)}
            />
            {showAuthPopup && <AuthPopup onCloseAction={() => setShowAuthPopup(false)}/>}
        </div>
    );
}
