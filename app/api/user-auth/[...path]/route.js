import { apiUrl } from "@/utils/api";
import { loginProxyHeaders } from "@/lib/login-proxy";

export const dynamic = "force-dynamic";
const allowed = new Set(["register", "verify-email", "user/login", "user/google", "forgot-password", "reset-password"]);
export async function POST(request, { params }) {
  const { path } = await params;
  const route = path.join("/");
  const noStore = { "Cache-Control": "private, no-store" };
  if (!allowed.has(route)) return Response.json({ error: "Not found." }, { status: 404, headers: noStore });
  if (Number(request.headers.get("content-length")) > 16384) return Response.json({ error: "Request too large." }, { status: 413, headers: noStore });
  try {
    const raw = await request.text();
    if (raw.length > 16384) return Response.json({ error: "Request too large." }, { status: 413, headers: noStore });
    let body;
    try { body = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400, headers: noStore }); }
    const response = await fetch(apiUrl(`/api/auth/${route}`), {
      method: "POST", headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") || "",
        ...loginProxyHeaders(request.headers, `/${route}`, body),
      }, body: JSON.stringify(body), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(20000),
    });
    const headers = { ...noStore, "Content-Type": "application/json" };
    for (const name of ["retry-after", "ratelimit", "ratelimit-policy"]) {
      if (response.headers.has(name)) headers[name] = response.headers.get(name);
    }
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json({ error: "Authentication service is temporarily unavailable." }, { status: 502, headers: noStore });
  }
}
