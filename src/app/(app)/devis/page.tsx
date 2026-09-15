import PageListe from "@/components/PageListe";

export default function Devis({ searchParams }: PageProps<"/devis">) {
  return <PageListe type="devis" searchParams={searchParams as Promise<{ statut?: string; q?: string }>} />;
}
