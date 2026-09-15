import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
} from 'react-native';

import {
    Check,
    ArrowLeft,
    Receipt,
    Wallet,
    Users2,
    Download,
    Upload,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function PaymentSuccessScreen({
    navigation,
    route,
}) {
    const {
        type = 'deposit',
        amount = 0,
        stokvelName,
        reference = 'NZL-2026-001',
    } = route.params || {};

    const formattedAmount = Number(amount).toLocaleString(
        'en-ZA',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    );

    const getTitle = () => {
        switch (type) {
            case 'withdrawal':
                return 'Withdrawal Successful';

            case 'contribution':
                return 'Contribution Successful';

            case 'deposit':
            default:
                return 'Deposit Successful';
        }
    };

    const getDescription = () => {
        switch (type) {
            case 'withdrawal':
                return 'Your withdrawal request has been successfully submitted.';

            case 'contribution':
                return `Your contribution to ${stokvelName || 'your stokvel'} has been successfully recorded.`;

            case 'deposit':
            default:
                return 'Funds have been successfully added to your Nzalo wallet.';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'withdrawal':
                return Upload;

            case 'contribution':
                return Users2;

            case 'deposit':
            default:
                return Download;
        }
    };

    const TransactionIcon = getIcon();

    const handleDone = () => {
        navigation.navigate('WalletMain');
    };

    const handleViewWallet = () => {
        navigation.navigate('WalletMain');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

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

                    <Text style={styles.headerTitle}>
                        Payment
                    </Text>
                </View>

                {/* Main */}
                <View style={styles.main}>

                    {/* Success Icon */}
                    <View style={styles.successCircle}>
                        <Check
                            size={40}
                            color={colors.white}
                            strokeWidth={3}
                        />
                    </View>

                    <Text style={styles.successTitle}>
                        {getTitle()}
                    </Text>

                    <Text style={styles.description}>
                        {getDescription()}
                    </Text>

                    {/* Amount */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>
                            AMOUNT
                        </Text>

                        <Text style={styles.amount}>
                            R{formattedAmount}
                        </Text>
                    </View>

                    {/* Transaction Details */}
                    <View style={styles.detailsCard}>

                        <DetailRow
                            label="Status"
                            value="Successful"
                            valueStyle={styles.successValue}
                        />

                        <DetailRow
                            label="Reference"
                            value={reference}
                        />

                        {stokvelName && (
                            <DetailRow
                                label="Stokvel"
                                value={stokvelName}
                            />
                        )}

                        <DetailRow
                            label="Transaction"
                            value={
                                type === 'contribution'
                                    ? 'Contribution'
                                    : type === 'withdrawal'
                                        ? 'Withdrawal'
                                        : 'Wallet Deposit'
                            }
                        />

                    </View>

                    {/* Transaction Type */}
                    <View style={styles.typeBadge}>
                        <View style={styles.typeIcon}>
                            <TransactionIcon
                                size={16}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.typeText}>
                            Nzalo Financial Transaction
                        </Text>
                    </View>
                </View>

                {/* Bottom */}
                <View style={styles.bottom}>

                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleDone}
                    >
                        <Text style={styles.primaryButtonText}>
                            Done
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.secondaryButton}
                        onPress={handleViewWallet}
                    >
                        <Wallet
                            size={16}
                            color={colors.primary}
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


/* ------------------------------------------------ */
/* Detail Row */
/* ------------------------------------------------ */

function DetailRow({
    label,
    value,
    valueStyle,
}) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
                {label}
            </Text>

            <Text
                style={[
                    styles.detailValue,
                    valueStyle,
                ]}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
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
        paddingHorizontal: 14,
    },

    /* Header */

    header: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 7,
    },

    headerTitle: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.text,
    },

    /* Main */

    main: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 45,
    },

    successCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },

    successTitle: {
        fontFamily: fonts.bold,
        fontSize: 20,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 7,
    },

    description: {
        maxWidth: 290,
        fontFamily: fonts.regular,
        fontSize: 10,
        lineHeight: 15,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    /* Amount */

    amountContainer: {
        alignItems: 'center',
        marginTop: 28,
        marginBottom: 20,
    },

    amountLabel: {
        fontFamily: fonts.semibold,
        fontSize: 8,
        color: colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },

    amount: {
        fontFamily: fonts.bold,
        fontSize: 28,
        color: colors.primaryDark,
    },

    /* Details */

    detailsCard: {
        width: '100%',
        backgroundColor: colors.background,
        borderRadius: 14,
        paddingHorizontal: 13,
        paddingVertical: 7,
    },

    detailRow: {
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    detailLabel: {
        fontFamily: fonts.regular,
        fontSize: 9,
        color: colors.textSecondary,
    },

    detailValue: {
        maxWidth: '58%',
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: colors.text,
        textAlign: 'right',
    },

    successValue: {
        color: colors.primary,
    },

    /* Type */

    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },

    typeIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E5F4F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 7,
    },

    typeText: {
        fontFamily: fonts.regular,
        fontSize: 8.5,
        color: colors.textSecondary,
    },

    /* Bottom */

    bottom: {
        paddingBottom: 20,
        paddingTop: 10,
    },

    primaryButton: {
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 9,
    },

    buttonPressed: {
        opacity: 0.8,
    },

    primaryButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.white,
    },

    secondaryButton: {
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },

    secondaryButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        color: colors.primary,
        marginLeft: 6,
    },
});