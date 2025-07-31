import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Image,
  Alert,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { ref, get, query, orderByChild, equalTo, set, update } from 'firebase/database';
import { database } from '../services/firebase';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Tipos
interface UserSearchResult {
  cpf: string;
  fullname: string;
  email: string;
  telefone: string;
  avatar?: string;
}

interface UserProfile extends UserSearchResult {
  datanascimento?: string;
  gender?: string;
  ingressoscomprados?: any;
  eventosParticipados?: EventoParticipado[];
  friendCount?: number;
  privacy?: { eventsBuyVisible?: boolean };
}

interface EventoParticipado {
  eventid: string;
  nomeevento: string;
  tipo: string;
  quantidade: number;
  dataevento?: string;
  imageurl?: string;
}

// Cores
const Colors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  accent: '#F59E0B',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
};

export default function Social() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<'search' | 'profile' | 'requests'>('search');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<UserSearchResult[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [acceptedFriends, setAcceptedFriends] = useState<UserSearchResult[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [isFriend, setIsFriend] = useState(false);

  // Animação para transição de tela
  const screenTransitionAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(screenTransitionAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [viewMode]);

  // Função para buscar usuários por email ou telefone
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = ref(database, 'users/cpf');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        const results: UserSearchResult[] = [];
        
        for (const cpf in users) {
          const userData = users[cpf];
          const email = userData.email?.toLowerCase() || '';
          const telefone = userData.telefone || '';
          const fullname = userData.fullname?.toLowerCase() || '';
          const searchLower = query.toLowerCase();
          
          // Busca por email, telefone ou nome
          if (
            email.includes(searchLower) ||
            telefone.includes(query) ||
            fullname.includes(searchLower)
          ) {
            // Buscar a imagem de perfil do banco social
            let avatarUrl = userData.avatar; // Fallback para avatar existente
            try {
              const perfilImageSnapshot = await get(ref(databaseSocial, `users/cpf/${cpf}/config/perfilimage`));
              if (perfilImageSnapshot.exists() && perfilImageSnapshot.val().imageperfilurl) {
                avatarUrl = perfilImageSnapshot.val().imageperfilurl;
              }
            } catch (error) {
              console.log(`Erro ao buscar imagem de perfil para ${cpf}:`, error);
            }

            results.push({
              cpf,
              fullname: userData.fullname || 'Usuário',
              email: userData.email || '',
              telefone: userData.telefone || '',
              avatar: avatarUrl,
            });
          }
        }
        
        setSearchResults(results.slice(0, 10)); // Limita a 10 resultados
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      Alert.alert('Erro', 'Não foi possível buscar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar perfil completo do usuário
  const loadUserProfile = async (cpf: string) => {
    setProfileLoading(true);
    try {
      // Buscar dados básicos do usuário
      const userSnapshot = await get(ref(database, `users/cpf/${cpf}`));
      
      if (!userSnapshot.exists()) {
        Alert.alert('Erro', 'Usuário não encontrado');
        return;
      }

      const userData = userSnapshot.val();
      
      // Buscar dados sociais (avatar, amigos, privacidade, etc.)
      let socialData = null;
      let friendCount = 0;
      let eventsBuyVisible = true; // Default para visível
      let avatarUrl = userData.avatar; // Fallback para avatar existente

      try {
        const socialSnapshot = await get(ref(databaseSocial, `users/cpf/${cpf}`));
        if (socialSnapshot.exists()) {
          socialData = socialSnapshot.val();
          // Contagem de amigos
          if (socialData.config?.friends) {
            friendCount = Object.keys(socialData.config.friends).length;
          }
          // Privacidade de eventos
          if (socialData.config?.privacy?.eventsBuyVisible !== undefined) {
            eventsBuyVisible = socialData.config.privacy.eventsBuyVisible;
          }
          // Buscar imagem de perfil do banco social
          if (socialData.config?.perfilimage?.imageperfilurl) {
            avatarUrl = socialData.config.perfilimage.imageperfilurl;
          }
        }
      } catch (error) {
        console.log("Dados sociais não encontrados para o usuário ou erro ao buscar:", error);
      }

      // Processar eventos participados apenas se a privacidade permitir
      let eventosParticipados: EventoParticipado[] = [];
      if (eventsBuyVisible) {
        eventosParticipados = await processarEventosParticipados(userData.ingressoscomprados);
      }

      const profile: UserProfile = {
        cpf,
        fullname: userData.fullname || 'Usuário',
        email: userData.email || '',
        telefone: userData.telefone || '',
        datanascimento: userData.datanascimento,
        gender: userData.gender,
        avatar: avatarUrl,
        ingressoscomprados: userData.ingressoscomprados,
        eventosParticipados,
        friendCount,
        privacy: { eventsBuyVisible },
      };

      setSelectedUser(profile);
      setViewMode("profile");

      // Verificar se o usuário logado já é amigo do perfil carregado
      let friendStatus = false;
      if (user && user.cpf) {
        const myFriendRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/friends/${cpf}`);
        const myFriendSnapshot = await get(myFriendRef);
        if (myFriendSnapshot.exists() && myFriendSnapshot.val().status === 'accepted' && myFriendSnapshot.val().autorizado === true) {
          friendStatus = true;
        }
      }
      setIsFriend(friendStatus);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil do usuário');
    } finally {
      setProfileLoading(false);
    }
  };

  // Função para carregar solicitações pendentes
  const loadPendingRequests = async () => {
    if (!user || !user.cpf) return;

    try {
      const friendsRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/friends`);
      const snapshot = await get(friendsRef);
      
      if (snapshot.exists()) {
        const friends = snapshot.val();
        const pendingList: UserSearchResult[] = [];
        
        for (const cpf in friends) {
          const friendData = friends[cpf];
          // Verificar se é uma solicitação pendente que EU recebi (não enviei)
          if (friendData.status === 'pending' && 
              friendData.autorizado === false && 
              friendData.initiatedBy !== user.cpf) {
            
            // Buscar dados do usuário que enviou a solicitação
            try {
              const userSnapshot = await get(ref(database, `users/cpf/${cpf}`));
              if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                
                // Buscar avatar do banco social se disponível
                let avatar = userData.avatar;
                try {
                  const socialSnapshot = await get(ref(databaseSocial, `users/cpf/${cpf}`));
                  if (socialSnapshot.exists() && socialSnapshot.val().avatar) {
                    avatar = socialSnapshot.val().avatar;
                  }
                } catch (error) {
                  console.log('Avatar social não encontrado para:', cpf);
                }
                
                pendingList.push({
                  cpf,
                  fullname: userData.fullname || 'Usuário',
                  email: userData.email || '',
                  telefone: userData.telefone || '',
                  avatar,
                });
              }
            } catch (error) {
              console.error(`Erro ao buscar dados do usuário ${cpf}:`, error);
            }
          }
        }
        
        setPendingRequests(pendingList);
        setPendingRequestsCount(pendingList.length);
      } else {
        setPendingRequests([]);
        setPendingRequestsCount(0);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações pendentes:', error);
    }
  };

  // Função para aceitar solicitação de amizade
  const acceptFriendRequest = async (senderCpf: string) => {
    if (!user || !user.cpf) return;

    try {
      // Atualizar no meu caminho (quem recebeu)
      const myFriendRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/friends/${senderCpf}`);
      await update(myFriendRef, {
        status: 'accepted',
        autorizado: true
      });

      // Atualizar no caminho do remetente (quem enviou)
      const senderFriendRef = ref(databaseSocial, `users/cpf/${senderCpf}/config/friends/${user.cpf}`);
      await update(senderFriendRef, {
        status: 'accepted',
        autorizado: true
      });

      Alert.alert('Sucesso', 'Solicitação de amizade aceita!');
      
      // Recarregar solicitações pendentes e amigos aceitos
      await loadPendingRequests();
      await loadAcceptedFriends();
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação de amizade.');
    }
  };

  // Função para carregar amigos aceitos
  const loadAcceptedFriends = async () => {
    if (!user || !user.cpf) return;

    setFriendsLoading(true);
    try {
      const friendsRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/friends`);
      const snapshot = await get(friendsRef);
      
      const friendsList: UserSearchResult[] = [];
      
      // Adicionar o próprio usuário primeiro
      try {
        const myUserSnapshot = await get(ref(database, `users/cpf/${user.cpf}`));
        if (myUserSnapshot.exists()) {
          const myUserData = myUserSnapshot.val();
          
          // Buscar avatar do banco social se disponível
          let myAvatar = myUserData.avatar;
          try {
            const mySocialSnapshot = await get(ref(databaseSocial, `users/cpf/${user.cpf}`));
            if (mySocialSnapshot.exists() && mySocialSnapshot.val().avatar) {
              myAvatar = mySocialSnapshot.val().avatar;
            }
          } catch (error) {
            console.log('Avatar social não encontrado para o próprio usuário');
          }
          
          friendsList.push({
            cpf: user.cpf,
            fullname: myUserData.fullname || 'Você',
            email: myUserData.email || '',
            telefone: myUserData.telefone || '',
            avatar: myAvatar,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados do próprio usuário:', error);
      }
      
      // Adicionar amigos aceitos
      if (snapshot.exists()) {
        const friends = snapshot.val();
        
        for (const cpf in friends) {
          const friendData = friends[cpf];
          // Verificar se é um amigo aceito
          if (friendData.status === 'accepted' && friendData.autorizado === true) {
            
            // Buscar dados do amigo
            try {
              const userSnapshot = await get(ref(database, `users/cpf/${cpf}`));
              if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                
                // Buscar avatar do banco social se disponível
                let avatar = userData.avatar;
                try {
                  const socialSnapshot = await get(ref(databaseSocial, `users/cpf/${cpf}`));
                  if (socialSnapshot.exists() && socialSnapshot.val().avatar) {
                    avatar = socialSnapshot.val().avatar;
                  }
                } catch (error) {
                  console.log('Avatar social não encontrado para:', cpf);
                }
                
                friendsList.push({
                  cpf,
                  fullname: userData.fullname || 'Usuário',
                  email: userData.email || '',
                  telefone: userData.telefone || '',
                  avatar,
                });
              }
            } catch (error) {
              console.error(`Erro ao buscar dados do amigo ${cpf}:`, error);
            }
          }
        }
      }
      
      setAcceptedFriends(friendsList);
    } catch (error) {
      console.error('Erro ao carregar amigos aceitos:', error);
    } finally {
      setFriendsLoading(false);
    }
  };
  const rejectFriendRequest = async (senderCpf: string) => {
    if (!user || !user.cpf) return;

    try {
      // Remover do meu caminho (quem recebeu)
      const myFriendRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/friends/${senderCpf}`);
      await set(myFriendRef, null);

      // Remover do caminho do remetente (quem enviou)
      const senderFriendRef = ref(databaseSocial, `users/cpf/${senderCpf}/config/friends/${user.cpf}`);
      await set(senderFriendRef, null);

      Alert.alert('Sucesso', 'Solicitação de amizade rejeitada.');
      
      // Recarregar solicitações pendentes e amigos aceitos
      await loadPendingRequests();
      await loadAcceptedFriends();
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível rejeitar a solicitação de amizade.');
    }
  };
  const processarEventosParticipados = async (ingressosComprados: any): Promise<EventoParticipado[]> => {
    if (!ingressosComprados) return [];

    const grupos: { [key: string]: any[] } = {};
    
    // Agrupar ingressos por evento
    for (const codigo in ingressosComprados) {
      const ingresso = ingressosComprados[codigo];
      const eventid = ingresso.eventid;
      if (!grupos[eventid]) grupos[eventid] = [];
      grupos[eventid].push({ ...ingresso, codigo });
    }

    const eventos: EventoParticipado[] = [];

    // Buscar detalhes de cada evento
    for (const eventid in grupos) {
      try {
        const eventSnapshot = await get(ref(database, `eventos/${eventid}`));
        if (eventSnapshot.exists()) {
          const eventData = eventSnapshot.val();
          const ingressosDoEvento = grupos[eventid];
          
          eventos.push({
            eventid,
            nomeevento: eventData.nomeevento || 'Evento',
            tipo: ingressosDoEvento[0]?.tipo || 'Geral',
            quantidade: ingressosDoEvento.length,
            dataevento: eventData.dataevento,
            imageurl: eventData.imageurl,
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar evento ${eventid}:`, error);
      }
    }

    return eventos.sort((a, b) => {
      if (!a.dataevento || !b.dataevento) return 0;
      return new Date(b.dataevento).getTime() - new Date(a.dataevento).getTime();
    });
  };

  // Lógica para adicionar amigo
  const handleAddFriend = async (targetCpf: string) => {
    if (!user || !user.cpf) {
      Alert.alert('Erro', 'Você precisa estar logado para adicionar amigos.');
      return;
    }
    if (user.cpf === targetCpf) {
      Alert.alert('Erro', 'Você não pode adicionar a si mesmo como amigo.');
      return;
    }

    try {
      // Caminho para a solicitação de amizade do usuário logado para o alvo
      const myFriendRequestRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/friends/${targetCpf}`);
      const myFriendRequestSnapshot = await get(myFriendRequestRef);

      // Caminho para a solicitação de amizade do alvo para o usuário logado (para verificar se já existe uma solicitação pendente)
      const targetFriendRequestRef = ref(databaseSocial, `users/cpf/${targetCpf}/config/friends/${user.cpf}`);
      const targetFriendRequestSnapshot = await get(targetFriendRequestRef);

      // Verificar se já são amigos (status accepted e autorizado true)
      if (myFriendRequestSnapshot.exists() && 
          myFriendRequestSnapshot.val().status === 'accepted' && 
          myFriendRequestSnapshot.val().autorizado === true) {
        Alert.alert('Amigo', 'Vocês já são amigos!');
        return;
      }

      // Se o alvo já enviou uma solicitação para mim, aceitar a amizade
      if (targetFriendRequestSnapshot.exists() && 
          targetFriendRequestSnapshot.val().status === 'pending' && 
          targetFriendRequestSnapshot.val().autorizado === false) {
        // Aceitar a amizade - atualizar ambos os caminhos
        await update(myFriendRequestRef, { 
          status: 'accepted', 
          autorizado: true, 
          initiatedBy: targetCpf 
        });
        await update(targetFriendRequestRef, { 
          status: 'accepted', 
          autorizado: true, 
          initiatedBy: targetCpf 
        });
        Alert.alert('Sucesso', `Você e ${selectedUser?.fullname || 'o usuário'} agora são amigos!`);
        return;
      }

      // Se eu já enviei uma solicitação pendente
      if (myFriendRequestSnapshot.exists() && 
          myFriendRequestSnapshot.val().status === 'pending') {
        Alert.alert('Aguardando', 'Você já enviou uma solicitação de amizade para este usuário.');
        return;
      }

      // Enviar nova solicitação de amizade
      // Registrar no meu caminho (quem enviou)
      await set(myFriendRequestRef, { 
        status: 'pending', 
        autorizado: false, 
        initiatedBy: user.cpf 
      });

      // Registrar no caminho do destinatário (quem recebeu)
      await set(targetFriendRequestRef, { 
        status: 'pending', 
        autorizado: false, 
        initiatedBy: user.cpf 
      });

      Alert.alert('Sucesso', 'Solicitação de amizade enviada!');
    } catch (error) {
      console.error('Erro ao adicionar amigo:', error);
      Alert.alert('Erro', 'Não foi possível enviar a solicitação de amizade.');
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Carregar solicitações pendentes e amigos aceitos quando o componente monta
  useEffect(() => {
    if (user && user.cpf) {
      loadPendingRequests();
      loadAcceptedFriends();
    }
  }, [user]);

  // Renderizar item de resultado de busca
  const renderSearchResult = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => loadUserProfile(item.cpf)}
    >
      <View style={styles.userInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.fullname.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.fullname}</Text>
          <Text style={styles.userContact}>
            {item.email || item.telefone}
          </Text>
        </View>
      </View>
      
      {user && user.cpf !== item.cpf && (
        <TouchableOpacity 
          style={styles.addFriendButtonSmall}
          onPress={() => handleAddFriend(item.cpf)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={24} 
        color={Colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  // Renderizar item de amigo aceito
  const renderFriendItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => item.cpf !== user?.cpf ? loadUserProfile(item.cpf) : null}
      disabled={item.cpf === user?.cpf}
    >
      <View style={styles.userInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarSmall} />
        ) : (
          <View style={[styles.avatarSmall, styles.avatarPlaceholder]}>
            <Text style={styles.avatarTextSmall}>
              {item.fullname.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {item.cpf === user?.cpf ? 'Você' : item.fullname}
          </Text>
          {item.cpf === user?.cpf && (
            <Text style={styles.friendLabel}>Seu perfil</Text>
          )}
        </View>
      </View>
      
      {item.cpf !== user?.cpf && (
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={20} 
          color={Colors.textSecondary} 
        />
      )}
    </TouchableOpacity>
  );
  const renderPendingRequest = ({ item }: { item: UserSearchResult }) => (
    <View style={styles.pendingRequestItem}>
      <View style={styles.userInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.fullname.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.fullname}</Text>
          <Text style={styles.userContact}>
            {item.email || item.telefone}
          </Text>
          <Text style={styles.requestText}>Quer ser seu amigo</Text>
        </View>
      </View>
      
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => acceptFriendRequest(item.cpf)}
        >
          <MaterialCommunityIcons name="check" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => rejectFriendRequest(item.cpf)}
        >
          <MaterialCommunityIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
  const renderEvento = ({ item }: { item: EventoParticipado }) => (
    <View style={styles.eventoCard}>
      {item.imageurl ? (
        <Image source={{ uri: item.imageurl }} style={styles.eventoImage} />
      ) : (
        <View style={[styles.eventoImage, styles.eventoImagePlaceholder]}>
          <MaterialCommunityIcons 
            name="calendar-music" 
            size={32} 
            color={Colors.textSecondary} 
          />
        </View>
      )}
      
      <View style={styles.eventoInfo}>
        <Text style={styles.eventoNome} numberOfLines={2}>
          {item.nomeevento}
        </Text>
        <Text style={styles.eventoTipo}>{item.tipo}</Text>
        <Text style={styles.eventoQuantidade}>
          {item.quantidade} ingresso{item.quantidade > 1 ? 's' : ''}
        </Text>
        {item.dataevento && (
          <Text style={styles.eventoData}>
            {new Date(item.dataevento).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>
    </View>
  );

  // Tela de solicitações pendentes
  const renderRequestsScreen = () => (
    <View style={styles.container}>
      <View style={styles.requestsHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setViewMode('search')}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={Colors.textPrimary} 
          />
        </TouchableOpacity>
        
        <Text style={styles.requestsHeaderTitle}>
          Solicitações de Amizade ({pendingRequestsCount})
        </Text>
      </View>

      {pendingRequests.length > 0 ? (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.cpf}
          renderItem={renderPendingRequest}
          style={styles.requestsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyRequestsContainer}>
          <MaterialCommunityIcons 
            name="account-heart" 
            size={64} 
            color={Colors.textSecondary} 
          />
          <Text style={styles.emptyRequestsText}>Nenhuma solicitação pendente</Text>
          <Text style={styles.emptyRequestsSubtext}>
            Quando alguém enviar uma solicitação de amizade, ela aparecerá aqui
          </Text>
        </View>
      )}
    </View>
  );
  const renderSearchScreen = () => (
    <View style={styles.container}>
      {/* Botão de solicitações com notificação */}
      {pendingRequestsCount > 0 && (
        <View style={styles.requestsButtonContainer}>
          <TouchableOpacity
            style={styles.requestsButton}
            onPress={() => setViewMode('requests')}
          >
            <MaterialCommunityIcons 
              name="account-heart" 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.requestsButtonText}>
              Solicitações de Amizade
            </Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{pendingRequestsCount}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons 
            name="magnify" 
            size={24} 
            color={Colors.textSecondary} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por email, telefone ou nome..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
          {loading && (
            <ActivityIndicator size="small" color={Colors.primary} />
          )}
        </View>
      </View>

      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Digite pelo menos 3 caracteres para buscar
          </Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.cpf}
          renderItem={renderSearchResult}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {searchQuery.length >= 3 && searchResults.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="account-search" 
            size={64} 
            color={Colors.textSecondary} 
          />
          <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          <Text style={styles.emptySubtext}>
            Tente buscar por email, telefone ou nome
          </Text>
        </View>
      )}

      {searchQuery.length === 0 && (
        <>
          <View style={styles.welcomeContainer}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={80} 
              color={Colors.primary} 
            />
            <Text style={styles.welcomeTitle}>Encontre Amigos</Text>
            <Text style={styles.welcomeText}>
              Busque por usuários usando email, telefone ou nome para ver seus perfis e eventos participados
            </Text>
          </View>

          {/* Seção de Amigos */}
          {acceptedFriends.length > 0 && (
            <View style={styles.friendsSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons 
                  name="account-group" 
                  size={20} 
                  color={Colors.primary} 
                />
                <Text style={styles.sectionTitle}>Amigos ({acceptedFriends.length})</Text>
              </View>
              
              {friendsLoading ? (
                <View style={styles.friendsLoadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.friendsLoadingText}>Carregando amigos...</Text>
                </View>
              ) : (
                <FlatList
                  data={acceptedFriends}
                  keyExtractor={(item) => item.cpf}
                  renderItem={renderFriendItem}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </View>
          )}
        </>
      )}
    </View>
  );

  // Tela de perfil do usuário
  const renderProfileScreen = () => {
    if (!selectedUser) return null;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header do perfil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setViewMode('search')}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color={Colors.textPrimary} 
            />
          </TouchableOpacity>
          
          <Text style={styles.profileHeaderTitle}>Perfil do Usuário</Text>
        </View>

        {/* Informações do usuário */}
<View style={styles.profileCard}>
  <View style={styles.profileInfo}>
    {selectedUser.avatar ? (
      <Image source={{ uri: selectedUser.avatar }} style={styles.profileAvatar} />
    ) : (
      <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
        <Text style={styles.profileAvatarText}>
          {selectedUser.fullname.charAt(0).toUpperCase()}
        </Text>
      </View>
    )}

    <View style={styles.profileDetails}>
      <Text style={styles.profileName}>{selectedUser.fullname}</Text>
      <Text style={styles.profileContact}>{selectedUser.email}</Text>

      {/* Comentado: Número de telefone */}
      {/*
      {selectedUser.telefone && (
        <Text style={styles.profileContact}>{selectedUser.telefone}</Text>
      )}
      */}

      {/* Comentado: Data de nascimento */}
      {/*
      {selectedUser.datanascimento && (
        <Text style={styles.profileBirth}>
          Nascimento: {new Date(selectedUser.datanascimento).toLocaleDateString('pt-BR')}
        </Text>
      )}
      */}

      {selectedUser.gender && (
        <Text style={styles.profileGender}>{selectedUser.gender}</Text>
      )}

      {selectedUser.friendCount !== undefined && (
        <Text style={styles.profileFriendCount}>
          {selectedUser.friendCount} amigo{selectedUser.friendCount !== 1 ? 's' : ''}
        </Text>
      )}

      {user && user.cpf !== selectedUser.cpf && !isFriend && (
        <TouchableOpacity 
          style={styles.addFriendButtonLarge}
          onPress={() => handleAddFriend(selectedUser.cpf)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          <Text style={styles.addFriendButtonText}>Adicionar Amigo</Text>
        </TouchableOpacity>
      )}

      {user && user.cpf !== selectedUser.cpf && isFriend && (
        <View style={styles.alreadyFriendContainer}>
          <MaterialCommunityIcons name="account-check" size={20} color={Colors.success} />
          <Text style={styles.alreadyFriendText}>Vocês já são amigos!</Text>
        </View>
      )}
    </View>
  </View>
</View>


        {/* Eventos participados */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="calendar-star" 
              size={24} 
              color={Colors.primary} 
            />
            <Text style={styles.sectionTitle}>Eventos Participados</Text>
            <Text style={styles.eventCount}>
              {selectedUser.privacy?.eventsBuyVisible === false ? 'Privado' : (selectedUser.eventosParticipados?.length || 0)}
            </Text>
          </View>

          {selectedUser.privacy?.eventsBuyVisible === false ? (
            <View style={styles.noEventsContainer}>
              <MaterialCommunityIcons 
                name="eye-off" 
                size={48} 
                color={Colors.textSecondary} 
              />
              <Text style={styles.noEventsText}>
                Este usuário preferiu não exibir os eventos adquiridos.
              </Text>
            </View>
          ) : selectedUser.eventosParticipados && selectedUser.eventosParticipados.length > 0 ? (
            <FlatList
              data={selectedUser.eventosParticipados}
              keyExtractor={(item) => item.eventid}
              renderItem={renderEvento}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noEventsContainer}>
              <MaterialCommunityIcons 
                name="calendar-remove" 
                size={48} 
                color={Colors.textSecondary} 
              />
              <Text style={styles.noEventsText}>
                Este usuário ainda não participou de nenhum evento
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginRequired}>
          <MaterialCommunityIcons 
            name="account-alert" 
            size={64} 
            color={Colors.textSecondary} 
          />
          <Text style={styles.loginRequiredText}>
            Você precisa estar logado para acessar esta funcionalidade
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View
        style={[
          styles.animatedContentContainer,
          {
            opacity: screenTransitionAnim,
            transform: [
              {
                translateY: screenTransitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {profileLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Carregando perfil...</Text>
          </View>
        ) : viewMode === 'search' ? (
          renderSearchScreen()
        ) : viewMode === 'requests' ? (
          renderRequestsScreen()
        ) : (
          renderProfileScreen()
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  animatedContentContainer: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  hintContainer: {
    padding: 16,
    alignItems: 'center',
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userContact: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  profileHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profileCard: {
    backgroundColor: Colors.cardBackground,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileAvatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  profileContact: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  profileBirth: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  profileGender: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  profileFriendCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  addFriendButtonSmall: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  addFriendButtonLarge: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  alreadyFriendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.success + '15', // Um tom mais claro do verde de sucesso
    borderWidth: 1,
    borderColor: Colors.success,
  },
  alreadyFriendText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  eventsSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  eventCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventoImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  eventoImagePlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventoInfo: {
    flex: 1,
  },
  eventoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventoTipo: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  eventoQuantidade: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventoData: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  noEventsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noEventsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  loginRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginRequiredText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  // Estilos para solicitações de amizade
  requestsButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  requestsButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: 'relative',
  },
  requestsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  requestsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  requestsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pendingRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestText: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.success,
    padding: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: Colors.error,
    padding: 10,
    borderRadius: 20,
  },
  emptyRequestsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyRequestsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRequestsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Estilos para seção de amigos aceitos
  friendsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarTextSmall: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  friendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  friendsLoadingContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  friendsLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
});


