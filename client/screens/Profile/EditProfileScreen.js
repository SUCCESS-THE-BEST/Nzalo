import { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    ScrollView,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';

import { ChevronLeft, MoreHorizontal, Camera, Lock } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_AVATAR = 'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg';

function FormField({ label, value, onChangeText, editable = true, locked = false, keyboardType }) {

    return (
        <View style={styles.field}>

            <Text style={styles.fieldLabel}>
                {label}
            </Text>

            <View style={[styles.inputWrapper, !editable && styles.inputWrapperLocked]}>

                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    editable={editable}
                    keyboardType={keyboardType}
                    placeholderTextColor={colors.textSecondary}
                />

                {locked && (
                    <Lock size={14} color={colors.textSecondary} />
                )}

            </View>

        </View>
    );
}

export default function EditProfileScreen({ navigation }) {

    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);

    // Track the original email so we know whether it actually changed
    const [originalEmail, setOriginalEmail] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {

        if (!user) {
            return;
        }

        try {

            setLoading(true);

            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, phone_number, profile_image_url, address')
                .eq('id', user.id)
                .single();

            if (error) {
                throw error;
            }

            setFullName(data.full_name || '');
            setPhone(data.phone_number || '');
            setAddress(data.address || '');
            setAvatarUrl(data.profile_image_url || DEFAULT_AVATAR);

            // Email lives on the auth user, not the profiles row
            setEmail(user.email || '');
            setOriginalEmail(user.email || '');

        } catch (error) {

            Alert.alert('Could not load profile', error.message);

        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {

        if (!fullName.trim()) {
            Alert.alert('Missing name', 'Full name cannot be empty.');
            return;
        }

        try {

            setSaving(true);

            // 1. Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    phone_number: phone.trim(),
                    address: address.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (profileError) {
                throw profileError;
            }

            // 2. Update auth email only if it changed — this triggers a
            // confirmation email from Supabase before it actually takes effect
            const trimmedEmail = email.trim().toLowerCase();

            if (trimmedEmail !== originalEmail.toLowerCase()) {

                const { error: emailError } = await supabase.auth.updateUser({
                    email: trimmedEmail,
                });

                if (emailError) {
                    throw emailError;
                }

                Alert.alert(
                    'Confirm your new email',
                    'We sent a confirmation link to your new email address. Your email will update once you confirm it.'
                );
            }

            navigation.goBack();

        } catch (error) {

            Alert.alert('Could not save changes', error.message);

        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >

                <View style={styles.topRow}>

                    <Pressable style={styles.circleButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={20} color={colors.text} />
                    </Pressable>

                    <Pressable style={styles.circleButton}>
                        <MoreHorizontal size={20} color={colors.text} />
                    </Pressable>

                </View>

                <Text style={styles.title}>
                    Edit Profile
                </Text>

                <Text style={styles.subtitle}>
                    Verify your identity for vault access
                </Text>

                <View style={styles.avatarSection}>

                    <View style={styles.avatarWrapper}>

                        <Image
                            source={{ uri: avatarUrl }}
                            style={styles.avatar}
                        />

                        <View style={styles.cameraBadge}>
                            <Camera size={13} color={colors.white} />
                        </View>

                    </View>

                    <Pressable>
                        <Text style={styles.changeAvatarText}>
                            Change Avatar Picture
                        </Text>
                    </Pressable>

                </View>

                <FormField
                    label="FULL NAME"
                    value={fullName}
                    onChangeText={setFullName}
                />

                <FormField
                    label="EMAIL ADDRESS"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <FormField
                    label="PHONE NUMBER"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <FormField
                    label="ID NUMBER"
                    value="940312 •••• 085"
                    editable={false}
                    locked
                />

                <FormField
                    label="RESIDENTIAL ADDRESS"
                    value={address}
                    onChangeText={setAddress}
                />

            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'SAVING...' : 'Save Changes'}
                    </Text>
                </Pressable>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        padding: 20,
        paddingTop: 45,
        paddingBottom: 20,
    },

    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    circleButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },

    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: colors.text,
        marginBottom: 6,
    },

    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 24,
    },

    avatarSection: {
        alignItems: 'center',
        marginBottom: 28,
    },

    avatarWrapper: {
        position: 'relative',
        marginBottom: 10,
    },

    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },

    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },

    changeAvatarText: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.primaryDark,
    },

    field: {
        marginBottom: 18,
    },

    fieldLabel: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: 8,
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        height: 50,
    },

    inputWrapperLocked: {
        backgroundColor: colors.background,
    },

    input: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.text,
    },

    footer: {
        padding: 20,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    saveButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },

    saveButtonDisabled: {
        opacity: 0.6,
    },

    saveButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },

});