import React, {
    useCallback,
    useState,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../../config/supabase';

import {
    ArrowLeft,
    Download,
    Upload,
    CreditCard,
    QrCode,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    Users2,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';


export default function WalletScreen({ navigation }) {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState([]);

    const fetchWallet = useCallback(async () => {
        try {
            const {
                data: {
                    user,
                },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error('User error:', userError);
                return;
            }

            // Get wallet
            const {
                data: walletData,
                error: walletError,
            } = await supabase.rpc('get_my_wallet');

            if (walletError) {
                console.error('Wallet error:', walletError);
                return;
            }

            if (walletData && walletData.length > 0) {
                setBalance(Number(walletData[0].balance));
            }

            // Get recent transactions
            const {
                data: transactionData,
                error: transactionError,
            } = await supabase
                .from('wallet_transactions')
                .select(`
                    id,
                    transaction_type,
                    amount,
                    status,
                    reference,
                    description,
                    created_at,
                    stokvel_id
                `)
                .eq('user_id', user.id)
                .order('created_at', {
                    ascending: false,
                })
                .limit(5);

            if (transactionError) {
                console.error(
                    'Transaction error:',
                    transactionError
                );
                return;
            }

            setTransactions(transactionData || []);

        } catch (error) {
            console.error(
                'Unexpected wallet error:',
                error
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchWallet();
        }, [fetchWallet])
    );
    

    const handleRefresh = () => {
        setRefreshing(true);
        fetchWallet();
    };

    const formatCurrency = (amount) => {
        return `R${amount.toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const handleDeposit = () => {
        navigation.navigate('DepositFunds');
    };

    const handleWithdraw = () => {
        navigation.navigate('WithdrawFunds');
    };

    const handleContribution = () => {
        navigation.navigate('PayContribution');
    };

    

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing}
                        onRefresh={handleRefresh}   
                    />
                }
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

                    <View style={styles.headerText}>
                        <Text style={styles.title}>
                            My Wallet
                        </Text>

                        <Text style={styles.subtitle}>
                            Digitalized Financial Treasury
                        </Text>
                    </View>
                </View>

                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceTopRow}>
                        <Text style={styles.balanceLabel}>
                            PERSONAL SAVINGS VAULT
                        </Text>

                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>
                                ACTIVE
                            </Text>
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator
                            size="small"
                            color={colors.white}
                            style={styles.balanceLoader}
                        />
                    ) : (
                        <Text style={styles.balance}>
                            {formatCurrency(balance)}
                        </Text>
                    )}

                    <Text style={styles.balanceDescription}>
                        Available for withdrawal or transfer
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsCard}>
                    <WalletAction
                        icon={Download}
                        label="Deposit"
                        onPress={handleDeposit}
                    />

                    <WalletAction
                        icon={Upload}
                        label="Withdraw"
                        onPress={handleWithdraw}
                    />

                    <WalletAction
                        icon={CreditCard}
                        label="Contribute"
                        onPress={handleContribution}
                    />

                    <WalletAction
                        icon={QrCode}
                        label="Receive"
                        onPress={() => {}}
                    />
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Recent Transactions
                    </Text>

                    <Pressable
                        onPress={() => {
                            // Full transaction history will be added later.
                        }}
                    >
                        <Text style={styles.seeAll}>
                            See All
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.transactionsContainer}>
                    {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyTransactions}>
                            <View style={styles.emptyIcon}>
                                <Wallet
                                    size={22}
                                    color={colors.textSecondary}
                                    strokeWidth={1.8}
                                />
                            </View>

                            <Text style={styles.emptyTitle}>
                                No transactions yet
                            </Text>

                            <Text style={styles.emptyText}>
                                Your deposits, withdrawals and
                                stokvel contributions will appear
                                here.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}


/* ------------------------------------------------ */
/* Wallet Action */
/* ------------------------------------------------ */

function WalletAction({ icon: Icon, label, onPress }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.action,
                pressed && styles.actionPressed,
            ]}
            onPress={onPress}
        >
            <View style={styles.actionIcon}>
                <Icon
                    size={19}
                    color={colors.primary}
                    strokeWidth={2}
                />
            </View>

            <Text style={styles.actionLabel}>
                {label}
            </Text>
        </Pressable>
    );
}

function formatTransactionType(type) {
    switch (type) {
        case 'deposit':
            return 'Wallet Deposit';

        case 'withdrawal':
            return 'Wallet Withdrawal';

        case 'contribution':
            return 'Stokvel Contribution';

        case 'refund':
            return 'Refund';

        case 'adjustment':
            return 'Wallet Adjustment';

        default:
            return 'Wallet Transaction';
    }
}

/* ------------------------------------------------ */
/* Transaction */
/* ------------------------------------------------ */

function TransactionItem({ transaction }) {
    const isPositive =
        transaction.transaction_type === 'deposit' ||
        transaction.transaction_type === 'refund';

    let Icon = ArrowDownLeft;

    if (
        transaction.transaction_type === 'withdrawal'
    ) {
        Icon = ArrowUpRight;
    }

    if (
        transaction.transaction_type === 'contribution'
    ) {
        Icon = CreditCard;
    }

    const formattedAmount = Number(
        transaction.amount
    ).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const amountText = isPositive
        ? `+R${formattedAmount}`
        : `-R${formattedAmount}`;

    const title =
        transaction.description ||
        formatTransactionType(
            transaction.transaction_type
        );

    const date = new Date(
        transaction.created_at
    ).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <View style={styles.transaction}>
            <View style={styles.transactionLeft}>
                <View
                    style={[
                        styles.transactionIcon,
                        isPositive
                            ? styles.depositIcon
                            : transaction.transaction_type ===
                              'contribution'
                                ? styles.contributionIcon
                                : styles.sentIcon,
                    ]}
                >
                    <Icon
                        size={17}
                        color={
                            isPositive
                                ? colors.primary
                                : colors.textSecondary
                        }
                    />
                </View>

                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                        {title}
                    </Text>

                    <Text style={styles.transactionDate}>
                        {date}
                    </Text>
                </View>
            </View>

            <Text
                style={[
                    styles.transactionAmount,
                    isPositive &&
                        styles.positiveAmount,
                ]}
            >
                {amountText}
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
        backgroundColor: colors.background,
    },

    container: {
        flex: 1,
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
        marginBottom: 20,
    },

    backButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },

    headerText: {
        marginLeft: 0,
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
        backgroundColor: colors.primaryDark,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 17,
        marginBottom: 12,
    },

    balanceTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    balanceLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: 'rgba(255,255,255,0.65)',
        letterSpacing: 0.4,
    },

    activeBadge: {
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    activeText: {
        fontFamily: fonts.bold,
        fontSize: 8,
        color: colors.white,
    },

    balance: {
        fontFamily: fonts.bold,
        fontSize: 29,
        color: colors.white,
        marginTop: 13,
        marginBottom: 2,
    },

    balanceDescription: {
        fontFamily: fonts.regular,
        fontSize: 9,
        color: 'rgba(255,255,255,0.75)',
    },

    /* Actions */

    actionsCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 6,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 18,
    },

    action: {
        alignItems: 'center',
        width: '25%',
        paddingVertical: 2,
    },

    actionPressed: {
        opacity: 0.6,
    },

    actionIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },

    actionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: colors.text,
    },

    /* Section */

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 9,
    },

    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 14,
        color: colors.text,
    },

    seeAll: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        color: colors.primary,
    },

    /* Transactions */

    transactionsContainer: {
        gap: 8,
    },

    transaction: {
        backgroundColor: colors.white,
        borderRadius: 13,
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    transactionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    depositIcon: {
        backgroundColor: '#E5F5F1',
    },

    sentIcon: {
        backgroundColor: '#FFF0D9',
    },

    contributionIcon: {
        backgroundColor: '#E8F3F2',
    },

    transactionInfo: {
        flex: 1,
    },

    transactionTitle: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.text,
        marginBottom: 2,
    },

    transactionDate: {
        fontFamily: fonts.regular,
        fontSize: 9,
        color: colors.textSecondary,
    },

    transactionAmount: {
        fontFamily: fonts.bold,
        fontSize: 11,
        color: colors.text,
    },

    positiveAmount: {
        color: colors.primary,
    },

    emptyTransactions: {
        backgroundColor: colors.white,
        borderRadius: 13,
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: 'center',
    },

    emptyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    emptyTitle: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.text,
        marginBottom: 4,
    },

    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 16,
        maxWidth: 260,
    },

    balanceLoader: {
        alignSelf: 'flex-start',
        marginTop: 18,
        marginBottom: 12,
    },
});