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
test("les mentions légales reprennent exactement le modèle court à trous",()=>{
  const text=legalDocument({});
  assert.equal(text,[
    "Le site",
    "Ce site présente les travaux de Nadège Renard : scénographies, décors, patines, ateliers. Aucune vente n'est réalisée directement sur le site.",
    "",
    "Éditrice et directrice de la publication",
    "[NOM]",
    "[STATUT PROFESSIONNEL]",
    "[ADRESSE PROFESSIONNELLE]",
    "SIREN : [SIREN]",
    "E-mail : [E-MAIL]",
    "Téléphone : [TÉLÉPHONE]",
    "",
    "Hébergeur",
    "[NOM DE L'HÉBERGEUR]",
    "[ADRESSE DE L'HÉBERGEUR]",
    "Téléphone : [TÉLÉPHONE DE L'HÉBERGEUR]",
    "",
    "Propriété intellectuelle",
    "Les textes, images, photographies, décors et scénographies présentés sur ce site sont protégés par le droit d'auteur. Toute reproduction ou réutilisation nécessite l'accord préalable de leurs titulaires. Les crédits photographiques identifient l'auteur de l'image et ne valent pas autorisation de réutilisation.",
    "",
    "Données personnelles",
    "Les informations envoyées par le formulaire de contact sont traitées conformément à la rubrique « Confidentialité », accessible en pied de page."
  ].join("\n"));
  assert.match(site,/legalMarkup\(legalDocument\(f\)\)/);
  assert.match(html,/id="legal-button"/);
  assert.match(html,/MENTIONS LÉGALES/);
});
test("les champs complètent le texte choisi et sont conservés",()=>{
  const details={editorName:"Nadège Renard",status:"Artiste-auteure",address:"1 rue des Fleurs",siren:"123456789",email:"nad@example.fr",phone:"02 11 11 11 11",hostName:"Hébergement exemple",hostAddress:"Paris",hostPhone:"02 22 22 22 22",retention:"12 mois"};
  const footer=normalizeFooter({legalDetails:details});
  for(const [key,val] of Object.entries(details)) assert.equal(footer.legalDetails[key],val);
  const legal=legalDocument(footer);
  assert.match(legal,/Éditrice et directrice de la publication\nNadège Renard/);
  assert.match(legal,/SIREN : 123456789/);
  assert.match(legal,/Téléphone : 02 22 22 22 22/);
  assert.doesNotMatch(legal,/\[NOM\]/);
  assert.match(privacyDocument(footer),/12 mois/);
});
test("l'ancien contenu juridique n'est pas effacé et le modèle ne dépend pas de la saisie",()=>{
  assert.match(legalDocument({legal:"Anciennes informations"}),/Précisions complémentaires\nAnciennes informations/);
  assert.match(legalDocument(normalizeFooter({legal:"Texte existant"})),/Le site\nCe site présente/);
  assert.match(legalDocument({legalDetails:{status:""}}),/\[STATUT PROFESSIONNEL\]/);
  assert.match(privacyDocument({}),/POLITIQUE DE CONFIDENTIALITÉ/);
  assert.match(html,/id="privacy-button"/);
  assert.match(html,/id="privacy-text"/);
  assert.match(site,/data-open-privacy/);
  assert.match(site,/updateFooter\(\);\s*start\(\);/);
  assert.match(admin,/id="legal-ready-preview"/);
  assert.match(admin,/id="privacy-ready-preview"/);
});
