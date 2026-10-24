import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("Oswald SemiBold n'affecte que les petits titres",()=>{
  const css=readFileSync(new URL("../public/styles.css",import.meta.url),"utf8");
  assert.match(css,/@font-face\s*\{[\s\S]*?font-family:"Oswald Local"/);
  assert.match(css,/\.page-detail \.page-subtitle,\s*\.block-label\s*\{[\s\S]*?font-weight:600/);
  assert.ok(!/body\s*\{[^}]*Oswald Local/.test(css));
  assert.ok(css.includes('"/fonts/oswald-latin-600-normal.woff2"'));
});
test("la police est copiée localement pendant le déploiement",()=>{
  const workflow=readFileSync(new URL("../.github/workflows/deploy-test.yml",import.meta.url),"utf8");
  const script=readFileSync(new URL("../scripts/copy-fonts.mjs",import.meta.url),"utf8");
  const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
  assert.ok(workflow.includes("npm run build:fonts"));
  assert.ok(script.includes("copyFile("));
  assert.ok(script.includes('"oswald-latin-600-normal.woff2"'));
  assert.ok(script.includes('"LICENSE"'));
  assert.ok(pkg.devDependencies["@fontsource/oswald"]);
});
