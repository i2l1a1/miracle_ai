import {
    AddAnswerParams,
    AddAnswerResponse,
    SubmitAnswerCallbacks,
    VoteAnswerParams,
    VoteAnswerResponse
} from "@/lib/types";
import type {AnswerType} from "@/app/questions/types";
import {HOME_QUESTIONS_PAGE_SIZE, type HomeFilterValues} from "@/app/home/applyHomeFilters";
import type {HomePageQuestionProps} from "@/app/home/types";

import {CLIENT_API_URL} from "@/lib/apiConfig";

let refreshTokenPromise: Promise<any> | null = null;

let authResetCallback: (() => void) | null = null;

export const setAuthCallbacks = (reset: () => void) => {
    authResetCallback = reset;
};

export async function fetchData(url: string, options?: RequestInit): Promise<any> {
    let response = await fetch(url, {
        credentials: "include",
        ...options,
    });

    if (response.status === 401 && url !== `${CLIENT_API_URL}/token` && url !== `${CLIENT_API_URL}/refresh-token`) {
        if (!refreshTokenPromise) {
            refreshTokenPromise = (async () => {
                try {
                    const refreshRes = await fetch(`${CLIENT_API_URL}/refresh-token`, {
                        method: "POST",
                        credentials: "include",
                    });

                    if (refreshRes.ok) {
                        return Promise.resolve();
                    } else {
                        const errorData: ErrorResponse = await refreshRes.json().catch(() => ({}));
                        if (errorData.detail === "Refresh token missing") {
                            if (authResetCallback) authResetCallback();
                            return Promise.resolve(null);
                        } else {
                            const refreshError = new Error(errorData.detail ?? "Failed to refresh token");
                            if (authResetCallback) authResetCallback();
                            throw refreshError;
                        }
                    }
                } catch (refreshError) {
                    if (authResetCallback) authResetCallback();
                    throw refreshError;
                } finally {
                    refreshTokenPromise = null;
                }
            })();
        }

        await refreshTokenPromise;

        response = await fetch(url, {
            credentials: "include",
            ...options,
        });
    }

    if (!response.ok) {
        if (url === `${CLIENT_API_URL}/verify-token` && response.status === 401) {
            return null;
        }
        const errorData: ErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Failed to fetch: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

export type MeResponse = {
    username: string;
    questions_count: number;
    answers_count: number;
    language: string;
};

type ErrorResponse = {
    detail?: string;
    message?: string;
}

export async function getMe(apiUrl: string): Promise<MeResponse> {
    const res = await fetchData(`${apiUrl}/me`, {
        method: "GET",
        credentials: "include",
    });
    return res;
}

export async function updateMe(
    params: { username: string; language: "en" | "ru" },
    apiUrl: string
): Promise<MeResponse> {
    return await fetchData(`${apiUrl}/me`, {
        method: "PUT",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: params.username,
            language: params.language,
        }),
    });
}

export async function deleteAccount(apiUrl: string): Promise<void> {
    return await fetchData(`${apiUrl}/delete-account`, {
        method: "POST",
        credentials: "include",
    });
}

export async function logoutUser(apiUrl: string): Promise<void> {
    return await fetchData(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
    });
}

export async function syncAuthStatusWithBackend(
    apiUrl: string,
    setAuth: (username: string | null, userId: number | null) => void,
    resetAuth: () => void,
    setLoading: (loading: boolean) => void
): Promise<void> {
    try {
        const data = await fetchData(`${apiUrl}/verify-token`, {
            method: "GET",
            credentials: "include",
        });
        if (data) {
            setAuth(data.username ?? null, data.user_id ?? null);
        } else {
            resetAuth();
        }
    } catch (error) {
        if (error instanceof Error && error.message === "Failed to refresh token") {
            console.log("Auth token verification failed due to missing refresh token, logging out.");
        } else {
            console.error("Failed to verify token:", error);
        }
        resetAuth();
    } finally {
        setLoading(false);
    }
}

export async function addAnswer(
    params: AddAnswerParams,
    apiUrl: string
): Promise<AddAnswerResponse> {
    return await fetchData(`${apiUrl}/add_answer`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            question_id: params.questionId,
            user_id: params.userId,
            username: params.username,
            text: params.text.trim(),
            is_bot: params.isBot ?? false,
        }),
    });
}

