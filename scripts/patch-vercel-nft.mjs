From 8303ff13df898dc306008dcd1db4f2aef8804fd7 Mon Sep 17 00:00:00 2001
From: Claude < claude@anthropic.com>
  Date: Wed, 1 Jul 2026 14:04:07 +0000
Subject: [PATCH] chore: fix prettier formatting in patch - vercel - nft script

---
  scripts / patch - vercel - nft.mjs | 11 +++++ ------
    1 file changed, 5 insertions(+), 6 deletions(-)

diff--git a / scripts / patch - vercel - nft.mjs b / scripts / patch - vercel - nft.mjs
index 896608e..aa20d07 100644
--- a / scripts / patch - vercel - nft.mjs
+++ b / scripts / patch - vercel - nft.mjs
@@ -19, 10 + 19, 7 @@ import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
-const tracePath = resolve(
  -  root,
  -  "node_modules/nf3/dist/_chunks/trace.mjs"
  -);
+const tracePath = resolve(root, "node_modules/nf3/dist/_chunks/trace.mjs");

if (!existsSync(tracePath)) {
  console.log("nf3 trace.mjs not found — skipping patch.");
  @@ -40, 11 + 37, 13 @@ if (content.includes(patched)) {
  } else if (content.includes(original)) {
    content = content.replace(original, patched);
    writeFileSync(tracePath, content, "utf-8");
    -  console.log("✓ Patched nf3/dist/_chunks/trace.mjs — replaced static ESM import with createRequire.");
    +  console.log(
      +    "✓ Patched nf3/dist/_chunks/trace.mjs — replaced static ESM import with createRequire.",
      +  );
  } else {
    console.warn(
      "⚠  Could not find the expected import line in nf3/trace.mjs. " +
      -    "The patch may already be applied or the file format changed."
      + "The patch may already be applied or the file format changed.",
    );
  }

  --
    2.43.0

