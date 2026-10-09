"use client";

import { useEffect, useRef, useState } from "react";

const googleScriptSrc = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector(`script[src="${googleScriptSrc}"]`);

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = googleScriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function GoogleLoginButton({
  disabled = false,
  onCredential,
  onError,
  text = "signin_with"
}) {
  const buttonRef = useRef(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const label = text === "signup_with" ? "Sign up with Google" : "Sign in with Google";

  useEffect(() => {
    let active = true;

    if (!clientId || disabled) {
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential(response.credential);
              return;
            }

            onError?.(new Error("Google did not return a credential."));
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_blue",
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "left",
          width: buttonRef.current.offsetWidth || 320,
        });
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          onError?.(new Error("Unable to load Google sign in."));
        }
      });

    return () => {
      active = false;
    };
  }, [clientId, disabled, onCredential, onError, text]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="google-login-block">
      <div className="auth-divider"><span>or</span></div>
      <div className={`google-login-button${disabled ? " disabled" : ""}`}>
        <div className="google-login-surface" aria-hidden="true">
          <span className="google-login-logo">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
                fill="#EA4335"
              />
            </svg>
          </span>
          <span>{label}</span>
        </div>
        <div
          aria-disabled={disabled}
          className="google-login-native"
          ref={buttonRef}
        />
      </div>
      {loadFailed ? <p className="error-text auth-message">Google sign in could not load.</p> : null}
    </div>
  );
}
