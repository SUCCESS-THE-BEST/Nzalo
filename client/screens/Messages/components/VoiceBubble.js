import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';

import { colors } from '../../../theme/colors';
import { fonts } from '../../../theme/fonts';


export default function VoiceBubble({ item, voice, onLongPress }) {
    const active = voice.activeId === item.id;
    const playing = active && voice.playing;
    const progress = active ? voice.progress : 0;
    const mine = item.mine;
    const iconColor = mine ? colors.primaryDark : '#FFFFFF';

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => voice.toggle(item)}
            onLongPress={onLongPress}
            delayLongPress={350}
            style={[
                styles.voiceBubble,
                mine ? styles.voiceBubbleMine : styles.voiceBubbleOther,
            ]}
        >
            <View
                style={[
                    styles.voicePlay,
                    mine ? styles.voicePlayMine : styles.voicePlayOther,
                ]}
            >
                {playing ? (
                    <Pause size={18} color={iconColor} fill={iconColor} />
                ) : (
                    <Play size={18} color={iconColor} fill={iconColor} />
                )}
            </View>

            <View style={styles.voiceBody}>
                <View
                    style={[
                        styles.voiceTrack,
                        mine ? styles.voiceTrackMine : styles.voiceTrackOther,
                    ]}
                >
                    <View
                        style={[
                            styles.voiceFill,
                            mine ? styles.voiceFillMine : styles.voiceFillOther,
                            { width: `${Math.min(100, progress * 100)}%` },
                        ]}
                    />
                </View>

                <Text style={[styles.voiceLabel, mine && styles.voiceLabelMine]}>
                    {active
                    ? `${voice.formatDuration(voice.currentTime)} / ${voice.formatDuration(voice.duration)}`
                    : 'Voice note'}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    voiceBubble: {
        minWidth: 210,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    voiceBubbleMine: {
        backgroundColor: colors.primaryDark,
        borderTopRightRadius: 5,
    },
    voiceBubbleOther: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderTopLeftRadius: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    voicePlay: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    voicePlayMine: { backgroundColor: '#FFFFFF' },
    voicePlayOther: { backgroundColor: colors.primaryDark },
    voiceBody: { flex: 1 },
    voiceTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 6,
    },
    voiceTrackMine: { backgroundColor: 'rgba(255,255,255,0.35)' },
    voiceTrackOther: { backgroundColor: '#E1E2E4' },
    voiceFill: { height: '100%', borderRadius: 2 },
    voiceFillMine: { backgroundColor: '#FFFFFF' },
    voiceFillOther: { backgroundColor: colors.primaryDark },
    voiceLabel: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },
    voiceLabelMine: { color: '#FFFFFF' },
});