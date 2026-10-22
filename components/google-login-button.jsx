"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleIdentity, renderGoogleIdentityButton } from "@/lib/google-identity";

export function GoogleLoginButton({ disabled = false, onCredential, onError, text = "signin_with" }) {
  const buttonRef = useRef(null);
  const handlers = useRef({ onCredential, onError, disabled });
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    handlers.current = { onCredential, onError, disabled };
  }, [onCredential, onError, disabled]);

  useEffect(() => {
    if (!clientId) return undefined;
    let active = true;
    let dispose;
    setStatus("loading");
    loadGoogleIdentity().then((api) => {
      if (!active || !buttonRef.current) return;
      dispose = renderGoogleIdentityButton(api, {
        container: buttonRef.current, clientId, text,
        onCredential: (credential) => {
          if (!handlers.current.disabled) handlers.current.onCredential(credential);
        },
        onError: (error) => handlers.current.onError?.(error),
      });
      setStatus("ready");
    }).catch((error) => {
      if (!active) return;
      setStatus("error");
      handlers.current.onError?.(error);
    });
    return () => { active = false; dispose?.(); };
  }, [clientId, text, attempt]);

  if (!clientId) return null;
  return (
    <div className="google-login-block">
      <div className="auth-divider"><span>or</span></div>
      <div className={`google-login-button${disabled ? " disabled" : ""}`} aria-disabled={disabled} inert={disabled}>
        <div className="google-login-native" ref={buttonRef} />
      </div>
      {status === "loading" ? <p className="auth-message" role="status">Loading Google sign-in…</p> : null}
      {status === "error" ? (
        <div className="auth-message" role="alert">
          <p className="error-text">Google sign-in couldn’t load. Check your connection or browser blockers.</p>
          <button className="button-secondary compact" disabled={disabled} onClick={() => setAttempt((value) => value + 1)} type="button">Retry Google sign-in</button>
        </div>
      ) : null}
    </div>
  );
}
