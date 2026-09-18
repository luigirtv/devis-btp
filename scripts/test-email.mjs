// Vérifie en dix secondes que la boîte e-mail de l'artisan accepte l'envoi : `npm run test:email`
// Lit SMTP_USER / SMTP_PASS (et SMTP_HOST / SMTP_PORT facultatifs) dans .env.local, puis s'envoie un e-mail d'essai.
import nodemailer from "nodemailer";
import { readFileSync } from "node:fs";
import { expliquerErreurSmtp, reglagesSmtp } from "../src/lib/smtp.ts";

const env = { ...process.env };
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const r = reglagesSmtp(env);
if (!r) {
  console.error("Renseignez SMTP_USER (son adresse) et SMTP_PASS (mot de passe d'application) dans .env.local.\nSi son adresse n'est pas chez un fournisseur connu, ajoutez aussi SMTP_HOST et SMTP_PORT.");
  process.exit(1);
}
console.log(`Boîte : ${r.user}\nServeur : ${r.host}:${r.port} (${r.secure ? "SSL" : "STARTTLS"})`);
const transport = nodemailer.createTransport({ host: r.host, port: r.port, secure: r.secure, auth: { user: r.user, pass: r.pass }, connectionTimeout: 10_000 });
try {
  await transport.verify();
  console.log("Connexion acceptée ✔");
  const info = await transport.sendMail({ from: r.user, to: r.user, subject: "Essai d'envoi – Mes devis et factures", text: "Si vous lisez ce message, l'envoi des devis et factures depuis votre boîte fonctionne." });
  console.log(`E-mail d'essai envoyé à ${r.user} ✔ (${info.response})\nRecopiez maintenant SMTP_USER et SMTP_PASS dans Vercel, puis redéployez.`);
} catch (e) {
  console.error(`\nÉCHEC : ${expliquerErreurSmtp(e, r)}\n(détail technique : ${e.code ?? ""} ${e.responseCode ?? ""} ${(e.response ?? e.message ?? "").slice(0, 200)})`);
  process.exitCode = 1;
} finally {
  transport.close();
}
