import {
    StyleSheet,
    Text,
    View,
    Pressable,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';

import { CreditCard, Users2, LucideBell, HandCoins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';

import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import ProfileSidebar from '../../components/ProfileSidebar';

const DEFAULT_AVATAR = 'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function HomeScreen() {

    const navigation = useNavigation();
    const { user } = useAuth();

    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stokvels, setStokvels] = useState([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [monthTotal, setMonthTotal] = useState(0);

    async function loadDashboard() {

        if (!user) {
            return;
        }

        try {

            setLoading(true);

            // 1. Profile info (name, phone, avatar)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, phone_number, profile_image_url')
                .eq('id', user.id)
                .single();

            if (profileError) {
                throw profileError;
            }

            setProfile(profileData);

            // 2. Stokvels this user belongs to (active memberships)
            const { data: memberships, error: membershipError } = await supabase
                .from('stokvel_members')
                .select(`
                    stokvel_id,
                    role,
                    status,
                    stokvels (
                        id,
                        name,
                        contribution_amount,
                        contribution_frequency,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'active');

            if (membershipError) {
                throw membershipError;
            }

            const stokvelIds = memberships.map((m) => m.stokvel_id);

            if (stokvelIds.length === 0) {
                setStokvels([]);
                setTotalBalance(0);
                setMonthTotal(0);
                return;
            }

            // 3. Member counts for each stokvel
            const { data: allMembers, error: membersError } = await supabase
                .from('stokvel_members')
                .select('stokvel_id')
                .in('stokvel_id', stokvelIds)
                .eq('status', 'active');

            if (membersError) {
                throw membersError;
            }

            const memberCounts = allMembers.reduce((acc, m) => {
                acc[m.stokvel_id] = (acc[m.stokvel_id] || 0) + 1;
                return acc;
            }, {});

            // 4. This user's paid contributions, to build a balance figure
            const { data: contributions, error: contributionsError } = await supabase
                .from('contributions')
                .select('stokvel_id, amount, contribution_date')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .in('stokvel_id', stokvelIds);

            if (contributionsError) {
                throw contributionsError;
            }

            const contributedByStokvel = contributions.reduce((acc, c) => {
                acc[c.stokvel_id] = (acc[c.stokvel_id] || 0) + Number(c.amount);
                return acc;
            }, {});

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const thisMonthTotal = contributions
                .filter((c) => new Date(c.contribution_date) >= startOfMonth)
                .reduce((sum, c) => sum + Number(c.amount), 0);

            const combined = memberships.map((m) => ({
                id: m.stokvels.id,
                name: m.stokvels.name,
                members: memberCounts[m.stokvel_id] || 0,
                contributed: contributedByStokvel[m.stokvel_id] || 0,
            }));

            setStokvels(combined);
            setTotalBalance(
                combined.reduce((sum, s) => sum + s.contributed, 0)
            );
            setMonthTotal(thisMonthTotal);

        } catch (error) {
            console.log('Dashboard load error:', error.message);
        } finally {
            setLoading(false);
        }
    }

    // Refresh whenever the screen regains focus (e.g. after EditProfile)
    useFocusEffect(
        useCallback(() => {
            loadDashboard();
        }, [user])
    );

    if (loading && !profile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const displayName = profile?.full_name || 'Stokvel Member';
    const avatarUri = profile?.profile_image_url || DEFAULT_AVATAR;
    const primaryStokvel = stokvels[0];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            <View style={styles.header}>

                <Pressable
                    style={styles.leftHeader}
                    onPress={() => setSidebarVisible(true)}
                >
                    <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatar}
                    />

                    <View>
                        <Text style={styles.greeting}>
                            {getGreeting()}
                        </Text>

                        <Text style={styles.name}>
                            {displayName}
                        </Text>
                    </View>
                </Pressable>

                <Pressable style={styles.notification}>
                    <LucideBell />
                </Pressable>

            </View>

            <View style={styles.balanceCard}>

                <LinearGradient
                    colors={[colors.primaryDark, colors.primary]}
                    start={{ x: 0.8, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientCard}
                >

                    <Text style={styles.balanceLabel}>
                        TOTAL STOKVEL BALANCE
                    </Text>

                    <Text style={styles.balance}>
                        R{totalBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </Text>

                    <View style={styles.balanceBottom}>

                        <Text style={styles.balanceInfo}>
                            Available balance
                        </Text>

                        <Text style={styles.balanceInfo}>
                            + R{monthTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} this month
                        </Text>

                    </View>

                </LinearGradient>
            </View>

            <View style={styles.sectionHeader}>

                <Text style={styles.sectionTitle}>
                    Quick actions
                </Text>

            </View>

            <View style={styles.actions}>

                <Pressable style={styles.action}>
                    <HandCoins
                        style={styles.actionIcon}
                    />

                    <Text style={styles.actionText}>
                        Contribute
                    </Text>
                </Pressable>

                <Pressable style={styles.action} onPress={() => navigation.navigate('Stokvels')}>
                    <Users2
                        style={styles.actionIcon}
                    />

                    <Text style={styles.actionText}>
                        My Stokvels
                    </Text>
                </Pressable>

                <Pressable style={styles.action}>
                    <CreditCard
                        style={styles.actionIcon}
                    />

                    <Text style={styles.actionText}>
                        Wallet
                    </Text>
                </Pressable>

            </View>

            <View style={styles.sectionHeader}>

                <Text style={styles.sectionTitle}>
                    My stokvels
                </Text>

                <Text style={styles.viewAll} onPress={() => navigation.navigate('Stokvels')}>
                    View all
                </Text>

            </View>

            {primaryStokvel ? (
                <View style={styles.stokvelCard}>

                    <View>

                        <Text style={styles.stokvelName}>
                            {primaryStokvel.name}
                        </Text>

                        <Text style={styles.stokvelMembers}>
                            {primaryStokvel.members} members
                        </Text>

                    </View>

                    <Text style={styles.stokvelAmount}>
                        R{primaryStokvel.contributed.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </Text>

                </View>
            ) : (
                <View style={styles.stokvelCard}>
                    <Text style={styles.stokvelMembers}>
                        You haven't joined a stokvel yet.
                    </Text>
                </View>
            )}

            <ProfileSidebar
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                user={{
                    name: displayName,
                    email: user?.email,
                    avatar: avatarUri,
                }}
                onEditProfile={() => {
                    setSidebarVisible(false);
                    navigation.navigate('EditProfile');
                }}
            />

        </ScrollView>
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
        paddingBottom: 40,
        paddingTop: 45,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },

    leftHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 'fit-content',
        gap: 10,
    },

    avatar: {
        width: 43,
        height: 43,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: colors.border
    },

    greeting: {
        color: colors.textSecondary,
        fontSize: 14,
        fontFamily: fonts.regular,
    },

    name: {
        fontFamily: 'Outfit_700Bold',
        color: colors.text,
        fontSize: 20,
    },

    notification: {
        width: 42,
        height: 42,
        backgroundColor: colors.white,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },

    balanceCard: {
        maxWidth: '100%',
        marginBottom: 28,
    },

    gradientCard: {
        width: '100%',
        height: 150,
        borderRadius: 20,
        padding: 22,
    },

    balanceLabel: {
        color: colors.white,
        opacity: 0.7,
        fontSize: 11,
        fontFamily: fonts.semibold,
    },

    balance: {
        color: colors.white,
        fontSize: 30,
        fontFamily: fonts.bold,
        marginTop: 8,
        marginBottom: 24,
    },

    balanceBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    balanceInfo: {
        color: colors.white,
        opacity: 0.8,
        fontSize: 12,
        fontFamily: fonts.regular,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },

    viewAll: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },

    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },

    action: {
        width: '31%',
        backgroundColor: colors.white,
        borderRadius: 15,
        paddingVertical: 18,
        alignItems: 'center',
    },

    actionIcon: {
        fontSize: 22,
        marginBottom: 8,
    },

    actionText: {
        fontSize: 12,
        fontFamily: fonts.semibold,
        color: colors.text,
    },

    stokvelCard: {
        backgroundColor: colors.white,
        borderRadius: 15,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    stokvelName: {
        fontSize: 15,
        fontFamily: fonts.semibold,
        color: colors.text,
    },

    stokvelMembers: {
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 5,
    },

    stokvelAmount: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '700',
    },

});