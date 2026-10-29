import { EN_TO_ZH } from "./ingredients";
import { normalizeName } from "./shopping";

// Chinese translations, only used by the "Show Chinese" switch so you can compare.

export const ZH_UTENSILS: Record<string, string> = {
  Wok: "炒锅",
  Pot: "锅",
  "Clay pot": "砂锅",
  "Pressure cooker": "高压锅",
  "Rice cooker": "电饭煲",
  Steamer: "蒸锅",
  "Frying pan": "平底锅",
  "Soup pot": "汤锅",
  "Air fryer": "空气炸锅",
  Oven: "烤箱",
};

export const ZH_CATEGORY: Record<string, string> = {
  Produce: "蔬果",
  "Meat & Seafood": "肉类海鲜",
  "Dairy & Eggs": "乳制品和蛋",
  Pantry: "调料干货",
  Other: "其他",
};

export function zhIngredient(name: string): string | undefined {
  return EN_TO_ZH[normalizeName(name)];
}
