import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {privacyDocument,copyrightText} from "../public/legal.js";
const source=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const site=source("public/site.js");
const admin=source("public/admin.js");
const css=source("public/styles.css");
const worker=source("src/worker.js");

test("texte Confidentialité demandé, complet, court et sans rubrique Photographies",()=>{
  assert.equal(privacyDocument({}),[
    "Responsable",
    "[NOM OU DÉNOMINATION], joignable à [E-MAIL].",
    "",
    "Données collectées",
    "Via le formulaire de contact : votre nom, votre adresse e-mail, le sujet et votre message. Ces informations servent uniquement à recevoir votre demande et à vous répondre.",
    "",
    "Pour protéger le formulaire des envois automatisés, le site utilise Cloudflare Turnstile et un système de limitation des envois basé sur une empreinte technique dérivée de votre adresse IP (l'adresse elle-même n'est pas conservée en clair).",
    "",
    "Base légale",
    "L'intérêt légitime : répondre aux personnes qui nous écrivent et sécuriser le formulaire.",
    "",
    "Destinataires",
    "Vos messages ne sont lus que par la personne qui répond aux demandes. Les prestataires techniques du site (hébergement, envoi des messages, Cloudflare) peuvent les traiter dans le cadre de leurs services.",
    "",
    "Durée de conservation",
    "[DURÉE] à compter de la réception du message, puis suppression, sauf obligation légale de conservation.",
    "",
    "Vos droits",
    "Vous pouvez demander l'accès à vos données, leur rectification ou leur effacement, ou vous opposer à leur traitement, en écrivant à [E-MAIL]. Vous pouvez aussi saisir la CNIL (www.cnil.fr)."
  ].join("\n"));
  assert.doesNotMatch(privacyDocument({}),/Photographies/i);
});

test("trous de confidentialité sont remplacés sans modifier son contenu",()=>{
  const text=privacyDocument({legalDetails:{editorName:"Nadège Renard",email:"contact@example.fr",retention:"12 mois"}});
  assert.match(text,/Nadège Renard, joignable à contact@example.fr\./);
  assert.match(text,/12 mois à compter de la réception du message/);
  assert.equal((text.match(/contact@example\.fr/g)||[]).length,2);
  assert.doesNotMatch(text,/\[E-MAIL\]|\[DURÉE\]|\[NOM OU DÉNOMINATION\]/);
});

test("l'IP est transformée en empreinte salée avant enregistrement anti-spam",()=>{
  assert.match(worker,/const id=prefix\+":"\+await sha\(identity\+"\|"\+\(env\.SESSION_SECRET\|\|""\)\)/);
  assert.match(worker,/INSERT INTO rate_limits\(id,window_start,attempts\)/);
  assert.match(worker,/req\.headers\.get\("cf-connecting-ip"\)/);
});

test("crédit de photo en dehors de l'image, avant la légende, sans superposition",()=>{
  assert.match(site,/photoCreditHtml\(b\.credit\)\+\s*\(caption\.trim/);
  assert.match(site,/const author=safeImage\(x\.data\.cover\)\?x\.data\.coverCredit:firstImage\?\.credit/);
  assert.match(site,/'<span class="gallery-photo">'\+picture\(cover,x\.data\.title\)/);
  assert.match(site,/'<span class="gallery-caption">'\+esc\(x\.data\.title\)\+'<\/span><\/span>'/);
  assert.match(site,/'<span class="gallery-credit">'\+esc\(copyrightText\(author\)\)/);
  assert.match(site,/picture\(b\.src,b\.title\)\+photoCreditHtml\(b\.credit\)/);
  assert.match(admin,/'<div class="gallery-photo">'\+/);
  assert.match(admin,/'<div class="gallery-card"><div class="gallery-photo">/);
  assert.match(admin,/copyrightText\(b\.credit\)\?'<p class="photo-credit">/);
  assert.match(css,/\.gallery-photo\{position:relative/);
  assert.match(css,/\.photo-credit,\.gallery-credit\{[^}]*position:static;/s);
  assert.match(css,/\.photo-credit,\.gallery-credit\{[^}]*text-align:left;/s);
  assert.match(css,/\.photo-credit,\.gallery-credit\{[^}]*margin:2px 0 0;/s);
  assert.doesNotMatch(css,/\.gallery-credit\{position:absolute/);
  assert.equal(copyrightText(""),"");
  assert.equal(copyrightText("Sébastien Durand"),"© Sébastien Durand");
});

test("publications légales et de confidentialité utilisent même affichage à rubriques",()=>{
  assert.match(site,/innerHTML=legalMarkup\(privacyDocument\(f\)\)/);
  assert.match(css,/\.legal-text \.legal-section h3/);
  assert.match(admin,/id="privacy-ready-preview"/);
});
