import { CLIENTS_EXEMPLE, DEVIS_EXEMPLE, FACTURE_EXEMPLE, PARAMETRES_EXEMPLE } from "@/lib/exemple";
import { genererPdf } from "@/lib/pdf/generer";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Introuvable", { status: 404 });
  const url = new URL(request.url);
  const d = url.searchParams.get("facture") ? FACTURE_EXEMPLE : DEVIS_EXEMPLE;
  const p = url.searchParams.get("tva") ? { ...PARAMETRES_EXEMPLE, assujetti_tva: true, numero_tva: "FR 12 123456789" } : PARAMETRES_EXEMPLE;
  const pdf = await genererPdf(d, p, CLIENTS_EXEMPLE[0]);
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=apercu.pdf" } });
}
