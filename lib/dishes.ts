import { ZH_TO_EN, hasChinese } from "./ingredients";
import { normalizeName } from "./shopping";
import type { DishCategory, Ingredient, SavedDish } from "./types";

// ---------- names ----------
export const dishTitle = (d: SavedDish) => d.names.en || d.names.zh;

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, "");

// "braised pork ribs" matches a saved "Braised Pork Ribs"; "排骨" matches "红烧排骨".
export function namesMatch(saved: string, query: string): boolean {
  const a = squash(saved);
  const b = squash(query);
  if (!a || !b) return false;
  return (
    a === b ||
    (Math.min(a.length, b.length) >= 2 && (a.includes(b) || b.includes(a)))
  );
}

// True if the search words match the Chinese or the English name of the dish.
export function matchesQuery(dish: SavedDish, query: string): boolean {
  const guess = hasChinese(query) ? guessEnglishDishName(query) : "";
  return (
    namesMatch(dish.names.zh, query) ||
    namesMatch(dish.names.en, query) ||
    (guess !== "" && namesMatch(dish.names.en, guess))
  );
}

// ---------- Chinese dish name -> English guess ----------
const WHOLE: Record<string, string> = {
  番茄炒蛋: "Tomato Scrambled Eggs",
  西红柿炒蛋: "Tomato Scrambled Eggs",
  番茄炒鸡蛋: "Tomato Scrambled Eggs",
  西红柿炒鸡蛋: "Tomato Scrambled Eggs",
  宫保鸡丁: "Kung Pao Chicken",
  麻婆豆腐: "Mapo Tofu",
  鱼香肉丝: "Yuxiang Shredded Pork",
  红烧肉: "Red-braised Pork Belly",
  回锅肉: "Twice-cooked Pork",
  糖醋排骨: "Sweet and Sour Pork Ribs",
  可乐鸡翅: "Cola Chicken Wings",
  水煮牛肉: "Sichuan Boiled Beef",
  酸辣土豆丝: "Hot and Sour Shredded Potato",
};

type Piece = { zh: string; en: string; kind: "method" | "after" | "item" };
const METHODS: Piece[] = [
  ["红烧", "Braised"],
  ["糖醋", "Sweet and Sour"],
  ["清蒸", "Steamed"],
  ["清炒", "Stir-fried"],
  ["蒜蓉", "Garlic"],
  ["水煮", "Poached"],
  ["凉拌", "Cold"],
  ["麻辣", "Spicy"],
  ["干锅", "Dry-pot"],
  ["黄焖", "Braised"],
  ["蒸", "Steamed"],
  ["炒", "Stir-fried"],
  ["炖", "Stewed"],
  ["煲", "Simmered"],
  ["烤", "Roasted"],
  ["煎", "Pan-fried"],
  ["炸", "Deep-fried"],
  ["焖", "Braised"],
  ["卤", "Marinated"],
].map(([zh, en]) => ({ zh, en, kind: "method" as const }));
const AFTER: Piece[] = [
  ["丝", "Shredded"],
  ["丁", "Diced"],
  ["片", "Sliced"],
  ["块", "Chunks"],
  ["汤", "Soup"],
].map(([zh, en]) => ({ zh, en, kind: "after" as const }));
const ITEMS: Piece[] = Object.entries(ZH_TO_EN).map(([zh, en]) => ({
  zh,
  en: en.replace(/\b\w/g, (c) => c.toUpperCase()),
  kind: "item" as const,
}));
const PIECES = [...METHODS, ...AFTER, ...ITEMS].sort(
  (a, b) => b.zh.length - a.zh.length,
);

// Returns "" when some part isn't known, so the user types it instead of getting nonsense.
export function guessEnglishDishName(zh: string): string {
  const name = zh.trim();
  if (WHOLE[name]) return WHOLE[name];
  const parts: Piece[] = [];
  for (let i = 0; i < name.length;) {
    const piece = PIECES.find((p) => name.startsWith(p.zh, i));
    if (!piece) return "";
    parts.push(piece);
    i += piece.zh.length;
  }
  if (parts.length === 0) return "";

  // "Shredded" / "Diced" come before the food in English: 土豆丝 -> Shredded Potato.
  const words: string[] = [];
  let lastItem = -1;
  for (const p of parts) {
    if (p.kind === "after" && p.en !== "Soup" && lastItem >= 0)
      words.splice(lastItem, 0, p.en);
    else words.push(p.en);
    if (p.kind === "item") lastItem = words.length - 1;
  }
  return words
    .join(" ")
    .replace(/\b(Rib|Wing|Egg)\b(?!s)/g, "$1s")
    .trim();
}

// ---------- categories ----------
export const DEFAULT_CATEGORIES: DishCategory[] = [
  { id: "pork", en: "Pork", zh: "猪肉" },
  { id: "beef", en: "Beef", zh: "牛肉" },
  { id: "lamb", en: "Lamb", zh: "羊肉" },
  { id: "poultry", en: "Chicken & duck", zh: "鸡鸭" },
  { id: "seafood", en: "Seafood", zh: "海鲜" },
  { id: "vegetarian", en: "Vegetarian", zh: "素菜" },
  { id: "soup", en: "Soups", zh: "汤" },
  { id: "staple", en: "Rice & noodles", zh: "主食" },
  { id: "other", en: "Other", zh: "其他" },
];

const NAME_RULES: [string, RegExp][] = [
  ["soup", /汤|soup/],
  ["staple", /饭|面|粉|饺|包子|饼|rice|noodle|dumpling/],
  ["pork", /猪|排骨|五花|pork|rib/],
  ["beef", /牛|beef/],
  ["lamb", /羊|lamb|mutton/],
  ["poultry", /鸡|鸭|鹅|chicken|duck/],
  ["seafood", /鱼|虾|蟹|贝|鱿|海鲜|fish|shrimp|crab|squid/],
];
const INGREDIENT_RULES: [string, string[]][] = [
  ["pork", ["pork", "pork rib", "pork belly"]],
  ["beef", ["beef"]],
  ["lamb", ["lamb"]],
  ["poultry", ["chicken", "chicken breast", "chicken wing", "duck"]],
  ["seafood", ["fish", "shrimp"]],
];

// Suggests a category from the dish name, then from what's in it. The user can change it.
export function guessCategoryId(
  names: { zh: string; en: string },
  ingredients: Ingredient[],
): string {
  const text = `${names.zh} ${names.en}`.toLowerCase().replace(/鸡蛋/g, "");
  const byName = NAME_RULES.find(([, re]) => re.test(text));
  if (byName) return byName[0];
  const have = new Set(ingredients.map((i) => normalizeName(i.name)));
  const byIngredient = INGREDIENT_RULES.find(([, list]) =>
    list.some((n) => have.has(n)),
  );
  if (byIngredient) return byIngredient[0];
  return have.size > 0 ? "vegetarian" : "other";
}

// Dishes saved by an earlier version of the app only had a single "name".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateDish(d: any): SavedDish {
  const names =
    d.names ??
    (hasChinese(d.name ?? "")
      ? { zh: d.name, en: "" }
      : { zh: "", en: d.name ?? "" });
  const draft = { ...d, names } as SavedDish;
  const categoryId =
    d.categoryId ??
    guessCategoryId(names, (d.posts?.[0]?.ingredients ?? []) as Ingredient[]);
  return { ...draft, categoryId };
}
