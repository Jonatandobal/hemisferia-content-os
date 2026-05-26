// Cliente Supabase con service_role key — SOLO server-side.
// Bypassa RLS. Usar SOLO en API routes/cron jobs internos.
// NUNCA importar este archivo desde un Client Component.

import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
