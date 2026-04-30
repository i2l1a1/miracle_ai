export type AddAnswerParams = {
    questionId: number;
    userId: number;
    username: string;
    text: string;
    rating?: number;
    isBot?: boolean;
};

export type AddAnswerResponse = {
    is_ok: boolean;
    id?: number;
    answer?: {
        id: number;
        user_id: number;
        username: string;
        text: string;
        rating: number;
        is_bot: boolean;
        date_added: string;
        is_accepted?: boolean;
    };
    message?: string;
};

export type SubmitAnswerCallbacks = {
    onSuccess: (answer: {
        id: number;
        user_id: number;
        username: string;
        text: string;
        rating: number;
        is_bot: boolean;
        date_added: string;
    }) => void;
    onError: (error: string) => void;
    onFinally: () => void;
    onClearText?: () => void;
};

export type VoteAnswerParams = {
    answerId: number;
    userId: number;
    voteType: number;
};
export type VoteAnswerResponse = {
    is_ok: boolean;
    rating?: number;
    message?: string
};