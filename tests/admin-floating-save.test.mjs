import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=source("public/administration/index.html");
const css=source("public/admin.css");
const js=source("public/admin.js");

test("le bouton flottant est bien présent sur les pages éditables, caché en corbeille et hors connexion",()=>{
  assert.ok(html.includes('id="floating-save" class="floating-save"'));
  assert.ok(html.includes('id="floating-save-button"'));
  assert.ok(html.includes('id="floating-save-status"'));
  assert.ok(js.includes('const editing=!$("#editor-view").hidden&&selected!=="trash"&&draft!==null;'));
  assert.ok(js.includes('panel.hidden=!editing;'));
  assert.ok(js.includes('updateFloatingSave();'));
});

test("le bouton flottant ne fait qu'enregistrer un brouillon et utilise le même traitement que celui du haut",()=>{
  assert.ok(js.includes('$("#save").addEventListener("click",onSaveClick);'));
  assert.ok(js.includes('$("#floating-save-button").addEventListener("click",onSaveClick);'));
  assert.ok(js.includes('await api("footer/save",snapshot);'));
  assert.ok(js.includes('await api("save",{id:target,content:snapshot});'));
  assert.ok(js.includes('$("#publish").addEventListener("click"'));
  assert.ok(js.includes('Brouillon enregistré. Rien n\'a changé sur le site public.'));
});

test("les modifications des fiches dans la galerie peuvent aussi être enregistrées depuis le bouton fixe",()=>{
  assert.ok(js.includes('pendingProjects=new Map()'));
  assert.ok(js.includes('markProjectDirty(el.dataset.projectTitle);'));
  assert.ok(js.includes('markProjectDirty(el.dataset.projectCredit);'));
  assert.ok(js.includes('for(const id of [...pendingProjects.keys()])'));
  assert.ok(js.includes('await saveProject(id);'));
});

test("la sauvegarde bloque les doubles clics et montre les états nécessaires",()=>{
  assert.ok(js.includes('if(saveInFlight)return saveInFlight;'));
  assert.ok(js.includes('button.disabled=!!saveInFlight;'));
  assert.ok(js.includes('saveState="error";'));
  for(const msg of ["Aucun changement","Modifications à enregistrer","Enregistrement…","Brouillon enregistré","Échec de l\'enregistrement"]){
    assert.ok(js.includes(msg),msg);
  }
});

test("le bouton reste près du bas de l'écran sans couvrir les derniers champs",()=>{
  assert.match(css,/\.floating-save\{\s*position:fixed;/);
  assert.match(css,/\.floating-save-button\{/);
  assert.ok(css.includes('.editor-body{padding-bottom:135px}'));
  assert.ok(css.includes('@media(max-width:600px){\n  .floating-save{'));
  assert.ok(css.includes('#floating-save[hidden]{display:none}'));
});
