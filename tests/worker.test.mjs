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
  assert.equal(d.titleAlign,"left");
  assert.equal(d.blocks[0].align,"left");
  assert.equal(d.blocks[0].lineHeight,"large");
  assert.equal(d.blocks[0].text,"Bonjour **Nadège**");
});
test("les réseaux sociaux requièrent HTTPS",()=>{
  assert.throws(()=>normalizeFooter({instagram:"http://example.com"}));
  assert.equal(normalizeFooter({instagram:"https://instagram.com/exemple"}).linkedin,"");
});

test("préserve les alignements gauche ou centré après sauvegarde",()=>{
  const d=normalizePage({
    title:"BIO", subtitle:"Scénographe", titleAlign:"left", subtitleAlign:"center",
    blocks:[
      {type:"heading",text:"À gauche",align:"left"},
      {type:"text",text:"Au centre",align:"center"},
      {type:"label",text:"Alignement ancien absent"}
    ]
  });
  assert.equal(d.titleAlign,"left");
  assert.equal(d.subtitleAlign,"center");
  assert.equal(d.blocks[0].align,"left");
  assert.equal(d.blocks[1].align,"center");
  assert.equal(d.blocks[2].align,"left");

  const invalid=normalizePage({title:"Test",titleAlign:"right",subtitleAlign:"justify",blocks:[{type:"text",text:"Bonjour",align:"right"}]});
  assert.equal(invalid.titleAlign,"left");
  assert.equal(invalid.subtitleAlign,"left");
  assert.equal(invalid.blocks[0].align,"left");
});
