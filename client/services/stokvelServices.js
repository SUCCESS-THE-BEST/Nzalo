import { supabase } from '../config/supabase';


// --------------------------------------------------
// Get stokvels the current user belongs to
// --------------------------------------------------

export async function getMyStokvels(userId) {
    const { data, error } = await supabase
        .from('stokvel_members')
        .select(`
            stokvel_id,
            role,
            status,
            stokvels (
                id,
                name,
                description,
                contribution_amount,
                contribution_frequency,
                max_members,
                status
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

    if (error) {
        throw error;
    }

    return data;
}


// --------------------------------------------------
// Explore public stokvels
// --------------------------------------------------

export async function getPublicStokvels() {
    const { data, error } = await supabase
        .from('stokvels')
        .select(`
            id,
            name,
            description,
            contribution_amount,
            contribution_frequency,
            max_members,
            status
        `)
        .eq('is_public', true)
        .eq('status', 'active')
        .order('created_at', {
            ascending: false
        });

    if (error) {
        throw error;
    }

    return data;
}


// --------------------------------------------------
// Search public stokvels
// --------------------------------------------------

export async function searchPublicStokvels(search) {
    const { data, error } = await supabase
        .from('stokvels')
        .select(`
            id,
            name,
            description,
            contribution_amount,
            contribution_frequency,
            max_members,
            status
        `)
        .eq('is_public', true)
        .eq('status', 'active')
        .ilike('name', `%${search}%`)
        .order('created_at', {
            ascending: false
        });

    if (error) {
        throw error;
    }

    return data;
}


// --------------------------------------------------
// Create stokvel
// --------------------------------------------------

export async function createStokvel({
    name,
    description,
    contributionAmount,
    contributionFrequency,
    maxMembers,
    userId,
}) {

    const { data, error } = await supabase
        .from('stokvels')
        .insert({
            name,
            description,
            contribution_amount: contributionAmount,
            contribution_frequency: contributionFrequency,
            max_members: maxMembers,
            creator_id: userId,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}


// --------------------------------------------------
// Request to join
// --------------------------------------------------

export async function requestToJoin(stokvelId, userId) {
    const { data, error } = await supabase
        .from('stokvel_members')
        .insert({
            stokvel_id: stokvelId,
            user_id: userId,
            role: 'member',
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}


// --------------------------------------------------
// Check user's membership/request status
// --------------------------------------------------

export async function getMembership(stokvelId, userId) {
    const { data, error } = await supabase
        .from('stokvel_members')
        .select(`
            id,
            role,
            status,
            joined_at
        `)
        .eq('stokvel_id', stokvelId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}