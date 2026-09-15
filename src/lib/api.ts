"use client";

/** Appel JSON vers nos routes API ; lève une Error avec un message lisible. */
export async function appeler<T = unknown>(url: string, method: "GET" | "POST" | "PATCH" | "DELETE" = "GET", corps?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, { method, headers: corps !== undefined ? { "Content-Type": "application/json" } : undefined, body: corps !== undefined ? JSON.stringify(corps) : undefined });
  } catch {
    throw new Error("Pas de connexion internet. Vérifiez votre réseau et réessayez.");
  }
  const texte = await r.text();
  let json: { error?: string } & Record<string, unknown> = {};
  try {
    json = texte ? JSON.parse(texte) : {};
  } catch {
    /* réponse non JSON */
  }
  if (!r.ok) throw new Error(json.error ?? `Erreur ${r.status}`);
  return json as T;
}
