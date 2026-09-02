import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';

import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister() {

        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Missing information', 'Please complete all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password mismatch', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert(
                'Invalid password',
                'Password must be at least 6 characters.'
            );
            return;
        }

        try {

            setLoading(true);

            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: password,

                options: {
                    data: {
                        full_name: fullName,
                        phone: phone,
                    },
                },
            });

            if (error) {
                throw error;
            }

            // With email signup, Supabase sends a confirmation link by
            // default (unless "Confirm email" is turned off in your
            // Supabase project settings). Route accordingly:
            if (data?.session) {
                // AuthContext will automatically switch to MainNavigator
            } else {
                navigation.navigate('VerifyEmail', {
                    email: email,
                });
            }

        } catch (error) {

            Alert.alert(
                'Registration failed',
                error.message
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >

            <Text style={styles.title}>
                Create an account
            </Text>

            <Text style={styles.subtitle}>
                Join Nzalo and start managing your stokvel.
            </Text>

            <Text style={styles.label}>
                Full name
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
            />

            <Text style={styles.label}>
                Email
            </Text>

            <TextInput
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={styles.label}>
                Phone number
            </Text>

            <TextInput
                style={styles.input}
                placeholder="+27 82 123 4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>
                Password
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Text style={styles.label}>
                Confirm password
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <Pressable
                style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                ]}
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </Text>
            </Pressable>

            <View style={styles.loginContainer}>

                <Text style={styles.loginText}>
                    Already have an account?
                </Text>

                <Pressable
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginButton}>
                        Log in
                    </Text>
                </Pressable>

            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

    container: {
        flexGrow: 1,
        backgroundColor: colors.background,
        padding: 24,
        justifyContent: 'center',
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },

    subtitle: {
        color: colors.textSecondary,
        marginBottom: 32,
        fontSize: 15,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6,
    },

    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 18,
    },

    button: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 8,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    buttonText: {
        color: colors.white,
        fontWeight: '700',
    },

    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 5,
    },

    loginText: {
        color: colors.textSecondary,
    },

    loginButton: {
        color: colors.primary,
        fontWeight: '700',
    },

});