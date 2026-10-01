import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

import {supabase} from '../../config/supabase';
import {WebView} from 'react-native-webview'

import {
    ArrowLeft,
    CreditCard,
    Building2,
    Check,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function DepositFundsScreen({ navigation }) {
    const [amount, setAmount] = useState('1500.00');
    const [selectedSource, setSelectedSource] = useState('card');

    const handleAmountChange = (text) => {
        // Only allow numbers and one decimal point
        let cleaned = text.replace(/[^0-9.]/g, '');

        const decimalParts = cleaned.split('.');

        if (decimalParts.length > 2) {
            cleaned =
                decimalParts[0] +
                '.' +
                decimalParts.slice(1).join('');
        }

        // Limit decimal places to 2
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

    const handleDeposit = async () => {
        if (numericAmount <= 0) {
            Alert.alert("Invalid amount", "Please enter a valid amount.");
            return;
        }

        try {
            // Get the logged-in Supabase user
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            if (userError || !user) {
                Alert.alert(
                    "Login required",
                    "Please log in before making a deposit."
                );
                return;
            }

            // Get current Supabase session
            const {
                data: { session },
                error: sessionError
            } = await supabase.auth.getSession();

            if (sessionError || !session) {
                Alert.alert(
                    "Session expired",
                    "Please log in again."
                );
                return;
            }

            // Send amount to YOUR backend
            const response = await fetch(
                "http://192.168.137.1:3000/paystack/initialize",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        amount: numericAmount,
                        email: user.email
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                console.log("Paystack initialization error:", result);
                Alert.alert(
                    "Payment error",
                    result.message || "Unable to start payment."
                );
                
                return;
            }

            console.log("Paystack payment:", result);

            // Open Paystack checkout
            navigation.navigate("PaystackCheckout", {
                authorizationUrl: result.authorization_url,
                reference: result.reference,
                amount: numericAmount
            });

        } catch (error) {
            console.log("Deposit error:", error);
            Alert.alert(
                "Error",
                "Could not start the payment."
            );
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
                                Deposit Funds
                            </Text>

                            <Text style={styles.subtitle}>
                                Add money instantly to your wallet
                            </Text>
                        </View>
                    </View>

                    {/* Amount */}
                    <View style={styles.amountSection}>
                        <Text style={styles.amountLabel}>
                            ENTER AMOUNT (ZAR)
                        </Text>

                        <View style={styles.amountInputWrapper}>
                            <Text style={styles.currencySymbol}>
                                R
                            </Text>

                            <TextInput
                                value={amount}
                                onChangeText={handleAmountChange}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor={colors.textSecondary}
                                style={styles.amountInput}
                                selectTextOnFocus
                            />
                        </View>
                    </View>

                    {/* Source */}
                    <View style={styles.sourceSection}>
                        <Text style={styles.sectionLabel}>
                            SELECT SOURCE
                        </Text>

                        {/* Debit Card */}
                        <PaymentSource
                            icon={CreditCard}
                            title="Visa Debit Card"
                            subtitle="**** **** **** 4567"
                            selected={selectedSource === 'card'}
                            onPress={() => setSelectedSource('card')}
                        />

                        {/* Bank Account */}
                        <PaymentSource
                            icon={Building2}
                            title="Linked Bank Account"
                            subtitle="FNB ****8901"
                            selected={selectedSource === 'bank'}
                            onPress={() => setSelectedSource('bank')}
                        />
                    </View>

                    {/* Information */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Deposits via Debit Card are instantaneous.
                            No processing fees apply.
                        </Text>
                    </View>

                    {/* Bottom Button */}
                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.depositButton,
                                numericAmount <= 0 &&
                                    styles.depositButtonDisabled,
                                pressed &&
                                    numericAmount > 0 &&
                                    styles.buttonPressed,
                            ]}
                            onPress={handleDeposit}
                            disabled={numericAmount <= 0}
                        >
                            <Text style={styles.depositButtonText}>
                                Deposit R{formattedAmount}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


/* ------------------------------------------------ */
/* Payment Source */
/* ------------------------------------------------ */

function PaymentSource({
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
                styles.sourceCard,
                selected && styles.sourceCardSelected,
                pressed && styles.sourceCardPressed,
            ]}
        >
            <View
                style={[
                    styles.sourceIcon,
                    selected && styles.sourceIconSelected,
                ]}
            >
                <Icon
                    size={20}
                    color={
                        selected
                            ? colors.primary
                            : colors.textSecondary
                    }
                />
            </View>

            <View style={styles.sourceText}>
                <Text style={styles.sourceTitle}>
                    {title}
                </Text>

                <Text style={styles.sourceSubtitle}>
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
        marginBottom: 35,
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

    /* Amount */

    amountSection: {
        alignItems: 'center',
        marginBottom: 32,
    },

    amountLabel: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        color: colors.textSecondary,
        marginBottom: 8,
    },

    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    currencySymbol: {
        fontFamily: fonts.bold,
        fontSize: 38,
        color: colors.text,
    },

    amountInput: {
        minWidth: 170,
        padding: 0,
        marginLeft: 2,
        fontFamily: fonts.bold,
        fontSize: 38,
        color: colors.text,
        textAlign: 'left',
    },

    /* Source */

    sourceSection: {
        marginBottom: 12,
    },

    sectionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        color: colors.textSecondary,
        marginBottom: 8,
    },

    sourceCard: {
        minHeight: 64,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 8,
    },

    sourceCardSelected: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    },

    sourceCardPressed: {
        opacity: 0.7,
    },

    sourceIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        marginRight: 10,
    },

    sourceIconSelected: {
        backgroundColor: '#E6F4F1',
    },

    sourceText: {
        flex: 1,
    },

    sourceTitle: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.text,
        marginBottom: 3,
    },

    sourceSubtitle: {
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

    /* Information */

    infoBox: {
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginTop: 4,
    },

    infoText: {
        fontFamily: fonts.regular,
        fontSize: 9,
        lineHeight: 14,
        color: colors.textSecondary,
    },

    /* Button */

    buttonContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingTop: 35,
    },

    depositButton: {
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
    },

    depositButtonDisabled: {
        opacity: 0.45,
    },

    buttonPressed: {
        opacity: 0.8,
    },

    depositButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.white,
    },
});