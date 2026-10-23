// Textes modèles affichés immédiatement, même avant la saisie des informations.
// Les valeurs inconnues sont signalées explicitement : aucune donnée légale inventée.
export const LEGAL_FIELDS = [
  {key:"editorName",label:"Nom ou dénomination de la personne qui édite le site",hint:"Nom complet légal, ex. Nadège Renard"},
  {key:"status",label:"Statut professionnel",hint:"Ex. entrepreneur individuel (EI), microentrepreneur, association, société…"},
  {key:"businessName",label:"Nom commercial (facultatif)"},
  {key:"director",label:"Nom de la directrice de publication",hint:"Nom de la personne responsable du contenu"},
  {key:"address",label:"Adresse professionnelle",hint:"Adresse à faire figurer dans les mentions légales"},
  {key:"siren",label:"Numéro SIREN",hint:"9 chiffres, si applicable"},
  {key:"registration",label:"Immatriculation RCS / RNE (si applicable)",hint:"Ex. RNE, RCS + ville"},
  {key:"vat",label:"Numéro de TVA intracommunautaire (si applicable)"},
  {key:"email",label:"Adresse e-mail professionnelle",type:"email"},
  {key:"phone",label:"Téléphone professionnel",type:"tel"},
  {key:"hostName",label:"Nom de l'hébergeur",hint:"La société qui héberge le site, ex. Cloudflare (nom juridique à vérifier)"},
  {key:"hostAddress",label:"Adresse de l'hébergeur",hint:"Adresse officielle de l'hébergeur"},
  {key:"hostPhone",label:"Téléphone de l'hébergeur",hint:"Téléphone officiel de l'hébergeur"},
  {key:"retention",label:"Durée de conservation des messages",hint:"Durée réellement appliquée, ex. 12 mois"}
];
export const LEGAL_KEYS = LEGAL_FIELDS.map(x=>x.key);
const value=(d,key,label)=>String(d?.[key]??"").trim()||"[À COMPLÉTER : "+label+"]";
const opt=(d,key,prefix)=>String(d?.[key]??"").trim()?prefix+String(d[key]).trim():null;
export const hasStructuredLegal=f=>LEGAL_KEYS.some(key=>String(f?.legalDetails?.[key]??"").trim());

export function legalDocument(f={}){
  const d=f.legalDetails||{};
  const lines=[
    "PRÉSENTATION DU SITE",
    "Le site Nadège Renard a pour objet de présenter des travaux artistiques, des scénographies, des décors, des patines, des ateliers et des réalisations. Il permet également aux visiteurs de prendre contact avec la professionnelle au moyen d'un formulaire. Aucune vente n'est réalisée directement sur ce site.",
    "",
    "ÉDITION DU SITE",
    "Ce site est édité par "+value(d,"editorName","nom ou dénomination de l'éditrice")+".",
    "Statut professionnel : "+value(d,"status","statut professionnel"),
    opt(d,"businessName","Nom commercial : "),
    "Adresse professionnelle : "+value(d,"address","adresse professionnelle"),
    "Numéro SIREN : "+value(d,"siren","numéro SIREN (si applicable)"),
    opt(d,"registration","Immatriculation : "),
    opt(d,"vat","Numéro de TVA intracommunautaire : "),
    "Adresse électronique : "+value(d,"email","adresse e-mail"),
    "Téléphone : "+value(d,"phone","téléphone professionnel"),
    "Directrice de la publication : "+value(d,"director","nom de la directrice de publication"),
    "",
    "HÉBERGEMENT DU SITE",
    "Le site est hébergé par "+value(d,"hostName","nom de l'hébergeur")+".",
    "Adresse de l'hébergeur : "+value(d,"hostAddress","adresse de l'hébergeur"),
    "Téléphone de l'hébergeur : "+value(d,"hostPhone","téléphone de l'hébergeur"),
    "",
    "PROPRIÉTÉ INTELLECTUELLE ET CRÉDITS PHOTOGRAPHIQUES",
    "Les scénographies, décors, textes, illustrations et photographies présentés sur ce site sont susceptibles d'être protégés par le droit d'auteur. Toute reproduction, représentation, modification ou réutilisation requiert l'accord préalable des titulaires des droits, sauf exception prévue par la loi.",
    "Lorsqu'un crédit photographique est indiqué sous ou sur une image (par exemple : © Nom de l'auteur), il identifie le photographe concerné. La présence d'un crédit ne vaut pas autorisation de réutiliser la photographie.",
    "",
    "DONNÉES PERSONNELLES",
    "Pour savoir comment sont utilisées les informations envoyées avec le formulaire de contact, consultez la rubrique « Confidentialité » accessible dans le pied de page."
  ].filter(x=>x!==null);
  const extra=String(f.legal||"").trim();
  if(extra)lines.push("","PRÉCISIONS COMPLÉMENTAIRES",extra);
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
