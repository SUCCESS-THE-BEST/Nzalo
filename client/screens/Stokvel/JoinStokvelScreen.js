import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    ArrowLeft,
    CheckCircle2,
    Users,
    Wallet,
    CalendarDays,
} from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';


export default function JoinStokvelScreen({
    navigation,
    route,
}) {

    const { stokvelId } = route.params || {};

    const [stokvel, setStokvel] = useState(null);

    const [memberCount, setMemberCount] = useState(0);

    const [loading, setLoading] = useState(true);

    const [joining, setJoining] = useState(false);


    // ========================================================
    // Load Stokvel
    // ========================================================

    useEffect(() => {

        if (!stokvelId) {
            Alert.alert(
                'Error',
                'No stokvel was selected.'
            );

            navigation.goBack();

            return;
        }

        fetchStokvel();

    }, [stokvelId]);


    async function fetchStokvel() {

        try {

            setLoading(true);


            // ------------------------------------------------
            // Get stokvel
            // ------------------------------------------------

            const {
                data,
                error,
            } = await supabase
                .from('stokvels')
                .select(`
                    id,
                    name,
                    description,
                    contribution_amount,
                    contribution_frequency,
                    max_members,
                    visibility,
                    status
                `)
                .eq('id', stokvelId)
                .single();


            if (error) {
                throw error;
            }


            setStokvel(data);


            // ------------------------------------------------
            // Get active members
            // ------------------------------------------------

            const {
                count,
                error: memberError,
            } = await supabase
                .from('stokvel_members')
                .select(
                    'user_id',
                    {
                        count: 'exact',
                        head: true,
                    }
                )
                .eq('stokvel_id', stokvelId)
                .eq('status', 'active');


            if (memberError) {
                throw memberError;
            }


            setMemberCount(count || 0);

        } catch (error) {

            console.error(
                'Error loading stokvel:',
                error
            );

            Alert.alert(
                'Unable to load',
                'We could not load this stokvel. Please try again.'
            );

            navigation.goBack();

        } finally {

            setLoading(false);

        }
    }


    // ========================================================
    // Request To Join
    // ========================================================

    async function handleRequestToJoin() {

        if (!stokvel) {
            return;
        }


        try {

            setJoining(true);


            const {
                data,
                error,
            } = await supabase.rpc(
                'request_to_join_stokvel',
                {
                    _stokvel_id: stokvel.id,
                }
            );


            if (error) {
                throw error;
            }


            if (data === 'already_member') {

                Alert.alert(
                    'Already a member',
                    'You are already a member of this stokvel.',
                    [
                        {
                            text: 'OK',
                        },
                    ]
                );

                return;
            }


            if (data === 'already_requested') {

                Alert.alert(
                    'Request already sent',
                    'You have already requested to join this stokvel.',
                    [
                        {
                            text: 'OK',
                        },
                    ]
                );

                return;
            }


            if (data === 'requested') {

                Alert.alert(
                    'Request sent',
                    `Your request to join ${stokvel.name} has been sent to the stokvel admin.`,
                    [
                        {
                            text: 'OK',
                            onPress: () =>
                                navigation.goBack(),
                        },
                    ]
                );

            }

        } catch (error) {

            console.error(
                'Join stokvel error:',
                error
            );


            let message =
                'Something went wrong while sending your request.';


            if (
                error?.message?.includes(
                    'full'
                )
            ) {
                message =
                    'This stokvel is currently full.';
            }

            if (
                error?.message?.includes(
                    'private'
                )
            ) {
                message =
                    'This is a private stokvel.';
            }


            Alert.alert(
                'Unable to join',
                message
            );

        } finally {

            setJoining(false);

        }
    }


    // ========================================================
    // Loading
    // ========================================================

    if (loading) {

        return (
            <View style={styles.loadingScreen}>

                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />

                <Text style={styles.loadingText}>
                    Loading stokvel...
                </Text>

            </View>
        );
    }


    // ========================================================
    // No Stokvel
    // ========================================================

    if (!stokvel) {

        return (
            <View style={styles.loadingScreen}>

                <Text style={styles.errorText}>
                    Stokvel not found.
                </Text>

            </View>
        );
    }


    const isFull =
        stokvel.max_members &&
        memberCount >= stokvel.max_members;


    // ========================================================
    // Screen
    // ========================================================

    return (
        <View style={styles.container}>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.scrollContent
                }
            >

                {/* ==================================================
                    Header
                ================================================== */}

                <View style={styles.header}>

                    <Pressable
                        style={styles.backButton}
                        onPress={() =>
                            navigation.goBack()
                        }
                    >

                        <ArrowLeft
                            size={21}
                            color={colors.text}
                        />

                    </Pressable>


                    <Text style={styles.headerTitle}>
                        Join Stokvel
                    </Text>


                    <View
                        style={styles.headerSpacer}
                    />

                </View>


                {/* ==================================================
                    Stokvel Hero
                ================================================== */}

                <View style={styles.heroCard}>

                    <View style={styles.iconCircle}>

                        <Text style={styles.iconText}>
                            {stokvel.name
                                ?.charAt(0)
                                ?.toUpperCase()}
                        </Text>

                    </View>


                    <Text style={styles.stokvelName}>
                        {stokvel.name}
                    </Text>


                    <View style={styles.publicBadge}>

                        <Text
                            style={
                                styles.publicBadgeText
                            }
                        >
                            PUBLIC STOKVEL
                        </Text>

                    </View>

                </View>


                {/* ==================================================
                    Description
                ================================================== */}

                <View style={styles.section}>

                    <Text style={styles.sectionTitle}>
                        About this stokvel
                    </Text>

                    <Text style={styles.description}>
                        {stokvel.description ||
                            'No description has been provided for this stokvel.'}
                    </Text>

                </View>


                {/* ==================================================
                    Details
                ================================================== */}

                <View style={styles.detailsCard}>

                    {/* Members */}

                    <View style={styles.detailRow}>

                        <View
                            style={styles.detailIcon}
                        >

                            <Users
                                size={20}
                                color={colors.primary}
                            />

                        </View>


                        <View style={styles.detailText}>

                            <Text
                                style={
                                    styles.detailLabel
                                }
                            >
                                MEMBERS
                            </Text>

                            <Text
                                style={
                                    styles.detailValue
                                }
                            >
                                {memberCount}

                                {stokvel.max_members
                                    ? ` / ${stokvel.max_members}`
                                    : ''}

                                {' '}
                                {memberCount === 1
                                    ? 'member'
                                    : 'members'}
                            </Text>

                        </View>

                    </View>


                    <View style={styles.divider} />


                    {/* Contribution */}

                    <View style={styles.detailRow}>

                        <View
                            style={styles.detailIcon}
                        >

                            <Wallet
                                size={20}
                                color={colors.primary}
                            />

                        </View>


                        <View style={styles.detailText}>

                            <Text
                                style={
                                    styles.detailLabel
                                }
                            >
                                CONTRIBUTION
                            </Text>

                            <Text
                                style={
                                    styles.detailValue
                                }
                            >
                                R
                                {Number(
                                    stokvel.contribution_amount
                                ).toLocaleString()}
                            </Text>

                        </View>

                    </View>


                    <View style={styles.divider} />


                    {/* Frequency */}

                    <View style={styles.detailRow}>

                        <View
                            style={styles.detailIcon}
                        >

                            <CalendarDays
                                size={20}
                                color={colors.primary}
                            />

                        </View>


                        <View style={styles.detailText}>

                            <Text
                                style={
                                    styles.detailLabel
                                }
                            >
                                FREQUENCY
                            </Text>

                            <Text
                                style={
                                    styles.detailValue
                                }
                            >
                                {stokvel
                                    .contribution_frequency
                                    ?.charAt(0)
                                    ?.toUpperCase() +
                                    stokvel
                                        .contribution_frequency
                                        ?.slice(1)}
                            </Text>

                        </View>

                    </View>

                </View>


                {/* ==================================================
                    Information
                ================================================== */}

                <View style={styles.infoBox}>

                    <CheckCircle2
                        size={20}
                        color={colors.primary}
                    />

                    <Text style={styles.infoText}>
                        Your request will be sent to the
                        stokvel administrator. You will
                        become a member once your request
                        is approved.
                    </Text>

                </View>


            </ScrollView>


            {/* ======================================================
                Bottom Action
            ====================================================== */}

            <View style={styles.bottomContainer}>

                <Pressable
                    style={({ pressed }) => [
                        styles.joinButton,

                        isFull &&
                            styles.joinButtonDisabled,

                        pressed &&
                            !isFull &&
                            !joining &&
                            styles.buttonPressed,
                    ]}
                    onPress={handleRequestToJoin}
                    disabled={isFull || joining}
                >

                    {joining ? (

                        <ActivityIndicator
                            size="small"
                            color={colors.white}
                        />

                    ) : (

                        <Text
                            style={[
                                styles.joinButtonText,

                                isFull &&
                                    styles.joinButtonTextDisabled,
                            ]}
                        >
                            {isFull
                                ? 'STOKVEL IS FULL'
                                : 'REQUEST TO JOIN'}
                        </Text>

                    )}

                </Pressable>

            </View>

        </View>
    );
}


// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },


    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },


    // --------------------------------------------------------
    // Header
    // --------------------------------------------------------

    header: {
        height: 90,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
        borderColor: colors.border,
    },

    headerTitle: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.text,
    },

    headerSpacer: {
        width: 42,
    },


    // --------------------------------------------------------
    // Hero
    // --------------------------------------------------------

    heroCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 26,
        alignItems: 'center',

        borderWidth: 1,
        borderColor: colors.border,
    },

    iconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },

    iconText: {
        fontFamily: fonts.bold,
        fontSize: 30,
        color: colors.primary,
    },

    stokvelName: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },

    publicBadge: {
        backgroundColor: colors.primaryLight,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },

    publicBadgeText: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        letterSpacing: 0.6,
        color: colors.primary,
    },


    // --------------------------------------------------------
    // About
    // --------------------------------------------------------

    section: {
        marginTop: 25,
    },

    sectionTitle: {
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.text,
        marginBottom: 8,
    },

    description: {
        fontFamily: fonts.regular,
        fontSize: 14,
        lineHeight: 21,
        color: colors.textSecondary,
    },


    // --------------------------------------------------------
    // Details
    // --------------------------------------------------------

    detailsCard: {
        backgroundColor: colors.white,
        borderRadius: 18,
        paddingHorizontal: 18,
        marginTop: 22,

        borderWidth: 1,
        borderColor: colors.border,
    },

    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 17,
    },

    detailIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    detailText: {
        flex: 1,
    },

    detailLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        letterSpacing: 0.7,
        color: colors.textSecondary,
        marginBottom: 3,
    },

    detailValue: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
    },


    // --------------------------------------------------------
    // Info
    // --------------------------------------------------------

    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',

        backgroundColor: colors.primaryLight,

        borderRadius: 15,

        padding: 15,

        marginTop: 20,
    },

    infoText: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 12,
        lineHeight: 18,
        color: colors.text,
        marginLeft: 10,
    },


    // --------------------------------------------------------
    // Bottom Button
    // --------------------------------------------------------

    bottomContainer: {
        backgroundColor: colors.white,

        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 25,

        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    joinButton: {
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primary,

        alignItems: 'center',
        justifyContent: 'center',
    },

    joinButtonDisabled: {
        backgroundColor: colors.border,
    },

    joinButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        letterSpacing: 0.5,
        color: colors.white,
    },

    joinButtonTextDisabled: {
        color: colors.textSecondary,
    },

    buttonPressed: {
        opacity: 0.75,
        transform: [
            {
                scale: 0.98,
            },
        ],
    },


    // --------------------------------------------------------
    // Loading / Error
    // --------------------------------------------------------

    loadingScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },

    loadingText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 12,
    },

    errorText: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.text,
    },

});