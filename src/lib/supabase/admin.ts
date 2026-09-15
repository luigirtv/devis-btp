import { createClient } from "@supabase/supabase-js";

/**
 * Client à clé de service : contourne la RLS. À n'utiliser QUE côté serveur,
 * après avoir vérifié soi-même les droits de l'appelant (voir `acces.ts`).
 */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
