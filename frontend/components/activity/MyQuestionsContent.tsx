"use client";

import {useAuth} from "@/context/AuthContext";
import {useCallback, useEffect, useRef, useState} from "react";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {fetchMyQuestions, type HomeQuestionsPageResponse} from "@/lib/dataService";
import {LIST_PAGE_SIZE} from "@/lib/listPageConstants";
import {useListPageInUrl} from "@/lib/useListPageInUrl";
import Question from "@/components/questions/Question";
import {HomePageQuestionProps} from "@/app/home/types";
import {QuestionMode} from "@/global_types/types";
import Pagination from "@/components/pagination/pagination";

export default function MyQuestionsContent() {
  const {userId} = useAuth();
  const {page, replacePageInUrl} = useListPageInUrl();
  const [payload, setPayload] = useState<HomeQuestionsPageResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const everLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const firstLoad = !everLoadedRef.current;
    if (firstLoad) setInitialLoading(true);
    else setRefreshing(true);
    setLoadError(null);
    try {
      const data = await fetchMyQuestions(CLIENT_API_URL, page, LIST_PAGE_SIZE);
      if (!data.is_ok) throw new Error("Failed to load questions");
      setPayload(data);
      everLoadedRef.current = true;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
      if (firstLoad) setPayload(null);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [userId, page]);

  useEffect(() => {
    if (!userId) {
      setPayload(null);
      setInitialLoading(false);
      setRefreshing(false);
      setLoadError(null);
      everLoadedRef.current = false;
      return;
    }
    void load();
  }, [userId, load]);

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

  const handleQuestionDeleted = () => {
    const len = payload?.questions.length ?? 0;
    if (len <= 1 && page > 1) {
      replacePageInUrl(Math.max(1, page - 1));
      return;
    }
    void load();
  };

  if (!userId) {
    return <p className="text-gray-text">No questions yet.</p>;
  }

  const questions: HomePageQuestionProps[] = payload?.questions ?? [];
  const totalPages = payload?.total_pages ?? 0;

  return (
    <>
      {initialLoading && <p className="text-gray-text py-8">Loading…</p>}
      {!initialLoading && loadError && !payload && (
        <p className="text-gray-text py-8">{loadError}</p>
      )}
      {payload && !loadError && (
        <>
          {questions.length === 0 ? (
            <p className="text-gray-text py-8">No questions yet.</p>
          ) : (
            <div
              className={
                refreshing
                  ? "opacity-60 pointer-events-none transition-opacity"
                  : ""
              }
            >
              {questions.map((q, index) => (
                <Question
                  key={q.id}
                  question={{
                    ...q,
                    tags: q.tags ?? [],
                  }}
                  mode={QuestionMode.HOME_PAGE}
                  showTopBorder={index > 0}
                  showOwnerMenu
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
