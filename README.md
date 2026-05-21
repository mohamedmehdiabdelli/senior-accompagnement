# Tamini

Une plateforme bienveillante dédiée à l'accompagnement des personnes âgées et des maisons de retraite.

## Fonctionnalités

- **Authentification** (email / mot de passe) via Supabase
- **Deux types de comptes** :
  - **Personne âgée** → Aide Santé, Psychique, Réseau Santé, Rappels, Alerte, Loisirs
  - **Maison de retraite** → Espace Aidants (suivi des résidents)
- **Page d'accueil publique** (style Netflix) quand non connecté
- **Compagnon IA Camille** (chat psychique) via Groq (Llama 3.3 70B)
- **Base de données** Supabase, avec fallback localStorage pour le développement

## Lancer en local

**Prérequis :** Node.js 18+

```bash
npm install
cp .env.example .env   # puis renseignez les clés dans .env
npm run dev
```

L'application démarre sur http://localhost:3000

> Si vous ne renseignez pas les clés Supabase, l'app utilisera localStorage comme fallback —
> les comptes seront alors stockés uniquement dans le navigateur (pratique pour tester).

## Variables d'environnement

Voir `.env.example`. Vous aurez besoin de :

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase |
| `VITE_GROQ_API_KEY` | Clé API Groq pour le chat IA |

## Base de données Supabase

1. Créez un projet sur https://supabase.com
2. Dans **SQL Editor**, copiez-collez le contenu de `supabase_schema.sql` puis exécutez
3. Dans **Authentication → Providers**, activez **Email** (et au besoin, désactivez la confirmation par email pour le développement : *Email confirmations OFF*)
4. Récupérez l'URL et l'anon key dans **Settings → API** et collez-les dans `.env`

## Déploiement Vercel

1. Poussez le repo sur GitHub
2. Importez-le dans Vercel
3. Ajoutez les variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GROQ_API_KEY`) dans **Project Settings → Environment Variables**
4. Deploy

> ⚠️ **Sécurité** : la clé Groq est exposée côté navigateur. Pour la production, déplacez les appels IA vers une route serveur (Vercel Edge Function) afin de garder la clé secrète.

## Logo

Le logo placeholder se trouve dans `public/logo.svg`. Remplacez-le par votre logo en gardant le même nom de fichier, ou modifiez les références dans `Header.tsx`, `Landing.tsx` et `AuthModal.tsx`.
