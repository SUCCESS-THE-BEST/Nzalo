import { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    ActivityIndicator,
} from 'react-native';

import { Compass, Search, RefreshCw } from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';


// ============================================================
// Explore Card
// ============================================================

function ExploreCard({ item, onJoin }) {
    const initial = item.name?.charAt(0)?.toUpperCase() || '?';

    const currentMembers = item.current_members || 0;
    const maxMembers = item.max_members || 0;

    const isFull =
        maxMembers > 0 && currentMembers >= maxMembers;

    return (
        <View style={styles.card}>

            {/* Card Header */}
            <View style={styles.cardHeader}>

                <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>
                        {initial}
                    </Text>
                </View>

                <View style={styles.cardHeaderText}>

                    <Text
                        style={styles.cardTitle}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>

                    <Text style={styles.members}>
                        {currentMembers}
                        {maxMembers > 0 ? ` / ${maxMembers}` : ''}
                        {' '}
                        {currentMembers === 1
                            ? 'member'
                            : 'members'}
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

                        R
                        {Number(
                            item.contribution_amount || 0
                        ).toLocaleString()}

                        <Text style={styles.frequency}>
                            {' / '}
                            {item.contribution_frequency || 'monthly'}
                        </Text>

                    </Text>

                </View>


                <Pressable
                    style={({ pressed }) => [
                        styles.joinButton,

                        isFull && styles.joinButtonDisabled,

                        pressed &&
                            !isFull &&
                            styles.buttonPressed,
                    ]}
                    onPress={onJoin}
                    disabled={isFull}
                >
                    <Text
                        style={[
                            styles.joinButtonText,
                            isFull &&
                                styles.joinButtonTextDisabled,
                        ]}
                    >
                        {isFull ? 'FULL' : 'JOIN'}
                    </Text>
                </Pressable>

            </View>

        </View>
    );
}


// ============================================================
// Empty State
// ============================================================

function EmptyState({ hasSearch }) {
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
                {hasSearch
                    ? 'No stokvels found'
                    : 'No public stokvels yet'}
            </Text>

            <Text style={styles.emptySubtitle}>
                {hasSearch
                    ? 'Try searching for a different stokvel name or description.'
                    : 'There are currently no public stokvels available to join. You can create your own instead.'}
            </Text>

        </View>
    );
}


// ============================================================
// Error State
// ============================================================

