# 🚀 Guide de Déploiement — Tamini

## Vue d'ensemble
| Besoin | Solution |
|---|---|
| Hébergement frontend | Vercel |
| Base de données + Auth | Supabase (Free tier) |
| Chatbot IA | Groq API (Llama 3.3 70B — gratuit) |

---

## Étape 1 — Configurer Supabase (5 min)

1. Aller sur **[supabase.com](https://supabase.com)** → Créer un compte gratuit
2. Créer un nouveau projet (région proche, ex: EU West)
3. Aller dans **SQL Editor → New Query**
4. Copier-coller tout le contenu de `supabase_schema.sql` et cliquer **Run**
5. Aller dans **Authentication → Providers** :
   - Activer **Email**
   - Pour le développement, désactiver "Confirm email" pour ne pas avoir à confirmer chaque compte de test
6. Aller dans **Settings → API** et noter :
   - `Project URL` → ce sera `VITE_SUPABASE_URL` (sans `/rest/v1/` à la fin)
   - `anon/public` key → ce sera `VITE_SUPABASE_ANON_KEY`

---

## Étape 2 — Obtenir une clé Groq (gratuit, 2 min)

1. Aller sur **[console.groq.com](https://console.groq.com)**
2. Créer un compte → **API Keys** → **Create API Key**
3. Copier la clé (commence par `gsk_...`) → ce sera `VITE_GROQ_API_KEY`

> Groq est gratuit avec une limite de requêtes généreuse, parfait pour un prototype.

---

## Étape 3 — Déployer sur Vercel (5 min)

### Option A : Depuis GitHub (recommandé)
1. Pousser ce dossier sur **GitHub** (repo public ou privé)
2. Aller sur **[vercel.com](https://vercel.com)** → **New Project** → importer le repo
3. Dans **Environment Variables**, ajouter :
   ```
   VITE_SUPABASE_URL       = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY  = eyJ...
   VITE_GROQ_API_KEY       = gsk_...
   ```
4. Cliquer **Deploy** → votre site est en ligne en 2 minutes !

### Option B : Via Vercel CLI
```bash
npm install -g vercel
cd tamini
vercel
# Suivre les instructions, puis ajouter les env vars dans le dashboard
```

---

## Étape 4 — Tester l'application

Après déploiement, vérifier :
- ✅ **Page d'accueil non connectée** : style Netflix, boutons "Se connecter" et "S'inscrire"
- ✅ **Sign up** : choix entre "Personne âgée" et "Maison de retraite"
- ✅ **Personne âgée** : voit les 6 menus (Aide Santé, Psychique, Réseau Santé, Rappeler-moi, Alerte, Loisirs)
- ✅ **Maison de retraite** : voit uniquement Espace Aidants
- ✅ **Persistance** : se déconnecter, fermer le navigateur, revenir — le compte existe toujours
- ✅ **Camille (chatbot)** : répond en français
- ✅ **Bouton Déconnexion** dans le header

---

## Mode hors-ligne / développement local sans Supabase

Si vous ne renseignez pas `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, l'app utilise un **fallback localStorage** :
- Les comptes sont stockés dans le navigateur uniquement
- Pratique pour tester le flow d'inscription sans configurer Supabase
- ⚠️ Les comptes seront effacés si l'utilisateur vide le cache

---

## ⚠️ Sécurité : la clé Groq côté navigateur

Telle que configurée, la clé `VITE_GROQ_API_KEY` est intégrée au bundle JavaScript et donc **visible par quiconque ouvre les DevTools du navigateur**. C'est acceptable pour un prototype, mais pour la production :

1. Créer une route serverless Vercel `api/chat.ts`
2. Y mettre la clé en variable d'environnement **sans préfixe `VITE_`** (donc invisible côté client)
3. Modifier `Psychique.tsx` pour appeler `/api/chat` au lieu de Groq directement

---

## Structure du projet

```
tamini/
├── public/
│   └── logo.svg              ← Placeholder — remplacez par votre logo
├── src/
│   ├── App.tsx               ← Routing + redirection selon le rôle
│   ├── components/
│   │   ├── AuthModal.tsx     ← Modale Sign in / Sign up + choix du rôle
│   │   ├── CategoryCard.tsx
│   │   ├── Header.tsx        ← Logo Tamini + bouton déconnexion
│   │   └── SubscriptionModal.tsx
│   ├── context/
│   │   ├── AuthContext.tsx   ← Gestion auth (Supabase + fallback localStorage)
│   │   └── SubscriptionContext.tsx
│   ├── lib/
│   │   ├── supabase.ts       ← Client Supabase
│   │   └── db.ts             ← Couche d'abstraction DB
│   ├── pages/
│   │   ├── Landing.tsx       ← Page publique style Netflix
│   │   ├── Home.tsx          ← Menus filtrés par rôle
│   │   ├── Psychique.tsx     ← Chatbot Camille via Groq
│   │   └── (autres pages...)
│   └── vite-env.d.ts
├── supabase_schema.sql       ← Schéma DB avec table profiles + RLS
├── .env.local                ← Vos clés (ne pas commit)
└── .env.example              ← Template
```
