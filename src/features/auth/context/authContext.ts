import { createContext, useContext } from "react";

export interface AuthState {
  status: "loading" | "ready" | "unavailable";
  user: { id: string; email?: string } | null;
  callbackFailed: boolean;
}

export const AuthContext = createContext<AuthState>({
  status: "unavailable",
  user: null,
  callbackFailed: false,
});

export function useAuth() {
  return useContext(AuthContext);
}
