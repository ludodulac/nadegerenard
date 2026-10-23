const enc = new TextEncoder();
const ALLOWED_KINDS = new Set(["home", "page", "gallery", "press", "contact", "detail"]);
const ALLOWED_BLOCKS = new Set(["heading", "subtitle", "label", "text", "image", "press"]);
const SESSION_SECONDS = 12 * 60 * 60;
function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers: {"content-type":"application/json; charset=utf-8", "cache-control":"no-store"}});
}
function fail(message, status=400) { return json({error:message}, status); }
function cleanText(x, limit=5000) { return typeof x === "string" ? x.trim().slice(0,limit) : ""; }
function slugify(s) {
  return cleanText(s,140).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70) || "nouvelle-page";
}
function normalizePage(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.blocks) || value.blocks.length > 80) throw Error("Contenu de page invalide");
  const blocks=value.blocks.map(item=>{
    if (!item || !ALLOWED_BLOCKS.has(item.type)) throw Error("Type de bloc inconnu");
    return {
      type:item.type, text:cleanText(item.text,15000), title:cleanText(item.title,400),
      src:cleanText(item.src,400), alt:cleanText(item.alt,250),
      url:cleanText(item.url,800), lineHeight:["normal","large","extra"].includes(item.lineHeight)?item.lineHeight:"normal"
    };
  });
  const raw={title:cleanText(value.title,180),subtitle:cleanText(value.subtitle,600),cover:cleanText(value.cover,400),blocks};
  if(!raw.title) throw Error("Le titre ne peut pas être vide");
  if(JSON.stringify(raw).length>100000) throw Error("Contenu trop volumineux");
  for(const b of blocks) {
    if(b.src && !isSafeImage(b.src)) throw Error("Image non autorisée");
    if(b.url && !isSafeExternal(b.url)) throw Error("Lien non valide");
  }
  if(raw.cover && !isSafeImage(raw.cover)) throw Error("Image de couverture non autorisée");
  return raw;
}
function isSafeImage(url) {return /^\/media\/[a-f0-9-]{36}\.(?:jpg|png|webp|avif)$/.test(url);}
function isSafeExternal(url) {try {const u=new URL(url);return u.protocol==="https:" && !!u.hostname;}catch{return false;}}
function normalizeFooter(v){
  if(!v || typeof v!=="object") throw Error("Pied de page invalide");
  const x={instagram:cleanText(v.instagram,500),linkedin:cleanText(v.linkedin,500),legal:cleanText(v.legal,12000),copyright:cleanText(v.copyright,150)};
  if((x.instagram&&!isSafeExternal(x.instagram))||(x.linkedin&&!isSafeExternal(x.linkedin))) throw Error("Lien de réseau social invalide");
  return x;
}
async function sha(s) {const h=await crypto.subtle.digest("SHA-256",enc.encode(s));return Array.from(new Uint8Array(h),v=>v.toString(16).padStart(2,"0")).join("");}
function equalHex(a,b) {if(a.length!==b.length) return false;let x=0;for(let i=0;i<a.length;i++) x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
async function hmac(value,key) {
  const imported=await crypto.subtle.importKey("raw",enc.encode(key),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const bytes=await crypto.subtle.sign("HMAC",imported,enc.encode(value));
  return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,"0")).join("");
}
function cookieGet(req,name){const c=req.headers.get("cookie")||"";const match=c.match(new RegExp("(?:^|; )"+name+"=([^;]*)"));return match?decodeURIComponent(match[1]):"";}
async function authorized(req,env){
  if(!env.SESSION_SECRET) return false;
  const value=cookieGet(req,"nr_session"), match=/^v1\.(\d{10,12})\.([a-f0-9]{64})$/.exec(value);
  if(!match||+match[1]<Date.now()/1000) return false;
  const sig=await hmac("v1."+match[1],env.SESSION_SECRET);
  return equalHex(sig,match[2]);
}
function secureCookie(req,token,maxAge) {
  const isLocal=new URL(req.url).hostname==="localhost" || new URL(req.url).hostname==="127.0.0.1";
  return "nr_session="+token+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+maxAge+(isLocal?"":"; Secure");
}
function sameOrigin(req){const origin=req.headers.get("origin");return origin===new URL(req.url).origin;}
async function body(req){if(Number(req.headers.get("content-length")||0)>130000) throw Error("Requête trop volumineuse");return req.json();}
async function throttle(env,prefix,identity,limit,period,increment){
  const id=prefix+":"+await sha(identity+"|"+(env.SESSION_SECRET||""));const now=Math.floor(Date.now()/1000);
  const row=await env.DB.prepare("SELECT window_start,attempts FROM rate_limits WHERE id=?").bind(id).first();
  if(row && now-row.window_start<period && row.attempts>=limit) return true;
  if(increment){
    const reset=!row||now-row.window_start>=period;
    await env.DB.prepare("INSERT INTO rate_limits(id,window_start,attempts) VALUES(?,?,1) ON CONFLICT(id) DO UPDATE SET window_start=excluded.window_start, attempts=?")
      .bind(id,now,reset?1:row.attempts+1).run();
  }
  return false;
}
async function onLogin(req,env) {
  if(!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.DB) return fail("Connexion non configurée",503);
  const ip=req.headers.get("cf-connecting-ip")||"unknown";
  if(await throttle(env,"login",ip,6,900,false)) return fail("Trop de tentatives. Réessayez plus tard.",429);
  const {password}=await body(req);
  const wanted=await sha(env.ADMIN_PASSWORD);const given=await sha(String(password||""));
  if(!equalHex(wanted,given)){
    await throttle(env,"login",ip,6,900,true);
    return fail("Identifiants incorrects",401);
  }
  const exp=Math.floor(Date.now()/1000)+SESSION_SECONDS;
  const value="v1."+exp;
  return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":secureCookie(req,value+"."+await hmac(value,env.SESSION_SECRET),SESSION_SECONDS),"cache-control":"no-store"}});
}
async function adminApi(req,env,path) {
  if(path==="/api/admin/login" && req.method==="POST") return onLogin(req,env);
  if(!await authorized(req,env)) return fail("Connexion requise",401);
  if(req.method==="GET" && path==="/api/admin/state"){
    const rows=await env.DB.prepare("SELECT * FROM pages ORDER BY nav_order ASC").all();
    const settings=await env.DB.prepare("SELECT * FROM settings WHERE key='footer'").first();
    return json({pages:rows.results,footer:settings||null});
  }
  if(req.method!=="POST") return fail("Méthode non autorisée",405);
  if(path==="/api/admin/logout") return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":secureCookie(req,"",0),"cache-control":"no-store"}});
  if(path==="/api/admin/upload"){
    const form=await req.formData(),f=form.get("file");
    if(!(f instanceof File) || f.size>8*1024*1024 || f.size===0) return fail("Image limitée à 8 Mo");
    const types={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
    const ext=types[f.type];if(!ext) return fail("Format image non autorisé");
    const key=crypto.randomUUID()+"."+ext;
    await env.MEDIA.put(key,await f.arrayBuffer(),{httpMetadata:{contentType:f.type}});
    return json({url:"/media/"+key});
  }
  if(path==="/api/admin/create"){
    const input=await body(req),title=cleanText(input.title,180),parentId=cleanText(input.parentId,100);
    if(!title) return fail("Titre requis");
    let kind="page",parent_id=null;
    if(parentId){
      const parent=await env.DB.prepare("SELECT id,kind,is_trashed FROM pages WHERE id=?").bind(parentId).first();
      if(!parent||parent.kind!=="gallery"||parent.is_trashed) return fail("Galerie introuvable");
      kind="detail";parent_id=parentId;
    }
    const id=crypto.randomUUID(),slug=slugify(title)+"-"+id.slice(0,6);
    const data={title,subtitle:"",cover:"",blocks:[]};
    const index=await env.DB.prepare("SELECT MAX(nav_order) as x FROM pages").first();
    await env.DB.prepare("INSERT INTO pages(id,slug,kind,parent_id,nav_order,is_core,is_trashed,draft_json,published_json) VALUES(?,?,?,?,?,0,0,?,NULL)")
      .bind(id,slug,kind,parent_id,Number(index?.x||0)+1,JSON.stringify(data)).run();
    return json({id,slug});
  }
  if(path==="/api/admin/save"){
    const input=await body(req);const normalized=normalizePage(input.content);
    const result=await env.DB.prepare("UPDATE pages SET draft_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND is_trashed=0")
      .bind(JSON.stringify(normalized),cleanText(input.id,100)).run();
    return result.meta.changes?json({ok:true}):fail("Page introuvable",404);
  }
  if(path==="/api/admin/publish"){
    const input=await body(req),id=cleanText(input.id,100);
    const result=await env.DB.prepare("UPDATE pages SET published_json=draft_json,updated_at=CURRENT_TIMESTAMP WHERE id=? AND is_trashed=0").bind(id).run();
    return result.meta.changes?json({ok:true}):fail("Page introuvable",404);
  }
  if(path==="/api/admin/trash" || path==="/api/admin/restore"){
    const input=await body(req),id=cleanText(input.id,100),trash=path.endsWith("/trash");
    const row=await env.DB.prepare("SELECT is_core FROM pages WHERE id=?").bind(id).first();
    if(!row) return fail("Page introuvable",404);
    if(trash && row.is_core) return fail("Accueil et Contact sont protégés",403);
    await env.DB.prepare("UPDATE pages SET is_trashed=? WHERE id=? OR parent_id=?").bind(trash?1:0,id,id).run();
    return json({ok:true});
  }
  if(path==="/api/admin/footer/save" || path==="/api/admin/footer/publish"){
    if(path.endsWith("/save")){
      const input=normalizeFooter(await body(req));
      await env.DB.prepare("UPDATE settings SET draft_json=? WHERE key='footer'").bind(JSON.stringify(input)).run();
    }else{
      await env.DB.prepare("UPDATE settings SET published_json=draft_json WHERE key='footer'").run();
    }
    return json({ok:true});
  }
  return fail("Route inconnue",404);
}
async function onContact(req,env) {
  if(!env.TURNSTILE_SECRET||!env.EMAIL||!env.CONTACT_TO||!env.CONTACT_FROM) return fail("Formulaire temporairement indisponible",503);
  const ip=req.headers.get("cf-connecting-ip")||"unknown";
  if(await throttle(env,"contact",ip,5,3600,false)) return fail("Nombre maximal de messages atteint",429);
  const v=await body(req);
  const name=cleanText(v.name,120),email=cleanText(v.email,254),subject=cleanText(v.subject,160),message=cleanText(v.message,5000);
  if(!name||!email||!message||!/^\S+@\S+\.\S+$/.test(email)) return fail("Veuillez vérifier les champs du formulaire");
  const form=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:String(v.token||""),remoteip:ip});
  const challenge=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:form});
  if(!(await challenge.json()).success) return fail("Vérification anti-robot échouée",403);
  await env.EMAIL.send({from:env.CONTACT_FROM,to:env.CONTACT_TO,subject:"Contact site Nadège Renard — "+(subject||"Nouveau message"),text:"Nom : "+name+"\nEmail : "+email+"\nSujet : "+subject+"\n\n"+message});
  await throttle(env,"contact",ip,5,3600,true);
  return json({ok:true});
}
export default {
 async fetch(request,env) {
  try {
    const u=new URL(request.url),path=u.pathname;
    if(path.startsWith("/media/")){
      if(request.method!=="GET") return fail("Méthode non autorisée",405);
      const key=path.slice(7);
      if(!/^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(key)) return fail("Fichier introuvable",404);
      const file=await env.MEDIA.get(key);
      if(!file) return fail("Fichier introuvable",404);
      return new Response(file.body,{headers:{"content-type":file.httpMetadata?.contentType||"application/octet-stream","cache-control":"public, max-age=3600","x-content-type-options":"nosniff"}});
    }
    if(path==="/api/site"&&request.method==="GET"){
      const data=await env.DB.prepare("SELECT id,slug,kind,parent_id,nav_order,published_json FROM pages WHERE is_trashed=0 AND published_json IS NOT NULL ORDER BY nav_order").all();
      const footer=await env.DB.prepare("SELECT published_json FROM settings WHERE key='footer'").first();
      const active=new Set(data.results.map(x=>x.id));
      return json({pages:data.results.filter(x=>!x.parent_id||active.has(x.parent_id)).map(x=>({...x,data:JSON.parse(x.published_json),published_json:undefined})),footer:footer?JSON.parse(footer.published_json):{},turnstileSiteKey:env.TURNSTILE_SITE_KEY||""});
    }
    if(path.startsWith("/api/")){
      if(request.method!=="GET" && !sameOrigin(request)) return fail("Origine non autorisée",403);
      if(path.startsWith("/api/admin/")) return await adminApi(request,env,path);
      if(path==="/api/contact"&&request.method==="POST") return await onContact(request,env);
      return fail("Route inconnue",404);
    }
    return env.ASSETS.fetch(request);
  } catch(err){
    console.error("Worker route failed",err instanceof Error?err.message:err);
    return fail("Erreur du serveur",500);
  }
 }
};
export {slugify,normalizePage,normalizeFooter};
