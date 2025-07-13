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
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../services/firebase';
import { databaseSocial } from '../services/firebaseappdb'; // Importar o databaseSocial
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Definindo uma paleta de cores mais vibrante e moderna
const Colors = {
  primary: '#4A90E2', // Azul vibrante
  primaryDark: '#2F6BBF',
  accent: '#FFC107', // Amarelo para destaque
  background: '#F5F7FA', // Fundo claro e suave
  cardBackground: '#FFFFFF',
  textPrimary: '#333333',
  textSecondary: '#666666',
  error: '#D0021B', // Vermelho para erros
  success: '#7ED321',
  warning: '#F5A623',
  border: '#E0E0E0',
};

// Componente de Login
const LoginScreen = ({ cpfInput, setCpfInput, password, setPassword, fazerLogin, loading }) => (
  <View style={styles.authContainer}>
    <Text style={styles.authTitle}>Acesse sua conta</Text>
    <TextInput
      style={styles.input}
      placeholder="CPF"
      value={cpfInput}
      onChangeText={setCpfInput}
      keyboardType="numeric"
      placeholderTextColor={Colors.textSecondary}
    />
    <TextInput
      style={styles.input}
      placeholder="Senha"
      secureTextEntry
      value={password}
      onChangeText={setPassword}
      placeholderTextColor={Colors.textSecondary}
    />
    <TouchableOpacity style={styles.authButton} onPress={fazerLogin} disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.authButtonText}>Entrar</Text>
      )}
    </TouchableOpacity>
    <TouchableOpacity style={styles.forgotPasswordButton}>
      <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.registerButton}>
      <Text style={styles.registerButtonText}>Não tem conta? Cadastre-se</Text>
    </TouchableOpacity>
  </View>
);

// Componente de Opção de Perfil
const ProfileOption = ({ icon, text, onPress }) => {
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
        <Ionicons name={icon} size={24} color={Colors.primary} style={styles.optionIcon} />
        <Text style={styles.optionText}>{text}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

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
    if (user) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
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
  console.log("🔎 Buscando imagem de perfil...");
  console.log("📌 CPF do usuário:", cpf);
  console.log("🧭 Database utilizado: databaseSocial");
  const imageRefPath = `users/cpf/${cpf}/config/perfilimage`;
  console.log("📂 Caminho no banco:", imageRefPath);

  try {
    const imageRef = ref(databaseSocial, imageRefPath);
    const snapshot = await get(imageRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("✅ Imagem encontrada:", data);
      setProfileImageUrl(data.imageperfilurl);
    } else {
      console.warn("⚠️ Nenhum dado de imagem encontrado nesse caminho.");
      setProfileImageUrl(null);
    }
  } catch (error) {
    console.error("❌ Erro ao buscar imagem de perfil:", error);
    setProfileImageUrl(null);
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

  const handleEditProfile = () => {
    navigation.navigate('EditarPerfil');
  };

  const handleEditProfileImage = () => {
    navigation.navigate('UploadImage');
  };

  const handleSettings = () => {
    Alert.alert("Configurações", "Funcionalidade de configurações em desenvolvimento!");
  };

  const handleHelp = () => {
    Alert.alert("Ajuda", "Funcionalidade de ajuda em desenvolvimento!");
  };

  const handlePrivacyPolicy = () => {
    Alert.alert("Política de Privacidade", "Funcionalidade de política de privacidade em desenvolvimento!");
  };

  const handleTermsOfService = () => {
    Alert.alert("Termos de Serviço", "Funcionalidade de termos de serviço em desenvolvimento!");
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {user ? (
          <Animated.View style={[styles.profileContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
            <View style={styles.header}>
              {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle-outline" size={90} color={Colors.primary} />
              )}
              <Text style={styles.profileName}>{user.fullname.toUpperCase()}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Informações Pessoais</Text>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Telefone:</Text>
                <Text style={styles.infoValue}>{user.telefone || 'Não informado'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nascimento:</Text>
                <Text style={styles.infoValue}>{user.datanascimento || 'Não informado'}</Text>
              </View>
            </View>

            <View style={styles.optionsSection}>
              <ProfileOption icon="ticket-outline" text="Ver Meus Ingressos" onPress={() => navigation.navigate("Ingressos")} />
  <ProfileOption icon="image-outline" text="Editar Foto de Perfil" onPress={handleEditProfileImage} />
  <ProfileOption icon="create-outline" text="Editar Perfil" onPress={handleEditProfile} />
  <ProfileOption icon="settings-outline" text="Configurações" onPress={handleSettings} />
  <ProfileOption icon="document-text-outline" text="Termos de Serviço" onPress={handleTermsOfService} />
</View>


            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  // Estilos para a tela de Login
  authContainer: {
    marginHorizontal: 20,
    padding: 25,
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    marginBottom: 18,
    borderRadius: 10,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  authButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto-Medium',
  },
  registerButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto-Medium',
  },

  // Estilos para a tela de Perfil Logado
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: Colors.cardBackground,
    width: '100%',
    paddingVertical: 30,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 32, // Aumentado o tamanho da fonte
    fontWeight: 'bold',
    marginTop: 10,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
    textAlign: 'center', // Centraliza o texto
    textTransform: 'capitalize', // Garante que a primeira letra de cada palavra seja maiúscula
  },
  profileEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto-Medium',
  },
  infoSection: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto-Medium',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  optionsSection: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  logoutButton: {
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
});


