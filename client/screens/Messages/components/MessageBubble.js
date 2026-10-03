import {
    ActivityIndicator,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Download, FileText } from 'lucide-react-native';

import { colors } from '../../../theme/colors';
import { fonts } from '../../../theme/fonts';
import VoiceBubble from './VoiceBubble';

export default function MessageBubble({
    item,
    voice,
    onLongPress,
    onOpenImage,
    onDownloadFile,
    downloading,
}) {
    if (item.type === 'system') {
        return (
            <View style={styles.systemMessage}>
                <Text style={styles.systemMessageText}>{item.message}</Text>
            </View>
        );
    }

    const handleLongPress = item.mine ? () => onLongPress(item) : undefined;

    const fileIconColor = item.mine ? colors.primaryDark : '#FFFFFF';

    let bubble;

    if (item.type === 'audio') {

        bubble = (
            <VoiceBubble
                item={item}
                voice={voice}
                onLongPress={handleLongPress}
            />
        );

    } else if (item.type === 'image') {

        bubble = (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onOpenImage(item.message)}
                onLongPress={handleLongPress}
                delayLongPress={350}
                style={[
                    styles.imageBubble,
                    item.mine ? styles.imageBubbleMine : styles.imageBubbleOther,
                ]}
            >
                <Image
                    source={{ uri: item.message }}
                    style={styles.imageContent}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );

    } else if (item.type === 'file') {

        bubble = (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Linking.openURL(item.message)}
                onLongPress={handleLongPress}
                delayLongPress={350}
                style={[
                    styles.fileBubble,
                    item.mine ? styles.fileBubbleMine : styles.fileBubbleOther,
                ]}
            >
                <View
                    style={[
                        styles.fileIcon,
                        item.mine ? styles.fileIconMine : styles.fileIconOther,
                    ]}
                >
                    <FileText size={20} color={fileIconColor} />
                </View>

                <View style={styles.fileInfo}>
                    <Text
                        style={[styles.fileName, item.mine && styles.fileNameMine]}
                        numberOfLines={2}
                    >
                        {item.fileName}
                    </Text>

                    <Text style={[styles.fileHint, item.mine && styles.fileHintMine]}>
                        Tap to open
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.fileDownload,
                        item.mine
                            ? styles.fileDownloadMine
                            : styles.fileDownloadOther,
                    ]}
                    activeOpacity={0.8}
                    disabled={downloading}
                    onPress={() => onDownloadFile(item)}
                >
                    {downloading ? (
                        <ActivityIndicator size="small" color={fileIconColor} />
                    ) : (
                        <Download size={18} color={fileIconColor} />
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        );

    } else {

        bubble = (
            <TouchableOpacity
                activeOpacity={0.85}
                delayLongPress={350}
                onLongPress={handleLongPress}
                style={item.mine ? styles.myBubble : styles.otherBubble}
            >
                <Text
                    style={item.mine ? styles.myMessageText : styles.otherMessageText}
                >
                    {item.message}
                </Text>
            </TouchableOpacity>
        );

    }

    if (item.mine) {
        return (
            <View style={styles.myMessageContainer}>
                {bubble}
                <Text style={styles.myTime}>{item.time}</Text>
            </View>
        );
    }

    return (
        <View style={styles.otherMessageContainer}>
            <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>{item.initials}</Text>
            </View>

            <View style={styles.otherMessageContent}>
                <Text style={styles.senderName}>{item.sender}</Text>
                {bubble}
                <Text style={styles.otherTime}>{item.time}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    // SYSTEM MESSAGE
    systemMessage: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 4,
        marginBottom: 18,
    },
    systemMessageText: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    // OTHER USER
    otherMessageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingRight: 10,
    },
    messageAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#D8E2DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: 2,
    },
    messageAvatarText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: '#005B4F',
    },
    otherMessageContent: {
        flex: 1,
        maxWidth: '86%',
    },
    senderName: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        lineHeight: 17,
        color: colors.textSecondary,
        marginBottom: 3,
    },
    otherBubble: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderRadius: 20,
        borderTopLeftRadius: 5,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    otherMessageText: {
        fontFamily: fonts.regular,
        fontSize: 16,
        lineHeight: 23,
        color: colors.text,
    },
    otherTime: {
        fontFamily: fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
    },

    // MY MESSAGE
    myMessageContainer: {
        alignItems: 'flex-end',
        marginBottom: 16,
        paddingLeft: 35,
    },
    myBubble: {
        backgroundColor: colors.primaryDark,
        borderRadius: 20,
        borderTopRightRadius: 5,
        paddingHorizontal: 17,
        paddingVertical: 11,
        maxWidth: '88%',
    },
    myMessageText: {
        fontFamily: fonts.regular,
        fontSize: 16,
        lineHeight: 23,
        color: '#FFFFFF',
    },
    myTime: {
        fontFamily: fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
        marginRight: 3,
    },

    // PHOTO
    imageBubble: {
        borderRadius: 20,
        overflow: 'hidden',
        padding: 3,
    },
    imageBubbleMine: {
        backgroundColor: colors.primaryDark,
        borderTopRightRadius: 5,
    },
    imageBubbleOther: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderTopLeftRadius: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    imageContent: {
        width: 220,
        height: 220,
        borderRadius: 17,
        backgroundColor: '#E1E2E4',
    },

    // FILE
    fileBubble: {
        minWidth: 210,
        maxWidth: 260,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    fileBubbleMine: {
        backgroundColor: colors.primaryDark,
        borderTopRightRadius: 5,
    },
    fileBubbleOther: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderTopLeftRadius: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    fileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    fileIconMine: { backgroundColor: '#FFFFFF' },
    fileIconOther: { backgroundColor: colors.primaryDark },
    fileInfo: { flex: 1 },
    fileName: {
        fontFamily: fonts.regular,
        fontSize: 14,
        lineHeight: 19,
        color: colors.text,
    },
    fileNameMine: { color: '#FFFFFF' },
    fileHint: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    fileHintMine: { color: 'rgba(255,255,255,0.75)' },
    fileDownload: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    fileDownloadMine: { backgroundColor: '#FFFFFF' },
    fileDownloadOther: { backgroundColor: colors.primaryDark },
});