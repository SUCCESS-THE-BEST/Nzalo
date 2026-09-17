import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';

import { WebView } from 'react-native-webview';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const BACKEND_URL = 'http://192.168.137.1:3000';
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 60;

export default function PaystackContributionCheckoutScreen({
    navigation,
    route,
}) {

    const params = route?.params || {};

    const authorizationUrl = params.authorizationUrl;
    const reference = params.reference;
    const amount = params.amount;
    const stokvelId = params.stokvelId;
    const stokvelName = params.stokvelName;

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    // Refs so the interval callback always sees current state
    // without needing to be recreated on every render.
    const verifiedRef = useRef(false);
    const attemptsRef = useRef(0);
    const pollTimerRef = useRef(null);

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    const verifyPayment = async ({ silent = false } = {}) => {
        if (verifiedRef.current) {
            return;
        }
        if (!reference) {
            stopPolling();
            navigation.replace('PaymentFailed', {
                type: 'contribution',
                amount: amount,
                stokvelName: stokvelName,
                reason: 'missing_reference',
            });
            return;
        }
        try {
            if (!silent) {
                setVerifying(true);
            }
            
            const response = await fetch(
                `${BACKEND_URL}/api/paystack-contribution/verify/${encodeURIComponent(reference)}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const data = await response.json();
            // Paid — stop everything and move on.
            if (response.ok && data.success && data.status === 'paid') {
                verifiedRef.current = true;
                stopPolling();
                setVerifying(true);

                navigation.replace('PaymentSuccess', {
                    type: 'contribution',
                    amount: amount,
                    stokvelId: stokvelId,
                    stokvelName: stokvelName,
                    reference: reference,
                });

                return;
            }

            // Explicit terminal failure — stop and report it.
            if (data.status === 'failed' || data.status === 'amount_mismatch') {
                verifiedRef.current = true;
                stopPolling();
                setVerifying(true);

                navigation.replace('PaymentFailed', {
                    type: 'contribution',
                    amount: amount,
                    stokvelName: stokvelName,
                    reason: data.status,
                });

                return;
            }

            // Anything else means "not finished yet" — keep polling silently.
            if (!silent) {
                setVerifying(false);
            }

        } catch (error) {
        
            // Network hiccup during a silent poll — don't bail out,
            // just let the next poll attempt try again.
            if (!silent) {
                setVerifying(false);
            }
        }
    };
    // Automatic background polling — this is what removes the
    // need to tap anything. Starts as soon as we have a reference
    // and stops on success, terminal failure, or timeout.
    useEffect(() => {

        if (!reference) {
            return;
        }

        pollTimerRef.current = setInterval(async () => {

            attemptsRef.current += 1;

            if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
                stopPolling();

                if (!verifiedRef.current) {
                    navigation.replace('PaymentFailed', {
                        type: 'contribution',
                        amount: amount,
                        stokvelName: stokvelName,
                        reason: 'timeout',
                    });
                }

                return;
            }

            await verifyPayment({ silent: true });

        }, POLL_INTERVAL_MS);

        return () => stopPolling();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reference]);

    // Still useful as an instant trigger the moment a redirect
    // does happen — polling will catch it a few seconds later
    // either way, but this makes success feel immediate when
    // Paystack does redirect promptly.
    const handleShouldStartLoad = (request) => {

        const url = request?.url;

        if (!url) {
            return true;
        }

        if (verifiedRef.current) {
            return true;
        }

        const looksLikeCallback =
            url.includes('payment-complete') ||
            url.includes('standard.paystack.co/close') ||
            url.includes('callback');

        const hasReference = url.includes('reference=') || url.includes('trxref=');

        if (looksLikeCallback && hasReference) {
            verifyPayment();
            return false; 
        }

        return true;
    };


    // No Paystack URL
    if (!authorizationUrl) {

        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Payment Error</Text>
                <Text style={styles.errorText}>
                    Paystack checkout URL was not provided.
                </Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>

            {loading && !verifying && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>
                        Loading secure payment...
                    </Text>
                </View>
            )}

            {verifying && (
                <View style={styles.verifyingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.verifyingTitle}>
                        Verifying Payment
                    </Text>
                    <Text style={styles.verifyingText}>
                        Please wait while we confirm your contribution.
                    </Text>
                </View>
            )}

            <WebView
                source={{
                    uri: String(authorizationUrl),
                }}
                onShouldStartLoadWithRequest={handleShouldStartLoad}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                onError={(event) => {
                    console.error('Paystack WebView error:', event?.nativeEvent);
                    setLoading(false);
                }}
            />

        </View>
    );
}


const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.white,
    },

    loadingOverlay: {
        position: 'absolute',
        zIndex: 10,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        marginTop: 12,
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },

    verifyingOverlay: {
        position: 'absolute',
        zIndex: 20,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    verifyingTitle: {
        marginTop: 15,
        fontFamily: fonts.bold,
        fontSize: 20,
        color: colors.text,
    },

    verifyingText: {
        marginTop: 8,
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    errorTitle: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.text,
        marginBottom: 10,
    },

    errorText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },

});