import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

import {
    StyleSheet,
    Text,
    View,
    Pressable,
    FlatList,
    TextInput,
    Image,
} from 'react-native';

import { Search, PiggyBank, ChevronRight } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

import EmptyState from '../../components/common/EmptyState';


/* -----------------------------
   STATUS BADGE
----------------------------- */

function StatusBadge({ status }) {
    const contributed = status === 'due';

    return (
        <View
            style={[
                styles.badge,
                contributed
                    ? styles.badgeContributed
                    : styles.badgeDue,
            ]}
        >
            <Text
                style={[
                    styles.badgeText,
                    contributed
                        ? styles.badgeTextContributed
                        : styles.badgeTextDue,
                ]}
            >
                {contributed ? 'CONTRIBUTED' : 'DUE'}
            </Text>
        </View>
    );
}


/* -----------------------------
   AVATAR STACK
----------------------------- */

function AvatarStack({ members = [] }) {
    const visibleMembers = members.slice(0, 3);
    const extraMembers = Math.max(members.length - 3, 0);

    if (!members.length) {
        return null;
    }

    return (
        <View style={styles.avatarStack}>
            {visibleMembers.map((member, index) => (
                <View
                    key={member.user_id}
                    style={[
                        styles.avatarWrapper,
                        {
                            marginLeft: index === 0 ? 0 : -9,
                            zIndex: visibleMembers.length - index,
                        },
                    ]}
                >
                    {member.profile_image_url ? (
                        <Image
                            source={{
                                uri: member.profile_image_url,
                            }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitial}>
                                {member.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>
            ))}

            {extraMembers > 0 && (
                <View
                    style={[
                        styles.avatarWrapper,
                        styles.extraAvatar,
                        {
                            marginLeft: -9,
                            zIndex: 0,
                        },
                    ]}
                >
                    <Text style={styles.extraAvatarText}>
                        +{extraMembers}
                    </Text>
                </View>
            )}
        </View>
    );
}


/* -----------------------------
   STOKVEL CARD
----------------------------- */

function StokvelCard({ item, onPress }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
            ]}
            onPress={onPress}
        >
            {/* TOP */}
            <View style={styles.cardTop}>
                <View style={styles.cardTitleArea}>
                    <Text
                        style={styles.cardName}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>

                    <Text style={styles.cardMembers}>
                        {item.members} members active
                    </Text>
                </View>

                <StatusBadge status={item.status} />
            </View>

            {/* DIVIDER */}
            <View style={styles.cardDivider} />

            {/* BOTTOM */}
            <View style={styles.cardBottom}>

                {/* MONTHLY PAYMENT */}
                <View style={styles.infoBlock}>
                    <Text style={styles.cardLabel}>
                        MONTHLY PAY
                    </Text>

                    <Text style={styles.cardValue}>
                        R{Number(item.contribution_amount).toLocaleString(
                            'en-ZA',
                            {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }
                        )}
                    </Text>
                </View>

                {/* NEXT PAYOUT */}
                <View style={styles.infoBlock}>
                    <Text style={styles.cardLabel}>
                        NEXT PAYOUT
                    </Text>

                    <Text style={styles.cardValue}>
                        {item.nextPayout || '—'}
                    </Text>
                </View>

                {/* AVATARS */}
                <AvatarStack members={item.membersList} />
            </View>
        </Pressable>
    );
}


/* -----------------------------
   SCREEN
----------------------------- */

