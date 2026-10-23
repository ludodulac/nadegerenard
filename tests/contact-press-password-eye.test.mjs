import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const publicCSS=source("public/styles.css");
const publicJS=source("public/site.js");
const adminCSS=source("public/admin.css");
const adminJS=source("public/admin.js");
const adminHTML=source("public/administration/index.html");

test("sur ordinateur, titres Presse lisibles à 16px gras y compris dans l'administration",()=>{
  const rules=publicCSS.slice(publicCSS.lastIndexOf("/* Ajustements demandés"));
  assert.match(rules,/@media \(min-width:861px\)\{\s*\.press-card-title,\s*\.preview-content \.press-card-title\{\s*font-size:16px;\s*font-weight:700;/);
  assert.match(rules,/margin:0 0 9px;/);
  assert.match(publicJS,/'<div class="press-card-title '/);
});

test("le formulaire Contact seul est compact sur ordinateur sans affecter le mobile",()=>{
  assert.match(publicJS,/p\.kind==="contact"\?" page-contact":""/);
  const rules=publicCSS.slice(publicCSS.lastIndexOf("/* Ajustements demandés"));
  assert.match(rules,/@media \(min-width:861px\)/);
  assert.match(rules,/\.page-contact \.page-title\{[\s\S]*?font-size:clamp\(31px,3vw,42px\)/);
  assert.match(rules,/\.page-contact \.contact-form\{[\s\S]*?gap:11px/);
  assert.match(rules,/\.page-contact \.field input\{[\s\S]*?height:36px/);
  assert.match(rules,/\.page-contact \.field textarea\{[\s\S]*?height:98px/);
  assert.match(rules,/\.page-contact \.submit\{/);
  assert.doesNotMatch(rules,/max-width:600px/);
});

test("le petit œil révèle et masque le mot de passe local sans soumettre le formulaire",()=>{
  assert.match(adminHTML,/id="password" type="password"/);
  assert.match(adminHTML,/id="toggle-password" class="password-eye"/);
  assert.match(adminHTML,/type="button" id="toggle-password"/);
  assert.match(adminHTML,/aria-label="Afficher le mot de passe" aria-pressed="false"/);
  assert.match(adminJS,/\$\("#toggle-password"\)\.addEventListener\("click",\(\)=>\{/);
  assert.match(adminJS,/input\.type=visible\?"text":"password"/);
  assert.match(adminJS,/button\.setAttribute\("aria-pressed",String\(visible\)\)/);
  assert.match(adminJS,/slash\.hidden=!visible/);
  assert.match(adminCSS,/\.login-card \.password-wrap input\{width:100%;min-width:0;padding-right:50px\}/);
  assert.match(adminCSS,/\.login-card \.password-eye:focus-visible/);
});
