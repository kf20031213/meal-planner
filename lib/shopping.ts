import { chineseToEnglish, hasChinese } from "./ingredients";
import type { FridgeItem, Recipe, ShoppingLine } from "./types";

const SYNONYMS: Record<string, string> = {
  scallion: "green onion",
  "spring onion": "green onion",
  "fresh ginger": "ginger",
  "light soy sauce": "soy sauce",
  "vegetable oil": "cooking oil",
  "canola oil": "cooking oil",
};

// Makes "Green Onions", "green onion" and "scallions" all become "green onion",
// so the same ingredient from different dishes is merged into one line.
export function normalizeName(raw: string): string {
  if (hasChinese(raw)) return chineseToEnglish(raw) ?? raw.trim();
  let name = raw
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (name.endsWith("ies")) name = name.slice(0, -3) + "y";
  else if (name.endsWith("oes")) name = name.slice(0, -2);
  else if (name.endsWith("s") && !name.endsWith("ss") && !name.endsWith("us"))
    name = name.slice(0, -1);
  return SYNONYMS[name] ?? name;
}

function normalizeUnit(quantity: number, unit: string) {
  const u = unit.toLowerCase().trim();
  if (u === "kg") return { quantity: quantity * 1000, unit: "g" };
  if (u === "l") return { quantity: quantity * 1000, unit: "ml" };
  if (u === "piece" || u === "pieces" || u === "pc")
    return { quantity, unit: "pcs" };
  return { quantity, unit: u };
}

export function formatAmount(quantity: number, unit: string): string {
  if (quantity <= 0) return "to taste";
  let q = quantity;
  let u = unit;
  if (u === "g" && q >= 1000) {
    q /= 1000;
    u = "kg";
  } else if (u === "ml" && q >= 1000) {
    q /= 1000;
    u = "L";
  }
  const rounded = Math.round(q * 10) / 10;
  return `${rounded} ${u}`;
}

export function buildShoppingList(
  recipes: Recipe[],
  fridge: FridgeItem[],
): ShoppingLine[] {
  const fridgeNames = new Set(fridge.map((f) => normalizeName(f.name)));
  const lines = new Map<string, ShoppingLine>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const normalizedName = normalizeName(ing.name);
      const { quantity, unit } = normalizeUnit(ing.quantity, ing.unit);
      const key = `${normalizedName}|${unit}`;
      const existing = lines.get(key);
      if (existing) {
        existing.quantity += quantity;
        if (!existing.dishes.includes(recipe.dish))
          existing.dishes.push(recipe.dish);
      } else {
        lines.set(key, {
          key,
          name: normalizedName,
          normalizedName,
          quantity,
          unit,
          category: ing.category,
          dishes: [recipe.dish],
          inFridge: fridgeNames.has(normalizedName),
        });
      }
    }
  }
  // A line with no amount ("to taste") is dropped when the same ingredient has a real amount.
  for (const [key, line] of lines) {
    if (line.quantity > 0) continue;
    const hasAmount = [...lines.values()].some(
      (l) => l.normalizedName === line.normalizedName && l.quantity > 0,
    );
    if (hasAmount) lines.delete(key);
  }
  return [...lines.values()].sort((a, b) => a.name.localeCompare(b.name));
}
