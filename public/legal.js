// Modèles partagés par l'administration et les pages publiques.
// Les champs non renseignés restent visibles comme éléments à compléter : aucune donnée inventée.
export const LEGAL_FIELDS = [
  {key:"editorName",label:"Nom ou dénomination de l'éditrice",hint:"Ex. Nadège Renard"},
  {key:"status",label:"Statut professionnel",hint:"Ex. entreprise individuelle, microentreprise ou société"},
  {key:"businessName",label:"Nom commercial (facultatif)"},
  {key:"director",label:"Directrice de publication",hint:"Nom et prénom de la personne responsable du site"},
  {key:"address",label:"Adresse professionnelle",hint:"Adresse exigée dans les mentions légales d'un site professionnel"},
  {key:"siren",label:"Numéro SIREN",hint:"9 chiffres"},
  {key:"registration",label:"Immatriculation RCS / RNE (si applicable)"},
  {key:"vat",label:"Numéro de TVA intracommunautaire (si applicable)"},
  {key:"email",label:"Adresse e-mail professionnelle",type:"email"},
  {key:"phone",label:"Téléphone professionnel",type:"tel"},
  {key:"hostName",label:"Nom de l'hébergeur",hint:"La société qui héberge le site"},
  {key:"hostAddress",label:"Adresse de l'hébergeur"},
  {key:"hostPhone",label:"Téléphone de l'hébergeur"},
  {key:"retention",label:"Durée de conservation des messages reçus",hint:"À déterminer selon la pratique réelle, ex. 12 mois"}
];
export const LEGAL_KEYS = LEGAL_FIELDS.map(x=>x.key);
const value=(d,key,label)=>String(d?.[key]??"").trim()||"[À compléter : "+label+"]";
const opt=(d,key,prefix)=>String(d?.[key]??"").trim()?prefix+String(d[key]).trim():null;
export const hasStructuredLegal=f=>LEGAL_KEYS.some(key=>String(f?.legalDetails?.[key]??"").trim());
export function legalDocument(f={},force=false){
  if(!force&&!hasStructuredLegal(f))return String(f.legal||"").trim()||"Mentions légales à compléter.";
  const d=f.legalDetails||{};
  const lines=[
    "ÉDITION DU SITE",
    "Éditrice : "+value(d,"editorName","nom de l'éditrice"),
    "Statut professionnel : "+value(d,"status","statut"),
    opt(d,"businessName","Nom commercial : "),
    "Directrice de publication : "+value(d,"director","directrice de publication"),
    "Adresse professionnelle : "+value(d,"address","adresse"),
    "SIREN : "+value(d,"siren","SIREN"),
    opt(d,"registration","Immatriculation : "),
    opt(d,"vat","N° de TVA intracommunautaire : "),
    "E-mail : "+value(d,"email","adresse e-mail"),
    "Téléphone : "+value(d,"phone","téléphone"),
    "",
    "HÉBERGEMENT",
    "Hébergeur : "+value(d,"hostName","nom de l'hébergeur"),
    "Adresse : "+value(d,"hostAddress","adresse de l'hébergeur"),
    "Téléphone : "+value(d,"hostPhone","téléphone de l'hébergeur"),
    "",
    "PROPRIÉTÉ INTELLECTUELLE",
    "Les créations, textes et photographies présentés sur ce site sont protégés par le droit d'auteur. Leur reproduction ou leur réutilisation nécessite l'autorisation des titulaires des droits. Les photographies créditées mentionnent le nom de leur auteur."
  ].filter(x=>x!==null);
  if(String(f.legal||"").trim())lines.push("","INFORMATIONS COMPLÉMENTAIRES",String(f.legal).trim());
  return lines.join("\n");
}
export function privacyDocument(f={}){
  const d=f.legalDetails||{};
  return [
    "RESPONSABLE DU TRAITEMENT",
    value(d,"editorName","nom de la responsable")+" — "+value(d,"email","e-mail de contact"),
    "",
    "FORMULAIRE DE CONTACT",
    "Lorsque vous écrivez depuis le formulaire, les informations renseignées (nom, adresse e-mail, sujet et message) sont utilisées uniquement pour recevoir votre demande et y répondre. La base légale est l'intérêt légitime de traiter les demandes adressées à la professionnelle.",
    "Le message est transmis par courrier électronique au destinataire du site ; il n'est pas publié.",
    "",
    "PROTECTION CONTRE LES ABUS",
    "Le formulaire utilise le service anti-robot Cloudflare Turnstile. Une empreinte technique dérivée de l'adresse IP permet également de limiter les envois abusifs. Le service Turnstile peut traiter certaines données techniques conformément à sa propre politique de confidentialité.",
    "",
    "DURÉE DE CONSERVATION",
    "Les messages sont conservés pendant : "+value(d,"retention","durée de conservation réelle")+".",
    "",
    "VOS DROITS",
    "Vous pouvez demander l'accès, la rectification ou l'effacement de vos données, ou vous opposer à leur traitement, en écrivant à "+value(d,"email","adresse e-mail")+". Vous pouvez également adresser une réclamation à la CNIL.",
    "",
    "PHOTOGRAPHIES",
    "Les crédits d'auteur sont affichés au cas par cas, lorsque leur nom est renseigné. La publication d'une photographie nécessite l'autorisation de son titulaire de droits."
  ].join("\n");
}
export function copyrightText(name){
  const n=String(name??"").trim().replace(/^(?:©|\\u00a9)\s*/u,"").trim();
  return n?"© "+n:"";
}
