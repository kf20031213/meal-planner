"use client";

import { createContext, useContext } from "react";

const LangContext = createContext(false);

export const LangProvider = LangContext.Provider;

// Shows English text, plus small grey Chinese text next to it when the switch is on.
export function Bi({
  en,
  zh,
  block = false,
}: {
  en: string;
  zh?: string;
  block?: boolean;
}) {
  const showZh = useContext(LangContext);
  return (
    <>
      {en}
      {showZh && zh && (
        <span
          className={`${block ? "mt-0.5 block" : "ml-1.5"} text-[0.85em] font-normal normal-case text-stone-400 no-underline`}
        >
          {zh}
        </span>
      )}
    </>
  );
}
