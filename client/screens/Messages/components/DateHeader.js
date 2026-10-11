import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../theme/colors';

export default function DateHeader() {
    const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <View style={styles.dateHeader}>
            <Text style={styles.dateText}>Today, {today}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    dateHeader: {
        alignItems: 'center',
        paddingVertical: 14,
        marginBottom: 4,
    },
    dateText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 13,
        color: colors.textSecondary,
    },
});