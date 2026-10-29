import type { ReactNode } from "react";
import type { DishCategory, FridgeItem, Ingredient, Post } from "@/lib/types";
import type { ResolvedDish } from "@/lib/library";
import { formatAmount, normalizeName } from "@/lib/shopping";
import { RELATED } from "@/lib/ingredients";
import { xhsSearchUrl } from "@/lib/xhs";
import { ZH_UTENSILS, zhIngredient } from "@/lib/zh";
import { Bi } from "./Bi";
import CategoryPicker from "./CategoryPicker";
import DishName from "./DishName";
import PostsSection from "./PostsSection";

type Row = { key: string; ing: Ingredient; extra: boolean };

type BoxProps = {
  title: ReactNode;
  tag: ReactNode;
  rows: Row[];
  similar: Record<string, FridgeItem>;
  empty: ReactNode;
  tone: "amber" | "emerald";
  onMakeOptional: (key: string) => void;
};

const TONES = {
  amber: {
    box: "bg-amber-50 ring-amber-200",
    title: "text-amber-800",
    tag: "bg-amber-200 text-amber-900",
  },
  emerald: {
    box: "bg-emerald-50 ring-emerald-200",
    title: "text-emerald-800",
    tag: "bg-emerald-200 text-emerald-900",
  },
};

