import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home/HomeScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import StokvelDetailsScreen from '../screens/Stokvel/StokvelDetailsScreen';
import MemberProfileScreen from '../screens/Stokvel/MemberProfileScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="StokvelDetail" component={StokvelDetailsScreen} />
            <Stack.Screen name='MemberProfile' component={MemberProfileScreen} />
        </Stack.Navigator>
    );
}