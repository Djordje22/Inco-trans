import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * SSR-compatible Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes auth tokens via Next.js cookies.
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const cookieStore = cookies();

  return createServerClient(url, key!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll can throw when called from a Server Component (read-only).
          // The middleware handles the refresh in that case.
        }
      }
    }
  });
}
