import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {readFileSync} from "node:fs";
import worker from "../src/worker.js";

const admin=readFileSync(new URL("../public/admin.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../public/admin.css",import.meta.url),"utf8");
const secret="test-trash-session";
function call(route,id,env){
  const expires=Math.floor(Date.now()/1000)+3600;
  const signatureBase="v1."+expires;
  const cookie="nr_session="+signatureBase+"."+createHmac("sha256",secret).update(signatureBase).digest("hex");
  return worker.fetch(new Request("https://example.test/api/admin/"+route,{
    method:"POST",
    headers:{"origin":"https://example.test","cookie":cookie,"content-type":"application/json"},
    body:JSON.stringify({id})
  }),{...env,SESSION_SECRET:secret});
}
function fakeDb(row){
  const statements=[];
  const db={prepare(sql){
    const statement={sql,args:[],bind(...args){this.args=args;return this;},
      async first(){assert.match(sql,/SELECT is_core FROM pages/);return row;},
      async run(){assert.match(sql,/^UPDATE pages SET is_trashed=\?/);statements.push({sql,args:this.args});return {meta:{changes:1}};}};
    return statement;
  }};
  return {db,statements};
}

test("chaque réalisation possède un bouton de corbeille dans la galerie et sur sa fiche",()=>{
  assert.match(admin,/data-project-trash/);
  assert.match(admin,/Mettre à la corbeille/);
  assert.match(admin,/kind==="detail"&&!p\.is_core/);
  assert.match(admin,/Mettre cette réalisation à la corbeille/);
  assert.match(admin,/document\.querySelectorAll\("\[data-project-trash\]"\)/);
  assert.match(admin,/await movePageToTrash\(btn\.dataset\.projectTrash\)/);
  assert.match(css,/\.project-trash-button/);
});

test("la corbeille conserve la page et les photos ; restauration disponible",()=>{
  assert.match(admin,/function showTrash\(\)/);
  assert.match(admin,/p\.kind==="detail"\?"Réalisation"/);
  assert.match(admin,/data-restore/);
  assert.match(admin,/api\("restore",\{id:el\.dataset\.restore\}\)/);
  assert.match(admin,/if\(dirty\)\{\s*error\("Enregistrez d'abord les modifications/);
  assert.match(admin,/Ses photographies sont conservées/);
  assert.match(admin,/if\(selected===id\)\{/);
});

test("une réalisation peut aller à la corbeille sans supprimer les lignes de la base",async()=>{
  const {db,statements}=fakeDb({is_core:0});
  const result=await call("trash","realisation-test",{DB:db});
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{ok:true});
  assert.equal(statements.length,1);
  assert.match(statements[0].sql,/WHERE id=\? OR parent_id=\?/);
  assert.deepEqual(statements[0].args,[1,"realisation-test","realisation-test"]);
  assert.doesNotMatch(statements[0].sql,/DELETE/i);
});

test("une réalisation envoyée à la corbeille peut être restaurée",async()=>{
  const {db,statements}=fakeDb({is_core:0});
  const result=await call("restore","realisation-test",{DB:db});
  assert.equal(result.status,200);
  assert.deepEqual(statements[0].args,[0,"realisation-test","realisation-test"]);
});

test("les pages essentielles restent protégées",async()=>{
  const {db,statements}=fakeDb({is_core:1});
  const result=await call("trash","home",{DB:db});
  assert.equal(result.status,403);
  assert.equal(statements.length,0);
});
