import { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    Image,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';

import {
    User,
    Shield,
    Bell,
    Globe,
    FileText,
    ChevronRight,
    Pencil,
    MoreHorizontal,
    LogOut,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.82;

function SettingsRow({ icon: Icon, title, subtitle, onPress }) {

    return (
        <Pressable style={styles.row} onPress={onPress}>

            <View style={styles.rowIcon}>
                <Icon size={18} color={colors.primaryDark} />
            </View>

            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>
                    {title}
                </Text>
                <Text style={styles.rowSubtitle}>
                    {subtitle}
                </Text>
            </View>

            <ChevronRight size={18} color={colors.textSecondary} />

        </Pressable>
    );
}

export default function ProfileSidebar({ visible, onClose, onEditProfile, user }) {

    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    const { signOut } = useAuth();

    useEffect(() => {

        if (visible) {
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 280,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 280,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        }

    }, [visible]);

    async function handleSignOut() {
        onClose();
        await signOut();
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.container}>

                <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    style={[styles.sidebar, { transform: [{ translateX }] }]}
                >

                    <View style={styles.topRow}>
                        <Pressable style={styles.moreButton} onPress={onClose}>
                            <MoreHorizontal size={18} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={styles.profileCard}>

                        <Image
                            source={{ uri: user.avatar }}
                            style={styles.avatar}
                        />

                        <View style={styles.profileText}>
                            <Text style={styles.profileName}>
                                {user.name}
                            </Text>
                            <Text style={styles.profileEmail}>
                                {user.email}
                            </Text>
                        </View>

                        <Pressable style={styles.editIconButton} onPress={onEditProfile}>
                            <Pencil size={14} color={colors.textSecondary} />
                        </Pressable>

                    </View>

                    <Text style={styles.sectionLabel}>
                        ACCOUNT SETTINGS
                    </Text>

                    <View style={styles.sectionGroup}>

                        <SettingsRow
                            icon={User}
                            title="Edit Profile Info"
                            subtitle="Name, email, national ID verification"
                            onPress={onEditProfile}
                        />

                        <View style={styles.separator} />

                        <SettingsRow
                            icon={Shield}
                            title="Security"
                            subtitle="Biometrics, pin, password reset"
                            onPress={() => {}}
                        />

                        <View style={styles.separator} />

                        <SettingsRow
                            icon={Bell}
                            title="Notifications & Alerts"
                            subtitle="Payouts, deposit deadlines"
                            onPress={() => {}}
                        />

                    </View>

                    <Text style={styles.sectionLabel}>
                        APP PREFERENCES
                    </Text>

                    <View style={styles.sectionGroup}>

                        <SettingsRow
                            icon={Globe}
                            title="Language"
                            subtitle="English (South Africa)"
                            onPress={() => {}}
                        />

                        <View style={styles.separator} />

                        <SettingsRow
                            icon={FileText}
                            title="Compliance & Legal"
                            subtitle="NASASA conditions, terms of service"
                            onPress={() => {}}
                        />

                    </View>

                    <View style={styles.bottomRow}>
                        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                            <LogOut size={16} color={colors.white} />
                            <Text style={styles.signOutText}>
                                Sign Out
                            </Text>
                        </Pressable>
                    </View>

                </Animated.View>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

    sidebar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: colors.background,
        paddingTop: 60,
        paddingHorizontal: 16,
    },

    topRow: {
        alignItems: 'flex-end',
        marginBottom: 16,
    },

    moreButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 24,
    },

    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },

    profileText: {
        flex: 1,
        marginLeft: 12,
    },

    profileName: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
    },

    profileEmail: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },

    editIconButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sectionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 10,
    },

    sectionGroup: {
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },

    rowIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    rowText: {
        flex: 1,
    },

    rowTitle: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.text,
    },

    rowSubtitle: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },

    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 60,
    },

    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        marginBottom: 20,
    },

    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },

    signOutText: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.white,
    },

});