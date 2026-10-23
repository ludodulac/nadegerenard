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

export function privacyDocument(f={}){
  const d=f.legalDetails||{};
  return [
    "POLITIQUE DE CONFIDENTIALITÉ",
    "Cette notice explique comment les informations personnelles sont utilisées sur le site de présentation artistique Nadège Renard.",
    "",
    "1. RESPONSABLE DU TRAITEMENT",
    "La personne responsable est "+value(d,"editorName","nom ou dénomination de la responsable")+".",
    "Pour toute question relative à vos données : "+value(d,"email","adresse e-mail de contact")+".",
    "",
    "2. INFORMATIONS COLLECTÉES",
    "Lorsque vous utilisez le formulaire de contact, vous pouvez transmettre votre nom, votre adresse e-mail, le sujet de votre demande et votre message. Ces informations sont nécessaires pour pouvoir recevoir votre demande et y répondre.",
    "Des données techniques peuvent également être utilisées pour protéger le formulaire contre les envois automatisés ou abusifs.",
    "",
    "3. POURQUOI CES DONNÉES SONT UTILISÉES",
    "Les informations envoyées sont utilisées pour traiter votre message et vous répondre. La base légale de ce traitement est l'intérêt légitime de répondre aux personnes qui contactent l'éditrice du site.",
    "La protection contre les abus repose également sur l'intérêt légitime de sécuriser le formulaire.",
    "",
    "4. DESTINATAIRES ET PRESTATAIRES",
    "Les messages sont adressés à la personne chargée de répondre aux demandes. Les prestataires techniques nécessaires au fonctionnement du site et à la transmission des messages peuvent traiter les données dans le cadre de leurs prestations.",
    "Le formulaire utilise le service Cloudflare Turnstile pour limiter les envois automatisés. Le site utilise également un mécanisme de limitation des envois qui repose sur une empreinte technique dérivée de l'adresse IP.",
    "",
    "5. DURÉE DE CONSERVATION",
    "Les messages reçus via le formulaire sont conservés pendant "+value(d,"retention","durée de conservation réellement appliquée")+". Leur conservation est ensuite limitée à ce qui reste nécessaire ou légalement exigé.",
    "",
    "6. VOS DROITS",
    "Conformément à la réglementation sur la protection des données, vous pouvez demander l'accès à vos données, leur rectification ou leur effacement, ou vous opposer à leur traitement dans les conditions prévues par la loi.",
    "Pour exercer ces droits, écrivez à "+value(d,"email","adresse e-mail de contact")+". Vous pouvez également déposer une réclamation auprès de la CNIL (www.cnil.fr).",
    "",
    "7. PHOTOGRAPHIES",
    "Les photographies mises en ligne servent à présenter les réalisations artistiques. Les noms des photographes sont précisés au cas par cas, lorsque les crédits sont renseignés."
  ].join("\n");
}

export function copyrightText(name){
  const n=String(name??"").trim().replace(/^©\s*/u,"").trim();
  return n?"© "+n:"";
}
