# Plan de construction — Nadège Renard

## Décisions validées le 23 octobre 2026

**Q1 : oui.** La rubrique « MANIPULATION SPECTACLE » fonctionne comme les trois autres galeries : grandes images, titres blancs incrustés, une fiche détaillée par réalisation, avec texte et autant de photographies que nécessaire.

**Q2 : oui.** Les pages ACCUEIL et CONTACT ne peuvent pas être supprimées ; les autres pages peuvent être ajoutées, mises à la corbeille, puis restaurées.

**Q3 : oui.** Les modifications passent par un brouillon et une prévisualisation privée. Une action explicite **PUBLIER** est nécessaire pour mettre à jour la page visible des visiteurs.

## Navigation, dans cet ordre

1. ACCUEIL
2. BIO
3. SCÉNOGRAPHIE SPECTACLE
4. TRANSMISSION WORKSHOP
5. PATINES ET COULEURS
6. MANIPULATION SPECTACLE
7. PRESSE
8. CONTACT

## Design

Blanc sur l'ensemble du site ; pied de page noir et texte blanc. Grands titres noirs en capitales, sous-titres et paragraphes gris foncé. En-tête : « Nadège Renard » petit à gauche, hamburger à droite ; exception : Accueil n'affiche pas le petit nom à gauche, mais un grand « NADÈGE RENARD » au centre du contenu avec le sous-titre « scénographe/peintre ». Mise en page fluide sur téléphone et ordinateur.

## Contenu

- Accueil : grand titre, sous-titre, grande photographie, petit titre « MA VISION » et texte.
- Bio : grand titre BIO, sous-titre facultatif et blocs éditables.
- Galeries : titre, sous-titre facultatif, photographies avec légende blanche dans l'image ; chaque photo renvoie à une fiche détaillée portant son nom.
- Fiches de réalisation : grand titre, sous-titre facultatif, textes et un nombre libre de photographies.
- Presse : titre de l'article au-dessus et à gauche de la photo, photo menant à l'article d'origine dans **un nouvel onglet**.
- Contact : nom, e-mail, sujet, message, bouton Envoyer et protection anti-robots.
- Pied de page : Contact, liens Instagram/LinkedIn, mentions légales, lien discret Administration.

## Administration

Onglets de pages. Ajout de pages ou de réalisations, ajout/suppression et déplacement de blocs, images importées, titres, sous-titres, texte avec gras/souligné et interligne. Brouillon persistant, aperçu privé, publication volontaire, corbeille restaurable. Le texte des mentions légales et les liens de réseaux sociaux sont modifiables. Aucun secret d'administration ne doit figurer dans GitHub.

## Développement réel

- Dépôt : `ludodulac/nadegerenard` (actuellement public).
- Branche : `feat/site-v1-cms`.
- PR brouillon : https://github.com/ludodulac/nadegerenard/pull/1
- Socle créé : structure HTML/CSS/JS responsive ; pages publiques ; API Cloudflare Workers ; D1 pour pages/brouillons ; R2 pour images ; administration avec corbeille et publication ; préparation du formulaire avec Turnstile et Email Service.
- Contrôles automatiques de syntaxe et tests métier ajoutés ; la PR reste non fusionnée et le site **non déployé**.

## Mise en production à préparer

Créer D1 et R2 dans le compte Cloudflare de Nadège, obtenir l'identifiant D1, configurer Workers, les secrets d'administration **nouveaux et robustes**, Turnstile, adresse destinataire e-mail vérifiée et binding d'envoi. Appliquer migration et données initiales. Tester le rendu, l'administration, le stockage des photos, les sauvegardes, les droits d'image et l'envoi réel d'e-mails avant ouverture.

L'offre gratuite n'est pas illimitée : D1, R2 et Workers ont chacun leurs plafonds. Ne pas lier directement le GitHub existant de Ludovic au Cloudflare de Nadège via l'application GitHub déjà utilisée sur un autre compte ; privilégier le déploiement Wrangler explicite vers son compte Cloudflare.

## Important

Le code de connexion partagé auparavant dans le chat ne doit **pas** être réutilisé comme mot de passe de production. L'accès à l'administration doit être configuré avec un nouveau mot de passe fort stocké dans les secrets Cloudflare.

## Initialisation D1 depuis la console Cloudflare (en cas de copie manuelle)

Après avoir exécuté la migration SQL de création des tables, ouvrir l’onglet Console de `nadege-renard-db-eu` :

1. Copier `seed.sql` depuis la branche `feat/site-v1-cms` (fichier contenant **une seule instruction INSERT** qui insère 8 pages). Exécuter. Vérifier `SELECT COUNT(*) AS total FROM pages;` → **8**.
2. Copier ensuite `seed-footer.sql` (une seule instruction INSERT pour le pied de page). Exécuter. Vérifier `SELECT COUNT(*) AS total FROM settings;` → **1**.

Ne pas réexécuter les instructions en boucle en cas de message `No SQL statements detected` : vérifier le compteur et le contenu du champ de saisie. Les deux requêtes sont idempotentes grâce à `INSERT OR IGNORE`.
