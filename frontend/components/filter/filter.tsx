"use client";

import Image from "next/image";
import {useState} from "react";
import SmallArrow from "@/public/icons/small-arrow.svg";
import SingleLineInputField from "@/components/input/single-line-input-field";
import {HomeSortOption} from "@/app/home/applyHomeFilters";
import {FilterProps} from "@/components/filter/types";
import {pluralRu} from "@/lib/pluralize";

const SORT_OPTIONS: {value: HomeSortOption; label: string}[] = [
  {value: "newest", label: "Сначала самые новые"},
  {value: "oldest", label: "Сначала самые старые"},
  {value: "most_answers", label: "По убыванию количества ответов"},
  {value: "fewest_answers", label: "По возрастанию количества ответов"},
];

export default function Filter({questionsCount, onApply}: FilterProps) {
  const [open, setOpen] = useState(false);
  const [onlyAiAnswered, setOnlyAiAnswered] = useState(false);
  const [sortBy, setSortBy] = useState<HomeSortOption>("newest");
  const [tagsRaw, setTagsRaw] = useState("");

  const handleApplyClick = () => {
    onApply({onlyAiAnswered, sortBy, tagsRaw});
  };

  return (
    <div className="flex flex-col border-b border-separator">
      <div
        className={`flex items-center justify-between pt-5 ${open ? "pb-0" : "pb-5"}`}
      >
        <p className="text-gray-text">
          {questionsCount} {pluralRu(questionsCount, "вопрос", "вопроса", "вопросов")}
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-gray-text hover:font-semibold">Фильтр</span>
          <Image
            src={SmallArrow}
            alt=""
            className={`mt-[2px] w-[5px] h-auto transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"}`}
          />
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-5 pb-5 mt-5">
          <div className="flex flex-col gap-3">
            <p className="font-bold text-bright-text">Фильтр</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAiAnswered}
                onChange={(e) => setOnlyAiAnswered(e.target.checked)}
                className="size-4 rounded border-input-stroke accent-accent cursor-pointer"
              />
              <span>Только с ответами от ИИ</span>
            </label>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-bold text-bright-text">Сортировка</p>
            <div className="flex flex-col gap-2">
              {SORT_OPTIONS.map(({value, label}) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="home-sort"
                    checked={sortBy === value}
                    onChange={() => setSortBy(value)}
                    className="accent-accent cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-bold text-bright-text">Теги</p>
            <SingleLineInputField
              name="filter-tags"
              placeholder="Теги (через запятую)"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApplyClick}
              className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text text-button-text"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
