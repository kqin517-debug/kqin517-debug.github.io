# 开源拾遗 · Open Source Picks

一个收集 GitHub 好用开源项目的静态站点：把真正解决问题的工具捡回来，附上中文简介和直达链接，拿来即用。

- 线上地址：https://kqin517-debug.github.io/
- 纯静态站点，无构建步骤、无后端依赖
- 温暖纸张底色、中文衬线排版、深色模式、完整移动端适配

## 本地预览

```bash
python -m http.server 8080
# 打开 http://localhost:8080
```

## 发布

把本目录（`index.html` + `assets/`）的内容上传到 GitHub 仓库
`kqin517-debug/kqin517-debug.github.io` 的 `main` 分支，GitHub Pages 会自动重新发布，
通常 1 分钟内生效。

## 修改内容

- 项目数据：`assets/js/projects.js`
- 页面结构 / 文案：`index.html`
- 配色与样式：`assets/css/style.css`、`assets/css/projects.css`
