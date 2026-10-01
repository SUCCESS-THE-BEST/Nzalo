import React, { useState, useRef } from "react";

import {
    View,
    ActivityIndicator,
    Alert,
    StyleSheet
} from "react-native";

import { WebView } from "react-native-webview";

import { supabase } from "../../config/supabase";

export default function PaystackCheckout({ route, navigation }) {

    const { authorizationUrl, reference, amount } = route.params;

    const [loading, setLoading] = useState(false);

    const [callbackDetected, setCallbackDetected] = useState(false);

    const hasHandledCallback = useRef(false);

    const verifyPayment = async () => {

        try {

            setLoading(true);

            const {
                data: { session }
            } = await supabase.auth.getSession();

            if (!session) {
                Alert.alert(
                    "Session expired",
                    "Please log in again."
                );

                return;
            }

            const response = await fetch(
                `http://192.168.137.1:3000/paystack/verify/${reference}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${session.access_token}`
                    }
                }
            );

            const result = await response.json();

            console.log(
                "Payment verification:",
                result
            );

            if (!response.ok || !result.success) {
                Alert.alert(
                    "Payment not completed",
                    result.message ||
                    "We could not verify your payment."
                );

                return;
            }

            Alert.alert(
                "Payment successful",
                `R${Number(amount).toFixed(2)} has been added to your wallet.`
            );

            navigation.navigate(
                "PaymentSuccess",
                {
                    type: "deposit",
                    amount: amount,
                    reference: reference
                }
            );

        } catch (error) {
            console.log(
                "Verification error:",
                error
            );
            Alert.alert(
                "Error",
                "Could not verify your payment."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleNavigation = (event) => {
        const url = event.url;

        console.log(
            "Paystack URL:",
            url
        );

        if (url.includes("/paystack/callback")) {

            if (hasHandledCallback.current) {
                return;
            }
            hasHandledCallback.current = true;

            setCallbackDetected(true);
            verifyPayment();
        }
    };

    return (

        <View style={styles.container}>

            {!callbackDetected && (
                <WebView
                    source={{
                        uri: authorizationUrl
                    }}
                    onNavigationStateChange={
                        handleNavigation
                    }
                    onLoadStart={() => {
                        setLoading(true);
                    }}
                    onLoadEnd={() => {
                        setLoading(false);
                    }}
                    startInLoadingState={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            )}

            {loading && (

                <View style={styles.loading}>
                    <ActivityIndicator
                        size="large"
                    />
                </View>
            )}

        </View>

    );
}


const styles = StyleSheet.create({

    container: {
        flex: 1
    },

    loading: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center"
    }

});