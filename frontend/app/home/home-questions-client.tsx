"use client";

import {useEffect, useMemo, useState} from "react";
import Filter from "@/components/filter/filter";
import Question from "@/components/questions/Question";
import {HomePageQuestionProps} from "@/app/home/types";
import {
    applyHomeFilters,
    HomeFilterValues,
    HomeSortOption,
    parseTagsInput,
} from "@/app/home/applyHomeFilters";
import {QuestionMode} from "@/global_types/types";
import {useAuth} from "@/context/AuthContext";

const defaultFilter: HomeFilterValues = {
    onlyAiAnswered: false,
    sortBy: "newest",
    tags: [],
};

export default function HomeQuestionsClient({
    questions,
}: {
    questions: HomePageQuestionProps[];
}) {
    const {userId} = useAuth();
    const [localQuestions, setLocalQuestions] = useState(questions);
    const [appliedFilter, setAppliedFilter] = useState<HomeFilterValues>(defaultFilter);

    useEffect(() => {
        setLocalQuestions(questions);
    }, [questions]);

    const displayed = useMemo(
        () => applyHomeFilters(localQuestions, appliedFilter),
        [localQuestions, appliedFilter]
    );

    const handleApply = (form: {
        onlyAiAnswered: boolean;
        sortBy: HomeSortOption;
        tagsRaw: string;
    }) => {
        setAppliedFilter({
            onlyAiAnswered: form.onlyAiAnswered,
            sortBy: form.sortBy,
            tags: parseTagsInput(form.tagsRaw),
        });
    };

    return (
        <>
            <Filter questionsCount={displayed.length} onApply={handleApply}/>
            {displayed.length === 0 ? (
                <p className="text-gray-text py-8">No questions match the filter.</p>
            ) : (
                displayed.map((question, index) => (
                    <Question
                        key={question.id}
                        question={question}
                        mode={QuestionMode.HOME_PAGE}
                        showTopBorder={index > 0}
                        showOwnerMenu={userId != null && question.user_id === userId}
                        onQuestionDeleted={() =>
                            setLocalQuestions((prev) => prev.filter((q) => q.id !== question.id))
                        }
                    />
                ))
            )}
        </>
    );
}
