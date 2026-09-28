import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    Alert,
    ScrollView,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                horizontal={false}
                alwaysBounceHorizontal={false}
            >

                <Image
                    source={require('../../assets/nzalo-logo-green.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.title}>
                    Welcome back
                </Text>

                <Text style={styles.subtitle}>
                    Log in securely to access your community savings.
                </Text>

                <View style={styles.tabs}>
                    <View style={[styles.tab, styles.tabActive]}>
                        <Text style={[styles.tabText, styles.tabTextActive]}>
                            Log in
                        </Text>
                    </View>

                    <Pressable
                        style={styles.tab}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.tabText}>
                            Create account
                        </Text>
                    </Pressable>
                </View>

                <Text style={styles.sectionTitle}>
                    Log in to continue
                </Text>

                <Text style={styles.sectionSubtitle}>
                    Access your stokvel, contributions and payouts.
                </Text>

                <View style={styles.inputRow}>
                    <Ionicons
                        name="mail-outline"
                        size={20}
                        color={colors.textSecondary}
                    />
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
                </View>

                <View style={styles.inputRow}>
                    <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={colors.textSecondary}
                    />
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                    />
                    <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={10}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color={colors.textSecondary}
                        />
                    </Pressable>
                </View>

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
                    <Text style={styles.registerText}>
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

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.background,
    },

    container: {
        flexGrow: 1,
        width: '100%',
        padding: 24,
        justifyContent: 'center',
    },

    logo: {
        width: 120,
        height: 60,
        alignSelf: 'center',
        marginBottom: 24,
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },

    subtitle: {
        color: colors.textSecondary,
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 28,
    },

    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 9,
        padding: 2,
        marginBottom: 28,
    },

    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9,
        alignItems: 'center',
    },

    tabActive: {
        backgroundColor: colors.primaryDark,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },

    tabText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },

    tabTextActive: {
        color: colors.white,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },

    sectionSubtitle: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 4,
        marginBottom: 18,
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 9,
        paddingHorizontal: 16,
        marginBottom: 14,
        gap: 12,
    },

    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: colors.text,
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

    buttonDisabled: {
        opacity: 0.6,
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

    registerText: {
        color: colors.textSecondary,
    },

    register: {
        color: colors.primary,
        fontWeight: '700',
    },
});