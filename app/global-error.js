"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="section">
          <div className="container narrow">
            <h1>Something went wrong.</h1>
            <p className="muted">Please retry, or return to SeyPrompt in a moment.</p>
            <button className="button" onClick={reset} type="button">
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
