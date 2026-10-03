import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';
import {
    ArrowLeft,
    Mic,
    Paperclip,
    Send,
    Trash2,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { supabase } from '../../config/supabase';

import DateHeader from './components/DateHeader';
import MessageBubble from './components/MessageBubble';
import ImageViewer from './components/ImageViewer';

// =========================================================
// CONSTANTS
// =========================================================

const AUDIO_TYPE = 'voice';
const CHAT_BUCKET = 'chat-files';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const VOICE_RECORDING_OPTIONS = {
    ...RecordingPresets.HIGH_QUALITY,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 32000,
};

// =========================================================
// HELPERS
// =========================================================

function getDisplayName(profile) {
    if (!profile) {
        return { name: 'User', initials: 'U' };
    }
    const name = profile.full_name?.trim() || 'User';
    const initials =
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase() || 'U';

    return { name, initials };
}
const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
const formatDuration = (seconds) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
};
const isAudioMessage = (row) =>
    row.message_type === AUDIO_TYPE ||
    (
        row.message_type === 'file' &&
        /\.(m4a|mp3|aac|wav|caf)(\?.*)?$/i.test(row.message || '')
    );

// Shows the original file name (strips the "file_123456_" prefix)
const getFileNameFromUrl = (url = '') => {
    const last = url.split('?')[0].split('/').pop() || 'File';
    let decoded = last;
    try {
        decoded = decodeURIComponent(last);
    } catch (e) {}
    return decoded.replace(/^(file|image)_\d+_/, '');
};
// Mic is busy (phone call, another app recording, etc.)
const isMicBusyError = (error) => {
    const text =
        `${error?.message || ''} ${error?.code || ''}`.toLowerCase();
    return (
        text.includes('call') ||
        text.includes('in use') ||
        text.includes('busy') ||
        text.includes('start failed') ||
        text.includes('audio source') ||
        text.includes('session') ||
        text.includes('560557673') ||
        text.includes('cannot record') ||
        text.includes('failed to start')
    );
};
// Downloads a remote file into the app cache and returns the local path
const downloadToCache = async (url, fileName) => {
    const safeName =(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const target =`${FileSystem.cacheDirectory}${Date.now()}_${safeName}`;
    const result = await FileSystem.downloadAsync(url, target);
    if (result.status !== 200) {
        throw new Error('Could not download the file. Please try again.');
    }
    return result.uri;
};
// Photos go to the phone gallery
const saveImageToGallery = async (url) => {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) {
        throw new Error('Please allow Nzalo to save photos to your gallery.');
    }
    let name = getFileNameFromUrl(url);
    if (!/\.(jpe?g|png|gif|webp|heic)$/i.test(name)) {
        name = `${name || 'photo'}.jpg`;
    }
    const localUri = await downloadToCache(url, name);
    await MediaLibrary.saveToLibraryAsync(localUri);
};
// Files open the share sheet (Save to Files, Drive, WhatsApp, etc.)
const downloadAndShareFile = async (url, fileName) => {
    const localUri = await downloadToCache(url, fileName);
    const available = await Sharing.isAvailableAsync();
    if (!available) {
        throw new Error('Saving files is not available on this device.');
    }
    await Sharing.shareAsync(localUri, {
        dialogTitle: fileName || 'File',
    });
};
// =========================================================
// QUERY (no profiles join: senders are fetched separately)
// =========================================================
const MESSAGE_SELECT = `
    id,
    conversation_id,
    sender_id,
    message,
    message_type,
    created_at,
    read_at
`;

// =========================================================
// CHAT SCREEN
// =========================================================

