# (Insight Forge)

 是一个基于现代化技术栈构建的个人成长平台，旨在帮助用户高效地管理并进行深度学习。

🔗 **在线演示**: [https://insight-nest-llm.lovable.app/dashboard](https://insight-nest-llm.lovable.app/dashboard)

## ✨ 主要功能

- **📊 项目管理 (Projects)**
  - 创建并追踪个人学习项目
  - 详情视图 (`ProjectDetail`) 帮助把控项目进度
- **📝 灵感日志 (Journal)**
- **🤖 智能助手 (Journal Chat)**
  - 集成 AI 对话功能，辅助深度思考与内容创作
- **📚 学习中心 (Learning)**
  - 专属的学习模块，用于知识管理和技能追踪

## 🛠️ 技术栈
本项目采用当前流行的 React 生态系统构建：

- **核心框架**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式方案**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **状态管理**: [TanStack Query](https://tanstack.com/query/latest)
- **后端服务**: [Supabase](https://supabase.com/)
- **图标库**: [Lucide React](https://lucide.dev/)
- **路由**: React Router DOM

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Bboyjie/insight-forge.git
cd insight-forge
```

### 2. 安装依赖

本项目使用 `npm` 或 `bun` 进行包管理：

```bash
npm install
# 或者如果您使用 bun
bun install
```

### 3. 配置环境变量

在项目根目录下创建一个 `.env` 文件，并填入您的 Supabase 配置信息：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:8080` 即可看到项目。

## 📜 脚本说明

- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产环境版本
- `npm run lint`: 运行 ESLint 代码检查
- `npm run preview`: 预览构建后的应用

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进这个项目！

---

_Generated with ❤️ by Insight Forge Team_
