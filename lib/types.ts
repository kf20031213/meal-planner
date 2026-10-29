export const CATEGORIES = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
  category: Category;
};

export type Recipe = {
  dish: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  utensils: string[];
};

export type FridgeZone =
  "unsorted" | "freezer" | "chilled" | "drinks" | "seasonings";

export type FridgeItem = {
  id: string;
  name: string;
  zone: FridgeZone;
  inStock: boolean; // unticked = used up
};

export type ShoppingLine = {
  key: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  category: Category;
  dishes: string[];
  inFridge: boolean;
};

// One Xiaohongshu post the user pasted in.
export type Post = {
  id: string;
  url: string; // optional link back to the post
  note: string; // optional name the user gave it
  servings: number;
  ingredients: Ingredient[]; // quantity 0 means "to taste", no amount given
  steps: string[];
  utensils: string[];
};

export type DishCategory = {
  id: string;
  en: string;
  zh: string;
};

export type SavedDish = {
  id: string;
  names: { zh: string; en: string }; // at least one is filled in
  categoryId: string;
  posts: Post[];
  mainPostId: string; // steps and amounts come from this post
  marks: Record<string, "required" | "optional">; // manual overrides, by normalized name
  picked: string[]; // optional extras the user ticked, by normalized name
};
