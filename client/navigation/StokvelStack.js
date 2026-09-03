import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MyStokvelsScreen from '../screens/Stokvel/MyStokvelsScreen';
import StokvelDetailsScreen from '../screens/Stokvel/StokvelDetailsScreen';
import GroupSettingsScreen from '../screens/Stokvel/GroupSettingsScreen';
import CreateStokvelScreen from '../screens/Stokvel/CreateStokvelScreen';
// import JoinStokvelScreen from '../screens/Stokvel/JoinStokvelScreen';
import InviteMemberScreen from '../screens/Stokvel/InviteMemberScreen';
import MemberProfileScreen from '../screens/Stokvel/MemberProfileScreen';

const Stack = createNativeStackNavigator();

export default function StokvelStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="MyStokvels"
                component={MyStokvelsScreen}
            />

            <Stack.Screen
                name="StokvelDetail"
                component={StokvelDetailsScreen}
            />

            <Stack.Screen 
                name="GroupSettings"
                component={GroupSettingsScreen}
            />

            <Stack.Screen 
                name='InviteMember'
                component={InviteMemberScreen}
            />

            <Stack.Screen 
                name='MemberProfile'
                component={MemberProfileScreen}
            />

            <Stack.Screen
                name="CreateStokvel"
                component={CreateStokvelScreen}
            />

            {/* <Stack.Screen
                name="JoinStokvel"
                component={JoinStokvelScreen}
            /> */}
        </Stack.Navigator>
    );
}