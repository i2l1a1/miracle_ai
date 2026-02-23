import {HomePageQuestionProps} from "@/app/home/types";

export type QuestionInnerProps = {
    params: Promise<{
        id: string
    }>
}

export type AnswerType = {
    id?: number
    username: string
    text: string
    rating: number
    is_bot: boolean
    date_added: string
    current_vote?: number
}

export type AnswerListProps = {
    answers: AnswerType[];
    onRatingUpdateAction: (answerId: number, newRating: number | undefined, newVote: number | null) => void;
    onAuthRequiredAction: () => void;
}

export type QuestionDetailContentProps = {
    question: HomePageQuestionProps;
    initialAnswers: AnswerType[];
};

export type AnswerFormLoginPromptProps = {
    onLoginClickAction: () => void;
};

export type AnswerFormProps = {
    questionId: number;
    onSuccessAction: (answer: AnswerType) => void;
};