export default function ChatScreen({ navigation, route }) {

    // NAVIGATION DATA
    const stokvelId = route?.params?.stokvelId;
    const stokvelName = route?.params?.stokvelName || 'Stokvel Chat';
    const memberCount = route?.params?.memberCount || 0;

    const insets = useSafeAreaInsets();

    // STATE
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [recording, setRecording] = useState(false);
    const [sending, setSending] = useState(false);
    const [activeVoiceId, setActiveVoiceId] = useState(null);
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingNames, setTypingNames] = useState([]);
    const [viewerUrl, setViewerUrl] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    const flatListRef = useRef(null);
    const profileCache = useRef({});
    const presenceChannel = useRef(null);
    const typingTimeout = useRef(null);
    const isTyping = useRef(false);

    // AUDIO: RECORDER + PLAYER
    const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
    const recorderState = useAudioRecorderState(recorder);
    const player = useAudioPlayer(null);
    const playerStatus = useAudioPlayerStatus(player);

    // AUDIO MODE
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
        }).catch((error) => console.log('Audio mode error:', error));
    }, []);

    // LOAD SENDER PROFILES SEPARATELY (one query, cached)
    const loadProfiles = async (ids) => {
        const missing = [...new Set(ids)].filter(
            (id) => id && !profileCache.current[id]
        );

        if (missing.length === 0) {
            return;
        }

        const { data: profiles, error } =
            await supabase.rpc('get_chat_profiles');

        if (error) {
            console.log('Profiles error:', error.message);
            return;
        }

        (profiles || []).forEach((p) => {
            profileCache.current[p.id] = p;
        });
    };

    // CONVERT DATABASE MESSAGE
    const toItem = (row, uid) => {
        const { name, initials } = getDisplayName(
            profileCache.current[row.sender_id]
        );

        let type = 'message';

        if (row.message_type === 'system') {
            type = 'system';
        } else if (isAudioMessage(row)) {
            type = 'audio';
        } else if (row.message_type === 'image') {
            type = 'image';
        } else if (row.message_type === 'file') {
            type = 'file';
        }

        return {
            id: row.id,
            type,
            sender: name,
            initials,
            message: row.message,
            fileName:
                type === 'file' ? getFileNameFromUrl(row.message) : null,
            time: formatTime(row.created_at),
            mine: row.sender_id === uid,
            senderId: row.sender_id,
            createdAt: row.created_at,
        };
    };

    // ADD MESSAGE ONLY ONCE
    const addMessage = (item) => {
        setMessages((current) =>
            current.some((m) => m.id === item.id)
                ? current
                : [...current, item]
        );
    };

    const scrollToEnd = (animated = true) => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated });
        }, 100);
    };

    // MARK CONVERSATION AS READ (per member, last_read_at)
    const markAsRead = useCallback(async (cid, uid) => {
        if (!cid || !uid) {
            return;
        }

        const { error } = await supabase.rpc('mark_conversation_read', {
            _conversation_id: cid,
        });

        if (error) {
            console.log('Mark read error:', error.message);
        }
    }, []);

    // MARK AS READ WHEN CHAT SCREEN IS FOCUSED
    useFocusEffect(
        useCallback(() => {
            if (conversationId && userId) {
                markAsRead(conversationId, userId);
            }
        }, [conversationId, userId, markAsRead])
    );

    // HIDE TAB BAR
    useLayoutEffect(() => {
        const parent = navigation.getParent();

        if (!parent) {
            return;
        }

        parent.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            parent.setOptions({ tabBarStyle: undefined });
        };
    }, [navigation]);

    // LOAD USER + CONVERSATION + MESSAGES
    useEffect(() => {
        let mounted = true;

        const loadChat = async () => {
            try {
                if (!stokvelId) {
                    console.log('No stokvelId provided');
                    return;
                }

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                    throw userError;
                }

                if (!user || !mounted) {
                    return;
                }

                setUserId(user.id);

                const { data: conversation, error: conversationError } =
                    await supabase
                        .from('conversations')
                        .select('id')
                        .eq('stokvel_id', stokvelId)
                        .single();

                if (conversationError) {
                    throw conversationError;
                }

                if (!conversation || !mounted) {
                    return;
                }

                setConversationId(conversation.id);

                const { data, error: messageError } = await supabase
                    .from('messages')
                    .select(MESSAGE_SELECT)
                    .eq('conversation_id', conversation.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (messageError) {
                    throw messageError;
                }

                if (!mounted) {
                    return;
                }

                // Fetch all senders in ONE separate query
                await loadProfiles((data || []).map((m) => m.sender_id));

                if (!mounted) {
                    return;
                }

                setMessages(
                    (data || [])
                        .reverse()
                        .map((row) => toItem(row, user.id))
                );

                // Opening the chat = reading it
                await markAsRead(conversation.id, user.id);
            } catch (error) {
                console.error('Error loading chat:', error);
            }
        };

        loadChat();

        return () => {
            mounted = false;
        };
    }, [stokvelId, markAsRead]);

    // =========================================================
    // REALTIME MESSAGES
    // =========================================================

    useEffect(() => {
        if (!conversationId || !userId) {
            return;
        }

        const channel = supabase
            .channel(`chat-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    try {
                        const row = payload.new;

                        // Look up the sender on a cache miss
                        await loadProfiles([row.sender_id]);

                        addMessage(toItem(row, userId));
                        scrollToEnd();

                        // Someone else's message while chat is open = read
                        if (row.sender_id !== userId) {
                            await markAsRead(conversationId, userId);
                        }
                    } catch (error) {
                        console.error('Realtime message error:', error);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    // DELETE events can't be filtered by conversation,
                    // so remove by id (harmless if it isn't in this chat)
                    const id = payload.old?.id;

                    if (!id) {
                        return;
                    }

                    setMessages((current) =>
                        current.filter((m) => m.id !== id)
                    );
                }
            )
            .subscribe(); // must stay, or nothing is received

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, userId, markAsRead]);

    // =========================================================
    // PRESENCE: ONLINE COUNT + WHO IS TYPING
    // =========================================================

    useEffect(() => {
        if (!conversationId || !userId) {
            return;
        }

        let active = true;

        const channel = supabase.channel(`presence-${conversationId}`, {
            config: { presence: { key: userId } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const ids = Object.keys(state);

                setOnlineCount(ids.length);

                const names = ids
                    .filter(
                        (id) =>
                            id !== userId &&
                            state[id].some((p) => p.typing)
                    )
                    .map((id) => {
                        const latest = state[id][state[id].length - 1];
                        return latest?.name || 'Someone';
                    });

                setTypingNames(names);
            })
            .subscribe(async (status) => {
                if (status !== 'SUBSCRIBED') {
                    return;
                }

                await loadProfiles([userId]);

                if (!active) {
                    return;
                }

                await channel.track({
                    typing: false,
                    name: getMyFirstName(),
                });
            });

        presenceChannel.current = channel;

        return () => {
            active = false;
            clearTimeout(typingTimeout.current);
            isTyping.current = false;
            presenceChannel.current = null;
            supabase.removeChannel(channel);
        };
    }, [conversationId, userId]);

    // =========================================================
    // VOICE PLAYBACK
    // =========================================================

    const toggleVoice = useCallback(
        async (item) => {
            try {
                if (activeVoiceId === item.id) {
                    if (playerStatus.playing) {
                        player.pause();
                    } else {
                        player.play();
                    }
                    return;
                }

                setActiveVoiceId(item.id);
                player.replace(item.message);
                player.play();
            } catch (error) {
                console.log('Playback error:', error);

                Alert.alert(
                    'Playback error',
                    'Could not play this voice note.'
                );
            }
        },
        [activeVoiceId, player, playerStatus.playing]
    );

    // RESET WHEN VOICE NOTE FINISHES
    useEffect(() => {
        if (playerStatus.didJustFinish) {
            setActiveVoiceId(null);
            player.seekTo(0).catch(() => {});
        }
    }, [playerStatus.didJustFinish]);

    const voice = useMemo(
        () => ({
            activeId: activeVoiceId,
            playing: playerStatus.playing,
            currentTime: playerStatus.currentTime,
            duration: playerStatus.duration,
            progress:
                playerStatus.duration > 0
                    ? playerStatus.currentTime / playerStatus.duration
                    : 0,
            toggle: toggleVoice,
            formatDuration, // used by VoiceBubble
        }),
        [
            activeVoiceId,
            playerStatus.playing,
            playerStatus.currentTime,
            playerStatus.duration,
            toggleVoice,
        ]
    );

    // =========================================================
    // VOICE RECORDING
    // =========================================================

    const startRecording = async () => {
        try {
            if (recording || sending) {
                return;
            }

            const permission =
                await AudioModule.requestRecordingPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Microphone permission',
                    'Please allow Nzalo to use the microphone to record voice notes.'
                );
                return;
            }

            if (activeVoiceId) {
                player.pause();
                setActiveVoiceId(null);
            }

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            await recorder.prepareToRecordAsync();
            recorder.record();
            setRecording(true);
        } catch (error) {
            console.log('Start recording error:', error);

            setRecording(false);

            // Put the audio mode back so playback still works
            setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            }).catch(() => {});

            if (isMicBusyError(error)) {
                Alert.alert(
                    "Can't record right now",
                    "You can't record a voice note while you're on a call. Please end the call and try again."
                );
            } else {
                Alert.alert(
                    'Recording error',
                    'Could not start recording. Please try again.'
                );
            }
        }
    };

    const finishRecording = async (shouldSend) => {
        try {
            const durationMs = recorderState.durationMillis || 0;

            setRecording(false);

            await recorder.stop();

            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            });

            const uri = recorder.uri;

            if (!shouldSend || !uri) {
                return;
            }

            if (durationMs < 700) {
                Alert.alert(
                    'Too short',
                    'Record a little longer to send a voice note.'
                );
                return;
            }

            await sendVoiceNote(uri);
        } catch (error) {
            console.log('Stop recording error:', error);

            Alert.alert(
                'Recording error',
                error.message || 'Could not save the voice note.'
            );
        }
    };

    // =========================================================
    // SEND VOICE NOTE
    // =========================================================

    const sendVoiceNote = async (uri) => {
        if (!conversationId || !userId) {
            return;
        }

        try {
            setSending(true);

            const response = await fetch(uri);

            if (!response.ok) {
                throw new Error('Could not read the recorded audio file.');
            }

            const fileData = await response.arrayBuffer();

            if (!fileData || fileData.byteLength === 0) {
                throw new Error('The recording is empty.');
            }

            const filePath =
                `${userId}/${conversationId}/voice_${Date.now()}.m4a`;

            const { error: uploadError } = await supabase.storage
                .from(CHAT_BUCKET)
                .upload(filePath, fileData, {
                    contentType: 'audio/mp4',
                    upsert: false,
                });

            if (uploadError) {
                console.error('Voice upload error:', uploadError);
                throw uploadError;
            }

            const { data: urlData } = supabase.storage
                .from(CHAT_BUCKET)
                .getPublicUrl(filePath);

            const audioUrl = urlData?.publicUrl;

            if (!audioUrl) {
                throw new Error('Could not create the audio link.');
            }

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: userId,
                    message: audioUrl,
                    message_type: AUDIO_TYPE,
                })
                .select(MESSAGE_SELECT)
                .single();

            if (error) {
                console.error('Voice message database error:', error);
                throw error;
            }

            addMessage(toItem(data, userId));
            scrollToEnd();
        } catch (error) {
            console.error('Voice note error:', error);

            Alert.alert(
                'Voice note error',
                error.message || 'Could not send the voice note.'
            );
        } finally {
            setSending(false);
        }
    };

    // =========================================================
    // SEND PHOTO / FILE
    // =========================================================

    const sendAttachment = async ({ uri, name, mimeType, kind }) => {
        if (!conversationId || !userId) {
            return;
        }

        try {
            setSending(true);

            const response = await fetch(uri);

            if (!response.ok) {
                throw new Error('Could not read the selected file.');
            }

            const fileData = await response.arrayBuffer();

            if (!fileData || fileData.byteLength === 0) {
                throw new Error('The file is empty.');
            }

            if (fileData.byteLength > MAX_UPLOAD_BYTES) {
                throw new Error('File is too large. Maximum size is 25 MB.');
            }

            const safeName =
                (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');

            const filePath =
                `${userId}/${conversationId}/${kind}_${Date.now()}_${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from(CHAT_BUCKET)
                .upload(filePath, fileData, {
                    contentType: mimeType || 'application/octet-stream',
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: urlData } = supabase.storage
                .from(CHAT_BUCKET)
                .getPublicUrl(filePath);

            const url = urlData?.publicUrl;

            if (!url) {
                throw new Error('Could not create the file link.');
            }

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: userId,
                    message: url,
                    message_type: kind,
                })
                .select(MESSAGE_SELECT)
                .single();

            if (error) {
                throw error;
            }

            addMessage(toItem(data, userId));
            scrollToEnd();
        } catch (error) {
            console.error('Attachment error:', error);

            Alert.alert(
                'Upload error',
                error.message || 'Could not send the attachment.'
            );
        } finally {
            setSending(false);
        }
    };

    // =========================================================
    // PICK IMAGE / PICK FILE / UPLOAD MENU
    // =========================================================

    const pickImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Permission required',
                    'Please allow Nzalo to access your photos.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.7,
            });

            if (
                result.canceled ||
                !result.assets ||
                result.assets.length === 0
            ) {
                return;
            }

            const asset = result.assets[0];

            const ext =
                (asset.uri.split('.').pop() || 'jpg').split('?')[0];

            await sendAttachment({
                uri: asset.uri,
                name: asset.fileName || `photo.${ext}`,
                mimeType: asset.mimeType || 'image/jpeg',
                kind: 'image',
            });
        } catch (error) {
            console.error('Image picker error:', error);

            Alert.alert('Upload error', 'Could not open the photo picker.');
        }
    };

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            const selectedFile = result.assets?.[0];

            if (!selectedFile) {
                return;
            }

            await sendAttachment({
                uri: selectedFile.uri,
                name: selectedFile.name,
                mimeType: selectedFile.mimeType,
                kind: 'file',
            });
        } catch (error) {
            console.error('Document picker error:', error);

            Alert.alert('Upload error', 'Could not open the file picker.');
        }
    };

    const openUploadMenu = () => {
        Keyboard.dismiss();

        Alert.alert('Add attachment', 'What would you like to upload?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Photo', onPress: pickImage },
            { text: 'File', onPress: pickFile },
        ]);
    };

    // =========================================================
    // DOWNLOAD FILE
    // =========================================================

    const handleDownloadFile = async (item) => {
        if (downloadingId) {
            return;
        }

        try {
            setDownloadingId(item.id);

            await downloadAndShareFile(item.message, item.fileName);
        } catch (error) {
            console.error('Download file error:', error);

            Alert.alert(
                'Download failed',
                error.message || 'Could not download the file.'
            );
        } finally {
            setDownloadingId(null);
        }
    };

    // =========================================================
    // TYPING INDICATOR
    // =========================================================

    const getMyFirstName = () => {
        const profile = profileCache.current[userId];

        return profile
            ? getDisplayName(profile).name.split(' ')[0]
            : 'Someone';
    };

    const setTyping = (value) => {
        if (isTyping.current === value) {
            return;
        }

        isTyping.current = value;

        presenceChannel.current?.track({
            typing: value,
            name: getMyFirstName(),
        });
    };

    const handleChangeText = (text) => {
        setMessage(text);

        clearTimeout(typingTimeout.current);

        if (text.trim().length > 0) {
            setTyping(true);

            typingTimeout.current = setTimeout(() => setTyping(false), 2500);
        } else {
            setTyping(false);
        }
    };

    // =========================================================
    // DELETE MY MESSAGE
    // =========================================================

    const deleteMessage = async (item) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .delete()
                .eq('id', item.id)
                .eq('sender_id', userId)
                .select('id');

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('The message could not be deleted.');
            }

            setMessages((current) =>
                current.filter((m) => m.id !== item.id)
            );

            // Best effort: remove the uploaded file too
            if (
                item.type === 'audio' ||
                item.type === 'image' ||
                item.type === 'file'
            ) {
                const raw = item.message
                    .split('?')[0]
                    .split(`/${CHAT_BUCKET}/`)[1];

                if (raw) {
                    supabase.storage
                        .from(CHAT_BUCKET)
                        .remove([decodeURIComponent(raw)])
                        .catch(() => {});
                }
            }
        } catch (error) {
            console.error('Delete message error:', error);

            Alert.alert(
                'Delete failed',
                error.message || 'Could not delete the message.'
            );
        }
    };

    const confirmDelete = (item) => {
        Keyboard.dismiss();

        Alert.alert(
            'Delete message',
            'This removes the message for everyone in the group.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteMessage(item),
                },
            ]
        );
    };

    // =========================================================
    // SEND TEXT MESSAGE
    // =========================================================

    const sendMessage = async () => {
        const trimmed = message.trim();

        if (!trimmed || !conversationId || !userId) {
            return;
        }

        setMessage('');

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: userId,
                    message: trimmed,
                    message_type: 'text',
                })
                .select(MESSAGE_SELECT)
                .single();

            if (error) {
                throw error;
            }

            addMessage(toItem(data, userId));
            scrollToEnd();
        } catch (error) {
            console.error('Error sending message:', error);

            setMessage(trimmed);
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    const hasText = message.trim().length > 0;

    const bottomInset = Math.max(insets.bottom, 9);

    const headerSubtitle =
        typingNames.length === 1
            ? `${typingNames[0]} is typing...`
            : typingNames.length > 1
                ? 'Several people are typing...'
                : memberCount
                    ? `${memberCount} members · ${onlineCount} online`
                    : 'Group chat';

    return (
        <View style={styles.screen}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={colors.white}
            />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View
                    style={[
                        styles.chatHeader,
                        { paddingTop: insets.top + 6 },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={25} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text style={styles.chatTitle} numberOfLines={1}>
                            {stokvelName}
                        </Text>

                        <Text style={styles.activeMembers} numberOfLines={1}>
                            {headerSubtitle}
                        </Text>
                    </View>
                </View>

                <View style={styles.messagesWrapper}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        extraData={{ voice, downloadingId }}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <MessageBubble
                                item={item}
                                voice={voice}
                                onLongPress={confirmDelete}
                                onOpenImage={setViewerUrl}
                                onDownloadFile={handleDownloadFile}
                                downloading={downloadingId === item.id}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.messagesContent}
                        ListHeaderComponent={<DateHeader />}
                        onContentSizeChange={() => {
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({
                                    animated: false,
                                });
                            }, 50);
                        }}
                    />
                </View>

                {recording ? (
                    <View
                        style={[
                            styles.recordingBar,
                            { paddingBottom: bottomInset },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.cancelRecordButton}
                            activeOpacity={0.8}
                            onPress={() => finishRecording(false)}
                        >
                            <Trash2 size={22} color="#EF4444" />
                        </TouchableOpacity>

                        <View style={styles.recordingInfo}>
                            <View style={styles.recordingDot} />

                            <Text style={styles.recordingText}>
                                Recording{' '}
                                {formatDuration(
                                    (recorderState.durationMillis || 0) / 1000
                                )}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.sendButton}
                            activeOpacity={0.85}
                            onPress={() => finishRecording(true)}
                        >
                            <Send size={23} color="#FFFFFF" fill="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.inputContainer,
                            { paddingBottom: bottomInset },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.attachmentButton}
                            activeOpacity={0.7}
                            onPress={openUploadMenu}
                        >
                            <Paperclip size={24} color={colors.text} />
                        </TouchableOpacity>

                        <TextInput
                            value={message}
                            onChangeText={handleChangeText}
                            placeholder={
                                sending ? 'Sending...' : 'Type message...'
                            }
                            placeholderTextColor={colors.textSecondary}
                            style={styles.messageInput}
                            editable={!sending}
                            multiline
                            maxLength={2000}
                        />

                        {hasText ? (
                            <TouchableOpacity
                                style={styles.sendButton}
                                activeOpacity={0.85}
                                onPress={sendMessage}
                            >
                                <Send size={23} color="#FFFFFF" fill="#FFFFFF" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    sending && styles.disabledButton,
                                ]}
                                activeOpacity={0.85}
                                disabled={sending}
                                onPress={startRecording}
                            >
                                <Mic size={23} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>

            {viewerUrl && (
                <ImageViewer
                    url={viewerUrl}
                    onClose={() => setViewerUrl(null)}
                    onSave={saveImageToGallery}
                />
            )}
        </View>
    );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        width: '100%',
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: colors.background,
    },

    // HEADER
    chatHeader: {
        minHeight: 64,
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 8,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#DFE0E2',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F1F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
    },
    chatTitle: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 20,
        lineHeight: 25,
        color: colors.text,
    },
    activeMembers: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 18,
        color: colors.textSecondary,
        marginTop: 1,
    },

    // MESSAGE AREA
    messagesWrapper: {
        flex: 1,
        minHeight: 0,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 18,
        flexGrow: 1,
    },

    // INPUT
    inputContainer: {
        minHeight: 66,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E1E2E4',
        paddingHorizontal: 12,
        paddingTop: 9,
        paddingBottom: 9,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    attachmentButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F1F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 7,
        flexShrink: 0,
    },
    messageInput: {
        flex: 1,
        minHeight: 48,
        maxHeight: 96,
        borderRadius: 24,
        backgroundColor: '#F0F1F3',
        paddingHorizontal: 17,
        paddingVertical: 11,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.text,
        textAlignVertical: 'center',
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 7,
        flexShrink: 0,
    },
    disabledButton: {
        opacity: 0.5,
    },

    // RECORDING BAR
    recordingBar: {
        minHeight: 66,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E1E2E4',
        paddingHorizontal: 12,
        paddingTop: 9,
        paddingBottom: 9,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    cancelRecordButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FDECEC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 7,
    },
    recordingInfo: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F1F3',
        paddingHorizontal: 17,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        marginRight: 10,
    },
    recordingText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.text,
    },
});