export async function submitAnswer(
    params: AddAnswerParams,
    apiUrl: string,
    callbacks: SubmitAnswerCallbacks
): Promise<void> {
    try {
        const data = await addAnswer(params, apiUrl);

        if (data.is_ok && data.answer) {
            const answer = {
                id: data.answer.id,
                user_id: data.answer.user_id ?? params.userId,
                username: data.answer.username,
                text: data.answer.text,
                rating: data.answer.rating ?? 0,
                is_bot: data.answer.is_bot ?? false,
                date_added: data.answer.date_added,
            };
            callbacks.onSuccess(answer);
            callbacks.onClearText?.();
        }
    } catch (e) {
        callbacks.onError(e instanceof Error ? e.message : "Failed to add answer");
    } finally {
        callbacks.onFinally();
    }
}

export async function createQuestion(
    params: { userId: number; username: string; title: string; text: string; tags?: string[] },
    apiUrl: string
): Promise<{ is_ok: boolean; id?: number; message?: string }> {
    return await fetchData(`${apiUrl}/add_new_question`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            id: null,
            user_id: params.userId,
            username: params.username,
            title: params.title.trim(),
            text: params.text.trim(),
            tags: params.tags ?? [],
        }),
    });
}

export async function deleteAnswer(answerId: number, apiUrl: string): Promise<void> {
    await fetchData(`${apiUrl}/delete_answer/${answerId}`, {
        method: "DELETE",
        credentials: "include",
    });
}

export async function deleteQuestion(questionId: number, apiUrl: string): Promise<void> {
    await fetchData(`${apiUrl}/delete_question/${questionId}`, {
        method: "DELETE",
        credentials: "include",
    });
}

export async function voteAnswer(
    params: VoteAnswerParams,
    apiUrl: string
): Promise<VoteAnswerResponse> {
    return await fetchData(`${apiUrl}/vote_answer`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            answer_id: params.answerId,
            user_id: params.userId,
            vote_type: params.voteType,
        }),
    });
}

export type GenerateAiAnswerResponse = {
    is_ok: boolean;
    created: boolean;
    answer: {
        id?: number;
        user_id?: number;
        username: string;
        text: string;
        rating: number;
        is_bot: boolean;
        date_added: string;
        status?: string;
    };
};

export async function generateAiAnswer(
    questionId: number,
    apiUrl: string
): Promise<GenerateAiAnswerResponse> {
    return await fetchData(`${apiUrl}/generate_ai_answer/${questionId}`, {
        method: "POST",
        credentials: "include",
    });
}

export type GetQuestionAnswersResponse = {
    is_ok: boolean;
    answers?: AnswerType[];
};

export type HomeQuestionsPageResponse = {
    is_ok: boolean;
    questions: HomePageQuestionProps[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
};

export async function fetchHomeQuestions(
    apiUrl: string,
    params: {
        page: number;
        pageSize?: number;
        filter: HomeFilterValues;
    }
): Promise<HomeQuestionsPageResponse> {
    const pageSize = params.pageSize ?? HOME_QUESTIONS_PAGE_SIZE;
    const qs = new URLSearchParams({
        page: String(params.page),
        page_size: String(pageSize),
        sort: params.filter.sortBy,
        only_ai_answered: params.filter.onlyAiAnswered ? "true" : "false",
    });
    if (params.filter.tags.length > 0) {
        qs.set("tags", params.filter.tags.join(","));
    }
    return await fetchData(`${apiUrl}/all_questions?${qs.toString()}`);
}

export function startPollingQuestionAnswers(
    questionId: number,
    apiUrl: string,
    onAnswers: (answers: AnswerType[]) => void,
    intervalMs = 2000
): () => void {
    const id = setInterval(() => {
        fetchData(`${apiUrl}/get_question/${questionId}`)
            .then((data: GetQuestionAnswersResponse) => {
                if (!data.is_ok || !data.answers) return;
                onAnswers(data.answers);
            })
            .catch(() => {});
    }, intervalMs);
    return () => clearInterval(id);
}
