import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { CommerceEnv } from "./config.ts";
import { handleCommerce } from "./handler.ts";

export async function serveCommerce(
  incoming: IncomingMessage,
  outgoing: ServerResponse,
  env: CommerceEnv = process.env,
  allowPreview = false,
) {
  try {
    const url = new URL(incoming.url ?? "/", "http://localhost");
    const method = incoming.method ?? "GET";
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
    const init: RequestInit & { duplex?: "half" } = { method, headers };
    if (method !== "GET" && method !== "HEAD") {
      init.body = Readable.toWeb(incoming) as ReadableStream;
      init.duplex = "half";
    }
    const response = await handleCommerce(new Request(url, init), env, undefined, allowPreview);
    outgoing.statusCode = response.status;
    response.headers.forEach((value, key) => outgoing.setHeader(key, value));
    outgoing.end(await response.text());
  } catch {
    outgoing.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    outgoing.end(JSON.stringify({ error: "The order service is temporarily unavailable." }));
  }
}
