# downloads/ · 站内可运行包

这里放本站自制的「下载解压双击就能跑」的 Python 示例包（`.zip`）。
`deploy.ps1` 会把整个目录同步到 `dist/downloads/`，GitHub Pages 直接提供下载。

## 加一个包（与 `templates/说明.md` 配套）

1. 用 `templates/pack.cmd` 打包，得到 `<id>-v1.0.0.zip`；
2. 把 zip 放到本目录：`downloads/<id>-v1.0.0.zip`；
3. 在 `data/projects.json` 对应条目里填：

```jsonc
"artifact": {
  "url": "downloads/<id>-v1.0.0.zip",   // 站内相对路径，或 https 绝对地址
  "fileName": "<id>-v1.0.0.zip",
  "bytes": 5321,                         // zip 字节数
  "sha256": "…64 位十六进制…",           // pack.cmd 会打印
  "version": "1.0.0",
  "uploadedAt": "2026-10-19"
},
"runnable": {
  "level": "A",                          // A 纯标准库 / B 一个依赖 / C 需特殊环境
  "os": ["Windows 10/11"],
  "python": "3.8–3.12",
  "firstRunSeconds": 8,
  "verifiedAt": "2026-10-19",
  "verifiedBy": "Python 3.8.10 + Windows 11",
  "ciUrl": null
},
"runCommand": "python main.py",
"expectedOutput": "排序完成，结果已写入 output.txt"
```

4. 重新构建：`node scripts/build.js`。
   构建会校验 zip 是否真的存在、SHA256 格式、日期与字段类型；不通过就拒绝生成。
5. 首页会自动出现「可直接运行」筛选（没有包时自动隐藏），详情页自动出现下载卡。

## 规则

- **只放本站原创、可运行的包**，不要放第三方仓库代码。
- 每个包必须在本机 **Python 3.8** 跑过，`verifiedAt` / `verifiedBy` 写真实结果。
- 更新包不覆盖旧文件：发 `v1.0.1` 新 zip，旧 zip 保留。
