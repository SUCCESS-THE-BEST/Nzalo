import {
    StyleSheet,
    Text,
    View,
    Pressable,
    Image,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>

            <View style={styles.top}>
                <Image
                    source={require('../../assets/welcomeBG.jpeg')}
                    style={styles.image}
                    resizeMode="cover"
                />

                <View style={styles.overlay} pointerEvents="none">
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                <View style={styles.brandRow}>
                    <Image
        source={require('../../assets/nzalo-logo-white.png')}
        style={styles.logo}
        resizeMode="contain"
    />
                </View>
            </View>

            <View style={styles.sheet}>

                <Text style={styles.title}>
                    Your trusted stokvel, digitized
                </Text>

                <Text style={styles.subtitle}>
                    Save together, track contributions and get paid out
                    on time, all in one place.
                </Text>

                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                    ]}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.buttonText}>Get started</Text>
                </Pressable>

                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>
                        Already have an account?
                    </Text>
                    <Pressable
                        onPress={() => navigation.navigate('Login')}
                        hitSlop={10}
                    >
                        <Text style={styles.loginButton}> Log in</Text>
                    </Pressable>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },

    top: {
        flex: 1,
        backgroundColor: colors.primaryDark,
    },

    image: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        opacity:0.7,
    },

 

    brandRow: {
        position: 'absolute',
        top: 60,
        left: 26,
        flexDirection: 'row',
        alignItems: 'center',
    },

   logo: {
    width: 90,
    height:70,
   }
,
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        marginTop: -32,
        paddingTop: 36,
        paddingHorizontal: 26,
        paddingBottom: 40,
        alignItems: 'center',
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
        textAlign: 'center',
        color: colors.primaryDark,
    },

    subtitle: {
        marginTop: 12,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        color: colors.primaryDark,
        opacity: 0.6,
    },

    button: {
        width: '100%',
        marginTop: 32,
        backgroundColor: colors.primary,
        paddingVertical: 17,
        borderRadius: 30,
        alignItems: 'center',
    },

    buttonPressed: {
        opacity: 0.85,
    },

    buttonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },

    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },

    loginText: {
        color: colors.primaryDark,
        opacity: 0.6,
        fontSize: 14,
    },

    loginButton: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});