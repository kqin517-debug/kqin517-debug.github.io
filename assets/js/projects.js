/* ==========================================================================
   开源拾遗 · 项目数据
   新增项目：在 PROJECTS 数组里加一条即可（首页会自动渲染卡片、分类和数量）。
   字段说明：
     name        项目名（显示在卡片标题）
     repo        owner/repo
     url         GitHub 仓库地址
     category    分类（需与 chips 自动生成一致）
     tone        配色 1–6，对应 projects.css 里的 .tone-*
     initial     卡片上的两字母标记
     desc        中文简介（一句话）
     tags        标签数组（2–3 个）
     language    主要语言
     langColor   语言色点颜色
     stars       Star 大致数量（展示用）
   ========================================================================== */
window.PROJECTS = [
  {
    name: "RSSHub",
    repo: "DIYgod/RSSHub",
    url: "https://github.com/DIYgod/RSSHub",
    category: "效率工具",
    tone: 1,
    initial: "RS",
    desc: "把几乎所有网站都变成 RSS 订阅源。可以用公共实例，也可以自己部署一份。",
    tags: ["RSS", "自托管", "Node"],
    language: "TypeScript",
    langColor: "#3178c6",
    stars: "3.9 万+"
  },
  {
    name: "LocalSend",
    repo: "localsend/localsend",
    url: "https://github.com/localsend/localsend",
    category: "效率工具",
    tone: 1,
    initial: "LS",
    desc: "跨平台局域网传文件，手机、电脑互传不经过云端，也不用注册登录。",
    tags: ["文件传输", "跨平台", "Flutter"],
    language: "Dart",
    langColor: "#00B4AB",
    stars: "6.5 万+"
  },
  {
    name: "Immich",
    repo: "immich-app/immich",
    url: "https://github.com/immich-app/immich",
    category: "自托管",
    tone: 2,
    initial: "IM",
    desc: "自托管的照片备份方案，移动端自动上传，界面和体验都很接近 Google Photos。",
    tags: ["相册", "备份", "Docker"],
    language: "TypeScript",
    langColor: "#3178c6",
    stars: "7.5 万+"
  },
  {
    name: "Uptime Kuma",
    repo: "louislam/uptime-kuma",
    url: "https://github.com/louislam/uptime-kuma",
    category: "自托管",
    tone: 2,
    initial: "UK",
    desc: "一条 Docker 命令就能跑起来的监控面板，HTTP、TCP、Ping 和多种告警方式都支持。",
    tags: ["监控", "告警", "Docker"],
    language: "JavaScript",
    langColor: "#f1e05a",
    stars: "7 万+"
  },
  {
    name: "shadcn/ui",
    repo: "shadcn-ui/ui",
    url: "https://github.com/shadcn-ui/ui",
    category: "前端开发",
    tone: 3,
    initial: "SH",
    desc: "不是组件库，而是把组件源码复制进你的项目。基于 Radix 和 Tailwind，想怎么改就怎么改。",
    tags: ["React", "组件", "可定制"],
    language: "TypeScript",
    langColor: "#3178c6",
    stars: "9 万+"
  },
  {
    name: "Tailwind CSS",
    repo: "tailwindlabs/tailwindcss",
    url: "https://github.com/tailwindlabs/tailwindcss",
    category: "前端开发",
    tone: 3,
    initial: "TW",
    desc: "原子化 CSS，把样式写在结构旁边。设计系统、响应式和暗色模式都能顺手做完。",
    tags: ["CSS", "设计系统", "工具链"],
    language: "TypeScript",
    langColor: "#3178c6",
    stars: "8.7 万+"
  },
  {
    name: "developer-roadmap",
    repo: "kamranahmedse/developer-roadmap",
    url: "https://github.com/kamranahmedse/developer-roadmap",
    category: "学习资源",
    tone: 4,
    initial: "DR",
    desc: "前端、后端、DevOps 的学习路线图，适合用来对照自己的知识缺口。",
    tags: ["路线图", "前端", "面试"],
    language: "TypeScript",
    langColor: "#3178c6",
    stars: "30 万+"
  },
  {
    name: "free-programming-books",
    repo: "EbookFoundation/free-programming-books",
    url: "https://github.com/EbookFoundation/free-programming-books",
    category: "学习资源",
    tone: 4,
    initial: "FP",
    desc: "免费编程书籍清单，按语言和主题分类，中文资源也有不少。",
    tags: ["书单", "免费", "多语言"],
    language: "Markdown",
    langColor: "#083fa1",
    stars: "35 万+"
  },
  {
    name: "Ollama",
    repo: "ollama/ollama",
    url: "https://github.com/ollama/ollama",
    category: "AI 与数据",
    tone: 5,
    initial: "OL",
    desc: "一条命令在本机跑 Llama、Qwen、DeepSeek 等模型，适合本地实验和隐私敏感场景。",
    tags: ["本地模型", "CLI", "推理"],
    language: "Go",
    langColor: "#00ADD8",
    stars: "12 万+"
  },
  {
    name: "LangChain",
    repo: "langchain-ai/langchain",
    url: "https://github.com/langchain-ai/langchain",
    category: "AI 与数据",
    tone: 5,
    initial: "LC",
    desc: "构建 LLM 应用的开发框架，链式调用、工具、RAG 都有现成组件，适合快速搭原型。",
    tags: ["LLM", "Agent", "RAG"],
    language: "Python",
    langColor: "#3572A5",
    stars: "11 万+"
  },
  {
    name: "lazygit",
    repo: "jesseduffield/lazygit",
    url: "https://github.com/jesseduffield/lazygit",
    category: "开发工具",
    tone: 6,
    initial: "LG",
    desc: "终端里的 Git 图形界面，提交、切分支、rebase 都能用键盘完成。",
    tags: ["Git", "TUI", "效率"],
    language: "Go",
    langColor: "#00ADD8",
    stars: "6 万+"
  },
  {
    name: "ripgrep",
    repo: "BurntSushi/ripgrep",
    url: "https://github.com/BurntSushi/ripgrep",
    category: "开发工具",
    tone: 6,
    initial: "RG",
    desc: "比 grep 快一个数量级的搜索工具，默认跳过 .gitignore 里的文件。",
    tags: ["CLI", "搜索", "Rust"],
    language: "Rust",
    langColor: "#DEA584",
    stars: "5.5 万+"
  }
];
