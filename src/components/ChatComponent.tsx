import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ref, push, onValue, serverTimestamp, query, orderByChild, limitToLast, get } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';
import { database } from '../services/firebase';
import { AuthContext } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';
import { LinearGradient } from 'expo-linear-gradient'; // Importa o LinearGradient

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string;
  timestamp: number;
  isParticipant?: boolean;
}

interface ChatComponentProps {
  eventId: string;
  isInsideModal?: boolean;
}

const userImageCache = new Map<string, string>();
const participantCache = new Map<string, boolean>();

const ChatComponent: React.FC<ChatComponentProps> = ({ eventId, isInsideModal }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const getUserProfileImageUrl = async (cpf: string): Promise<string> => {
    if (userImageCache.has(cpf)) return userImageCache.get(cpf)!;
    try {
      const userImageRef = ref(databaseSocial, `users/cpf/${cpf}/config/perfilimage/`);
      const snapshot = await get(userImageRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const imageUrl = data.imageperfilurl;
        if (imageUrl) {
          userImageCache.set(cpf, imageUrl);
          return imageUrl;
        }
      }
    } catch (error) { console.error(`Erro ao buscar imagem para o CPF ${cpf}:`, error); }
    const fallbackUrl = `https://ui-avatars.com/api/?name=${cpf.substring(0, 2 )}&background=random&color=fff&size=128`;
    userImageCache.set(cpf, fallbackUrl);
    return fallbackUrl;
  };

  const isUserParticipant = async (cpf: string, currentEventId: string): Promise<boolean> => {
    const cacheKey = `${cpf}_${currentEventId}`;
    if (participantCache.has(cacheKey)) return participantCache.get(cacheKey)!;
    try {
      const ticketsRef = ref(database, `users/cpf/${cpf}/ingressoscomprados/`);
      const snapshot = await get(ticketsRef);
      if (snapshot.exists()) {
        const ticketsData = snapshot.val();
        for (const ticketKey in ticketsData) {
          if (String(ticketsData[ticketKey].eventid) === String(currentEventId)) {
            participantCache.set(cacheKey, true);
            return true;
          }
        }
      }
    } catch (error) { console.error(`[PARTICIPANTE] ERRO ao verificar ingressos para ${cpf}:`, error); }
    participantCache.set(cacheKey, false);
    return false;
  };

  useEffect(() => {
    if (!eventId) return;
    const chatRef = query(ref(databaseSocial, `chats/${eventId}`), orderByChild('timestamp'), limitToLast(50));
    const unsubscribe = onValue(chatRef, async (snapshot) => {
      if (!snapshot.exists()) { setMessages([]); return; }
      const data = snapshot.val();
      const loadedMessagesPromises = Object.keys(data).map(async (key) => {
        const messageData = data[key];
        const [photoUrl, isParticipant] = await Promise.all([
          getUserProfileImageUrl(messageData.userId),
          isUserParticipant(messageData.userId, eventId)
        ]);
        return { id: key, ...messageData, userPhoto: photoUrl, isParticipant };
      });
      const resolvedMessages = await Promise.all(loadedMessagesPromises);
      setMessages(resolvedMessages.sort((a, b) => a.timestamp - b.timestamp));
    });
    return () => unsubscribe();
  }, [eventId]);

  useEffect(() => {
    if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !user || !user.cpf) { Alert.alert("Erro", "Você precisa estar logado para enviar mensagens."); return; }
    setSending(true);
    try {
      const userPhotoUrl = await getUserProfileImageUrl(user.cpf);
      await push(ref(databaseSocial, `chats/${eventId}`), {
        text: newMessage.trim(),
        userId: user.cpf,
        userName: user.fullname || 'Usuário Anônimo',
        userPhoto: userPhotoUrl,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) { console.error('Erro ao enviar mensagem:', error); Alert.alert('Erro', 'Não foi possível enviar a mensagem.'); }
    finally { setSending(false); }
  };

  // ====================================================================================
  // NOVA RENDERIZAÇÃO DA MENSAGEM - MUITO MAIS EXPLÍCITA
  // ====================================================================================
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.userId === user?.cpf;
    const messageDate = new Date(item.timestamp);
    const timeString = isNaN(messageDate.getTime()) ? '' : messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Componente do Selo de Participante
    const ParticipantBadge = () => (
      <View style={styles.participantBadge}>
        <MaterialCommunityIcons name="ticket-confirmation" size={12} color={Colors.primary.purple} />
        <Text style={styles.participantBadgeText}>PARTICIPANTE</Text>
      </View>
    );

    // Renderização para mensagens de OUTROS USUÁRIOS
    if (!isMyMessage) {
      return (
        <View style={styles.messageContainer}>
          <Image source={{ uri: item.userPhoto }} style={styles.messageAvatar} />
          <View style={{ flex: 1 }}>
            <View style={styles.senderContainer}>
              <Text style={item.isParticipant ? styles.participantName : styles.messageSender}>
                {item.userName}
              </Text>
            </View>
            {/* O Selo de Participante agora fica em uma linha separada para mais destaque */}
            {item.isParticipant && <ParticipantBadge />}
            <View style={[styles.messageBubble, styles.otherMessageBubble]}>
              <Text style={styles.otherMessageText}>{item.text}</Text>
              <Text style={styles.otherMessageTime}>{timeString}</Text>
            </View>
          </View>
        </View>
      );
    }

    // Renderização para as MINHAS MENSAGENS
    return (
      <View style={[styles.messageContainer, styles.myMessageContainer]}>
        <LinearGradient
          // O gradiente destaca a mensagem do participante logado
          colors={item.isParticipant ? [Colors.primary.purple, Colors.primary.magenta] : [Colors.primary.purple, Colors.primary.purple]}
          style={[styles.messageBubble, styles.myMessageBubble]}
        >
          {item.isParticipant && (
            <View style={styles.myParticipantBadge}>
              <MaterialCommunityIcons name="ticket-confirmation" size={14} color={Colors.text.onPrimary} />
              <Text style={styles.myParticipantBadgeText}>PARTICIPANTE</Text>
            </View>
          )}
          <Text style={styles.myMessageText}>{item.text}</Text>
          <Text style={styles.myMessageTime}>{timeString}</Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={isInsideModal ? 90 : 0}>
      <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} renderItem={renderMessage} contentContainerStyle={styles.messageList} showsVerticalScrollIndicator={false} />
      <View style={styles.inputContainer}>
        <TextInput style={styles.textInput} value={newMessage} onChangeText={setNewMessage} placeholder="Digite sua mensagem..." placeholderTextColor={Colors.text.tertiary} multiline />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={sending || newMessage.trim() === ''}>
          {sending ? <ActivityIndicator size="small" color={Colors.text.onPrimary} /> : <MaterialCommunityIcons name="send" size={24} color={Colors.text.onPrimary} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ====================================================================================
// ESTILOS ATUALIZADOS COM DESTAQUES EXPLÍCITOS
// ====================================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.white },
  messageList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm, maxWidth: '95%' },
  myMessageContainer: { alignSelf: 'flex-end', marginLeft: 'auto', maxWidth: '85%' },
  messageBubble: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Spacing.md, minWidth: 80 },
  myMessageBubble: { borderBottomRightRadius: Spacing.xs },
  otherMessageBubble: { backgroundColor: Colors.neutral.lightGray, borderBottomLeftRadius: Spacing.xs },
  messageAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: Spacing.xs, backgroundColor: Colors.neutral.lightGray, marginTop: 5 },
  senderContainer: { flexDirection: 'row', alignItems: 'center' },
  messageSender: { ...Typography.styles.bodySmall, color: Colors.text.secondary, fontWeight: Typography.fontWeight.semiBold },
  participantName: { // Nome do participante destacado
    ...Typography.styles.bodySmall,
    color: Colors.primary.purple,
    fontWeight: Typography.fontWeight.bold,
  },
  participantBadge: { // Selo de participante para outros usuários
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.lightGray,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
    marginTop: 2,
  },
  participantBadgeText: {
    ...Typography.styles.caption,
    color: Colors.primary.purple,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: 4,
  },
  myParticipantBadge: { // Selo de participante para o usuário logado
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  myParticipantBadgeText: {
    ...Typography.styles.caption,
    color: Colors.text.onPrimary,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: 6,
  },
  myMessageText: { ...Typography.styles.bodyMedium, color: Colors.text.onPrimary },
  otherMessageText: { ...Typography.styles.bodyMedium, color: Colors.text.primary },
  myMessageTime: { ...Typography.styles.caption, color: Colors.text.onPrimary, alignSelf: 'flex-end', marginTop: Spacing.xs, opacity: 0.8 },
  otherMessageTime: { ...Typography.styles.caption, color: Colors.text.secondary, alignSelf: 'flex-end', marginTop: Spacing.xs },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.neutral.gray, backgroundColor: Colors.neutral.white },
  textInput: { flex: 1, backgroundColor: Colors.neutral.lightGray, borderRadius: Spacing.button.borderRadius, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs, ...Typography.styles.bodyMedium, color: Colors.text.primary, marginRight: Spacing.sm, maxHeight: 120 },
  sendButton: { backgroundColor: Colors.primary.purple, borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});

export default ChatComponent;
