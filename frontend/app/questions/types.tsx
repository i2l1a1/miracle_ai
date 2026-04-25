import {HomePageQuestionProps} from "@/app/home/types";

export type QuestionInnerProps = {
    params: Promise<{
        id: string
    }>
}

export type AnswerType = {
    id?: number
    user_id?: number
    username: string
    text: string
    rating: number
    is_bot: boolean
    date_added: string
    current_vote?: number
    status?: string
    is_accepted?: boolean
}

export type AnswerListProps = {
    answers: AnswerType[];
    questionOwnerId: number;
    onRatingUpdateAction: (answerId: number, newRating: number | undefined, newVote: number | null) => void;
    onAuthRequiredAction: () => void;
    onAnswerDeleted: (answerId: number) => void;
    onAnswerAccepted: (answerId: number | null) => void;
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
