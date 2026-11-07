# Meal Planner 做饭规划

把小红书上刷到的菜谱，变成可以直接买菜和做饭的清单。
Turn recipes you find online into a shopping list and a cooking plan.

## 功能 Features

- 搜索菜名并跳转小红书，或粘贴帖子 / 上传截图，自动识别食材和步骤
- 菜谱卡片，区分"必需"和"可选"食材
- 多道菜的食材合并成一份购物清单
- 冰箱分区，记录家里现有的食材
- 按类别整理的菜谱本
- 中英双语界面

---

## 用法一：直接在网页上用（最简单）Option 1: Use it online (easiest)

### 👉 [点这里打开 / Open the app](https://kf20031213.github.io/meal-planner/)

**什么都不用下载，不用注册。** 用浏览器打开上面的链接就能用。
**Nothing to download, no account.** Just open the link in your browser.

---

## 用法二：下载到自己的电脑上用 Option 2: Download it and use it on your own computer

### 需要下载的东西（只有这两样）What you need to download (only these two)

| | 下载什么 What | 从哪里 Where |
|---|---|---|
| ① | **Node.js**（运行这个程序的工具，装一次就行；选 "LTS" 版本）<br>**Node.js** (the tool that runs the app; install once; pick the "LTS" version) | <https://nodejs.org> |
| ② | **这个项目的 ZIP 压缩包**（整个项目，一个文件）<br>**This project as one ZIP file** (the whole project) | 本页右上方绿色按钮 **Code → Download ZIP**<br>The green **Code → Download ZIP** button on this page |

### 不需要的东西 What you do NOT need

- ❌ 不需要注册任何账号（GitHub、Google 等都不用）/ No account of any kind
- ❌ 不需要数据库、服务器、API 密钥 / No database, server or API key
- ❌ 不需要 Git（下载 ZIP 就够了）/ No Git — the ZIP is enough
- ❌ 不要单独下载某几个文件，必须下载整个 ZIP / Don't download single files; get the whole ZIP
- ❌ 不需要自己编译或改任何设置 / No building and no settings to change

### 第一次使用 First time

**1. 安装 Node.js。** 下载后一路点"下一步"。装完后**重新打开**终端（见下一步）。
Install Node.js (just keep clicking Next), then open a fresh terminal.

**2. 解压 ZIP。** 得到一个叫 `meal-planner-main` 的文件夹，放在哪里都行（比如桌面）。
Unzip it. You get a folder called `meal-planner-main`; put it anywhere (e.g. your Desktop).

**3. 在这个文件夹里打开终端。**
Open a terminal inside that folder.

- **Windows：** 打开文件夹，点上方地址栏，输入 `cmd`，按回车。
  Open the folder, click the address bar, type `cmd`, press Enter.
- **Mac：** 打开"终端"（Terminal），输入 `cd ` （cd 后面有一个空格），把文件夹拖进终端窗口，按回车。
  Open Terminal, type `cd ` (with a space after it), drag the folder into the window, press Enter.

**4. 检查 Node.js 装好了没有。** 输入下面这行并回车，应该显示一个版本号（如 `v22.x.x`）：
Check Node.js is installed. This should print a version number (like `v22.x.x`):

```bash
node -v
```

**5. 安装依赖（只需要做这一次，需要联网，约 1–3 分钟）。**
Install dependencies (do this once; needs internet; takes 1–3 minutes):

```bash
npm install
```

文件夹里会多出一个很大的 `node_modules` 文件夹，这是正常的，不要删除。
A large `node_modules` folder will appear. That's normal; leave it there.

**6. 启动：**
Start it:

```bash
npm run dev
```

看到 `Ready` 字样后，用浏览器打开 / When you see `Ready`, open this in your browser:

### <http://localhost:3000>

### 以后每次使用 Every time after that

只需要两步，**不用**再 `npm install`：
Just two steps. **No** need to run `npm install` again:

1. 在文件夹里打开终端（第 3 步）/ Open a terminal in the folder (step 3)
2. 运行 / Run `npm run dev`，然后打开 / then open <http://localhost:3000>

### 怎么关掉 How to stop

- 用的时候，**终端窗口要一直开着**，关掉它网页就打不开了。
  Keep the terminal window open while you use the app. Closing it stops the app.
- 不用的时候，在终端里按 `Ctrl + C`，再关掉窗口。
  When you're done, press `Ctrl + C` in the terminal, then close it.

### 需要联网吗 Does it need internet?

装好之后，大部分功能不联网也能用。只有这两处需要联网：
After setup, most things work offline. Only these two need internet:

- 点"搜索菜名"跳转小红书 / The jump to Xiaohongshu search
- 上传截图识别文字（第一次会下载文字识别数据）/ Reading text from a screenshot (downloads recognition data the first time)

---

## 你的数据存在哪里 Where your data is saved

- 菜谱、购物清单、冰箱都保存在**你自己浏览器里**，**不在**项目文件夹里，也不会上传到任何地方。
  Your dishes, shopping list and fridge are saved **inside your own browser**, **not** in the project folder, and are never uploaded anywhere.
- 所以删除、替换或更新项目文件夹，**不会**丢菜谱。
  So deleting, replacing or updating the project folder will **not** delete your dishes.
- 但是：**清除浏览器数据、换浏览器、换电脑**，菜谱就看不到了。Safari 超过约一周不使用也可能被清掉。
  But clearing browser data, switching browser or switching computer will lose them. Safari may also clear data after about a week of not using it.

### 备份 Back up

页面右上角有两个按钮：
Two buttons at the top right of the page:

- **备份 / Back up**：下载一个 `.json` 文件。请把它保存好。
  Downloads a `.json` file. Keep it somewhere safe.
- **恢复 / Restore**：选择之前备份的 `.json` 文件，菜谱就回来了。换电脑时也这样搬。
  Pick a backup `.json` to get your dishes back. Use this to move to another computer too.

> ⚠️ 浏览器按**网址**分开保存数据。`localhost:3000` 和网页版（`github.io`）是**两份独立的数据**，互不相通。想把网页版的菜谱搬到本地：先在网页版点"备份"，再在本地点"恢复"。
> ⚠️ Browsers keep data per web address. `localhost:3000` and the online version (`github.io`) are **two separate sets of data**. To move dishes across: Back up on one, Restore on the other.

> ⚠️ 请一直用 `localhost:3000`。网址里的数字变了（比如 3001），就会看到空的菜谱本，因为那是另一个网址。
> ⚠️ Always use `localhost:3000`. If the number changes (e.g. 3001) you'll see an empty recipe book, because that's a different address.

---

## 遇到问题 Troubleshooting

| 问题 Problem | 怎么办 What to do |
|---|---|
| 提示 `npm` 或 `node` 不是命令 / `command not found` | Node.js 没装好。重新安装，然后**关掉终端再重新打开**。<br>Node.js isn't installed properly. Reinstall it, then close and reopen the terminal. |
| 提示端口 3000 被占用 / Port 3000 is in use | 另一个程序在用 3000。关掉它，或者先关掉之前开着的这个程序的终端窗口。<br>Another program is using it. Close it, or close the old terminal window of this app. |
| 网页打不开 / The page won't open | 确认终端窗口还开着，并且显示了 `Ready`。<br>Make sure the terminal is still open and says `Ready`. |
| 菜谱本是空的 / The recipe book is empty | 检查网址是不是 `localhost:3000`，是不是同一个浏览器。<br>Check the address is exactly `localhost:3000` and that you're in the same browser. |
