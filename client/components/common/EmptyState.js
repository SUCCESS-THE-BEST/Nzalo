import {
    StyleSheet,
    Text,
    View,
    Pressable,
    FlatList,
    TextInput,
    Image
} from 'react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

// import { PiggyBank } from 'lucide-react-native';

export default function EmptyState({ onCreate, onJoin, PiggyBank }) {

    return (
        <View style={styles.emptyState}>

            <View style={styles.emptyIconWrapper}>
                <PiggyBank size={40} color={colors.primary} />
            </View>

            <Text style={styles.emptyTitle}>
                No Stokvels Yet
            </Text>

            <Text style={styles.emptySubtitle}>
                Join an existing stokvel or create your own to start saving together.
            </Text>

            <Pressable style={styles.createButton} onPress={onCreate}>
                <Text style={styles.createButtonText}>
                    Create a Stokvel
                </Text>
            </Pressable>

            <Pressable style={styles.joinButton} onPress={onJoin}>
                <Text style={styles.joinButtonText}>
                    Join a Stokvel
                </Text>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 10,
    },

    emptyIconWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },

    emptyTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 18,
        color: colors.text,
        marginBottom: 8,
    },

    emptySubtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 19,
    },

    createButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 30,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },

    createButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },

    joinButton: {
        borderRadius: 30,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },

    joinButtonText: {
        color: colors.text,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },
})