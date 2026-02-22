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
}

export type AnswerListProps = {
    answers: AnswerType[]
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
