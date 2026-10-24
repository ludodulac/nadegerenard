import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizePage,normalizeFooter} from "../src/worker.js";
import {copyrightText,legalDocument,privacyDocument,LEGAL_FIELDS,CLOUDFARE_HOST} from "../public/legal.js";

const pathMedia="/media/11111111-1111-4111-8111-111111111111.jpg";
const admin=readFileSync(new URL("../public/admin.js",import.meta.url),"utf8");
const site=readFileSync(new URL("../public/site.js",import.meta.url),"utf8");

test("crédits photographiques facultatifs conservés",()=>{
  const page=normalizePage({title:"Portfolio",cover:pathMedia,coverCredit:"Sébastien Durand",blocks:[
    {type:"image",src:pathMedia,caption:"Décor",credit:"Sébastien Durand"},
    {type:"press",src:pathMedia,url:"https://example.fr",credit:"© Autre auteur"}
  ]});
  assert.equal(page.coverCredit,"Sébastien Durand");
  assert.equal(page.blocks[0].credit,"Sébastien Durand");
  assert.equal(page.blocks[1].credit,"Autre auteur");
  assert.equal(copyrightText("Sébastien Durand"),"© Sébastien Durand");
  assert.match(site,/photoCreditHtml\(b\.credit\)/);
});
test("mentions légales d'un portfolio sans référence à l'entreprise individuelle cessée",()=>{
  const s=legalDocument({});
  assert.match(s,/portfolio présente les créations/);
  assert.match(s,/Nadège Renard/);
  assert.match(s,/Cloudflare, Inc\./);
  assert.match(s,/101 Townsend Street/);
  assert.match(s,/Téléphone : \+1 888 993 5273/);
  assert.doesNotMatch(s,/SIREN|STATUT PROFESSIONNEL|487606584|entrepreneure individuelle/i);
  assert.doesNotMatch(s,/Précisions complémentaires|Anciennes informations/);
  assert.ok(LEGAL_FIELDS.every(f=>!["siren","status"].includes(f.key)));
  assert.equal(CLOUDFARE_HOST.name,"Cloudflare, Inc.");
  assert.match(site,/legalMarkup\(legalDocument\(f\)\)/);
});
test("aucune ancienne coordonnée privée ni texte libre n'est publié implicitement",()=>{
  const old={legalDetails:{editorName:"Nadège Renard",status:"EI",siren:"487606584",address:"12 rue privée",email:"nad@exemple.com",phone:"06 01 02 03 04"},legal:"Adresse du domicile CONFIDENTIELLE"};
  const publicLegal=legalDocument(old),privacy=privacyDocument(old);
  assert.doesNotMatch(publicLegal,/12 rue privée|nad@exemple\.com|06 01 02 03 04|487606584|CONFIDENTIELLE/);
  assert.doesNotMatch(privacy,/nad@exemple\.com/);
  assert.match(privacy,/page « Contact »/);
  assert.match(publicLegal,/DIFFUSION NON VALIDÉE/);
  const accepted=normalizeFooter({...old,allowPublicContact:true});
  assert.equal(accepted.allowPublicContact,true);
  assert.match(legalDocument(accepted),/12 rue privée/);
  assert.match(privacyDocument(accepted),/nad@exemple\.com/);
});
test("l'ancien contenu est conservé en stockage mais plus affiché dans les modèles",()=>{
  const old=normalizeFooter({legal:"Anciennes informations",legalDetails:{status:"Ancien statut",siren:"487606584"}});
  assert.equal(old.legal,"Anciennes informations");
  assert.equal(old.legalDetails.status,"Ancien statut");
  assert.equal(old.legalDetails.siren,"487606584");
  assert.equal(old.allowPublicContact,false);
  assert.doesNotMatch(legalDocument(old),/487606584|Ancien statut|Anciennes informations/);
  assert.match(admin,/Ancien texte conservé dans le brouillon \(non publié\)/);
  assert.match(admin,/data-allow-public-contact/);
  assert.match(site,/legalMarkup\(privacyDocument\(f\)\)/);
});
test("durée de conservation reste à valider, sans durée imaginaire",()=>{
  assert.match(privacyDocument({}),/DURÉE DE CONSERVATION À DÉFINIR/);
  assert.match(privacyDocument({legalDetails:{retention:"12 mois"}}),/12 mois après réception/);
});
