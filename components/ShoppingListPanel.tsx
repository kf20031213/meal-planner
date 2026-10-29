import { CATEGORIES, type ShoppingLine } from "@/lib/types";
import { formatAmount } from "@/lib/shopping";
import { Bi } from "./Bi";
import { ZH_CATEGORY, zhIngredient } from "@/lib/zh";

type Props = {
  lines: ShoppingLine[];
  bought: Set<string>;
  highlighted: Set<string> | null; // normalized names of the selected dish, or null
  onToggleBought: (key: string) => void;
};

export default function ShoppingListPanel({
  lines,
  bought,
  highlighted,
  onToggleBought,
}: Props) {
  const toBuy = lines.filter((l) => !l.inFridge);
  const remaining = toBuy.filter((l) => !bought.has(l.key)).length;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-stone-900">
          <Bi en="Shopping list" zh="购物清单" />
        </h2>
        {lines.length > 0 && (
          <span className="text-sm text-stone-500">
            <Bi en={`${remaining} left to buy`} zh={`还需购买${remaining}项`} />
          </span>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-stone-500">
          <Bi
            en="Add a dish and its ingredients will show up here, merged and totaled."
            zh="添加菜品后，食材会在这里合并汇总。"
            block
          />
        </p>
      ) : toBuy.length === 0 ? (
        <p className="text-sm text-stone-500">
          <Bi en="Nothing to buy, you have everything!" zh="全都有，不用买！" />
        </p>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const items = toBuy.filter((l) => l.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
                  <Bi en={cat} zh={ZH_CATEGORY[cat]} />
                </h3>
                <ul>
                  {items.map((l) => {
                    const isHi = highlighted?.has(l.normalizedName) ?? false;
                    const dim = highlighted !== null && !isHi;
                    const done = bought.has(l.key);
                    return (
                      <li
                        key={l.key}
                        className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition ${
                          isHi ? "bg-amber-100 ring-1 ring-amber-300" : ""
                        } ${dim ? "opacity-40" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-emerald-600"
                          checked={done}
                          onChange={() => onToggleBought(l.key)}
                          aria-label={`Mark ${l.name} as bought`}
                        />
                        <span
                          className={`flex-1 capitalize ${
                            done
                              ? "text-stone-400 line-through"
                              : "text-stone-800"
                          }`}
                        >
                          <Bi en={l.name} zh={zhIngredient(l.name)} />
                          {l.dishes.length > 1 && (
                            <span className="ml-1 text-xs normal-case text-stone-400 no-underline">
                              ×{l.dishes.length} dishes
                            </span>
                          )}
                        </span>
                        <span className="whitespace-nowrap text-sm text-stone-500">
                          {formatAmount(l.quantity, l.unit)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {lines.length > toBuy.length && (
        <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-400">
          <Bi
            en={`${lines.length - toBuy.length} already in your fridge, not listed`}
            zh={`${lines.length - toBuy.length}项冰箱里已有，未列出`}
          />
        </p>
      )}
    </section>
  );
}
