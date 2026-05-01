"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";
import {ProtectedRoute} from "@/components/auth/ProtectedRoute";
import SingleLineInputField from "@/components/input/single-line-input-field";
import MultilineInputField from "@/components/input/multiline-input-field";
import {createQuestion} from "@/lib/dataService";
import {CLIENT_API_URL} from "@/lib/apiConfig";

export default function NewQuestionPage() {
    const {username, userId} = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [tagsStr, setTagsStr] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!userId || !title.trim() || !body.trim()) {
            setError("Not all fields are filled in");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const data = await createQuestion(
                {
                    userId,
                    username: username as string,
                    title: title.trim(),
                    text: body.trim(),
                    tags: tagsStr.trim() ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [],
                },
                CLIENT_API_URL
            );
            if (data.is_ok && data.id) router.push(`/questions/${data.id}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create question");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="content-max-800">
                <h1 className="text-block-header text-gray-text mt-6 mb-5">Ask question</h1>
                <div className="mb-4">
                    <SingleLineInputField
                        name="title"
                        placeholder="Title *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                <div className="mb-4">
                    <MultilineInputField
                        name="body"
                        placeholder="Body *"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                <div className="mb-5">
                    <SingleLineInputField
                        name="tags"
                        placeholder="Tags (comma separated)"
                        value={tagsStr}
                        onChange={(e) => setTagsStr(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                <p className={`mb-4 min-h-[24px] ${error ? "text-danger-color" : "text-transparent"}`}>
                    {error ?? "placeholder"}
                </p>
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text disabled:opacity-50"
                    >
                        {submitting ? "Publishing..." : "Publish"}
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );
}
