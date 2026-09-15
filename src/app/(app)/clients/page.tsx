import EnTete from "@/components/EnTete";
import ClientsClient from "@/components/ClientsClient";
import { exigerSession } from "@/lib/acces";
import type { Client } from "@/lib/types";

export default async function Clients() {
  const { supabase } = await exigerSession();
  const { data } = await supabase.from("clients").select("*").order("nom");
  return (
    <div>
      <EnTete titre="Mes clients" />
      <ClientsClient clients={(data ?? []) as Client[]} />
    </div>
  );
}
