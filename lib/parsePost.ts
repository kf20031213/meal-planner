import { EN_TO_ZH, ZH_TO_EN } from "./ingredients";
import type { Category, Ingredient } from "./types";

export type ParsedPost = {
  fromSteps: boolean; // no ingredient list was found, so the ingredients were picked out of the steps
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  utensils: string[];
};

// ---------- headings ----------
const ING_WORDS =
  "(?:所需食材|所需材料|食材|材料|用料|配料|原料|主料|辅料|调料|佐料|准备)";
const ING_HEAD = new RegExp(`^${ING_WORDS}\\s*[:：]\\s*|^${ING_WORDS}\\s*$`);
const STEP_WORDS =
  "(?:做法步骤|详细步骤|制作步骤|制作方法|做法|步骤|方法|制作)";
const STEP_HEAD = new RegExp(`^${STEP_WORDS}\\s*[:：]\\s*|^${STEP_WORDS}\\s*$`);
const NUMBERING =
  /^(?:\d{1,2}\s*[.、．)）:：](?!\d)\s*|[①-⑳]\s*|步骤\s*\d+\s*[:：]?\s*|第[一二三四五六七八九十]+步\s*[:：]?\s*)/;

// ---------- amounts ----------
const UNIT_MAP: Record<string, [number, string]> = {
  克: [1, "g"],
  g: [1, "g"],
  千克: [1000, "g"],
  公斤: [1000, "g"],
  kg: [1000, "g"],
  斤: [500, "g"],
  两: [50, "g"],
  毫升: [1, "ml"],
  ml: [1, "ml"],
  升: [1000, "ml"],
  l: [1000, "ml"],
  汤匙: [15, "ml"],
  大勺: [15, "ml"],
  大匙: [15, "ml"],
  勺: [15, "ml"],
  匙: [15, "ml"],
  茶匙: [5, "ml"],
  小勺: [5, "ml"],
  小匙: [5, "ml"],
  个: [1, "pcs"],
  只: [1, "pcs"],
  颗: [1, "pcs"],
  块: [1, "pcs"],
  条: [1, "pcs"],
  根: [1, "pcs"],
  粒: [1, "pcs"],
  枚: [1, "pcs"],
  朵: [1, "pcs"],
  张: [1, "pcs"],
  段: [1, "pcs"],
  片: [1, "slices"],
  瓣: [1, "cloves"],
  把: [1, "bunch"],
  碗: [1, "bowl"],
  杯: [1, "cup"],
  袋: [1, "bag"],
  包: [1, "pack"],
  盒: [1, "box"],
  罐: [1, "can"],
  瓶: [1, "bottle"],
};
const UNITS = Object.keys(UNIT_MAP)
  .sort((a, b) => b.length - a.length)
  .join("|");
const NUM =
  "\\d+(?:\\.\\d+)?(?:\\s*[\\/\\-~～]\\s*\\d+(?:\\.\\d+)?)?|半|[一二三四五六七八九十两]";
const AMOUNT = new RegExp(`(${NUM})\\s*(${UNITS})(?![a-zA-Z])`, "i");
const LOOSE = /适量|少许|适当|若干|一些|一点|少量|适度|随意|酌量/g;
const ZH_NUMBERS: Record<string, number> = {
  半: 0.5,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function parseNumber(text: string): number {
  if (ZH_NUMBERS[text] !== undefined) return ZH_NUMBERS[text];
  const range = text.split(/\s*[-~～]\s*/);
  if (range.length === 2)
    return (parseNumber(range[0]) + parseNumber(range[1])) / 2;
  const fraction = text.split("/");
  if (fraction.length === 2) return Number(fraction[0]) / Number(fraction[1]);
  return Number(text);
}

type Item = { name: string; qty?: number; unit?: string; loose: boolean };

function parseWord(raw: string): Item {
  let w = raw
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/各|约|大约|大概|左右|：|:/g, "")
    .trim();
  let qty: number | undefined;
  let unit: string | undefined;
  const m = w.match(AMOUNT);
  if (m && m.index !== undefined) {
    const [factor, out] = UNIT_MAP[m[2].toLowerCase()];
    qty = Math.round(parseNumber(m[1]) * factor * 10) / 10;
    unit = out;
    w = w.slice(0, m.index) + w.slice(m.index + m[0].length);
  }
  const loose = LOOSE.test(w);
  LOOSE.lastIndex = 0;
  w = w
    .replace(LOOSE, "")
    .replace(/^[\s\-·•、，,。.]+|[\s\-·•、，,。.]+$/g, "");
  return { name: w, qty, unit, loose };
}

