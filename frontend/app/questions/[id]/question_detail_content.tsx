"use client";

import {useState} from "react";
import {useAuth} from "@/context/AuthContext";
import Question from "@/components/questions/Question";
import {QuestionMode} from "@/global_types/types";
import AnswerList from "@/app/questions/[id]/answer_list";
import AnswerForm from "@/app/questions/[id]/answer_form";
import AnswerFormLoginPrompt from "@/app/questions/[id]/answer_form_login_prompt";
import AnswerFormLoading from "@/app/questions/[id]/answer_form_loading";
import AuthPopup from "@/components/auth/auth-popup";
import {AnswerType} from "@/app/questions/types";
import {QuestionDetailContentProps} from "@/app/questions/types";

export default function QuestionDetailContent({question, initialAnswers}: QuestionDetailContentProps) {
    const {username, loading} = useAuth();
    const [answers, setAnswers] = useState<AnswerType[]>(initialAnswers);
    const [showAuthPopup, setShowAuthPopup] = useState(false);

    const handleAnswerAdded = (answer: AnswerType) => {
        setAnswers((prev) => [...prev, answer]);
    };

    const questionId = question.id;

    const renderYourAnswer = () => {
        if (loading) return <AnswerFormLoading/>;
        if (username) return <AnswerForm questionId={questionId} onSuccessAction={handleAnswerAdded}/>;
        return <AnswerFormLoginPrompt onLoginClickAction={() => setShowAuthPopup(true)}/>;
    };

    return (
        <div className="flex flex-col">
            <Question question={question} mode={QuestionMode.QUESTION_INNER}/>
            <div className="border-t border-b border-separator -mx-4 px-4 py-6">
                <h2 className="text-block-header text-gray-text mb-5">Your Answer</h2>
                {renderYourAnswer()}
            </div>
            <AnswerList answers={answers}/>
            {showAuthPopup && <AuthPopup onCloseAction={() => setShowAuthPopup(false)}/>}
        </div>
    );
}
