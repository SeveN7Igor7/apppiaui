import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../services/firebase';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Importação do GameDataService
import { GameDataService, UserGameData, badgeConfig } from '../services/GameDataService';

// Importação dos estilos de gamificação melhorados
import { GamificationStyles, GamificationColors, GamificationGradients } from '../constants/PerfilStyles_Gamificacao';

const { width } = Dimensions.get('window');

// Paleta de cores melhorada e mais moderna
const Colors = {
  primary: '#6366F1', // Indigo moderno
  primaryDark: '#4F46E5',
  accent: '#F59E0B', // Amber para destaque
  background: '#F8FAFC', // Fundo mais suave
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  border: '#E5E7EB',
  // Cores de gamificação aprimoradas
  gamification: {
    purple: '#8B5CF6',
    magenta: '#EC4899',
    orange: '#F97316',
    green: '#10B981',
    blue: '#3B82F6',
    gold: '#F59E0B',
    emerald: '#059669',
    rose: '#F43F5E',
  },
};

// ==================== COMPONENTES DE GAMIFICAÇÃO ====================

// Componente de Header de Gamificação Melhorado
const GamificationHeader = ({ userGameData }) => {
  const progressAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (userGameData?.xp !== undefined && userGameData?.xpToNext !== undefined) {
      Animated.timing(progressAnim, {
        toValue: (userGameData.xp / userGameData.xpToNext) * 100,
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }

    // Animação de pulso para o streak
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [userGameData]);

  if (!userGameData) return null;

  const progressPercentage = Math.min((userGameData.xp / userGameData.xpToNext) * 100, 100);

  return (
    <View style={styles.gamificationHeader}>
      {/* Linha superior com nível e streak */}
      <View style={styles.headerTopRow}>
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          style={styles.levelBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="crown" size={18} color="#fff" />
          <Text style={styles.levelText}>Nível {userGameData.level || 1}</Text>
        </LinearGradient>
        
        <Animated.View style={[styles.streakContainer, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialCommunityIcons name="fire" size={16} color={Colors.gamification.orange} />
          <Text style={styles.streakText}>{userGameData.streak || 0}</Text>
          <Text style={styles.streakLabel}>dias</Text>
        </Animated.View>
      </View>

      {/* Barra de XP melhorada */}
      <View style={styles.xpSection}>
        <View style={styles.xpInfo}>
          <Text style={styles.xpLabel}>Experiência</Text>
          <Text style={styles.xpValue}>
            {userGameData.xp || 0} / {userGameData.xpToNext || 100} XP
          </Text>
        </View>
        
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBarBackground}>
            <Animated.View
              style={[
                styles.xpBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.xpBarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.xpPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
      </View>
    </View>
  );
};

// Componente de Estatísticas Rápidas Melhorado
const QuickStats = ({ userGameData }) => {
  if (!userGameData) return null;

  const stats = [
    {
      icon: 'calendar-check',
      label: 'Eventos',
      value: userGameData.eventosParticipados || 0,
      color: Colors.gamification.blue,
      bgColor: `${Colors.gamification.blue}15`,
    },
    {
      icon: 'heart',
      label: 'Vibes',
      value: userGameData.vibesAvaliadas || 0,
      color: Colors.gamification.rose,
      bgColor: `${Colors.gamification.rose}15`,
    },
    {
      icon: 'trophy',
      label: 'Badges',
      value: (userGameData.badges?.length) || 0,
      color: Colors.gamification.gold,
      bgColor: `${Colors.gamification.gold}15`,
    },
  ];

  return (
    <View style={styles.quickStatsContainer}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="chart-line" size={20} color={Colors.gamification.blue} />
        <Text style={styles.sectionTitle}>Estatísticas</Text>
      </View>
      
      <View style={styles.statsHorizontalGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statHorizontalCard, { backgroundColor: stat.bgColor }]}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
              <MaterialCommunityIcons name={stat.icon} size={18} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Componente de Badge Individual Melhorado
const BadgeItem = ({ badge, isUnlocked, onPress, badgeInfo }) => {
  const scaleAnim = useState(new Animated.Value(1))[0];
  const glowAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isUnlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isUnlocked]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress(badge, badgeInfo);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[styles.badgeItem, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View 
          style={[
            styles.badgeIconContainer,
            isUnlocked && {
              shadowOpacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6],
              }),
            }
          ]}
        >
          <LinearGradient
            colors={isUnlocked ? ['#F59E0B', '#D97706'] : ['#E5E7EB', '#D1D5DB']}
            style={styles.badgeIconGradient}
          >
            <MaterialCommunityIcons 
              name={isUnlocked ? (badgeInfo?.icon || 'medal') : 'lock'} 
              size={22} 
              color="#fff" 
            />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.badgeLabel, { opacity: isUnlocked ? 1 : 0.6 }]} numberOfLines={2}>
          {badgeInfo?.name || 'Badge'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Componente de Seção de Badges Melhorado
const BadgesSection = ({ userGameData, onBadgePress }) => {
  if (!userGameData) return null;

  const allBadges = (badgeConfig && typeof badgeConfig === 'object') ? Object.keys(badgeConfig) : [];
  const userBadges = (userGameData.badges && Array.isArray(userGameData.badges)) ? userGameData.badges : [];
  const unlockedBadges = new Set(userBadges);

  if (allBadges.length === 0) {
    return (
      <View style={styles.badgesSection}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="trophy" size={20} color={Colors.gamification.gold} />
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <Text style={styles.badgeCount}>0/0</Text>
        </View>
        <Text style={styles.emptyStateText}>Nenhuma conquista disponível</Text>
      </View>
    );
  }

  return (
    <View style={styles.badgesSection}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="trophy" size={20} color={Colors.gamification.gold} />
        <Text style={styles.sectionTitle}>Conquistas</Text>
        <View style={styles.badgeCountContainer}>
          <Text style={styles.badgeCount}>{userBadges.length}/{allBadges.length}</Text>
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesScroll}
      >
        {allBadges.map((badge) => (
          <BadgeItem
            key={badge}
            badge={badge}
            isUnlocked={unlockedBadges.has(badge)}
            onPress={onBadgePress}
            badgeInfo={badgeConfig?.[badge]}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Componente de Modal de Badge Melhorado
const BadgeModal = ({ visible, badge, badgeInfo, isUnlocked, onClose, userGameData }) => {
  const slideAnim = useState(new Animated.Value(300))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible || !badge || !badgeInfo) return null;

  let progress = { current: 0, max: 1, percentage: 0 };
  
  try {
    const gameDataService = GameDataService.getInstance();
    if (userGameData && gameDataService.getBadgeProgress) {
      progress = gameDataService.getBadgeProgress(badge, userGameData);
    }
  } catch (error) {
    console.error('[BadgeModal] Erro ao calcular progresso:', error);
  }

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            styles.modalContent, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.modalBadgeContainer}>
            <LinearGradient
              colors={isUnlocked ? ['#F59E0B', '#D97706'] : ['#E5E7EB', '#D1D5DB']}
              style={styles.modalBadgeIcon}
            >
              <MaterialCommunityIcons 
                name={isUnlocked ? (badgeInfo.icon || 'medal') : 'lock'} 
                size={36} 
                color="#fff" 
              />
            </LinearGradient>
          </View>
          
          <Text style={styles.modalBadgeTitle}>{badgeInfo.name || 'Badge'}</Text>
          <Text style={styles.modalBadgeDescription}>{badgeInfo.description || 'Descrição não disponível'}</Text>
          
          {!isUnlocked && (
            <View style={styles.modalProgressContainer}>
              <Text style={styles.modalProgressLabel}>Progresso</Text>
              <View style={styles.modalProgressBar}>
                <View style={[styles.modalProgressFill, { width: `${progress.percentage}%` }]} />
              </View>
              <Text style={styles.modalProgressText}>
                {progress.current} / {progress.max}
              </Text>
            </View>
          )}
          
          {isUnlocked && userGameData?.achievements?.[badge] && (
            <View style={styles.modalUnlockedContainer}>
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
              <Text style={styles.modalUnlockedDate}>
                Desbloqueado em {new Date(userGameData.achievements[badge].unlockedAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}
          
          <View style={styles.modalXpContainer}>
            <MaterialCommunityIcons name="flash" size={18} color={Colors.gamification.purple} />
            <Text style={styles.modalXpReward}>
              {badgeInfo.xpReward || 0} XP
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ==================== COMPONENTES PRINCIPAIS ====================

// Componente de Login
const LoginScreen = ({ cpfInput, setCpfInput, password, setPassword, fazerLogin, loading }) => (
  <View style={styles.authContainer}>
    <View style={styles.authHeader}>
      <MaterialCommunityIcons name="account-circle" size={80} color={Colors.primary} />
      <Text style={styles.authTitle}>Bem-vindo de volta!</Text>
      <Text style={styles.authSubtitle}>Acesse sua conta para continuar</Text>
    </View>
    
    <View style={styles.authForm}>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="card-account-details" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="CPF"
          value={cpfInput}
          onChangeText={setCpfInput}
          keyboardType="numeric"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
      
      <TouchableOpacity style={styles.authButton} onPress={fazerLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.authButtonText}>Entrar</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.forgotPasswordButton}>
        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Componente de Opção de Perfil Melhorado
const ProfileOption = ({ icon, text, onPress, color = Colors.primary }) => {
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.optionItem}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.optionIconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.optionText}>{text}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export default function Perfil({ navigation }) {
  const [cpfInput, setCpfInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [userGameData, setUserGameData] = useState<UserGameData | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectedBadgeInfo, setSelectedBadgeInfo] = useState<any>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  const { user, login, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  const gameDataService = GameDataService.getInstance();

  useEffect(() => {
    if (user?.cpf) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start();
      fetchProfileImage(user.cpf);
      loadUserGameData(user.cpf);
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      setProfileImageUrl(null);
      setUserGameData(null);
    }
  }, [user]);

  const loadUserGameData = async (cpf: string) => {
    if (!cpf) return;

    try {
      const data = await gameDataService.loadUserGameData(cpf);
      setUserGameData(data);
    } catch (error) {
      console.error(`[Perfil] Erro ao carregar dados de gamificação:`, error);
      setUserGameData({
        level: 1,
        xp: 0,
        xpToNext: 100,
        vibesAvaliadas: 0,
        eventosParticipados: 0,
        badges: [],
        streak: 0,
        lastLoginDate: new Date().toISOString(),
        vibesHistory: {},
        eventosHistory: [],
        dailyChallenges: {},
        achievements: {}
      });
    }
  };

  const fetchProfileImage = async (cpf: string) => {
    if (!cpf) return;

    try {
      const imageRef = ref(databaseSocial, `users/cpf/${cpf}/config/perfilimage`);
      const snapshot = await get(imageRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data?.imageperfilurl) {
          setProfileImageUrl(data.imageperfilurl);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar imagem de perfil:", error);
    }
  };

  const fazerLogin = async () => {
    if (!cpfInput || !password) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("cpf", cpfInput);
      formData.append("password", password);

      const response = await fetch("https://piauitickets.com/api/validacao.php", {
        method: "POST",
        body: formData,
      } );

      const result = await response.json();

      if (result.success) {
        const snapshot = await get(ref(database, `users/cpf/${cpfInput}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          await login({
            cpf: data.cpf,
            fullname: data.fullname,
            email: data.email,
            telefone: data.telefone,
            datanascimento: data.datanascimento,
          });
          setCpfInput("");
          setPassword("");
        } else {
          Alert.alert("Erro", "Usuário não encontrado no banco de dados.");
        }
      } else {
        Alert.alert("Erro", "CPF ou senha inválidos.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      Alert.alert("Erro", "Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: async () => await logout() },
      ],
      { cancelable: true }
    );
  };

  const handleBadgePress = (badge: string, badgeInfo: any) => {
    if (badge && badgeInfo) {
      setSelectedBadge(badge);
      setSelectedBadgeInfo(badgeInfo);
      setBadgeModalVisible(true);
    }
  };

  const closeBadgeModal = () => {
    setBadgeModalVisible(false);
    setSelectedBadge(null);
    setSelectedBadgeInfo(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <Animated.View style={[styles.profileContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
            {/* Header do Perfil */}
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {profileImageUrl ? (
                  <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <MaterialCommunityIcons name="account" size={50} color={Colors.textSecondary} />
                  </View>
                )}
              </View>
              <Text style={styles.profileName}>{(user.fullname || 'Usuário').toUpperCase()}</Text>
              <Text style={styles.profileEmail}>{user.email || 'Email não informado'}</Text>
            </View>

            {/* Seções de Gamificação */}
            <GamificationHeader userGameData={userGameData} />
            <QuickStats userGameData={userGameData} />
            <BadgesSection userGameData={userGameData} onBadgePress={handleBadgePress} />

            {/* Informações Pessoais */}
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-details" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Informações Pessoais</Text>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="phone" size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoLabel}>Telefone</Text>
                  <Text style={styles.infoValue}>{user.telefone || 'Não informado'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="calendar" size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoLabel}>Nascimento</Text>
                  <Text style={styles.infoValue}>{user.datanascimento || 'Não informado'}</Text>
                </View>
              </View>
            </View>

            {/* Opções do Perfil */}
            <View style={styles.optionsSection}>
              <ProfileOption 
                icon="ticket-outline" 
                text="Ver Meus Ingressos" 
                onPress={() => navigation.navigate("Ingressos")}
                color={Colors.gamification.blue}
              />
              <ProfileOption 
                icon="account-group" 
                text="Encontrar Amigos" 
                onPress={() => navigation.navigate("Social")}
                color={Colors.gamification.magenta}
              />
              <ProfileOption 
                icon="image-outline" 
                text="Editar Foto de Perfil" 
                onPress={() => navigation.navigate('UploadImage')}
                color={Colors.gamification.purple}
              />
              <ProfileOption 
                icon="create-outline" 
                text="Editar Perfil" 
                onPress={() => navigation.navigate('EditarPerfil')}
                color={Colors.gamification.green}
              />
              <ProfileOption 
                icon="settings-outline" 
                text="Configurações" 
                onPress={() => navigation.navigate("Configuracoes")}
                color={Colors.gamification.orange}
              />
            </View>

            {/* Botão de Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <LoginScreen
            cpfInput={cpfInput}
            setCpfInput={setCpfInput}
            password={password}
            setPassword={setPassword}
            fazerLogin={fazerLogin}
            loading={loading}
          />
        )}
      </ScrollView>

      {/* Modal de Badge */}
      <BadgeModal
        visible={badgeModalVisible}
        badge={selectedBadge}
        badgeInfo={selectedBadgeInfo}
        isUnlocked={userGameData?.badges?.includes(selectedBadge) || false}
        onClose={closeBadgeModal}
        userGameData={userGameData}
      />
    </SafeAreaView>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // ==================== ESTILOS DE LOGIN ====================
  authContainer: {
    marginHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  authForm: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  authButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  profileContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // ==================== ESTILOS DE GAMIFICAÇÃO ====================
  gamificationHeader: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gamification.purple,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: Colors.gamification.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  levelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.gamification.orange}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.gamification.orange}30`,
  },
  streakText: {
    color: Colors.gamification.orange,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  streakLabel: {
    color: Colors.gamification.orange,
    fontSize: 12,
    marginLeft: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  xpSection: {
    gap: 8,
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  xpValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  xpBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpBarGradient: {
    flex: 1,
    borderRadius: 4,
  },
  xpPercentage: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    minWidth: 32,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // Estatísticas rápidas
  quickStatsContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsHorizontalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  statHorizontalCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // Badges
  badgesSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gamification.gold,
  },
  badgeCountContainer: {
    backgroundColor: `${Colors.gamification.gold}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeCount: {
    fontSize: 12,
    color: Colors.gamification.gold,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  badgesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    width: 70,
    gap: 8,
  },
  badgeIconContainer: {
    shadowColor: Colors.gamification.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // Informações pessoais
  infoSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // Opções do perfil
  optionsSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // Botão de logout
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },

  // ==================== MODAL DE BADGE ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 20,
  },
  modalBadgeContainer: {
    marginBottom: 20,
  },
  modalBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalBadgeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  modalBadgeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  modalProgressContainer: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
  },
  modalProgressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  modalProgressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  modalProgressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  modalUnlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  modalUnlockedDate: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  modalXpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.gamification.purple}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  modalXpReward: {
    fontSize: 14,
    color: Colors.gamification.purple,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
});