import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { serveCommerce } from "./server/commerce/nodeAdapter.ts";

function commerceDevServer(env: Record<string, string | undefined>): Plugin {
  const middleware: Connect.NextHandleFunction = async (incoming, outgoing, next) => {
    const url = new URL(incoming.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/commerce") return next();

    await serveCommerce(incoming, outgoing, env, true);
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
