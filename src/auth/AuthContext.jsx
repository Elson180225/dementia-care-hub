import { createContext, useContext, useEffect, useState } from "react";
import { createIdleSession } from "./idleSession";
import { api, post, setCsrfToken } from "../shared/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    api("/auth/me")
      .then((d) => {
        setUser(d.user);
        setCsrfToken(d.csrfToken);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    let disposed = false;
    const clearSession = () => {
      if (disposed) return;
      setUser(null);
      setCsrfToken(null);
      setError(
        "You were signed out after 5 minutes of inactivity. Please sign in again.",
      );
    };
    const controller = createIdleSession({
      onActivity: () => {
        post("/auth/activity").catch((e) => {
          if (e.status === 401) clearSession();
        });
      },
      onExpire: () => {
        post("/auth/logout").catch(() => {});
        clearSession();
      },
    });
    const activity = (e) => {
      if (e.isTrusted) controller.activity();
    };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    for (const name of events)
      window.addEventListener(name, activity, { passive: true, capture: true });
    const check = () => controller.check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      disposed = true;
      controller.stop();
      for (const name of events)
        window.removeEventListener(name, activity, true);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [user]);
  async function login(email, password) {
    const d = await post("/auth/login", { email, password });
    setUser(d.user);
    setCsrfToken(d.csrfToken);
    setError("");
    return d.user;
  }
  async function logout() {
    try {
      await post("/auth/logout");
    } finally {
      setUser(null);
      setCsrfToken(null);
    }
  }
  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
