/**
 * Patches nf3's trace.mjs to fix the ESM named import from @vercel/nft.
 *
 * The problem:
 *   nf3/dist/_chunks/trace.mjs does:
 *     import { nodeFileTrace } from "@vercel/nft";
 *
 *   But @vercel/nft is CJS-only. Static ESM named imports from CJS modules
 *   fail in Node.js when the module doesn't expose named exports statically.
 *
 * The fix:
 *   Replace the broken static import with a require() call using the
 *   createRequire that nf3 already imports from "node:module".
 *   This is 100% equivalent at runtime and avoids the ESM interop issue.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const tracePath = resolve(
  root,
  "node_modules/nf3/dist/_chunks/trace.mjs"
);

if (!existsSync(tracePath)) {
  console.log("nf3 trace.mjs not found — skipping patch.");
  process.exit(0);
}

const original = `import { nodeFileTrace } from "@vercel/nft";`;
const patched = `// patched by scripts/patch-vercel-nft.mjs — use createRequire to avoid ESM named import issue
const { nodeFileTrace } = createRequire(import.meta.url)("@vercel/nft");`;

let content = readFileSync(tracePath, "utf-8");

if (content.includes(patched)) {
  console.log("  nf3/trace.mjs already patched, skipping.");
} else if (content.includes(original)) {
  content = content.replace(original, patched);
  writeFileSync(tracePath, content, "utf-8");
  console.log("✓ Patched nf3/dist/_chunks/trace.mjs — replaced static ESM import with createRequire.");
} else {
  console.warn(
    "⚠  Could not find the expected import line in nf3/trace.mjs. " +
    "The patch may already be applied or the file format changed."
  );
}

console.log("Done — nf3 is now compatible with @vercel/nft CJS exports.");
