import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/prijava?error=missing_code`);
  }

  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabase = createServerClient(url, key!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(`${origin}/prijava?error=auth_failed`);
  }

  // Check for referral code in user metadata and create referral record
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const refCode = user?.user_metadata?.referral_code;
    if (user && refCode) {
      const admin = getSupabaseAdminClient();
      if (admin) {
        // Find the referrer by their referral_code
        const { data: referrer } = await admin
          .from("profiles")
          .select("id")
          .eq("referral_code", refCode)
          .maybeSingle();

        if (referrer && referrer.id !== user.id) {
          // Check if referral already exists for this referred user
          const { data: existing } = await admin
            .from("referrals")
            .select("id")
            .eq("referred_id", user.id)
            .maybeSingle();

          if (!existing) {
            await admin.from("referrals").insert({
              referrer_id: referrer.id,
              referred_id: user.id,
              status: "pending_whatsapp_phone"
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Referral linking failed:", e);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
