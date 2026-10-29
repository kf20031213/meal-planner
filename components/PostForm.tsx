"use client";

import { useRef, useState } from "react";
import { CATEGORIES, type Category, type Post } from "@/lib/types";
import { chineseToEnglish, hasChinese } from "@/lib/ingredients";
import { cleanOcrText } from "@/lib/ocrClean";
import { parsePost } from "@/lib/parsePost";
import { SAMPLE_POSTS } from "@/lib/samplePosts";
import { Bi } from "./Bi";

type Row = { name: string; qty: string; unit: string; category: Category };

type Props = {
  onSave: (post: Post) => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

// Two steps: 1) paste the post text, 2) check what was found and fix anything wrong.
export default function PostForm({ onSave, onCancel }: Props) {
  const [stage, setStage] = useState<"paste" | "review">("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [sample, setSample] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [steps, setSteps] = useState("");
  const [servings, setServings] = useState("2");
  const [utensils, setUtensils] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fromSteps, setFromSteps] = useState(false);
  const [ocr, setOcr] = useState<{
    index: number;
    total: number;
    percent: number;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Reads the text out of screenshots, right here in the browser (nothing is uploaded).
  async function readImages(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setError(null);
    setOcr({ index: 1, total: images.length, percent: 0 });
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["chi_sim", "eng"], 1, {
        logger: (m) => {
          if (m.status === "recognizing text")
            setOcr((o) =>
              o ? { ...o, percent: Math.round(m.progress * 100) } : o,
            );
        },
      });
      const parts: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setOcr({ index: i + 1, total: images.length, percent: 0 });
        const { data } = await worker.recognize(images[i]);
        parts.push(cleanOcrText(data.text));
      }
      await worker.terminate();
      setText((prev) => [prev.trim(), ...parts].filter(Boolean).join("\n"));
    } catch {
      setError(
        "Couldn't read the screenshot. Check your internet connection and try again, or paste the text instead. / 没能读取截图，请检查网络后重试，或直接粘贴文字。",
      );
    } finally {
      setOcr(null);
    }
  }

  function readPost() {
    if (!text.trim()) {
      setError(
        url.trim()
          ? "A link alone can't be read. Open the post, copy its text and paste it in the big box. / 只有链接读不出内容，请打开帖子，复制正文粘贴到上面的大框里。"
          : "Paste the post text first. / 请先粘贴帖子文字。",
      );
      return;
    }
    const parsed = parsePost(text);
    setRows(
      parsed.ingredients.map((i) => ({
        name: i.name,
        qty: i.quantity > 0 ? String(i.quantity) : "",
        unit: i.quantity > 0 ? i.unit : "",
        category: i.category,
      })),
    );
    setSteps(parsed.steps.join("\n"));
    setServings(String(parsed.servings));
    setFromSteps(parsed.fromSteps);
    setUtensils(parsed.utensils);
    setError(null);
    setStage("review");
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function save() {
    const ingredients = rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const quantity = Number(r.qty) > 0 ? Number(r.qty) : 0;
        const typed = r.name.trim();
        return {
          name: hasChinese(typed)
            ? (chineseToEnglish(typed) ?? typed)
            : typed.toLowerCase(),
          quantity,
          unit: quantity > 0 ? r.unit.trim() : "",
          category: r.category,
        };
      });
    if (ingredients.length === 0) {
      setError("Add at least one ingredient. / 请至少添加一个食材。");
      return;
    }
    const link = url.trim() || text.match(/https?:\/\/[^\s]+/)?.[0] || "";
    onSave({
      id: crypto.randomUUID(),
      url: link,
      note: note.trim(),
      servings: Number(servings) > 0 ? Number(servings) : 2,
      ingredients,
      steps: steps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      utensils,
    });
  }

  if (stage === "paste") {
    return (
      <div className="space-y-3 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            // Pasting a screenshot (Cmd+V) is read like an uploaded one.
            const files = [...e.clipboardData.files];
            if (files.some((f) => f.type.startsWith("image/"))) {
              e.preventDefault();
              readImages(files);
            }
          }}
          rows={8}
          placeholder="Paste the whole post here: the ingredients and the steps / 把整篇帖子（食材和做法）粘贴到这里"
          className={inputClass}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              readImages([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={ocr !== null}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100 disabled:opacity-50"
          >
            📷 <Bi en="Upload screenshots" zh="上传截图" />
          </button>
          <span className="text-xs text-stone-500">
            <Bi
              en="Several screenshots are fine. You can also paste one into the box with Cmd+V."
              zh="可以一次传多张，也可以在框里直接 Cmd+V 粘贴截图。"
            />
          </span>
        </div>
        {ocr && (
          <p
            role="status"
            className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200"
          >
            <Bi
              en={`Reading screenshot ${ocr.index} of ${ocr.total}… ${ocr.percent}%`}
              zh={`正在读取第 ${ocr.index} / ${ocr.total} 张截图… ${ocr.percent}%`}
              block
            />
            {ocr.percent === 0 && (
              <span className="mt-1 block text-xs">
                <Bi
                  en="The first time it downloads about 15 MB of Chinese reading data, so please wait a moment."
                  zh="第一次使用要下载约 15MB 的中文识别数据，请稍等。"
                />
              </span>
            )}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link to the post (optional) / 帖子链接（可选）"
            className={inputClass}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Name it (optional) / 给它起个名字（可选）"
            className={inputClass}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={readPost}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Bi en="Read the post" zh="读取帖子" />
          </button>
          <button
            onClick={() => {
              setText(SAMPLE_POSTS[sample % SAMPLE_POSTS.length]);
              setSample(sample + 1);
            }}
            className="text-sm text-stone-500 underline hover:text-stone-800"
          >
            <Bi en="Fill in a sample post to try it" zh="填入示例帖子试试" />
          </button>
          <button
            onClick={onCancel}
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            <Bi en="Cancel" zh="取消" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200">
      <p className="text-sm text-stone-700">
        {rows.length === 0 && !steps.trim() ? (
          <Bi
            en="I couldn't find an ingredient list or steps. Fill them in below."
            zh="没能找到食材和步骤，请在下面手动填写。"
          />
        ) : fromSteps ? (
          <Bi
            en={`There was no ingredient list, so I picked ${rows.length} ingredients out of the steps. Amounts are only filled in where the steps mention them. Please check, and add anything I missed.`}
            zh={`没有找到食材清单，所以我从步骤里挑出了${rows.length}个食材。只有步骤里写了用量的才会有数量。请检查，并补上漏掉的。`}
          />
        ) : (
          <Bi
            en={`I found ${rows.length} ingredients and ${steps.split("\n").filter(Boolean).length} steps. Please check them and fix anything that's wrong.`}
            zh={`找到了${rows.length}个食材和${steps.split("\n").filter(Boolean).length}个步骤，请检查并修改不对的地方。`}
          />
        )}
      </p>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Bi en="Servings" zh="份数" />
        </label>
        <input
          type="number"
          min={1}
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className={`${inputClass} w-24`}
        />
      </div>

      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Bi en="Ingredients" zh="食材" />
          <span className="ml-2 font-normal normal-case text-stone-400">
            <Bi
              en="leave the amount empty if the post doesn't give one"
              zh="帖子没写数量就留空"
            />
          </span>
        </h4>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_5rem_4.5rem_auto] gap-2 sm:grid-cols-[1fr_5rem_4.5rem_8.5rem_auto]"
            >
              <input
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                aria-label="Ingredient name"
                placeholder="Name / 名称"
                className={inputClass}
              />
              <input
                value={row.qty}
                onChange={(e) => updateRow(i, { qty: e.target.value })}
                inputMode="decimal"
                aria-label="Amount"
                placeholder="Amount"
                className={inputClass}
              />
              <input
                value={row.unit}
                onChange={(e) => updateRow(i, { unit: e.target.value })}
                aria-label="Unit"
                placeholder="Unit"
                className={inputClass}
              />
              <select
                value={row.category}
                onChange={(e) =>
                  updateRow(i, { category: e.target.value as Category })
                }
                aria-label="Category"
                className={`${inputClass} hidden sm:block`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={() =>
                  setRows((prev) => prev.filter((_, j) => j !== i))
                }
                aria-label="Remove this ingredient"
                className="rounded-lg px-2 text-stone-400 hover:bg-stone-200 hover:text-stone-800"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { name: "", qty: "", unit: "", category: "Other" },
            ])
          }
          className="mt-2 text-sm text-emerald-700 hover:underline"
        >
          + <Bi en="Add an ingredient" zh="添加食材" />
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Bi en="Steps (one per line)" zh="步骤（每行一步）" />
        </label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={6}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Bi en="Save this post" zh="保存这篇帖子" />
        </button>
        <button
          onClick={() => setStage("paste")}
          className="text-sm text-stone-500 underline hover:text-stone-800"
        >
          <Bi en="Back to the text" zh="返回文字" />
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          <Bi en="Cancel" zh="取消" />
        </button>
      </div>
    </div>
  );
}
