import { chargerParametres, exigerSession, reponseErreur } from "@/lib/acces";
import { chargerDocument } from "@/lib/documents";
import { nomFichierPdf } from "@/lib/email";
import { clientDuDocument, genererPdf } from "@/lib/pdf/generer";

export const maxDuration = 30;

/** Le PDF du document. `?telecharger=1` force le téléchargement, sinon il s'affiche dans le navigateur. */
export async function GET(request: Request, { params }: RouteContext<"/api/documents/[id]/pdf">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const p = await chargerParametres();
    const d = await chargerDocument(supabase, id);
    const pdf = await genererPdf(d, p, await clientDuDocument(supabase, d));
    const telecharger = new URL(request.url).searchParams.get("telecharger") === "1";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename="${nomFichierPdf(d)}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return reponseErreur(e);
  }
}
