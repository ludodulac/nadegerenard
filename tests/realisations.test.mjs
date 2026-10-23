import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";

test("ajouter une réalisation crée immédiatement une fiche modifiable sans exiger de nom", async () => {
  const queries=[];
  const env={
    SESSION_SECRET:"test-secret",
    DB:{
      prepare(sql){
        const statement={
          args:[],
          bind(...args){this.args=args;return this;},
          async first(){
            if(sql.includes("SELECT id,kind,is_trashed"))return {id:"sceno",kind:"gallery",is_trashed:0};
            if(sql.includes("SELECT MAX(nav_order)"))return {x:7};
            throw Error("Requête inattendue: "+sql);
          },
          async run(){
            assert.match(sql,/INSERT INTO pages/);
            queries.push({sql,args:this.args});
            return {meta:{changes:1}};
          }
        };
        return statement;
      }
    }
  };
  const expiry=Math.floor(Date.now()/1000)+3600;
  const value="v1."+expiry;
  const signature=createHmac("sha256",env.SESSION_SECRET).update(value).digest("hex");
  const response=await worker.fetch(new Request("https://example.test/api/admin/create",{
    method:"POST",
    headers:{"origin":"https://example.test","cookie":"nr_session="+value+"."+signature,"content-type":"application/json"},
    body:JSON.stringify({parentId:"sceno"})
  }),env);
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.kind,"detail");
  assert.equal(result.parent_id,"sceno");
  assert.equal(result.nav_order,8);
  assert.equal(result.draft.title,"Nouvelle réalisation");
  assert.equal(result.draft.titleAlign,"left");
  assert.equal(result.draft.description,"");
  assert.equal(result.draft.descriptionAlign,"left");
  assert.equal(result.draft.cover,"");
  assert.deepEqual(result.draft.blocks,[]);
  assert.match(result.slug,/^nouvelle-realisation-[a-f0-9]{6}$/);
  assert.equal(queries.length,1);
  assert.equal(JSON.parse(queries[0].args[5]).title,"Nouvelle réalisation");
  assert.match(queries[0].sql,/published_json\) VALUES\(\?,\?,\?,\?,\?,0,0,\?,NULL\)/);
});

test("l'ajout en galerie sans dialogue et les liens sociaux ne rendent que le contenu configuré",()=>{
  const admin=readFileSync(new URL("../public/admin.js",import.meta.url),"utf8");
  const site=readFileSync(new URL("../public/site.js",import.meta.url),"utf8");
  const styles=readFileSync(new URL("../public/styles.css",import.meta.url),"utf8");
  assert.ok(admin.includes('const title=isProject?"Nouvelle réalisation":prompt'));
  assert.ok(admin.includes('db.pages.push({...created'));
  assert.ok(admin.includes('function galleryProjects()'));
  assert.ok(admin.includes('data-project-upload'));
  assert.ok(admin.includes('Modifier la page de cette réalisation'));
  assert.ok(admin.includes('sidebar-divider'));
  assert.ok(admin.includes('data-project-caption'));
  assert.ok(admin.includes('class="align-button '));
  assert.ok(site.includes('if(safeLink(f.linkedin))social.push'));
  assert.ok(site.includes('if(safeLink(f.instagram))social.push'));
  assert.ok(site.includes('class="social-icon"'));
  assert.ok(!site.includes('const cover=p.kind==="detail"'));
  assert.ok(site.includes('const body=p.kind==="detail"?description+detailText'));
  assert.ok(site.includes('gallery-card'));
  assert.ok(site.includes('gallery-caption'));
  assert.ok(styles.includes('.content-block.block-wrap-label{margin-bottom:14px}'));
});
