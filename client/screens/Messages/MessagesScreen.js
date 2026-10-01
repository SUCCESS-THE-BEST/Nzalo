import React, {
    useMemo,
    useState,
} from 'react';

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
    MoreHorizontal,
    Search,
    ChevronRight,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';


// =========================================================
// MOCK DATA
// =========================================================

const MOCK_CONVERSATIONS = [
    {
        id: '1',

        name: 'Bambani Savings Chat',

        members: 12,

        lastMessage:
            'Sipho: Payout has been transferred successfully.',

        lastSender: 'Sipho',

        time: '14:22',

        unread: 3,

        initials: 'S',
    },

    {
        id: '2',

        name: 'Siyakhula Property Committee',

        members: 8,

        lastMessage:
            'Naledi: Meeting agendas uploaded for tomorrow.',

        lastSender: 'Naledi',

        time: 'Yesterday',

        unread: 0,

        initials: 'S',
    },

    {
        id: '3',

        name: 'Masakhane Social Stokvel',

        members: 12,

        lastMessage:
            'Kabelo: Welcome to our new members!',

        lastSender: 'Kabelo',

        time: '8 Mar',

        unread: 0,

        initials: 'S',
    },
];


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

            <View
                style={styles.groupAvatar}
            >

                <Text
                    style={styles.groupAvatarText}
                >
                    {item.initials}
                </Text>

            </View>


            {/* Content */}

            <View
                style={styles.conversationContent}
            >

                <View
                    style={styles.conversationTop}
                >

                    <Text
                        style={styles.conversationName}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>


                    <Text
                        style={styles.conversationTime}
                    >
                        {item.time}
                    </Text>

                </View>


                <View
                    style={styles.conversationBottom}
                >

                    <Text
                        style={styles.lastMessage}
                        numberOfLines={1}
                    >
                        {item.lastMessage}
                    </Text>


                    {item.unread > 0 && (

                        <View
                            style={styles.unreadBadge}
                        >

                            <Text
                                style={styles.unreadText}
                            >
                                {item.unread}
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

export default function MessagesScreen({
    navigation,
}) {

    const [search, setSearch] =
        useState('');


    // =====================================================
    // FILTER
    // =====================================================

    const filteredConversations =
        useMemo(() => {

            const value =
                search
                    .trim()
                    .toLowerCase();


            if (!value) {
                return MOCK_CONVERSATIONS;
            }


            return MOCK_CONVERSATIONS.filter(
                (item) =>
                    item.name
                        .toLowerCase()
                        .includes(value)
            );

        }, [search]);


    // =====================================================
    // OPEN CHAT
    // =====================================================

    const openChat = (item) => {

        navigation.navigate(
            'Chat',
            {
                stokvelId: item.id,

                stokvelName:
                    item.name,

                memberCount:
                    item.members,
            }
        );

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <View
            style={styles.container}
        >

            <StatusBar
                barStyle="dark-content"
                backgroundColor={
                    colors.background
                }
            />


            {/* =================================================
                HEADER
            ================================================= */}

            <View
                style={styles.header}
            >

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.moreButton}
                >

                    <MoreHorizontal
                        size={22}
                        color={colors.text}
                    />

                </TouchableOpacity>


                <Text
                    style={styles.title}
                >
                    Messages
                </Text>


                <Text
                    style={styles.subtitle}
                >
                    Group chat with your savings societies
                </Text>

            </View>


            {/* =================================================
                SEARCH
            ================================================= */}

            <View
                style={styles.searchContainer}
            >

                <Search
                    size={20}
                    color={
                        colors.textSecondary
                    }
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


            {/* =================================================
                CONVERSATIONS
            ================================================= */}

            <FlatList
                data={filteredConversations}

                keyExtractor={
                    (item) => item.id
                }

                renderItem={({
                    item,
                }) => (

                    <ConversationItem
                        item={item}
                        onPress={() =>
                            openChat(item)
                        }
                    />

                )}

                showsVerticalScrollIndicator={
                    false
                }

                contentContainerStyle={
                    styles.listContent
                }

                ListEmptyComponent={

                    <View
                        style={
                            styles.emptyContainer
                        }
                    >

                        <View
                            style={
                                styles.emptyIcon
                            }
                        >

                            <Search
                                size={26}
                                color={
                                    colors.primary
                                }
                            />

                        </View>


                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No discussions found
                        </Text>


                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Try searching for another
                            stokvel.
                        </Text>

                    </View>

                }
            />

        </View>
    );
}


// =========================================================
// STYLES
// =========================================================

const styles =
    StyleSheet.create({

        container: {
            flex: 1,

            backgroundColor:
                colors.background,
        },


        // =================================================
        // HEADER
        // =================================================

        header: {
            paddingHorizontal: 30,

            paddingTop: 22,

            paddingBottom: 20,
        },


        moreButton: {
            width: 50,

            height: 50,

            borderRadius: 25,

            backgroundColor:
                colors.white,

            borderWidth: 1,

            borderColor:
                '#E4E5E7',

            alignItems: 'center',

            justifyContent: 'center',

            marginBottom: 17,
        },


        title: {
            fontFamily:
                'Outfit_700Bold',

            fontSize: 34,

            lineHeight: 40,

            color:
                colors.text,

            letterSpacing: -0.7,
        },


        subtitle: {
            fontFamily:
                fonts.regular,

            fontSize: 18,

            lineHeight: 25,

            color:
                colors.textSecondary,

            marginTop: 5,
        },


        // =================================================
        // SEARCH
        // =================================================

        searchContainer: {
            height: 62,

            marginHorizontal: 30,

            marginBottom: 24,

            paddingHorizontal: 22,

            borderRadius: 32,

            backgroundColor:
                colors.white,

            borderWidth: 1,

            borderColor:
                '#DFE0E2',

            flexDirection: 'row',

            alignItems: 'center',
        },


        searchInput: {
            flex: 1,

            height: '100%',

            marginLeft: 14,

            paddingVertical: 0,

            fontFamily:
                fonts.regular,

            fontSize: 17,

            color:
                colors.text,
        },


        // =================================================
        // LIST
        // =================================================

        listContent: {
            paddingHorizontal: 30,

            paddingBottom: 30,
        },


        // =================================================
        // CONVERSATION
        // =================================================

        conversationCard: {
            minHeight: 103,

            borderRadius: 22,

            backgroundColor:
                colors.white,

            borderWidth: 1,

            borderColor:
                '#DFE0E2',

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

            backgroundColor:
                '#004D40',

            alignItems: 'center',

            justifyContent: 'center',

            marginRight: 17,
        },


        groupAvatarText: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 22,

            color:
                '#FFFFFF',
        },


        conversationContent: {
            flex: 1,

            minWidth: 0,
        },


        conversationTop: {
            flexDirection: 'row',

            alignItems: 'center',

            justifyContent:
                'space-between',

            marginBottom: 5,
        },


        conversationName: {
            flex: 1,

            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 18,

            lineHeight: 23,

            color:
                colors.text,

            marginRight: 8,
        },


        conversationTime: {
            fontFamily:
                fonts.regular,

            fontSize: 13,

            color:
                colors.textSecondary,
        },


        conversationBottom: {
            flexDirection: 'row',

            alignItems: 'center',
        },


        lastMessage: {
            flex: 1,

            fontFamily:
                fonts.regular,

            fontSize: 15,

            lineHeight: 21,

            color:
                colors.textSecondary,

            marginRight: 8,
        },


        unreadBadge: {
            width: 28,

            height: 28,

            borderRadius: 14,

            backgroundColor:
                '#005B4F',

            alignItems: 'center',

            justifyContent: 'center',
        },


        unreadText: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 12,

            color:
                '#FFFFFF',
        },


        // =================================================
        // EMPTY
        // =================================================

        emptyContainer: {
            alignItems: 'center',

            justifyContent: 'center',

            paddingTop: 80,
        },


        emptyIcon: {
            width: 64,

            height: 64,

            borderRadius: 32,

            backgroundColor:
                '#E9F1EF',

            alignItems: 'center',

            justifyContent: 'center',

            marginBottom: 16,
        },


        emptyTitle: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 18,

            color:
                colors.text,
        },


        emptyText: {
            fontFamily:
                fonts.regular,

            fontSize: 14,

            color:
                colors.textSecondary,

            marginTop: 5,
        },

    });