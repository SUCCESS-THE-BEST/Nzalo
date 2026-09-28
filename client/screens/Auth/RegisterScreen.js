import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                    Create an account
                </Text>

                <Text style={styles.subtitle}>
                    Join Nzalo and start managing your stokvel.
                </Text>

                <View style={styles.tabs}>
                    <Pressable
                        style={styles.tab}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.tabText}>
                            Log in
                        </Text>
                    </Pressable>

                    <View style={[styles.tab, styles.tabActive]}>
                        <Text style={[styles.tabText, styles.tabTextActive]}>
                            Create account
                        </Text>
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <Ionicons
                        name="person-outline"
                        size={20}
                        color={colors.textSecondary}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor={colors.textSecondary}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                    />
                </View>

                <View style={styles.inputRow}>
                    <Ionicons
                        name="mail-outline"
                        size={20}
                        color={colors.textSecondary}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.inputRow}>
                    <Ionicons
                        name="call-outline"
                        size={20}
                        color={colors.textSecondary}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="+27 82 123 4567"
                        placeholderTextColor={colors.textSecondary}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputRow}>
                    <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={colors.textSecondary}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor={colors.textSecondary}
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

                <View style={styles.inputRow}>
                    <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={colors.textSecondary}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor={colors.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                    />
                </View>

                <Pressable
                    style={[
                        styles.button,
                        loading && styles.buttonDisabled,
                    ]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        start={{ x: 0.0, y: 0.5 }}
                        end={{ x: 1.0, y: 0.5 }}
                        style={styles.gradientBackground}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </Text>
                    </LinearGradient>
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

    button: {
        maxWidth: '100%',
        backgroundColor: colors.primary,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
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