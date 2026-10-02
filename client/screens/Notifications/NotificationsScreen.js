import React, { useEffect, useMemo, useState } from 'react';

import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    Bell,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    UserPlus,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { supabase } from '../../config/supabase';



// =========================================================
// MOCK NOTIFICATIONS
// =========================================================

// const MOCK_NOTIFICATIONS = [
//     {
//         id: '1',

//         type: 'contribution',

//         title: 'Monthly Contribution Reminder',

//         message:
//             'Bambani Stokvel R3,000 is due in 3 days.',

//         time: '2h ago',

//         unread: true,
//     },

//     {
//         id: '2',

//         type: 'payout',

//         title: 'Payout Disbursed Successfully',

//         message:
//             'R12,340.00 paid to Thabo Molefe.',

//         time: '1d ago',

//         unread: false,
//     },

//     {
//         id: '3',

//         type: 'meeting',

//         title: 'Meeting Invite: AGM 2026',

//         message:
//             'Group AGM scheduled for March 1 at 14:00.',

//         time: '2d ago',

//         unread: false,
//     },

//     {
//         id: '4',

//         type: 'member',

//         title: 'New Member Request',

//         message:
//             'Lerato Khumalo requested to join your Stokvel.',

//         time: '3d ago',

//         unread: false,
//     },
// ];


// =========================================================
// NOTIFICATION ICON
// =========================================================

function NotificationIcon({
    type,
}) {

    let Icon = Bell;

    let backgroundColor = '#F1F2F4';

    let iconColor = '#6B7280';


    switch (type) {

        case 'contribution':

            Icon = CreditCard;

            backgroundColor = '#004D40';

            iconColor = '#FFFFFF';

            break;


        case 'payout':

            Icon = CheckCircle2;

            backgroundColor = '#F0F1F3';

            iconColor = '#6B7280';

            break;


        case 'meeting':

            Icon = CalendarDays;

            backgroundColor = '#F0F1F3';

            iconColor = '#6B7280';

            break;


        case 'member':

            Icon = UserPlus;

            backgroundColor = '#F0F1F3';

            iconColor = '#6B7280';

            break;


        default:

            Icon = Bell;

            break;
    }


    return (
        <View
            style={[
                styles.notificationIcon,
                {
                    backgroundColor,
                },
            ]}
        >

            <Icon
                size={23}
                color={iconColor}
                strokeWidth={2.2}
            />

        </View>
    );
}


// =========================================================
// NOTIFICATION ITEM
// =========================================================

function NotificationItem({
    item,
    onPress,
}) {

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={[
                styles.notificationItem,

                item.unread &&
                    styles.unreadNotification,
            ]}
            onPress={() =>
                onPress(item)
            }
        >

            <NotificationIcon
                type={item.type}
            />


            <View
                style={
                    styles.notificationContent
                }
            >

                <View
                    style={
                        styles.notificationTitleRow
                    }
                >

                    <Text
                        style={
                            styles.notificationTitle
                        }
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>


                    <Text
                        style={
                            styles.notificationTime
                        }
                    >
                        {item.time}
                    </Text>

                </View>


                <Text
                    style={
                        styles.notificationMessage
                    }
                    numberOfLines={2}
                >
                    {item.message}
                </Text>

            </View>

        </TouchableOpacity>
    );
}


// =========================================================
// EMPTY STATE
// =========================================================

function EmptyNotifications({
    onGoHome,
}) {

    return (
        <View
            style={
                styles.emptyState
            }
        >

            {/* Bell illustration */}

            <View
                style={
                    styles.emptyBellCircle
                }
            >

                <Bell
                    size={68}
                    color="#454545"
                    strokeWidth={1.5}
                />

                <View
                    style={
                        styles.bellCheck
                    }
                >

                    <CheckCircle2
                        size={27}
                        color="#454545"
                        strokeWidth={1.8}
                    />

                </View>

            </View>


            {/* Title */}

            <Text
                style={
                    styles.emptyTitle
                }
            >
                All Caught Up!
            </Text>


            {/* Description */}

            <Text
                style={
                    styles.emptyDescription
                }
            >
                You have no new notifications. We'll
                let you know when something important
                happens.
            </Text>


            {/* Home button */}

            <TouchableOpacity
                activeOpacity={0.85}
                style={
                    styles.goHomeButton
                }
                onPress={onGoHome}
            >

                <Text
                    style={
                        styles.goHomeButtonText
                    }
                >
                    Go to Home
                </Text>

            </TouchableOpacity>

        </View>
    );
}


