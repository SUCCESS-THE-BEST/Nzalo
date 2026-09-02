import { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    FlatList,
    TextInput,
    Image
} from 'react-native';

import { Search, PiggyBank } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

// Swap this for [] to preview the empty state, or wire up to your real data source
const MOCK_STOKVELS = [
    {
        id: '1',
        name: 'Bambanani Savings',
        members: 12,
        status: 'contributed', // 'contributed' | 'due'
        statusLabel: 'CONTRIBUTED',
        monthlyPay: 'R3,000',
        nextPayout: '15 Mar 2026',
        avatars: [
            'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg',
            'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg',
        ],
        extraMembers: 9,
    },
    {
        id: '2',
        name: 'Siyakhula Property',
        members: 8,
        status: 'due',
        statusLabel: 'DUE IN 3 DAYS',
        monthlyPay: 'R5,000',
        nextPayout: '01 Apr 2026',
        avatars: [
            'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg',
            'https://static.vecteezy.com/system/resources/previews/067/619/141/non_2x/flat-style-cartoon-boy-avatar-smiling-male-profile-icon-for-app-web-and-social-media-vector.jpg',
        ],
        extraMembers: 9,
    },
];

function StatusBadge({ status, label }) {

    const isContributed = status === 'contributed';

    return (
        <View
            style={[
                styles.badge,
                isContributed ? styles.badgeContributed : styles.badgeDue,
            ]}
        >
            <Text
                style={[
                    styles.badgeText,
                    isContributed ? styles.badgeTextContributed : styles.badgeTextDue,
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

function AvatarStack({ avatars, extraMembers }) {

    return (
        <View style={styles.avatarStack}>
            {avatars.map((uri, index) => (
                <Image
                    key={index}
                    source={{ uri }}
                    style={[styles.stackAvatar, { marginLeft: index === 0 ? 0 : -10 }]}
                />
            ))}

            {extraMembers > 0 && (
                <View style={[styles.stackAvatar, styles.extraAvatar, { marginLeft: -10 }]}>
                    <Text style={styles.extraAvatarText}>
                        +{extraMembers}
                    </Text>
                </View>
            )}
        </View>
    );
}

function StokvelCard({ item, onPress }) {

    return (
        <Pressable style={styles.card} onPress={onPress}>

            <View style={styles.cardTop}>
                <Text style={styles.cardName}>
                    {item.name}
                </Text>

                <StatusBadge status={item.status} label={item.statusLabel} />
            </View>

            <Text style={styles.cardMembers}>
                {item.members} members active
            </Text>

            <View style={styles.cardBottom}>

                <View>
                    <Text style={styles.cardLabel}>
                        MONTHLY PAY
                    </Text>
                    <Text style={styles.cardValue}>
                        {item.monthlyPay}
                    </Text>
                </View>

                <View>
                    <Text style={styles.cardLabel}>
                        NEXT PAYOUT
                    </Text>
                    <Text style={styles.cardValue}>
                        {item.nextPayout}
                    </Text>
                </View>

                <AvatarStack avatars={item.avatars} extraMembers={item.extraMembers} />

            </View>

        </Pressable>
    );
}

function EmptyState({ onCreate, onJoin }) {

    return (
        <View style={styles.emptyState}>

            <View style={styles.emptyIconWrapper}>
                <PiggyBank size={40} color={colors.primary} />
            </View>

            <Text style={styles.emptyTitle}>
                No Stokvels Yet
            </Text>

            <Text style={styles.emptySubtitle}>
                Join an existing stokvel or create your own to start saving together.
            </Text>

            <Pressable style={styles.createButton} onPress={onCreate}>
                <Text style={styles.createButtonText}>
                    Create a Stokvel
                </Text>
            </Pressable>

            <Pressable style={styles.joinButton} onPress={onJoin}>
                <Text style={styles.joinButtonText}>
                    Join a Stokvel
                </Text>
            </Pressable>

        </View>
    );
}

export default function MyStokvelsScreen({ navigation }) {

    const [stokvels, setStokvels] = useState(MOCK_STOKVELS);
    const [search, setSearch] = useState('');

    const filteredStokvels = stokvels.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>

            <FlatList
                data={filteredStokvels}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View>
                        <Text style={styles.title}>
                            My Stokvels
                        </Text>

                        <Text style={styles.subtitle}>
                            Manage and view all your savings societies
                        </Text>

                        <View style={styles.searchBar}>
                            <Search size={18} color={colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search stokvels..."
                                placeholderTextColor={colors.textSecondary}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <StokvelCard
                        item={item}
                        onPress={() => navigation.navigate('StokvelDetail', { id: item.id })}
                    />
                )}
                ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
                ListEmptyComponent={
                    <EmptyState
                        onCreate={() => navigation.navigate('CreateStokvel')}
                        onJoin={() => navigation.navigate('JoinStokvel')}
                    />
                }
            />

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    listContent: {
        padding: 20,
        paddingTop: 45,
        flexGrow: 1,
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
        marginBottom: 20,
    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
        marginBottom: 24,
    },

    searchInput: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.text,
    },

    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 18,
    },

    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },

    cardName: {
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.text,
        flexShrink: 1,
        marginRight: 10,
    },

    cardMembers: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 16,
    },

    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    cardLabel: {
        fontFamily: fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
        marginBottom: 4,
        letterSpacing: 0.3,
    },

    cardValue: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.text,
    },

    badge: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    badgeContributed: {
        backgroundColor: '#DDF3E8',
    },

    badgeDue: {
        backgroundColor: 'transparent',
    },

    badgeText: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        letterSpacing: 0.3,
    },

    badgeTextContributed: {
        color: '#127A4F',
    },

    badgeTextDue: {
        color: '#E23434',
    },

    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    stackAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: colors.white,
    },

    extraAvatar: {
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
    },

    extraAvatarText: {
        color: colors.white,
        fontSize: 9,
        fontFamily: fonts.semibold,
    },

    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 10,
    },

    emptyIconWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },

    emptyTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 18,
        color: colors.text,
        marginBottom: 8,
    },

    emptySubtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 19,
    },

    createButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 30,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },

    createButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },

    joinButton: {
        borderRadius: 30,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },

    joinButtonText: {
        color: colors.text,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },

});