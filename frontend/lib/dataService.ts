import {
    AddAnswerParams,
    AddAnswerResponse,
    SubmitAnswerCallbacks,
    VoteAnswerParams,
    VoteAnswerResponse
} from "@/lib/types";

import {CLIENT_API_URL} from "@/lib/apiConfig";

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

let authResetCallback: (() => void) | null = null;

export const setAuthCallbacks = (reset: () => void) => {
    authResetCallback = reset;
};

const processQueue = (error: any | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export async function fetchData(url: string, options?: RequestInit): Promise<any> {
    const response = await fetch(url, {
        credentials: "include",
        ...options,
    });

    if (response.status === 401 && url !== `${CLIENT_API_URL}/token` && url !== `${CLIENT_API_URL}/refresh-token`) {
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                const refreshRes = await fetch(`${CLIENT_API_URL}/refresh-token`, {
                    method: "POST",
                    credentials: "include",
                });

                if (refreshRes.ok) {
                    isRefreshing = false;
                    processQueue(null);
                    
                    return fetchData(url, options);
                } else {
                    isRefreshing = false;
                    const errorData: ErrorResponse = await refreshRes.json().catch(() => ({}));
                    if (errorData.detail === "Refresh token missing") {
                        processQueue(null);
                        if (authResetCallback) authResetCallback();
                        return Promise.resolve(null);
                    } else {
                        const refreshError = new Error(errorData.detail ?? "Failed to refresh token");
                        processQueue(refreshError);
                        if (authResetCallback) authResetCallback();
                        throw refreshError;
                    }
                }
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);
                throw refreshError;
            } finally {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } else {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => fetchData(url, options));
        }
    }

    if (!response.ok) {
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
        console.error("Failed to verify token:", error);
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