# Tamini

Tamini est une plateforme d'accompagnement pensée pour les personnes âgées et les maisons de retraite. L'application combine un espace public de présentation, une authentification, des parcours adaptés selon le type de compte, et un compagnon IA pour l'accompagnement psychique.
Tamini est une plateforme web d'accompagnement pensée pour les personnes âgées et les maisons de retraite. Le projet combine une vitrine publique, une authentification Supabase, des parcours protégés selon le rôle du compte, des outils de suivi du quotidien et un compagnon IA pour l'accompagnement psychique.

Ce README est volontairement détaillé pour qu'un autre modèle ou un autre développeur puisse comprendre rapidement le projet, son architecture et les points de configuration sans devoir parcourir tout le code.

## Vue D'ensemble

Le projet répond à deux profils principaux :

- une personne âgée qui accède à des outils de santé, de rappel, de téléconsultation, de sécurité, de loisirs et d'accompagnement psychique
- une maison de retraite ou un aidant qui suit les résidents, gère les vêtements et supervise des données de prise en charge

L'application est conçue comme une SPA React avec routage côté client. L'état d'authentification est fourni par Supabase quand les variables d'environnement sont configurées, puis un mode de secours localStorage prend le relais pour les tests locaux sans backend.
## Ce que fait l'application

- Page d'accueil publique au style immersif quand aucun compte n'est connecté.
- Authentification par email / mot de passe via Supabase.
- Deux profils applicatifs :
- Deux profils applicatifs avec protection de routes côté client.
- Chat IA Camille dans l'espace Psychique, alimenté par l'API Groq.
- Fallback localStorage pour continuer à tester l'application si Supabase n'est pas configuré.
- Stockage Supabase prêt pour les usages réels, avec schéma SQL inclus dans le dépôt.

## Parcours Utilisateur

### Utilisateur non connecté

Lorsqu'aucune session n'est détectée, l'application affiche la landing page immersive au style cinématique. Cette page présente la marque, les bénéfices du produit et deux entrées principales : connexion et inscription.

### Inscription

L'inscription se fait dans une modale. Le formulaire permet de choisir le rôle du compte, puis d'enregistrer un email, un mot de passe et éventuellement un nom complet. En mode Supabase, un profil est créé dans la table `profiles` via un trigger sur `auth.users`.

### Connexion

La connexion réactive la session existante ou démarre une nouvelle session Supabase. Si Supabase n'est pas configuré, l'application bascule sur un stockage local de démonstration.

### Utilisateur connecté

Une fois connecté, l'utilisateur voit l'interface principale avec un header persistant, un bouton de déconnexion et un ensemble de routes autorisées selon son rôle.

## Cartographie Des Routes

| Route | Accès | Rôle | Rôle Fonctionnel |
|---|---|---|---|
| `/` | publique puis protégée après connexion | tous | accueil principal / tableau de bord d'entrée |
| `/besoins` | protégé | elderly | espace besoins / produits de santé |
| `/psychique` | protégé | elderly | accompagnement émotionnel avec Camille |
| `/telemedicine` | protégé | elderly | télémedecine et soins à distance |
| `/rappels` | protégé | elderly | rappels de médicaments, repas, rendez-vous, prières |
| `/alerte` | protégé | elderly | sécurité et alertes d'urgence |
| `/loisirs` | protégé | elderly | activités, détente et mini-jeux |
| `/caregiver` | protégé | nursing_home | interface aidant / suivi résident |
| `/vetements` | protégé | nursing_home | inventaire vêtements des résidents |
| `/vetements/ajouter` | protégé | nursing_home | ajout de vêtements |

Les routes non autorisées redirigent vers `/`.

## Fonctionnalités Par Espace

### Accueil Public

La landing page met en avant la proposition de valeur avec une interface immersive, des animations et des boutons d'accès au login et à l'inscription.

### Espace Besoins

Cette section présente un catalogue d'aides et de produits liés à la santé et à la mobilité. Elle sert d'espace de découverte/marketplace autour du matériel médical.

### Espace Psychique

Cet espace héberge Camille, un compagnon IA qui converse en français avec un ton doux et empathique. L'IA est appelée via l'API Groq et utilise une clé fournie dans les variables d'environnement.

### Espace Télémedecine

Cette page sert de point d'accès à des services de consultation ou de suivi à distance.

### Espace Rappels

Cette page permet de gérer des rappels récurrents ou ponctuels liés aux médicaments, repas, rendez-vous et autres routines quotidiennes.

### Espace Alerte

Cette page centralise les actions de sécurité et d'urgence, avec une logique orientée contact, alerte et assistance rapide.

### Espace Loisirs

Cette page regroupe des contenus de détente et d'occupation. Le projet inclut notamment des activités ludiques et du contenu de relaxation.

### Espace Aidants

Le tableau de bord maison de retraite expose des informations de suivi pour les résidents : fiches, observations, historique de prise en charge et données liées aux soins.

### Espace Vêtements

Cette partie gère l'inventaire vestimentaire des résidents. La page permet de consulter les vêtements existants, puis une page dédiée permet d'en ajouter.

## Technologies
## Technologies
- React 19
- TypeScript
- Vite
- React Router
- Supabase
- Tailwind CSS 4
- Motion
- Lucide React

## Architecture Technique

L'application est structurée comme suit :

- `src/App.tsx` orchestre le routage, la protection par rôle et l'enveloppe de providers.
- `src/context/AuthContext.tsx` gère la session, l'inscription, la connexion et la déconnexion.
- `src/context/SubscriptionContext.tsx` gère l'état d'abonnement / déverrouillage de certaines sections.
- `src/lib/supabase.ts` crée le client Supabase à partir des variables d'environnement.
- `src/lib/db.ts` contient la couche d'accès aux données et/ou l'implémentation de secours local.
- `src/pages/` contient les écrans métier.
- `src/components/` contient les blocs d'interface réutilisables.

L'interface utilise `motion` pour des transitions douces et `lucide-react` pour les icônes. Le style global est volontairement chaleureux, avec un fond clair pour l'espace connecté et une landing sombre et immersive pour l'espace public.

## Modèle De Données

Le schéma Supabase est fourni dans `supabase_schema.sql`. Les tables principales sont :

| Table | Rôle |
|---|---|
| `profiles` | profils étendus des utilisateurs, liés à `auth.users` |
| `reminders` | rappels de médicaments, repas, rendez-vous, prières ou autres |
| `seniors` | fiches résidents pour l'espace aidants |
| `medicines` | suivi des médicaments par résident |
| `vitals` | constantes médicales et mesures de suivi |
| `care_logs` | journal de soins et observations quotidiennes |
| `clothing_items` | inventaire vestimentaire des résidents |
| `health_products` | catalogue de produits de santé et mobilité |

Le schéma inclut :

- un trigger `handle_new_user` pour créer automatiquement un profil à l'inscription
- du Row Level Security sur l'ensemble des tables
- des politiques d'accès adaptées au contexte prototype
- des données initiales pour `health_products`


## Résumé Rapide Pour Un Lecteur Automatique

Tamini est une application React/Vite/Supabase pour l'accompagnement des personnes âgées et des maisons de retraite. Elle fournit une landing publique, une inscription/connexion, des routes protégées selon le rôle, un chat IA Camille via Groq, des écrans de suivi santé et d'aide aux résidents, un schéma SQL complet avec RLS, un fallback localStorage pour le développement et un déploiement prévu sur Vercel.
