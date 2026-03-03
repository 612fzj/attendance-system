# 考勤管理系统

> 企业级考勤管理与报表系统，基于 Next.js + Supabase 开发

## 📱 系统功能

- ✅ 考勤打卡（上班/下班打卡）
- ✅ 考勤查询（按员工、日期范围查询）
- ✅ 请假管理（提交请假申请）
- ✅ 请假审批（管理员审批）
- ✅ 工作日报（每日工作总结）
- ✅ 周报自动生成
- ✅ 报表统计（月/周报）
- ✅ 系统管理（员工管理、规则配置）
- ✅ 密码修改（安全修改）

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| Next.js 15 | React 全栈框架 |
| React 19 | UI 库 |
| Supabase | 后端即服务（数据库+认证） |
| Tailwind CSS | 样式框架 |
| TypeScript | 类型安全 |

## 📁 项目结构

```
attendance-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # 带导航的页面
│   │   │   ├── page.tsx       # 首页
│   │   │   ├── attendance/    # 考勤模块
│   │   │   ├── leave/         # 请假模块
│   │   │   ├── daily-report/  # 工作日报
│   │   │   ├── reports/       # 报表统计
│   │   │   └── admin/         # 系统管理
│   │   ├── api/               # API 路由
│   │   ├── login/             # 登录页（独立布局）
│   │   └── layout.tsx         # 根布局
│   ├── components/            # 公共组件
│   └── lib/                   # 工具函数
│       └── supabase.ts        # Supabase 客户端
├── docs/                      # 文档与 SQL 脚本
├── public/                    # 静态资源
├── .env.local                 # 开发环境变量
├── .env.production            # 生产环境变量
├── vercel.json                # Vercel 配置
└── package.json
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/612fzj/attendance-system.git
cd attendance-system
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量文件并配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入您的 Supabase 配置：

```bash
# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=考勤管理系统

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 初始化数据库

在 Supabase SQL Editor 中执行 `docs/init.sql` 创建所需的数据库表。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 6. 测试账号

| 工号 | 密码 | 角色 |
|------|------|------|
| E001 | attendance2026 | 员工 |
| E002 | attendance2026 | 员工 |
| E003 | attendance2026 | 员工 |
| E004 | attendance2026 | 管理员 |

## 🌿 分支管理

采用 Git Flow 工作流：

| 分支 | 用途 | 说明 |
|------|------|------|
| `dev` | 开发分支 | 本地开发使用，完成功能后合并到 master |
| `master` | 发布分支 | 只有这个分支触发 Vercel 自动部署 |

### 开发流程

1. 在 `dev` 分支开发新功能
2. 测试完成后合并到 `master` 分支
3. 在 master 分支打上版本 tag（如 `v1.0.0`）
4. Vercel 自动部署生产版本

### 版本管理

使用 Git Tag 管理版本：

```bash
# 创建新版本
git tag -a v1.0.1 -m "版本 1.0.1"

# 推送版本到远程
git push origin v1.0.1
```

## ☁️ 部署到 Vercel

### 方式一：从 GitHub 部署（推荐）

1. 访问 [vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 "New Project" → 导入 `612fzj/attendance-system`
4. 在 **Environment Variables** 添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. 在 **Git** 设置中，将 **Production Branch** 设为 `master`
6. 点击 Deploy

### 方式二：Vercel CLI 部署

```bash
npm i -g vercel
vercel login
vercel
```

### 生产环境配置

部署后需要在 Supabase 后台添加允许的 URL：

1. 进入 Supabase → **Authentication** → **URL Configuration**
2. **Site URL** 填入：`https://your-project.vercel.app`
3. **Redirect URLs** 同样填入

## 📋 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | 系统访问地址 | http://localhost:3000 |
| `NEXT_PUBLIC_APP_NAME` | 系统名称 | 考勤管理系统 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目URL | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 密钥 | sb_xxx |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service 密钥 | eyJxxx |
| `NEXT_PUBLIC_ENV` | 环境标识 | development / production |

## 📄 许可证

MIT License

## 👤 作者

- GitHub: [612fzj](https://github.com/612fzj)

---

⭐ 如果对您有帮助，请给项目点个 star！