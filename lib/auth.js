import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE = "seyprompt_admin_token";

export async function getAdminToken() {
  return (await cookies()).get(AUTH_COOKIE)?.value || null;
}

export async function requireAdminToken() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/admin/login");
  }

  return token;
}

export const authCookieName = AUTH_COOKIE;
