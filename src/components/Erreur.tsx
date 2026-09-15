export default function Erreur({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="rounded-xl bg-erreur-fond px-4 py-3 text-base font-medium text-erreur">{message}</p>;
}
