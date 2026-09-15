import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthUser = { id: string; email: string | null };

/** Identité de l'utilisateur courant, vérifiée localement (signature du jeton) sans aller-retour réseau. */
export async function currentUser(supabase: SupabaseClient): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims as { sub?: string; email?: string } | undefined;
    if (!error && claims?.sub) return { id: claims.sub, email: claims.email ?? null };
  } catch {
    /* repli ci-dessous */
  }
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}
