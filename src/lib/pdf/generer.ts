import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import DocumentPdf from "./DocumentPdf";
import type { Client, ClientSnapshot, Document, Parametres } from "@/lib/types";

/** Client figé à la validation, sinon le client actuel (brouillons). */
export async function clientDuDocument(supabase: SupabaseClient, d: Document): Promise<ClientSnapshot | null> {
  if (d.client_snapshot) return d.client_snapshot;
  if (!d.client_id) return null;
  const { data } = await supabase.from("clients").select("*").eq("id", d.client_id).maybeSingle();
  return (data as Client | null) ?? null;
}

export async function genererPdf(d: Document, p: Parametres, client: ClientSnapshot | null): Promise<Buffer> {
  const buf = await renderToBuffer(createElement(DocumentPdf, { d, p, client }) as unknown as ReactElement<DocumentProps>);
  return Buffer.from(buf);
}
