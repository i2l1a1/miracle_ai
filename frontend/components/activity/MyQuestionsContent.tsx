"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { CLIENT_API_URL } from "@/lib/apiConfig";
import { fetchData } from "@/lib/dataService";
import Question from "@/components/questions/Question";
import { HomePageQuestionProps } from "@/app/home/types";
import { QuestionMode } from "@/global_types/types";

export default function MyQuestionsContent() {
    const { username } = useAuth();
    const [questions, setQuestions] = useState<HomePageQuestionProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        fetchData(
            `${CLIENT_API_URL}/questions_by_user?username=${encodeURIComponent(username)}`
        )
            .then((data: HomePageQuestionProps[]) => {
                setQuestions(Array.isArray(data) ? data : []);
            })
            .catch(() => setQuestions([]))
            .finally(() => setLoading(false));
    }, [username]);

    if (!username) {
        return <p className="text-gray-text">No questions yet.</p>;
    }
    if (loading) {
        return <p className="text-gray-text">Loading…</p>;
    }
    if (questions.length === 0) {
        return <p className="text-gray-text">No questions yet.</p>;
    }
    return (
        <div>
            {questions.map((q, index) => (
                <Question
                    key={q.id}
                    question={{
                        ...q,
                        tags: q.tags ?? [],
                    }}
                    mode={QuestionMode.HOME_PAGE}
                    showTopBorder={index > 0}
                />
            ))}
        </div>
    );
}
