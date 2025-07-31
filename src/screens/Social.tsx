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
  const [viewMode, setViewMode] = useState<'search' | 'profile'>('search');
  const [profileLoading, setProfileLoading] = useState(false);

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
            results.push({
              cpf,
              fullname: userData.fullname || 'Usuário',
              email: userData.email || '',
              telefone: userData.telefone || '',
              avatar: userData.avatar,
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
        }
      } catch (error) {
        console.log('Dados sociais não encontrados para o usuário ou erro ao buscar:', error);
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
        avatar: socialData?.avatar || userData.avatar,
        ingressoscomprados: userData.ingressoscomprados,
        eventosParticipados,
        friendCount,
        privacy: { eventsBuyVisible },
      };

      setSelectedUser(profile);
      setViewMode('profile');
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil do usuário');
    } finally {
      setProfileLoading(false);
    }
  };

  // Função para processar eventos participados (baseada na lógica do Ingressos.tsx)
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

      if (myFriendRequestSnapshot.exists() && myFriendRequestSnapshot.val().status === 'active') {
        Alert.alert('Amigo', 'Vocês já são amigos!');
        return;
      }

      if (targetFriendRequestSnapshot.exists() && targetFriendRequestSnapshot.val().status === 'pending') {
        // Se o alvo já enviou uma solicitação para mim, aceitar a amizade
        await update(myFriendRequestRef, { status: 'active', initiatedBy: targetCpf });
        await update(targetFriendRequestRef, { status: 'active', initiatedBy: user.cpf });
        Alert.alert('Sucesso', `Você e ${selectedUser?.fullname || 'o usuário'} agora são amigos!`);
      } else if (myFriendRequestSnapshot.exists() && myFriendRequestSnapshot.val().status === 'pending') {
        Alert.alert('Aguardando', 'Você já enviou uma solicitação de amizade para este usuário.');
      } else {
        // Enviar solicitação de amizade
        await set(myFriendRequestRef, { status: 'pending', initiatedBy: user.cpf });
        Alert.alert('Sucesso', 'Solicitação de amizade enviada!');
      }
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

  // Renderizar evento participado
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

  // Tela de busca
  const renderSearchScreen = () => (
    <View style={styles.container}>
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
              {selectedUser.telefone && (
                <Text style={styles.profileContact}>{selectedUser.telefone}</Text>
              )}
              {selectedUser.datanascimento && (
                <Text style={styles.profileBirth}>
                  Nascimento: {new Date(selectedUser.datanascimento).toLocaleDateString('pt-BR')}
                </Text>
              )}
              {selectedUser.gender && (
                <Text style={styles.profileGender}>{selectedUser.gender}</Text>
              )}
              {selectedUser.friendCount !== undefined && (
                <Text style={styles.profileFriendCount}>
                  {selectedUser.friendCount} Vínculos
                </Text>
              )}
            </View>
          </View>
          {user && user.cpf !== selectedUser.cpf && (
            <TouchableOpacity 
              style={styles.addFriendButtonLarge}
              onPress={() => handleAddFriend(selectedUser.cpf)}
            >
              <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
              <Text style={styles.addFriendButtonText}>Adicionar Amigo</Text>
            </TouchableOpacity>
          )}
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
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {profileLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      ) : viewMode === 'search' ? (
        renderSearchScreen()
      ) : (
        renderProfileScreen()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
});


