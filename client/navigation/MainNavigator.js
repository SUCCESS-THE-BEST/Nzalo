import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
    View,
    Text,
    StyleSheet,
    Pressable,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, MessageCircle, User,Compass, Import, Bot, Users2, PlusCircle, CreditCard } from 'lucide-react-native';

import HomeScreen from '../screens/Home/HomeScreen';

import ExploreStack from './ExploreStack';
import HomeStack from './HomeStack';
import StokvelStack from './StokvelStack';
import WalletStack from './WalletStack';

import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Tab = createBottomTabNavigator();

function TabIcon({ focused, Icon }) {

    return (
        <Icon
            color={focused ? colors.primaryDark : colors.white}
            size={21}
            strokeWidth={focused ? 2.4 : 2}
        />
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

function FloatingTabBar({ state, descriptors, navigation }) {

    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.wrapper,
                { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
        >
            <View style={styles.bar}>

                {state.routes.map((route, index) => {

                    const { options } = descriptors[route.key];
                    const focused = state.index === index;

                    function onPress() {

                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!focused && !event.defaultPrevented) {
                            LayoutAnimation.configureNext(
                                LayoutAnimation.create(
                                    220,
                                    LayoutAnimation.Types.easeInEaseOut,
                                    LayoutAnimation.Properties.opacity
                                )
                            );

                            navigation.navigate(route.name, route.params);
                        }
                    }

                    function onLongPress() {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    }

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            accessibilityRole="button"
                            accessibilityState={focused ? { selected: true } : {}}
                            accessibilityLabel={route.name}
                            style={[
                                styles.item,
                                focused && styles.itemActive,
                            ]}
                        >
                            {options.tabBarIcon?.({
                                focused,
                                color: focused ? colors.primaryDark : colors.white,
                                size: 21,
                            })}

                            {options.tabBarLabel?.({
                                focused,
                                color: colors.primaryDark,
                                children: route.name,
                            })}
                        </Pressable>
                    );
                })}

            </View>
        </View>
    );
}

export default function MainNavigator() {

    return (
        <Tab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{
                headerShown: false,
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
                component={StokvelStack}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={Users2} />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <TabLabel focused={focused} label="STOKVELS" />
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
                name="Wallet"
                component={WalletStack}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={CreditCard} />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <TabLabel focused={focused} label="WALLET" />
                    ),
                }}
            />

            <Tab.Screen
                name="Explore"
                component={ExploreStack}
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

    wrapper: {
        paddingHorizontal: 20,
        paddingTop: 8,
        backgroundColor: colors.background,
    },

    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        paddingHorizontal: 10,
        borderRadius: 32,
        backgroundColor: colors.primary,
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
        elevation: 8,
    },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 32,
        minWidth: 42,
        borderRadius: 22,
    },

    itemActive: {
        paddingHorizontal: 14,
        gap: 5,
        backgroundColor:colors.white,
    },

    label: {
        fontFamily: fonts.semibold,
        fontSize: 10.5,
        letterSpacing: 0.5,
        color: colors.primaryDark,
    },

});