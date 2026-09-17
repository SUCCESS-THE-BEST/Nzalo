import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';

import {
    ArrowLeft,
    CreditCard,
    Wallet,
    Check,
    ChevronDown,
    Users2,
    AlertCircle,
} from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function PayContributionScreen({ navigation }) {
    const [stokvels, setStokvels] = useState([]);
    const [selectedStokvel, setSelectedStokvel] = useState(null);

    const [paymentMethod, setPaymentMethod] = useState('card');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);

    // Mock wallet balance for now.
    // We will connect this to Supabase later.
    const loadWalletBalance = async () => {
    try {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            throw new Error('You are not logged in.');
        }

        const {
            data: wallet,
            error: walletError,
        } = await supabase
            .from('wallet_accounts')
            .select('id, balance, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

            
        if (walletError) {
            throw walletError;
        }

        if (!wallet) {
            throw new Error(
                'Your Nzalo Wallet account was not found.'
            );
        }

        setWalletBalance(Number(wallet.balance) || 0);

    } catch (err) {
            console.error('Load wallet error:', err);

            setError(
                err?.message ||
                'Unable to load your wallet balance.'
            );
        }
    };

    useEffect(() => {
        loadStokvels();
        loadWalletBalance();
    }, []);

    async function loadStokvels() {
        try {
            setLoading(true);
            setError('');

            const {
                data: {
                    user,
                },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error('You are not logged in.');
            }

            /*
             * First get the stokvel memberships belonging
             * to the current user.
             */
            const {
                data: memberships,
                error: membershipError,
            } = await supabase
                .from('stokvel_members')
                .select('stokvel_id')
                .eq('user_id', user.id)
                .eq('status', 'active');

            if (membershipError) {
                throw membershipError;
            }

            if (!memberships || memberships.length === 0) {
                setStokvels([]);
                return;
            }

            const stokvelIds = memberships.map(
                (membership) => membership.stokvel_id
            );

            /*
             * Now retrieve the actual stokvel information.
             */
            const {
                data: stokvelData,
                error: stokvelError,
            } = await supabase
                .from('stokvels')
                .select(`
                    id,
                    name,
                    contribution_amount,
                    contribution_frequency,
                    status
                `)
                .in('id', stokvelIds)
                .eq('status', 'active')
                .order('name', { ascending: true });

            if (stokvelError) {
                throw stokvelError;
            }

            setStokvels(stokvelData || []);

            /*
             * Automatically select the first stokvel.
             */
            if (stokvelData && stokvelData.length > 0) {
                setSelectedStokvel(stokvelData[0]);
            }
        } catch (err) {
            console.error('Load stokvels error:', err);

            setError(
                err?.message ||
                'Unable to load your stokvels.'
            );
        } finally {
            setLoading(false);
        }
    }

    const contributionAmount =
        Number(selectedStokvel?.contribution_amount) || 0;

    const formattedContribution =
        contributionAmount.toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const formattedBalance =
        walletBalance.toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const insufficientBalance =
        contributionAmount > walletBalance;

  
    const handleWalletPayment = async () => {
        if (!selectedStokvel) {
            setError('Please select a stokvel.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const {
                data,
                error: rpcError,
            } = await supabase.rpc('deposit_from_wallet_for_contribution', {
                p_stokvel_id: selectedStokvel.id,
                p_amount: contributionAmount,
                p_description: `Contribution to ${selectedStokvel.name}`,
            });

            if (rpcError) {
                if (rpcError.message?.includes('Insufficient wallet balance')) {
                    navigation.navigate('PaymentFailed', {
                        type: 'contribution',
                        amount: contributionAmount,
                        stokvelName: selectedStokvel.name,
                        reason: 'insufficient_balance',
                    });
                    return;
                }
                setError(rpcError.message || 'Unable to process wallet payment.');
                return;
            }

            setWalletBalance(data.newBalance);

            navigation.navigate('PaymentSuccess', {
                type: 'contribution',
                amount: contributionAmount,
                stokvelName: selectedStokvel.name,
                reference: data.reference,
                paymentMethod: 'wallet',
                newBalance: data.newBalance,
            });
        } catch (err) {
            setError(err?.message || 'Unable to process wallet payment.');
        } finally {
            setLoading(false);
        }
    };


   const handlePayNow = async () => {
    if (!selectedStokvel) {
        console.log('ERROR: No stokvel selected');
        return;
    }

    if (
        paymentMethod === 'wallet' &&
        insufficientBalance
    ) {
        navigation.navigate('PaymentFailed', {
            type: 'contribution',
            amount: contributionAmount,
            stokvelName: selectedStokvel.name,
            reason: 'insufficient_balance',
        });

        return;
    }

    try {
        setLoading(true);
        setError('');
        // GET USER
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            throw new Error('You are not logged in.');
        }
        // GET SESSION
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }
        if (!session) {
            throw new Error('Your session has expired. Please log in again.');
        }
        // SEND TO BACKEND
        const response = await fetch(
            'http://192.168.137.1:3000/api/paystack-contribution/initialize',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':
                        `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    amount: contributionAmount,
                    stokvelId: selectedStokvel.id,
                    userId: user.id,
                    email: user.email,
                }),
            }
        );
        // READ RESPONSE
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error(
                'BACKEND DID NOT RETURN JSON:',
                parseError
            );

            throw new Error(
                'Backend returned an invalid response.'
            );
        }
        // CHECK SUCCESS
        if (!response.ok) {
            throw new Error(data.message ||`Backend error: ${response.status}`);
        }
        if (!data.success) {
            throw new Error(data.message ||'Payment initialization failed.');
        }
        // GET PAYSTACK URL
        const authorizationUrl =data.authorizationUrl || data.data?.authorization_url;
        const reference =data.reference ||
            data.data?.reference;
        if (!authorizationUrl) {
            throw new Error(
                'Paystack authorization URL is missing.'
            );
        }
        if (!reference) {
            throw new Error(
                'Paystack payment reference is missing.'
            );
        }
        // NAVIGATE TO PAYSTACK
        navigation.navigate(
            'PaystackCheckoutContributions',
            {
                authorizationUrl: authorizationUrl,
                reference: reference,
                amount: contributionAmount,
                stokvelId: selectedStokvel.id,
                stokvelName: selectedStokvel.name,
            }
        );
    } catch (err) {
        setError(err?.message ||'Unable to initialize payment.');

        } finally {setLoading(false);}
    };



    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="small"
                        color={colors.primary}
                    />

                    <Text style={styles.loadingText}>
                        Loading your stokvels...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft
                            size={18}
                            color={colors.text}
                        />
                    </Pressable>

                    <View>
                        <Text style={styles.title}>
                            Pay Contribution
                        </Text>

                        <Text style={styles.subtitle}>
                            Make your stokvel contribution
                        </Text>
                    </View>
                </View>

                {/* Error */}
                {error !== '' && (
                    <View style={styles.errorBox}>
                        <AlertCircle
                            size={16}
                            color="#D64545"
                        />

                        <Text style={styles.errorText}>
                            {error}
                        </Text>
                    </View>
                )}

                {/* No Stokvels */}
                {!error && stokvels.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Users2
                                size={24}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            No active stokvels
                        </Text>

                        <Text style={styles.emptyText}>
                            You need to be an active member of a
                            stokvel before you can make a contribution.
                        </Text>

                        <Pressable
                            style={styles.exploreButton}
                            onPress={() =>
                                navigation.navigate(
                                    'Explore'
                                )
                            }
                        >
                            <Text style={styles.exploreButtonText}>
                                Explore Stokvels
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* Main Content */}
                {stokvels.length > 0 && (
                    <>
                        {/* Select Stokvel */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>
                                SELECT STOKVEL
                            </Text>

                            <Pressable
                                style={styles.dropdown}
                                onPress={() => {
                                    /*
                                     * We use a simple inline picker below.
                                     * Tapping the dropdown toggles the options.
                                     */
                                    setSelectedStokvel(
                                        selectedStokvel
                                    );
                                }}
                            >
                                <View style={styles.stokvelIcon}>
                                    <Users2
                                        size={17}
                                        color={colors.primary}
                                    />
                                </View>

                                <View style={styles.dropdownText}>
                                    <Text
                                        style={styles.dropdownTitle}
                                        numberOfLines={1}
                                    >
                                        {selectedStokvel?.name}
                                    </Text>

                                    <Text style={styles.dropdownSubtitle}>
                                        {selectedStokvel?.contribution_frequency ||
                                            'Monthly'}{' '}
                                        contribution
                                    </Text>
                                </View>

                                <ChevronDown
                                    size={18}
                                    color={colors.textSecondary}
                                />
                            </Pressable>

                            {/* Stokvel Options */}
                            {stokvels.length > 1 && (
                                <View style={styles.optionsContainer}>
                                    {stokvels.map((stokvel) => {
                                        const selected =
                                            selectedStokvel?.id ===
                                            stokvel.id;

                                        return (
                                            <Pressable
                                                key={stokvel.id}
                                                style={[
                                                    styles.option,
                                                    selected &&
                                                        styles.optionSelected,
                                                ]}
                                                onPress={() =>
                                                    setSelectedStokvel(
                                                        stokvel
                                                    )
                                                }
                                            >
                                                <View style={styles.optionText}>
                                                    <Text
                                                        style={
                                                            styles.optionTitle
                                                        }
                                                    >
                                                        {stokvel.name}
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.optionSubtitle
                                                        }
                                                    >
                                                        R
                                                        {Number(
                                                            stokvel.contribution_amount
                                                        ).toLocaleString(
                                                            'en-ZA',
                                                            {
                                                                minimumFractionDigits: 2,
                                                            }
                                                        )}{' '}
                                                        /{' '}
                                                        {stokvel.contribution_frequency ||
                                                            'Monthly'}
                                                    </Text>
                                                </View>

                                                {selected && (
                                                    <View
                                                        style={
                                                            styles.optionCheck
                                                        }
                                                    >
                                                        <Check
                                                            size={13}
                                                            color={
                                                                colors.white
                                                            }
                                                            strokeWidth={3}
                                                        />
                                                    </View>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        {/* Contribution Amount */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>
                                CONTRIBUTION AMOUNT (ZAR)
                            </Text>

                            <View style={styles.amountBox}>
                                <Text style={styles.amountText}>
                                    R{formattedContribution}
                                </Text>
                            </View>
                        </View>

                        {/* Payment Method */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>
                                PAYMENT METHOD
                            </Text>

                            {/* Debit Card */}
                            <PaymentMethod
                                icon={CreditCard}
                                title="Visa Debit Card"
                                subtitle="**** **** **** 4567"
                                selected={
                                    paymentMethod === 'card'
                                }
                                onPress={() =>
                                    setPaymentMethod('card')
                                }
                            />

                            {/* Wallet */}
                            <PaymentMethod
                                icon={Wallet}
                                title="Nzalo Wallet"
                                subtitle={`Balance: R${formattedBalance}`}
                                selected={
                                    paymentMethod === 'wallet'
                                }
                                onPress={() =>
                                    setPaymentMethod('wallet')
                                }
                            />
                        </View>

                        {/* Insufficient Balance */}
                        {paymentMethod === 'wallet' &&
                            insufficientBalance && (
                                <View style={styles.warningBox}>
                                    <AlertCircle
                                        size={16}
                                        color="#A06A00"
                                    />

                                    <Text style={styles.warningText}>
                                        Your wallet balance is not
                                        enough to make this
                                        contribution.
                                    </Text>
                                </View>
                            )}

                        {/* Payment Summary */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>
                                    Stokvel
                                </Text>

                                <Text
                                    style={styles.summaryValue}
                                    numberOfLines={1}
                                >
                                    {selectedStokvel?.name}
                                </Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>
                                    Contribution
                                </Text>

                                <Text style={styles.summaryValue}>
                                    R{formattedContribution}
                                </Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>
                                    Total
                                </Text>

                                <Text style={styles.totalValue}>
                                    R{formattedContribution}
                                </Text>
                            </View>
                        </View>

                        {/* Pay Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.payButton,
                                pressed && styles.payButtonPressed,
                            ]}
                            onPress={ paymentMethod === 'wallet'? handleWalletPayment: handlePayNow}
                        >
                            <Text style={styles.payButtonText}>
                                Pay Now
                            </Text>
                        </Pressable>

                        <Text style={styles.securityText}>
                            Your payment is securely processed.
                        </Text>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}


/* ------------------------------------------------ */
/* Payment Method */
/* ------------------------------------------------ */

function PaymentMethod({
    icon: Icon,
    title,
    subtitle,
    selected,
    onPress,
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.paymentCard,
                selected && styles.paymentCardSelected,
                pressed && styles.paymentCardPressed,
            ]}
        >
            <View
                style={[
                    styles.paymentIcon,
                    selected && styles.paymentIconSelected,
                ]}
            >
                <Icon
                    size={19}
                    color={
                        selected
                            ? colors.primary
                            : colors.textSecondary
                    }
                />
            </View>

            <View style={styles.paymentText}>
                <Text style={styles.paymentTitle}>
                    {title}
                </Text>

                <Text style={styles.paymentSubtitle}>
                    {subtitle}
                </Text>
            </View>

            {selected && (
                <View style={styles.checkCircle}>
                    <Check
                        size={13}
                        color={colors.white}
                        strokeWidth={3}
                    />
                </View>
            )}
        </Pressable>
    );
}


/* ------------------------------------------------ */
/* Styles */
/* ------------------------------------------------ */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },

    container: {
        flex: 1,
        backgroundColor: colors.white,
    },

    contentContainer: {
        paddingHorizontal: 14,
        paddingTop: 42,
        paddingBottom: 30,
    },

    /* Header */

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },

    backButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },

    title: {
        fontFamily: fonts.bold,
        fontSize: 20,
        color: colors.text,
        marginBottom: 2,
    },

    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textSecondary,
    },

    /* Sections */

    section: {
        marginBottom: 19,
    },

    sectionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: colors.textSecondary,
        marginBottom: 8,
    },

    /* Dropdown */

    dropdown: {
        minHeight: 53,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E4E6',
        backgroundColor: '#F6F7F8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },

    stokvelIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#E5F4F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },

    dropdownText: {
        flex: 1,
    },

    dropdownTitle: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.text,
        marginBottom: 2,
    },

    dropdownSubtitle: {
        fontFamily: fonts.regular,
        fontSize: 8.5,
        color: colors.textSecondary,
    },

    /* Options */

    optionsContainer: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: 'hidden',
    },

    option: {
        minHeight: 52,
        paddingHorizontal: 11,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    optionSelected: {
        backgroundColor: '#F2FAF8',
    },

    optionText: {
        flex: 1,
    },

    optionTitle: {
        fontFamily: fonts.semibold,
        fontSize: 10.5,
        color: colors.text,
        marginBottom: 2,
    },

    optionSubtitle: {
        fontFamily: fonts.regular,
        fontSize: 8.5,
        color: colors.textSecondary,
    },

    optionCheck: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Amount */

    amountBox: {
        height: 48,
        borderRadius: 13,
        backgroundColor: '#F4F5F6',
        borderWidth: 1,
        borderColor: '#E4E6E8',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },

    amountText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.text,
    },

    /* Payment */

    paymentCard: {
        minHeight: 61,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        marginBottom: 8,
    },

    paymentCardSelected: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    },

    paymentCardPressed: {
        opacity: 0.7,
    },

    paymentIcon: {
        width: 35,
        height: 35,
        borderRadius: 18,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    paymentIconSelected: {
        backgroundColor: '#E5F4F1',
    },

    paymentText: {
        flex: 1,
    },

    paymentTitle: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.text,
        marginBottom: 3,
    },

    paymentSubtitle: {
        fontFamily: fonts.regular,
        fontSize: 9,
        color: colors.textSecondary,
    },

    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Warning */

    warningBox: {
        backgroundColor: '#FFF4BF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    warningText: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 9,
        lineHeight: 13,
        color: '#8A6A00',
        marginLeft: 7,
    },

    /* Summary */

    summaryCard: {
        backgroundColor: colors.background,
        borderRadius: 14,
        paddingHorizontal: 13,
        paddingVertical: 12,
        marginBottom: 18,
    },

    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    summaryLabel: {
        fontFamily: fonts.regular,
        fontSize: 9,
        color: colors.textSecondary,
    },

    summaryValue: {
        maxWidth: '60%',
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: colors.text,
        textAlign: 'right',
    },

    summaryDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },

    totalLabel: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        color: colors.text,
    },

    totalValue: {
        fontFamily: fonts.bold,
        fontSize: 12,
        color: colors.primaryDark,
    },

    /* Button */

    payButton: {
        height: 51,
        borderRadius: 26,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
    },

    payButtonPressed: {
        opacity: 0.8,
    },

    payButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.white,
    },

    securityText: {
        fontFamily: fonts.regular,
        fontSize: 8.5,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 9,
    },

    /* Loading */

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        fontFamily: fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 10,
    },

    /* Error */

    errorBox: {
        backgroundColor: '#FDECEC',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },

    errorText: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 9,
        color: '#D64545',
        marginLeft: 7,
    },

    /* Empty */

    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingTop: 80,
    },

    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#E5F4F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },

    emptyTitle: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.text,
        marginBottom: 7,
    },

    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 10,
        lineHeight: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 18,
    },

    exploreButton: {
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 22,
        backgroundColor: colors.primaryDark,
    },

    exploreButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        color: colors.white,
    },
});