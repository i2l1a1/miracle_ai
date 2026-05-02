"use client";

import {useAuth} from "@/context/AuthContext";
import {useCallback, useEffect, useRef, useState} from "react";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {fetchMyAnswers, type MyAnswersPageResponse} from "@/lib/dataService";
import {LIST_PAGE_SIZE} from "@/lib/listPageConstants";
import {useListPageInUrl} from "@/lib/useListPageInUrl";
import ActivityAnswerCard from "@/components/activity/ActivityAnswerCard";
import Pagination from "@/components/pagination/pagination";

export default function MyAnswersContent() {
  const {userId} = useAuth();
  const {page, replacePageInUrl} = useListPageInUrl();
  const [payload, setPayload] = useState<MyAnswersPageResponse | null>(null);
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
      const data = await fetchMyAnswers(CLIENT_API_URL, page, LIST_PAGE_SIZE);
      if (!data.is_ok) throw new Error("Failed to load answers");
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

  if (!userId) {
    return <p className="text-gray-text">Пусто.</p>;
  }

  const answers = payload?.answers ?? [];
  const totalPages = payload?.total_pages ?? 0;

  return (
    <>
      {initialLoading && <p className="text-gray-text py-8">Загрузка...</p>}
      {!initialLoading && loadError && !payload && (
        <p className="text-gray-text py-8">{loadError}</p>
      )}
      {payload && !loadError && (
        <>
          {answers.length === 0 ? (
            <p className="text-gray-text py-8">Пусто.</p>
          ) : (
            <div
              className={
                refreshing
                  ? "opacity-60 pointer-events-none transition-opacity"
                  : ""
              }
            >
              {answers.map((item, index) => (
                <ActivityAnswerCard
                  key={item.id}
                  item={item}
                  showTopBorder={index > 0}
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
