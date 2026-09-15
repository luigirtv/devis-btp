import { exigerSession, reponseErreur } from "@/lib/acces";
import { validerDocument } from "@/lib/documents";

/** Attribue le numéro définitif (et fige le client). */
export async function POST(_: Request, { params }: RouteContext<"/api/documents/[id]/valider">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    return Response.json(await validerDocument(supabase, id));
  } catch (e) {
    return reponseErreur(e);
  }
}
