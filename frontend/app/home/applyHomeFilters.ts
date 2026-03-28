import {HomePageQuestionProps} from "@/app/home/types";

export type HomeSortOption =
    | "newest"
    | "oldest"
    | "most_answers"
    | "fewest_answers";

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
        const ta = new Date(a.date_added).getTime();
        const tb = new Date(b.date_added).getTime();
        switch (filter.sortBy) {
            case "newest":
                return tb - ta;
            case "oldest":
                return ta - tb;
            case "most_answers":
                return b.answers_count - a.answers_count;
            case "fewest_answers":
                return a.answers_count - b.answers_count;
            default:
                return 0;
        }
    });

    return list;
}
