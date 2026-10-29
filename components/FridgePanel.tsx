"use client";

import { useState } from "react";
import type { FridgeItem, FridgeZone } from "@/lib/types";
import { normalizeName } from "@/lib/shopping";
import { ZONES, guessZone } from "@/lib/zones";
import { Bi } from "./Bi";
import { zhIngredient } from "@/lib/zh";

type Props = {
  items: FridgeItem[];
  highlighted: Set<string> | null;
  onAdd: (name: string, zone: FridgeZone) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, zone: FridgeZone) => void;
  onClearUsedUp: () => void;
};

export default function FridgePanel({
  items,
  highlighted,
  onAdd,
  onToggle,
  onMove,
  onClearUsedUp,
}: Props) {
  const usedUp = items.filter((i) => !i.inStock).length;
  const [text, setText] = useState("");
  const [zone, setZone] = useState<FridgeZone | "auto">("auto");
  const [dragOver, setDragOver] = useState<FridgeZone | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Allow several items at once, separated by commas: "milk, eggs, ginger"
    text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((name) => onAdd(name, zone === "auto" ? guessZone(name) : zone));
    setText("");
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-stone-900">
          <Bi en="Fridge & pantry" zh="冰箱和储物" />
        </h2>
        {usedUp > 0 && (
          <button
            onClick={onClearUsedUp}
            className="text-sm text-stone-500 underline hover:text-stone-800"
          >
            Clear {usedUp} used up
          </button>
        )}
      </div>

      <form onSubmit={submit} className="mb-5 space-y-2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add items, e.g. milk, ginger / 添加食材"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Add / 添加
          </button>
        </div>
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value as FridgeZone | "auto")}
          aria-label="Storage area"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-emerald-500"
        >
          <option value="auto">Area: automatic / 区域：自动判断</option>
          {ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.icon} {z.en} / {z.zh}
            </option>
          ))}
        </select>
      </form>

      <div className="space-y-4">
        {ZONES.map((z) => {
          const zoneItems = items.filter((i) => i.zone === z.id);
          return (
            <div
              key={z.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(z.id);
              }}
              onDragLeave={() => setDragOver((c) => (c === z.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) onMove(id, z.id);
                setDragOver(null);
              }}
              className={`rounded-xl transition ${
                dragOver === z.id ? "bg-emerald-50 ring-2 ring-emerald-300" : ""
              }`}
            >
              <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                <span>{z.icon}</span>
                <Bi en={z.en} zh={z.zh} />
                {z.id === "seasonings" && (
                  <span className="font-normal normal-case">
                    <Bi en="(not in the fridge)" zh="（不在冰箱里）" />
                  </span>
                )}
              </h3>
              {zoneItems.length === 0 ? (
                <p className="px-2 py-1 text-sm text-stone-300">
                  — <Bi en="drop items here" zh="拖到这里" />
                </p>
              ) : (
                <ul>
                  {zoneItems.map((item) => {
                    const isHi =
                      highlighted?.has(normalizeName(item.name)) ?? false;
                    const dim = highlighted !== null && !isHi;
                    return (
                      <li
                        key={item.id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", item.id)
                        }
                        onDragEnd={() => setDragOver(null)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition ${
                            isHi ? "bg-amber-100 ring-1 ring-amber-300" : ""
                          } ${dim ? "opacity-40" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={item.inStock}
                            onChange={() => onToggle(item.id)}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          <span
                            className={`flex-1 capitalize ${
                              item.inStock
                                ? "text-stone-800"
                                : "text-stone-400 line-through"
                            }`}
                          >
                            <Bi en={item.name} zh={zhIngredient(item.name)} />
                          </span>
                          {!item.inStock && (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                              <Bi en="Used up" zh="已用完" />
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
