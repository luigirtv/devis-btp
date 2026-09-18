/**
 * Réglages SMTP déduits de l'adresse e-mail de l'artisan : il suffit de renseigner SMTP_USER et SMTP_PASS.
 * SMTP_HOST / SMTP_PORT permettent de forcer d'autres valeurs (boîte pro, hébergeur…).
 * Fichier sans import, partagé entre l'app et scripts/test-email.mjs.
 */
const SERVEURS: Record<string, { host: string; port: number }> = {
  "gmail.com": { host: "smtp.gmail.com", port: 465 },
  "googlemail.com": { host: "smtp.gmail.com", port: 465 },
  "orange.fr": { host: "smtp.orange.fr", port: 465 },
  "wanadoo.fr": { host: "smtp.orange.fr", port: 465 },
  "free.fr": { host: "smtp.free.fr", port: 465 },
  "sfr.fr": { host: "smtp.sfr.fr", port: 465 },
  "neuf.fr": { host: "smtp.sfr.fr", port: 465 },
  "bbox.fr": { host: "smtp.bbox.fr", port: 587 },
  "laposte.net": { host: "smtp.laposte.net", port: 465 },
  "yahoo.fr": { host: "smtp.mail.yahoo.com", port: 465 },
  "yahoo.com": { host: "smtp.mail.yahoo.com", port: 465 },
  "icloud.com": { host: "smtp.mail.me.com", port: 587 },
  "me.com": { host: "smtp.mail.me.com", port: 587 }
};
const MICROSOFT = ["live.fr", "live.com", "hotmail.fr", "hotmail.com", "outlook.fr", "outlook.com", "msn.com"];

export type ReglagesSmtp = { host: string; port: number; secure: boolean; user: string; pass: string; microsoft: boolean };

export function reglagesSmtp(env: Record<string, string | undefined>): ReglagesSmtp | null {
  const user = (env.SMTP_USER ?? "").trim();
  const pass = (env.SMTP_PASS ?? "").trim();
  if (!user || !pass) return null;
  const domaine = user.split("@")[1]?.toLowerCase() ?? "";
  const microsoft = MICROSOFT.includes(domaine);
  const connu = microsoft ? { host: "smtp-mail.outlook.com", port: 587 } : SERVEURS[domaine];
  const host = (env.SMTP_HOST ?? "").trim() || connu?.host;
  if (!host) return null;
  const port = Number(env.SMTP_PORT) || connu?.port || 465;
  return { host, port, secure: port === 465, user, pass, microsoft };
}

/** Message lisible à partir d'une erreur SMTP. */
export function expliquerErreurSmtp(e: unknown, r: Pick<ReglagesSmtp, "microsoft" | "host">): string {
  const err = e as { code?: string; responseCode?: number; response?: string; message?: string };
  const brut = `${err.response ?? ""} ${err.message ?? ""}`;
  if (/5\.7\.139|basic authentication is disabled/i.test(brut))
    return "Microsoft refuse ce type de connexion pour cette boîte (authentification simple désactivée). Il faut utiliser une autre adresse d'envoi, par exemple une adresse Gmail dédiée à l'entreprise.";
  if (err.code === "EAUTH" || err.responseCode === 535 || err.responseCode === 534)
    return r.microsoft
      ? "La boîte e-mail a refusé le mot de passe. Pour une adresse Microsoft, il faut activer la validation en deux étapes puis créer un « mot de passe d'application »."
      : "La boîte e-mail a refusé le mot de passe. Il faut un « mot de passe d'application » créé dans les réglages de sécurité de la boîte, pas le mot de passe habituel.";
  if (err.code === "ESOCKET" || err.code === "ECONNECTION" || err.code === "ETIMEDOUT" || err.code === "EDNS")
    return `Impossible de joindre le serveur d'envoi (${r.host}). Vérifiez SMTP_HOST et SMTP_PORT.`;
  return `L'envoi a échoué : ${(err.response || err.message || "erreur inconnue").slice(0, 200)}`;
}
