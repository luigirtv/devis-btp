import PageListe from "@/components/PageListe";

export default function Factures({ searchParams }: PageProps<"/factures">) {
  return <PageListe type="facture" searchParams={searchParams as Promise<{ statut?: string; q?: string }>} />;
}