// "排骨500g 姜3片, 盐少许" -> items. A bare amount sticks to the name next to it.
function readItems(chunks: string[]): Item[] {
  const items: Item[] = [];
  for (const chunk of chunks) {
    for (const piece of chunk.split(/[、，,；;+＋｜|。]/)) {
      let last: Item | null = null;
      let pending: Item | null = null;
      for (const word of piece.split(/\s+/).filter(Boolean)) {
        const p = parseWord(word);
        const hasAmount = p.qty !== undefined || p.loose;
        if (p.name) {
          if (!hasAmount && pending) {
            p.qty = pending.qty;
            p.unit = pending.unit;
            p.loose = pending.loose;
            pending = null;
          }
          items.push(p);
          last = p;
        } else if (hasAmount) {
          if (last && last.qty === undefined && !last.loose) {
            last.qty = p.qty;
            last.unit = p.unit;
            last.loose = p.loose;
          } else pending = p;
        }
      }
    }
  }
  return items;
}

// "葱姜蒜" -> 葱, 姜, 蒜 when every letter is a known ingredient.
function splitCombo(name: string): string[] {
  const chars = [...name];
  if (ZH_TO_EN[name] || chars.length < 2 || chars.length > 4) return [name];
  return chars.every((c) => ZH_TO_EN[c]) ? chars : [name];
}

// ---------- categories ----------
const CATEGORY_RULES: [Category, RegExp][] = [
  ["Dairy & Eggs", /蛋|奶|芝士|奶酪|黄油|奶油/],
  [
    "Pantry",
    /酱|油|抽|盐|糖|醋|酒|粉|料|咖喱|豆豉|酵母|蜂蜜|胡椒|八角|桂皮|香叶|花椒|孜然|味精|鸡精|芝麻|腐乳|高汤|清水|热水|米饭|大米|面条/,
  ],
  [
    "Meat & Seafood",
    /肉|排骨|鸡|鸭|鹅|牛|羊|猪|鱼|虾|蟹|贝|蛤|鱿|肠|培根|火腿|里脊|腩|蹄|腿|翅/,
  ],
  [
    "Produce",
    /菜|葱|姜|蒜|椒|瓜|豆|菇|茄|萝卜|果|薯|芋|笋|菌|藕|芹|韭|莴|柠檬|橙|番茄|西红柿|洋葱|玉米|木耳|西兰花/,
  ],
];

export function guessCategory(name: string): Category {
  const zh = EN_TO_ZH[name.toLowerCase()] ?? name;
  return CATEGORY_RULES.find(([, re]) => re.test(zh))?.[0] ?? "Other";
}

// ---------- utensils ----------
const UTENSIL_WORDS: [string, string][] = [
  ["空气炸锅", "Air fryer"],
  ["高压锅", "Pressure cooker"],
  ["电饭煲", "Rice cooker"],
  ["砂锅", "Clay pot"],
  ["蒸锅", "Steamer"],
  ["平底锅", "Frying pan"],
  ["炒锅", "Wok"],
  ["汤锅", "Soup pot"],
  ["烤箱", "Oven"],
];

function findUtensils(text: string): string[] {
  const found = UTENSIL_WORDS.filter(([zh]) => text.includes(zh)).map(
    ([, en]) => en,
  );
  if (found.length === 0 && text.includes("锅")) found.push("Pot");
  return found;
}

// ---------- ingredients hidden in the steps ----------
const SKIP_SINGLE = new Set(["面", "米"]); // too often part of other words (表面, 厘米)
const TEXT_KEYS = Object.keys(ZH_TO_EN)
  .filter((k) => !SKIP_SINGLE.has(k))
  .sort((a, b) => b.length - a.length);
const AMOUNT_BEFORE = new RegExp(`(${NUM})\\s*(${UNITS})\\s*(?:的)?$`, "i");
const AMOUNT_AFTER = new RegExp(
  `^\\s*(?:约)?(${NUM})\\s*(${UNITS})(?![a-zA-Z])`,
  "i",
);

function toAmount(num: string, unit: string) {
  const [factor, out] = UNIT_MAP[unit.toLowerCase()];
  return { qty: Math.round(parseNumber(num) * factor * 10) / 10, unit: out };
}

// "加入2勺生抽" / "排骨500g" -> the amount written right next to the ingredient, if any.
function amountNear(text: string, start: number, end: number) {
  const after = text.slice(end, end + 8).match(AMOUNT_AFTER);
  if (after) return toAmount(after[1], after[2]);
  const before = text.slice(Math.max(0, start - 8), start).match(AMOUNT_BEFORE);
  return before ? toAmount(before[1], before[2]) : undefined;
}

