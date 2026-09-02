import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    Alert,
} from 'react-native';

import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {

        if (!email || !password) {

            Alert.alert(
                'Missing information',
                'Please enter your email and password.'
            );

            return;
        }

        try {

            setLoading(true);

            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) {
                throw error;
            }

            // AuthContext handles navigation.

        } catch (error) {

            Alert.alert(
                'Login failed',
                error.message
            );

        } finally {
            setLoading(false);
        }
    }
    
    return (
        <View style={styles.container}>

            <Text style={styles.title}>
                Welcome back
            </Text>

            <Text style={styles.subtitle}>
                Log in securely to access your community savings.
            </Text>

            <TextInput
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <TextInput
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Pressable
                onPress={() => navigation.navigate('ResetPassword')}
            >
                <Text style={styles.forgot}>
                    Forgot password?
                </Text>
            </Pressable>

            <Pressable
                style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
            >
                <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0.0, y: 0.5 }}
                    end={{ x: 1.0, y: 0.5 }}
                    style={styles.gradientBackground}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'LOGGING IN...' : 'LOGIN'}
                    </Text>
                </LinearGradient>

            </Pressable>

            <View style={styles.registerContainer}>
                <Text>
                    Don't have an account?
                </Text>

                <Pressable
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.register}>
                        Create account
                    </Text>
                </Pressable>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    },

    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 30,
        padding: 15,
        marginBottom: 14,
        fontSize: 16,
    },

    forgot: {
        color: colors.primary,
        fontWeight: '600',
        textAlign: 'right',
        marginBottom: 24,
    },

    button: {
        maxWidth: '100%',
        backgroundColor: colors.primary,
        borderRadius: 30,
        alignItems: 'center',
    },

    gradientBackground: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 30,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    
    },

    buttonText: {
        color: colors.white,
        fontWeight: '700',
    },

    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 5,
    },

    register: {
        color: colors.primary,
        fontWeight: '700',
    },
});