function ErrorState({ onRetry }) {
    return (
        <View style={styles.errorState}>

            <View style={styles.errorIconWrapper}>
                <RefreshCw
                    size={32}
                    color={colors.primary}
                    strokeWidth={1.8}
                />
            </View>

            <Text style={styles.errorTitle}>
                Something went wrong
            </Text>

            <Text style={styles.errorSubtitle}>
                We couldn't load the available stokvels.
                Please check your connection and try again.
            </Text>

            <Pressable
                style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.buttonPressed,
                ]}
                onPress={onRetry}
            >
                <Text style={styles.retryButtonText}>
                    Try Again
                </Text>
            </Pressable>

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

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState(false);


    // ========================================================
    // Fetch Stokvels
    // ========================================================

    const fetchStokvels = useCallback(
        async (isRefreshing = false) => {

            try {

                if (isRefreshing) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError(false);


                // --------------------------------------------
                // Get public active stokvels
                // --------------------------------------------

                const { data, error: stokvelError } =
                    await supabase
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
                        .order('created_at', {
                            ascending: false,
                        });


                if (stokvelError) {
                    throw stokvelError;
                }


                // --------------------------------------------
                // Get member counts
                // --------------------------------------------

                const stokvelIds =
                    (data || []).map(
                        (stokvel) => stokvel.id
                    );


                if (stokvelIds.length === 0) {

                    setStokvels([]);

                    return;
                }


                const { data: members, error: memberError } =
                    await supabase
                        .from('stokvel_members')
                        .select('stokvel_id')
                        .in('stokvel_id', stokvelIds)
                        .eq('status', 'active');


                if (memberError) {
                    throw memberError;
                }


                // --------------------------------------------
                // Count members per stokvel
                // --------------------------------------------

                const memberCounts = {};

                (members || []).forEach((member) => {

                    if (!memberCounts[member.stokvel_id]) {
                        memberCounts[member.stokvel_id] = 0;
                    }

                    memberCounts[member.stokvel_id]++;
                });


                // --------------------------------------------
                // Combine stokvel data + member counts
                // --------------------------------------------

                const formattedStokvels =
                    (data || []).map((stokvel) => ({
                        ...stokvel,

                        current_members:
                            memberCounts[stokvel.id] || 0,
                    }));


                setStokvels(formattedStokvels);

            } catch (err) {

                console.error(
                    'Error fetching stokvels:',
                    err
                );

                setError(true);

            } finally {

                setLoading(false);
                setRefreshing(false);
            }

        },
        []
    );


    // ========================================================
    // Initial Load
    // ========================================================

    useEffect(() => {
        fetchStokvels();
    }, [fetchStokvels]);


    // ========================================================
    // Pull To Refresh
    // ========================================================

    function handleRefresh() {
        fetchStokvels(true);
    }


    // ========================================================
    // Search
    // ========================================================

    const filteredStokvels = stokvels.filter(
        (stokvel) => {

            const query =
                search.trim().toLowerCase();

            if (!query) {
                return true;
            }

            return (
                stokvel.name
                    ?.toLowerCase()
                    .includes(query) ||

                stokvel.description
                    ?.toLowerCase()
                    .includes(query)
            );
        }
    );


    // ========================================================
    // Join
    // ========================================================

    function handleJoin(item) {

        navigation.navigate('Stokvels', {
            screen: 'JoinStokvel',
            params: {
                stokvelId: item.id,
            },
        });

    }


    // ========================================================
    // Create Stokvel
    // ========================================================

    function handleCreateStokvel() {

        navigation.navigate('Stokvels', {
            screen: 'CreateStokvel',
        });
    }


    // ========================================================
    // Render
    // ========================================================

    return (
        <View style={styles.container}>

            <FlatList

                data={filteredStokvels}

                keyExtractor={(item) => item.id}

                showsVerticalScrollIndicator={false}

                contentContainerStyle={styles.listContent}

                keyboardShouldPersistTaps="handled"


                // --------------------------------------------
                // Pull to refresh
                // --------------------------------------------

                refreshing={refreshing}

                onRefresh={handleRefresh}


                // --------------------------------------------
                // Header
                // --------------------------------------------

                ListHeaderComponent={

                    <View>

                        {/* Page Header */}

                        <View style={styles.header}>

                            <View
                                style={
                                    styles.headerTextContainer
                                }
                            >

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
                                    pressed &&
                                        styles.buttonPressed,
                                ]}
                                onPress={
                                    handleCreateStokvel
                                }
                            >

                                <Text
                                    style={
                                        styles.createButtonText
                                    }
                                >
                                    + Create
                                </Text>

                            </Pressable>

                        </View>


                        {/* Search */}

                        <View style={styles.searchBar}>

                            <Search
                                size={19}
                                color={
                                    colors.textSecondary
                                }
                                strokeWidth={2}
                            />

                            <TextInput
                                style={styles.searchInput}

                                placeholder="Search stokvels..."

                                placeholderTextColor={
                                    colors.textSecondary
                                }

                                value={search}

                                onChangeText={setSearch}

                                returnKeyType="search"

                                autoCapitalize="none"
                            />

                        </View>


                        {/* Results Count */}

                        {!loading && !error && (
                            <View
                                style={
                                    styles.resultsRow
                                }
                            >

                                <Text
                                    style={
                                        styles.resultsText
                                    }
                                >
                                    {filteredStokvels.length}{' '}

                                    {filteredStokvels.length === 1
                                        ? 'stokvel'
                                        : 'stokvels'}

                                    {' '}available
                                </Text>

                            </View>
                        )}

                    </View>
                }


                // --------------------------------------------
                // Stokvel Card
                // --------------------------------------------

                renderItem={({ item }) => (

                    <ExploreCard
                        item={item}
                        onJoin={() => handleJoin(item)}
                    />

                )}


                // --------------------------------------------
                // Separator
                // --------------------------------------------

                ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                )}


                // --------------------------------------------
                // Loading / Error / Empty
                // --------------------------------------------

                ListEmptyComponent={

                    loading ? (

                        <View
                            style={
                                styles.loadingContainer
                            }
                        >

                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                            />

                            <Text
                                style={
                                    styles.loadingText
                                }
                            >
                                Loading stokvels...
                            </Text>

                        </View>

                    ) : error ? (

                        <ErrorState
                            onRetry={() =>
                                fetchStokvels()
                            }
                        />

                    ) : (

                        <EmptyState
                            hasSearch={
                                search.trim().length > 0
                            }
                        />

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


    // --------------------------------------------------------
    // Create Button
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Results
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Description
    // --------------------------------------------------------

    description: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
        marginBottom: 18,
    },


    // --------------------------------------------------------
    // Card Footer
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Join Button
    // --------------------------------------------------------

    joinButton: {
        minWidth: 72,
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: colors.primary,

        alignItems: 'center',
        justifyContent: 'center',
    },

    joinButtonDisabled: {
        backgroundColor: colors.border,
    },

    joinButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        letterSpacing: 0.4,
        color: colors.white,
    },

    joinButtonTextDisabled: {
        color: colors.textSecondary,
    },

    buttonPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.98 }],
    },


    // --------------------------------------------------------
    // Separator
    // --------------------------------------------------------

    separator: {
        height: 14,
    },


    // --------------------------------------------------------
    // Loading
    // --------------------------------------------------------

    loadingContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },

    loadingText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 10,
    },


    // --------------------------------------------------------
    // Empty
    // --------------------------------------------------------

    emptyState: {
        alignItems: 'center',
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


    // --------------------------------------------------------
    // Error
    // --------------------------------------------------------

    errorState: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 70,
    },

    errorIconWrapper: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.white,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
        borderColor: colors.border,

        marginBottom: 20,
    },

    errorTitle: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.text,
        marginBottom: 7,
        textAlign: 'center',
    },

    errorSubtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
        textAlign: 'center',
        maxWidth: 290,
        marginBottom: 20,
    },

    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 22,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    retryButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.white,
    },

});