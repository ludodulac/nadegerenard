import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=name=>readFileSync(new URL("../public/"+name,import.meta.url),"utf8");

test("la galerie montre un statut enregistré à la place de Aucun fichier choisi",()=>{
  const admin=file("admin.js");
  assert.ok(admin.includes('✓ Photographie déjà enregistrée'));
  assert.ok(admin.includes('Remplacer la photographie'));
  assert.ok(admin.includes('class="visually-hidden-file"'));
  assert.ok(admin.includes('data-project-photo-pick'));
  assert.ok(admin.includes('input?.click()'));
});
test("ouvrir une fiche depuis une galerie sauvegarde les modifications avant la navigation",()=>{
  const admin=file("admin.js");
  assert.match(admin,/if\(dirty\)await save\(\);\s*await saveProject\(id\);\s*select\(id\);/);
});
test("légendes visibles, mais facultatives, dans le site et l'aperçu privé",()=>{
  const admin=file("admin.js"),site=file("site.js"),css=file("styles.css");
  assert.ok(admin.includes('Texte affiché sous la photographie (facultatif)'));
  assert.ok(admin.includes('b.caption??b.alt??""'));
  assert.ok(admin.includes('figcaption class="image-caption"'));
  assert.ok(site.includes('b.caption??b.alt??""'));
  assert.ok(site.includes('figcaption class="image-caption"'));
  assert.ok(css.includes('.image-caption{'));
});
