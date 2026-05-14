import { createServerClient } from "@supabase/ssr";
import type { CookieOptions, SetAllCookies } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const responseCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        responseCookies.push(...cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/admin") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return finalizeResponse(NextResponse.redirect(loginUrl), responseCookies);
  }

  if (pathname === "/login" && user) {
    return finalizeResponse(NextResponse.redirect(new URL("/admin/intake", request.url)), responseCookies);
  }

  return finalizeResponse(
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    }),
    responseCookies
  );
}

function finalizeResponse<T extends NextResponse>(
  response: T,
  cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
