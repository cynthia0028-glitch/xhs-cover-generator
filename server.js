const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separator = trimmed.indexOf("=");
    if (separator === -1) return;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const OPENAI_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1536";
const MAX_BODY_BYTES = 70 * 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf"
};

function send(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("上传内容太大，请减少图片数量或压缩图片。"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(raw || "{}"));
      } catch (error) {
        reject(new Error("请求格式不正确。"));
      }
    });

    req.on("error", reject);
  });
}

function dataUrlToBlob(dataUrl, index) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl || "");
  if (!match) {
    throw new Error("图片格式不支持，请上传 JPG、PNG 或 WEBP。");
  }

  const mime = match[1].replace("image/jpg", "image/jpeg");
  const extension = mime.split("/")[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(match[2], "base64");
  return {
    blob: new Blob([buffer], { type: mime }),
    filename: `reference-${index + 1}.${extension}`
  };
}

async function callOpenAiImageEdit({ prompt, images }) {
  if (!OPENAI_API_KEY) {
    throw new Error("服务器还没有配置 OPENAI_API_KEY。");
  }

  const form = new FormData();
  form.append("model", OPENAI_IMAGE_MODEL);
  form.append("prompt", prompt);
  form.append("size", OPENAI_IMAGE_SIZE);
  form.append("output_format", "png");
  form.append("quality", "high");

  images.slice(0, 6).forEach((dataUrl, index) => {
    const image = dataUrlToBlob(dataUrl, index);
    form.append("image", image.blob, image.filename);
  });

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: form
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.error?.message || "AI 图片生成失败。";
    throw new Error(message);
  }

  const imageBase64 = result.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error("AI 没有返回图片数据。");
  }

  return `data:image/png;base64,${imageBase64}`;
}

async function handleGenerateCover(req, res) {
  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || "").trim();
    const images = Array.isArray(body.images) ? body.images : [];

    if (!prompt) {
      send(res, 400, "缺少封面提示词。");
      return;
    }
    if (!images.length) {
      send(res, 400, "请至少上传一张参考图片。");
      return;
    }

    const image = await callOpenAiImageEdit({ prompt, images });
    send(res, 200, JSON.stringify({ image }), "application/json; charset=utf-8");
  } catch (error) {
    send(res, 500, error.message || "服务器生成失败。");
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "Not found");
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/generate-cover") {
    handleGenerateCover(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  send(res, 405, "Method not allowed");
});

server.listen(PORT, () => {
  console.log(`XHS cover generator running at http://localhost:${PORT}`);
});
