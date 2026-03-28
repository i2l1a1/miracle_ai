import {HomeSortOption} from "@/app/home/applyHomeFilters";

export type FilterProps = {
  questionsCount: number;
  onApply: (form: {
    onlyAiAnswered: boolean;
    sortBy: HomeSortOption;
    tagsRaw: string;
  }) => void;
};