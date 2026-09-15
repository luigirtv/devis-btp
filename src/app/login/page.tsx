import LoginForm from "./LoginForm";
import { IcoCasque } from "@/components/Icones";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-marine text-white">
          <IcoCasque width={44} height={44} />
        </div>
        <h1 className="text-3xl font-bold">Mes devis et factures</h1>
        <p className="mt-1 text-muet">Entrez vos identifiants pour ouvrir votre espace</p>
      </div>
      <LoginForm />
    </main>
  );
}
