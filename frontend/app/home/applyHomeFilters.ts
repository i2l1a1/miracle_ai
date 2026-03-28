import {HomePageQuestionProps} from "@/app/home/types";

export type HomeSortOption = "date" | "answers_count";

export type HomeFilterValues = {
    onlyAiAnswered: boolean;
    sortBy: HomeSortOption;
    tags: string[];
};

export function parseTagsInput(raw: string): string[] {
    return raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
}

export function applyHomeFilters(
    questions: HomePageQuestionProps[],
    filter: HomeFilterValues
): HomePageQuestionProps[] {
    let list = [...questions];

    if (filter.onlyAiAnswered) {
        list = list.filter((q) => q.answers_count === 0);
    }

    if (filter.tags.length > 0) {
        list = list.filter((q) => {
            const qTags = (q.tags ?? []).map((t) => String(t).toLowerCase());
            return filter.tags.every((term) => qTags.some((qt) => qt === term));
        });
    }

    list.sort((a, b) => {
        if (filter.sortBy === "date") {
            return (
                new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
            );
        }
        return b.answers_count - a.answers_count;
    });

    return list;
}
