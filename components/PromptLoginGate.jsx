"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserAuth } from '@/components/user-auth-provider';

// Keep the public article/SEO visible; authentication gates the workspace, not
// the canonical page. Premium content still requires the backend entitlement.
export function PromptLoginGate({ children }) {
  const auth = useUserAuth();
  const pathname = usePathname();
  if (auth.ready && auth.isAuthenticated) return children;
  return <section className="prompt-workspace-panel" aria-label="Prompt access"><h2>Make this prompt yours</h2><p>Sign in to access this prompt, copy it, or choose an unlock option.</p><div><Link className="button" href={`/login?redirect=${encodeURIComponent(pathname || '/')}`}>Sign in to continue</Link></div></section>;
}
