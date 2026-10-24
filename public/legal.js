// Portfolio artistique Nadège Renard : aucun statut d'entreprise ni SIREN actif
// n'est présumé. Anciennes valeurs éventuellement conservées dans la base
// ne sont ni reprises ni publiées par les documents générés.
// Sources (vérifiées octobre 2026) :
// LCEN art. 1-1 https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049568614
// Hébergement Cloudflare Inc. : https://www.cloudflare.com/policies/terms/
// Coordonnées Cloudflare Inc. : 10-K 2025 https://www.sec.gov/Archives/edgar/data/1477333/000147733326000016/cloud-20251231.htm
export const LEGAL_FIELDS=[
  {key:"email",label:"Adresse e-mail de contact à publier",type:"email",hint:"Utilisez de préférence une adresse dédiée au site, distincte de l'adresse privée."},
  {key:"phone",label:"Téléphone à publier",type:"tel",hint:"Ne saisissez pas de numéro personnel sans accord. Pour un site professionnel, un téléphone est normalement requis."},
  {key:"retention",label:"Durée de conservation des messages",hint:"À confirmer selon l'organisation réelle de la boîte de réception, par ex. « 12 mois »."}
];
export const LEGAL_KEYS=LEGAL_FIELDS.map(x=>x.key);
// Adresse de l'ancienne EI confirmée comme correspondant à celle du domaine
// par le gestionnaire du site, puis publication explicitement demandée.
// Ne pas récupérer automatiquement les autres données de contact du domaine.
export const EDITOR_ADDRESS="67 rue Henri Barbusse, 44400 Rezé, France";
export const CLOUDFARE_HOST={
  name:"Cloudflare, Inc.",
  address:"101 Townsend Street, San Francisco, CA 94107, États-Unis",
  phone:"+1 888 993 5273"
};
const raw=(d,key)=>String(d?.[key]??"").trim();
const hole=(d,key,label)=>raw(d,key)||"["+label+"]";
const name=()=>"Nadège Renard";
const contactsAllowed=f=>f?.allowPublicContact===true;
export const hasStructuredLegal=f=>contactsAllowed(f)||LEGAL_KEYS.some(k=>raw(f?.legalDetails,k));

// L'adresse postale confirmée pour le portfolio est désormais publiée à la
// demande du gestionnaire. Les anciennes valeurs d'adresse de la base restent
// ignorées. E-mail et téléphone restent protégés par consentement explicite.
export function legalDocument(f={}){
  const d=f.legalDetails||{},show=contactsAllowed(f);
  const contact=(key,label)=>show?hole(d,key,label):"["+label+" — DIFFUSION NON VALIDÉE]";
  return [
    "Le site",
    "Ce portfolio présente les créations et collaborations artistiques de Nadège Renard : scénographies, décors, patines et transmission. Aucune vente ni aucun paiement ne sont proposés directement sur ce site.",
    "",
    "Éditrice et directrice de la publication",
    name(),
    "Adresse : "+EDITOR_ADDRESS,
    "E-mail : "+contact("email","E-MAIL À CONFIRMER"),
    "Téléphone : "+contact("phone","TÉLÉPHONE À CONFIRMER"),
    "",
    "Hébergeur",
    CLOUDFARE_HOST.name,
    CLOUDFARE_HOST.address,
    "Téléphone : "+CLOUDFARE_HOST.phone,
    "",
    "Propriété intellectuelle",
    "Les textes, créations et photographies de ce portfolio sont protégés par le droit d'auteur, sous réserve des droits des auteurs, artistes, compagnies et photographes concernés. Toute reproduction ou réutilisation nécessite l'autorisation des titulaires des droits. Un crédit photo n'est pas une autorisation de reproduction.",
    "",
    "Données personnelles",
    "Les informations transmises via le formulaire de contact sont utilisées pour traiter les demandes et y répondre. Consultez la rubrique « Confidentialité » accessible en pied de page."
  ].join("\n");
}
export function privacyDocument(f={}){
  const d=f.legalDetails||{},show=contactsAllowed(f),email=show?raw(d,"email"):"";
  const retention=raw(d,"retention");
  const contact=email?"à l'adresse "+email:"depuis la page « Contact » de ce site";
  return [
    "Responsable",
    "Nadège Renard. Vous pouvez la contacter "+contact+".",
    "",
    "Données collectées",
    "Le formulaire de contact recueille votre nom, votre adresse e-mail, l'objet de votre demande et votre message. Ces données servent à lire votre demande et à y répondre.",
    "",
    "La protection contre les envois automatisés repose sur Cloudflare Turnstile et sur une limitation des envois utilisant une empreinte technique dérivée de l'adresse IP. L'adresse IP n'est pas enregistrée en clair dans le dispositif de limitation des envois.",
    "",
    "Base légale",
    "L'intérêt légitime de répondre aux messages reçus et de protéger le formulaire contre les abus.",
    "",
    "Destinataires",
    "Nadège Renard et, dans la mesure nécessaire au fonctionnement du site, ses prestataires techniques d'hébergement, de protection du formulaire et d'envoi des messages.",
    "",
    "Durée de conservation",
    retention?retention+" après réception du message, sauf obligation légale de conservation.":"[DURÉE DE CONSERVATION À DÉFINIR SELON LA PRATIQUE RÉELLE]",
    "",
    "Vos droits",
    "Vous pouvez demander l'accès, la rectification, l'effacement ou la limitation du traitement de vos données et, dans les conditions prévues par la loi, vous opposer à leur utilisation. Pour exercer vos droits, contactez Nadège Renard "+contact+". Vous pouvez également adresser une réclamation à la CNIL (www.cnil.fr)."
  ].join("\n");
}
export function copyrightText(value){
  const n=String(value??"").trim().replace(/^©\s*/u,"").trim();
  return n?"© "+n:"";
}
