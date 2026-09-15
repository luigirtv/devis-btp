"use client";
import { useEffect } from "react";
import { IcoCroix } from "@/components/Icones";

/** Fenêtre simple, plein écran sur téléphone. Fermeture par la croix, Échap ou le fond. */
export default function Modale({ titre, ouvert, fermer, children, large = false }: { titre: string; ouvert: boolean; fermer: () => void; children: React.ReactNode; large?: boolean }) {
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ouvert, fermer]);
  if (!ouvert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-encre/50 md:items-center md:p-6" onClick={fermer} role="dialog" aria-modal="true" aria-label={titre}>
      <div className={`flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-carte shadow-2xl md:rounded-3xl ${large ? "md:max-w-3xl" : "md:max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ligne px-5 py-4">
          <h2 className="text-xl font-bold">{titre}</h2>
          <button type="button" onClick={fermer} className="flex h-11 w-11 items-center justify-center rounded-full bg-fond text-muet hover:text-encre" aria-label="Fermer">
            <IcoCroix />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>{children}</div>
      </div>
    </div>
  );
}

/** Demande de confirmation avant une action qui ne se rattrape pas. */
export function Confirmation({ ouvert, titre, message, libelleOui = "Oui, confirmer", danger = false, enCours = false, oui, non }: { ouvert: boolean; titre: string; message: React.ReactNode; libelleOui?: string; danger?: boolean; enCours?: boolean; oui: () => void; non: () => void }) {
  return (
    <Modale titre={titre} ouvert={ouvert} fermer={non}>
      <div className="text-lg">{message}</div>
      <div className="mt-6 flex flex-col gap-3 md:flex-row-reverse">
        <button type="button" className={`${danger ? "btn-danger" : "btn-primaire"} flex-1`} onClick={oui} disabled={enCours}>{enCours ? "Un instant…" : libelleOui}</button>
        <button type="button" className="btn-secondaire flex-1" onClick={non} disabled={enCours}>Non, annuler</button>
      </div>
    </Modale>
  );
}