function IngredientBox({
  title,
  tag,
  rows,
  similar,
  empty,
  tone,
  onMakeOptional,
}: BoxProps) {
  const t = TONES[tone];
  return (
    <section className={`rounded-xl p-4 ring-1 ${t.box}`}>
      <h3
        className={`mb-2 text-sm font-semibold uppercase tracking-wide ${t.title}`}
      >
        {title} <span className="font-normal opacity-70">({rows.length})</span>
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {rows.map(({ key, ing, extra }) => (
            <li key={key} className="flex items-center gap-3 py-2">
              <span className="flex-1 capitalize text-stone-800">
                <Bi en={ing.name} zh={zhIngredient(ing.name)} />
                {extra && (
                  <span className="ml-2 rounded-full bg-white/70 px-2 py-0.5 text-xs font-normal normal-case text-stone-500">
                    extra
                  </span>
                )}
                {similar[key] && (
                  <span className="mt-0.5 block text-xs font-normal normal-case text-emerald-700">
                    <Bi
                      en={`You have: ${similar[key].name} (similar)`}
                      zh={`你有：${zhIngredient(similar[key].name) ?? similar[key].name}（相近）`}
                    />
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-sm text-stone-500">
                {formatAmount(ing.quantity, ing.unit)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.tag}`}
              >
                {tag}
              </span>
              {!extra && (
                <button
                  onClick={() => onMakeOptional(key)}
                  title="Move to optional extras"
                  className="text-xs text-stone-400 underline hover:text-stone-700"
                >
                  make optional
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Props = {
  resolved: ResolvedDish;
  stock: FridgeItem[];
  categories: DishCategory[];
  onChangeCategory: (id: string) => void;
  onCreateCategory: (en: string, zh: string) => string;
  onAddPost: (post: Post) => void;
  onSetMain: (id: string) => void;
  onRemovePost: (id: string) => void;
  onPick: (key: string) => void;
  onMark: (key: string, kind: "required" | "optional") => void;
  onDelete: () => void;
};

export default function RecipeCard({
  resolved,
  stock,
  categories,
  onChangeCategory,
  onCreateCategory,
  onAddPost,
  onSetMain,
  onRemovePost,
  onPick,
  onMark,
  onDelete,
}: Props) {
  const { dish, main, required, optional, recipe } = resolved;
  const fridgeNames = new Set(stock.map((f) => normalizeName(f.name)));

  // Everything that is wanted: required items plus the extras the user ticked.
  const wanted: Row[] = [
    ...required.map((r) => ({ key: r.key, ing: r.ingredient, extra: false })),
    ...optional
      .filter((o) => o.picked)
      .map((o) => ({ key: o.key, ing: o.ingredient, extra: true })),
  ];
  const have = wanted.filter((r) => fridgeNames.has(r.key));
  const toBuy = wanted.filter((r) => !fridgeNames.has(r.key));

  // Items to buy where the fridge has something close, e.g. "pork" for "pork rib".
  const similar: Record<string, FridgeItem> = {};
  for (const r of toBuy) {
    const parent = RELATED[r.key];
    const match = stock.find((f) => normalizeName(f.name) === parent);
    if (match) similar[r.key] = match;
  }

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-7">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">
          <DishName dish={dish} block />
        </h2>
        <p className="mt-1 text-stone-500">
          <Bi en={`Serves ${main.servings}`} zh={`${main.servings}人份`} />
        </p>
        <a
          href={xhsSearchUrl(dish.names.zh || dish.names.en)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
        >
          <Bi en="Search on Xiaohongshu" zh="在小红书搜索" /> ↗
        </a>
        <div className="mt-4 max-w-md">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
            <Bi en="Category" zh="分类" />
          </p>
          <CategoryPicker
            categories={categories}
            value={dish.categoryId}
            onChange={onChangeCategory}
            onCreate={onCreateCategory}
          />
        </div>
        <PostsSection
          posts={dish.posts}
          mainId={main.id}
          onSetMain={onSetMain}
          onRemove={onRemovePost}
          onAdd={onAddPost}
        />
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <IngredientBox
            title={<Bi en="Need to buy" zh="需要购入" />}
            tag="Buy"
            rows={toBuy}
            similar={similar}
            empty={
              <Bi en="Nothing to buy, you have it all!" zh="全都有，不用买！" />
            }
            tone="amber"
            onMakeOptional={(key) => onMark(key, "optional")}
          />
          <IngredientBox
            title={<Bi en="In fridge" zh="冰箱里有" />}
            tag="In fridge"
            rows={have}
            similar={{}}
            empty={
              <Bi
                en="None of these are in your fridge."
                zh="冰箱里没有这些食材。"
              />
            }
            tone="emerald"
            onMakeOptional={(key) => onMark(key, "optional")}
          />

          {optional.length > 0 && (
            <section className="rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-600">
                <Bi en="Optional extras" zh="可选配菜" />{" "}
                <span className="font-normal opacity-70">
                  ({optional.length})
                </span>
              </h3>
              <p className="mb-2 mt-1 text-xs text-stone-500">
                <Bi
                  en="Tick what you want. Ticked items move up into the boxes above."
                  zh="勾选你想要的，勾上的会移到上面的框里。"
                />
              </p>
              <ul className="divide-y divide-black/5">
                {optional.map((o) => (
                  <li key={o.key} className="flex items-center gap-3 py-2">
                    <label className="flex flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={o.picked}
                        onChange={() => onPick(o.key)}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      <span className="capitalize text-stone-800">
                        <Bi
                          en={o.ingredient.name}
                          zh={zhIngredient(o.ingredient.name)}
                        />
                        <span className="mt-0.5 block text-xs font-normal normal-case text-stone-400">
                          <Bi
                            en={`in ${o.count} of ${dish.posts.length} posts`}
                            zh={`出现在${dish.posts.length}篇中的${o.count}篇`}
                          />
                          {fridgeNames.has(o.key) && (
                            <span className="ml-2 text-emerald-700">
                              in fridge
                            </span>
                          )}
                        </span>
                      </span>
                    </label>
                    <span className="whitespace-nowrap text-sm text-stone-500">
                      {formatAmount(o.ingredient.quantity, o.ingredient.unit)}
                    </span>
                    <button
                      onClick={() => onMark(o.key, "required")}
                      className="text-xs text-stone-400 underline hover:text-stone-700"
                    >
                      make required
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            <Bi en="Steps" zh="步骤" />
          </h3>
          {main.steps.length === 0 ? (
            <p className="text-sm text-stone-500">
              <Bi
                en="No steps were saved for this post."
                zh="这篇帖子没有保存步骤。"
              />
            </p>
          ) : (
            <ol className="space-y-3">
              {main.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                    {i + 1}
                  </span>
                  <span className="text-stone-700">{step}</span>
                </li>
              ))}
            </ol>
          )}

          {recipe.utensils.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                <Bi en="Utensils" zh="厨具" />
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.utensils.map((u) => (
                  <span
                    key={u}
                    className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                  >
                    <Bi en={u} zh={ZH_UTENSILS[u]} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="mt-8 border-t border-stone-100 pt-4">
        <button
          onClick={() => {
            if (
              window.confirm(
                `Delete the saved dish "${dish.names.en || dish.names.zh}" and all its posts?`,
              )
            )
              onDelete();
          }}
          className="text-xs text-stone-400 underline hover:text-red-700"
        >
          <Bi en="Delete this saved dish" zh="删除这道已保存的菜" />
        </button>
      </footer>
    </article>
  );
}
