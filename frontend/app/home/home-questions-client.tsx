"use client";

import {useMemo, useState} from "react";
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

const defaultFilter: HomeFilterValues = {
    onlyAiAnswered: false,
    sortBy: "date",
    tags: [],
};

export default function HomeQuestionsClient({
    questions,
}: {
    questions: HomePageQuestionProps[];
}) {
    const [appliedFilter, setAppliedFilter] = useState<HomeFilterValues>(defaultFilter);

    const displayed = useMemo(
        () => applyHomeFilters(questions, appliedFilter),
        [questions, appliedFilter]
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
            <Filter questionsCount={questions.length} onApply={handleApply}/>
            {displayed.length === 0 ? (
                <p className="text-gray-text py-8">No questions match the filter.</p>
            ) : (
                displayed.map((question, index) => (
                    <Question
                        key={question.id}
                        question={question}
                        mode={QuestionMode.HOME_PAGE}
                        showTopBorder={index > 0}
                    />
                ))
            )}
        </>
    );
}
