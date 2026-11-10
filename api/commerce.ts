import { handleCommerce } from "../server/commerce/handler.ts";

export function GET(request: Request) {
  return handleCommerce(request);
}

export function POST(request: Request) {
  return handleCommerce(request);
}
