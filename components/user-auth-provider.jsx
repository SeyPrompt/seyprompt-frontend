"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearUserAuth,
  fetchUserProfile,
  getStoredUserAuth,
  logoutUser,
  USER_AUTH_STORAGE_KEY,
  saveUserAuth
} from "@/lib/user-auth";
import {
  clearAnalyticsUserId,
  clearAnalyticsUserProperty,
  setAnalyticsUserIdFromHash,
  setAnalyticsUserProperty,
  trackEvent
} from "@/lib/analytics";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedAuth = getStoredUserAuth();
    setAuth(storedAuth);
    setReady(true);

    function syncAuth(event) {
      if (event.key === USER_AUTH_STORAGE_KEY || event.key === null) {
        setAuth(getStoredUserAuth());
      }
    }
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    if (!auth?.token) {
      return undefined;
    }

    let active = true;

    fetchUserProfile(auth.token)
      .then((profile) => {
        if (!active || !profile?.id) {
          return;
        }

        setAuth((currentAuth) => {
          if (!currentAuth?.token || currentAuth.token !== auth.token) {
            return currentAuth;
          }

          const nextAuth = {
            ...currentAuth,
            user: {
              ...currentAuth.user,
              ...profile
            }
          };

          saveUserAuth(nextAuth);
          return nextAuth;
        });
      })
      .catch((error) => {
        // Keep saved sessions during outages; clear only rejected credentials.
        if (active && error.status === 401) {
          clearUserAuth();
          setAuth(null);
          clearAnalyticsUserId();
          clearAnalyticsUserProperty();
        }
      });

    return () => {
      active = false;
    };
  }, [auth?.token]);

  function login(authResponse) {
    const nextAuth = {
      token: authResponse.token,
      user: authResponse.user
    };

    saveUserAuth(nextAuth);
    setAuth(nextAuth);
    // if backend provided a hashed user id, set it in analytics
    if (authResponse.hashedUserId) {
      setAnalyticsUserIdFromHash(authResponse.hashedUserId);
      setAnalyticsUserProperty(authResponse.hashedUserId);
    }
    trackEvent("login_completed", {
      auth_provider: authResponse.user?.authProvider || "password",
      user_role: authResponse.user?.role || "user"
    });
  }

  async function logout() {
    const token = auth?.token;
    trackEvent("logout_completed");
    clearUserAuth();
    setAuth(null);
    router.replace("/login");
    // clear analytics user id when logging out
    clearAnalyticsUserId();
    clearAnalyticsUserProperty();
    if (token) {
      try {
        await logoutUser(token);
      } catch (error) {
        if (error.status !== 401) {
          console.error("Unable to revoke the server session during logout.", error);
        }
      }
    }
  }

  const value = useMemo(
    () => ({
      ready,
      token: auth?.token || null,
      user: auth?.user || null,
      isAuthenticated: Boolean(auth?.token && auth?.user),
      login,
      logout
    }),
    [auth, ready]
  );

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);

  if (!context) {
    throw new Error("useUserAuth must be used within UserAuthProvider.");
  }

  return context;
}
