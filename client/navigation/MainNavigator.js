import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { View, Text, StyleSheet } from 'react-native';
import { Home, Search, MessageCircle, User,Compass, Import, Bot, Users2 } from 'lucide-react-native';

import HomeScreen from '../screens/Home/HomeScreen';
import MyStokvelsScreen from '../screens/Stokvel/MyStokvelsScreen';

import HomeStack from './HomeStack';

import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const Tab = createBottomTabNavigator();

function TabIcon({ focused, Icon }) {

    return (
        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
            <Icon
                color={focused ? colors.white : colors.textSecondary}
                size={22}
            />
        </View>
    );
}

function TabLabel({ focused, label }) {

    if (!focused) {
        return null;
    }

    return (
        <Text style={styles.label}>
            {label}
        </Text>
    );
}

export default function MainNavigator() {

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: styles.tabBar,
                tabBarItemStyle: styles.tabItem,
            }}
        >

            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={Home} />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <TabLabel focused={focused} label="HOME" />
                    ),
                }}
            />

            <Tab.Screen
                name="Stokvels"
                component={MyStokvelsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={Users2} />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <TabLabel focused={focused} label="MY STOKVELS" />
                    ),
                }}
            />

            <Tab.Screen
                name="Messages"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={MessageCircle} />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <TabLabel focused={focused} label="MESSAGES" />
                    ),
                }}
            />

            <Tab.Screen
                name="Explore"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={Search} />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <TabLabel focused={focused} label="EXPLORE" />
                    ),
                }}
            />

        </Tab.Navigator>
    );
}


const styles = StyleSheet.create({

    tabBar: {
        height: 100,
        paddingTop: 10,
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
        backgroundColor: colors.white,
        overflow: 'visible',
        marginBottom: 5,
    },

    tabItem: {
        paddingTop: 4,
    },

    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },

    iconWrapperActive: {
        backgroundColor: colors.primary,
        marginTop: -40,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },

    label: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.primary,
        marginTop: -2,
    },

});