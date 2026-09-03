import {
    StyleSheet,
    Text,
    View,
    Pressable,
    ScrollView,
    Image,
} from 'react-native';

import {
    CreditCard,
    Users2,
    Bell,
    HandCoins,
    ChevronRight,
} from 'lucide-react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';

import ProfileSidebar from '../../components/ProfileSidebar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';


/* =========================================================
   DEFAULT AVATAR
========================================================= */

const DEFAULT_AVATAR =
    'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg';


/* =========================================================
   AVATAR STACK
========================================================= */

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
                    key={member.user_id || index}
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
                            style={styles.stackedAvatar}
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


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
    const contributed = status === 'contributed';

    return (
        <View
            style={[
                styles.statusBadge,
                contributed
                    ? styles.statusBadgeContributed
                    : styles.statusBadgeDue,
            ]}
        >
            <Text
                style={[
                    styles.statusText,
                    contributed
                        ? styles.statusTextContributed
                        : styles.statusTextDue,
                ]}
            >
                {contributed
                    ? 'CONTRIBUTED'
                    : 'DUE'}
            </Text>
        </View>
    );
}


/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {

    const navigation = useNavigation();

    const [sidebarVisible, setSidebarVisible] = useState(false);

    const {
        user,
        loading: authLoading,
    } = useAuth();

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [stokvels, setStokvels] = useState([]);
    const [stokvelsLoading, setStokvelsLoading] = useState(true);


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    useEffect(() => {

        async function loadProfile() {

            if (!user) {
                setProfileLoading(false);
                return;
            }

            const {
                data,
                error,
            } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.log(
                    'Profile error:',
                    error.message
                );

                setProfileLoading(false);
                return;
            }

            setProfile(data);
            setProfileLoading(false);
        }


        if (!authLoading) {
            loadProfile();
        }

    }, [user, authLoading]);


    /* =====================================================
       LOAD STOKVELS
    ===================================================== */

    useEffect(() => {

        async function loadStokvels() {

            if (!user) {
                setStokvelsLoading(false);
                return;
            }

            try {

                /* -----------------------------------------
                   GET USER STOKVEL MEMBERSHIPS
                ----------------------------------------- */

                const {
                    data,
                    error,
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


                if (error) {
                    console.log(
                        'Stokvel error:',
                        error.message
                    );

                    setStokvelsLoading(false);
                    return;
                }


                const memberships = (data || [])
                    .filter((item) => item.stokvels);


                /* -----------------------------------------
                   LOAD EXTRA INFORMATION FOR EACH STOKVEL
                ----------------------------------------- */

                const enrichedStokvels =
                    await Promise.all(
                        memberships.map(
                            async (membership) => {

                                const stokvel =
                                    membership.stokvels;


                                /* =========================
                                   MEMBERS + AVATARS
                                ========================= */

                                let members = [];

                                const {
                                    data: memberData,
                                    error: memberError,
                                } = await supabase.rpc(
                                    'get_stokvel_members',
                                    {
                                        _stokvel_id:
                                            stokvel.id,
                                    }
                                );

                                if (!memberError) {
                                    members =
                                        memberData || [];
                                } else {
                                    console.log(
                                        'Member error:',
                                        memberError.message
                                    );
                                }


                                /* =========================
                                   NEXT PAYOUT
                                ========================= */

                                let nextPayout = null;

                                const {
                                    data: payoutData,
                                    error: payoutError,
                                } = await supabase
                                    .from('payouts')
                                    .select(`
                                        payout_date,
                                        status
                                    `)
                                    .eq(
                                        'stokvel_id',
                                        stokvel.id
                                    )
                                    .in(
                                        'status',
                                        [
                                            'scheduled',
                                            'processing',
                                        ]
                                    )
                                    .gte(
                                        'payout_date',
                                        new Date()
                                            .toISOString()
                                            .split('T')[0]
                                    )
                                    .order(
                                        'payout_date',
                                        {
                                            ascending: true,
                                        }
                                    )
                                    .limit(1)
                                    .maybeSingle();


                                if (
                                    !payoutError &&
                                    payoutData
                                ) {
                                    nextPayout =
                                        formatDate(
                                            payoutData.payout_date
                                        );
                                }


                                /* =========================
                                   CURRENT CONTRIBUTION
                                ========================= */

                                let contributionStatus =
                                    'due';


                                const now = new Date();

                                const startOfMonth =
                                    new Date(
                                        now.getFullYear(),
                                        now.getMonth(),
                                        1
                                    )
                                        .toISOString()
                                        .split('T')[0];


                                const {
                                    data: contributionData,
                                    error:
                                        contributionError,
                                } = await supabase
                                    .from('contributions')
                                    .select(`
                                        id,
                                        status,
                                        contribution_date
                                    `)
                                    .eq(
                                        'stokvel_id',
                                        stokvel.id
                                    )
                                    .eq(
                                        'user_id',
                                        user.id
                                    )
                                    .gte(
                                        'contribution_date',
                                        startOfMonth
                                    )
                                    .eq(
                                        'status',
                                        'paid'
                                    )
                                    .order(
                                        'contribution_date',
                                        {
                                            ascending: false,
                                        }
                                    )
                                    .limit(1)
                                    .maybeSingle();


                                if (
                                    !contributionError &&
                                    contributionData
                                ) {
                                    contributionStatus =
                                        'contributed';
                                }


                                return {
                                    ...membership,

                                    stokvel: {
                                        ...stokvel,

                                        members:
                                            members.length,

                                        membersList:
                                            members,

                                        nextPayout:
                                            nextPayout,

                                        contributionStatus:
                                            contributionStatus,
                                    },
                                };
                            }
                        )
                    );


                setStokvels(enrichedStokvels);

            } catch (error) {

                console.log(
                    'Load stokvels error:',
                    error.message
                );

            } finally {

                setStokvelsLoading(false);

            }
        }


        if (!authLoading) {
            loadStokvels();
        }

    }, [user, authLoading]);


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <View style={styles.container}>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <View style={styles.header}>

                    <Pressable
                        style={styles.leftHeader}
                        onPress={() =>
                            setSidebarVisible(true)
                        }
                    >

                        <Image
                            source={{
                                uri:
                                    profile?.profile_image_url ||
                                    DEFAULT_AVATAR,
                            }}
                            style={styles.avatar}
                        />

                        <View>

                            <Text style={styles.greeting}>
                                Good afternoon
                            </Text>

                            <Text style={styles.name}>
                                {profile?.full_name ||
                                    'User'}
                            </Text>

                        </View>

                    </Pressable>


                    <Pressable
                        style={styles.notification}
                    >
                        <Bell
                            size={20}
                            strokeWidth={2}
                            color={colors.text}
                        />
                    </Pressable>

                </View>


                {/* =================================================
                    BALANCE CARD
                ================================================= */}

                <View style={styles.balanceCard}>

                    <LinearGradient
                        colors={[
                            colors.primaryDark,
                            colors.primary,
                        ]}
                        start={{
                            x: 0.1,
                            y: 0,
                        }}
                        end={{
                            x: 1,
                            y: 1,
                        }}
                        style={styles.gradientCard}
                    >

                        <Text style={styles.balanceLabel}>
                            TOTAL STOKVEL BALANCE
                        </Text>


                        <Text style={styles.balance}>
                            R45,678.90
                        </Text>


                        <View style={styles.balanceBottom}>

                            <Text style={styles.balanceInfo}>
                                Available balance
                            </Text>

                            <Text style={styles.balanceInfo}>
                                + R1,500 this month
                            </Text>

                        </View>

                    </LinearGradient>

                </View>


                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

                <View style={styles.sectionHeader}>

                    <Text style={styles.sectionTitle}>
                        Quick actions
                    </Text>

                </View>


                <View style={styles.actions}>

                    {/* CONTRIBUTE */}

                    <Pressable
                        style={({ pressed }) => [
                            styles.action,
                            pressed &&
                                styles.actionPressed,
                        ]}
                    >

                        <View style={styles.actionIconContainer}>
                            <HandCoins
                                size={21}
                                strokeWidth={2}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.actionText}>
                            Contribute
                        </Text>

                    </Pressable>


                    {/* MY STOKVELS */}

                    <Pressable
                        style={({ pressed }) => [
                            styles.action,
                            pressed &&
                                styles.actionPressed,
                        ]}
                        onPress={() =>
                            navigation.navigate(
                                'Stokvels'
                            )
                        }
                    >

                        <View style={styles.actionIconContainer}>
                            <Users2
                                size={21}
                                strokeWidth={2}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.actionText}>
                            My Stokvels
                        </Text>

                    </Pressable>


                    {/* WALLET */}

                    <Pressable
                        style={({ pressed }) => [
                            styles.action,
                            pressed &&
                                styles.actionPressed,
                        ]}
                    >

                        <View style={styles.actionIconContainer}>
                            <CreditCard
                                size={21}
                                strokeWidth={2}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.actionText}>
                            Wallet
                        </Text>

                    </Pressable>

                </View>


                {/* =================================================
                    MY STOKVELS HEADER
                ================================================= */}

                <View style={styles.sectionHeader}>

                    <Text style={styles.sectionTitle}>
                        My stokvels
                    </Text>


                    <Pressable
                        onPress={() =>
                            navigation.navigate(
                                'Stokvels'
                            )
                        }
                        hitSlop={10}
                    >

                        <Text style={styles.viewAll}>
                            View all
                        </Text>

                    </Pressable>

                </View>


                {/* =================================================
                    LOADING
                ================================================= */}

                {stokvelsLoading ? (

                    <View style={styles.loadingCard}>

                        <Text style={styles.stokvelMembers}>
                            Loading stokvels...
                        </Text>

                    </View>

                ) : stokvels.length === 0 ? (

                    /* =================================================
                       EMPTY
                    ================================================= */

                    <View style={styles.emptyCard}>

                        <View style={styles.emptyIcon}>
                            <Users2
                                size={21}
                                color={colors.primary}
                            />
                        </View>

                        <View style={styles.emptyContent}>

                            <Text style={styles.emptyTitle}>
                                No stokvels yet
                            </Text>

                            <Text style={styles.emptyText}>
                                Create or join a stokvel
                                to get started.
                            </Text>

                        </View>

                    </View>

                ) : (

                    /* =================================================
                       STOKVEL CARDS
                    ================================================= */

                    stokvels
                        .slice(0, 3)
                        .map((item) => {

                            const stokvel =
                                item.stokvel;

                            return (

                                <Pressable
                                    key={stokvel.id}
                                    style={({ pressed }) => [
                                        styles.stokvelCard,
                                        pressed &&
                                            styles.stokvelCardPressed,
                                    ]}
                                    onPress={() =>
                                        navigation.navigate(
                                            'StokvelDetail',
                                            {
                                                id:
                                                    stokvel.id,
                                            }
                                        )
                                    }
                                >

                                    {/* =============================
                                        TOP
                                    ============================= */}

                                    <View style={styles.stokvelTop}>

                                        <View
                                            style={
                                                styles.stokvelTitleArea
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.stokvelName
                                                }
                                                numberOfLines={1}
                                            >
                                                {stokvel.name}
                                            </Text>


                                            <Text
                                                style={
                                                    styles.stokvelMembers
                                                }
                                            >
                                                {stokvel.members ||
                                                    0}{' '}
                                                members active
                                            </Text>

                                        </View>


                                        <StatusBadge
                                            status={
                                                stokvel.contributionStatus
                                            }
                                        />

                                    </View>


                                    {/* =============================
                                        DIVIDER
                                    ============================= */}

                                    <View
                                        style={
                                            styles.stokvelDivider
                                        }
                                    />


                                    {/* =============================
                                        BOTTOM
                                    ============================= */}

                                    <View
                                        style={
                                            styles.stokvelBottom
                                        }
                                    >

                                        {/* MONTHLY PAY */}

                                        <View
                                            style={
                                                styles.stokvelInfo
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.stokvelLabel
                                                }
                                            >
                                                {stokvel.contribution_frequency ===
                                                'monthly'
                                                    ? 'MONTHLY PAY'
                                                    : 'WEEKLY PAY'}
                                            </Text>


                                            <Text
                                                style={
                                                    styles.stokvelValue
                                                }
                                            >
                                                R
                                                {Number(
                                                    stokvel.contribution_amount
                                                ).toLocaleString(
                                                    'en-ZA',
                                                    {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }
                                                )}
                                            </Text>

                                        </View>


                                        {/* NEXT PAYOUT */}

                                        <View
                                            style={
                                                styles.stokvelInfo
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.stokvelLabel
                                                }
                                            >
                                                NEXT PAYOUT
                                            </Text>


                                            <Text
                                                style={
                                                    styles.stokvelValue
                                                }
                                            >
                                                {stokvel.nextPayout ||
                                                    '—'}
                                            </Text>

                                        </View>


                                        {/* AVATARS */}

                                        <AvatarStack
                                            members={
                                                stokvel.membersList ||
                                                []
                                            }
                                        />


                                    </View>

                                </Pressable>

                            );
                        })

                )}


                {/* =================================================
                    PROFILE SIDEBAR
                ================================================= */}

                <ProfileSidebar
                    visible={sidebarVisible}
                    onClose={() =>
                        setSidebarVisible(false)
                    }
                    user={{
                        name:
                            profile?.full_name ||
                            'User',

                        email:
                            profile?.email ||
                            user?.email ||
                            '',

                        avatar:
                            profile?.profile_image_url ||
                            DEFAULT_AVATAR,
                    }}
                    onEditProfile={() => {
                        setSidebarVisible(false);

                        navigation.navigate(
                            'EditProfile'
                        );
                    }}
                />

            </ScrollView>

        </View>
    );
}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return null;
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleDateString(
        'en-ZA',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

    /* =====================================================
       SCREEN
    ===================================================== */

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 42,
        paddingBottom: 40,
    },


    /* =====================================================
       HEADER
    ===================================================== */

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        marginBottom: 25,
    },

    leftHeader: {
        flexDirection: 'row',
        alignItems: 'center',

        gap: 11,
    },

    avatar: {
        width: 46,
        height: 46,

        borderRadius: 23,

        borderWidth: 2,
        borderColor: colors.white,

        backgroundColor: '#E9E9E9',
    },

    greeting: {
        fontFamily: fonts.regular,

        fontSize: 12,
        lineHeight: 17,

        color: colors.textSecondary,

        marginBottom: 1,
    },

    name: {
        fontFamily: 'Outfit_700Bold',

        fontSize: 19,
        lineHeight: 24,

        color: colors.text,
    },

    notification: {
        width: 43,
        height: 43,

        borderRadius: 22,

        backgroundColor: colors.white,

        justifyContent: 'center',
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#EAEAEA',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 7,

        elevation: 1,
    },


    /* =====================================================
       BALANCE CARD
    ===================================================== */

    balanceCard: {
        marginBottom: 30,

        borderRadius: 22,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.10,
        shadowRadius: 14,

        elevation: 4,
    },

    gradientCard: {
        width: '100%',

        minHeight: 158,

        borderRadius: 22,

        paddingHorizontal: 21,
        paddingVertical: 20,

        overflow: 'hidden',
    },

    balanceLabel: {
        fontFamily: fonts.semibold,

        fontSize: 10,

        letterSpacing: 0.7,

        color: colors.white,

        opacity: 0.72,
    },

    balance: {
        fontFamily: 'Outfit_700Bold',

        fontSize: 31,
        lineHeight: 38,

        color: colors.white,

        marginTop: 7,
        marginBottom: 22,

        letterSpacing: -0.5,
    },

    balanceBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    balanceInfo: {
        fontFamily: fonts.regular,

        fontSize: 11.5,

        color: colors.white,

        opacity: 0.78,
    },


    /* =====================================================
       SECTION
    ===================================================== */

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        marginBottom: 13,
    },

    sectionTitle: {
        fontFamily: 'Outfit_700Bold',

        fontSize: 18,
        lineHeight: 23,

        color: colors.text,

        letterSpacing: -0.2,
    },

    viewAll: {
        fontFamily: fonts.semibold,

        fontSize: 12.5,

        color: colors.primary,
    },


    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        marginBottom: 31,
    },

    action: {
        width: '31.5%',

        minHeight: 91,

        backgroundColor: colors.white,

        borderRadius: 17,

        alignItems: 'center',
        justifyContent: 'center',

        paddingVertical: 14,

        borderWidth: 1,
        borderColor: '#EEEEEE',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.035,
        shadowRadius: 7,

        elevation: 1,
    },

    actionPressed: {
        opacity: 0.82,

        transform: [
            {
                scale: 0.97,
            },
        ],
    },

    actionIconContainer: {
        width: 40,
        height: 40,

        borderRadius: 12,

        backgroundColor: '#EAF7F1',

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: 8,
    },

    actionText: {
        fontFamily: fonts.semibold,

        fontSize: 11.5,

        color: colors.text,

        textAlign: 'center',
    },


    /* =====================================================
       STOKVEL CARD
    ===================================================== */

    stokvelCard: {
        backgroundColor: colors.white,

        borderRadius: 17,

        paddingHorizontal: 16,
        paddingTop: 15,
        paddingBottom: 14,

        marginBottom: 11,

        borderWidth: 1,
        borderColor: '#EEEEEE',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.035,
        shadowRadius: 8,

        elevation: 1,
    },

    stokvelCardPressed: {
        opacity: 0.88,

        transform: [
            {
                scale: 0.99,
            },
        ],
    },


    /* =====================================================
       STOKVEL TOP
    ===================================================== */

    stokvelTop: {
        flexDirection: 'row',

        alignItems: 'flex-start',

        justifyContent: 'space-between',
    },

    stokvelTitleArea: {
        flex: 1,

        paddingRight: 10,
    },

    stokvelName: {
        fontFamily: fonts.semibold,

        fontSize: 15.5,
        lineHeight: 20,

        color: colors.text,

        marginBottom: 2,
    },

    stokvelMembers: {
        fontFamily: fonts.regular,

        fontSize: 11.5,
        lineHeight: 16,

        color: colors.textSecondary,
    },


    /* =====================================================
       STATUS BADGE
    ===================================================== */

    statusBadge: {
        minHeight: 22,

        borderRadius: 20,

        paddingHorizontal: 9,
        paddingVertical: 4,

        justifyContent: 'center',
        alignItems: 'center',
    },

    statusBadgeContributed: {
        backgroundColor: '#DDF3E8',
    },

    statusBadgeDue: {
        backgroundColor: '#FFE9E9',
    },

    statusText: {
        fontFamily: fonts.semibold,

        fontSize: 8.5,
        lineHeight: 12,

        letterSpacing: 0.35,
    },

    statusTextContributed: {
        color: '#127A4F',
    },

    statusTextDue: {
        color: '#E23434',
    },


    /* =====================================================
       DIVIDER
    ===================================================== */

    stokvelDivider: {
        height: 1,

        backgroundColor: '#F1F1F1',

        marginTop: 13,
        marginBottom: 12,
    },


    /* =====================================================
       STOKVEL BOTTOM
    ===================================================== */

    stokvelBottom: {
        flexDirection: 'row',

        alignItems: 'flex-end',

        minHeight: 38,

        paddingRight: 17,
    },

    stokvelInfo: {
        minWidth: 82,
    },

    stokvelLabel: {
        fontFamily: fonts.regular,

        fontSize: 8.5,
        lineHeight: 12,

        color: colors.textSecondary,

        letterSpacing: 0.45,

        marginBottom: 2,
    },

    stokvelValue: {
        fontFamily: fonts.semibold,

        fontSize: 13,
        lineHeight: 18,

        color: colors.text,
    },


    /* =====================================================
       AVATARS
    ===================================================== */

    avatarStack: {
        flexDirection: 'row',

        alignItems: 'center',

        marginLeft: 'auto',
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

    stackedAvatar: {
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


    /* =====================================================
       CHEVRON
    ===================================================== */

    cardChevron: {
        position: 'absolute',

        right: -2,
        bottom: 6,

        opacity: 0.35,
    },


    /* =====================================================
       LOADING
    ===================================================== */

    loadingCard: {
        backgroundColor: colors.white,

        borderRadius: 17,

        padding: 18,

        borderWidth: 1,
        borderColor: '#EEEEEE',
    },


    /* =====================================================
       EMPTY
    ===================================================== */

    emptyCard: {
        backgroundColor: colors.white,

        borderRadius: 17,

        paddingHorizontal: 16,
        paddingVertical: 17,

        flexDirection: 'row',
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#EEEEEE',
    },

    emptyIcon: {
        width: 42,
        height: 42,

        borderRadius: 13,

        backgroundColor: '#EAF7F1',

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: 12,
    },

    emptyContent: {
        flex: 1,
    },

    emptyTitle: {
        fontFamily: fonts.semibold,

        fontSize: 14,

        color: colors.text,

        marginBottom: 2,
    },

    emptyText: {
        fontFamily: fonts.regular,

        fontSize: 11.5,
        lineHeight: 17,

        color: colors.textSecondary,
    },

});