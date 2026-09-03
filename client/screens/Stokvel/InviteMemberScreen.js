import { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    TextInput,
    ScrollView,
    Share,
    Alert,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { ChevronLeft, Copy, Share2 } from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function InviteMemberScreen({ route, navigation }) {

    const { id } = route.params;

    const [inviteCode, setInviteCode] = useState('');
    const [phone, setPhone] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {

        async function loadCode() {
            const { data } = await supabase
                .from('stokvels')
                .select('invite_code')
                .eq('id', id)
                .single();

            setInviteCode(data?.invite_code || '');
        }

        loadCode();

    }, [id]);

    async function handleCopy() {
        await Clipboard.setStringAsync(inviteCode);
        Alert.alert('Copied', 'Invite code copied to clipboard.');
    }

    async function handleShare() {
        await Share.share({
            message: `Join my stokvel on Nzalo! Use invite code ${inviteCode} in the Explore tab.`,
        });
    }

    async function handleAddMember() {

        if (!phone.trim()) {
            Alert.alert('Enter a phone number', 'Please enter the member\'s phone number.');
            return;
        }

        try {

            setAdding(true);

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('phone_number', phone.trim())
                .maybeSingle();

            if (profileError) {
                throw profileError;
            }

            if (!profile) {
                Alert.alert('No account found', 'No user is registered with that phone number.');
                return;
            }

            const { error: insertError } = await supabase
                .from('stokvel_members')
                .insert({
                    stokvel_id: id,
                    user_id: profile.id,
                    role: 'member',
                    status: 'active',
                });

            if (insertError) {
                throw insertError;
            }

            Alert.alert('Member added', `${profile.full_name} has been added to the stokvel.`);
            setPhone('');

        } catch (error) {

            Alert.alert('Failed to add member', error.message);

        } finally {
            setAdding(false);
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                <ChevronLeft size={22} color={colors.text} />
            </Pressable>

            <Text style={styles.title}>
                Invite Members
            </Text>

            <Text style={styles.subtitle}>
                Grow your stokvel community
            </Text>

            <View style={styles.codeCard}>

                <Text style={styles.codeLabel}>
                    SHAREABLE GROUP CODE
                </Text>

                <View style={styles.codeRow}>

                    <Text style={styles.codeText}>
                        {inviteCode}
                    </Text>

                    <View style={styles.codeActions}>

                        <Pressable style={styles.iconButtonLight} onPress={handleCopy}>
                            <Copy size={18} color={colors.text} />
                        </Pressable>

                        <Pressable style={styles.iconButtonDark} onPress={handleShare}>
                            <Share2 size={18} color={colors.white} />
                        </Pressable>

                    </View>

                </View>

            </View>

            <View style={styles.qrCard}>

                <Text style={styles.qrTitle}>
                    Scan QR Code to Join
                </Text>

                {inviteCode ? (
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={inviteCode}
                            size={220}
                            color={colors.primaryDark}
                            backgroundColor={colors.white}
                        />
                    </View>
                ) : null}

                <Text style={styles.qrHint}>
                    Instruct new members to scan this code in their Explore tab.
                </Text>

            </View>

            <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
            </View>

            <Text style={styles.searchLabel}>
                Search by Phone Number
            </Text>

            <TextInput
                style={styles.input}
                placeholder="e.g. +27 82 123 4567"
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />

            <Pressable
                style={[styles.addButton, adding && styles.addButtonDisabled]}
                onPress={handleAddMember}
                disabled={adding}
            >
                <Text style={styles.addButtonText}>
                    {adding ? 'ADDING...' : 'Add Member'}
                </Text>
            </Pressable>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        padding: 20,
        paddingTop: 45,
        paddingBottom: 40,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    title: {
        fontFamily: fonts.bold,
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

    codeCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
    },

    codeLabel: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: 10,
    },

    codeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    codeText: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.primary,
    },

    codeActions: {
        flexDirection: 'row',
        gap: 10,
    },

    iconButtonLight: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

    iconButtonDark: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
    },

    qrCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },

    qrTitle: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.text,
        marginBottom: 20,
    },

    qrWrapper: {
        marginBottom: 20,
    },

    qrHint: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },

    dividerText: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        marginHorizontal: 12,
    },

    searchLabel: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
        marginBottom: 10,
    },

    input: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 30,
        padding: 15,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.text,
        marginBottom: 20,
    },

    addButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },

    addButtonDisabled: {
        opacity: 0.6,
    },

    addButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },

});