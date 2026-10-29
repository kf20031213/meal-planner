"use client";

import { useState } from "react";
import type { DishCategory, SavedDish } from "@/lib/types";
import { Bi } from "./Bi";
import { CategoryName, NewCategoryForm } from "./CategoryPicker";
import DishName from "./DishName";

type Props = {
  open: boolean;
  onToggleOpen: () => void;
  categories: DishCategory[];
  library: SavedDish[];
  planIds: string[];
  selectedId: string | null;
  collapsed: string[]; // categories the user folded shut
  onToggleCollapsed: (categoryId: string) => void;
  onSelect: (dishId: string) => void;
  onMove: (dishId: string, categoryId: string) => void;
  onCreateCategory: (en: string, zh: string) => string;
  onDeleteCategory: (categoryId: string) => void;
};

// The recipe book on the left: dishes grouped by category. Folds shut, and dishes can be
// dragged from one category to another.
export default function Sidebar({
  open,
  onToggleOpen,
  categories,
  library,
  planIds,
  selectedId,
  collapsed,
  onToggleCollapsed,
  onSelect,
  onMove,
  onCreateCategory,
  onDeleteCategory,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={onToggleOpen}
        aria-label="Open the recipe book"
        title="Open the recipe book"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg ring-1 ring-stone-200 hover:bg-stone-100"
      >
        📖
      </button>
    );
  }

  const known = new Set(categories.map((c) => c.id));
  const orphans = library.filter((d) => !known.has(d.categoryId));

  function dishRow(d: SavedDish) {
    const inPlan = planIds.includes(d.id);
    return (
      <li
        key={d.id}
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
        onDragEnd={() => setDragOver(null)}
        className="cursor-grab active:cursor-grabbing"
      >
        <button
          onClick={() => onSelect(d.id)}
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
            d.id === selectedId
              ? "bg-emerald-100 font-medium text-emerald-900"
              : "text-stone-700 hover:bg-stone-100"
          }`}
        >
          <span
            aria-hidden
            className={`h-2 w-2 shrink-0 rounded-full ${inPlan ? "bg-emerald-500" : "bg-stone-200"}`}
          />
          <span className="min-w-0 flex-1">
            <DishName dish={d} />
          </span>
        </button>
      </li>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">
          <Bi en="Recipe book" zh="菜谱本" />
        </h2>
        <button
          onClick={onToggleOpen}
          aria-label="Fold the recipe book"
          title="Fold the recipe book"
          className="hidden rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-800 lg:block"
        >
          «
        </button>
      </div>

      {library.length === 0 && (
        <p className="mb-3 text-sm text-stone-500">
          <Bi
            en="Dishes you save will be listed here, grouped by category."
            zh="保存的菜会按分类列在这里。"
            block
          />
        </p>
      )}

      <div className="space-y-1">
        {categories.map((c) => {
          const dishes = library.filter((d) => d.categoryId === c.id);
          const isClosed = collapsed.includes(c.id);
          return (
            <div
              key={c.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(c.id);
              }}
              onDragLeave={() =>
                setDragOver((cur) => (cur === c.id ? null : cur))
              }
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) onMove(id, c.id);
                setDragOver(null);
              }}
              className={`rounded-xl transition ${
                dragOver === c.id ? "bg-emerald-50 ring-2 ring-emerald-300" : ""
              }`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => onToggleCollapsed(c.id)}
                  aria-expanded={!isClosed}
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-stone-700 hover:bg-stone-100"
                >
                  <span aria-hidden className="w-3 text-xs text-stone-400">
                    {isClosed ? "▸" : "▾"}
                  </span>
                  <span className="flex-1">
                    <CategoryName category={c} />
                  </span>
                  <span className="rounded-full bg-stone-100 px-2 text-xs font-normal text-stone-500">
                    {dishes.length}
                  </span>
                </button>
                {dishes.length === 0 && (
                  <button
                    onClick={() => onDeleteCategory(c.id)}
                    aria-label="Delete this empty category"
                    title="Delete this empty category"
                    className="px-2 text-xs text-stone-300 hover:text-red-700"
                  >
                    ✕
                  </button>
                )}
              </div>
              {!isClosed &&
                (dishes.length > 0 ? (
                  <ul className="mb-1 ml-3 border-l border-stone-100 pl-2">
                    {dishes.map(dishRow)}
                  </ul>
                ) : (
                  <p className="mb-1 ml-8 text-xs text-stone-300">
                    — <Bi en="drop dishes here" zh="把菜拖到这里" />
                  </p>
                ))}
            </div>
          );
        })}

        {orphans.length > 0 && (
          <div>
            <p className="px-2 py-1.5 text-sm font-semibold text-stone-700">
              <Bi en="No category" zh="未分类" />
            </p>
            <ul className="ml-3 border-l border-stone-100 pl-2">
              {orphans.map(dishRow)}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-stone-100 pt-3">
        {adding ? (
          <NewCategoryForm
            onCreate={(en, zh) => {
              onCreateCategory(en, zh);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-emerald-700 hover:underline"
          >
            + <Bi en="New category" zh="新分类" />
          </button>
        )}
      </div>
    </section>
  );
}
