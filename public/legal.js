// Textes modèles affichés immédiatement, même avant la saisie des informations.
// Les valeurs inconnues sont signalées explicitement : aucune donnée légale inventée.
export const LEGAL_FIELDS = [
  {key:"editorName",label:"Nom de l’éditrice et directrice de la publication",hint:"Nom légal, ex. Nadège Renard"},
  {key:"status",label:"Statut professionnel",hint:"Ex. artiste-auteure, entrepreneure individuelle, société…"},
  {key:"address",label:"Adresse professionnelle",hint:"Adresse à publier dans les mentions légales"},
  {key:"siren",label:"SIREN",hint:"Numéro SIREN à 9 chiffres, si applicable"},
  {key:"email",label:"E-mail professionnel",type:"email"},
  {key:"phone",label:"Téléphone professionnel",type:"tel"},
  {key:"hostName",label:"Nom de l’hébergeur",hint:"Nom juridique de la société qui héberge le site"},
  {key:"hostAddress",label:"Adresse de l’hébergeur"},
  {key:"hostPhone",label:"Téléphone de l’hébergeur",type:"tel"},
  {key:"retention",label:"Durée de conservation des messages",hint:"Utilisée dans le texte « Confidentialité »"}
];
export const LEGAL_KEYS = LEGAL_FIELDS.map(x=>x.key);
const value=(d,key,label)=>String(d?.[key]??"").trim()||"[À COMPLÉTER : "+label+"]";
const opt=(d,key,prefix)=>String(d?.[key]??"").trim()?prefix+String(d[key]).trim():null;
export const hasStructuredLegal=f=>LEGAL_KEYS.some(key=>String(f?.legalDetails?.[key]??"").trim());

// Texte validé pour l'affichage public : les trous sont conservés tant qu'ils ne sont pas remplis.
export function legalDocument(f={}){
  const d=f.legalDetails||{};
  const hole=(key,label)=>String(d[key]??"").trim()||"["+label+"]";
  const lines=[
    "Le site",
    "Ce site présente les travaux de Nadège Renard : scénographies, décors, patines, ateliers. Aucune vente n'est réalisée directement sur le site.",
    "",
    "Éditrice et directrice de la publication",
    hole("editorName","NOM"),
    hole("status","STATUT PROFESSIONNEL"),
    hole("address","ADRESSE PROFESSIONNELLE"),
    "SIREN : "+hole("siren","SIREN"),
    "E-mail : "+hole("email","E-MAIL"),
    "Téléphone : "+hole("phone","TÉLÉPHONE"),
    "",
    "Hébergeur",
    hole("hostName","NOM DE L'HÉBERGEUR"),
    hole("hostAddress","ADRESSE DE L'HÉBERGEUR"),
    "Téléphone : "+hole("hostPhone","TÉLÉPHONE DE L'HÉBERGEUR"),
    "",
    "Propriété intellectuelle",
    "Les textes, images, photographies, décors et scénographies présentés sur ce site sont protégés par le droit d'auteur. Toute reproduction ou réutilisation nécessite l'accord préalable de leurs titulaires. Les crédits photographiques identifient l'auteur de l'image et ne valent pas autorisation de réutilisation.",
    "",
    "Données personnelles",
    "Les informations envoyées par le formulaire de contact sont traitées conformément à la rubrique « Confidentialité », accessible en pied de page."
  ];
  // Conserver d'éventuelles précisions antérieures sans les effacer silencieusement.
  const extra=String(f.legal||"").trim();
  if(extra)lines.push("","Précisions complémentaires",extra);
  return lines.join("\n");
}

// Texte court validé, avec trous visibles tant que les champs d'administration sont vides.
export function privacyDocument(f={}){
  const d=f.legalDetails||{};
  const hole=(key,label)=>String(d[key]??"").trim()||"["+label+"]";
  return [
    "Responsable",
    hole("editorName","NOM OU DÉNOMINATION")+", joignable à "+hole("email","E-MAIL")+".",
    "",
    "Données collectées",
    "Via le formulaire de contact : votre nom, votre adresse e-mail, le sujet et votre message. Ces informations servent uniquement à recevoir votre demande et à vous répondre.",
    "",
    "Pour protéger le formulaire des envois automatisés, le site utilise Cloudflare Turnstile et un système de limitation des envois basé sur une empreinte technique dérivée de votre adresse IP (l'adresse elle-même n'est pas conservée en clair).",
    "",
    "Base légale",
    "L'intérêt légitime : répondre aux personnes qui nous écrivent et sécuriser le formulaire.",
    "",
    "Destinataires",
    "Vos messages ne sont lus que par la personne qui répond aux demandes. Les prestataires techniques du site (hébergement, envoi des messages, Cloudflare) peuvent les traiter dans le cadre de leurs services.",
    "",
    "Durée de conservation",
    hole("retention","DURÉE")+" à compter de la réception du message, puis suppression, sauf obligation légale de conservation.",
    "",
    "Vos droits",
    "Vous pouvez demander l'accès à vos données, leur rectification ou leur effacement, ou vous opposer à leur traitement, en écrivant à "+hole("email","E-MAIL")+". Vous pouvez aussi saisir la CNIL (www.cnil.fr)."
  ].join("\n");
}

export function copyrightText(name){
  const n=String(name??"").trim().replace(/^©\s*/u,"").trim();
  return n?"© "+n:"";
}
