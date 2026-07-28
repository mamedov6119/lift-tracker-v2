import { useCallback, useEffect, useState } from "react";
import { api, UnauthorizedError } from "../lib/api.js";

// Session state for the whole app. The token itself is an httpOnly cookie, so
// there is nothing to store here — `user` is just what the server says when
// asked, and `null` means signed out.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch((err) => {
        // A 401 is the normal signed-out answer, not an error worth surfacing.
        if (!(err instanceof UnauthorizedError)) console.error(err);
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (credentials) => {
    setUser(await api.login(credentials));
  }, []);

  const signup = useCallback(async (credentials) => {
    setUser(await api.signup(credentials));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // Drop the local session even if the request failed — the cookie may
      // already be gone, and staying "signed in" in the UI would be worse.
      setUser(null);
    }
  }, []);

  // Called when any API request comes back 401: the session expired or was
  // revoked from another device, so fall back to the sign-in screen.
  const onSessionLost = useCallback(() => setUser(null), []);

  return { user, checking, login, signup, logout, onSessionLost };
}
