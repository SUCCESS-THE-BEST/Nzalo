select column_name, data_type
from information_schema.columns
where table_schema = 'public'
and table_name in (
    'profiles',
    'stokvels',
    'stokvel_members',
    'contributions',
    'payouts',
    'transactions',
    'wallet_accounts',
    'wallet_transactions'
)
order by table_name, ordinal_position;



create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    stokvel_id uuid
        references public.stokvels(id)
        on delete cascade,

    type text not null,

    title text not null,

    message text not null,

    is_read boolean not null default false,

    created_at timestamptz not null default now()
);


create index if not exists idx_notifications_user_created
on public.notifications(
    user_id,
    created_at desc
);


alter table public.notifications
enable row level security;

create policy "Users can view their own notifications"
on public.notifications
for select
to authenticated
using (
    user_id = auth.uid()
);

create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (
    user_id = auth.uid()
)
with check (
    user_id = auth.uid()
);


select
    sm.stokvel_id,
    sm.user_id,
    sm.status,
    s.name as stokvel_name,
    s.creator_id
from public.stokvel_members sm
join public.stokvels s
    on s.id = sm.stokvel_id
where sm.status = 'pending'
order by sm.joined_at desc;

select
    p.proname,
    pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n
    on n.oid = p.pronamespace
where n.nspname = 'public'
and p.proname = 'request_to_join_stokvel';









create or replace function public.create_join_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    stokvel_name text;
    requester_name text;
    creator_user_id uuid;
begin

    -- Only notify when someone submits a pending join request
    if new.status <> 'pending' then
        return new;
    end if;

    -- Get the stokvel name and its creator/admin
    select
        s.name,
        s.creator_id
    into
        stokvel_name,
        creator_user_id
    from public.stokvels s
    where s.id = new.stokvel_id;

    -- Get the name of the person requesting to join
    select coalesce(full_name, 'A user')
    into requester_name
    from public.profiles
    where id = new.user_id;

    -- Send the notification only to the stokvel creator/admin
    insert into public.notifications (
        user_id,
        stokvel_id,
        type,
        title,
        message
    )
    values (
        creator_user_id,
        new.stokvel_id,
        'member',
        'New Member Request',
        requester_name || ' requested to join ' || stokvel_name || '.'
    );

    return new;
end;
$$;

select
    tgname
from pg_trigger
where tgrelid = 'public.stokvel_members'::regclass
and not tgisinternal;

create trigger on_stokvel_member_join_request
after insert on public.stokvel_members
for each row
execute function public.create_join_request_notification();

select
    tgname
from pg_trigger
where tgrelid = 'public.stokvel_members'::regclass
and not tgisinternal;


select
    id,
    user_id,
    stokvel_id,
    type,
    title,
    message,
    is_read,
    created_at
from public.notifications
order by created_at desc;



select
    pg_get_functiondef(
        'public.review_stokvel_join_request(uuid, uuid, text)'::regprocedure
    );

    --The approval/rejection notification trigger

    create or replace function public.create_join_request_result_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    stokvel_name text;
    notification_title text;
    notification_message text;
    notification_type text;
begin

    -- Only continue when a pending request is reviewed
    if old.status <> 'pending' then
        return new;
    end if;

    -- Only notify when the status becomes active or rejected
    if new.status not in ('active', 'rejected') then
        return new;
    end if;

    -- Get the stokvel name
    select name
    into stokvel_name
    from public.stokvels
    where id = new.stokvel_id;

    -- Approved
    if new.status = 'active' then

        notification_type := 'member_approved';
        notification_title := 'Join Request Approved';
        notification_message :=
            'Your request to join ' ||
            stokvel_name ||
            ' has been approved.';

    -- Rejected
    elsif new.status = 'rejected' then

        notification_type := 'member_rejected';
        notification_title := 'Join Request Rejected';
        notification_message :=
            'Your request to join ' ||
            stokvel_name ||
            ' was not approved.';

    end if;

    insert into public.notifications (
        user_id,
        stokvel_id,
        type,
        title,
        message
    )
    values (
        new.user_id,
        new.stokvel_id,
        notification_type,
        notification_title,
        notification_message
    );

    return new;
end;
$$;

create trigger on_stokvel_member_join_request_reviewed
after update of status on public.stokvel_members
for each row
execute function public.create_join_request_result_notification();