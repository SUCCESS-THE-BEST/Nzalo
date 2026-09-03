import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ExploreScreen from '../screens/Stokvel/ExploreScreen';
import CreateStokvelScreen from '../screens/Stokvel/CreateStokvelScreen';

const Stack = createNativeStackNavigator();

export default function ExploreStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="ExploreScreen"
                component={ExploreScreen}
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