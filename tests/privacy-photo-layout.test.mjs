import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {privacyDocument,copyrightText} from "../public/legal.js";
const source=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const site=source("public/site.js");
const admin=source("public/admin.js");
const css=source("public/styles.css");
const worker=source("src/worker.js");

test("texte de confidentialité adapté au portfolio, sans durée inventée",()=>{
  const s=privacyDocument({});
  assert.match(s,/Nadège Renard/);
  assert.match(s,/Cloudflare Turnstile/);
  assert.match(s,/empreinte technique/);
  assert.match(s,/Vos droits/);
  assert.match(s,/page « Contact »/);
  assert.doesNotMatch(s,/Photographies/i);
});

test("les coordonnées du responsable nécessitent un accord explicite de publication",()=>{
  const details={editorName:"Nadège Renard",email:"contact@example.fr",retention:"12 mois"};
  const hidden=privacyDocument({legalDetails:details});
  assert.doesNotMatch(hidden,/contact@example.fr/);
  const text=privacyDocument({legalDetails:details,allowPublicContact:true});
  assert.match(text,/Nadège Renard/);
  assert.match(text,/12 mois après réception du message/);
  assert.equal((text.match(/contact@example\\.fr/g)||[]).length,2);
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
