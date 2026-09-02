import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import VerifyNumberScreen from '../screens/Auth/VerifyNumberScreen';
import VerifyEmailScreen from '../screens/Auth/VerifyEmailScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >

            <Stack.Screen
                name="Welcome"
                component={WelcomeScreen}
            />

            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />

            <Stack.Screen
                name="Register"
                component={RegisterScreen}
            />

            <Stack.Screen
                name="VerifyNumber"
                component={VerifyNumberScreen}
            />

            <Stack.Screen
                name="VerifyEmail"
                component={VerifyEmailScreen}
            />

        </Stack.Navigator>
    );
}