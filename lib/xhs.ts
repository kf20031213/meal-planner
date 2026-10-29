export function xhsSearchUrl(dish: string): string {
  return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(`${dish} 做法`)}`;
}
