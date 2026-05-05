import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // Basic CSRF protection: for state-changing requests, require same-origin.
  // (Forms and server actions are POST; this blocks cross-site POST with foreign Origin.)
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      const host = request.headers.get("host");
      try {
        const originHost = new URL(origin).host;
        if (host && originHost !== host) {
          return new NextResponse("Forbidden", { status: 403 });
        }
      } catch {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  // Ensures the session cookie stays fresh for SSR pages.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

