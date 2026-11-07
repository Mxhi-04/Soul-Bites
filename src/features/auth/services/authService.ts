const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const authConfigured = Boolean(
  supabaseUrl &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl) &&
    publishableKey?.startsWith("sb_publishable_"),
);

async function connectAuth() {
  if (!authConfigured || !supabaseUrl || !publishableKey) {
    throw new Error("Sign-in is unavailable.");
  }
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { flowType: "pkce", detectSessionInUrl: false },
  });

  let callbackFailed = false;
  const url = new URL(window.location.href);
  if (/^\/login\/?$/.test(url.pathname)) {
    const code = url.searchParams.get("code");
    const fragment = new URLSearchParams(url.hash.slice(1));
    callbackFailed = url.searchParams.has("error") || fragment.has("error");
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      callbackFailed = Boolean(error);
    }
    if (code || callbackFailed) window.history.replaceState(null, "", "/login");
  }
  return { client, callbackFailed };
}

let connection: ReturnType<typeof connectAuth> | undefined;

export function loadAuth() {
  connection ??= connectAuth().catch((error: unknown) => {
    connection = undefined;
    throw error;
  });
  return connection;
}

export async function sendSignInLink(email: string) {
  const { client } = await loadAuth();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: new URL("/login", window.location.origin).href,
    },
  });
  if (error) {
    throw new Error(
      error.status === 429
        ? "Please wait a minute before requesting another link."
        : "We couldn't send a link. Check the email address and try again.",
    );
  }
}

export async function signOut() {
  const { client } = await loadAuth();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("We couldn't sign you out. Please try again.");
}
