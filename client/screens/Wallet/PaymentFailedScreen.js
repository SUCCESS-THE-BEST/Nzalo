import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
} from 'react-native';

import {
    XCircle,
    RefreshCw,
    Wallet,
    AlertCircle,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function PaymentFailedScreen({ navigation, route }) {
    const {
        type = 'contribution',
        amount = 0,
        stokvelName,
        reason = 'unknown',
    } = route.params || {};

    const formattedAmount = Number(amount).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const getTitle = () => {
        switch (type) {
            case 'deposit':
                return 'Deposit Failed';

            case 'withdrawal':
                return 'Withdrawal Failed';

            case 'contribution':
                return 'Contribution Failed';

            default:
                return 'Payment Failed';
        }
    };

    const getMessage = () => {
        if (reason === 'insufficient_balance') {
            return 'You do not have enough funds in your Nzalo Wallet to complete this contribution.';
        }

        if (reason === 'network_error') {
            return 'We could not connect to the payment service. Please check your internet connection and try again.';
        }

        if (reason === 'payment_declined') {
            return 'Your payment was declined by the payment provider. Please try another payment method.';
        }

        return 'Something went wrong while processing your transaction. Please try again.';
    };

    const getReasonTitle = () => {
        if (reason === 'insufficient_balance') {
            return 'Insufficient Wallet Balance';
        }

        if (reason === 'network_error') {
            return 'Connection Problem';
        }

        if (reason === 'payment_declined') {
            return 'Payment Declined';
        }

        return 'Transaction Could Not Be Completed';
    };

    const handleTryAgain = () => {
        if (type === 'contribution') {
            navigation.navigate('PayContribution', {
                stokvelName,
            });
            return;
        }

        if (type === 'deposit') {
            navigation.navigate('DepositFunds');
            return;
        }

        if (type === 'withdrawal') {
            navigation.navigate('WithdrawFunds');
            return;
        }

        navigation.navigate('WalletMain');
    };

    const handleViewWallet = () => {
        navigation.navigate('WalletMain');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* Failed Icon */}
                <View style={styles.iconCircle}>
                    <XCircle
                        size={58}
                        color={colors.primary}
                        strokeWidth={1.8}
                    />
                </View>

                {/* Heading */}
                <Text style={styles.title}>
                    {getTitle()}
                </Text>

                <Text style={styles.subtitle}>
                    Your transaction could not be completed.
                </Text>

                {/* Amount */}
                <Text style={styles.amount}>
                    R{formattedAmount}
                </Text>

                {/* Reason Card */}
                <View style={styles.reasonCard}>
                    <View style={styles.reasonIcon}>
                        <AlertCircle
                            size={22}
                            color={colors.primary}
                        />
                    </View>

                    <View style={styles.reasonContent}>
                        <Text style={styles.reasonTitle}>
                            {getReasonTitle()}
                        </Text>

                        <Text style={styles.reasonText}>
                            {getMessage()}
                        </Text>
                    </View>
                </View>

                {/* Stokvel */}
                {stokvelName && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            STOKVEL
                        </Text>

                        <Text style={styles.detailValue}>
                            {stokvelName}
                        </Text>
                    </View>
                )}

                {/* Transaction status */}
                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />

                    <Text style={styles.statusText}>
                        No funds were deducted from your wallet.
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>

                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleTryAgain}
                    >
                        <RefreshCw
                            size={19}
                            color={colors.white}
                            strokeWidth={2.2}
                        />

                        <Text style={styles.primaryButtonText}>
                            Try Again
                        </Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.secondaryButton,
                            pressed && styles.secondaryPressed,
                        ]}
                        onPress={handleViewWallet}
                    >
                        <Wallet
                            size={19}
                            color={colors.primary}
                            strokeWidth={2}
                        />

                        <Text style={styles.secondaryButtonText}>
                            View Wallet
                        </Text>
                    </Pressable>

                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 55,
    },

    iconCircle: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: '#FDECEC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },

    title: {
        fontFamily: fonts.bold,
        fontSize: 26,
        color: colors.text,
        textAlign: 'center',
    },

    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 21,
    },

    amount: {
        fontFamily: fonts.bold,
        fontSize: 30,
        color: colors.text,
        marginTop: 22,
        marginBottom: 25,
    },

    reasonCard: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },

    reasonIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FDECEC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    reasonContent: {
        flex: 1,
    },

    reasonTitle: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
        marginBottom: 5,
    },

    reasonText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 19,
    },

    detailRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 22,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    detailLabel: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.8,
    },

    detailValue: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.text,
        maxWidth: '60%',
        textAlign: 'right',
    },

    statusRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginRight: 9,
    },

    statusText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },

    actions: {
        width: '100%',
        marginTop: 'auto',
        paddingBottom: 25,
    },

    primaryButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
    },

    primaryButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.white,
    },

    secondaryButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        marginTop: 12,
    },

    secondaryButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.primary,
    },

    buttonPressed: {
        opacity: 0.8,
    },

    secondaryPressed: {
        backgroundColor: colors.background,
    },
});