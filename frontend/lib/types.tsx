export type AddAnswerParams = {
    questionId: number;
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
        username: string;
        text: string;
        rating: number;
        is_bot: boolean;
        date_added: string;
    };
    message?: string;
};

export type SubmitAnswerCallbacks = {
    onSuccess: (answer: {
        id: number;
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