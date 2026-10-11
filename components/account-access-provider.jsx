"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useUserAuth } from "@/components/user-auth-provider";
import { buildPromptAccessState, isPromptUnlockedForAccess } from "@/lib/account-access";
import { fetchMyEntitlements, fetchMyPaymentOrders } from "@/lib/payments";
import { getPromptPricingType } from "@/lib/prompt-pricing";

const emptyAccessState = {
  hasAllAccess: false,
  promptKeys: new Set()
};

const AccountAccessContext = createContext(null);

export function AccountAccessProvider({ children }) {
  const auth = useUserAuth();
  const [accessState, setAccessState] = useState(emptyAccessState);
  const [loading, setLoading] = useState(false);

  const refreshAccess = useCallback(async () => {
    if (!auth.ready || !auth.token) {
      setAccessState(emptyAccessState);
      setLoading(false);
      return emptyAccessState;
    }

    setLoading(true);

    try {
      const [entitlements, orders] = await Promise.all([
        fetchMyEntitlements(auth.token).catch(() => []),
        fetchMyPaymentOrders(auth.token).catch(() => [])
      ]);
      const nextAccessState = buildPromptAccessState({ entitlements, orders });

      setAccessState(nextAccessState);
      return nextAccessState;
    } finally {
      setLoading(false);
    }
  }, [auth.ready, auth.token]);

  useEffect(() => {
    let active = true;

    async function syncAccess() {
      if (!auth.ready || !auth.token) {
        if (active) {
          setAccessState(emptyAccessState);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const [entitlements, orders] = await Promise.all([
          fetchMyEntitlements(auth.token).catch(() => []),
          fetchMyPaymentOrders(auth.token).catch(() => [])
        ]);

        if (active) {
          setAccessState(buildPromptAccessState({ entitlements, orders }));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    syncAccess();

    return () => {
      active = false;
    };
  }, [auth.ready, auth.token]);

  const value = useMemo(
    () => ({
      accessState,
      hasAllAccess: accessState.hasAllAccess,
      isPromptUnlocked(prompt) {
        return isPromptUnlockedForAccess(prompt, accessState, getPromptPricingType(prompt));
      },
      loading,
      refreshAccess
    }),
    [accessState, loading, refreshAccess]
  );

  return (
    <AccountAccessContext.Provider value={value}>
      {children}
    </AccountAccessContext.Provider>
  );
}

export function useAccountAccess() {
  const context = useContext(AccountAccessContext);

  if (!context) {
    throw new Error("useAccountAccess must be used within AccountAccessProvider.");
  }

  return context;
}
