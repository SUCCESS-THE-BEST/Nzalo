import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >

            <Stack.Screen
                name="HomeMain"
                component={HomeScreen}
            />

            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
            />

            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
            />

        </Stack.Navigator>
    );
}