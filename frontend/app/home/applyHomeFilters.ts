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

import {LIST_PAGE_SIZE} from "@/lib/listPageConstants";

export const defaultHomeFilter: HomeFilterValues = {
    onlyAiAnswered: false,
    sortBy: "newest",
    tags: [],
};

export const HOME_QUESTIONS_PAGE_SIZE = LIST_PAGE_SIZE;

export function parseTagsInput(raw: string): string[] {
    return raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
}
