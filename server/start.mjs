import { fileURLToPath } from "node:url";
import express from "express";
import deployment from "../vercel.json" with { type: "json" };
import { serveCommerce } from "./commerce/nodeAdapter.ts";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const index = fileURLToPath(new URL("../dist/index.html", import.meta.url));
const globalHeaders = deployment.headers.find(({ source }) => source === "/(.*)").headers;
const accountRoute = /^\/(?:admin|track(?:\/[^/]+)?)\/?$/;
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  for (const { key, value } of globalHeaders) res.set(key, value);
  if (accountRoute.test(req.path)) res.set("X-Robots-Tag", "noindex");
  next();
});
app.all("/api/commerce", (req, res) => serveCommerce(req, res));
app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));
app.use(express.static(dist));
app.get(/^\/(?:login\/?|admin\/?|track(?:\/[^/]+)?\/?)$/, (_req, res) => res.sendFile(index));

app.listen(Number(process.env.PORT || 8080), "0.0.0.0");
