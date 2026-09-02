-- ============================================================
-- Nzalo — Initial Schema
-- ============================================================

-- ---------- Tables ----------

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    phone_number text,
    profile_image_url text,
    id_number text,
    email text,
    address text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.stokvels (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    contribution_amount numeric(12,2) not null,
    contribution_frequency text not null
        check (contribution_frequency in ('weekly', 'monthly')),
    max_members integer,
    creator_id uuid not null
        references public.profiles(id)
        on delete restrict,
    status text not null default 'active'
        check (status in ('active', 'completed', 'suspended')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.stokvel_members (
    id uuid primary key default gen_random_uuid(),
    stokvel_id uuid not null
        references public.stokvels(id)
        on delete cascade,
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,
    role text not null default 'member'
        check (role in ('admin', 'treasurer', 'member')),
    status text not null default 'active'
        check (status in ('pending', 'active', 'suspended', 'left')),
    joined_at timestamptz default now(),
    unique(stokvel_id, user_id)
);

create table public.contributions (
    id uuid primary key default gen_random_uuid(),
    stokvel_id uuid not null
        references public.stokvels(id)
        on delete cascade,
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,
    amount numeric(12,2) not null,
    contribution_date date not null default current_date,
    status text not null default 'pending'
        check (status in ('pending', 'paid', 'failed')),
    payment_reference text,
    created_at timestamptz default now()
);

create table public.payouts (
    id uuid primary key default gen_random_uuid(),
    stokvel_id uuid not null
        references public.stokvels(id)
        on delete cascade,
    recipient_id uuid not null
        references public.profiles(id)
        on delete restrict,
    amount numeric(12,2) not null,
    payout_date date not null,
    status text not null default 'scheduled'
        check (status in ('scheduled', 'processing', 'completed', 'cancelled')),
    created_at timestamptz default now()
);

create table public.transactions (
    id uuid primary key default gen_random_uuid(),
    stokvel_id uuid not null
        references public.stokvels(id)
        on delete cascade,
    user_id uuid
        references public.profiles(id)
        on delete set null,
    type text not null
        check (type in ('contribution', 'payout', 'fee', 'refund')),
    amount numeric(12,2) not null,
    description text,
    reference_id uuid,
    created_at timestamptz default now()
);

-- ---------- RLS ----------

alter table public.profiles enable row level security;
alter table public.stokvels enable row level security;
alter table public.stokvel_members enable row level security;
alter table public.contributions enable row level security;
alter table public.payouts enable row level security;
alter table public.transactions enable row level security;

-- ---------- Trigger: create profile on signup ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (
        id,
        full_name,
        phone_number,
        email
    )
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        new.raw_user_meta_data ->> 'phone',
        new.email
    );

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ---------- Trigger: add creator as admin member ----------

create or replace function public.add_stokvel_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.stokvel_members (
        stokvel_id,
        user_id,
        role,
        status
    )
    values (
        new.id,
        new.creator_id,
        'admin',
        'active'
    );

    return new;
end;
$$;

drop trigger if exists on_stokvel_created on public.stokvels;

create trigger on_stokvel_created
after insert on public.stokvels
for each row
execute function public.add_stokvel_creator();

-- ---------- Helper functions ----------

create or replace function public.is_stokvel_member(
    _stokvel_id uuid,
    _user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.stokvel_members
        where stokvel_id = _stokvel_id
        and user_id = _user_id
        and status = 'active'
    );
$$;

create or replace function public.is_stokvel_admin(
    _stokvel_id uuid,
    _user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.stokvel_members
        where stokvel_id = _stokvel_id
        and user_id = _user_id
        and role in ('admin', 'treasurer')
        and status = 'active'
    );
$$;

-- ---------- Policies: profiles ----------

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ---------- Policies: stokvels ----------

create policy "Members can view stokvels"
on public.stokvels
for select
to authenticated
using (
    creator_id = auth.uid()
    or public.is_stokvel_member(id, auth.uid())
);

create policy "Users can create stokvels"
on public.stokvels
for insert
to authenticated
with check (creator_id = auth.uid());

create policy "Admins can update stokvels"
on public.stokvels
for update
to authenticated
using (
    creator_id = auth.uid()
    or public.is_stokvel_admin(id, auth.uid())
)
with check (
    creator_id = auth.uid()
    or public.is_stokvel_admin(id, auth.uid())
);

create policy "Creators can delete stokvels"
on public.stokvels
for delete
to authenticated
using (creator_id = auth.uid());

-- ---------- Policies: stokvel_members ----------

create policy "Members can view members"
on public.stokvel_members
for select
to authenticated
using (
    user_id = auth.uid()
    or public.is_stokvel_member(stokvel_id, auth.uid())
);

create policy "Admins can add members"
on public.stokvel_members
for insert
to authenticated
with check (public.is_stokvel_admin(stokvel_id, auth.uid()));

create policy "Admins can update members"
on public.stokvel_members
for update
to authenticated
using (public.is_stokvel_admin(stokvel_id, auth.uid()))
with check (public.is_stokvel_admin(stokvel_id, auth.uid()));

create policy "Admins can remove members"
on public.stokvel_members
for delete
to authenticated
using (public.is_stokvel_admin(stokvel_id, auth.uid()));

-- ---------- Policies: contributions ----------

create policy "Members can view contributions"
on public.contributions
for select
to authenticated
using (public.is_stokvel_member(stokvel_id, auth.uid()));

create policy "Members can create contributions"
on public.contributions
for insert
to authenticated
with check (
    user_id = auth.uid()
    and public.is_stokvel_member(stokvel_id, auth.uid())
);

-- ---------- Policies: payouts ----------

create policy "Members can view payouts"
on public.payouts
for select
to authenticated
using (public.is_stokvel_member(stokvel_id, auth.uid()));

-- ---------- Policies: transactions ----------

create policy "Members can view transactions"
on public.transactions
for select
to authenticated
using (public.is_stokvel_member(stokvel_id, auth.uid()));

-- ---------- Indexes ----------

create index if not exists idx_stokvel_members_stokvel_id on public.stokvel_members(stokvel_id);
create index if not exists idx_stokvel_members_user_id on public.stokvel_members(user_id);
create index if not exists idx_contributions_stokvel_id on public.contributions(stokvel_id);
create index if not exists idx_contributions_user_id on public.contributions(user_id);
create index if not exists idx_payouts_stokvel_id on public.payouts(stokvel_id);
create index if not exists idx_transactions_stokvel_id on public.transactions(stokvel_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);