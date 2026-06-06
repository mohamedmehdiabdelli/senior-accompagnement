# Database Architecture Report — Tamini

**Source files analyzed:**
- `supabase_schema.sql` — canonical DDL (174 lines)
- `src/lib/supabase.ts` — TypeScript interfaces + Supabase client
- `src/lib/db.ts` — data-access layer (Supabase queries + localStorage fallback)

---

## Tables

| # | Table | Defined in SQL? | Used in code? | Has DDL? |
|---|-------|----------------|---------------|----------|
| 1 | `profiles` | ✅ Yes | ✅ Yes (`UserProfile`) | ✅ Yes |
| 2 | `reminders` | ✅ Yes | ✅ Yes | ✅ Yes |
| 3 | `seniors` | ✅ Yes | ✅ Yes | ✅ Yes |
| 4 | `medicines` | ✅ Yes | ✅ Yes | ✅ Yes |
| 5 | `vitals` | ✅ Yes | ✅ Yes | ✅ Yes |
| 6 | `care_logs` | ✅ Yes | ✅ Yes | ✅ Yes |
| 7 | `clothing_items` | ✅ Yes | ✅ Yes | ✅ Yes |
| 8 | `health_products` | ✅ Yes | ✅ Yes | ✅ Yes |
| 9 | **`doctors`** | ❌ **No DDL** | ✅ Queried in `db.ts:443` | ❌ Missing |
| 10 | **`psychologists`** | ❌ **No DDL** | ✅ Queried in `db.ts:477` | ❌ Missing |
| 11 | **`family_contacts`** | ❌ **No DDL** | ✅ Queried in `db.ts:509` | ❌ Missing |

**⚠️ 3 tables are referenced in code but have no DDL in the schema file.** They must exist in the live Supabase project (created manually or via the Dashboard) or queries will fail.

---

## Columns & Types

### 1. `profiles`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK, FK → `auth.users.id`) | NOT NULL | — |
| `email` | `text` | NOT NULL | — |
| `role` | `text` | NOT NULL | — |
| `full_name` | `text` | ✅ NULL | — |
| `created_at` | `timestamptz` | ✅ NULL | `now()` |

Check constraint: `role IN ('elderly','nursing_home')`

### 2. `reminders`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK) | NOT NULL | `gen_random_uuid()` |
| `user_id` | `text` | NOT NULL | `'local'` |
| `type` | `text` | NOT NULL | — |
| `title` | `text` | NOT NULL | — |
| `time` | `text` | NOT NULL | — |
| `description` | `text` | NOT NULL | `''` |
| `active` | `boolean` | NOT NULL | `true` |
| `created_at` | `timestamptz` | ✅ NULL | `now()` |

Check constraint: `type IN ('medicine','meal','appointment','prayer','other')`

### 3. `seniors`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK) | NOT NULL | `gen_random_uuid()` |
| `caregiver_id` | `text` | NOT NULL | `'local'` |
| `name` | `text` | NOT NULL | — |
| `age` | `integer` | NOT NULL | — |
| `condition` | `text` | NOT NULL | `''` |
| `image_url` | `text` | ✅ NULL | `''` |
| `created_at` | `timestamptz` | ✅ NULL | `now()` |

### 4. `medicines`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK) | NOT NULL | `gen_random_uuid()` |
| `senior_id` | `uuid` (FK → `seniors.id`) | ✅ NULL | — |
| `name` | `text` | NOT NULL | — |
| `dosage` | `text` | NOT NULL | `''` |
| `time_of_day` | `text` | NOT NULL | — |
| `taken` | `boolean` | NOT NULL | `false` |
| `date` | `date` | NOT NULL | `current_date` |

Check constraint: `time_of_day IN ('Matin','Midi','Soir','Nuit')`

