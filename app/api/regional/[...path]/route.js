import { pricingCountryHeaders } from "@/lib/pricing-country";
import { apiUrl } from "@/utils/api";

export const dynamic = "force-dynamic";

function isAllowed(path, method) {
  if (method === "GET") {
    return /^public\/(prompts(?:\/[^/]+(?:\/metadata)?)?|categories)$/.test(path) ||
      /^user\/prompts\/[^/]+$/.test(path) ||
      /^payments\/(plans|credit-plans|wallet(?:\/ledger)?|orders|entitlements|subscriptions(?:\/[a-fA-F0-9]{24})?|access|pricing\/context)$/.test(path);
  }

  return method === "POST" && (
    /^public\/prompts\/[^/]+\/view$/.test(path) ||
    /^payments\/(checkout(?:\/(prompt|credits))?|verify|subscriptions(?:\/[a-fA-F0-9]{24}\/(?:verify|cancel))?|prompts\/[^/]+\/unlock)$/.test(path)
  );
}

async function proxy(request, { params }) {
  const { path: segments } = await params;
  const path = segments.join("/");

  if (segments.some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment)) || !isAllowed(path, request.method)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const headers = new Headers(pricingCountryHeaders(request.headers));
  for (const name of ["authorization", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const response = await fetch(apiUrl(`/api/${path}${new URL(request.url).search}`), {
      method: request.method,
      headers,
      ...(request.method === "POST" ? { body: await request.text() } : {}),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(12000)
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Cache-Control": "private, no-store",
        "Vary": "Authorization, X-Vercel-IP-Country, CF-IPCountry"
      }
    });
  } catch (_error) {
    return Response.json({ error: "Pricing service is temporarily unavailable." }, {
      status: 502,
      headers: { "Cache-Control": "private, no-store" }
    });
  }
}

export { proxy as GET, proxy as POST };
