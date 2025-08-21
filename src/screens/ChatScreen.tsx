import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { ref, push, onValue, off, serverTimestamp, query, orderByChild, limitToLast, get } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';

interface ChatScreenProps {
  eventId: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  timestamp: number;
}

interface UserProfile {
  profilePicUrl?: string;
}

const USER_PROFILE_CACHE_DIR = FileSystem.cacheDirectory + 'user_profile_pics/';

const ensureProfilePicDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(USER_PROFILE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(USER_PROFILE_CACHE_DIR, { intermediates: true });
  }
};

const getCachedProfilePicUri = (userId: string, url: string): string => {
  const filename = `${userId}_${url.split('/').pop()}`;
  return USER_PROFILE_CACHE_DIR + filename;
};

const cacheProfilePic = async (userId: string, url: string): Promise<string | undefined> => {
  if (!url) return undefined;
  await ensureProfilePicDirectoryExists();
  const localUri = getCachedProfilePicUri(userId, url);
  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      return localUri;
    }
    const { uri } = await FileSystem.downloadAsync(url, localUri);
    return uri;
  } catch (e) {
    console.error(`Failed to cache profile pic for ${userId} from ${url}:`, e);
    return undefined;
  }
};

const ChatScreen: React.FC<ChatScreenProps> = ({ eventId }) => {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: UserProfile}>({});
  const flatListRef = useRef<FlatList>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (userProfiles[userId]) return userProfiles[userId];

    try {
      const userRef = ref(databaseSocial, `users/cpf/${userId}/profilePicUrl`);
      const snapshot = await get(userRef);
      const profilePicUrl = snapshot.val();
      
      let cachedUri: string | undefined;
      if (profilePicUrl) {
        cachedUri = await cacheProfilePic(userId, profilePicUrl);
      }

      const profile: UserProfile = { profilePicUrl: cachedUri || profilePicUrl };
      setUserProfiles(prev => ({ ...prev, [userId]: profile }));
      return profile;
    } catch (error) {
      console.error(`Error fetching profile for ${userId}:`, error);
      return {};
    }
  }, [userProfiles]);

  useEffect(() => {
    const chatRef = query(ref(databaseSocial, `chats/${eventId}`), orderByChild('timestamp'), limitToLast(50));

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages: ChatMessage[] = [];
      const userIdsToFetch: Set<string> = new Set();

      if (data) {
        Object.keys(data).forEach(key => {
          const msg = data[key];
          loadedMessages.push({
            id: key,
            userId: msg.userId,
            userName: msg.userName,
            text: msg.text,
            timestamp: msg.timestamp,
            userPhoto: msg.userPhoto, // Ensure userPhoto is passed
          });
          userIdsToFetch.add(msg.userId);
        });
      }

      setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
      setLoading(false);

      userIdsToFetch.forEach(id => fetchUserProfile(id));

      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

    }, (error) => {
      console.error("Error fetching chat messages:", error);
      setLoading(false);
    });

    return () => off(chatRef, 'value', unsubscribe);
  }, [eventId, fetchUserProfile]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      userId: user.uid,
      userName: user.nome || user.email || 'Anônimo',
      userPhoto: user.fotoPerfil || 'https://via.placeholder.com/150', // Use user.fotoPerfil
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
    };

    try {
      await push(ref(databaseSocial, `chats/${eventId}`), messageData);
      setNewMessage('');
      // Optimistic update is handled by onValue listener
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.userId === user?.uid;
    const profile = userProfiles[item.userId];
    const profilePic = item.userPhoto || profile?.profilePicUrl; // Prioritize message's userPhoto, then cached profile

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
      ]}>
        {!isMyMessage && profilePic && (
          <Image source={{ uri: profilePic }} style={styles.profilePic} />
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
        ]}>
          {!isMyMessage && <Text style={styles.userName}>{item.userName}</Text>}
          <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
          <Text style={isMyMessage ? styles.myMessageTimestamp : styles.otherMessageTimestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isMyMessage && profilePic && (
          <Image source={{ uri: profilePic }} style={styles.profilePic} />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.purple} />
        <Text style={styles.loadingText}>Carregando chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {/* No back button here, as it's a bottom sheet */}
        <Text style={styles.headerTitle}>Chat do Evento</Text>
        {/* Placeholder for alignment */}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 5 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={Colors.text.tertiary}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <MaterialCommunityIcons name="send" size={24} color={Colors.text.onPrimary} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.dark,
  },
  loadingText: {
    color: Colors.text.primary,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centralize o título
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.background.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },
  headerTitle: {
    color: Colors.text.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  profilePic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
    backgroundColor: Colors.neutral.gray,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary.purple,
    borderBottomRightRadius: 2,
  },
  otherMessageBubble: {
    backgroundColor: Colors.background.light,
    borderBottomLeftRadius: 2,
  },
  userName: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  myMessageText: {
    color: Colors.text.onPrimary,
    fontSize: 16,
  },
  otherMessageText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  myMessageTimestamp: {
    fontSize: 10,
    color: Colors.text.onPrimary,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  otherMessageTimestamp: {
    fontSize: 10,
    color: Colors.text.secondary,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
    backgroundColor: Colors.background.medium,
    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background.light,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
    marginRight: 10,
    maxHeight: 100, // Limit height for multiline input
  },
  sendButton: {
    backgroundColor: Colors.primary.purple,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;