export default function MyStokvelsScreen({ navigation }) {
    const { user } = useAuth();

    const [stokvels, setStokvels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const filteredStokvels = stokvels.filter((stokvel) =>
        stokvel.name
            .toLowerCase()
            .includes(search.toLowerCase())
    );


    useEffect(() => {
        async function loadStokvels() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                /* --------------------------------
                   1. GET USER'S STOKVELS
                -------------------------------- */

                const {
                    data: membershipData,
                    error: membershipError,
                } = await supabase
                    .from('stokvel_members')
                    .select(`
                        stokvel_id,
                        stokvels (
                            id,
                            name,
                            description,
                            contribution_amount,
                            contribution_frequency,
                            max_members,
                            creator_id,
                            status
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'active');

                if (membershipError) {
                    throw membershipError;
                }

                const userStokvels = (membershipData || [])
                    .map((item) => item.stokvels)
                    .filter(Boolean);

                if (!userStokvels.length) {
                    setStokvels([]);
                    return;
                }


                /* --------------------------------
                   2. GET ACTIVE MEMBERS + AVATARS
                -------------------------------- */

                const stokvelIds = userStokvels.map(
                    (stokvel) => stokvel.id
                );

                const {
                    data: membersData,
                    error: membersError,
                } = await supabase
                    .from('stokvel_members')
                    .select(`
                        stokvel_id,
                        user_id,
                        profiles (
                            id,
                            full_name,
                            profile_image_url
                        )
                    `)
                    .in('stokvel_id', stokvelIds)
                    .eq('status', 'active');

                if (membersError) {
                    console.log(
                        'Members error:',
                        membersError.message
                    );
                }


                /* --------------------------------
                   3. GROUP MEMBERS BY STOKVEL
                -------------------------------- */

                const membersByStokvel = {};

                (membersData || []).forEach((member) => {
                    if (!membersByStokvel[member.stokvel_id]) {
                        membersByStokvel[member.stokvel_id] = [];
                    }

                    membersByStokvel[member.stokvel_id].push({
                        user_id: member.user_id,
                        full_name: member.profiles?.full_name,
                        profile_image_url:
                            member.profiles?.profile_image_url,
                    });
                });


                /* --------------------------------
                   4. FORMAT DATA
                -------------------------------- */

                const formattedStokvels = userStokvels.map(
                    (stokvel) => {
                        const members =
                            membersByStokvel[stokvel.id] || [];

                        return {
                            ...stokvel,

                            members: members.length,

                            membersList: members,

                            /*
                             * Replace this with your actual payout
                             * calculation/query when you have the
                             * payout scheduling logic connected.
                             */
                            nextPayout: '15 Mar 2026',

                            /*
                             * You can later calculate this from
                             * contributions for the current period.
                             */
                            status: 'contributed',
                        };
                    }
                );

                setStokvels(formattedStokvels);
            } catch (error) {
                console.log(
                    'My stokvels error:',
                    error.message
                );
            } finally {
                setLoading(false);
            }
        }

        loadStokvels();
    }, [user]);


    return (
        <View style={styles.container}>
            <FlatList
                data={filteredStokvels}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}

                contentContainerStyle={[
                    styles.listContent,
                    filteredStokvels.length === 0 &&
                        styles.emptyListContent,
                ]}

                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            My Stokvels
                        </Text>

                        <Text style={styles.subtitle}>
                            Manage and view all your savings societies
                        </Text>

                        {/* SEARCH */}
                        <View style={styles.searchBar}>
                            <Search
                                size={19}
                                strokeWidth={2}
                                color={colors.textSecondary}
                            />

                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search stokvels..."
                                placeholderTextColor={
                                    colors.textSecondary
                                }
                                value={search}
                                onChangeText={setSearch}
                                autoCapitalize="none"
                                returnKeyType="search"
                            />
                        </View>
                    </View>
                }

                renderItem={({ item }) => (
                    <StokvelCard
                        item={item}
                        onPress={() =>
                            navigation.navigate(
                                'StokvelDetail',
                                {
                                    id: item.id,
                                }
                            )
                        }
                    />
                )}

                ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                )}

                ListEmptyComponent={
                    <EmptyState
                        onCreate={() =>
                            navigation.navigate('CreateStokvel')
                        }
                        onJoin={() =>
                            navigation.navigate('Explore')
                        }
                        PiggyBank={PiggyBank}
                    />
                }
            />
        </View>
    );
}


/* -----------------------------
   STYLES
----------------------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    listContent: {
        paddingHorizontal: 20,
        paddingTop: 42,
        paddingBottom: 30,
    },

    emptyListContent: {
        flexGrow: 1,
    },

    header: {
        marginBottom: 2,
    },

    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 25,
        lineHeight: 31,
        color: colors.text,
        letterSpacing: -0.4,
    },

    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
        marginTop: 4,
        marginBottom: 20,
    },

    /* SEARCH */

    searchBar: {
        height: 46,
        borderRadius: 24,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#E8E8E8',

        flexDirection: 'row',
        alignItems: 'center',

        paddingHorizontal: 15,

        marginBottom: 14,
    },

    searchInput: {
        flex: 1,
        height: '100%',

        marginLeft: 9,

        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.text,

        paddingVertical: 0,
    },

    /* CARD */

    card: {
        position: 'relative',

        backgroundColor: colors.white,

        borderRadius: 17,

        paddingHorizontal: 16,
        paddingTop: 15,
        paddingBottom: 14,

        borderWidth: 1,
        borderColor: '#EEEEEE',

        // shadowColor: '#000',
        // shadowOffset: {
        //     width: 0,
        //     height: 2,
        // },
        // shadowOpacity: 0.045,
        // shadowRadius: 8,

        // elevation: 1,
    },

    cardPressed: {
        opacity: 0.88,
        transform: [{ scale: 0.99 }],
    },

    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },

    cardTitleArea: {
        flex: 1,
        paddingRight: 10,
    },

    cardName: {
        fontFamily: fonts.semibold,
        fontSize: 16,
        lineHeight: 20,
        color: colors.text,
    },

    cardMembers: {
        fontFamily: fonts.regular,
        fontSize: 11.5,
        lineHeight: 16,
        color: colors.textSecondary,
        marginTop: 2,
    },

    /* BADGES */

    badge: {
        minHeight: 22,

        borderRadius: 20,

        paddingHorizontal: 9,
        paddingVertical: 4,

        justifyContent: 'center',
        alignItems: 'center',
    },

    badgeContributed: {
        backgroundColor: '#DDF3E8',
    },

    badgeDue: {
        backgroundColor: '#FFE9E9',
    },

    badgeText: {
        fontFamily: fonts.semibold,
        fontSize: 8.5,
        lineHeight: 12,
        letterSpacing: 0.35,
    },

    badgeTextContributed: {
        color: '#127A4F',
    },

    badgeTextDue: {
        color: '#E23434',
    },

    /* DIVIDER */

    cardDivider: {
        height: 1,
        backgroundColor: '#F1F1F1',
        marginTop: 13,
        marginBottom: 12,
    },

    /* CARD BOTTOM */

    cardBottom: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        minHeight: 39,
    },

    infoBlock: {
        minWidth: 82,
    },

    cardLabel: {
        fontFamily: fonts.regular,
        fontSize: 8.5,
        lineHeight: 12,

        color: colors.textSecondary,

        letterSpacing: 0.45,

        marginBottom: 2,
    },

    cardValue: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        lineHeight: 18,

        color: colors.text,
    },

    /* AVATARS */

    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        paddingRight: 2,
    },

    avatarWrapper: {
        width: 27,
        height: 27,

        borderRadius: 14,

        borderWidth: 2,
        borderColor: colors.white,

        overflow: 'hidden',

        backgroundColor: '#E8E8E8',
    },

    avatar: {
        width: '100%',
        height: '100%',
    },

    avatarFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primaryDark,
    },

    avatarInitial: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 10,
    },

    extraAvatar: {
        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: colors.primaryDark,
    },

    extraAvatarText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 9,
    },

    /* ARROW */

    cardArrow: {
        position: 'absolute',
        right: 9,
        bottom: 9,

        opacity: 0.35,
    },

    separator: {
        height: 12,
    },
});