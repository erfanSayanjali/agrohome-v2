import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public", "tinymce");

const tinymceRoot = dirname(require.resolve("tinymce/package.json"));

mkdirSync(join(root, "public"), { recursive: true });
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}
cpSync(tinymceRoot, dest, { recursive: true });
console.log(`Copied TinyMCE → ${dest}`);
