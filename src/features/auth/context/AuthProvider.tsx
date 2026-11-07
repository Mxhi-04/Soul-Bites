import { useEffect, useState, type ReactNode } from "react";
import { AuthContext, type AuthState } from "./authContext";
import { authConfigured, loadAuth } from "../services/authService";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: authConfigured ? "loading" : "unavailable",
    user: null,
    callbackFailed: false,
  });

  useEffect(() => {
    if (!authConfigured) return;
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    void loadAuth()
      .then(({ client, callbackFailed }) => {
        if (!mounted) return;
        const { data } = client.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;
          const user = session
            ? { id: session.user.id, email: session.user.email }
            : null;
          setState({
            status: "ready",
            user,
            callbackFailed: event === "INITIAL_SESSION" && callbackFailed,
          });
        });
        unsubscribe = () => data.subscription.unsubscribe();
      })
      .catch(() => {
        if (mounted)
          setState({
            status: "unavailable",
            user: null,
            callbackFailed: false,
          });
      });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
