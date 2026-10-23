import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const site=readFileSync(new URL("../public/site.js",import.meta.url),"utf8");
const admin=readFileSync(new URL("../public/admin.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../public/styles.css",import.meta.url),"utf8");
const adminCss=readFileSync(new URL("../public/admin.css",import.meta.url),"utf8");
const finalGalleryCss=css.slice(css.lastIndexOf("GALERIES CENTRÉES :"));

test("une à trois photographies par ligne, les rangées incomplètes restent centrées",()=>{
  assert.match(finalGalleryCss,/\.gallery-list,\s*\.detail-photo-list,\s*\.page-photo-list,\s*\.press-list\s*\{\s*display:flex;\s*flex-flow:row wrap;\s*align-items:flex-start;\s*justify-content:center;/s);
  assert.match(finalGalleryCss,/\.gallery-list > \.gallery-card,[\s\S]*?flex:0 0 calc\(\(100% - 48px\) \/ 3\)/);
  assert.match(finalGalleryCss,/@media \(min-width:601px\) and \(max-width:900px\) \{[\s\S]*?flex-basis:calc\(\(100% - 20px\) \/ 2\)/);
  assert.match(finalGalleryCss,/@media \(max-width:600px\) \{[\s\S]*?flex-basis:100%/);
  // Flex-wrap + trois cases de largeur fixe + justify-content:center :
  // 1,2,4,5,7,8 images = dernière rangée centrée sans cases vides.
});

test("photos de format paysage, portrait ou transparent jamais recadrées",()=>{
  assert.match(finalGalleryCss,/\.block-image img,[\s\S]*?\.gallery-card img\s*\{[\s\S]*?width:auto;[\s\S]*?height:auto;[\s\S]*?object-fit:contain;/);
  assert.match(finalGalleryCss,/\.gallery-card img \{[\s\S]*?height:auto;[\s\S]*?max-height:none;[\s\S]*?object-fit:contain;/);
  assert.match(finalGalleryCss,/\.gallery-card:hover img \{transform:none\}/);
  assert.match(finalGalleryCss,/\.gallery-card \.gallery-credit \{[\s\S]*?text-align:left;[\s\S]*?margin:2px auto 0;/);
  assert.match(finalGalleryCss,/\.page-photo-list \.block-image \.photo-credit,[\s\S]*?text-align:left/);
  assert.match(finalGalleryCss,/\.detail-photo-list > \.content-block/);
  assert.match(finalGalleryCss,/\.press-list > \.press-card/);
});

test("sur les pages classiques seules les images consécutives sont regroupées, sans déplacer les textes",()=>{
  assert.match(site,/function groupedPhotoBlocks\(items\)/);
  assert.match(site,/if\(b\.type==="image"\)photos\.push\(section\);\s*else\{flush\(\);html\+=section;\}/);
  assert.match(site,/const other=home\?sections\.map\([\s\S]*?\):groupedPhotoBlocks\(sections\)/);
  assert.match(site,/const detailImages=sections\.filter\(x=>x\.b\.type==="image"\)/);
  assert.match(site,/const press=blocks\.filter\(x=>x\.type==="press"\)/);
  assert.match(site,/function listGallery\(p\)/);
});

test("l'aperçu admin utilise aussi les rangées centrées et évite les recadrages",()=>{
  assert.match(admin,/function groupedPreviewPhotos\(items\)/);
  assert.match(admin,/if\(b\.type==="image"\)photos\.push\(section\);\s*else\{flush\(\);result\+=section;\}/);
  assert.match(admin,/groupedPreviewPhotos\(previewItems\)/);
  assert.match(adminCss,/\.preview-content \.page-photo-list > \.content-block,[\s\S]*?margin:0/);
  assert.match(adminCss,/\.preview-content \.block-image img,[\s\S]*?object-fit:contain/);
  assert.match(adminCss,/\.project-card-preview img \{height:auto;max-height:360px;object-fit:contain\}/);
});
