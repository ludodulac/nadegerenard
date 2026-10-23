import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import worker,{normalizePage} from "../src/worker.js";

function request(id="project1"){
  const exp=Math.floor(Date.now()/1000)+3600;
  const value="v1."+exp,signature=createHmac("sha256","dev-test").update(value).digest("hex");
  return new Request("https://example.test/api/admin/publish",{
    method:"POST",headers:{origin:"https://example.test",cookie:"nr_session="+value+"."+signature,"content-type":"application/json"},
    body:JSON.stringify({id})
  });
}
const detail=(title,cover="/media/11111111-1111-4111-8111-111111111111.jpg")=>JSON.stringify({
  title,subtitle:"performance",description:"2024\n\navec les artistes",cover,blocks:[],descriptionAlign:"left"
});
function fakeDatabase(row,otherSlugs=[]){
  const writes=[];
  const db={prepare(sql){return {
    args:[],bind(...args){this.args=args;return this;},
    async first(){assert.match(sql,/SELECT kind,slug,draft_json,published_json/);return row;},
    async all(){assert.match(sql,/SELECT slug FROM pages WHERE id !=/);return {results:otherSlugs.map(slug=>({slug}))};},
    async run(){writes.push({sql,args:this.args});return {meta:{changes:1}};}
  };}};
  return {db,writes};
}
test("une fiche conserve le texte et son ordre avant les photographies",()=>{
  const normalized=normalizePage({title:"QUATRE ÎLES, UN ARCHIPEL",description:"2024\n\nDistribution",descriptionAlign:"center",
    blocks:[{type:"image",src:"/media/11111111-1111-4111-8111-111111111111.jpg"}]});
  assert.equal(normalized.description,"2024\n\nDistribution");
  assert.equal(normalized.descriptionAlign,"center");
  const publicJs=readFileSync(new URL("../public/site.js",import.meta.url),"utf8");
  assert.ok(publicJs.indexOf("description+detailText")<publicJs.indexOf("detailImages+'</div>'"));
  assert.ok(!publicJs.includes('const cover=p.kind==="detail"'));
  assert.ok(publicJs.includes("const back=p.kind==="));
  assert.ok(publicJs.includes("gallery-caption"));
});
test("publication d'une réalisation : URL fondée sur son nom avec suffixe en cas de doublon",async()=>{
  const {db,writes}=fakeDatabase({kind:"detail",slug:"nouvelle-realisation-aabbcc",draft_json:detail("QUATRE ÎLES, UN ARCHIPEL"),published_json:null},
    ["quatre-iles-un-archipel","quatre-iles-un-archipel-1"]);
  const response=await worker.fetch(request(),{SESSION_SECRET:"dev-test",DB:db});
  assert.equal(response.status,200);
  assert.equal((await response.json()).slug,"quatre-iles-un-archipel-2");
  assert.equal(writes.length,1);
  assert.equal(writes[0].args[0],"quatre-iles-un-archipel-2");
  assert.match(writes[0].sql,/SET slug=\?,published_json=draft_json/);
});
test("une fiche sans photo de galerie reste brouillon, sans créer de vignette vide",async()=>{
  const {db,writes}=fakeDatabase({kind:"detail",slug:"nouvelle-realisation-xxxxxx",draft_json:detail("Un spectacle",""),published_json:null});
  const response=await worker.fetch(request(),{SESSION_SECRET:"dev-test",DB:db});
  assert.equal(response.status,400);
  assert.match((await response.json()).error,/photographie/i);
  assert.equal(writes.length,0);
});
test("la mise à jour d'un texte sans renommer conserve l'URL publique",async()=>{
  const {db,writes}=fakeDatabase({kind:"detail",slug:"quatre-iles-un-archipel",draft_json:detail("QUATRE ÎLES, UN ARCHIPEL"),published_json:detail("QUATRE ÎLES, UN ARCHIPEL")});
  const response=await worker.fetch(request(),{SESSION_SECRET:"dev-test",DB:db});
  assert.equal(response.status,200);
  assert.equal((await response.json()).slug,"quatre-iles-un-archipel");
  assert.equal(writes[0].args[0],"quatre-iles-un-archipel");
});
