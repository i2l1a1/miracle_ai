"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import Filter from "@/components/filter/filter";
import Question from "@/components/questions/Question";
import Pagination from "@/components/pagination/pagination";
import {
  defaultHomeFilter,
  HOME_QUESTIONS_PAGE_SIZE,
  HomeFilterValues,
  parseTagsInput,
} from "@/app/home/applyHomeFilters";
import {QuestionMode} from "@/global_types/types";
import {useAuth} from "@/context/AuthContext";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {fetchHomeQuestions, type HomeQuestionsPageResponse} from "@/lib/dataService";
import {useListPageInUrl} from "@/lib/useListPageInUrl";

export default function HomeQuestionsClient() {
  const {userId} = useAuth();
  const {page, replacePageInUrl} = useListPageInUrl();
  const [appliedFilter, setAppliedFilter] = useState<HomeFilterValues>(defaultHomeFilter);
  const [payload, setPayload] = useState<HomeQuestionsPageResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const everLoadedRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    const firstLoad = !everLoadedRef.current;
    if (!silent) {
      if (firstLoad) setInitialLoading(true);
      else setRefreshing(true);
    }
    setLoadError(null);
    try {
      const data = await fetchHomeQuestions(CLIENT_API_URL, {
        page,
        pageSize: HOME_QUESTIONS_PAGE_SIZE,
        filter: appliedFilter,
      });
      if (!data.is_ok) throw new Error("Failed to load questions");
      setPayload(data);
      everLoadedRef.current = true;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
      if (firstLoad) setPayload(null);
    } finally {
      if (!silent) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [page, appliedFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasAiGenerating = (payload?.questions ?? []).some((q) => q.ai_generating);

  useEffect(() => {
    if (!hasAiGenerating) return;
    const id = setInterval(() => {
      void load(true);
    }, 2000);
    return () => clearInterval(id);
  }, [hasAiGenerating, load]);

  useEffect(() => {
    if (!payload) return;
    const max = payload.total_pages;
    if (max <= 0) {
      if (page > 1) replacePageInUrl(1);
      return;
    }
    if (page > max) {
      replacePageInUrl(max);
    }
  }, [payload, page, replacePageInUrl]);

  const handleApply = (form: {
    onlyAiAnswered: boolean;
    sortBy: HomeFilterValues["sortBy"];
    tagsRaw: string;
  }) => {
    replacePageInUrl(1);
    setAppliedFilter({
      onlyAiAnswered: form.onlyAiAnswered,
      sortBy: form.sortBy,
      tags: parseTagsInput(form.tagsRaw),
    });
  };

  const handleQuestionDeleted = () => {
    const len = payload?.questions.length ?? 0;
    if (len <= 1 && page > 1) {
      replacePageInUrl(Math.max(1, page - 1));
      return;
    }
    void load();
  };

  const questions = payload?.questions ?? [];
  const total = payload?.total ?? 0;
  const totalPages = payload?.total_pages ?? 0;

  return (
    <>
      <Filter questionsCount={total} onApply={handleApply}/>
      {initialLoading && <p className="text-gray-text py-8">Загрузка...</p>}
      {!initialLoading && loadError && !payload && (
        <p className="text-gray-text py-8">{loadError}</p>
      )}
      {payload && !loadError && (
        <>
          {questions.length === 0 ? (
            <p className="text-gray-text py-8">No questions match the filter.</p>
          ) : (
            <div
              className={
                refreshing
                  ? "opacity-60 pointer-events-none transition-opacity"
                  : ""
              }
            >
              {questions.map((question, index) => (
                <Question
                  key={question.id}
                  question={question}
                  mode={QuestionMode.HOME_PAGE}
                  showTopBorder={index > 0}
                  showOwnerMenu={userId != null && question.user_id === userId}
                  onQuestionDeleted={handleQuestionDeleted}
                />
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={replacePageInUrl}
            disabled={refreshing}
            className="flex flex-col items-center gap-4 border-t border-separator py-6"
          />
        </>
      )}
      {payload && loadError && (
        <p className="text-gray-text py-4 text-sm">{loadError}</p>
      )}
    </>
  );
}
