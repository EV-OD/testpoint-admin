"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // This client is used for non-auth database queries.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
