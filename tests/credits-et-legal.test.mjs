import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizePage,normalizeFooter} from "../src/worker.js";
import {copyrightText,legalDocument,privacyDocument} from "../public/legal.js";

const pathMedia="/media/11111111-1111-4111-8111-111111111111.jpg";
const admin=readFileSync(new URL("../public/admin.js",import.meta.url),"utf8");
const site=readFileSync(new URL("../public/site.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");

test("chaque bloc photo ou presse conserve son auteur facultatif",()=>{
  const page=normalizePage({title:"Portfolio",cover:pathMedia,coverCredit:"Sébastien Durand",blocks:[
    {type:"image",src:pathMedia,caption:"Décor",credit:"Sébastien Durand"},
    {type:"press",src:pathMedia,url:"https://exemple.fr/",credit:"© Autre auteur"},
    {type:"image",src:pathMedia}
  ]});
  assert.equal(page.coverCredit,"Sébastien Durand");
  assert.equal(page.blocks[0].credit,"Sébastien Durand");
  assert.equal(page.blocks[1].credit,"Autre auteur");
  assert.equal(page.blocks[2].credit,"");
  assert.equal(normalizePage({title:"Ancienne fiche",blocks:[]}).coverCredit,"");
});
test("le symbole copyright ne s'affiche que si un nom est renseigné",()=>{
  assert.equal(copyrightText("  "),"");
  assert.equal(copyrightText("Sébastien Durand"),"© Sébastien Durand");
  assert.equal(copyrightText("© Sébastien Durand"),"© Sébastien Durand");
  assert.equal(copyrightText("<script>"),"© <script>");
  assert.match(site,/esc\(copyrightText\(x\.data\.coverCredit\)\)/);
  assert.match(site,/photoCreditHtml\(b\.credit\)/);
  assert.match(admin,/data-bkey="credit"/);
  assert.match(admin,/data-project-credit/);
});
test("les champs des mentions légales survivent à la sauvegarde et filtrent les champs inconnus",()=>{
  const f=normalizeFooter({instagram:"",legal:"Complément",legalDetails:{
    editorName:"Nadège Renard",status:"EI",siren:"123456789",
    hostName:"Hébergeur",email:"contact@example.org",inconnu:"injection"
  }});
  assert.equal(f.legalDetails.siren,"123456789");
  assert.equal(f.legalDetails.inconnu,undefined);
  assert.match(legalDocument(f),/SIREN : 123456789/);
  assert.match(legalDocument(f),/INFORMATIONS COMPLÉMENTAIRES\nComplément/);
  assert.match(privacyDocument(f),/contact@example\.org/);
  assert.match(legalDocument(f),/\[À compléter :/);
});
test("l'ancien contenu juridique reste visible tant que les nouveaux champs sont vides",()=>{
  assert.equal(legalDocument({legal:"Texte existant"}),"Texte existant");
  assert.equal(legalDocument(normalizeFooter({legal:"Texte existant"})),"Texte existant");
  assert.match(legalDocument({},true),/HÉBERGEMENT/);
  assert.match(html,/id="privacy-button"/);
  assert.match(html,/id="privacy-text"/);
  assert.match(site,/data-open-privacy/);
});
