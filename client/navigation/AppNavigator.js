import { ActivityIndicator, View } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useAuth } from '../context/AuthContext';

export default function AppNavigator() {

    const {
        session,
        loading,
    } = useAuth();

    // Wait until Supabase checks the existing session
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return session
        ? <MainNavigator />
        : <AuthNavigator />;
}