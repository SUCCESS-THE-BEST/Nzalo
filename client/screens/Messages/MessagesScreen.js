import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { useFocusEffect } from '@react-navigation/native';

import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    FileText,
    Image as ImageIcon,
    Mic,
    MoreHorizontal,
    Search,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { supabase } from '../../config/supabase';
// =========================================================
// HELPERS
// =========================================================
function getDisplayName(profile) {
    if (!profile) {
        return {
            name: 'User',
            initials: 'U',
        };
    }
    const name =profile.full_name?.trim() ||'User';
    const initials =name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase() || 'U';
    return {name,initials,};
}

const formatTime = (iso) => {
    if (!iso) {return '';}
    return new Date(iso).toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

// Text shown under the stokvel name
// Returns { kind, who, text } so the list can render an icon
function buildPreview(latest, currentUserId, senderProfile) {
    if (!latest) {
        return { kind: 'text', who: '', text: 'No messages yet' };
    }
    if (latest.message_type === 'system') {
        return { kind: 'text', who: '', text: latest.message };
    }
    const who =latest.sender_id === currentUserId? 'You': getDisplayName(senderProfile).name;
    if (
        latest.message_type === 'voice' ||
        latest.message_type === 'audio' ||
        (
            latest.message_type === 'file' &&
            /\.(m4a|mp3|aac|wav|caf)(\?.*)?$/i
                .test(latest.message || '')
        )
    ) {
        return { kind: 'voice', who: `${who}: `, text: 'Voice message' };
    }
    if (latest.message_type === 'image') {
        return { kind: 'image', who: `${who}: `, text: 'Photo' };
    }
    if (latest.message_type === 'file') {
        return { kind: 'file', who: `${who}: `, text: 'File' };
    }
    return { kind: 'text', who: `${who}: `, text: latest.message };
}
const PREVIEW_ICONS = {
    voice: Mic,
    image: ImageIcon,
    file: FileText,
};

// =========================================================
// CONVERSATION ITEM
// =========================================================

function ConversationItem({
    item,
    onPress,
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.conversationCard}
            onPress={onPress}
        >
            {/* Avatar */}
            <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>{item.initials}</Text>
            </View>
            {/* Content */}
            <View style={styles.conversationContent}>
                <View style={styles.conversationTop}>
                    <Text
                        style={styles.conversationName}
                        numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.conversationTime}>
                        {item.time}
                    </Text>
                </View>
                <View style={styles.conversationBottom}>
                    {(() => {
                        const preview = item.lastMessage;
                        const PreviewIcon = PREVIEW_ICONS[preview.kind];
                        const textStyle = [
                            styles.lastMessage,
                            item.unread > 0 && styles.lastMessageUnread,
                        ];
                        if (!PreviewIcon) {
                            return (
                                <Text style={textStyle} numberOfLines={1}>
                                    {preview.who}{preview.text}
                                </Text>
                            );
                        }
                        return (
                            <View style={styles.previewRow}>
                                <Text style={[textStyle, styles.previewWho]}>
                                    {preview.who}
                                </Text>
                                <PreviewIcon
                                    size={15}
                                    color={
                                        item.unread > 0
                                            ? colors.text
                                            : colors.textSecondary
                                    }
                                />
                                <Text
                                    style={[textStyle, styles.previewLabel]}
                                    numberOfLines={1}
                                >
                                    {preview.text}
                                </Text>
                            </View>
                        );
                    })()}
                    {item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>
                                {item.unread > 99
                                    ? '99+'
                                    : item.unread}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

// =========================================================
// SCREEN
// =========================================================

export default function MessagesScreen({navigation,}) {
    const [search, setSearch] = useState('');
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // =====================================================
    // LOAD CONVERSATIONS
    // =====================================================

    const loadConversations = useCallback(async () => {
        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();
            if (userError) {
                throw userError;
            }
            if (!user) {
                setConversations([]);
                return;
            }
            // =================================================
            // GET USER CONVERSATIONS (+ my last_read_at)
            // =================================================
            const {
                data: rows,
                error: memberError,
            } = await supabase
                .from('conversation_members')
                .select(`
                    conversation_id,
                    last_read_at,
                    conversations (
                        id,
                        stokvel_id,
                        created_at,
                        updated_at,
                        stokvels (id,name)
                    )
                `)
                .eq('user_id',user.id);
            if (memberError) {
                throw memberError;
            }

            // =================================================
            // LOAD COUNT / LATEST / UNREAD FOR EACH CONVERSATION
            // =================================================

            const loaded = await Promise.all(
                (rows || []).map(
                    async (row) => {
                        const conversation =row.conversations;
                        const stokvel =conversation?.stokvels;
                        if (!conversation || !stokvel) {
                            return null;
                        }
                        const [
                            countResult,
                            latestResult,
                            unreadResult,
                        ] = await Promise.all([
                            // MEMBER COUNT
                            supabase
                                .from('conversation_members')
                                .select('user_id',
                                    {
                                        count: 'exact',
                                        head: true,
                                    })
                                .eq('conversation_id',conversation.id),
                            // LATEST MESSAGE (no profiles join)
                            supabase
                                .from('messages')
                                .select(`
                                    id,
                                    sender_id,
                                    message,
                                    message_type,
                                    created_at`)
                                .eq('conversation_id',conversation.id)
                                .order('created_at',
                                    {
                                        ascending: false,
                                    })
                                .limit(1)
                                .maybeSingle(),

                            // UNREAD: messages from OTHER users
                            // newer than my last read
                            supabase
                                .from('messages')
                                .select('id',
                                    {
                                        count: 'exact',
                                        head: true,
                                    }
                                )
                                .eq('conversation_id',conversation.id)
                                .neq('sender_id',user.id)
                                .neq('message_type','system')
                                .gt('created_at',row.last_read_at),
                        ]);
                        if (countResult.error) {
                            console.error(
                                'Member count error:',
                                countResult.error
                            );
                        }
                        if (latestResult.error) {
                            console.error(
                                'Latest message error:',
                                latestResult.error
                            );
                        }
                        if (unreadResult.error) {
                            console.error(
                                'Unread count error:',
                                unreadResult.error
                            );
                        }
                        return {
                            conversation,
                            stokvel,
                            memberCount:countResult.count || 0,
                            latest:latestResult.data,
                            unread:unreadResult.count || 0,
                        };
                    }
                )
            );
            const valid =loaded.filter(Boolean);

            // =================================================
            // LOAD ALL SENDER PROFILES SEPARATELY (ONE QUERY)
            // =================================================
            const senderIds = [
                ...new Set(valid.map((v) =>v.latest?.sender_id)
                        .filter(Boolean)
                        .filter((id) =>id !== user.id)),];
            const profileMap = {};
            if (senderIds.length > 0) {
                const {
                    data: profiles,
                    error: profilesError,
                } = await supabase.rpc('get_chat_profiles');
                if (profilesError) {
                    console.error(
                        'Profiles error:',
                        profilesError
                    );
                }
                (profiles || []).forEach((p) => {profileMap[p.id] = p;});
            }

            // =================================================
            // BUILD LIST ITEMS
            // =================================================

            const items = valid.map(
                ({
                    conversation,
                    stokvel,
                    memberCount,
                    latest,
                    unread,
                }) => {const stokvelName =stokvel.name ||'Stokvel Chat';
                    const initials =stokvelName.trim().split(' ').slice(0, 2)
                            .map((word) => word[0]).join('').toUpperCase() ||'S';
                    return {
                        id:conversation.id,
                        conversationId:conversation.id,
                        stokvelId:conversation.stokvel_id,
                        name:stokvelName,
                        members:memberCount,
                        lastMessage:
                            buildPreview(
                                latest,
                                user.id,
                                latest
                                    ? profileMap[
                                        latest.sender_id
                                    ]
                                    : null
                            ),
                        time:
                            latest
                                ? formatTime(
                                    latest.created_at
                                )
                                : '',
                        unread,
                        initials,
                        updatedAt:
                            latest?.created_at ||
                            conversation.updated_at,
                    };
                }
            );
            // SORT BY LATEST MESSAGE
            setConversations(
                items.sort(
                    (a, b) =>
                        new Date(
                            b.updatedAt
                        ) -
                        new Date(
                            a.updatedAt
                        )
                )
            );
        }
        catch (error) {
            console.error(
                'Error loading conversations:',
                error
            );
            setConversations([]);
        }
        finally {
            setLoading(false);
        }
    }, []);

    // =========================================================
    // RELOAD WHEN SCREEN IS FOCUSED
    // (this clears the badge after you leave a chat)
    // =========================================================
    useFocusEffect(
        useCallback(() => {
            loadConversations();
        }, [loadConversations])
    );

    // =========================================================
    // LIVE UPDATES
    // New message  -> INSERT
    // Debounced so a burst of updates = one reload
    // =========================================================
    useEffect(() => {
        let timer = null;
        const scheduleReload = () => {
            clearTimeout(timer);
            timer = setTimeout(
                loadConversations,
                400
            );
        };
        const channel = supabase
            .channel('messages-list')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                scheduleReload
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                },
                scheduleReload
            )
            .subscribe();
        return () => {
            clearTimeout(timer);
            supabase.removeChannel(channel);
        };
    }, [loadConversations]);
    // =========================================================
    // FILTER
    // =========================================================
    const filteredConversations =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();
            if (!value) {
                return conversations;
            }
            return conversations.filter(
                (item) =>
                    item.name
                        .toLowerCase()
                        .includes(value)
            );
        }, [
            search,
            conversations,
        ]);

    // =========================================================
    // OPEN CHAT
    // =========================================================

    const openChat = (item) => {
        navigation.navigate(
            'Chat',
            {
                stokvelId:
                    item.stokvelId,
                stokvelName:
                    item.name,
                memberCount:
                    item.members,
                conversationId:
                    item.conversationId,
            }
        );
    };

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={colors.background}
            />
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.moreButton}
                >
                    <MoreHorizontal
                        size={22}
                        color={colors.text}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>
                    Messages
                </Text>
                <Text style={styles.subtitle}>
                    Group chat with your savings societies
                </Text>
            </View>
            {/* SEARCH */}
            <View style={styles.searchContainer}>
                <Search
                    size={20}
                    color={colors.textSecondary}
                    strokeWidth={2.2}
                />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search discussions..."
                    placeholderTextColor={
                        colors.textSecondary
                    }
                    style={styles.searchInput}
                    autoCapitalize="none"
                    returnKeyType="search"
                />
            </View>
            {/* CONVERSATIONS */}
            <FlatList
                data={filteredConversations}
                keyExtractor={(item) =>
                    item.conversationId
                }
                renderItem={({ item }) => (
                    <ConversationItem
                        item={item}
                        onPress={() =>
                            openChat(item)
                        }
                    />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.listContent
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Search
                                size={26}
                                color={colors.primary}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {loading
                                ? 'Loading discussions...'
                                : 'No discussions found'}
                        </Text>
                        {!loading && (
                            <Text style={styles.emptyText}>
                                Try searching for another stokvel.
                            </Text>
                        )}
                    </View>
                }
            />
        </View>
    );
}

