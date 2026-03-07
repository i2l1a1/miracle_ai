import {
    AddAnswerParams,
    AddAnswerResponse,
    SubmitAnswerCallbacks,
    VoteAnswerParams,
    VoteAnswerResponse
} from "@/lib/types";

export async function fetchData(url: string) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch questions: ${response.status} ${response.statusText}`
        );
    }

    return await response.json();
}

export type MeResponse = {
    username: string;
    questions_count: number;
    answers_count: number;
    language: string;
};

export async function getMe(apiUrl: string): Promise<MeResponse> {
    const res = await fetch(`${apiUrl}/me`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) {
        throw new Error("Failed to load profile");
    }
    return res.json();
}

export async function updateMe(
    params: { username: string; language: "en" | "ru" },
    apiUrl: string
): Promise<MeResponse> {
    const res = await fetch(`${apiUrl}/me`, {
        method: "PUT",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: params.username,
            language: params.language,
        }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail ?? "Failed to update profile");
    }
    return data;
}

export async function deleteAccount(apiUrl: string): Promise<void> {
    const res = await fetch(`${apiUrl}/delete-account`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).detail ?? "Failed to delete account");
    }
}

export async function addAnswer(
    params: AddAnswerParams,
    apiUrl: string
): Promise<AddAnswerResponse> {
    const response = await fetch(`${apiUrl}/add_answer`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            question_id: params.questionId,
            username: params.username,
            text: params.text.trim(),
            rating: params.rating ?? 0,
            is_bot: params.isBot ?? false,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? "Failed to add answer");
    }

    return data;
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
    params: { username: string; title: string; text: string; tags?: string[] },
    apiUrl: string
): Promise<{ is_ok: boolean; id?: number; message?: string }> {
    const res = await fetch(`${apiUrl}/add_new_question`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: params.username,
            title: params.title.trim(),
            text: params.text.trim(),
            tags: params.tags ?? [],
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Failed to create question");
    return data;
}

export async function voteAnswer(
    params: VoteAnswerParams,
    apiUrl: string
): Promise<VoteAnswerResponse> {
    const res = await fetch(`${apiUrl}/vote_answer`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            answer_id: params.answerId,
            username: params.username,
            vote_type: params.voteType,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Vote failed");
    return data;
}