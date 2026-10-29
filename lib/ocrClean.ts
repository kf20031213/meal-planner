const CJK = "\\u4e00-\\u9fff，。：；、！？（）【】《》“”‘’";
const UNIT_CHARS = "克斤两勺匙个只颗块条根粒枚朵张段片瓣把碗杯袋包盒罐瓶升";
const KEEP = "\u0001";

// The reader puts a space between Chinese characters ("红 烧 排 骨"). Remove those, but keep
// the space after an amount like "3片 " or "2勺 ", because that is what separates one
// ingredient from the next.
export function cleanOcrText(text: string): string {
  return text
    .replace(/:/g, "：")
    .replace(
      new RegExp(`(\\d)[ \\t]*([${UNIT_CHARS}])[ \\t]+(?=[${CJK}])`, "g"),
      `$1$2${KEEP}`,
    )
    .replace(new RegExp(`(?<=[${CJK}])[ \\t]+(?=[${CJK}])`, "g"), "")
    .replace(new RegExp(`(?<=[${CJK}])[ \\t]+(?=\\d)`, "g"), "")
    .replace(new RegExp(`(?<=\\d)[ \\t]+(?=[${CJK}])`, "g"), "")
    .replace(new RegExp(KEEP, "g"), " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
