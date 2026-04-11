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

export const defaultHomeFilter: HomeFilterValues = {
    onlyAiAnswered: false,
    sortBy: "newest",
    tags: [],
};

export const HOME_QUESTIONS_PAGE_SIZE = 10;

export function parseTagsInput(raw: string): string[] {
    return raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
}
