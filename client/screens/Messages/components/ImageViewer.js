import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, X } from 'lucide-react-native';


export default function ImageViewer({ url, onClose, onSave }) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (saving) {
            return;
        }

        try {
            setSaving(true);

            await onSave(url);

            Alert.alert('Saved', 'The photo was saved to your gallery.');
        } catch (error) {
            console.error('Save image error:', error);

            Alert.alert(
                'Download failed',
                error.message || 'Could not save the photo.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.viewerBackdrop}>

                <View
                    style={[
                        styles.viewerTopBar,
                        { paddingTop: insets.top + 8 },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.viewerButton}
                        activeOpacity={0.8}
                        onPress={onClose}
                    >
                        <X size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.viewerButton}
                        activeOpacity={0.8}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Download size={22} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    maximumZoomScale={4}
                    minimumZoomScale={1}
                    centerContent
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.viewerScroll}
                >
                    <Image
                        source={{ uri: url }}
                        style={{ width, height: height * 0.8 }}
                        resizeMode="contain"
                        onLoadEnd={() => setLoading(false)}
                    />
                </ScrollView>

                {loading && (
                    <View style={styles.viewerLoader} pointerEvents="none">
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                )}

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    viewerBackdrop: {
        flex: 1,
        backgroundColor: '#000000',
    },
    viewerTopBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    viewerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerScroll: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerLoader: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});