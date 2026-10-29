import { dishTitle } from "./dishes";
import { normalizeName } from "./shopping";
import type { Ingredient, Post, Recipe, SavedDish } from "./types";

export type DishItem = {
  key: string; // normalized name
  ingredient: Ingredient;
  count: number; // in how many saved posts it appears
};

export type ResolvedDish = {
  dish: SavedDish;
  main: Post;
  required: DishItem[];
  optional: (DishItem & { picked: boolean })[];
  active: Ingredient[]; // required + ticked extras: what the shopping list uses
  recipe: Recipe;
};

// Works out, for one saved dish, what is required (in every post), what is optional
// (only in some posts) and what the user has ticked. Manual marks win over the rule.
export function resolveDish(dish: SavedDish): ResolvedDish {
  const main =
    dish.posts.find((p) => p.id === dish.mainPostId) ?? dish.posts[0];
  const ordered = [main, ...dish.posts.filter((p) => p !== main)];

  const found = new Map<string, DishItem>();
  for (const post of ordered) {
    const seen = new Set<string>();
    for (const ingredient of post.ingredients) {
      const key = normalizeName(ingredient.name);
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = found.get(key);
      if (entry) entry.count++;
      else found.set(key, { key, ingredient, count: 1 });
    }
  }

  const required: DishItem[] = [];
  const optional: ResolvedDish["optional"] = [];
  for (const item of found.values()) {
    const mark = dish.marks[item.key];
    const isRequired = mark
      ? mark === "required"
      : item.count === dish.posts.length;
    if (isRequired) required.push(item);
    else optional.push({ ...item, picked: dish.picked.includes(item.key) });
  }

  const active = [
    ...required.map((r) => r.ingredient),
    ...optional.filter((o) => o.picked).map((o) => o.ingredient),
  ];
  const utensils = [...new Set(ordered.flatMap((p) => p.utensils))];

  return {
    dish,
    main,
    required,
    optional,
    active,
    recipe: {
      dish: dishTitle(dish),
      servings: main.servings,
      ingredients: active,
      steps: main.steps,
      utensils,
    },
  };
}
