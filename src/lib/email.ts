/** Envoi d'e-mails avec pièce jointe via Brevo. Sans BREVO_API_KEY, l'app propose le téléchargement du PDF. */
export function emailConfigure(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_EXPEDITEUR);
}

export async function envoyerEmail(args: {
  a: { email: string; nom: string };
  repondreA: { email: string; nom: string } | null;
  sujet: string;
  texte: string;
  pieceJointe: { nom: string; contenu: Buffer };
}): Promise<void> {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_EXPEDITEUR, name: args.repondreA?.nom || "Devis" },
      to: [args.a],
      replyTo: args.repondreA ?? undefined,
      subject: args.sujet,
      textContent: args.texte,
      attachment: [{ name: args.pieceJointe.nom, content: args.pieceJointe.contenu.toString("base64") }]
    })
  });
  if (!r.ok) throw new Error(`Envoi impossible (Brevo ${r.status}) : ${(await r.text()).slice(0, 200)}`);
}

export function nomFichierPdf(d: { type: string; numero: string | null; sous_type: string }): string {
  const base = d.type === "devis" ? "Devis" : d.sous_type === "avoir" ? "Avoir" : "Facture";
  return `${base}-${d.numero ?? "brouillon"}.pdf`;
}
