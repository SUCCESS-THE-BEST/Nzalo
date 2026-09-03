import { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';

import { ChevronLeft, Users } from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

function formatRand(amount) {
    return (Number(amount) || 0).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(dateString, options) {
    if (!dateString) return '—';

    return new Date(dateString).toLocaleDateString(
        'en-ZA',
        options
    );
}

export default function MemberProfileScreen({
    route,
    navigation,
}) {
    const { stokvelId, memberId } = route.params;

    const [member, setMember] = useState(null);
    const [totalContributed, setTotalContributed] = useState(0);
    const [paymentRate, setPaymentRate] = useState(null);
    const [payoutHistory, setPayoutHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadMember() {
            try {
                setLoading(true);
                setError('');

                /* -------------------------------- */
                /* MEMBER */
                /* -------------------------------- */

                const {
                    data: memberRows,
                    error: memberError,
                } = await supabase.rpc(
                    'get_stokvel_members',
                    {
                        _stokvel_id: stokvelId,
                    }
                );

                if (memberError) {
                    throw memberError;
                }

                const memberRow = (memberRows || []).find(
                    (item) => item.user_id === memberId
                );

                if (!memberRow) {
                    throw new Error(
                        'This member could not be found.'
                    );
                }

                setMember(memberRow);

                /* -------------------------------- */
                /* CONTRIBUTIONS */
                /* -------------------------------- */

                const {
                    data: contributions,
                    error: contributionError,
                } = await supabase
                    .from('contributions')
                    .select('amount, status')
                    .eq('stokvel_id', stokvelId)
                    .eq('user_id', memberId);

                if (contributionError) {
                    throw contributionError;
                }

                const contributionRows =
                    contributions || [];

                const paidContributions =
                    contributionRows.filter(
                        (contribution) =>
                            contribution.status === 'paid'
                    );

                const total =
                    paidContributions.reduce(
                        (sum, contribution) =>
                            sum +
                            Number(
                                contribution.amount || 0
                            ),
                        0
                    );

                setTotalContributed(total);

                /* -------------------------------- */
                /* PAYMENT COMPLETION */
                /* -------------------------------- */

                if (contributionRows.length > 0) {
                    const rate = Math.round(
                        (paidContributions.length /
                            contributionRows.length) *
                            100
                    );

                    setPaymentRate(rate);
                } else {
                    setPaymentRate(null);
                }

                /* -------------------------------- */
                /* PAYOUT HISTORY */
                /* -------------------------------- */

                const {
                    data: payouts,
                    error: payoutError,
                } = await supabase
                    .from('payouts')
                    .select(
                        'id, amount, payout_date, status'
                    )
                    .eq('stokvel_id', stokvelId)
                    .eq('recipient_id', memberId)
                    .eq('status', 'completed')
                    .order('payout_date', {
                        ascending: false,
                    });

                if (payoutError) {
                    throw payoutError;
                }

                setPayoutHistory(payouts || []);

            } catch (err) {
                console.log(
                    'Member profile error:',
                    err.message
                );

                setError(
                    err.message ||
                        'Failed to load member profile.'
                );
            } finally {
                setLoading(false);
            }
        }

        loadMember();
    }, [stokvelId, memberId]);

    /* -------------------------------- */
    /* LOADING */
    /* -------------------------------- */

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />

                <Text style={styles.loadingText}>
                    Loading member profile...
                </Text>
            </View>
        );
    }

    /* -------------------------------- */
    /* ERROR */
    /* -------------------------------- */

    if (error || !member) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorTitle}>
                    Unable to load member
                </Text>

                <Text style={styles.errorText}>
                    {error || 'Member not found.'}
                </Text>

                <Pressable
                    style={styles.backErrorButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backErrorButtonText}>
                        Go Back
                    </Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}

            <Pressable
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <ChevronLeft
                    size={22}
                    color={colors.text}
                />
            </Pressable>

            <Text style={styles.title}>
                Member Profile
            </Text>

            <Text style={styles.subtitle}>
                Detailed breakdown of saving habits and payouts
            </Text>

            {/* PROFILE */}

            <View style={styles.profileCard}>
                <View style={styles.profileTop}>
                    {member.profile_image_url ? (
                        <Image
                            source={{
                                uri: member.profile_image_url,
                            }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View
                            style={[
                                styles.avatar,
                                styles.avatarFallback,
                            ]}
                        >
                            <Users
                                size={22}
                                color={
                                    colors.textSecondary
                                }
                            />
                        </View>
                    )}

                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>
                            {member.full_name ||
                                'Member'}
                        </Text>

                        <Text style={styles.meta}>
                            {member.role
                                ? member.role
                                      .charAt(0)
                                      .toUpperCase() +
                                  member.role.slice(1)
                                : 'Member'}

                            {' · Joined '}

                            {formatDate(
                                member.joined_at,
                                {
                                    month: 'short',
                                    year: 'numeric',
                                }
                            )}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* TOTAL CONTRIBUTED */}

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>
                        Total Contributed
                    </Text>

                    <Text style={styles.statValue}>
                        R{formatRand(totalContributed)}
                    </Text>
                </View>

                {/* PAYMENT RATE */}

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>
                        Payment Completion Rate
                    </Text>

                    <Text style={styles.statValueGreen}>
                        {paymentRate !== null
                            ? `${paymentRate}%`
                            : '—'}
                    </Text>
                </View>
            </View>

            {/* PAYOUT HISTORY */}

            <Text style={styles.sectionTitle}>
                Payout History
            </Text>

            {payoutHistory.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>
                        No payouts yet
                    </Text>

                    <Text style={styles.emptyText}>
                        This member has not received a
                        completed payout from this stokvel.
                    </Text>
                </View>
            ) : (
                payoutHistory.map((payout) => (
                    <View
                        key={payout.id}
                        style={styles.payoutCard}
                    >
                        <View style={styles.payoutInfo}>
                            <Text style={styles.payoutTitle}>
                                {formatDate(
                                    payout.payout_date,
                                    {
                                        month: 'long',
                                        year: 'numeric',
                                    }
                                )}{' '}
                                Payout
                            </Text>

                            <Text style={styles.payoutSub}>
                                Received on{' '}
                                {formatDate(
                                    payout.payout_date,
                                    {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    }
                                )}
                            </Text>
                        </View>

                        <Text style={styles.payoutAmount}>
                            R{formatRand(payout.amount)}
                        </Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        padding: 20,
        paddingTop: 45,
        paddingBottom: 40,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.text,
        marginBottom: 6,
    },

    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 24,
    },

    profileCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 28,
    },

    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 14,
    },

    avatarFallback: {
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },

    profileInfo: {
        flex: 1,
    },

    name: {
        fontFamily: fonts.bold,
        fontSize: 17,
        color: colors.text,
        marginBottom: 2,
    },

    meta: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 14,
    },

    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 7,
    },

    statLabel: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        flex: 1,
    },

    statValue: {
        fontFamily: fonts.bold,
        fontSize: 15,
        color: colors.text,
    },

    statValueGreen: {
        fontFamily: fonts.bold,
        fontSize: 15,
        color: '#16A34A',
    },

    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.text,
        marginBottom: 12,
    },

    emptyCard: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 22,
        alignItems: 'center',
    },

    emptyTitle: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
        marginBottom: 5,
    },

    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },

    payoutCard: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },

    payoutInfo: {
        flex: 1,
        marginRight: 10,
    },

    payoutTitle: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
        marginBottom: 3,
    },

    payoutSub: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },

    payoutAmount: {
        fontFamily: fonts.bold,
        fontSize: 15,
        color: colors.primary,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },

    loadingText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 12,
    },

    errorTitle: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },

    errorText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },

    backErrorButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 25,
        paddingHorizontal: 25,
        paddingVertical: 12,
    },

    backErrorButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 13,
    },
});