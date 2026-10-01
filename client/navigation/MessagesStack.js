import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MessagesScreen from '../screens/Messages/MessagesScreen';
import ChatScreen from '../screens/Messages/ChatScreen';

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="MessagesMain"
                component={MessagesScreen}
            />

            <Stack.Screen
                name="Chat"
                component={ChatScreen}
            />
        </Stack.Navigator>
    );
}