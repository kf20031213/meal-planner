"use client";

import { useState } from "react";
import type { Post } from "@/lib/types";
import { Bi } from "./Bi";
import PostForm from "./PostForm";

type Props = {
  posts: Post[];
  mainId: string;
  onSetMain: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (post: Post) => void;
};

function label(post: Post, index: number) {
  if (post.note) return post.note;
  if (post.url) {
    try {
      return new URL(post.url).hostname.replace(/^www\./, "");
    } catch {
      return post.url;
    }
  }
  return `Post ${index + 1}`;
}

// The saved posts under the dish name, plus a way to add another one.
export default function PostsSection({
  posts,
  mainId,
  onSetMain,
  onRemove,
  onAdd,
}: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-4 space-y-2">
      <ul className="space-y-1">
        {posts.map((post, i) => {
          const isMain = post.id === mainId;
          return (
            <li
              key={post.id}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
            >
              <span aria-hidden>🔖</span>
              {post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate font-medium text-red-700 underline-offset-2 hover:underline"
                >
                  {label(post, i)} ↗
                </a>
              ) : (
                <span className="font-medium text-stone-700">
                  {label(post, i)}
                </span>
              )}
              {isMain ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Main post
                </span>
              ) : (
                <button
                  onClick={() => onSetMain(post.id)}
                  className="text-xs text-stone-400 underline hover:text-stone-700"
                >
                  make main
                </button>
              )}
              {posts.length > 1 && (
                <button
                  onClick={() => onRemove(post.id)}
                  className="text-xs text-stone-400 underline hover:text-stone-700"
                >
                  remove
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <PostForm
          onSave={(post) => {
            onAdd(post);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-emerald-700 hover:underline"
        >
          + <Bi en="Add another post" zh="添加另一篇帖子" />
        </button>
      )}
    </div>
  );
}
