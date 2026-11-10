import { Readable } from "node:stream";
import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { handleCommerce } from "./server/commerce/handler.ts";

function commerceDevServer(env: Record<string, string | undefined>): Plugin {
  const middleware: Connect.NextHandleFunction = async (incoming, outgoing, next) => {
    const url = new URL(incoming.url ?? "/", `http://${incoming.headers.host ?? "localhost"}`);
    if (url.pathname !== "/api/commerce") return next();

    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
      const method = incoming.method ?? "GET";
      const init: RequestInit & { duplex?: "half" } = { method, headers };
      if (method !== "GET" && method !== "HEAD") {
        init.body = Readable.toWeb(incoming) as ReadableStream;
        init.duplex = "half";
      }
      const response = await handleCommerce(new Request(url, init), env);
      outgoing.statusCode = response.status;
      response.headers.forEach((value, key) => outgoing.setHeader(key, value));
      outgoing.end(await response.text());
    } catch {
      outgoing.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      outgoing.end(JSON.stringify({ error: "The order service is temporarily unavailable." }));
    }
  };

  return {
    name: "soul-bites-commerce",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), commerceDevServer({ ...loadEnv(mode, process.cwd(), ""), ...process.env })],
  server: { port: 3000, strictPort: true },
}));
