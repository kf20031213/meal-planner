"use client";

import { useState } from "react";
import type { DishCategory } from "@/lib/types";
import { Bi } from "./Bi";

const inputClass =
  "min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export const categoryLabel = (c: DishCategory) =>
  c.en && c.zh ? `${c.en} / ${c.zh}` : c.en || c.zh;

export function CategoryName({ category }: { category: DishCategory }) {
  return (
    <Bi
      en={category.en || category.zh}
      zh={category.en ? category.zh || undefined : undefined}
    />
  );
}

// Small form to make a new category. Either the English or the Chinese name is enough.
export function NewCategoryForm({
  onCreate,
  onCancel,
}: {
  onCreate: (en: string, zh: string) => void;
  onCancel: () => void;
}) {
  const [en, setEn] = useState("");
  const [zh, setZh] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!en.trim() && !zh.trim()) return;
    onCreate(en.trim(), zh.trim());
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200"
    >
      <div className="flex gap-2">
        <input
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="English name"
          aria-label="English name of the new category"
          className={inputClass}
        />
        <input
          value={zh}
          onChange={(e) => setZh(e.target.value)}
          placeholder="中文名"
          aria-label="Chinese name of the new category"
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Bi en="Create" zh="创建" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-200"
        >
          <Bi en="Cancel" zh="取消" />
        </button>
      </div>
    </form>
  );
}

type Props = {
  categories: DishCategory[];
  value: string;
  onChange: (id: string) => void;
  onCreate: (en: string, zh: string) => string; // returns the new category's id
};

// A drop-down of categories, with a way to create a new one on the spot.
export default function CategoryPicker({
  categories,
  value,
  onChange,
  onCreate,
}: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Category"
          className={`${inputClass} bg-white`}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="whitespace-nowrap text-sm text-emerald-700 hover:underline"
          >
            + <Bi en="New category" zh="新分类" />
          </button>
        )}
      </div>
      {adding && (
        <NewCategoryForm
          onCreate={(en, zh) => {
            onChange(onCreate(en, zh));
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}
