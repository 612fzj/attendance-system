# 考勤管理系统

## 快速开始

### 1. 配置 Supabase

1. 访问 [supabase.com](https://supabase.com) 创建项目
2. 在 Settings → API 中获取：
   - Project URL
   - `anon public` 密钥
   - `service_role` 密钥

3. 编辑 `.env.local` 文件，填入密钥：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. 创建数据库表

在 Supabase SQL Editor 中执行 `docs/init.sql` 创建表结构。

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 项目结构

```
attendance-system/
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/           # 工具函数
│       └── supabase.ts
├── docs/              # 文档与SQL脚本
├── public/            # 静态资源
└── .env.local         # 环境变量（本地）
```

## 功能模块

- [ ] 考勤打卡
- [ ] 请假管理
- [ ] 报表统计
