import {LEGAL_FIELDS,legalDocument,privacyDocument,copyrightText} from "/legal.js";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const imageOK=s=>/^\/media\/[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(String(s||""));
const externalOK=s=>{try{return new URL(s).protocol==="https:";}catch{return false;}};
const alignClass=value=>value==="center"?"align-center":"align-left";
const blockNames={heading:"Grand titre",subtitle:"Sous-titre",label:"Petit titre",text:"Texte",image:"Photographie",press:"Article de presse"};
let db={pages:[],footer:null},selected="home",draft=null,dirty=false;
const error=e=>{const el=$("#status");el.textContent=String(e);el.classList.add("error");};
const notice=s=>{const el=$("#status");el.textContent=s;el.classList.remove("error");};
async function api(route,data){
  const options=data===undefined?{}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)};
  const response=await fetch("/api/admin/"+route,options);
  let result={};
  try{result=await response.json();}catch{}
  if(!response.ok)throw Error(result.error||"Erreur HTTP "+response.status);
  return result;
}
async function stateLoad(){
  const data=await api("state");
  db={pages:data.pages.map(p=>({...p,draft:JSON.parse(p.draft_json),published:p.published_json?JSON.parse(p.published_json):null})),footer:data.footer?{draft:JSON.parse(data.footer.draft_json),published:data.footer.published_json?JSON.parse(data.footer.published_json):null}:null};
  $("#login-view").hidden=true;$("#editor-view").hidden=false;$("#logout").hidden=false;
  drawSidebar();select(selected);
}
function allVisible(){return db.pages.filter(p=>!p.is_trashed);}
function page(id){return db.pages.find(p=>p.id===id);}
function drawSidebar(){
  const visible=allVisible();
  const primary=visible.filter(p=>p.kind!=="detail").sort((a,b)=>a.nav_order-b.nav_order);
  const projects=visible.filter(p=>p.kind==="detail").sort((a,b)=>a.nav_order-b.nav_order);
  const button=p=>'<button class="admin-page" data-select="'+esc(p.id)+'">'+esc(p.draft.title)+'</button>';
  $("#page-list").innerHTML=primary.map(button).join("")+
    (projects.length?'<div class="sidebar-divider" role="separator"></div><div class="sidebar-section-title">RÉALISATIONS</div>'+
      projects.map(button).join(""):"");
  document.querySelectorAll("[data-select]").forEach(btn=>btn.addEventListener("click",()=>select(btn.dataset.select)));
}
function select(id){
  if(dirty && selected!==id && !confirm("Des modifications n’ont pas été enregistrées. Voulez-vous vraiment changer de page ?"))return;
  selected=id;dirty=false;
  const p=page(id);
  if(id==="footer"){draft=structuredClone(db.footer?.draft||{instagram:"",linkedin:"",legal:"",copyright:""});draft.legalDetails??={};showFooter();}
  else if(id==="trash"){draft=null;showTrash();}
  else if(p){draft=structuredClone(p.draft);if(p.kind==="home"){for(const block of draft.blocks||[]){if(block.type==="image"&&block.alt==="Photo d\u0027accueil")block.alt="";}}showPage();}
  else{selected="home";draft=structuredClone(page("home")?.draft||{});showPage();}
  document.querySelectorAll("[data-select]").forEach(btn=>btn.classList.toggle("active",btn.dataset.select===selected));
}
function renderField(label,key,value,opts={}){
  const id="field-"+key;
  return '<div class="admin-field"><div class="field-heading"><label for="'+id+'">'+esc(label)+'</label>'+
    (opts.alignKey?alignmentButtons(opts.alignValue,'data-align-key="'+opts.alignKey+'"',label):"")+'</div>'+
    (opts.multiline?'<textarea id="'+id+'" data-key="'+key+'" rows="'+(opts.rows||5)+'">'+esc(value)+'</textarea>':
      '<input id="'+id+'" data-key="'+key+'" value="'+esc(value)+'" '+(opts.type?'type="'+opts.type+'"':"")+'>')+
    (opts.hint?'<span class="field-tip">'+esc(opts.hint)+'</span>':"")+'</div>';
}
function alignmentButtons(value,attrs,label="Alignement du texte"){
  const selected=value==="center"?"center":"left";
  const icons={
    left:'<path d="M3 5h18M3 9h12M3 13h18M3 17h12"/>',
    center:'<path d="M3 5h18M6 9h12M3 13h18M6 17h12"/>'
  };
  return '<span class="align-controls" role="group" aria-label="'+esc(label)+'">'+
    ["left","center"].map(v=>'<button type="button" class="align-button '+(selected===v?"is-active":"")+
      '" data-align-value="'+v+'" '+attrs+' aria-label="'+(v==="left"?"Aligner à gauche":"Centrer")+
      '" aria-pressed="'+(selected===v)+'" title="'+(v==="left"?"Aligner à gauche":"Centrer")+'">'+
      '<svg viewBox="0 0 24 22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'+icons[v]+'</svg></button>').join("")+
    '</span>';
}
function choosePhoto(path,current,label="Photographie"){
  const id="media-"+path.replaceAll(":","-"),exists=imageOK(current);
  return '<div class="admin-field"><label>'+esc(label)+' (JPG, PNG, WEBP, AVIF, max. 8 Mo)</label>'+
    '<div class="upload-box"><button type="button" class="mini" data-pick-photo="'+id+'">'+(exists?"Remplacer la photographie":"Ajouter une photographie")+'</button>'+
    '<span class="photo-upload-status">'+(exists?"✓ Photographie déjà enregistrée":"Aucune photographie enregistrée")+'</span>'+
    '<input type="file" class="visually-hidden-file" id="'+id+'" aria-label="'+esc(label)+'" accept="image/jpeg,image/png,image/webp,image/avif" data-upload="'+esc(path)+'">'+
    (exists?'<button type="button" class="mini" data-clear="'+esc(path)+'">Retirer la photo</button>':"")+'</div>'+
    (exists?'<img class="upload-preview" src="'+esc(current)+'" alt="Image sélectionnée">':"")+'</div>';
}
function photoAuthorField(i,author=""){
  return '<div class="admin-field"><label for="photo-author-'+i+'">Auteur de la photographie (facultatif)</label>'+
    '<input id="photo-author-'+i+'" type="text" maxlength="200" data-block="'+i+'" data-bkey="credit" value="'+esc(author)+'" placeholder="Ex. Sébastien Durand">'+
    '<span class="field-tip">Le symbole © s’ajoute automatiquement. Si ce champ est vide, aucun crédit ne s’affiche.</span></div>';
}
function renderBlock(b,i){
  const textField=(label,key="text",rows=4)=>{
    const id="block-"+i+"-"+key;
    const value=key==="caption"?(b.caption??b.alt??""):(b[key]||"");
    return '<div class="admin-field"><div class="field-heading"><label for="'+id+'">'+esc(label)+'</label>'+
      (b.type!=="image"?alignmentButtons(b.align,'data-align-block="'+i+'"',label):"")+'</div>'+
      '<textarea id="'+id+'" data-block="'+i+'" data-bkey="'+key+'" rows="'+rows+'">'+esc(value)+'</textarea></div>';
  };
  let inner="";
  if(b.type==="text"){
    inner='<div class="formatbar"><button type="button" class="mini" data-format="bold" data-i="'+i+'"><strong>G</strong> Gras</button>'+
      '<button type="button" class="mini" data-format="underline" data-i="'+i+'"><u>S</u> Souligner</button>'+
      '<span class="field-tip">Sélectionnez des mots, puis cliquez sur une mise en forme.</span></div>'+
      textField("Paragraphe")+"<div class='admin-field'><label>Espacement entre les lignes</label><select data-block='"+i+"' data-bkey='lineHeight'>"+
      ["normal","large","extra"].map(v=>'<option value="'+v+'" '+((b.lineHeight||"normal")===v?"selected":"")+">"+({normal:"Normal",large:"Aéré",extra:"Très aéré"}[v])+"</option>").join("")+"</select></div>";
  }else if(b.type==="image"){inner=choosePhoto("block:"+i,b.src)+textField("Texte affiché sous la photographie (facultatif)","caption",3)+photoAuthorField(i,b.credit);}
  else if(b.type==="press"){
    inner=textField("Titre au-dessus de la photographie","title",2)+choosePhoto("block:"+i,b.src)+photoAuthorField(i,b.credit)+textField("Adresse https:// de l’article","url",2);
  }else inner=textField(blockNames[b.type]);
  return '<div class="block-editor" data-block-wrapper="'+i+'"><div class="block-bar"><h3>'+blockNames[b.type]+' '+(i+1)+'</h3>'+
    '<div class="move-actions"><button class="mini" data-up="'+i+'" aria-label="Monter">↑</button>'+
    '<button class="mini" data-down="'+i+'" aria-label="Descendre">↓</button>'+
    '<button class="mini" data-remove="'+i+'">Supprimer</button></div></div>'+inner+'</div>';
}
function galleryProjects(){
  const children=allVisible().filter(x=>x.kind==="detail"&&x.parent_id===selected).sort((a,b)=>a.nav_order-b.nav_order);
  return '<section class="form-card project-manager"><h3>Réalisations</h3>'+
    '<p class="field-tip">Chaque photo avec son titre blanc ouvre une page de réalisation. Les changements de titre et de photo sont enregistrés en brouillon ici.</p>'+
    children.map(p=>'<article class="project-editor-card" id="project-'+esc(p.id)+'">'+
      '<div class="gallery-card project-card-preview '+(imageOK(p.draft.cover)?"":"no-image")+'">'+
        '<div class="gallery-photo">'+
        (imageOK(p.draft.cover)?'<img src="'+esc(p.draft.cover)+'" alt="">':'<span class="project-photo-placeholder">Photographie à ajouter</span>')+
        '<span class="gallery-caption" data-project-caption="'+esc(p.id)+'">'+esc(p.draft.title)+'</span></div>'+
        '<span class="gallery-credit" data-project-credit-preview="'+esc(p.id)+'"'+(!imageOK(p.draft.cover)||!copyrightText(p.draft.coverCredit)?' hidden':'')+'>'+esc(copyrightText(p.draft.coverCredit))+'</span></div>'+
      '<div class="admin-field"><label for="project-name-'+esc(p.id)+'">Nom affiché en blanc sur la photo</label>'+
        '<input id="project-name-'+esc(p.id)+'" data-project-title="'+esc(p.id)+'" maxlength="180" value="'+esc(p.draft.title)+'"></div>'+
      '<div class="admin-field"><label>Photographie de cette réalisation</label>'+
        '<div class="project-photo-action"><button type="button" class="outline-button" data-project-photo-pick="'+esc(p.id)+'">'+
          (imageOK(p.draft.cover)?"Remplacer la photographie":"Ajouter une photographie")+'</button>'+
          '<span class="photo-upload-status" role="status">'+(imageOK(p.draft.cover)?"✓ Photographie déjà enregistrée":"Aucune photographie enregistrée")+'</span></div>'+
        '<input id="project-photo-'+esc(p.id)+'" type="file" class="visually-hidden-file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Choisir une photographie" data-project-upload="'+esc(p.id)+'"></div>'+
       '<div class="admin-field"><label for="project-credit-'+esc(p.id)+'">Auteur de cette photographie (facultatif)</label>'+
         '<input id="project-credit-'+esc(p.id)+'" maxlength="200" data-project-credit="'+esc(p.id)+'" value="'+esc(p.draft.coverCredit||"")+'" placeholder="Ex. Sébastien Durand">'+
         '<span class="field-tip">Si renseigné : © suivi du nom, sinon aucun crédit.</span></div>'+
      '<div class="project-controls"><button type="button" class="outline-button" data-project-save="'+esc(p.id)+'">Enregistrer la photo et le titre</button>'+
        '<button type="button" class="black-button" data-project-edit="'+esc(p.id)+'">Modifier la page de cette réalisation →</button>'+
        '<button type="button" class="project-trash-button" data-project-trash="'+esc(p.id)+'" aria-label="Mettre la réalisation '+esc(p.draft.title)+' dans la corbeille">Mettre à la corbeille</button></div>'+
      '<p class="field-tip" data-project-status="'+esc(p.id)+'">'+(p.published?"Visible sur le site après sa dernière publication.":"Brouillon non publié.")+'</p></article>').join("")+
    '<button type="button" class="outline-button" id="add-project">＋ Ajouter une réalisation</button></section>';
}
function showPage(){
  const p=page(selected);if(!p)return;
  $("#editor-title").textContent=draft.title;$("#actions").hidden=false;$("#preview").hidden=false;
  const kind=p.kind;
  let html='<section class="form-card"><h3>'+(kind==="detail"?"Page de réalisation":"Contenu principal")+'</h3>'+
    renderField(kind==="detail"?"Nom de la réalisation":"Grand titre de la page","title",draft.title,{alignKey:"titleAlign",alignValue:draft.titleAlign})+
    renderField("Sous-titre (facultatif)","subtitle",draft.subtitle||"",{multiline:true,rows:2,alignKey:"subtitleAlign",alignValue:draft.subtitleAlign})+
    (kind==="detail"?renderField("Texte sous le titre et le sous-titre","description",draft.description||"",{multiline:true,rows:8,alignKey:"descriptionAlign",alignValue:draft.descriptionAlign,hint:"Utilisez une ligne vide pour séparer les paragraphes."}):"")+
    '</section>';
  // Une réalisation ne doit pas obliger à descendre après toutes ses photos pour être mise à la corbeille.
  if(kind==="detail"&&!p.is_core){
    html+='<div class="project-trash-top"><button type="button" id="move-trash" class="project-trash-button">Mettre cette réalisation à la corbeille</button>'+
      '<span class="field-tip">Vous pourrez la restaurer depuis la corbeille. Les photos sont conservées.</span></div>';
  }
  if(kind==="detail"){
    const legacy=draft.blocks.map((b,i)=>({b,i})).filter(x=>x.b.type!=="image");
    if(legacy.length)html+='<h3>Autres textes déjà enregistrés</h3>'+legacy.map(x=>renderBlock(x.b,x.i)).join("");
    html+='<h3>Photographies de la réalisation</h3>'+
      '<p class="field-tip">Ces images apparaissent sous le texte. La photo de présentation de la galerie se modifie dans la page de galerie.</p>'+
      draft.blocks.map((b,i)=>b.type==="image"?renderBlock(b,i):"").join("")+
      '<div class="block-buttons"><button type="button" data-add="image">＋ Ajouter une photographie</button></div>';
  }else{
    html+='<h3>Éléments de la page</h3>'+draft.blocks.map(renderBlock).join("")+
      '<div class="block-buttons">'+Object.entries(blockNames).filter(([k])=>kind==="press"||k!=="press").map(([k,v])=>'<button type="button" data-add="'+k+'">＋ '+v+'</button>').join("")+'</div>';
    if(kind==="gallery")html+=galleryProjects();
  }
  if(!p.is_core&&kind!=="detail")html+='<hr class="section-line"><button type="button" id="move-trash" class="danger-button">Déplacer cette page dans la corbeille</button>';
  $("#editing-panel").innerHTML=html;
  bindContentFields();bindButtons();bindProjectCards();drawPreview();
  if(!dirty)notice(p.published?"Page publiée. Les modifications restent privées avant le prochain clic sur PUBLIER.":"Brouillon non publié.");
}
function markDirty(){dirty=true;notice("Modifications non publiées. Enregistrez votre brouillon ou cliquez sur PUBLIER.");drawPreview();}
function bindContentFields(){
  $("#editing-panel").querySelectorAll("[data-pick-photo]").forEach(btn=>btn.addEventListener("click",()=>{
    document.getElementById(btn.dataset.pickPhoto)?.click();
  }));
  $("#editing-panel").querySelectorAll("[data-key]").forEach(el=>el.addEventListener("input",()=>{
    draft[el.dataset.key]=el.value;if(el.dataset.key==="title")$("#editor-title").textContent=el.value;markDirty();
  }));
  $("#editing-panel").querySelectorAll("[data-block]").forEach(el=>el.addEventListener("input",()=>{
    draft.blocks[Number(el.dataset.block)][el.dataset.bkey]=el.value;markDirty();
  }));
  $("#editing-panel").querySelectorAll("[data-legal-key]").forEach(el=>el.addEventListener("input",()=>{
    draft.legalDetails??={};draft.legalDetails[el.dataset.legalKey]=el.value;markDirty();
  }));
  $("#editing-panel").querySelectorAll("[data-align-value]").forEach(el=>el.addEventListener("click",()=>{
    const value=el.dataset.alignValue;
    if(el.dataset.alignBlock!==undefined)draft.blocks[Number(el.dataset.alignBlock)].align=value;
    else draft[el.dataset.alignKey]=value;
    el.parentElement.querySelectorAll("[data-align-value]").forEach(button=>{
      const active=button.dataset.alignValue===value;
      button.classList.toggle("is-active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    markDirty();
  }));
  $("#editing-panel").querySelectorAll("[data-upload]").forEach(el=>el.addEventListener("change",async()=>{
    const file=el.files?.[0];if(!file)return;
    notice("Envoi de la photographie…");
    try{
      const url=await uploadPhoto(file);
      setPhoto(el.dataset.upload,url);markDirty();showPage();
    }catch(e){error(e.message);}
  }));
}
function setPhoto(path,url){
  const i=Number(path.split(":")[1]);draft.blocks[i].src=url;
}
async function uploadPhoto(file){
  if(!file||file.size>8*1024*1024||file.size===0)throw Error("Photographie limitée à 8 Mo");
  const fd=new FormData();fd.append("file",file);
  const response=await fetch("/api/admin/upload",{method:"POST",body:fd});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||"Impossible d'envoyer la photo");
  return result.url;
}
async function saveProject(id){
  const p=page(id),field=document.querySelector('[data-project-title="'+id+'"]'),creditField=document.querySelector('[data-project-credit="'+id+'"]');
  if(!p||!field)throw Error("Réalisation introuvable");
  const title=field.value.trim();
  if(!title)throw Error("Donnez un nom à cette photographie.");
  p.draft.title=title;
  if(creditField)p.draft.coverCredit=creditField.value;
  await api("save",{id,content:p.draft});
  drawSidebar();
  const status=document.querySelector('[data-project-status="'+id+'"]');
  if(status)status.textContent="Nom et photographie enregistrés en brouillon. Ouvrez la page pour la publier.";
  return p;
}
function bindProjectCards(){
  document.querySelectorAll("[data-project-credit]").forEach(el=>el.addEventListener("input",()=>{
    const p=page(el.dataset.projectCredit);if(!p)return;
    p.draft.coverCredit=el.value;
    const preview=document.querySelector('[data-project-credit-preview="'+el.dataset.projectCredit+'"]');
    if(preview){preview.textContent=copyrightText(el.value);preview.hidden=!imageOK(p.draft.cover)||!copyrightText(el.value);}
  }));
  document.querySelectorAll("[data-project-title]").forEach(el=>el.addEventListener("input",()=>{
    const caption=document.querySelector('[data-project-caption="'+el.dataset.projectTitle+'"]');
    if(caption)caption.textContent=el.value||"Nouvelle réalisation";
  }));
  document.querySelectorAll("[data-project-save]").forEach(btn=>btn.addEventListener("click",async()=>{
    btn.disabled=true;
    try{await saveProject(btn.dataset.projectSave);notice("Vignette enregistrée en brouillon.");}
    catch(e){error(e.message);}
    finally{btn.disabled=false;}
  }));
  document.querySelectorAll("[data-project-edit]").forEach(btn=>btn.addEventListener("click",async()=>{
    btn.disabled=true;
    try{
      const id=btn.dataset.projectEdit;
      if(dirty)await save();
      await saveProject(id);
      select(id);
    }catch(e){error(e.message);}
    finally{if(btn.isConnected)btn.disabled=false;}
  }));
  // Le bouton est accessible directement sur chaque fiche de réalisation dans les galeries.
  document.querySelectorAll("[data-project-trash]").forEach(btn=>btn.addEventListener("click",async()=>{
    btn.disabled=true;
    try{await movePageToTrash(btn.dataset.projectTrash);}
    catch(e){error(e.message);}
    finally{if(btn.isConnected)btn.disabled=false;}
  }));
  document.querySelectorAll("[data-project-photo-pick]").forEach(button=>button.addEventListener("click",()=>{
    const input=document.getElementById("project-photo-"+button.dataset.projectPhotoPick);
    input?.click();
  }));
  document.querySelectorAll("[data-project-upload]").forEach(el=>el.addEventListener("change",async()=>{
    const id=el.dataset.projectUpload,p=page(id);
    if(!p||!el.files?.[0])return;
    el.disabled=true;
    try{
      notice("Import de la photographie…");
      const url=await uploadPhoto(el.files[0]);
      p.draft.cover=url;
      await saveProject(id);
      showPage();
      notice("Photo de réalisation enregistrée en brouillon. Ouvrez sa page pour la publier.");
    }catch(e){error(e.message);}
    finally{if(el.isConnected)el.disabled=false;}
  }));
}
function bindButtons(){
  $("#editing-panel").querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>{
    const type=btn.dataset.add;draft.blocks.push({type,text:"",title:"",src:"",url:"",alt:"",caption:"",credit:"",lineHeight:"normal",align:"left"});markDirty();showPage();
  }));
  $("#editing-panel").querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>{draft.blocks.splice(Number(btn.dataset.remove),1);markDirty();showPage();}));
  $("#editing-panel").querySelectorAll("[data-up]").forEach(btn=>btn.addEventListener("click",()=>move(Number(btn.dataset.up),-1)));
  $("#editing-panel").querySelectorAll("[data-down]").forEach(btn=>btn.addEventListener("click",()=>move(Number(btn.dataset.down),1)));
  $("#editing-panel").querySelectorAll("[data-clear]").forEach(btn=>btn.addEventListener("click",()=>{setPhoto(btn.dataset.clear,"");markDirty();showPage();}));
  $("#editing-panel").querySelectorAll("[data-format]").forEach(btn=>btn.addEventListener("click",()=>{
    const el=$("#block-"+btn.dataset.i+"-text");if(!el)return;
    const a=el.selectionStart,b=el.selectionEnd,token=btn.dataset.format==="bold"?"**":"__";
    el.value=el.value.slice(0,a)+token+el.value.slice(a,b)+token+el.value.slice(b);
    el.dispatchEvent(new Event("input",{bubbles:true}));el.focus();el.setSelectionRange(a+token.length,b+token.length);
  }));
  $("#add-project")?.addEventListener("click",()=>createPage(selected));
  $("#move-trash")?.addEventListener("click",trashPage);
}
function move(i,by){const j=i+by;if(j<0||j>=draft.blocks.length)return;
  [draft.blocks[i],draft.blocks[j]]=[draft.blocks[j],draft.blocks[i]];markDirty();showPage();}
