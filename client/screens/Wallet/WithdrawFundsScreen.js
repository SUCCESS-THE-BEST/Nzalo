import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';

import {
    ArrowLeft,
    Building2,
    Check,
    AlertCircle,
} from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const API_BASE = 'http://192.168.137.1:3000/api/paystack-withdrawal';

// =====================================================
// LINKED BANK ACCOUNT (fnb only, for now)
// =====================================================
// Replace accountNumber with the real account this should
// pay out to. bankCode must match Paystack's bank list.
// =====================================================

const bankDetails = {
    fnb: {
        accountNumber: '6212345678',
        bankCode: '250655',
    },
};

// =====================================================
// FETCH AVAILABLE BALANCE FROM SUPABASE
// =====================================================

async function fetchAvailableBalance() {
    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error('You are not logged in.');

    const { data: wallet, error: walletError } = await supabase
        .from('wallet_accounts')
        .select('balance')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (walletError) throw walletError;
    if (!wallet) {
        throw new Error('Your Nzalo Wallet account was not found.');
    }

    return Number(wallet.balance) || 0;
}

export default function WithdrawFundsScreen({ navigation }) {
    const [availableBalance, setAvailableBalance] = useState(0);
    const [balanceLoading, setBalanceLoading] = useState(true);

    const [amount, setAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('fnb');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load the real balance when the screen opens
    useEffect(() => {
        let isMounted = true;

        const loadBalance = async () => {
            try {
                setBalanceLoading(true);
                const balance = await fetchAvailableBalance();
                if (isMounted) {
                    setAvailableBalance(balance);
                }
            } catch (err) {
                console.error('Load balance error:', err);
                if (isMounted) {
                    setError(
                        err?.message ||
                            'Unable to load your wallet balance.'
                    );
                }
            } finally {
                if (isMounted) {
                    setBalanceLoading(false);
                }
            }
        };

        loadBalance();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleAmountChange = (text) => {
        let cleaned = text.replace(/[^0-9.]/g, '');

        const decimalParts = cleaned.split('.');

        // Only allow one decimal point
        if (decimalParts.length > 2) {
            cleaned =
                decimalParts[0] +
                '.' +
                decimalParts.slice(1).join('');
        }

        // Maximum 2 decimal places
        if (decimalParts[1]?.length > 2) {
            cleaned =
                decimalParts[0] +
                '.' +
                decimalParts[1].slice(0, 2);
        }

        setAmount(cleaned);
    };

    const numericAmount = Number(amount) || 0;

    const formattedAmount = numericAmount.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const formattedBalance = availableBalance.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const isOverBalance = numericAmount > availableBalance;
    const isInvalid =
        balanceLoading || numericAmount <= 0 || isOverBalance;

    // =====================================================
    // WITHDRAW MONEY
    // =====================================================

    const handleWithdraw = async () => {
        if (isInvalid || loading) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            // ---------------------------------------------
            // Get logged-in Supabase user
            // ---------------------------------------------

            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            if (!session) {
                throw new Error('You are not logged in.');
            }

            const userId = session.user.id;

            // ---------------------------------------------
            // Selected bank details
            // ---------------------------------------------

            const selectedBankDetails = bankDetails[selectedBank];

            if (!selectedBankDetails) {
                throw new Error(
                    'Please select a valid bank account.'
                );
            }

            // ---------------------------------------------
            // Verify the account with Paystack first
            // (real call, no money moves here)
            // ---------------------------------------------

            const resolveResponse = await fetch(
                `${API_BASE}/resolve-account`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        accountNumber: selectedBankDetails.accountNumber,
                        bankCode: selectedBankDetails.bankCode,
                    }),
                }
            );

            const resolveData = await resolveResponse.json();

            if (!resolveResponse.ok || !resolveData.success) {
                throw new Error(
                    resolveData.message ||
                        'Could not verify the destination account.'
                );
            }

            const accountName = resolveData.accountName;

            // ---------------------------------------------
            // Send withdrawal request to Express
            // ---------------------------------------------

            const response = await fetch(
                `${API_BASE}/withdraw`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:
                            `Bearer ${session.access_token}`,
                    },

                    body: JSON.stringify({
                        userId: userId,
                        amount: numericAmount,

                        accountName: accountName,

                        accountNumber:
                            selectedBankDetails.accountNumber,

                        bankCode:
                            selectedBankDetails.bankCode,
                    }),
                }
            );

            const data = await response.json();

            console.log(
                'Withdrawal response:',
                data
            );

            // ---------------------------------------------
            // Handle API error
            // ---------------------------------------------

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        'Withdrawal could not be processed.'
                );
            }

            // ---------------------------------------------
            // Withdrawal successful
            // ---------------------------------------------

            navigation.navigate('PaymentSuccess', {
                type: 'withdrawal',
                amount: data.amount,
                reference: data.reference,
                newBalance: data.newBalance,
            });

        } catch (error) {
            console.error(
                'Withdrawal error:',
                error
            );

            setError(
                error.message ||
                    'Unable to process withdrawal.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
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
                                Withdraw Funds
                            </Text>

                            <Text style={styles.subtitle}>
                                Transfer money out to your bank
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

                    {/* Available Balance */}
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>
                            Available Balance
                        </Text>

                        {balanceLoading ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.primaryDark}
                            />
                        ) : (
                            <Text style={styles.balanceAmount}>
                                R{formattedBalance}
                            </Text>
                        )}
                    </View>

                    {/* Withdrawal Amount */}
                    <View style={styles.fieldSection}>
                        <Text style={styles.sectionLabel}>
                            WITHDRAWAL AMOUNT (ZAR)
                        </Text>

                        <View
                            style={[
                                styles.amountInputWrapper,
                                isOverBalance &&
                                    styles.amountInputError,
                            ]}
                        >
                            <TextInput
                                value={amount}
                                onChangeText={handleAmountChange}
                                keyboardType="decimal-pad"
                                placeholder="R0.00"
                                placeholderTextColor={
                                    colors.textSecondary
                                }
                                style={styles.amountInput}
                                selectTextOnFocus
                            />
                        </View>

                        {isOverBalance && !balanceLoading && (
                            <View style={styles.errorRow}>
                                <AlertCircle
                                    size={13}
                                    color="#D64545"
                                />

                                <Text style={styles.errorText}>
                                    Amount exceeds your available balance.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Destination Bank */}
                    <View style={styles.fieldSection}>
                        <Text style={styles.sectionLabel}>
                            DESTINATION BANK
                        </Text>

                        <BankOption
                            title="First National Bank (****5678)"
                            subtitle="Linked bank account"
                            selected={selectedBank === 'fnb'}
                            onPress={() => setSelectedBank('fnb')}
                        />

                        <BankOption
                            title="Add another bank account"
                            subtitle="Link a different destination"
                            selected={selectedBank === 'other'}
                            onPress={() => setSelectedBank('other')}
                        />
                    </View>

                    {/* Processing Information */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Standard processing takes 1 business day.
                            Instant transfer is available with a
                            R10.00 fee.
                        </Text>
                    </View>

                    {/* Button */}
                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.withdrawButton,
                                isInvalid &&
                                    styles.withdrawButtonDisabled,
                                pressed &&
                                    !isInvalid &&
                                    styles.buttonPressed,
                            ]}
                            onPress={handleWithdraw}
                            disabled={isInvalid || loading}
                        >
                            {loading ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.white}
                                />
                            ) : (
                                <Text style={styles.withdrawButtonText}>
                                    Withdraw R{formattedAmount}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


/* ------------------------------------------------ */
/* Bank Option */
/* ------------------------------------------------ */

function BankOption({
    title,
    subtitle,
    selected,
    onPress,
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.bankCard,
                selected && styles.bankCardSelected,
                pressed && styles.bankCardPressed,
            ]}
        >
            <View
                style={[
                    styles.bankIcon,
                    selected && styles.bankIconSelected,
                ]}
            >
                <Building2
                    size={19}
                    color={
                        selected
                            ? colors.primary
                            : colors.textSecondary
                    }
                />
            </View>

            <View style={styles.bankText}>
                <Text style={styles.bankTitle}>
                    {title}
                </Text>

                <Text style={styles.bankSubtitle}>
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

    keyboardContainer: {
        flex: 1,
    },

    container: {
        flex: 1,
        backgroundColor: colors.white,
    },

    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: 14,
        paddingTop: 42,
        paddingBottom: 25,
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

    /* Balance */

    balanceCard: {
        backgroundColor: '#E4F4F1',
        borderRadius: 10,
        minHeight: 50,
        paddingHorizontal: 12,
        paddingVertical: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 22,
    },

    balanceLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: colors.primaryDark,
    },

    balanceAmount: {
        fontFamily: fonts.bold,
        fontSize: 12,
        color: colors.primaryDark,
    },

    /* Amount */

    fieldSection: {
        marginBottom: 18,
    },

    sectionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: colors.textSecondary,
        marginBottom: 7,
    },

    amountInputWrapper: {
        height: 43,
        borderRadius: 22,
        backgroundColor: '#F4F5F6',
        borderWidth: 1,
        borderColor: '#E5E7E9',
        justifyContent: 'center',
        paddingHorizontal: 15,
    },

    amountInputError: {
        borderColor: '#D64545',
    },

    amountInput: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.text,
        padding: 0,
    },

    errorBox: {
        backgroundColor: '#FDECEC',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },

    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 5,
    },

    errorText: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 9,
        color: '#D64545',
    },

    /* Bank */

    bankCard: {
        minHeight: 58,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        marginBottom: 8,
    },

    bankCardSelected: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    },

    bankCardPressed: {
        opacity: 0.7,
    },

    bankIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    bankIconSelected: {
        backgroundColor: '#E6F4F1',
    },

    bankText: {
        flex: 1,
    },

    bankTitle: {
        fontFamily: fonts.semibold,
        fontSize: 10.5,
        color: colors.text,
        marginBottom: 3,
    },

    bankSubtitle: {
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

    /* Info */

    infoBox: {
        backgroundColor: '#FFF4BF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginTop: 2,
    },

    infoText: {
        fontFamily: fonts.regular,
        fontSize: 9,
        lineHeight: 14,
        color: '#8A6A00',
    },

    /* Button */

    buttonContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingTop: 35,
    },

    withdrawButton: {
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
    },

    withdrawButtonDisabled: {
        opacity: 0.45,
    },

    buttonPressed: {
        opacity: 0.8,
    },

    withdrawButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.white,
    },
});