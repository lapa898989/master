import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/** Есть ли сохранённая сессия в cookies (без сетевого запроса к GoTrue). */
function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

const PUBLIC_AUTH_GET_PATHS = ["/auth/login", "/auth/register", "/auth/forgot", "/auth/reset"] as const;

export async function middleware(request: NextRequest) {
  // Must pass full `request` — passing only headers breaks App Router matching (404 on Vercel).
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname.startsWith("/client") ||
    pathname.startsWith("/master") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/notifications");

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "middleware: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing"
    );
    return response;
  }

  // Страницы входа/регистрации без сессии: не дергаем getUser() — экономия RTT на каждый заход.
  const isPublicAuthGet =
    request.method === "GET" &&
    PUBLIC_AUTH_GET_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublicAuthGet && !hasSupabaseAuthCookies(request)) {
    return response;
  }

  // На публичных страницах не делаем тяжёлых auth-запросов — ускоряет загрузку.
  if (!isProtectedPath) {
    return response;
  }

  // Если нет cookies сессии — не делаем сетевой refresh в middleware.
  // Доступ/редиректы всё равно обработаются на уровне страниц через getSession()/requireRole().
  if (!hasSupabaseAuthCookies(request)) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  try {
    // getUser() делает сетевой запрос, но именно он «освежает» сессию и пишет новые cookies.
    await supabase.auth.getUser();
  } catch (e) {
    console.error("middleware: supabase.auth.getUser failed", e);
    return NextResponse.next({ request });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
