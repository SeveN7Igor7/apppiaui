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
  Dimensions,
  Linking,
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../services/firebase';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoImage from '../images/logo.png';

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
};

// ==================== COMPONENTES PRINCIPAIS ====================
// Componente de Login
const LoginScreen = ({ cpfInput, setCpfInput, password, setPassword, fazerLogin, loading }) => {
  // Função para abrir URLs externas
  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link');
      }
    } catch (error) {
      console.error('Erro ao abrir URL:', error);
      Alert.alert('Erro', 'Não foi possível abrir o link');
    }
  };

  return (
    <View style={styles.loginScreenContainer}>
      <View style={styles.authContainer}>
        <View style={styles.authHeader}>
          {/* Logo com fundo estilizado */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image source={LogoImage} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>
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
          
          {/* Container para os botões de ação */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={() => openURL('https://piauitickets.com/recoverypassword/')}
            >
              <MaterialCommunityIcons name="lock-reset" size={16} color={Colors.primary} />
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => openURL('https://piauitickets.com/cadastro/')}
            >
              <MaterialCommunityIcons name="account-plus" size={16} color={Colors.accent} />
              <Text style={styles.signupButtonText}>Faça seu cadastro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

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
      
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const { user, login, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

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
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      setProfileImageUrl(null);
    }
  }, [user]);

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
      });

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
                color={Colors.primary}
              />
              <ProfileOption 
                icon="people-outline"
                text="Encontrar Amigos"
                onPress={() => navigation.navigate("Social")}
                color={Colors.accent}
              />
              <ProfileOption 
                icon="image-outline"
                text="Editar Foto de Perfil"
                onPress={() => navigation.navigate('UploadImage')}
                color={Colors.success}
              />
              <ProfileOption 
                icon="settings-outline"
                text="Configurações"
                onPress={() => navigation.navigate("Configuracoes")}
                color={Colors.warning}
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
  loginScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  authContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBackground: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  logoImage: {
    width: 120,
    height: 60,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  authForm: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  authButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  // Novos estilos para os botões de ação
  actionButtonsContainer: {
    marginTop: 20,
    gap: 16,
  },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: `${Colors.accent}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
    gap: 8,
  },
  signupButtonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
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
});
