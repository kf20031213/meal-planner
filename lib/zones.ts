import type { FridgeZone } from "./types";

export const ZONES: { id: FridgeZone; en: string; zh: string; icon: string }[] =
  [
    { id: "unsorted", en: "Unsorted", zh: "未分类", icon: "📥" },
    { id: "freezer", en: "Freezer", zh: "冷冻区", icon: "🧊" },
    { id: "chilled", en: "Chilled", zh: "冷藏区", icon: "❄️" },
    { id: "drinks", en: "Drinks", zh: "饮料区", icon: "🥤" },
    { id: "seasonings", en: "Seasonings", zh: "调料区", icon: "🧂" },
  ];

const KEYWORDS: Record<
  Exclude<FridgeZone, "chilled" | "unsorted">,
  string[]
> = {
  freezer: [
    "frozen",
    "ice cream",
    "ice cube",
    "dumpling",
    "popsicle",
    "fries",
    "edamame",
    "ice",
  ],
  drinks: [
    "juice",
    "soda",
    "cola",
    "beer",
    "wine",
    "water",
    "tea",
    "coffee",
    "kombucha",
    "soy milk",
    "drink",
    "sparkling",
  ],
  seasonings: [
    "salt",
    "sugar",
    "oil",
    "soy sauce",
    "vinegar",
    "pepper",
    "cornstarch",
    "starch",
    "flour",
    "sauce",
    "spice",
    "honey",
    "cumin",
    "msg",
    "cooking wine",
    "sesame",
    "chili",
    "paste",
    "ketchup",
    "mustard",
    "mayonnaise",
    "baking soda",
    "yeast",
  ],
};

// Chinese words: matched anywhere in the name, since Chinese has no spaces.
const ZH_KEYWORDS: Record<
  Exclude<FridgeZone, "chilled" | "unsorted">,
  string[]
> = {
  freezer: [
    "冷冻",
    "速冻",
    "冻",
    "饺子",
    "馄饨",
    "汤圆",
    "冰淇淋",
    "雪糕",
    "冰块",
  ],
  drinks: [
    "茶",
    "汁",
    "可乐",
    "汽水",
    "啤酒",
    "红酒",
    "白酒",
    "酒",
    "咖啡",
    "饮料",
    "矿泉水",
    "苏打水",
    "豆浆",
  ],
  seasonings: [
    "盐",
    "糖",
    "油",
    "酱",
    "醋",
    "胡椒",
    "淀粉",
    "面粉",
    "调料",
    "香料",
    "蜂蜜",
    "孜然",
    "味精",
    "料酒",
    "芝麻",
    "辣椒粉",
    "花椒",
  ],
};

// Guesses where an item lives. Anything it isn't sure about goes to "Unsorted" so you can
// drag it to the right place yourself.
export function guessZone(name: string): FridgeZone {
  const text = name.toLowerCase();
  for (const zone of ["freezer", "drinks", "seasonings"] as const) {
    if (KEYWORDS[zone].some((k) => new RegExp(`\\b${k}s?\\b`).test(text)))
      return zone;
    if (ZH_KEYWORDS[zone].some((k) => text.includes(k))) return zone;
  }
  return "unsorted";
}