// =========================================================
// MAIN SCREEN
// =========================================================
function formatNotificationTime(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();

    const differenceInSeconds = Math.floor(
        (now - created) / 1000
    );

    if (differenceInSeconds < 60) {
        return 'Just now';
    }

    const differenceInMinutes = Math.floor(
        differenceInSeconds / 60
    );

    if (differenceInMinutes < 60) {
        return `${differenceInMinutes}m ago`;
    }

    const differenceInHours = Math.floor(
        differenceInMinutes / 60
    );

    if (differenceInHours < 24) {
        return `${differenceInHours}h ago`;
    }

    const differenceInDays = Math.floor(
        differenceInHours / 24
    );

    if (differenceInDays < 7) {
        return `${differenceInDays}d ago`;
    }

    return created.toLocaleDateString();
}

export default function NotificationsScreen({
    
    navigation,
    route,
}) {

    /*
     * For now this is controlled by mock data.
     *
     * Later we will replace this with:
     *
     * const notifications = ...
     *
     * from Supabase.
     */

    // const [notifications, setNotifications] =
    //     useState(MOCK_NOTIFICATIONS);

const [notifications, setNotifications] =
    useState([]);

    useEffect(() => {
    fetchNotifications();
}, []);

const fetchNotifications = async () => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(
            'Error fetching notifications:',
            error
        );
        return;
    }

    const formattedNotifications = data.map(
        (notification) => ({
            ...notification,

            unread: !notification.is_read,

            time: formatNotificationTime(
                notification.created_at
            ),
        })
    );

    setNotifications(
        formattedNotifications
    );
};
    /*
     * You can force the empty state from
     * navigation if needed:
     *
     * navigation.navigate('Notifications', {
     *     empty: true
     * })
     */

    const showEmptyState =
        route?.params?.empty === true;


    // =====================================================
    // UNREAD COUNT
    // =====================================================

    const unreadCount =
        useMemo(
            () =>
                notifications.filter(
                    (item) =>
                        item.unread
                ).length,

            [notifications]
        );


    // =====================================================
    // HANDLE NOTIFICATION
    // =====================================================

   const handleNotificationPress = async (item) => {
    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
        })
        .eq('id', item.id);

    if (error) {
        console.error(
            'Error marking notification as read:',
            error
        );
        return;
    }

    setNotifications((current) =>
        current.map((notification) =>
            notification.id === item.id
                ? {
                      ...notification,
                      unread: false,
                      is_read: true,
                  }
                : notification
        )
    );

    // Member request notification
    if (item.type === 'member') {
        navigation.navigate('Stokvels', {
            screen: 'JoinRequests',
            params: {
                stokvelId: item.stokvel_id,
            },
        });

        return;
    }

    // Approved notification
    if (item.type === 'member_approved') {
        navigation.navigate('Stokvels', {
            screen: 'StokvelDetail',
            params: {
                id: item.stokvel_id,
            },
        });

        return;
    }

    // Rejected notification
    // No navigation. It is simply marked as read.

      /*
             * Later we can navigate based
             * on notification type.
             *
             * Example:
             *
             * contribution
             * -> StokvelDetail
             *
             * payout
             * -> Wallet
             *
             * member
             * -> JoinRequests: success has done this part
             */
};
  

     

 

    // =====================================================
    // GO HOME
    // =====================================================

    const goHome = () => {

        navigation.navigate(
            'HomeMain'
        );

    };


    // =====================================================
    // EMPTY SCREEN
    // =====================================================

    if (
        showEmptyState ||
        notifications.length === 0
    ) {

        return (
            <View
                style={
                    styles.container
                }
            >

                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#FFFFFF"
                />


                {/* =========================================
                    HEADER
                ========================================= */}

                <View
                    style={
                        styles.header
                    }
                >

                    <Text
                        style={
                            styles.title
                        }
                    >
                        Notifications
                    </Text>


                    <Text
                        style={
                            styles.subtitle
                        }
                    >
                        Stay updated with your Stokvel activity
                    </Text>

                </View>


                {/* =========================================
                    EMPTY STATE
                ========================================= */}

                <EmptyNotifications
                    onGoHome={
                        goHome
                    }
                />

            </View>
        );
    }


    // =====================================================
    // NOTIFICATION LIST
    // =====================================================

    return (
        <View
            style={
                styles.container
            }
        >

            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFFFF"
            />


            {/* =============================================
                HEADER
            ============================================= */}

            <View
                style={
                    styles.header
                }
            >

                <View
                    style={
                        styles.titleRow
                    }
                >

                    <Text
                        style={
                            styles.title
                        }
                    >
                        Notifications
                    </Text>


                    {unreadCount > 0 && (

                        <View
                            style={
                                styles.unreadCount
                            }
                        >

                            <Text
                                style={
                                    styles.unreadCountText
                                }
                            >
                                {unreadCount}
                            </Text>

                        </View>

                    )}

                </View>

            </View>


            {/* =============================================
                LIST
            ============================================= */}

            <FlatList
                data={
                    notifications
                }

                keyExtractor={
                    (item) =>
                        item.id
                }

                renderItem={({
                    item,
                }) => (

                    <NotificationItem
                        item={item}
                        onPress={
                            handleNotificationPress
                        }
                    />

                )}

                showsVerticalScrollIndicator={
                    false
                }

                contentContainerStyle={
                    styles.listContent
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

        // =================================================
        // CONTAINER
        // =================================================

        container: {
            flex: 1,

            backgroundColor:
                '#F7F8F9',
        },


        // =================================================
        // HEADER
        // =================================================

        header: {
            paddingHorizontal: 30,

            paddingTop: 32,

            paddingBottom: 18,

            backgroundColor:
                '#F7F8F9',
        },


        titleRow: {
            flexDirection: 'row',

            alignItems: 'center',
        },


        title: {
            fontFamily:
                'Outfit_700Bold',

            fontSize: 34,

            lineHeight: 41,

            color:
                '#171925',

            letterSpacing: -0.7,
        },


        subtitle: {
            fontFamily:
                'Outfit_500Medium',

            fontSize: 18,

            lineHeight: 25,

            color:
                '#6B7280',

            marginTop: 5,
        },


        unreadCount: {
            minWidth: 28,

            height: 28,

            borderRadius: 14,

            backgroundColor:
                '#005B4F',

            alignItems: 'center',

            justifyContent: 'center',

            marginLeft: 12,
        },


        unreadCountText: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 13,

            color:
                '#FFFFFF',
        },


        // =================================================
        // LIST
        // =================================================

        listContent: {
            paddingHorizontal: 23,

            paddingBottom: 30,
        },


        // =================================================
        // NOTIFICATION
        // =================================================

        notificationItem: {
            minHeight: 98,

            paddingHorizontal: 20,

            paddingVertical: 17,

            backgroundColor:
                '#F7F8F9',

            borderBottomWidth: 1,

            borderBottomColor:
                '#DCDDE0',

            flexDirection: 'row',

            alignItems: 'center',
        },


        unreadNotification: {
            backgroundColor:
                '#F7F8F9',
        },


        notificationIcon: {
            width: 50,

            height: 50,

            borderRadius: 16,

            alignItems: 'center',

            justifyContent: 'center',

            marginRight: 17,
        },


        notificationContent: {
            flex: 1,

            minWidth: 0,
        },


        notificationTitleRow: {
            flexDirection: 'row',

            alignItems: 'center',

            justifyContent:
                'space-between',
        },


        notificationTitle: {
            flex: 1,

            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 18,

            lineHeight: 23,

            color:
                '#171925',

            marginRight: 10,
        },


        notificationTime: {
            fontFamily:
                'Outfit_400Regular',

            fontSize: 14,

            color:
                '#6B7280',

            marginLeft: 5,
        },


        notificationMessage: {
            fontFamily:
                'Outfit_400Regular',

            fontSize: 16,

            lineHeight: 22,

            color:
                '#6B7280',

            marginTop: 4,
        },


        // =================================================
        // EMPTY STATE
        // =================================================

        emptyState: {
            flex: 1,

            alignItems: 'center',

            justifyContent: 'center',

            paddingHorizontal: 45,

            paddingBottom: 50,
        },


        emptyBellCircle: {
            width: 174,

            height: 174,

            borderRadius: 87,

            backgroundColor:
                '#EAEAE5',

            alignItems: 'center',

            justifyContent: 'center',

            position: 'relative',

            marginBottom: 36,
        },


        bellCheck: {
            position: 'absolute',

            right: 45,

            bottom: 43,

            backgroundColor:
                '#EAEAE5',

            borderRadius: 20,
        },


        emptyTitle: {
            fontFamily:
                'Outfit_700Bold',

            fontSize: 27,

            lineHeight: 34,

            color:
                '#171925',

            textAlign: 'center',
        },


        emptyDescription: {
            fontFamily:
                'Outfit_400Regular',

            fontSize: 17,

            lineHeight: 25,

            color:
                '#6B7280',

            textAlign: 'center',

            marginTop: 10,

            maxWidth: 400,
        },


        goHomeButton: {
            width: '100%',

            height: 69,

            borderRadius: 35,

            backgroundColor:
                '#003F36',

            alignItems: 'center',

            justifyContent: 'center',

            marginTop: 32,
        },


        goHomeButtonText: {
            fontFamily:
                'Outfit_600SemiBold',

            fontSize: 19,

            color:
                '#FFFFFF',
        },

    });