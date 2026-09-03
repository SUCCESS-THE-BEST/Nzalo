import {
    StyleSheet,
    Text,
    View,
    Pressable,
    ScrollView,
    Image
} from 'react-native';

import { CreditCard, Users2, LucideBell, HandCoins} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';

import ProfileSidebar from '../../components/ProfileSidebar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

// const CURRENT_USER = {
//     name: 'Lunga Sityebi',
//     email: 'lunga.sityebi@gmail.com',
//     avatar: 'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg',
// };

const DEFAULT_AVATAR =
    'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg';

export default function HomeScreen() {

    const navigation = useNavigation()

    const [sidebarVisible, setSidebarVisible] = useState(false);
    const { user, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [stokvels, setStokvels] = useState([]);
    const [stokvelsLoading, setStokvelsLoading] = useState(true);

    useEffect(() => {

    async function loadProfile() {

        if (!user) {
            setProfileLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.log('Profile error:', error.message);
            setProfileLoading(false);
            return;
        }

        setProfile(data);
        setProfileLoading(false);
    }

        if (!authLoading) {
            loadProfile();
        }

    }, [user, authLoading]);


    useEffect(() => {

        async function loadStokvels() {

            if (!user) {
                setStokvelsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('stokvel_members')
                .select(`
                    stokvel_id,
                    stokvels (
                        id,
                        name,
                        description,
                        contribution_amount,
                        contribution_frequency,
                        max_members,
                        creator_id,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'active');

            if (error) {
                console.log('Stokvel error:', error.message);
                setStokvelsLoading(false);
                return;
            }

            setStokvels(data || []);
            setStokvelsLoading(false);
        }

        if (!authLoading) {
            loadStokvels();
        }

    }, [user, authLoading]);

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
                        source={{uri: profile?.profile_image_url || DEFAULT_AVATAR}}
                        style={styles.avatar}
                    />

                    <View>
                        <Text style={styles.greeting}>
                            Good afternoon
                        </Text>

                        <Text style={styles.name}>
                            {profile?.full_name || 'User'}
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
                        R45,678.90
                    </Text>

                    <View style={styles.balanceBottom}>

                        <Text style={styles.balanceInfo}>
                            Available balance
                        </Text>

                        <Text style={styles.balanceInfo}>
                            + R1,500 this month
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

                <Text style={styles.viewAll}>
                    View all
                </Text>

            </View>

            {stokvelsLoading ? (

                <View style={styles.stokvelCard}>
                    <Text style={styles.stokvelMembers}>
                        Loading stokvels...
                    </Text>
                </View>

            ) : stokvels.length === 0 ? (

                <View style={styles.stokvelCard}>
                    <Text style={styles.stokvelName}>
                        No stokvels yet
                    </Text>

                    <Text style={styles.stokvelMembers}>
                        Create or join a stokvel to get started.
                    </Text>
                </View>

            ) : (

                stokvels.slice(0, 3).map((item) => {

                    const stokvel = item.stokvels;

                    return (
                        <Pressable
                            key={stokvel.id}
                            style={styles.stokvelCard}
                            onPress={() =>
                                navigation.navigate('StokvelDetail', {
                                    id: stokvel.id
                                })
                            }
                        >

                            <View>

                                <Text style={styles.stokvelName}>
                                    {stokvel.name}
                                </Text>

                                <Text style={styles.stokvelMembers}>
                                    {stokvel.contribution_frequency === 'monthly'
                                        ? `R${Number(stokvel.contribution_amount).toLocaleString()} / month`
                                        : `R${Number(stokvel.contribution_amount).toLocaleString()} / week`
                                    }
                                </Text>

                            </View>

                            <Text style={styles.stokvelAmount}>
                                {stokvel.status}
                            </Text>

                        </Pressable>
                    );

                })

            )}

            <ProfileSidebar
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                user={{
                    name: profile?.full_name || 'User',
                    email: profile?.email || user?.email || '',
                    avatar: profile?.profile_image_url || DEFAULT_AVATAR,
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