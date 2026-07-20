# AI4S Tracker 使用指南

## 项目简介

自动追踪 AI4S / AI4SS / AI4R 领域最新热点。每天 0:00（北京时间）采集论文、模型/产品、机构政策、产业投资四类信息，DeepSeek V4 打分 + 中文摘要，推荐当日最佳论文。每周一生成周报、每月 1 日生成月报（含文献综述）。

---

## 一、你的环境现状

✅ Node.js v24.18.0 — 已安装
✅ Git 2.47.1 — 已安装

只需再注册一个 Railway 账号即可。

---

## 二、注册 Railway（只需一次）

1. 访问 https://railway.app
2. 点击 "Sign Up" → 选择 "Sign in with GitHub"
3. 如果没有 GitHub 账号，先去 https://github.com 注册（免费，2 分钟）
4. 授权登录后进入 Railway 控制台

**Railway 免费额度：** $5/月信用额 + 512MB PostgreSQL 数据库。你的项目月耗约 $1-2，完全够用。

---

## 三、配置环境变量

打开项目根目录下的 **`.env.local`** 文件，填入你的真实信息：

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx    ← 你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DATABASE_URL=（先空着，Railway 部署时自动生成）
CRON_SECRET=随便敲一串乱码，比如 aB3xK9mW7qR2tY8n
```

---

## 四、本地安装依赖（一次）

在项目目录 `C:\Users\你好\ai4s-tracker` 打开 PowerShell，运行：

```
npm install
```

这会下载所有项目依赖（Next.js、PostgreSQL 驱动等），约需 1-2 分钟。

---

## 五、推送到 GitHub

在项目目录下打开 PowerShell，逐行运行：

```powershell
git init
git add .
git commit -m "init: AI4S Tracker"
```

然后到 github.com 新建一个仓库（不要勾选 README）。创建后会显示类似：

```
git remote add origin https://github.com/你的用户名/ai4s-tracker.git
git branch -M main
git push -u origin main
```

把这 3 条命令复制到 PowerShell 运行即可。

---

## 六、部署到 Railway

### 6.1 创建项目
1. 在 Railway 控制台点 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择刚推送的 `ai4s-tracker` 仓库
4. Railway 会自动检测到这是 Next.js 项目并开始部署

### 6.2 添加 PostgreSQL
1. 在项目页面，点击 "+ New Service"
2. 选择 "Database" → "PostgreSQL"
3. Railway 会自动创建一个 PostgreSQL 实例
4. 部署首次完成后，Railway 会把 `DATABASE_URL` 自动注入为环境变量

### 6.3 添加其他环境变量
在项目 Settings → Variables 中添加：

| 变量名 | 值 |
|--------|-----|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` |
| `CRON_SECRET` | 与 .env.local 中相同的随机字符串 |

### 6.4 获取访问地址
部署成功后，Railway 会分配一个域名（如 `ai4s-tracker.up.railway.app`）。

---

## 七、设置定时任务

Railway 没有内置 Cron。我们用 **cron-job.org**（免费定时访问服务）：

1. 访问 https://cron-job.org 注册账号（免费）
2. 添加 4 个定时任务，每个设置如下：

| 任务名 | URL | 时间 (UTC) | 对应北京时间 |
|--------|-----|-----------|-------------|
| 每日采集 | `https://你的域名/api/cron/daily-fetch` | 每天 16:00 | 0:00 |
| 日报生成 | `https://你的域名/api/cron/daily-report` | 每天 16:45 | 0:45 |
| 周报生成 | `https://你的域名/api/cron/weekly-report` | 每周一 17:00 | 周一 1:00 |
| 月报生成 | `https://你的域名/api/cron/monthly-report` | 每月 1 日 18:00 | 每月 1 日 2:00 |

3. 每个任务的 HTTP Method 选 GET
4. 保存后，cron-job.org 会按时 GET 这些地址，触发数据处理

> **备选方案：** 你也可以每天手动在浏览器里打开 `/api/cron/daily-fetch` 来触发数据更新。

---

## 八、本地测试（可选）

如果想在本地看看效果：

```powershell
# 需要先装 PostgreSQL 本地版，或者跳过这一步直接看线上版
npm run dev
```

浏览器打开 http://localhost:3000

**注意：** 本地测试需要有 PostgreSQL 数据库运行。如果你不想折腾本地环境，直接部署到 Railway 后看线上版即可。

---

## 九、日常使用

| 操作 | 怎么做 |
|------|--------|
| 查看日报 | 打开网站首页 |
| 查看周报/月报 | 点击顶部导航"周报"/"月报" |
| 搜索历史 | 点击"归档"，按条件筛选 |
| 首次触发数据 | 浏览器打开 `/api/cron/daily-fetch` |
| API 余额不足 | 在 DeepSeek 平台充值（月均约 ¥7-10） |

---

## 十、网站页面说明

### 首页（日报）
- 顶部显示 **⭐ 今日推荐论文**（当日综合评分最高的论文）
- 下方分四区展示：📄 最新论文 / 🤖 模型与产品 / 🏛️ 机构与政策 / 💰 产业与投资
- 评分颜色：8-10 分绿色 / 5-7 分黄色 / 低于 5 分灰色

### 周报 / 月报
- **趋势概述**：本周/本月整体动态
- **精选论文**：TOP 10-15 高分论文
- **文献综述**（三栏折叠面板）：
  - 🔬 前沿话题：当前最热的研究方向
  - ⚔️ 观点争锋：方法或理论上的分歧
  - ❓ 待解问题：领域内的开放难题

### 条目详情
- 点击任何卡片进入详情页
- 查看评分三维度明细、中文摘要、核心要点
- 🔗 查看原文 链接直达原始来源

### 归档搜索
- 按日期、类型、分类（AI4S/AI4SS/AI4R）、地域（中国/欧美/全球）、关键词筛选

---

## 十一、添加追踪关键词或数据源

编辑 `src/lib/fetchers/` 目录下的文件，修改后推送 GitHub，Railway 会自动重新部署。

- 论文关键词：编辑 `src/lib/fetchers/arxiv.ts` 的 `queries` 数组
- RSS 数据源：编辑 `src/lib/fetchers/rss-sources.ts` 的 `RSS_SOURCES` 数组

---

## 十二、常见问题

**Q: 网站没有内容？**
A: 需要定时任务触发数据采集。手动访问 `/api/cron/daily-fetch` 触发首次运行。

**Q: DeepSeek API 报错？**
A: 检查 Railway 环境变量中 DEEPSEEK_API_KEY 是否正确，账户余额是否充足。

**Q: 数据库连接失败？**
A: Railway 的 PostgreSQL 会自动注入 DATABASE_URL，无需手动配置。如果手动改了，用 Railway 提供的值。

**Q: 如何绑定自己的域名？**
A: 在 Railway 项目 Settings → Networking → Public Networking → Custom Domain 中配置。
