import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    Alert,
} from 'react-native';

import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';

export default function VerifyEmailScreen({ route, navigation }) {

    const { email } = route.params;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleVerify() {

        if (code.length !== 6) {
            Alert.alert(
                'Invalid code',
                'Please enter the 6-digit verification code.'
            );

            return;
        }

        try {

            setLoading(true);

            const { error } = await supabase.auth.verifyOtp({
                email: email,
                token: code,
                type: 'signup',
            });

            if (error) {
                throw error;
            }

            navigation.replace('Main');

        } catch (error) {

            Alert.alert(
                'Verification failed',
                error.message
            );

        } finally {
            setLoading(false);
        }
    }

    async function resendCode() {

        try {

            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                throw error;
            }

            Alert.alert(
                'Code sent',
                'A new verification code has been sent.'
            );

        } catch (error) {

            Alert.alert(
                'Unable to resend',
                error.message
            );

        }
    }

    return (
        <View style={styles.container}>

            <View>

                <Text style={styles.title}>
                    Verify your email
                </Text>

                <Text style={styles.subtitle}>
                    We've sent a verification code to
                </Text>

                <Text style={styles.email}>
                    {email}
                </Text>

                <TextInput
                    style={styles.codeInput}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                    textAlign="center"
                />

                <Pressable
                    onPress={resendCode}
                >
                    <Text style={styles.resend}>
                        Didn't receive a code? Resend code
                    </Text>
                </Pressable>

            </View>

            <Pressable
                style={styles.button}
                onPress={handleVerify}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'VERIFYING...' : 'VERIFY'}
                </Text>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 24,
        justifyContent: 'space-between',
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginTop: 80,
        marginBottom: 10,
    },

    subtitle: {
        color: colors.textSecondary,
        fontSize: 15,
    },

    email: {
        fontWeight: '700',
        color: colors.text,
        marginTop: 5,
        marginBottom: 35,
    },

    codeInput: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingVertical: 18,
        fontSize: 24,
        letterSpacing: 12,
    },

    resend: {
        color: colors.primary,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 20,
    },

    button: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 20,
    },

    buttonText: {
        color: colors.white,
        fontWeight: '700',
    },

});