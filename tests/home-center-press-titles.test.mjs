import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css=readFileSync(new URL("../public/styles.css",import.meta.url),"utf8");
const site=readFileSync(new URL("../public/site.js",import.meta.url),"utf8");
const additional=css.slice(css.lastIndexOf("/* Accueil : le bloc"));

test("la photographie de l'accueil est centrée quel que soit le viewport",()=>{
  assert.match(additional,/\.page-home \.content-block\.block-wrap-image\{\s*display:flex;\s*justify-content:center;/);
  assert.match(additional,/\.page-home \.content-block\.block-wrap-image > \.block-image\{[\s\S]*?margin-left:auto;[\s\S]*?margin-right:auto;/);
  assert.match(additional,/\.page-home \.content-block\.block-wrap-image > \.block-image > img\{[\s\S]*?margin-left:auto;[\s\S]*?margin-right:auto;[\s\S]*?object-fit:contain;/);
  assert.match(site,/class="content-block block-wrap-'\+x\.b\.type/);
  assert.match(site,/home\?"page-home":""/);
});

test("les titres des photographies de presse sont à 25 % de leur ancienne taille sur PC",()=>{
  assert.match(css,/\.press-card-title\{font-size:clamp\(20px,3vw,32px\)/);
  assert.match(additional,/@media \(min-width: 861px\)\{/);
  assert.match(additional,/\.press-card-title,\s*\.preview-content \.press-card-title \{[\s\S]*?font-size:clamp\(5px, \.75vw, 8px\)/);
  assert.match(additional,/margin-bottom:4px/);
  assert.match(site,/'<div class="press-card-title '/);
});

test("les ajustements n'enlèvent aucun crédit ou bloc photo",()=>{
  assert.match(site,/function photoCreditHtml\(name/);
  assert.match(site,/function groupedPhotoBlocks\(items\)/);
  assert.match(css,/\.gallery-list,[\s\S]*?justify-content:center;/);
});
