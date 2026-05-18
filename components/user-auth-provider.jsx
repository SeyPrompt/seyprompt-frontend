"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearUserAuth,
  getStoredUserAuth,
  saveUserAuth
} from "@/lib/user-auth";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuth(getStoredUserAuth());
    setReady(true);
  }, []);

  function login(authResponse) {
    const nextAuth = {
      token: authResponse.token,
      user: authResponse.user
    };

    saveUserAuth(nextAuth);
    setAuth(nextAuth);
  }

  function logout() {
    clearUserAuth();
    setAuth(null);
    router.replace("/login");
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
