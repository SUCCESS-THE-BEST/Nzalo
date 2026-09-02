import {
    StyleSheet,
    Text,
    View,
    Pressable,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

export default function WelcomeScreen({ navigation }) {

    return (
        <View style={styles.container}>
            
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.gradientBox}
            >

                <View style={styles.content}>

                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>S</Text>
                    </View>

                    <Text style={styles.title}>
                        StokFela
                    </Text>

                    <Text style={styles.subtitle}>
                        Your trusted stokvel, digitized.
                    </Text>

                </View>

                <View style={styles.bottom}>

                    <Pressable
                        style={styles.button}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.buttonText}>
                            GET STARTED
                        </Text>
                    </Pressable>

                    <Text style={styles.loginText}>
                        Already have an account?
                    </Text>

                    <Pressable
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButton}>
                            Log in
                        </Text>
                    </Pressable>

                </View>

            </LinearGradient>


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    gradientBox: {
        height: '100%',
        width: '100%',
        padding: 26,
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },

    logo: {
        fontSize: 30,
        fontWeight: '700',
        color: colors.primary,
    },

    title: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.white,
    },

    subtitle: {
        marginTop: 8,
        fontSize: 15,
        color: colors.white,
        opacity: 0.8,
    },

    bottom: {
        paddingBottom: 35,
        alignItems: 'center',
    },

    button: {
        width: '100%',
        backgroundColor: colors.white,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 16,
    },

    buttonText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },

    loginText: {
        color: colors.white,
        opacity: 0.7,
        fontSize: 13,
    },

    loginButton: {
        color: colors.white,
        fontWeight: '700',
        marginTop: 6,
    },
});