function previewBlock(b){
  switch(b.type){
  case "heading":return b.text?.trim()?'<h2 class="block-heading '+alignClass(b.align)+'">'+esc(b.text)+'</h2>':"";
  case "subtitle":return b.text?.trim()?'<h2 class="block-subtitle '+alignClass(b.align)+'">'+esc(b.text)+'</h2>':"";
  case "label":return b.text?.trim()?'<h2 class="block-label '+alignClass(b.align)+'">'+esc(b.text)+'</h2>':"";
  case "text":return b.text?.trim()?'<p class="block-text '+alignClass(b.align)+'">'+esc(b.text).replace(/\*\*(.+?)\*\*/gs,"<strong>$1</strong>").replace(/__(.+?)__/gs,"<u>$1</u>").replace(/\n/g,"<br>")+'</p>':"";
  case "image":{
    if(!imageOK(b.src))return "";
    const caption=b.caption??b.alt??"";
    return '<figure class="block-image"><img src="'+esc(b.src)+'" alt="'+esc(b.alt||caption)+'">'+
      (copyrightText(b.credit)?'<p class="photo-credit">'+esc(copyrightText(b.credit))+'</p>':"")+
      (caption.trim()?'<figcaption class="image-caption">'+esc(caption).replace(/\n/g,"<br>")+'</figcaption>':"")+'</figure>';
  }
  case "press":return (b.title?.trim()?'<h3 class="press-card-title '+alignClass(b.align)+'">'+esc(b.title)+'</h3>':"")+
      (imageOK(b.src)?'<figure><img src="'+esc(b.src)+'" alt="">'+(copyrightText(b.credit)?'<figcaption class="photo-credit">'+esc(copyrightText(b.credit))+'</figcaption>':"")+'</figure>':"");
  default:return "";
  }
}
// Aperçu fidèle au site : regrouper les images voisines sans déplacer les paragraphes.
function groupedPreviewPhotos(items){
  let result="",photos=[];
  const flush=()=>{if(photos.length){result+='<div class="page-photo-list">'+photos.join("")+'</div>';photos=[];}};
  for(const {b,html} of items){
    const section='<section class="content-block block-wrap-'+b.type+'">'+html+'</section>';
    if(b.type==="image")photos.push(section);
    else{flush();result+=section;}
  }
  flush();
  return result;
}
function drawPreview(){
  if(selected==="trash")return;
  const target=$("#preview-content");if(!target)return;
  if(selected==="footer"){
    const legalPreview=document.querySelector("#legal-ready-preview"),privacyPreview=document.querySelector("#privacy-ready-preview");
    if(legalPreview)legalPreview.textContent=legalDocument(draft);
    if(privacyPreview)privacyPreview.textContent=privacyDocument(draft);
    target.innerHTML='<div style="background:#111;color:white;padding:25px">'+
      '<p>CONTACT</p><p>'+esc(draft.instagram)+'</p><p>'+esc(draft.linkedin)+'</p>'+
      '<p>'+esc(draft.copyright)+'</p><h3>MENTIONS LÉGALES</h3><p style="white-space:pre-wrap">'+esc(legalDocument(draft,true))+'</p>'+
      '<h3>CONFIDENTIALITÉ</h3><p style="white-space:pre-wrap">'+esc(privacyDocument(draft))+'</p></div>';return;}
  if(!draft)return;
  const p=page(selected);
  const gallery=p?.kind==="gallery"?'<div class="gallery-list">'+
    allVisible().filter(x=>x.kind==="detail"&&x.parent_id===p.id&&imageOK(x.draft.cover)).map(x=>
      '<div class="gallery-card"><div class="gallery-photo"><img src="'+esc(x.draft.cover)+'" alt=""><span class="gallery-caption">'+esc(x.draft.title)+'</span></div>'+
        (copyrightText(x.draft.coverCredit)?'<span class="gallery-credit">'+esc(copyrightText(x.draft.coverCredit))+'</span>':"")+'</div>').join("")+'</div>':"";
  const previewItems=draft.blocks.map(b=>({b,html:previewBlock(b)})).filter(x=>x.html);
  const detailText=previewItems.filter(x=>x.b.type!=="image").map(x=>'<section class="content-block block-wrap-'+x.b.type+'">'+x.html+'</section>').join("");
  const images=previewItems.filter(x=>x.b.type==="image").map(x=>'<section class="content-block block-wrap-image">'+x.html+'</section>').join("");
  const generic=p?.kind==="home"?previewItems.map(x=>'<section class="content-block block-wrap-'+x.b.type+'">'+x.html+'</section>').join(""):groupedPreviewPhotos(previewItems);
  const description=p?.kind==="detail"&&draft.description?.trim()?'<div class="project-description '+alignClass(draft.descriptionAlign)+'">'+
    esc(draft.description).replace(/\*\*(.+?)\*\*/gs,"<strong>$1</strong>").replace(/__(.+?)__/gs,"<u>$1</u>").replace(/\n/g,"<br>")+'</div>':"";
  target.innerHTML='<div class="'+(p?.kind==="detail"?"page-detail":"")+'"><h1 class="page-title '+alignClass(draft.titleAlign)+'">'+esc(draft.title)+'</h1>'+
    (draft.subtitle?'<p class="page-subtitle '+alignClass(draft.subtitleAlign)+'">'+esc(draft.subtitle)+'</p>':"")+
    (p?.kind==="detail"?description+detailText+'<div class="detail-photo-list">'+images+'</div>':generic+gallery)+'</div>';
}
function showFooter(){
  $("#editor-title").textContent="Pied de page";$("#actions").hidden=false;$("#preview").hidden=false;
  $("#editing-panel").innerHTML='<section class="form-card legal-ready-card"><h3>Les deux textes sont prêts</h3>'+
    '<p class="field-tip">Cliquez sur un texte pour le lire. Les passages entre crochets [À COMPLÉTER] restent visibles tant que vous n’avez pas rempli les champs ci-dessous. Les champs sont enregistrés comme brouillon puis publiés avec PUBLIER.</p>'+
    '<details open class="legal-ready"><summary>Voir les mentions légales déjà rédigées</summary><pre id="legal-ready-preview" class="legal-ready-preview"></pre></details>'+
    '<details class="legal-ready"><summary>Voir la confidentialité déjà rédigée</summary><pre id="privacy-ready-preview" class="legal-ready-preview"></pre></details></section>'+
    '<section class="form-card"><h3>Réseaux sociaux</h3>'+
    renderField("Lien Instagram (https://…)","instagram",draft.instagram)+
    renderField("Lien LinkedIn (https://…)","linkedin",draft.linkedin)+
    renderField("Texte de copyright","copyright",draft.copyright)+
    '</section><section class="form-card"><h3>Mentions légales — champs à remplir</h3>'+
    '<p class="field-tip">Remplissez uniquement les champs que vous connaissez. Les textes complets sont visibles juste au-dessus ; les informations manquantes restent signalées par [À COMPLÉTER].</p>'+
    LEGAL_FIELDS.map(field=>{
      const key=field.key,value=draft.legalDetails?.[key]||"";
      return '<div class="admin-field"><label for="legal-'+key+'">'+esc(field.label)+'</label>'+
        '<input id="legal-'+key+'" data-legal-key="'+key+'" type="'+(field.type||"text")+'" value="'+esc(value)+'" placeholder="'+esc(field.hint||"")+'">'+
        (field.hint?'<span class="field-tip">'+esc(field.hint)+'</span>':"")+'</div>';
    }).join("")+
    renderField("Précisions complémentaires (facultatif)","legal",draft.legal,{multiline:true,rows:4,hint:"Le texte existant reste conservé et sera ajouté à la fin des mentions générées."})+
    '<h3>Confidentialité</h3><p class="field-tip">Le texte sur la protection des données du formulaire de contact est également généré automatiquement.</p></section>';
  bindContentFields();drawPreview();notice("Les mentions légales doivent être vérifiées et complétées avant publication.");
}
function showTrash(){
  $("#editor-title").textContent="Corbeille";$("#actions").hidden=true;$("#preview").hidden=true;
  const items=db.pages.filter(p=>p.is_trashed);
  $("#editing-panel").innerHTML=items.length?items.map(p=>
    '<div class="trash-item"><span><small class="trash-kind">'+(p.kind==="detail"?"Réalisation":p.kind==="gallery"?"Galerie":"Page")+'</small><strong>'+esc(p.draft.title)+'</strong></span>'+
    '<button type="button" class="outline-button" data-restore="'+esc(p.id)+'">Restaurer</button></div>').join(""):
    '<p class="empty-state">La corbeille est vide.</p>';
  document.querySelectorAll("[data-restore]").forEach(el=>el.addEventListener("click",async()=>{
    try{await api("restore",{id:el.dataset.restore});await stateLoad();select("trash");notice("Page restaurée.");}catch(e){error(e.message);}
  }));
  notice("Les pages supprimées ne sont pas visibles sur le site public.");
}
async function save(){
  if(selected==="footer")await api("footer/save",draft);
  else if(page(selected))await api("save",{id:selected,content:draft});
  else return;
  dirty=false;notice("Brouillon enregistré. Rien n'a changé sur le site public.");
}
async function publish(){
  await save();
  if(selected==="footer")await api("footer/publish",{});
  else await api("publish",{id:selected});
  await stateLoad();notice("Modifications publiées sur le site !");
}
async function createPage(parentId=null){
  const isProject=Boolean(parentId);
  if(dirty && isProject){
    try{await save();}catch(e){error(e.message);return;}
  }else if(dirty && !confirm("Les modifications en cours ne sont pas enregistrées. Continuer ?"))return;
  const title=isProject?"Nouvelle réalisation":prompt("Titre de la nouvelle page");
  if(!title||!title.trim())return;
  const trigger=isProject?$("#add-project"):$("#add-page");
  if(trigger?.disabled)return;
  if(trigger)trigger.disabled=true;
  try{
    const created=await api("create",{title,parentId});
    if(!created.id||!created.draft)throw Error("Réponse de création incomplète");
    db.pages.push({...created,published:null,draft:created.draft,is_trashed:0,is_core:0});
    dirty=false;
    drawSidebar();
    if(isProject){
      showPage();
      const card=$("#project-"+created.id);
      card?.scrollIntoView({behavior:"smooth",block:"center"});
      card?.querySelector("[data-project-title]")?.focus({preventScroll:true});
      notice("Réalisation créée ! Ajoutez sa photographie et son nom, puis ouvrez sa page pour la compléter et la publier.");
    }else{
      select(created.id);
      notice("Page créée en brouillon. Ajoutez son contenu, puis publiez-la.");
    }
  }catch(e){error("Impossible de créer "+(isProject?"la réalisation":"la page")+" : "+e.message);}
  finally{if(trigger?.isConnected)trigger.disabled=false;}
}
async function movePageToTrash(id){
  const target=page(id);
  if(!target||target.is_trashed)return false;
  // Ne jamais perdre silencieusement des modifications non enregistrées sur la page courante.
  if(dirty){
    error("Enregistrez d'abord les modifications de cette page avant de déplacer une réalisation dans la corbeille.");
    return false;
  }
  const label=target.kind==="detail"?"la réalisation « "+target.draft.title+" »":"la page « "+target.draft.title+" »";
  if(!confirm("Mettre "+label+" dans la corbeille ?\nVous pourrez la restaurer. Ses photographies sont conservées."))return false;
  await api("trash",{id});
  if(selected===id){
    const parent=target.parent_id?page(target.parent_id):null;
    selected=parent&&!parent.is_trashed?parent.id:"home";
  }
  await stateLoad();
  notice(target.kind==="detail"?"Réalisation placée dans la corbeille. Elle n'apparaît plus sur le site.":"Page déplacée dans la corbeille.");
  return true;
}
async function trashPage(){
  try{await movePageToTrash(selected);}
  catch(e){error(e.message);}
}
$("#login-form").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.target,button=f.querySelector("button");button.disabled=true;
  try{const input=f.elements.namedItem("password");await api("login",{password:input.value});input.value="";await stateLoad();}
  catch(err){$("#login-error").textContent=err.message;}
  finally{button.disabled=false;}
});
$("#logout").addEventListener("click",async()=>{
  try{await api("logout",{});}catch{}location.reload();
});
$("#add-page").addEventListener("click",()=>createPage());
$("#select-footer").addEventListener("click",()=>select("footer"));
$("#select-trash").addEventListener("click",()=>select("trash"));
$("#save").addEventListener("click",async()=>{try{await save();}catch(e){error(e.message);}});
$("#publish").addEventListener("click",async()=>{try{await publish();}catch(e){error(e.message);}});
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue="";}});
(async()=>{
  try{await stateLoad();}
  catch(e){$("#login-view").hidden=false;$("#editor-view").hidden=true;}
})();
