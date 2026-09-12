import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    Alert
} from 'react-native';

import { ArrowLeft, Check, Clock, User, X } from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function JoinRequestsScreen({ navigation, route }) {

    const { stokvelId } = route.params;

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchRequests = useCallback(async () => {

        setError('');

        const { data, error } = await supabase.rpc(
            'get_stokvel_join_requests',
            {
                _stokvel_id: stokvelId,
            }
        );

        if (error) {
            console.log('Join requests error:', error);
            setError(error.message);
            setRequests([]);
            return;
        }

        setRequests(data || []);

    }, [stokvelId]);

    useEffect(() => {

        async function load() {
            setLoading(true);
            await fetchRequests();
            setLoading(false);
        }

        load();

    }, [fetchRequests]);


    async function handleReview(userId, decision) {

        try {

            const { data, error } = await supabase.rpc(
                'review_stokvel_join_request',
                {
                    _stokvel_id: stokvelId,
                    _user_id: userId,
                    _decision: decision,
                }
            );

            if (error) {
                throw error;
            }

            console.log('Review result:', data);

            await fetchRequests();

        } catch (error) {

            console.log(
                'Review request error:',
                error
            );

            Alert.alert(
                'Unable to update request',
                error.message
            );
        }
    }


    async function handleRefresh() {

        setRefreshing(true);

        await fetchRequests();

        setRefreshing(false);
    }

    function renderRequest({ item }) {

        const initials = item.full_name
            ? item.full_name
                .split(' ')
                .map(word => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : '?';

        return (
            <View style={styles.requestCard}>

                <View style={styles.userSection}>

                    {item.profile_image_url ? (
                        <Image
                            source={{ uri: item.profile_image_url }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {initials}
                            </Text>
                        </View>
                    )}

                    <View style={styles.userInfo}>

                        <Text style={styles.name}>
                            {item.full_name || 'Unknown user'}
                        </Text>

                        <View style={styles.pendingRow}>
                            <Clock
                                size={14}
                                color={colors.primary}
                            />

                            <Text style={styles.pendingText}>
                                Pending request
                            </Text>
                        </View>

                    </View>

                </View>

                <View style={styles.actions}>

                    <Pressable
                        style={styles.rejectButton}
                        onPress={() => handleReview(item.user_id, 'reject')}
                    >
                        <X
                            size={18}
                            color={colors.danger || '#DC2626'}
                        />

                        <Text style={styles.rejectText}>
                            Reject
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.approveButton}
                        onPress={() => handleReview(item.user_id, 'approve')}
                    >
                        <Check
                            size={18}
                            color={colors.white}
                        />

                        <Text style={styles.approveText}>
                            Approve
                        </Text>
                    </Pressable>

                </View>

            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />

                <Text style={styles.loadingText}>
                    Loading requests...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Header */}

            <View style={styles.header}>

                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft
                        size={22}
                        color={colors.text}
                    />
                </Pressable>

                <View>
                    <Text style={styles.title}>
                        Join Requests
                    </Text>

                    <Text style={styles.subtitle}>
                        Review people who want to join
                    </Text>
                </View>

            </View>

            {/* Error */}

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {/* Requests */}

            <FlatList
                data={requests}
                keyExtractor={(item) => item.user_id}
                renderItem={renderRequest}
                contentContainerStyle={
                    requests.length === 0
                        ? styles.emptyContainer
                        : styles.listContent
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>

                        <View style={styles.emptyIcon}>
                            <User
                                size={30}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            No join requests
                        </Text>

                        <Text style={styles.emptyText}>
                            When someone requests to join this
                            stokvel, their request will appear here.
                        </Text>

                    </View>
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

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 20,
        gap: 14,
        backgroundColor: colors.white,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.text,
    },

    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 3,
    },

    listContent: {
        padding: 20,
        paddingBottom: 40,
    },

    requestCard: {
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
    },

    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },

    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarText: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.white,
    },

    userInfo: {
        marginLeft: 12,
        flex: 1,
    },

    name: {
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.text,
    },

    pendingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        gap: 5,
    },

    pendingText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.primary,
    },

    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },

    rejectButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
    },

    rejectText: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: '#DC2626',
    },

    approveButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
    },

    approveText: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.white,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },

    loadingText: {
        marginTop: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
    },

    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 30,
    },

    emptyState: {
        alignItems: 'center',
    },

    emptyIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    emptyTitle: {
        fontFamily: fonts.semibold,
        fontSize: 18,
        color: colors.text,
    },

    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: 8,
        maxWidth: 300,
    },

    errorBox: {
        margin: 20,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
    },

    errorText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: '#991B1B',
    },
});