// One entry per ingredient: [English name, main Chinese name, other Chinese names].
// English names are already in the "normalized" form (singular, lower case).
const ENTRIES: [string, string, string[]][] = [
  ["pork", "猪肉", []],
  ["pork rib", "排骨", ["猪排骨", "小排"]],
  ["ginger", "姜", ["生姜"]],
  ["garlic", "大蒜", ["蒜", "蒜头"]],
  ["green onion", "葱", ["大葱", "小葱", "香葱", "葱花"]],
  ["soy sauce", "酱油", ["生抽", "老抽"]],
  ["rock sugar", "冰糖", []],
  ["sugar", "糖", ["白糖", "砂糖", "白砂糖"]],
  ["cooking oil", "食用油", ["油", "植物油", "菜籽油", "花生油"]],
  ["egg", "鸡蛋", ["蛋", "蛋类"]],
  ["tomato", "番茄", ["西红柿"]],
  ["chicken breast", "鸡胸肉", []],
  ["chicken", "鸡肉", ["鸡"]],
  ["broccoli", "西兰花", ["花椰菜"]],
  ["cornstarch", "玉米淀粉", ["淀粉", "生粉"]],
  ["milk", "牛奶", []],
  ["rice", "米饭", ["大米", "米"]],
  ["tofu", "豆腐", []],
  ["potato", "土豆", ["马铃薯"]],
  ["carrot", "胡萝卜", []],
  ["onion", "洋葱", []],
  ["butter", "黄油", []],
  ["cheese", "奶酪", ["芝士"]],
  ["beef", "牛肉", []],
  ["fish", "鱼", []],
  ["shrimp", "虾", ["虾仁"]],
  ["salt", "盐", []],
  ["vinegar", "醋", ["米醋", "陈醋", "香醋", "白醋"]],
  ["flour", "面粉", []],
  ["noodle", "面条", ["面"]],
  ["cabbage", "卷心菜", ["包菜", "圆白菜"]],
  ["mushroom", "蘑菇", ["香菇"]],
  ["lemon", "柠檬", []],
  ["apple", "苹果", []],
  ["banana", "香蕉", []],
  ["yogurt", "酸奶", []],
  ["iced tea", "冰红茶", ["冰茶"]],
  ["cola", "可乐", []],
  ["orange juice", "橙汁", []],
  ["beer", "啤酒", []],
  ["dumpling", "饺子", []],
  ["cooking wine", "料酒", ["黄酒", "绍兴酒"]],
  ["star anise", "八角", ["大料"]],
  ["sichuan peppercorn", "花椒", []],
  ["cinnamon", "桂皮", ["肉桂"]],
  ["bay leaf", "香叶", []],
  ["oyster sauce", "蚝油", []],
  ["chicken bouillon", "鸡精", []],
  ["pepper", "胡椒粉", ["胡椒", "黑胡椒"]],
  ["chili", "辣椒", ["小米椒", "干辣椒"]],
  ["green pepper", "青椒", ["尖椒"]],
  ["chicken wing", "鸡翅", ["鸡中翅"]],
  ["pork belly", "五花肉", ["五花"]],
  ["doubanjiang", "豆瓣酱", ["郫县豆瓣酱"]],
  ["sesame oil", "香油", ["麻油", "芝麻油"]],
  ["sesame", "芝麻", ["白芝麻"]],
  ["corn", "玉米", []],
  ["wood ear mushroom", "木耳", []],
  ["lotus root", "莲藕", ["藕"]],
  ["kelp", "海带", []],
  ["bok choy", "青菜", ["小白菜", "上海青", "油菜"]],
  ["napa cabbage", "白菜", ["大白菜"]],
  ["spinach", "菠菜", []],
  ["cucumber", "黄瓜", []],
  ["eggplant", "茄子", []],
  ["celery", "芹菜", []],
  ["chive", "韭菜", []],
  ["pea", "豌豆", ["青豆"]],
  ["pumpkin", "南瓜", []],
  ["winter melon", "冬瓜", []],
  ["loofah", "丝瓜", []],
  ["radish", "白萝卜", ["萝卜"]],
  ["yam", "山药", []],
  ["bean sprout", "豆芽", []],
  ["glass noodle", "粉丝", ["红薯粉"]],
  ["lamb", "羊肉", ["羊排", "羊腿"]],
  ["beef brisket", "牛腩", []],
  ["pork tenderloin", "里脊", ["猪里脊", "里脊肉"]],
  ["ground pork", "肉末", ["猪肉末", "肉馅"]],
  ["pig trotter", "猪蹄", []],
  ["chicken drumstick", "鸡腿", []],
  ["squid", "鱿鱼", []],
  ["clam", "蛤蜊", []],
  ["cumin", "孜然", []],
  ["curry", "咖喱", []],
  ["ketchup", "番茄酱", []],
  ["mayonnaise", "沙拉酱", []],
  ["chili sauce", "辣椒酱", []],
  ["sesame paste", "芝麻酱", []],
  ["brown sugar", "红糖", []],
  ["honey", "蜂蜜", []],
  ["baking powder", "泡打粉", []],
  ["yeast", "酵母", []],
  ["fermented black bean", "豆豉", []],
];

export const EN_TO_ZH: Record<string, string> = {};
export const ZH_TO_EN: Record<string, string> = {};
for (const [en, zh, aliases] of ENTRIES) {
  EN_TO_ZH[en] = zh;
  for (const name of [zh, ...aliases]) ZH_TO_EN[name] = en;
}

// "Similar" ingredients: having the one on the right is close to having the one on the left.
export const RELATED: Record<string, string> = {
  "pork rib": "pork",
  "chicken breast": "chicken",
  "rock sugar": "sugar",
};

const ZH_KEYS_LONGEST_FIRST = Object.keys(ZH_TO_EN).sort(
  (a, b) => b.length - a.length,
);

export const hasChinese = (text: string) => /[一-鿿]/.test(text);

// "新鲜猪肉" -> "pork". Exact words always match; inside a longer word only
// words of 2+ characters match, so "鸡翅" does not turn into "chicken".
// Returns undefined if we don't know the Chinese word.
export function chineseToEnglish(text: string): string | undefined {
  const t = text.trim();
  if (ZH_TO_EN[t]) return ZH_TO_EN[t];
  const key = ZH_KEYS_LONGEST_FIRST.find((k) => k.length >= 2 && t.includes(k));
  return key ? ZH_TO_EN[key] : undefined;
}
