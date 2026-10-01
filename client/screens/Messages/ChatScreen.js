import React, {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    ArrowLeft,
    Paperclip,
    Phone,
    Send,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';


// =========================================================
// MOCK MESSAGES
// =========================================================

const MOCK_MESSAGES = [

    {
        id: '1',

        type: 'message',

        sender: 'Lerato Khumalo',

        initials: 'L',

        message:
            'Hi everyone! Just a reminder that contributions are due by Saturday 🙏',

        time: '09:42',

        mine: false,
    },


    {
        id: '2',

        type: 'message',

        sender: 'Thabo Molefe',

        initials: 'T',

        message:
            "Thanks Lerato. I've already transferred mine this morning.",

        time: '10:15',

        mine: false,
    },


    {
        id: '3',

        type: 'system',

        message:
            '📋 New vote started: Q1 payout recipient',
    },


    {
        id: '4',

        type: 'system',

        message:
            '✓ Sibusiso Ndlovu joined the stokvel',
    },


    {
        id: '5',

        type: 'message',

        sender: 'You',

        initials: 'L',

        message:
            "Great, I'll send mine today after work",

        time: '11:30',

        mine: true,
    },


    {
        id: '6',

        type: 'system',

        message:
            '💰 Monthly contribution of R2,500 is now due',
    },


    {
        id: '7',

        type: 'message',

        sender: 'Sibusiso Ndlovu',

        initials: 'S',

        message:
            'Welcome everyone! Excited to be part of the group',

        time: '11:35',

        mine: false,
    },

];


// =========================================================
// DATE HEADER
// =========================================================

function DateHeader() {

    return (
        <View
            style={styles.dateHeader}
        >

            <Text
                style={styles.dateText}
            >
                Today, 28 Feb 2026
            </Text>

        </View>
    );
}


// =========================================================
// MESSAGE BUBBLE
// =========================================================

function MessageBubble({
    item,
}) {

    if (item.type === 'system') {

        return (
            <View
                style={
                    styles.systemMessage
                }
            >

                <Text
                    style={
                        styles.systemMessageText
                    }
                >
                    {item.message}
                </Text>

            </View>
        );
    }


    if (item.mine) {

        return (
            <View
                style={
                    styles.myMessageContainer
                }
            >

                <View
                    style={
                        styles.myBubble
                    }
                >

                    <Text
                        style={
                            styles.myMessageText
                        }
                    >
                        {item.message}
                    </Text>

                </View>


                <Text
                    style={
                        styles.myTime
                    }
                >
                    {item.time}
                </Text>

            </View>
        );
    }


    return (
        <View
            style={
                styles.otherMessageContainer
            }
        >

            {/* Avatar */}

            <View
                style={
                    styles.messageAvatar
                }
            >

                <Text
                    style={
                        styles.messageAvatarText
                    }
                >
                    {item.initials}
                </Text>

            </View>


            {/* Message */}

            <View
                style={
                    styles.otherMessageContent
                }
            >

                <Text
                    style={
                        styles.senderName
                    }
                >
                    {item.sender}
                </Text>


                <View
                    style={
                        styles.otherBubble
                    }
                >

                    <Text
                        style={
                            styles.otherMessageText
                        }
                    >
                        {item.message}
                    </Text>

                </View>


                <Text
                    style={
                        styles.otherTime
                    }
                >
                    {item.time}
                </Text>

            </View>

        </View>
    );
}


// =========================================================
// CHAT SCREEN
// =========================================================

export default function ChatScreen({
    navigation,
    route,
}) {

    const stokvelName =
        route?.params?.stokvelName ||
        'Stokvel Chat';


    const memberCount =
        route?.params?.memberCount ||
        0;


    const [message, setMessage] =
        useState('');


    const [messages, setMessages] =
        useState(
            MOCK_MESSAGES
        );


    const flatListRef =
        useRef(null);


    // =====================================================
    // HIDE TAB BAR
    // =====================================================

    useLayoutEffect(() => {

        const parent =
            navigation.getParent();


        if (!parent) {
            return;
        }


        parent.setOptions({
            tabBarStyle: {
                display: 'none',
            },
        });


        return () => {

            parent.setOptions({
                tabBarStyle: undefined,
            });

        };

    }, [navigation]);


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const sendMessage = () => {

        const trimmed =
            message.trim();


        if (!trimmed) {
            return;
        }


        const newMessage = {

            id:
                Date.now().toString(),

            type:
                'message',

            sender:
                'You',

            initials:
                'L',

            message:
                trimmed,

            time:
                new Date().toLocaleTimeString(
                    'en-ZA',
                    {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }
                ),

            mine:
                true,
        };


        setMessages(
            (current) => [
                ...current,
                newMessage,
            ]
        );


        setMessage('');


        setTimeout(() => {

            flatListRef.current?.scrollToEnd({
                animated: true,
            });

        }, 100);

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >

            <StatusBar
                barStyle="dark-content"
                backgroundColor={
                    colors.background
                }
            />


            {/* =================================================
                CHAT HEADER
            ================================================= */}

            <View
                style={styles.chatHeader}
            >

                <TouchableOpacity
                    style={
                        styles.backButton
                    }
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.goBack()
                    }
                >

                    <ArrowLeft
                        size={25}
                        color={
                            colors.text
                        }
                    />

                </TouchableOpacity>


                <View
                    style={
                        styles.headerInfo
                    }
                >

                    <Text
                        style={
                            styles.chatTitle
                        }
                        numberOfLines={1}
                    >
                        {stokvelName}
                    </Text>


                    <Text
                        style={
                            styles.activeMembers
                        }
                    >
                        {memberCount
                            ? `${memberCount} members active`
                            : 'Group chat'}
                    </Text>

                </View>


                <TouchableOpacity
                    style={
                        styles.phoneButton
                    }
                    activeOpacity={0.8}
                >

                    <Phone
                        size={25}
                        color={
                            colors.primaryDark
                        }
                    />

                </TouchableOpacity>

            </View>


            {/* =================================================
                MESSAGES
            ================================================= */}

            <FlatList
                ref={flatListRef}

                data={messages}

                keyExtractor={
                    (item) => item.id
                }

                renderItem={({
                    item,
                }) => (

                    <MessageBubble
                        item={item}
                    />

                )}

                showsVerticalScrollIndicator={
                    false
                }

                contentContainerStyle={
                    styles.messagesContent
                }

                ListHeaderComponent={
                    <DateHeader />
                }

                onContentSizeChange={() => {

                    setTimeout(() => {

                        flatListRef.current?.scrollToEnd({
                            animated: false,
                        });

                    }, 50);

                }}
            />


            {/* =================================================
                INPUT
            ================================================= */}

            <View
                style={
                    styles.inputContainer
                }
            >

                <TouchableOpacity
                    style={
                        styles.attachmentButton
                    }
                    activeOpacity={0.8}
                >

                    <Paperclip
                        size={25}
                        color={
                            colors.text
                        }
                    />

                </TouchableOpacity>


                <TextInput
                    value={message}
                    onChangeText={
                        setMessage
                    }
                    placeholder="Type message..."
                    placeholderTextColor={
                        colors.textSecondary
                    }
                    style={
                        styles.messageInput
                    }
                    multiline
                    maxLength={2000}
                />


                <TouchableOpacity
                    style={
                        styles.sendButton
                    }
                    activeOpacity={0.85}
                    onPress={
                        sendMessage
                    }
                >

                    <Send
                        size={23}
                        color="#FFFFFF"
                        fill="#FFFFFF"
                    />

                </TouchableOpacity>

            </View>

        </KeyboardAvoidingView>
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

        chatHeader: {
            minHeight: 90,

            paddingHorizontal: 17,

            paddingTop:
                Platform.OS === 'ios'
                    ? 8
                    : 8,

            paddingBottom: 12,

            backgroundColor:
                colors.white,

            borderBottomWidth: 1,

            borderBottomColor:
                '#DFE0E2',

            flexDirection: 'row',

            alignItems: 'center',
        },


        backButton: {
            width: 48,

            height: 48,

            borderRadius: 24,

            backgroundColor:
                '#F0F1F3',

            alignItems: 'center',

            justifyContent: 'center',

            marginRight: 12,
        },


        headerInfo: {
            flex: 1,

            justifyContent:
                'center',

            minWidth: 0,
        },


        chatTitle: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 21,

            lineHeight: 26,

            color:
                colors.text,
        },


        activeMembers: {
            fontFamily:
                fonts.regular,

            fontSize: 14,

            lineHeight: 20,

            color:
                colors.textSecondary,

            marginTop: 1,
        },


        phoneButton: {
            width: 45,

            height: 45,

            alignItems: 'center',

            justifyContent: 'center',

            marginLeft: 8,
        },


        // =================================================
        // MESSAGES
        // =================================================

        messagesContent: {
            paddingHorizontal: 20,

            paddingTop: 6,

            paddingBottom: 20,
        },


        dateHeader: {
            alignItems: 'center',

            paddingVertical: 18,

            marginBottom: 4,
        },


        dateText: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 14,

            color:
                colors.textSecondary,
        },


        // =================================================
        // OTHER USER
        // =================================================

        otherMessageContainer: {
            flexDirection: 'row',

            alignItems: 'flex-start',

            marginBottom: 18,

            paddingRight: 20,
        },


        messageAvatar: {
            width: 38,

            height: 38,

            borderRadius: 19,

            backgroundColor:
                '#D8E2DF',

            alignItems: 'center',

            justifyContent: 'center',

            marginRight: 10,

            marginTop: 2,
        },


        messageAvatarText: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 13,

            color:
                '#005B4F',
        },


        otherMessageContent: {
            flex: 1,

            maxWidth: '88%',
        },


        senderName: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 13,

            lineHeight: 18,

            color:
                colors.textSecondary,

            marginBottom: 4,
        },


        otherBubble: {
            alignSelf: 'flex-start',

            backgroundColor:
                colors.white,

            borderRadius: 21,

            borderTopLeftRadius: 5,

            paddingHorizontal: 18,

            paddingVertical: 13,

            borderWidth: 1,

            borderColor:
                '#F0F0F0',
        },


        otherMessageText: {
            fontFamily:
                fonts.regular,

            fontSize: 16.5,

            lineHeight: 24,

            color:
                colors.text,
        },


        otherTime: {
            fontFamily:
                fonts.regular,

            fontSize: 11,

            color:
                colors.textSecondary,

            marginTop: 5,
        },


        // =================================================
        // MY MESSAGE
        // =================================================

        myMessageContainer: {
            alignItems: 'flex-end',

            marginBottom: 18,

            paddingLeft: 45,
        },


        myBubble: {
            backgroundColor:
                colors.primaryDark,

            borderRadius: 21,

            borderTopRightRadius: 5,

            paddingHorizontal: 19,

            paddingVertical: 13,

            maxWidth: '90%',
        },


        myMessageText: {
            fontFamily:
                fonts.regular,

            fontSize: 16.5,

            lineHeight: 24,

            color:
                '#FFFFFF',
        },


        myTime: {
            fontFamily:
                fonts.regular,

            fontSize: 11,

            color:
                colors.textSecondary,

            marginTop: 5,

            marginRight: 3,
        },


        // =================================================
        // SYSTEM MESSAGE
        // =================================================

        systemMessage: {
            alignItems: 'center',

            paddingHorizontal: 20,

            marginTop: 4,

            marginBottom: 20,
        },


        systemMessageText: {
            fontFamily:
                fonts.semibold,

            fontSize: 14,

            lineHeight: 20,

            color:
                colors.textSecondary,

            textAlign: 'center',
        },


        // =================================================
        // INPUT
        // =================================================

        inputContainer: {
            minHeight: 82,

            backgroundColor:
                colors.white,

            borderTopWidth: 1,

            borderTopColor:
                '#E1E2E4',

            paddingHorizontal: 17,

            paddingVertical: 12,

            flexDirection: 'row',

            alignItems: 'center',
        },


        attachmentButton: {
            width: 52,

            height: 52,

            borderRadius: 26,

            backgroundColor:
                '#F0F1F3',

            alignItems: 'center',

            justifyContent: 'center',

            marginRight: 9,
        },


        messageInput: {
            flex: 1,

            minHeight: 52,

            maxHeight: 100,

            borderRadius: 27,

            backgroundColor:
                '#F0F1F3',

            paddingHorizontal: 19,

            paddingVertical: 13,

            fontFamily:
                fonts.regular,

            fontSize: 16,

            color:
                colors.text,

            textAlignVertical: 'center',
        },


        sendButton: {
            width: 54,

            height: 54,

            borderRadius: 27,

            backgroundColor:
                colors.primaryDark,

            alignItems: 'center',

            justifyContent: 'center',

            marginLeft: 10,
        },

    });