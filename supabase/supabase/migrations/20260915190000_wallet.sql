-- ============================================================
-- Nzalo — Wallet
-- ============================================================


-- ============================================================
-- WALLET ACCOUNTS
-- ============================================================

create table if not exists public.wallet_accounts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null unique
        references public.profiles(id)
        on delete cascade,

    balance numeric(12,2) not null default 0.00
        check (balance >= 0),

    currency text not null default 'ZAR',

    status text not null default 'active'
        check (status in ('active', 'suspended', 'closed')),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================

create table if not exists public.wallet_transactions (
    id uuid primary key default gen_random_uuid(),

    wallet_id uuid not null
        references public.wallet_accounts(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    transaction_type text not null
        check (
            transaction_type in (
                'deposit',
                'withdrawal',
                'contribution',
                'refund',
                'adjustment'
            )
        ),

    amount numeric(12,2) not null
        check (amount > 0),

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'completed',
                'failed',
                'cancelled'
            )
        ),

    reference text unique,

    description text,

    stokvel_id uuid
        references public.stokvels(id)
        on delete set null,

    created_at timestamptz not null default now(),

    completed_at timestamptz
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_wallet_transactions_user_created
on public.wallet_transactions(
    user_id,
    created_at desc
);

create index if not exists idx_wallet_transactions_wallet_created
on public.wallet_transactions(
    wallet_id,
    created_at desc
);

create index if not exists idx_wallet_transactions_stokvel_id
on public.wallet_transactions(stokvel_id);


-- ============================================================
-- CREATE WALLET AUTOMATICALLY WHEN PROFILE IS CREATED
-- ============================================================

create or replace function public.create_user_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.wallet_accounts (
        user_id,
        balance,
        currency,
        status
    )
    values (
        new.id,
        0.00,
        'ZAR',
        'active'
    )
    on conflict (user_id) do nothing;

    return new;

end;
$$;


drop trigger if exists on_profile_created_wallet
on public.profiles;


create trigger on_profile_created_wallet
after insert on public.profiles
for each row
execute function public.create_user_wallet();


-- ============================================================
-- CREATE WALLETS FOR EXISTING USERS
-- ============================================================

insert into public.wallet_accounts (
    user_id,
    balance,
    currency,
    status
)
select
    p.id,
    0.00,
    'ZAR',
    'active'
from public.profiles p
left join public.wallet_accounts w
    on w.user_id = p.id
where w.id is null;


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.update_wallet_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


drop trigger if exists wallet_accounts_updated_at
on public.wallet_accounts;


create trigger wallet_accounts_updated_at
before update on public.wallet_accounts
for each row
execute function public.update_wallet_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.wallet_accounts
enable row level security;

alter table public.wallet_transactions
enable row level security;


-- ============================================================
-- WALLET POLICIES
-- ============================================================

drop policy if exists "Users can view their own wallet"
on public.wallet_accounts;


create policy "Users can view their own wallet"
on public.wallet_accounts
for select
to authenticated
using (
    user_id = auth.uid()
);


drop policy if exists "Users can view their own wallet transactions"
on public.wallet_transactions;


create policy "Users can view their own wallet transactions"
on public.wallet_transactions
for select
to authenticated
using (
    user_id = auth.uid()
);


-- ============================================================
-- WALLET LOOKUP FUNCTION
-- ============================================================

create or replace function public.get_my_wallet()
returns table (
    id uuid,
    user_id uuid,
    balance numeric,
    currency text,
    status text,
    created_at timestamptz,
    updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
    select
        w.id,
        w.user_id,
        w.balance,
        w.currency,
        w.status,
        w.created_at,
        w.updated_at
    from public.wallet_accounts w
    where w.user_id = auth.uid();
$$;


revoke all
on function public.get_my_wallet()
from public;


grant execute
on function public.get_my_wallet()
to authenticated;