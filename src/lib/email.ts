import nodemailer from "nodemailer";
import { expliquerErreurSmtp, reglagesSmtp } from "@/lib/smtp";

/**
 * Envoi des devis et factures avec le PDF joint. Deux modes, par ordre de préférence :
 *  - « smtp » : l'e-mail part de la propre boîte de l'artisan (SMTP_USER + SMTP_PASS, un mot de passe d'application).
 *    C'est bien lui l'expéditeur, et les boîtes Gmail/Outlook le rangent dans ses « Messages envoyés ».
 *  - « brevo » : prestataire d'envoi, si BREVO_API_KEY et EMAIL_EXPEDITEUR sont renseignés.
 * Sans configuration, l'app propose de télécharger le PDF et d'ouvrir la messagerie.
 */
export function modeEmail(): "smtp" | "brevo" | null {
  if (reglagesSmtp(process.env)) return "smtp";
  if (process.env.BREVO_API_KEY && process.env.EMAIL_EXPEDITEUR) return "brevo";
  return null;
}
export const emailConfigure = () => modeEmail() !== null;

/** Erreur dont le message peut être montré tel quel à l'utilisateur. */
export class ErreurEnvoi extends Error {
  readonly affichable = true; // repéré par reponseErreur sans dépendre du nom de classe (minifié en production)
}

type Envoi = {
  a: { email: string; nom: string };
  repondreA: { email: string; nom: string } | null;
  copieA?: string | null; // copie cachée : l'artisan garde une trace dans sa propre boîte
  sujet: string;
  texte: string;
  pieceJointe: { nom: string; contenu: Buffer };
};

export async function envoyerEmail(args: Envoi): Promise<void> {
  const copie = args.copieA && args.copieA.toLowerCase() !== args.a.email.toLowerCase() ? args.copieA : null;
  const smtp = reglagesSmtp(process.env);
  if (smtp) {
    const transport = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.pass }, connectionTimeout: 10_000, socketTimeout: 20_000 });
    try {
      await transport.sendMail({
        from: { name: args.repondreA?.nom || smtp.user, address: smtp.user },
        to: { name: args.a.nom, address: args.a.email },
        bcc: copie && copie.toLowerCase() !== smtp.user.toLowerCase() ? copie : undefined,
        replyTo: args.repondreA && args.repondreA.email.toLowerCase() !== smtp.user.toLowerCase() ? args.repondreA.email : undefined,
        subject: args.sujet,
        text: args.texte,
        attachments: [{ filename: args.pieceJointe.nom, content: args.pieceJointe.contenu, contentType: "application/pdf" }]
      });
    } catch (e) {
      console.error("SMTP", e);
      throw new ErreurEnvoi(expliquerErreurSmtp(e, smtp));
    } finally {
      transport.close();
    }
    return;
  }

  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_EXPEDITEUR, name: args.repondreA?.nom || "Devis" },
      to: [args.a],
      replyTo: args.repondreA ?? undefined,
      bcc: copie ? [{ email: copie }] : undefined,
      subject: args.sujet,
      textContent: args.texte,
      attachment: [{ name: args.pieceJointe.nom, content: args.pieceJointe.contenu.toString("base64") }]
    })
  });
  if (!r.ok) throw new ErreurEnvoi(`L'envoi a échoué (Brevo ${r.status}) : ${(await r.text()).slice(0, 200)}`);
}

export function nomFichierPdf(d: { type: string; numero: string | null; sous_type: string }): string {
  const base = d.type === "devis" ? "Devis" : d.sous_type === "avoir" ? "Avoir" : "Facture";
  return `${base}-${d.numero ?? "brouillon"}.pdf`;
}
