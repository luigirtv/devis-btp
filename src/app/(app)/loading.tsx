/** Affiché dès le clic, pendant que la page se charge : l'utilisateur voit tout de suite que son appui a été pris en compte. */
export default function Chargement() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 md:px-8" aria-busy="true" aria-label="Chargement">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-ligne" />
      <div className="h-5 w-40 animate-pulse rounded-lg bg-ligne/70" />
      <div className="mt-4 h-24 animate-pulse rounded-2xl bg-ligne/60" />
      <div className="h-24 animate-pulse rounded-2xl bg-ligne/50" />
      <div className="h-24 animate-pulse rounded-2xl bg-ligne/40" />
    </div>
  );
}
