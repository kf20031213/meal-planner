"use client";

import type { SavedDish } from "@/lib/types";
import { Bi } from "./Bi";

// English name with the Chinese one next to it. Falls back to whichever name exists.
export default function DishName({
  dish,
  block = false,
}: {
  dish: SavedDish;
  block?: boolean;
}) {
  const { zh, en } = dish.names;
  return (
    <Bi en={en || zh} zh={en ? zh || undefined : undefined} block={block} />
  );
}