// Looks for every ingredient we know the name of, anywhere in the text.
function findIngredientsInText(text: string): Ingredient[] {
  const taken = new Array<boolean>(text.length).fill(false);
  const found = new Map<string, { at: number; ing: Ingredient }>();
  for (const key of TEXT_KEYS) {
    for (let from = 0; ;) {
      const idx = text.indexOf(key, from);
      if (idx < 0) break;
      from = idx + key.length;
      if (taken.slice(idx, idx + key.length).some(Boolean)) continue;
      if (key === "糖" && text[idx + 1] === "色") continue; // 糖色 = caramel colour, not a shopping item
      taken.fill(true, idx, idx + key.length);
      const name = ZH_TO_EN[key];
      const amount = amountNear(text, idx, idx + key.length);
      const seen = found.get(name);
      if (!seen) {
        found.set(name, {
          at: idx,
          ing: {
            name,
            quantity: amount?.qty ?? 0,
            unit: amount?.unit ?? "",
            category: guessCategory(key),
          },
        });
      } else {
        seen.at = Math.min(seen.at, idx);
        if (seen.ing.quantity === 0 && amount) {
          seen.ing.quantity = amount.qty;
          seen.ing.unit = amount.unit;
        }
      }
    }
  }
  return [...found.values()].sort((a, b) => a.at - b.at).map((f) => f.ing);
}

// ---------- main ----------
function clean(line: string): string {
  return line
    .replace(/#\S+/g, "")
    .replace(/[【】\[\]*]/g, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .trim();
}

export function parsePost(text: string): ParsedPost {
  const ingChunks: string[] = [];
  const steps: string[] = [];
  const allLines: string[] = [];
  let mode: "none" | "ing" | "step" = "none";

  const addStep = (s: string) => {
    const step = s.replace(NUMBERING, "").trim();
    if (step) steps.push(step);
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = clean(raw);
    if (!line) continue;
    allLines.push(line);
    if (STEP_HEAD.test(line)) {
      mode = "step";
      addStep(line.replace(STEP_HEAD, ""));
    } else if (ING_HEAD.test(line)) {
      mode = "ing";
      const rest = line.replace(ING_HEAD, "");
      if (rest) ingChunks.push(rest);
    } else if (mode === "ing") {
      // A long numbered line while reading ingredients means the steps have started.
      if (NUMBERING.test(line) && line.length > 12) {
        mode = "step";
        addStep(line);
      } else ingChunks.push(line);
    } else if (mode === "step") {
      addStep(line);
    } else if (NUMBERING.test(line)) {
      mode = "step";
      addStep(line);
    }
  }

  // Screenshots often come out with no "食材 / 做法" headings at all: use every line as a
  // step (without the title line) so nothing is lost.
  if (steps.length === 0 && ingChunks.length === 0) {
    for (const line of allLines.length > 3 ? allLines.slice(1) : allLines) {
      const step = line.replace(NUMBERING, "").trim();
      if (step) steps.push(step);
    }
  }

  const ingredients: Ingredient[] = [];
  for (const item of readItems(ingChunks)) {
    if (
      item.name.length < 1 ||
      item.name.length > 14 ||
      /^[\d\s\p{P}]+$/u.test(item.name)
    )
      continue;
    for (const zh of splitCombo(item.name)) {
      const hasQty = item.qty !== undefined && item.qty > 0;
      ingredients.push({
        name: ZH_TO_EN[zh] ?? zh,
        quantity: hasQty ? item.qty! : 0,
        unit: hasQty ? (item.unit ?? "") : "",
        category: guessCategory(zh),
      });
    }
  }

  // Same ingredient twice (e.g. 生抽 + 老抽 are both soy sauce): add the amounts together.
  const merged = new Map<string, Ingredient>();
  for (const ing of ingredients) {
    const key = `${ing.name}|${ing.unit}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += ing.quantity;
    else merged.set(key, { ...ing });
  }
  const mergedList = [...merged.values()].filter(
    (ing) =>
      ing.quantity > 0 ||
      ![...merged.values()].some((o) => o.name === ing.name && o.quantity > 0),
  );

  // No usable ingredient list: pick the ingredients out of the steps instead.
  const fromSteps = mergedList.length === 0;
  if (fromSteps) {
    mergedList.push(...findIngredientsInText(steps.join("\n")));
  }

  const servings = Number(text.match(/(\d{1,2})\s*人(?:份|食|量)?/)?.[1]) || 2;
  return {
    fromSteps: fromSteps && mergedList.length > 0,
    servings,
    ingredients: mergedList,
    steps,
    utensils: findUtensils(steps.join("")),
  };
}
