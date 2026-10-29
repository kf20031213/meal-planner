"use client";

import { useEffect, useMemo, useState } from "react";
import { LangProvider, Bi } from "@/components/Bi";
import CategoryPicker from "@/components/CategoryPicker";
import DishName from "@/components/DishName";
import FridgePanel from "@/components/FridgePanel";
import PostForm from "@/components/PostForm";
import RecipeCard from "@/components/RecipeCard";
import ShoppingListPanel from "@/components/ShoppingListPanel";
import Sidebar from "@/components/Sidebar";
import {
  DEFAULT_CATEGORIES,
  dishTitle,
  guessCategoryId,
  guessEnglishDishName,
  matchesQuery,
  migrateDish,
} from "@/lib/dishes";
import { RELATED, chineseToEnglish, hasChinese } from "@/lib/ingredients";
import { resolveDish } from "@/lib/library";
import { buildShoppingList, normalizeName } from "@/lib/shopping";
import type {
  DishCategory,
  FridgeItem,
  FridgeZone,
  Post,
  SavedDish,
} from "@/lib/types";
import { xhsSearchUrl } from "@/lib/xhs";

const START_FRIDGE: FridgeItem[] = [
  { id: "f1", name: "ginger", zone: "chilled", inStock: true },
  { id: "f2", name: "eggs", zone: "chilled", inStock: true },
  { id: "f3", name: "cooking oil", zone: "seasonings", inStock: true },
];

// Everything is kept in this browser until Google Sheets is connected (Phase 3).
const STORAGE_KEY = "meal-planner-v1";

