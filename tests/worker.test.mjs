import test from "node:test";
import assert from "node:assert/strict";
import {slugify,normalizePage,normalizeFooter} from "../src/worker.js";

test("normalise un titre accentué en URL sûre",()=>{
  assert.equal(slugify("Scénographie & Spectacle"),"scenographie-spectacle");
});
test("refuse les blocs dangereux et les liens javascript",()=>{
  assert.throws(()=>normalizePage({title:"Texte",blocks:[{type:"script",text:"x"}]}));
  assert.throws(()=>normalizePage({title:"Texte",blocks:[{type:"image",src:"javascript:alert(1)"}]}));
  assert.throws(()=>normalizePage({title:"Presse",blocks:[{type:"press",url:"javascript:alert(1)"}]}));
});
test("conserve un contenu valide et les préférences de lignes",()=>{
  const d=normalizePage({title:"ACCUEIL",subtitle:"scénographe/peintre",blocks:[{type:"text",text:"Bonjour **Nadège**",lineHeight:"large"}]});
  assert.equal(d.blocks[0].lineHeight,"large");
  assert.equal(d.blocks[0].text,"Bonjour **Nadège**");
});
test("les réseaux sociaux requièrent HTTPS",()=>{
  assert.throws(()=>normalizeFooter({instagram:"http://example.com"}));
  assert.equal(normalizeFooter({instagram:"https://instagram.com/exemple"}).linkedin,"");
});