### 5. `vitals`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK) | NOT NULL | `gen_random_uuid()` |
| `senior_id` | `uuid` (FK → `seniors.id`) | ✅ NULL | — |
| `date` | `date` | NOT NULL | `current_date` |
| `heart_rate` | `integer` | NOT NULL | — |
| `blood_pressure_sys` | `integer` | NOT NULL | — |
| `blood_pressure_dia` | `integer` | NOT NULL | — |
| `blood_sugar` | `numeric(5,2)` | NOT NULL | — |
| `temperature` | `numeric(4,1)` | NOT NULL | — |
| `created_at` | `timestamptz` | ✅ NULL | `now()` |

### 6. `care_logs`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK) | NOT NULL | `gen_random_uuid()` |
| `senior_id` | `uuid` (FK → `seniors.id`) | ✅ NULL | — |
| `time_label` | `text` | NOT NULL | `''` |
| `text` | `text` | NOT NULL | — |
| `author` | `text` | NOT NULL | — |
| `mood` | `text` | NOT NULL | — |
| `appetite` | `text` | NOT NULL | — |
| `sleep` | `text` | NOT NULL | — |
| `created_at` | `timestamptz` | ✅ NULL | `now()` |

Check constraints:
- `mood IN ('Souriant','Calme','Fatigué','Agité')`
- `appetite IN ('Excellent','Moyen','Faible')`
- `sleep IN ('Bon','Agité','Mauvais')`

### 7. `clothing_items`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK) | NOT NULL | `gen_random_uuid()` |
| `owner_id` | `uuid` (FK → `auth.users.id`) | NOT NULL | — |
| `resident_name` | `text` | NOT NULL | — |
| `category` | `text` | NOT NULL | — |
| `size` | `text` | NOT NULL | — |
| `color` | `text` | NOT NULL | — |
| `type` | `text` | NOT NULL | — |
| `image_url` | `text` | ✅ NULL | `''` |
| `location` | `text` | NOT NULL | `''` |
| `ai_metadata` | `jsonb` | NOT NULL | `'{}'` |
| `created_at` | `timestamptz` | ✅ NULL | `now()` |

Check constraints:
- `category IN ('Chemise','Pantalon','Robe','Pyjama','Veste','T-shirt')`
- `size IN ('XS','S','M','L','XL','XXL')`
- `color IN ('Blanc','Bleu','Gris','Beige','Noir','Rose')`
- `type IN ('Jour','Nuit','Hiver','Été','Sortie')`

### 8. `health_products`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` (PK) | NOT NULL | `gen_random_uuid()` |
| `name` | `text` | NOT NULL | — |
| `category` | `text` | NOT NULL | `''` |
| `price` | `text` | NOT NULL | `''` |
| `image_url` | `text` | ✅ NULL | `''` |
| `description` | `text` | ✅ NULL | `''` |
| `contact` | `text` | ✅ NULL | `''` |
| `type` | `text` | NOT NULL | — |
| `created_at` | `timestamptz` | ✅ NULL | `now()` |

Check constraint: `type IN ('buy','don','sell')`

### Tables without DDL (Inferred from code)

| Table | Columns (from TypeScript interfaces) |
|-------|--------------------------------------|
| `doctors` | `id`, `name`, `specialty`, `image_url`, `availability`, `phone`, `price`, `rating`, `active`, `created_at` |
| `psychologists` | `id`, `name`, `specialty`, `image_url`, `availability`, `phone`, `price`, `active`, `created_at` |
| `family_contacts` | `id`, `user_id`, `name`, `relation`, `phone`, `image_url`, `created_at` |

---

## Relationship Map (ERD)

```
auth.users (Supabase built-in)
  │
  ├── 1:1 ── profiles (id = FK referencing auth.users.id, CASCADE delete)
  │
  └── 1:N ── clothing_items (owner_id = FK referencing auth.users.id, CASCADE delete)

seniors
  ├── 1:N ── medicines (senior_id = FK, CASCADE delete)
  ├── 1:N ── vitals (senior_id = FK, CASCADE delete)
  └── 1:N ── care_logs (senior_id = FK, CASCADE delete)

reminders       → stand-alone (user_id is a text field, no FK to auth.users)
health_products → stand-alone table
doctors         → stand-alone (no DDL)
psychologists   → stand-alone (no DDL)
family_contacts → references user_id (text field, no FK constraint)
```