// A searched dish that isn't saved yet: the names and category to save it under.
type Draft = {
  zh: string;
  en: string;
  categoryId: string;
  categoryTouched: boolean;
};

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function Home() {
  const [library, setLibrary] = useState<SavedDish[]>([]); // every dish saved so far
  const [categories, setCategories] =
    useState<DishCategory[]>(DEFAULT_CATEGORIES);
  const [collapsed, setCollapsed] = useState<string[]>([]); // categories folded shut
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [plan, setPlan] = useState<string[]>([]); // ids of the dishes cooked this week
  const [selected, setSelected] = useState<string | null>(null);
  const [fridge, setFridge] = useState<FridgeItem[]>(START_FRIDGE);
  const [bought, setBought] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showZh, setShowZh] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load what was saved last time. This reads browser storage once at startup, which is
  // exactly what an effect is for, so the "set state in effect" warning is switched off here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.categories) && data.categories.length > 0)
          setCategories(data.categories);
        if (Array.isArray(data.library))
          setLibrary(data.library.map(migrateDish));
        if (Array.isArray(data.collapsed)) setCollapsed(data.collapsed);
        if (typeof data.sidebarOpen === "boolean")
          setSidebarOpen(data.sidebarOpen);
        if (Array.isArray(data.plan)) setPlan(data.plan);
        if (typeof data.selected === "string") setSelected(data.selected);
        if (Array.isArray(data.fridge)) setFridge(data.fridge);
        if (Array.isArray(data.bought)) setBought(new Set(data.bought));
      }
    } catch {
      // Unreadable saved data: start fresh.
    }
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save after every change (but not before the load above has finished).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          library,
          categories,
          collapsed,
          sidebarOpen,
          plan,
          selected,
          fridge,
          bought: [...bought],
        }),
      );
    } catch {
      // Storage full or blocked: the app still works, it just won't remember.
    }
  }, [
    loaded,
    library,
    categories,
    collapsed,
    sidebarOpen,
    plan,
    selected,
    fridge,
    bought,
  ]);

  const resolvedById = useMemo(
    () => new Map(library.map((d) => [d.id, resolveDish(d)])),
    [library],
  );
  const planned = plan.flatMap((id) => resolvedById.get(id) ?? []);
  const current = selected ? (resolvedById.get(selected) ?? null) : null;

  // Only items that are still in stock count as "I have it".
  const inStock = useMemo(() => fridge.filter((f) => f.inStock), [fridge]);
  const shoppingLines = useMemo(
    () =>
      buildShoppingList(
        planned.map((p) => p.recipe),
        inStock,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [library, plan, inStock],
  );
  const highlighted = useMemo(
    () =>
      current
        ? new Set(
            current.active.flatMap((i) => {
              const n = normalizeName(i.name);
              return RELATED[n] ? [n, RELATED[n]] : [n];
            }),
          )
        : null,
    [current],
  );

  function updateDish(id: string, change: (d: SavedDish) => SavedDish) {
    setLibrary((prev) => prev.map((d) => (d.id === id ? change(d) : d)));
  }

  function addToPlan(id: string) {
    setPlan((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSelected(id);
    setDraft(null);
  }

  function removeFromPlan(id: string) {
    const rest = plan.filter((p) => p !== id);
    setPlan(rest);
    if (selected === id)
      setSelected(rest.length ? rest[rest.length - 1] : null);
  }

  function deleteDish(id: string) {
    setLibrary((prev) => prev.filter((d) => d.id !== id));
    removeFromPlan(id);
  }

  function createCategory(en: string, zh: string): string {
    const id = crypto.randomUUID();
    setCategories((prev) => [...prev, { id, en, zh }]);
    return id;
  }

  // Saved dish (Chinese or English name) -> show it. Not saved -> open Xiaohongshu so you
  // can find a post, and start a draft with the names and category to save it under.
  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const match = library.find((d) => matchesQuery(d, q));
    if (match) {
      addToPlan(match.id);
    } else {
      const zh = hasChinese(q) ? q : "";
      const en = hasChinese(q) ? guessEnglishDishName(q) : q;
      setSelected(null);
      setDraft({
        zh,
        en,
        categoryId: guessCategoryId({ zh, en }, []),
        categoryTouched: false,
      });
      window.open(xhsSearchUrl(q), "_blank", "noopener,noreferrer");
    }
    setQuery("");
  }

  function createDish(d: Draft, post: Post) {
    const names = { zh: d.zh.trim(), en: d.en.trim() };
    // Unless the user chose one, pick the category again now that we know the ingredients.
    const categoryId = d.categoryTouched
      ? d.categoryId
      : guessCategoryId(names, post.ingredients);
    const dish: SavedDish = {
      id: crypto.randomUUID(),
      names,
      categoryId,
      posts: [post],
      mainPostId: post.id,
      marks: {},
      picked: [],
    };
    setLibrary((prev) => [...prev, dish]);
    addToPlan(dish.id);
  }

  function toggleBought(key: string) {
    setBought((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function addFridgeItem(name: string, zone: FridgeZone) {
    // Known Chinese words are stored under their English name, so both languages show.
    const displayName = hasChinese(name)
      ? (chineseToEnglish(name) ?? name.trim())
      : name.toLowerCase();
    const key = normalizeName(name);
    setFridge((prev) =>
      prev.some((f) => normalizeName(f.name) === key)
        ? prev.map((f) =>
            normalizeName(f.name) === key ? { ...f, inStock: true } : f,
          )
        : [
            ...prev,
            { id: crypto.randomUUID(), name: displayName, zone, inStock: true },
          ],
    );
  }

  const draftReady =
    draft !== null && (draft.zh.trim() !== "" || draft.en.trim() !== "");

  return (
    <LangProvider value={showZh}>
      <div className="min-h-screen bg-stone-50">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-[96rem] items-center gap-2 px-4 py-4 sm:px-6">
            <span className="text-2xl">🍳</span>
            <h1 className="text-xl font-bold text-stone-900">
              <Bi en="Weekly Meal Planner" zh="每周餐食计划" />
            </h1>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={showZh}
                onChange={(e) => setShowZh(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              Show Chinese / 显示中文
            </label>
          </div>
        </header>

        <main
          className={`mx-auto grid max-w-[96rem] items-start gap-6 px-4 py-6 sm:px-6 ${
            sidebarOpen
              ? "lg:grid-cols-[260px_minmax(0,1fr)_380px]"
              : "lg:grid-cols-[2.5rem_minmax(0,1fr)_380px]"
          }`}
        >
          <div className="order-last lg:order-none">
            <Sidebar
              open={sidebarOpen}
              onToggleOpen={() => setSidebarOpen((o) => !o)}
              categories={categories}
              library={library}
              planIds={plan}
              selectedId={selected}
              collapsed={collapsed}
              onToggleCollapsed={(id) =>
                setCollapsed((prev) =>
                  prev.includes(id)
                    ? prev.filter((c) => c !== id)
                    : [...prev, id],
                )
              }
              onSelect={addToPlan}
              onMove={(dishId, categoryId) =>
                updateDish(dishId, (d) => ({ ...d, categoryId }))
              }
              onCreateCategory={createCategory}
              onDeleteCategory={(id) =>
                setCategories((prev) => prev.filter((c) => c.id !== id))
              }
            />
          </div>

          <div className="space-y-5">
            <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索菜名，例如“红烧排骨” / Search a dish"
                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                Search / 搜索
              </button>
            </form>

            {plan.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {planned.map(({ dish }) => (
                  <div
                    key={dish.id}
                    className={`flex items-center rounded-full text-sm font-medium transition ${
                      dish.id === selected
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setDraft(null);
                        setSelected(dish.id);
                      }}
                      className="py-2 pl-4 pr-2"
                    >
                      <DishName dish={dish} />
                    </button>
                    <button
                      onClick={() => removeFromPlan(dish.id)}
                      aria-label={`Remove ${dishTitle(dish)} from this week`}
                      className="mr-1 flex h-6 w-6 items-center justify-center rounded-full opacity-70 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {draft ? (
              <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-200 sm:p-7">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">
                    “{draft.zh || draft.en}”{" "}
                    <Bi en="isn't saved yet" zh="还没有保存" />
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    <Bi
                      en="We opened Xiaohongshu in a new tab. Sort by most liked, pick a post you like, copy its text and paste it below."
                      zh="已经在新标签页打开了小红书。按最热排序，挑一篇喜欢的帖子，复制文字，粘贴到下面。"
                    />
                  </p>
                  <a
                    href={xhsSearchUrl(draft.zh || draft.en)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                  >
                    <Bi
                      en="Open Xiaohongshu search again"
                      zh="再次打开小红书搜索"
                    />{" "}
                    ↗
                  </a>
                </div>

                <div className="space-y-3 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    <Bi en="Save it as" zh="保存为" />
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={draft.zh}
                      onChange={(e) =>
                        setDraft({ ...draft, zh: e.target.value })
                      }
                      placeholder="中文名，例如 红烧排骨"
                      aria-label="Chinese name"
                      className={inputClass}
                    />
                    <input
                      value={draft.en}
                      onChange={(e) =>
                        setDraft({ ...draft, en: e.target.value })
                      }
                      placeholder="English name, e.g. Braised Pork Ribs"
                      aria-label="English name"
                      className={inputClass}
                    />
                  </div>
                  {draft.zh && !draft.en && (
                    <p className="text-xs text-stone-500">
                      <Bi
                        en="I couldn't guess the English name. Type it so you can search in English too."
                        zh="没能猜出英文名，请自己填，这样用英文也能搜到。"
                      />
                    </p>
                  )}
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      <Bi en="Category" zh="分类" />
                    </p>
                    <CategoryPicker
                      categories={categories}
                      value={draft.categoryId}
                      onChange={(id) =>
                        setDraft({
                          ...draft,
                          categoryId: id,
                          categoryTouched: true,
                        })
                      }
                      onCreate={createCategory}
                    />
                  </div>
                </div>

                {draftReady ? (
                  <PostForm
                    onSave={(post) => createDish(draft, post)}
                    onCancel={() => setDraft(null)}
                  />
                ) : (
                  <p className="text-sm text-stone-500">
                    <Bi
                      en="Type a name above to continue."
                      zh="先在上面填一个菜名才能继续。"
                    />
                  </p>
                )}
              </section>
            ) : current ? (
              <RecipeCard
                resolved={current}
                stock={inStock}
                categories={categories}
                onChangeCategory={(categoryId) =>
                  updateDish(current.dish.id, (d) => ({ ...d, categoryId }))
                }
                onCreateCategory={createCategory}
                onAddPost={(post) =>
                  updateDish(current.dish.id, (d) => ({
                    ...d,
                    posts: [...d.posts, post],
                  }))
                }
                onSetMain={(id) =>
                  updateDish(current.dish.id, (d) => ({ ...d, mainPostId: id }))
                }
                onRemovePost={(id) =>
                  updateDish(current.dish.id, (d) => {
                    const posts = d.posts.filter((p) => p.id !== id);
                    return {
                      ...d,
                      posts,
                      mainPostId:
                        d.mainPostId === id ? posts[0].id : d.mainPostId,
                    };
                  })
                }
                onPick={(key) =>
                  updateDish(current.dish.id, (d) => ({
                    ...d,
                    picked: d.picked.includes(key)
                      ? d.picked.filter((k) => k !== key)
                      : [...d.picked, key],
                  }))
                }
                onMark={(key, kind) =>
                  updateDish(current.dish.id, (d) => ({
                    ...d,
                    marks: { ...d.marks, [key]: kind },
                    picked: d.picked.filter((k) => k !== key),
                  }))
                }
                onDelete={() => deleteDish(current.dish.id)}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-stone-300 p-10 text-center text-stone-500">
                <p className="text-lg font-medium text-stone-700">
                  <Bi en="What are we cooking this week?" zh="这周做什么菜？" />
                </p>
                <p className="mt-1 text-sm">
                  <Bi
                    en="Search a dish in Chinese or English. If you've saved it, the recipe shows up here. If not, we'll open Xiaohongshu so you can pick a post."
                    zh="用中文或英文搜索菜名。已保存的会直接显示菜谱；没保存的会打开小红书，让你挑一篇帖子。"
                    block
                  />
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <ShoppingListPanel
              lines={shoppingLines}
              bought={bought}
              highlighted={highlighted}
              onToggleBought={toggleBought}
            />
            <FridgePanel
              items={fridge}
              highlighted={highlighted}
              onAdd={addFridgeItem}
              onToggle={(id) =>
                setFridge((prev) =>
                  prev.map((f) =>
                    f.id === id ? { ...f, inStock: !f.inStock } : f,
                  ),
                )
              }
              onMove={(id, zone) =>
                setFridge((prev) =>
                  prev.map((f) => (f.id === id ? { ...f, zone } : f)),
                )
              }
              onClearUsedUp={() =>
                setFridge((prev) => prev.filter((f) => f.inStock))
              }
            />
          </aside>
        </main>
      </div>
    </LangProvider>
  );
}
