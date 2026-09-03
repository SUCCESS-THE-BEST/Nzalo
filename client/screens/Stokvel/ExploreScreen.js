import { useEffect, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Compass, Search } from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

// ============================================================
// Explore Card
// ============================================================

function ExploreCard({ item, onJoin }) {
    const initial = item.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>{initial}</Text>
                </View>

                <View style={styles.cardHeaderText}>
                    <Text
                        style={styles.cardTitle}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>

                    <Text style={styles.members}>
                        Up to {item.max_members} members
                    </Text>
                </View>

                <View style={styles.publicBadge}>
                    <Text style={styles.publicBadgeText}>
                        PUBLIC
                    </Text>
                </View>
            </View>

            {/* Description */}
            <Text
                style={styles.description}
                numberOfLines={3}
            >
                {item.description || 'No description provided.'}
            </Text>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
                <View style={styles.contributionContainer}>
                    <Text style={styles.contributionLabel}>
                        CONTRIBUTION
                    </Text>

                    <Text style={styles.contribution}>
                        R{Number(item.contribution_amount).toLocaleString()}
                        <Text style={styles.frequency}>
                            {' / '}
                            {item.contribution_frequency}
                        </Text>
                    </Text>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.joinButton,
                        pressed && styles.buttonPressed,
                    ]}
                    onPress={onJoin}
                >
                    <Text style={styles.joinButtonText}>
                        JOIN
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState() {
    return (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
                <Compass
                    size={36}
                    color={colors.primary}
                    strokeWidth={1.8}
                />
            </View>

            <Text style={styles.emptyTitle}>
                No stokvels found
            </Text>

            <Text style={styles.emptySubtitle}>
                Try a different search, or create your own stokvel.
            </Text>
        </View>
    );
}

// ============================================================
// Explore Screen
// ============================================================

export default function ExploreScreen({ navigation }) {
    const [stokvels, setStokvels] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStokvels();
    }, []);

    async function fetchStokvels() {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('stokvels')
                .select(`
                    id,
                    name,
                    description,
                    contribution_amount,
                    contribution_frequency,
                    max_members
                `)
                .eq('visibility', 'public')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching stokvels:', error);
                return;
            }

            setStokvels(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const filteredStokvels = stokvels.filter((stokvel) => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return true;
        }

        return (
            stokvel.name?.toLowerCase().includes(query) ||
            stokvel.description?.toLowerCase().includes(query)
        );
    });

    function handleJoin(item) {
        // TODO:
        // Wire this up to stokvelServices.
        // This should create a stokvel_members row
        // with status = 'pending'.

        console.log('Requested to join', item.name);
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredStokvels}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"

                ListHeaderComponent={
                    <View>
                        {/* Page Header */}
                        <View style={styles.header}>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.title}>
                                    Explore
                                </Text>

                                <Text style={styles.subtitle}>
                                    Discover public stokvels to join
                                </Text>
                            </View>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.createButton,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={() =>
                                    navigation.navigate('Stokvels', {
                                        screen: 'CreateStokvel',
                                    })
                                }
                            >
                                <Text style={styles.createButtonText}>
                                    + Create
                                </Text>
                            </Pressable>
                        </View>

                        {/* Search */}
                        <View style={styles.searchBar}>
                            <Search
                                size={19}
                                color={colors.textSecondary}
                                strokeWidth={2}
                            />

                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search stokvels..."
                                placeholderTextColor={colors.textSecondary}
                                value={search}
                                onChangeText={setSearch}
                                returnKeyType="search"
                            />
                        </View>

                        {/* Results Count */}
                        {!loading && (
                            <View style={styles.resultsRow}>
                                <Text style={styles.resultsText}>
                                    {filteredStokvels.length}{' '}
                                    {filteredStokvels.length === 1
                                        ? 'stokvel'
                                        : 'stokvels'}{' '}
                                    available
                                </Text>
                            </View>
                        )}
                    </View>
                }

                renderItem={({ item }) => (
                    <ExploreCard
                        item={item}
                        onJoin={() => handleJoin(item)}
                    />
                )}

                ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                )}

                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>
                                Loading stokvels...
                            </Text>
                        </View>
                    ) : (
                        <EmptyState />
                    )
                }
            />
        </View>
    );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    listContent: {
        paddingHorizontal: 20,
        paddingTop: 42,
        paddingBottom: 40,
        flexGrow: 1,
    },

    // --------------------------------------------------------
    // Header
    // --------------------------------------------------------

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 22,
    },

    headerTextContainer: {
        flex: 1,
        paddingRight: 16,
    },

    title: {
        fontFamily: fonts.bold,
        fontSize: 28,
        lineHeight: 34,
        color: colors.text,
        letterSpacing: -0.5,
    },

    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
        marginTop: 4,
    },

    createButton: {
        backgroundColor: colors.primaryDark,
        minHeight: 40,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },

    createButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 12,
    },

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    searchBar: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 30,
        paddingHorizontal: 15,
        gap: 10,

        borderWidth: 1,
        borderColor: colors.border,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },

    searchInput: {
        flex: 1,
        height: '100%',
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.text,
        paddingVertical: 0,
    },

    resultsRow: {
        marginTop: 20,
        marginBottom: 10,
    },

    resultsText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.textSecondary,
    },

    // --------------------------------------------------------
    // Stokvel Card
    // --------------------------------------------------------

    card: {
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 18,

        borderWidth: 1,
        borderColor: colors.border,

        // shadowColor: '#000',
        // shadowOffset: {
        //     width: 0,
        //     height: 3,
        // },
        // shadowOpacity: 0.05,
        // shadowRadius: 8,
        // elevation: 2,
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    iconText: {
        fontFamily: fonts.bold,
        fontSize: 19,
        color: colors.primary,
    },

    cardHeaderText: {
        flex: 1,
        paddingRight: 8,
    },

    cardTitle: {
        fontFamily: fonts.semibold,
        fontSize: 16,
        lineHeight: 21,
        color: colors.text,
    },

    members: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 3,
    },

    publicBadge: {
        backgroundColor: colors.primaryLight,
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    publicBadgeText: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        letterSpacing: 0.5,
        color: colors.primary,
    },

    description: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
        marginBottom: 18,
    },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',

        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    contributionContainer: {
        flex: 1,
        paddingRight: 10,
    },

    contributionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 9,
        letterSpacing: 0.8,
        color: colors.textSecondary,
        marginBottom: 4,
    },

    contribution: {
        fontFamily: fonts.bold,
        fontSize: 15,
        color: colors.primary,
    },

    frequency: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },

    joinButton: {
        minWidth: 72,
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: colors.primary,

        alignItems: 'center',
        justifyContent: 'center',
    },

    joinButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        letterSpacing: 0.4,
        color: colors.white,
    },

    buttonPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.98 }],
    },

    separator: {
        height: 14,
    },

    // --------------------------------------------------------
    // Empty / Loading
    // --------------------------------------------------------

    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingTop: 70,
    },

    emptyIconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.white,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
        borderColor: colors.border,

        marginBottom: 22,
    },

    emptyTitle: {
        fontFamily: fonts.bold,
        fontSize: 19,
        color: colors.text,
        marginBottom: 7,
        textAlign: 'center',
    },

    emptySubtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
    },

    loadingContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },

    loadingText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
});

