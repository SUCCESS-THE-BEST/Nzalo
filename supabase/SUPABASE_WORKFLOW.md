# Supabase Workflow — Nzalo

How we manage the database from here on. Read this before touching the schema.

## The rule

**No more pasting SQL into the Supabase dashboard's SQL editor.** Every schema change goes through a migration file in `supabase/migrations/`, tracked in git. This keeps everyone's database in sync and gives us a history of who changed what and when.

## One-time setup (each teammate does this once)

1. Install the Supabase CLI:
   ```
   npm install -g supabase
   ```

2. Log in:
   ```
   supabase login
   ```

3. From the `supabase/` folder in the repo, link to the project:
   ```
   supabase link --project-ref <project-ref>
   ```
   Ask Lunga for the project ref if you don't have it.

## Making a schema change

1. Pull the latest code first (`git pull`), so you're working off the current migration history.

2. Create a new migration:
   ```
   supabase migration new add_chat_messages
   ```
   This creates an empty file like `supabase/migrations/20260903101500_add_chat_messages.sql` — the timestamp prefix keeps migrations ordered.

3. Write your SQL in that file. Example:
   ```sql
   create table public.chat_messages (
       id uuid primary key default gen_random_uuid(),
       stokvel_id uuid not null references public.stokvels(id) on delete cascade,
       user_id uuid not null references public.profiles(id) on delete cascade,
       content text not null,
       created_at timestamptz default now()
   );

   alter table public.chat_messages enable row level security;

   create policy "Members can view messages"
   on public.chat_messages
   for select
   to authenticated
   using (public.is_stokvel_member(stokvel_id, auth.uid()));

   create policy "Members can send messages"
   on public.chat_messages
   for insert
   to authenticated
   with check (
       user_id = auth.uid()
       and public.is_stokvel_member(stokvel_id, auth.uid())
   );
   ```

4. Apply it to the live database:
   ```
   supabase db push
   ```

5. Commit the migration file:
   ```
   git add supabase/migrations/
   git commit -m "Add chat_messages table"
   git push
   ```

6. Let the team know in chat so everyone's aware the schema changed.

## When you pull someone else's migration

If `git pull` brings in a new migration file someone else wrote, run:
```
supabase db push
```
This applies their change to the shared database too (we're all pointing at the same project for now, not separate local databases).

## Troubleshooting

**"Remote database is up to date"** — nothing to apply, you're already in sync. Normal, not an error.

**"relation already exists" on push** — usually means the migration history is out of sync with what's actually live (e.g. someone ran SQL by hand in the dashboard instead of through a migration). Ping Lunga before doing anything — this needs `supabase migration repair` to fix without risking duplicate/conflicting SQL.

**`db pull` fails needing Docker** — `db pull` (used to import an existing schema) needs Docker Desktop running locally. We don't use `db pull` for day-to-day work — only `migration new` + `db push` — so this shouldn't come up unless you're trying to run a fully local Supabase instance (`supabase start`).

## Where things live

```
supabase/
├── migrations/     ← every schema change, in order — this is the source of truth
├── functions/      ← Edge Functions (server-side code, e.g. AI Assistant calls)
└── .gitignore      ← ignores .temp/ (CLI cache, never commit this)
```
