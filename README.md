# 爆款封面生成器

这是一个可以公开部署的前后端项目。前端负责上传图片、输入标题和选择风格；后端保存 API key，并调用 OpenAI 图片接口生成完整封面。

## 本地运行

1. 复制环境变量示例：

```powershell
Copy-Item .env.example .env
```

2. 在 `.env` 里填写你的 `OPENAI_API_KEY`。

3. 启动服务：

```powershell
npm start
```

如果本机没有 npm，也可以直接运行：

```powershell
node server.js
```

4. 打开：

```text
http://localhost:3000
```

## 部署到公开网页

可以部署到 Render、Railway、Fly.io、Vercel Serverless 或任意 Node.js 服务器。

部署时只需要把 `OPENAI_API_KEY` 配到平台的环境变量里，不要写进前端代码。

## 安全提醒

- 不要把 `.env` 上传到公开仓库。
- API key 只放后端环境变量。
- 公开使用时建议增加登录、额度限制和图片大小限制，避免被大量调用。
