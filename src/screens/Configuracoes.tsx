import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import { ref, get, set } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Colors = {
  primary: '#6366F1',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
};

export default function Configuracoes() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [eventsBuyVisible, setEventsBuyVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [debugPasswordModalVisible, setDebugPasswordModalVisible] = useState(false);
  const [debugPassword, setDebugPassword] = useState('');
  const [isDebugUnlocked, setIsDebugUnlocked] = useState(false);
  const insets = useSafeAreaInsets();

  const VIDEO_STORAGE_DIR = FileSystem.documentDirectory + 'app_videos/';

  useEffect(() => {
    const fetchPrivacySetting = async () => {
      if (!user || !user.cpf) return;
      try {
        const privacyRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/privacy/eventsBuyVisible`);
        const snapshot = await get(privacyRef);
        if (snapshot.exists()) {
          setEventsBuyVisible(snapshot.val());
        } else {
          await set(privacyRef, true);
          setEventsBuyVisible(true);
        }
      } catch (error) {
        console.error('Erro ao buscar configuração de privacidade:', error);
        Alert.alert('Erro', 'Não foi possível carregar as configurações de privacidade.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacySetting();
  }, [user]);

  const toggleEventsBuyVisible = async () => {
    if (!user || !user.cpf) {
      Alert.alert('Erro', 'Você precisa estar logado para alterar esta configuração.');
      return;
    }
    const newValue = !eventsBuyVisible;
    try {
      const privacyRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/privacy/eventsBuyVisible`);
      await set(privacyRef, newValue);
      setEventsBuyVisible(newValue);
      Alert.alert('Sucesso', `Eventos ${newValue ? 'visíveis' : 'ocultos'} para o público.`);
    } catch (error) {
      console.error('Erro ao atualizar configuração de privacidade:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a configuração de privacidade.');
    }
  };

  const clearDownloadedVideos = async () => {
    Alert.alert(
      'Confirmar Limpeza',
      'Tem certeza que deseja limpar todos os vídeos baixados? Isso liberará espaço no seu dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: async () => {
            try {
              const dirInfo = await FileSystem.getInfoAsync(VIDEO_STORAGE_DIR);
              if (dirInfo.exists) {
                await FileSystem.deleteAsync(VIDEO_STORAGE_DIR, { idempotent: true });
                await FileSystem.makeDirectoryAsync(VIDEO_STORAGE_DIR, { intermediates: true });
                Alert.alert('Sucesso', 'Vídeos baixados limpos com sucesso!');
                console.log('Diretório de vídeos limpo:', VIDEO_STORAGE_DIR);
              } else {
                Alert.alert('Informação', 'Nenhum vídeo baixado encontrado para limpar.');
                console.log('Diretório de vídeos não encontrado:', VIDEO_STORAGE_DIR);
              }
            } catch (error) {
              console.error('Erro ao limpar vídeos baixados:', error);
              Alert.alert('Erro', 'Não foi possível limpar os vídeos baixados. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleDebugAccess = async () => {
    try {
      const debugRef = ref(databaseSocial, 'configgeralapp/dev');
      const snapshot = await get(debugRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && data.token === debugPassword) {
          setIsDebugUnlocked(true);
          setDebugPasswordModalVisible(false);
          setDebugPassword('');
          Alert.alert('Sucesso', 'Acesso DEBUG liberado!');
        } else {
          Alert.alert('Erro', 'Senha incorreta.');
        }
      } else {
        Alert.alert('Erro', 'Configuração de DEBUG não encontrada no banco de dados.');
      }
    } catch (error) {
      console.error('Erro ao verificar senha de DEBUG:', error);
      Alert.alert('Erro', 'Não foi possível verificar a senha de DEBUG.');
    }
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
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando configurações...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacidade</Text>
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <MaterialCommunityIcons name="ticket" size={20} color={Colors.textPrimary} />
                <Text style={styles.optionText}>Ocultar exibição de ingressos de eventos adquiridos ao público</Text>
              </View>
              <Switch
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor={Platform.OS === 'android' ? Colors.cardBackground : Colors.textSecondary}
                ios_backgroundColor={Colors.border}
                onValueChange={toggleEventsBuyVisible}
                value={!eventsBuyVisible}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug</Text>
            {!isDebugUnlocked ? (
              <TouchableOpacity style={styles.optionItem} onPress={() => setDebugPasswordModalVisible(true)}>
                <View style={styles.optionTextContainer}>
                  <MaterialCommunityIcons name="bug" size={20} color={Colors.textPrimary} />
                  <Text style={styles.optionText}>Acessar Opções de Debug</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={clearDownloadedVideos}>
                  <View style={styles.optionTextContainer}>
                    <MaterialCommunityIcons name="delete-empty" size={20} color={Colors.error} />
                    <Text style={[styles.optionText, { color: Colors.error }]}>Limpar Dados Adicionais Baixados</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
                {/* Adicione outras opções de debug aqui */}
              </>
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={debugPasswordModalVisible}
        onRequestClose={() => setDebugPasswordModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Insira o token de liberação</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Token de Acesso"
              secureTextEntry
              value={debugPassword}
              onChangeText={setDebugPassword}
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDebugPasswordModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleDebugAccess}
              >
                <Text style={styles.modalButtonText}>Acessar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 10,
    flexShrink: 1,
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTextInput: {
    width: 250,
    height: 40,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    color: Colors.textPrimary,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.error,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


