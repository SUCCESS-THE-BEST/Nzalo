import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WalletScreen from '../screens/Wallet/WalletScreen';
import DepositFundsScreen from '../screens/Wallet/DepositFundsScreen';
import WithdrawFundsScreen from '../screens/Wallet/WithdrawFundsScreen';
import PayContributionScreen from '../screens/Wallet/PayContributionScreen';
import PaymentSuccessScreen from '../screens/Wallet/PaymentSuccessScreen';
import PaymentFailedScreen from '../screens/Wallet/PaymentFailedScreen';
import PaystackCheckout from '../screens/Payments/PaystackCheckout';

const Stack = createNativeStackNavigator();

export default function WalletStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="WalletMain"
                component={WalletScreen}
            />

            <Stack.Screen
                name="DepositFunds"
                component={DepositFundsScreen}
            />

            <Stack.Screen
                name="WithdrawFunds"
                component={WithdrawFundsScreen}
            />

            <Stack.Screen
                name="PayContribution"
                component={PayContributionScreen}
            />

            <Stack.Screen
                name="PaystackCheckout"
                component={PaystackCheckout}
            />

            <Stack.Screen
                name="PaymentSuccess"
                component={PaymentSuccessScreen}
            />

            <Stack.Screen
                name="PaymentFailed"
                component={PaymentFailedScreen}
            />
        </Stack.Navigator>
    );
}