### Key observations
- **`profiles`** has a true 1:1 FK with `ON DELETE CASCADE` to `auth.users` — a trigger `handle_new_user()` auto-creates a row on signup.
- **`seniors`** acts as the hub for the care module, with 3 child tables (`medicines`, `vitals`, `care_logs`), all using `ON DELETE CASCADE`.
- **`reminders`** uses a `text` `user_id` defaulting to `'local'` — no FK constraint to `auth.users`.
- **`family_contacts`** also uses a loose `text` `user_id` with no FK.
- **`clothing_items`** is the only table that FK-links directly to `auth.users` (not `profiles` or `seniors`), via `owner_id`.

---

## Row Level Security (RLS)

| Table | RLS Enabled? | Policies |
|-------|-------------|----------|
| `profiles` | ✅ | 3 policies: `SELECT`, `INSERT`, `UPDATE` — each scoped to `auth.uid() = id` |
| `reminders` | ✅ | 1 policy: all operations for any authenticated user |
| `seniors` | ✅ | 1 policy: all operations for any authenticated user |
| `medicines` | ✅ | 1 policy: all operations for any authenticated user |
| `vitals` | ✅ | 1 policy: all operations for any authenticated user |
| `care_logs` | ✅ | 1 policy: all operations for any authenticated user |
| `clothing_items` | ✅ | 4 policies: `SELECT`, `INSERT`, `UPDATE`, `DELETE` — each scoped to `owner_id = auth.uid()` |
| `health_products` | ✅ | **Mixed**: `SELECT` is public (`true`); `INSERT`/`UPDATE`/`DELETE` require authenticated |

**Summary:** The security model is split into two tiers:
1. **Strict ownership** — `profiles` and `clothing_items` use row-level checks against `auth.uid()`.
2. **Open authenticated access** — 5 tables (`reminders`, `seniors`, `medicines`, `vitals`, `care_logs`) allow all operations for any logged-in user (prototype mode).
3. **Public read + auth write** — `health_products` is readable by anyone.

---

## Indexes

**No explicit `CREATE INDEX` statements exist in the schema file.** Only the implicit indexes created by `PRIMARY KEY` constraints on `id` columns are present.

This is a potential performance concern — the following query patterns lack explicit indexes:
- `medicines` WHERE `senior_id` + `date` (queried in `db.ts:96-100`)
- `vitals` WHERE `senior_id` + `date` (`db.ts:144-148`)
- `care_logs` WHERE `senior_id` + `created_at` (`db.ts:173-177`)
- `clothing_items` WHERE `owner_id` + `created_at` (`db.ts:233-236`)
- `family_contacts` WHERE `user_id` (`db.ts:509-512`)

---

## Discrepancies / Items to Address

1. **Missing DDL** — `doctors`, `psychologists`, and `family_contacts` are queried via Supabase but have no `CREATE TABLE` in the schema file.
2. **`reminders.user_id` is `text`** — not a FK; cross-referencing with `auth.users` is done in application code only.
3. **`seniors.caregiver_id` is `text`** — same pattern; no FK to `profiles` or `auth.users`.
4. **`UserProfile` TypeScript type does not match `profiles` table** — `src/lib/supabase.ts:103` defines `is_subscribed` and `subscription_date` columns that do not exist in the SQL schema.
5. **No indexes** on frequently-filtered FK/date columns (see above).
6. **`clothing_items.owner_id` uses `references auth.users(id)`** — unlike most tables that use `profiles`, this skips the profile layer and links directly to `auth.users`.
