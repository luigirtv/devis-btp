import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nodemailer s'appuie sur les modules réseau de Node : on le laisse hors du bundle serveur.
  serverExternalPackages: ["nodemailer"]
};

export default nextConfig;
