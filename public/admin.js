const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const imageOK=s=>/^\/media\/[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(String(s||""));
const externalOK=s=>{try{return new URL(s).protocol==="https:";}catch{return false;}};
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
  const items=allVisible().filter(p=>p.kind!=="detail").sort((a,b)=>a.nav_order-b.nav_order);
  $("#page-list").innerHTML=items.map(p=>{
    const children=allVisible().filter(x=>x.parent_id===p.id).sort((a,b)=>a.nav_order-b.nav_order);
    return '<button class="admin-page" data-select="'+esc(p.id)+'">'+esc(p.draft.title)+'</button>'+
      children.map(x=>'<button class="admin-page child" data-select="'+esc(x.id)+'">↳ '+esc(x.draft.title)+'</button>').join("");
  }).join("");
  document.querySelectorAll("[data-select]").forEach(btn=>btn.addEventListener("click",()=>select(btn.dataset.select)));
}
function select(id){
  if(dirty && selected!==id && !confirm("Des modifications n’ont pas été enregistrées. Voulez-vous vraiment changer de page ?"))return;
  selected=id;dirty=false;
  const p=page(id);
  if(dirty && selected!==id && !confirm("Un brouillon contient des modifications non enregistrées. Changer de page sans les enregistrer ?")) return;
  if(id==="footer"){draft=structuredClone(db.footer?.draft||{instagram:"",linkedin:"",legal:"",copyright:""});showFooter();}
  else if(id==="trash"){draft=null;showTrash();}
  else if(p){draft=structuredClone(p.draft);showPage();}
  else{selected="home";draft=structuredClone(page("home")?.draft||{});showPage();}
  document.querySelectorAll("[data-select]").forEach(btn=>btn.classList.toggle("active",btn.dataset.select===selected));
}
function renderField(label,key,value,opts={}){
  const id="field-"+key;
  return '<div class="admin-field"><label for="'+id+'">'+esc(label)+'</label>'+
    (opts.multiline?'<textarea id="'+id+'" data-key="'+key+'" rows="'+(opts.rows||5)+'">'+esc(value)+'</textarea>':
      '<input id="'+id+'" data-key="'+key+'" value="'+esc(value)+'" '+(opts.type?'type="'+opts.type+'"':"")+'>')+
    (opts.hint?'<span class="field-tip">'+esc(opts.hint)+'</span>':"")+'</div>';
}
function choosePhoto(path,current,label="Photographie"){
  const id="media-"+path.replaceAll(":","-");
  return '<div class="admin-field"><label for="'+id+'">'+esc(label)+' (JPG, PNG, WEBP, AVIF, max. 8 Mo)</label>'+
    '<div class="upload-box"><input type="file" id="'+id+'" accept="image/jpeg,image/png,image/webp,image/avif" data-upload="'+esc(path)+'">'+
    (current&&imageOK(current)?'<button type="button" class="mini" data-clear="'+esc(path)+'">Retirer la photo</button>':"")+'</div>'+
    (imageOK(current)?'<img class="upload-preview" src="'+esc(current)+'" alt="Image sélectionnée">':'<span class="field-tip">Aucune photographie enregistrée</span>')+'</div>';
}
function renderBlock(b,i){
  const textField=(label,key="text",rows=4)=>{
    const id="block-"+i+"-"+key;
    return '<div class="admin-field"><label for="'+id+'">'+esc(label)+'</label><textarea id="'+id+'" data-block="'+i+'" data-bkey="'+key+'" rows="'+rows+'">'+esc(b[key]||"")+'</textarea></div>';
  };
  let inner="";
  if(b.type==="text"){
    inner='<div class="formatbar"><button type="button" class="mini" data-format="bold" data-i="'+i+'"><strong>G</strong> Gras</button>'+
      '<button type="button" class="mini" data-format="underline" data-i="'+i+'"><u>S</u> Souligner</button>'+
      '<span class="field-tip">Sélectionnez des mots, puis cliquez sur une mise en forme.</span></div>'+
      textField("Paragraphe")+"<div class='admin-field'><label>Espacement entre les lignes</label><select data-block='"+i+"' data-bkey='lineHeight'>"+
      ["normal","large","extra"].map(v=>'<option value="'+v+'" '+((b.lineHeight||"normal")===v?"selected":"")+">"+({normal:"Normal",large:"Aéré",extra:"Très aéré"}[v])+"</option>").join("")+"</select></div>";
  }else if(b.type==="image"){inner=choosePhoto("block:"+i,b.src)+textField("Description de l’image (accessibilité)","alt",2);}
  else if(b.type==="press"){
    inner=textField("Titre au-dessus de la photographie","title",2)+choosePhoto("block:"+i,b.src)+textField("Adresse https:// de l’article","url",2);
  }else inner=textField(blockNames[b.type]);
  return '<div class="block-editor" data-block-wrapper="'+i+'"><div class="block-bar"><h3>'+blockNames[b.type]+' '+(i+1)+'</h3>'+
    '<div class="move-actions"><button class="mini" data-up="'+i+'" aria-label="Monter">↑</button>'+
    '<button class="mini" data-down="'+i+'" aria-label="Descendre">↓</button>'+
    '<button class="mini" data-remove="'+i+'">Supprimer</button></div></div>'+inner+'</div>';
}
function showPage(){
  const p=page(selected);if(!p)return;
  $("#editor-title").textContent=draft.title;$("#actions").hidden=false;$("#preview").hidden=false;
  const kind=p.kind;
  let html='<section class="form-card"><h3>Contenu principal</h3>'+
    renderField("Grand titre de la page","title",draft.title)+
    renderField("Sous-titre (facultatif)","subtitle",draft.subtitle||"",{multiline:true,rows:2})+
    (kind==="detail"?choosePhoto("cover",draft.cover,"Image de couverture affichée dans la galerie"):"")+
    '</section><h3>Éléments de la page</h3>';
  if(kind==="gallery"){
    html+='<section class="form-card"><h3>Réalisations de cette galerie</h3><p>Chaque réalisation crée une photographie cliquable et sa page dédiée.</p>'+
      '<button type="button" class="outline-button" id="add-project">＋ Ajouter une réalisation</button>'+
      '<p class="field-tip">Les pages de réalisations apparaissent également dans la liste de gauche.</p></section>';
  }
  html+=draft.blocks.map(renderBlock).join("")+
    '<div class="block-buttons">'+Object.entries(blockNames).filter(([k])=>kind==="press"||k!=="press").map(([k,v])=>'<button type="button" data-add="'+k+'">＋ '+v+'</button>').join("")+'</div>';
  if(!p.is_core)html+='<hr class="section-line"><button type="button" id="move-trash" class="danger-button">Déplacer cette page dans la corbeille</button>';
  $("#editing-panel").innerHTML=html;
  bindContentFields();bindButtons();drawPreview();if(!dirty)notice(p.published?"Page publiée. Les modifications restent privées avant le prochain clic sur PUBLIER.":"Brouillon non publié.");
}
function markDirty(){dirty=true;notice("Modifications non publiées. Enregistrez votre brouillon ou cliquez sur PUBLIER.");drawPreview();}
function bindContentFields(){
  $("#editing-panel").querySelectorAll("[data-key]").forEach(el=>el.addEventListener("input",()=>{
    draft[el.dataset.key]=el.value;if(el.dataset.key==="title")$("#editor-title").textContent=el.value;markDirty();
  }));
  $("#editing-panel").querySelectorAll("[data-block]").forEach(el=>el.addEventListener("input",()=>{
    draft.blocks[Number(el.dataset.block)][el.dataset.bkey]=el.value;markDirty();
  }));
  $("#editing-panel").querySelectorAll("[data-upload]").forEach(el=>el.addEventListener("change",async()=>{
    const file=el.files?.[0];if(!file)return;
    if(file.size>8*1024*1024){error("Photographie trop volumineuse (8 Mo maximum)");return;}
    const fd=new FormData();fd.append("file",file);
    notice("Envoi de la photographie…");
    try{
      const response=await fetch("/api/admin/upload",{method:"POST",body:fd});
      const result=await response.json();if(!response.ok)throw Error(result.error||"Erreur d'envoi");
      setPhoto(el.dataset.upload,result.url);markDirty();showPage();
    }catch(e){error(e.message);}
  }));
}
function setPhoto(path,url){
  if(path==="cover"){draft.cover=url;return;}
  const i=Number(path.split(":")[1]);draft.blocks[i].src=url;
}
function bindButtons(){
  $("#editing-panel").querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>{
    const type=btn.dataset.add;draft.blocks.push({type,text:"",title:"",src:"",url:"",alt:"",lineHeight:"normal"});markDirty();showPage();
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
  case "heading":return '<h2 class="block-heading">'+esc(b.text)+'</h2>';
  case "subtitle":return '<h2 class="block-subtitle">'+esc(b.text)+'</h2>';
  case "label":return '<h2 class="block-label">'+esc(b.text)+'</h2>';
  case "text":return '<p class="block-text">'+esc(b.text).replace(/\*\*(.+?)\*\*/gs,"<strong>$1</strong>").replace(/__(.+?)__/gs,"<u>$1</u>").replace(/\n/g,"<br>")+'</p>';
  case "image":return imageOK(b.src)?'<img src="'+esc(b.src)+'" alt="'+esc(b.alt)+'">':'<div class="image-empty">Photographie à venir</div>';
  case "press":return '<h3>'+esc(b.title)+'</h3>'+(imageOK(b.src)?'<img src="'+esc(b.src)+'" alt="">':'<div class="image-empty">Photo article</div>')+'<p>'+esc(b.url)+'</p>';
  default:return "";
  }
}
function drawPreview(){
  if(selected==="trash")return;
  const target=$("#preview-content");if(!target)return;
  if(selected==="footer"){target.innerHTML='<div style="background:#111;color:white;padding:25px">'+
      '<p>CONTACT</p><p>'+esc(draft.instagram)+'</p><p>'+esc(draft.linkedin)+'</p>'+
      '<p>'+esc(draft.copyright)+'</p><h3>MENTIONS LÉGALES</h3><p style="white-space:pre-wrap">'+esc(draft.legal)+'</p></div>';return;}
  if(!draft)return;
  const p=page(selected);
  let gallery="";
  if(p?.kind==="gallery")gallery=db.pages.filter(x=>x.parent_id===p.id&&!x.is_trashed).map(x=>
    '<div style="border:1px solid #ddd;margin:15px 0;padding:12px">'+
    (imageOK(x.draft.cover)?'<img src="'+esc(x.draft.cover)+'" alt="">':'<div class="image-empty">Photographie de la réalisation</div>')+
    '<p>'+esc(x.draft.title)+'</p></div>').join("");
  target.innerHTML='<h1 class="page-title">'+esc(draft.title)+'</h1>'+(draft.subtitle?'<p class="page-subtitle">'+esc(draft.subtitle)+'</p>':"")+
    (p?.kind==="detail"&&imageOK(draft.cover)?'<img src="'+esc(draft.cover)+'" alt="">':"")+
    draft.blocks.map(b=>'<section class="content-block">'+previewBlock(b)+'</section>').join("")+gallery;
}
function showFooter(){
  $("#editor-title").textContent="Pied de page";$("#actions").hidden=false;$("#preview").hidden=false;
  $("#editing-panel").innerHTML='<section class="form-card"><h3>Réseaux sociaux</h3>'+
    renderField("Lien Instagram (https://…)","instagram",draft.instagram)+
    renderField("Lien LinkedIn (https://…)","linkedin",draft.linkedin)+
    renderField("Texte de copyright","copyright",draft.copyright)+
    renderField("Mentions légales, droits des photographies et informations du site","legal",draft.legal,{multiline:true,rows:14})+'</section>';
  bindContentFields();drawPreview();notice("Les mentions légales doivent être vérifiées et complétées avant publication.");
}
function showTrash(){
  $("#editor-title").textContent="Corbeille";$("#actions").hidden=true;$("#preview").hidden=true;
  const items=db.pages.filter(p=>p.is_trashed);
  $("#editing-panel").innerHTML=items.length?items.map(p=>
    '<div class="trash-item"><span>'+esc(p.draft.title)+'</span><button class="outline-button" data-restore="'+esc(p.id)+'">Restaurer</button></div>').join(""):
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
  const title=prompt(parentId?"Nom de la réalisation":"Titre de la nouvelle page");
  if(!title||!title.trim())return;
  if(dirty && !confirm("Les modifications en cours ne sont pas enregistrées. Continuer ?"))return;
  try{
    const result=await api("create",{title,parentId});
    selected=result.id;await stateLoad();notice("Page créée en brouillon. Ajoutez son contenu, puis publiez-la.");
  }catch(e){error(e.message);}
}
async function trashPage(){
  if(!confirm("Déplacer cette page dans la corbeille ? Vous pourrez la restaurer."))return;
  try{await api("trash",{id:selected});selected="home";await stateLoad();notice("Page déplacée dans la corbeille.");}
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