// =========================================================
// STYLES
// =========================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // HEADER
    header: {
        paddingHorizontal: 30,
        paddingTop: 22,
        paddingBottom: 20,
    },
    moreButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#E4E5E7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 17,
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 34,
        lineHeight: 40,
        color: colors.text,
        letterSpacing: -0.7,
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 18,
        lineHeight: 25,
        color: colors.textSecondary,
        marginTop: 5,
    },
    // SEARCH
    searchContainer: {
        height: 62,
        marginHorizontal: 30,
        marginBottom: 24,
        paddingHorizontal: 22,
        borderRadius: 32,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DFE0E2',
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: 14,
        paddingVertical: 0,
        fontFamily: fonts.regular,
        fontSize: 17,
        color: colors.text,
    },
    // LIST
    listContent: {
        paddingHorizontal: 30,
        paddingBottom: 30,
    },
    // CONVERSATION
    conversationCard: {
        minHeight: 103,
        borderRadius: 22,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DFE0E2',
        paddingHorizontal: 21,
        paddingVertical: 17,
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupAvatar: {
        width: 54,
        height: 54,
        borderRadius: 17,
        backgroundColor: '#004D40',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 17,
    },
    groupAvatarText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 22,
        color: '#FFFFFF',
    },
    conversationContent: {
        flex: 1,
        minWidth: 0,
    },
    conversationTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    conversationName: {
        flex: 1,
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 18,
        lineHeight: 23,
        color: colors.text,
        marginRight: 8,
    },
    conversationTime: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
    conversationBottom: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 21,
        color: colors.textSecondary,
        marginRight: 8,
    },
    lastMessageUnread: {
        fontFamily: 'Outfit_600SemiBold',
        color: colors.text,
    },
    unreadBadge: {
        minWidth: 28,
        height: 28,
        borderRadius: 14,
        paddingHorizontal: 7,
        backgroundColor: '#005B4F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: '#FFFFFF',
    },
    // EMPTY
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E9F1EF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 18,
        color: colors.text,
    },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 5,
    },
    previewRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    },
    previewWho: {
        flex: 0,
        marginRight: 0,
    },
    previewLabel: {
        flex: 1,
        marginLeft: 5,
        marginRight: 0,
    },
});