import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync(new URL("../public/styles.css",import.meta.url),"utf8");
const site=readFileSync(new URL("../public/site.js",import.meta.url),"utf8");

test("le premier écran d'accueil possède une photo contenue dans la hauteur du viewport",()=>{
  assert.match(css,/@media \(min-width: 861px\)[\s\S]+?\.page-home > \.content-block\.block-wrap-image:first-of-type \.block-image img \{/);
  assert.match(css,/max-height: min\(51svh, calc\(100svh - 235px\)\)/);
  assert.match(css,/object-fit: contain/);
  assert.match(css,/@media \(min-width: 861px\) and \(max-height: 710px\)/);
  assert.match(css,/max-height: min\(49svh, calc\(100svh - 195px\)\)/);
  assert.match(site,/root\.innerHTML='<article class="page '\+\(home\?"page-home"/);
  assert.match(site,/const other=home\?sections\.map\([\s\S]*?\):groupedPhotoBlocks\(sections\)/);
});

test("les grands titres sont dimensionnés pour un bureau et une fiche de réalisation",()=>{
  const desktop=css.slice(css.lastIndexOf("@media (min-width: 861px) {"));
  assert.match(desktop,/\.page-title \{[\s\S]*?font-size: clamp\(37px, 4\.05vw, 60px\)/);
  assert.match(desktop,/\.page-home \.page-title \{[\s\S]*?font-size: clamp\(40px, 4\.65vw, 66px\)/);
  assert.match(desktop,/\.page-detail \.page-title \{[\s\S]*?font-size: clamp\(37px, 3\.95vw, 58px\)/);
  assert.match(desktop,/\.page-detail \.project-description \{[\s\S]*?font-size: clamp\(16px, 1\.4vw, 19px\)/);
  assert.match(desktop,/\.menu-links a \{ font-size: clamp\(16px, 1\.25vw, 18px\)/);
});

test("le téléphone et la tablette ont un dimensionnement séparé",()=>{
  assert.match(css,/@media \(min-width: 601px\) and \(max-width: 860px\)/);
  assert.match(css,/@media \(max-width: 600px\) \{[\s\S]*?\.page-home \.page-title \{ font-size: clamp\(37px, 9vw, 50px\)/);
});
