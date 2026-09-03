import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert } from 'react-native';
import { ChevronLeft, Pencil, ChevronRight, Lock, LogOut } from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function GroupSettingsScreen({ route, navigation }) {

    const { id } = route.params;
    const { user } = useAuth();

    const [stokvel, setStokvel] = useState(null);

    useEffect(() => {

        async function load() {
            const { data } = await supabase
                .from('stokvels')
                .select('*')
                .eq('id', id)
                .single();

            setStokvel(data);
        }

        load();

    }, [id]);

    async function handleArchive() {

        Alert.alert(
            'Archive Group',
            'This will archive the stokvel for all members. This can be undone by an admin later.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Archive',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('stokvels')
                            .update({ status: 'archived' })
                            .eq('id', id);

                        if (error) {
                            Alert.alert('Failed to archive', error.message);
                            return;
                        }

                        navigation.navigate('MyStokvelsMain');
                    },
                },
            ]
        );
    }

    async function handleLeave() {

        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this stokvel?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('stokvel_members')
                            .update({ status: 'left' })
                            .eq('stokvel_id', id)
                            .eq('user_id', user.id);

                        if (error) {
                            Alert.alert('Failed to leave', error.message);
                            return;
                        }

                        navigation.navigate('MyStokvelsMain');
                    },
                },
            ]
        );
    }

    if (!stokvel) {
        return <View style={styles.container} />;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                <ChevronLeft size={22} color={colors.text} />
            </Pressable>

            <Text style={styles.title}>
                Group Settings
            </Text>

            <Text style={styles.subtitle}>
                Manage {stokvel.name} stokvel
            </Text>

            <Text style={styles.sectionLabel}>
                GROUP INFO
            </Text>

            <View style={styles.sectionCard}>

                <View style={styles.fieldRow}>
                    <View style={styles.fieldText}>
                        <Text style={styles.fieldLabel}>
                            Group Name
                        </Text>
                        <Text style={styles.fieldValue}>
                            {stokvel.name}
                        </Text>
                    </View>
                    <Pencil size={16} color={colors.textSecondary} />
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                    <View style={styles.fieldText}>
                        <Text style={styles.fieldLabel}>
                            Description
                        </Text>
                        <Text style={styles.fieldValue} numberOfLines={1}>
                            {stokvel.description || 'No description yet'}
                        </Text>
                    </View>
                    <Pencil size={16} color={colors.textSecondary} />
                </View>

            </View>

            <Text style={styles.sectionLabel}>
                PAYOUT SETTINGS
            </Text>

            <View style={styles.sectionCard}>

                <View style={styles.fieldRow}>
                    <View style={styles.fieldText}>
                        <Text style={styles.fieldLabel}>
                            Payout Cycle
                        </Text>
                        <Text style={styles.fieldValue}>
                            {stokvel.contribution_frequency === 'weekly' ? 'Weekly Rotation' : 'Monthly Rotation'}
                        </Text>
                    </View>
                    <ChevronRight size={16} color={colors.textSecondary} />
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                    <View style={styles.fieldText}>
                        <Text style={styles.fieldLabel}>
                            Maximum Members
                        </Text>
                        <Text style={styles.fieldValue}>
                            {stokvel.max_members} Members limit
                        </Text>
                    </View>
                    <Lock size={16} color={colors.textSecondary} />
                </View>

            </View>

            <Text style={styles.sectionLabel}>
                ADMINISTRATION
            </Text>

            <View style={styles.sectionCard}>

                <Pressable style={styles.fieldRow}>
                    <Text style={styles.fieldValue}>
                        Transfer Chairperson Role
                    </Text>
                    <ChevronRight size={16} color={colors.textSecondary} />
                </Pressable>

                <View style={styles.divider} />

                <Pressable style={styles.fieldRow} onPress={handleArchive}>
                    <Text style={styles.destructiveText}>
                        Archive Group
                    </Text>
                    <Text style={styles.destructiveTag}>
                        DESTRUCTIVE
                    </Text>
                </Pressable>

                <View style={styles.divider} />

                <Pressable style={styles.fieldRow} onPress={handleLeave}>
                    <Text style={styles.destructiveText}>
                        Leave Group
                    </Text>
                    <LogOut size={16} color={colors.danger} />
                </Pressable>

            </View>

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
        marginBottom: 28,
    },

    sectionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: 10,
    },

    sectionCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 24,
    },

    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },

    fieldText: {
        flex: 1,
        marginRight: 10,
    },

    fieldLabel: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 4,
    },

    fieldValue: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
    },

    destructiveText: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.danger,
    },

    destructiveTag: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        color: colors.danger,
    },

});