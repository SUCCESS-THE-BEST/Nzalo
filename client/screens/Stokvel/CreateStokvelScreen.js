import { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';

import { ChevronLeft, ChevronDown } from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { useAuth } from '../../context/AuthContext';

const PAYOUT_CYCLES = ['Monthly', 'Weekly'];

export default function CreateStokvelScreen({ navigation }) {

    const { user } = useAuth();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [monthlyPay, setMonthlyPay] = useState('');
    const [maxMembers, setMaxMembers] = useState('');
    const [payoutCycle, setPayoutCycle] = useState('Monthly');
    const [cycleOpen, setCycleOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleCreate() {

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();

        const amount = Number(
            monthlyPay.replace(/[^0-9.]/g, '')
        );

        const members = Number(maxMembers);

        /* ----------------------------- */
        /* VALIDATION */
        /* ----------------------------- */

        if (!trimmedName || !monthlyPay || !maxMembers) {
            Alert.alert(
                'Missing information',
                'Please fill in the required fields.'
            );
            return;
        }

        if (!user) {
            Alert.alert(
                'Not signed in',
                'Please sign in before creating a stokvel.'
            );
            return;
        }

        if (amount <= 0) {
            Alert.alert(
                'Invalid contribution',
                'Contribution amount must be greater than R0.'
            );
            return;
        }

        if (members < 2) {
            Alert.alert(
                'Invalid member limit',
                'A stokvel must allow at least 2 members.'
            );
            return;
        }

        if (!Number.isInteger(members)) {
            Alert.alert(
                'Invalid member limit',
                'Maximum members must be a whole number.'
            );
            return;
        }

        try {

            setLoading(true);

            /* ----------------------------- */
            /* CREATE STOKVEL */
            /* ----------------------------- */

            const { data, error } = await supabase
                .from('stokvels')
                .insert({
                    name: trimmedName,
                    description: trimmedDescription || null,
                    contribution_amount: amount,
                    contribution_frequency:
                        payoutCycle.toLowerCase(),
                    max_members: members,
                    creator_id: user.id,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('Created stokvel:', data);

            /* ----------------------------- */
            /* SUCCESS */
            /* ----------------------------- */

            Alert.alert(
                'Stokvel Created',
                `${trimmedName} has been created successfully.`,
                [
                    {
                        text: 'View Stokvel',
                        onPress: () => {
                            navigation.replace(
                                'StokvelDetail',
                                {
                                    id: data.id,
                                }
                            );
                        },
                    },
                ]
            );

        } catch (error) {

            console.log(
                'Create stokvel error:',
                error
            );

            Alert.alert(
                'Failed to create stokvel',
                error.message ||
                    'Something went wrong while creating the stokvel.'
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >

            <Pressable
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <ChevronLeft
                    size={22}
                    color={colors.text}
                />
            </Pressable>

            <Text style={styles.title}>
                Create a Stokvel
            </Text>

            <Text style={styles.subtitle}>
                Establish a brand new digitized savings group
            </Text>

            {/* NAME */}

            <Text style={styles.label}>
                STOKVEL GROUP NAME
            </Text>

            <TextInput
                style={styles.input}
                placeholder="e.g. Masakhane Savings"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                maxLength={60}
            />

            {/* DESCRIPTION */}

            <Text style={styles.label}>
                DESCRIPTION
            </Text>

            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this stokvel for?"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={250}
            />

            {/* AMOUNT + MEMBERS */}

            <View style={styles.row}>

                <View style={styles.rowItem}>
                    <Text style={styles.label}>
                        CONTRIBUTION
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="2500"
                        placeholderTextColor={
                            colors.textSecondary
                        }
                        value={monthlyPay}
                        onChangeText={setMonthlyPay}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.rowItem}>
                    <Text style={styles.label}>
                        MAX MEMBERS
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="12"
                        placeholderTextColor={
                            colors.textSecondary
                        }
                        value={maxMembers}
                        onChangeText={setMaxMembers}
                        keyboardType="numeric"
                    />
                </View>

            </View>

            {/* PAYOUT CYCLE */}

            <Text style={styles.label}>
                CONTRIBUTION FREQUENCY
            </Text>

            <Pressable
                style={styles.dropdown}
                onPress={() =>
                    setCycleOpen(!cycleOpen)
                }
            >
                <Text style={styles.dropdownText}>
                    {payoutCycle}
                </Text>

                <ChevronDown
                    size={18}
                    color={colors.textSecondary}
                />
            </Pressable>

            {cycleOpen && (
                <View style={styles.dropdownMenu}>

                    {PAYOUT_CYCLES.map((cycle) => (
                        <Pressable
                            key={cycle}
                            style={styles.dropdownOption}
                            onPress={() => {
                                setPayoutCycle(cycle);
                                setCycleOpen(false);
                            }}
                        >
                            <Text
                                style={
                                    styles.dropdownOptionText
                                }
                            >
                                {cycle}
                            </Text>
                        </Pressable>
                    ))}

                </View>
            )}

            {/* CREATE */}

            <Pressable
                style={[
                    styles.createButton,
                    loading &&
                        styles.createButtonDisabled,
                ]}
                onPress={handleCreate}
                disabled={loading}
            >

                {loading ? (
                    <ActivityIndicator
                        color={colors.white}
                    />
                ) : (
                    <Text
                        style={styles.createButtonText}
                    >
                        Create Group
                    </Text>
                )}

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
        marginBottom: 28,
    },

    label: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: 8,
    },

    input: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 15,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.text,
        marginBottom: 18,
    },

    textArea: {
        height: 90,
        paddingTop: 15,
    },

    row: {
        flexDirection: 'row',
        gap: 14,
    },

    rowItem: {
        flex: 1,
    },

    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 15,
        marginBottom: 4,
    },

    dropdownText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.text,
    },

    dropdownMenu: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        marginTop: 6,
        marginBottom: 18,
        overflow: 'hidden',
    },

    dropdownOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    dropdownOptionText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.text,
    },

    createButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        minHeight: 52,
    },

    createButtonDisabled: {
        opacity: 0.6,
    },

    createButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },

});