const root=document.querySelector("#app"),brand=document.querySelector("#site-brand");
const menu=document.querySelector("#site-menu"),menuButton=document.querySelector("#menu-button");
let state={pages:[],footer:{},turnstileSiteKey:""};
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const alignClass=value=>value==="center"?"align-center":"align-left";
const safeImage=s=>/^\/media\/[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(String(s||""));
const safeLink=s=>{try{const u=new URL(s);return u.protocol==="https:"?u.href:"";}catch{return "";}}
function marked(s){return esc(s).replace(/\*\*(.+?)\*\*/gs,"<strong>$1</strong>").replace(/__(.+?)__/gs,"<u>$1</u>").replace(/\n/g,"<br>");}
function closeMenu(){menu.hidden=true;menuButton.setAttribute("aria-expanded","false");document.body.style.overflow="";}
function openMenu(){menu.hidden=false;menuButton.setAttribute("aria-expanded","true");document.body.style.overflow="hidden";menu.querySelector(".menu-close").focus();}
menuButton.addEventListener("click",()=>menu.hidden?openMenu():closeMenu());
document.querySelector("#menu-close").addEventListener("click",closeMenu);
menu.addEventListener("click",e=>{if(e.target===menu)closeMenu();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu();});
function pathFor(p){return p.kind==="home"?"/":p.kind==="detail"?"/realisation/"+encodeURIComponent(p.slug):"/"+encodeURIComponent(p.slug);}
function navigate(path){
  if(window.location.pathname!==path) history.pushState({}, "",path);
  closeMenu();render();window.scrollTo(0,0);
}
document.addEventListener("click",e=>{
  const a=e.target.closest("a[data-link]");if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
  const link=new URL(a.href,location.origin);if(link.origin!==location.origin)return;
  e.preventDefault();navigate(link.pathname);
});
window.addEventListener("popstate",()=>{closeMenu();render();});
function picture(url,alt=""){
  if(!safeImage(url))return "";
  return '<img loading="lazy" src="'+esc(url)+'" alt="'+esc(alt)+'">';
}
function blockHtml(b){
  switch(b.type){
    case "heading":return b.text?.trim()?'<h2 class="block-heading '+alignClass(b.align)+'">'+esc(b.text)+'</h2>':"";
    case "subtitle":return b.text?.trim()?'<h2 class="block-subtitle '+alignClass(b.align)+'">'+esc(b.text)+'</h2>':"";
    case "label":return b.text?.trim()?'<h2 class="block-label '+alignClass(b.align)+'">'+esc(b.text)+'</h2>':"";
    case "text":return b.text?.trim()?'<div class="block-text '+alignClass(b.align)+' '+(b.lineHeight==="large"?"line-large":b.lineHeight==="extra"?"line-extra":"")+'">'+marked(b.text)+'</div>':"";
    case "image":{
      if(!safeImage(b.src))return "";
      const caption=b.caption??b.alt??"";
      return '<figure class="block-image">'+picture(b.src,b.alt||caption)+
        (caption.trim()?'<figcaption class="image-caption">'+marked(caption)+'</figcaption>':"")+'</figure>';
    }
    case "press": {
      const link=safeLink(b.url);
      if(!link || (!b.title?.trim() && !safeImage(b.src)))return "";
      return '<a class="press-card" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">'+
        (b.title?.trim()?'<div class="press-card-title '+alignClass(b.align)+'">'+esc(b.title)+'</div>':"")+
        (safeImage(b.src)?'<div class="press-image">'+picture(b.src,b.title)+'</div>':"")+'</a>';
    }
    default:return "";
  }
}
function listGallery(p){
  const children=state.pages.filter(x=>x.kind==="detail"&&x.parent_id===p.id).sort((a,b)=>a.nav_order-b.nav_order);
  if(!children.length)return "";
  return '<div class="gallery-list">'+children.map(x=>{
    const cover=x.data.cover||x.data.blocks.find(b=>b.type==="image"&&safeImage(b.src))?.src||"";
    return '<a href="'+pathFor(x)+'" data-link class="gallery-card '+(cover?"":"no-image")+'">'+picture(cover,x.data.title)+'<span class="gallery-caption">'+esc(x.data.title)+'</span></a>';
  }).join("")+'</div>';
}
function renderPage(p){
  const d=p.data||{},home=p.kind==="home";
  brand.classList.toggle("is-hidden",home);
  const intro='<h1 class="page-title '+alignClass(d.titleAlign)+'">'+esc(d.title)+'</h1>'+(d.subtitle?'<p class="page-subtitle '+alignClass(d.subtitleAlign)+'">'+esc(d.subtitle)+'</p>':"");
  const back=p.kind==="detail"&&p.parent_id?state.pages.find(x=>x.id===p.parent_id):null;
  const blocks=Array.isArray(d.blocks)?d.blocks:[];
  const sections=blocks.filter(x=>x.type!=="press").map(b=>({b,html:blockHtml(b)})).filter(x=>x.html);
  const other=sections.map(x=>'<section class="content-block block-wrap-'+x.b.type+'">'+x.html+'</section>').join("");
  const detailText=sections.filter(x=>x.b.type!=="image").map(x=>'<section class="content-block block-wrap-'+x.b.type+'">'+x.html+'</section>').join("");
  const detailImages=sections.filter(x=>x.b.type==="image").map(x=>'<section class="content-block block-wrap-image">'+x.html+'</section>').join("");
  const description=p.kind==="detail"&&d.description?.trim()?'<div class="project-description '+alignClass(d.descriptionAlign)+'">'+marked(d.description)+'</div>':"";
  const body=p.kind==="detail"?description+detailText+'<div class="detail-photo-list">'+detailImages+'</div>':other;
  const press=blocks.filter(x=>x.type==="press").map(blockHtml).join("");
  root.innerHTML='<article class="page '+(home?"page-home":"")+(p.kind==="detail"?" page-detail":"")+'">'+(back?'<a class="project-back" data-link href="'+pathFor(back)+'">← '+esc(back.data.title)+'</a>':"")+intro+body+
    (p.kind==="gallery"?listGallery(p):"")+(p.kind==="press"?'<div class="press-list">'+press+'</div>':"")+
    (p.kind==="contact"?contactForm():"")+'</article>';
  document.title=esc(d.title)+" — Nadège Renard";
  if(p.kind==="contact") setupContact();
}
function contactForm(){
  return '<form class="contact-form" id="contact-form">'+
    '<div class="field"><label for="sender-name">Nom</label><input id="sender-name" name="name" maxlength="120" required autocomplete="name"></div>'+
    '<div class="field"><label for="sender-email">Adresse e-mail</label><input id="sender-email" name="email" type="email" maxlength="254" required autocomplete="email"></div>'+
    '<div class="field"><label for="sender-subject">Sujet</label><input id="sender-subject" name="subject" maxlength="160"></div>'+
    '<div class="field"><label for="sender-message">Message</label><textarea id="sender-message" name="message" maxlength="5000" required></textarea></div>'+
    '<p style="font-size:13px;color:#666;margin:0">Les informations transmises sont utilisées uniquement pour répondre à votre demande.</p>'+
    '<div id="turnstile-box"></div><button type="submit" class="submit" '+(!state.turnstileSiteKey?"disabled":"")+' >Envoyer</button>'+
    '<div class="form-message" id="contact-result" role="status" aria-live="polite">'+(!state.turnstileSiteKey?"Formulaire en cours de configuration.":"")+'</div>'+
    '</form>';
}
let currentWidget=null;
async function setupContact(){
  if(!state.turnstileSiteKey)return;
  if(!window.turnstile){
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async=true;s.onload=resolve;s.onerror=reject;document.head.append(s);
    }).catch(()=>null);
  }
  if(window.turnstile&&document.getElementById("turnstile-box")){
    currentWidget=turnstile.render("#turnstile-box",{sitekey:state.turnstileSiteKey,theme:"light"});
  }
  document.querySelector("#contact-form")?.addEventListener("submit",async e=>{
    e.preventDefault();const f=e.currentTarget,result=f.querySelector("#contact-result"),btn=f.querySelector("button[type=submit]");
    const token=window.turnstile&&currentWidget!==null?turnstile.getResponse(currentWidget):"";
    if(!token){result.textContent="Merci de confirmer la vérification anti-robot.";result.className="form-message error";return;}
    btn.disabled=true;result.textContent="Envoi en cours…";result.className="form-message";
    try{
      const payload=Object.fromEntries(new FormData(f).entries());payload.token=token;
      const r=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      const v=await r.json();if(!r.ok)throw Error(v.error||"Échec de l'envoi");
      f.reset();result.textContent="Merci, votre message a bien été envoyé.";if(window.turnstile)turnstile.reset(currentWidget);
    }catch(err){result.textContent=err.message;result.className="form-message error";if(window.turnstile)turnstile.reset(currentWidget);}
    finally{btn.disabled=false;}
  });
}
function updateMenu(){
  const entries=state.pages.filter(x=>x.kind!=="detail"&&x.parent_id===null).sort((a,b)=>a.nav_order-b.nav_order);
  document.querySelector("#menu-links").innerHTML=entries.map(p=>'<a href="'+pathFor(p)+'" data-link>'+esc(p.kind==="home"?"ACCUEIL":p.data.title)+'</a>').join("");
}
function updateFooter(){
  const f=state.footer||{},social=[];
  const icons={
    linkedin:'<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.603 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 .001-4.124 2.062 2.062 0 0 1-.001 4.124Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0Z"/></svg>',
    instagram:'<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/></svg>'
  };
  if(safeLink(f.linkedin))social.push('<a href="'+esc(f.linkedin)+'" target="_blank" rel="noopener noreferrer">'+icons.linkedin+'<span>LinkedIn</span></a>');
  if(safeLink(f.instagram))social.push('<a href="'+esc(f.instagram)+'" target="_blank" rel="noopener noreferrer">'+icons.instagram+'<span>Instagram</span></a>');
  document.querySelector("#social-links").innerHTML=social.join("");
  document.querySelector("#copyright").textContent=f.copyright||"© Nadège Renard";
  document.querySelector("#legal-text").textContent=f.legal||"Mentions légales à compléter.";
}
const dialog=document.querySelector("#legal-dialog");
document.querySelector("#legal-button").addEventListener("click",()=>dialog.showModal());
document.querySelector("#legal-close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
function render(){
  const route=decodeURIComponent(window.location.pathname.replace(/\/$/,""))||"/";
  let p=route==="/"?state.pages.find(x=>x.kind==="home"):route.startsWith("/realisation/")?
    state.pages.find(x=>x.kind==="detail"&&"/realisation/"+x.slug===route):
    state.pages.find(x=>x.kind!=="detail"&&"/"+x.slug===route);
  if(!p){
    brand.classList.remove("is-hidden");root.innerHTML='<div class="error-state"><h1>PAGE INTROUVABLE</h1><a href="/" data-link>Retour à l’accueil</a></div>';
    document.title="Page introuvable — Nadège Renard";return;
  }
  renderPage(p);
}
async function start(){
  try{
    const r=await fetch("/api/site",{headers:{"accept":"application/json"}});
    if(!r.ok)throw Error("Données indisponibles");
    state=await r.json();updateMenu();updateFooter();render();
  }catch(e){root.innerHTML='<div class="error-state">Le site est momentanément indisponible.</div>';}
}
start();
