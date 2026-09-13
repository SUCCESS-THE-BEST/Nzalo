create or replace function public.request_to_join_stokvel(
    _stokvel_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();

    stokvel_visibility text;
    stokvel_status text;
    member_limit integer;

    active_member_count integer;

    existing_status text;
begin

    -- Make sure the user is logged in
    if current_user_id is null then
        raise exception 'Not authenticated';
    end if;


    -- Get stokvel information
    select
        visibility,
        status,
        max_members

    into
        stokvel_visibility,
        stokvel_status,
        member_limit

    from public.stokvels

    where id = _stokvel_id;


    -- Stokvel does not exist
    if not found then
        raise exception 'Stokvel not found';
    end if;


    -- Only active stokvels can be joined
    if stokvel_status <> 'active' then
        raise exception 'This stokvel is not active';
    end if;


    -- Only public stokvels can use this flow
    if stokvel_visibility <> 'public' then
        raise exception 'This stokvel is private';
    end if;


    -- Check if the user already has a membership/request
    select status

    into existing_status

    from public.stokvel_members

    where stokvel_id = _stokvel_id
      and user_id = current_user_id

    order by joined_at desc nulls last

    limit 1;


    -- Already an active member
    if existing_status = 'active' then
        return 'already_member';
    end if;


    -- Already requested
    if existing_status = 'pending' then
        return 'already_requested';
    end if;


    -- Count active members
    select count(*)

    into active_member_count

    from public.stokvel_members

    where stokvel_id = _stokvel_id
      and status = 'active';


    -- Check capacity
    if member_limit is not null
       and active_member_count >= member_limit then

        raise exception 'This stokvel is full';

    end if;


    -- Create join request
    insert into public.stokvel_members (
        stokvel_id,
        user_id,
        role,
        status
    )

    values (
        _stokvel_id,
        current_user_id,
        'member',
        'pending'
    );


    return 'requested';

end;
$$;

create or replace function public.get_stokvel_join_requests(
    _stokvel_id uuid
)
returns table (
    user_id uuid,
    status text,
    requested_at timestamptz,
    full_name text,
    profile_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        sm.user_id,
        sm.status,
        sm.joined_at as requested_at,
        p.full_name,
        p.profile_image_url
    from public.stokvel_members sm
    join public.profiles p
        on p.id = sm.user_id
    where sm.stokvel_id = _stokvel_id
        and sm.status = 'pending'
        and public.is_stokvel_admin(
            _stokvel_id,
            auth.uid()
        )
    order by sm.joined_at asc nulls last;
$$;

revoke all on function public.get_stokvel_join_requests(uuid)
from public;

grant execute on function public.get_stokvel_join_requests(uuid)
to authenticated;



create or replace function public.review_stokvel_join_request(
    _stokvel_id uuid,
    _user_id uuid,
    _decision text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    current_status text;
    member_limit integer;
    active_member_count integer;
begin

    -- Make sure the user is logged in
    if auth.uid() is null then
        raise exception 'Not authenticated';
    end if;

    -- Only the stokvel admin can review requests
    if not public.is_stokvel_admin(
        _stokvel_id,
        auth.uid()
    ) then
        raise exception 'Not authorized';
    end if;

    -- Validate decision
    if _decision not in ('approve', 'reject') then
        raise exception 'Invalid decision';
    end if;

    -- Find the request
    select status
    into current_status
    from public.stokvel_members
    where stokvel_id = _stokvel_id
      and user_id = _user_id
    limit 1;

    if current_status is null then
        raise exception 'Join request not found';
    end if;

    -- Only pending requests can be reviewed
    if current_status <> 'pending' then
        raise exception 'This request has already been reviewed';
    end if;

    -- APPROVE
    if _decision = 'approve' then

        -- Get member limit
        select max_members
        into member_limit
        from public.stokvels
        where id = _stokvel_id;

        -- Count active members
        select count(*)
        into active_member_count
        from public.stokvel_members
        where stokvel_id = _stokvel_id
          and status = 'active';

        -- Make sure there is still space
        if member_limit is not null
           and active_member_count >= member_limit then

            raise exception 'This stokvel is full';

        end if;

        -- Approve member
        update public.stokvel_members
        set
            status = 'active',
            role = 'member',
            joined_at = now()
        where stokvel_id = _stokvel_id
          and user_id = _user_id
          and status = 'pending';

        return 'approved';

    end if;

    -- REJECT
    if _decision = 'reject' then

        update public.stokvel_members
        set status = 'rejected'
        where stokvel_id = _stokvel_id
          and user_id = _user_id
          and status = 'pending';

        return 'rejected';

    end if;

end;
$$;

revoke all on function public.review_stokvel_join_request(
    uuid,
    uuid,
    text
) from public;

grant execute on function public.review_stokvel_join_request(
    uuid,
    uuid,
    text
) to authenticated;


create or replace function public.get_stokvel_members(
    _stokvel_id uuid
)
returns table (
    user_id uuid,
    role text,
    joined_at timestamptz,
    full_name text,
    profile_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        sm.user_id,
        sm.role,
        sm.joined_at,
        coalesce(p.full_name, 'Member') as full_name,
        p.profile_image_url
    from public.stokvel_members sm
    left join public.profiles p
        on p.id = sm.user_id
    where sm.stokvel_id = _stokvel_id
      and sm.status = 'active'
      and public.is_stokvel_member(
          _stokvel_id,
          auth.uid()
      );
$$;

revoke all
on function public.get_stokvel_members(uuid)
from public;

grant execute
on function public.get_stokvel_members(uuid)
to authenticated;






create or replace function public.get_stokvel_join_request_count(
    _stokvel_id uuid
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
    select count(*)::integer
    from public.stokvel_members
    where stokvel_id = _stokvel_id
      and status = 'pending'
      and public.is_stokvel_admin(
          _stokvel_id,
          auth.uid()
      );
$$;

revoke all
on function public.get_stokvel_join_request_count(uuid)
from public;

grant execute
on function public.get_stokvel_join_request_count(uuid)
to authenticated;