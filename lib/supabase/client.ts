// Cliente Supabase para uso desde el browser (Client Components)
// Usa la anon key (segura para exponer al cliente — RLS la protege).

import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
