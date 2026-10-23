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

test("les anciennes descriptions d'image deviennent des légendes visibles sans perdre les données",()=>{
  const original={title:"Réalisation",blocks:[{
    type:"image",src:"/media/11111111-1111-4111-8111-111111111111.jpg",alt:"C'est chouette"
  }]};
  const normalized=normalizePage(original);
  assert.equal(normalized.blocks[0].alt,"C'est chouette");
  assert.equal(normalized.blocks[0].caption,"C'est chouette");
  const edited=normalizePage({...original,blocks:[{...original.blocks[0],caption:"Nouvelle légende"}]});
  assert.equal(edited.blocks[0].caption,"Nouvelle légende");
});
