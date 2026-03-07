"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { CLIENT_API_URL } from "@/lib/apiConfig";
import { fetchData } from "@/lib/dataService";
import ActivityAnswerCard, {
    ActivityAnswerItem,
} from "@/components/activity/ActivityAnswerCard";

export default function MyAnswersContent() {
    const { userId } = useAuth();
    const [answers, setAnswers] = useState<ActivityAnswerItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setAnswers([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchData(`${CLIENT_API_URL}/my-answers`)
            .then((data: ActivityAnswerItem[]) => {
                setAnswers(Array.isArray(data) ? data : []);
            })
            .catch(() => setAnswers([]))
            .finally(() => setLoading(false));
    }, [userId]);

    if (!userId) {
        return <p className="text-gray-text">No answers yet.</p>;
    }
    if (loading) {
        return <p className="text-gray-text">Loading…</p>;
    }
    if (answers.length === 0) {
        return <p className="text-gray-text">No answers yet.</p>;
    }
    return (
        <div>
            {answers.map((item, index) => (
                <ActivityAnswerCard
                    key={item.id}
                    item={item}
                    showTopBorder={index > 0}
                />
            ))}
        </div>
    );
}
