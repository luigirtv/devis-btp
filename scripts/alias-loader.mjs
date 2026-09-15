// Résout l'alias "@/…" (tsconfig paths) pour exécuter le code de src/ directement avec Node.
// Usage : node --import ./scripts/alias-loader.mjs --experimental-strip-types script.mjs
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("data:text/javascript," + encodeURIComponent(`
  const racine = ${JSON.stringify(pathToFileURL(process.cwd() + "/src/").href)};
  export async function resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const base = racine + specifier.slice(2);
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try { return await next(base + ext, context); } catch (e) { if (e?.code !== "ERR_MODULE_NOT_FOUND" && e?.code !== "ERR_UNSUPPORTED_DIR_IMPORT") throw e; }
      }
    }
    return next(specifier, context);
  }
`), import.meta.url);
