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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import { ref, get, set } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';

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

  useEffect(() => {
    const fetchPrivacySetting = async () => {
      if (!user || !user.cpf) return;
      try {
        const privacyRef = ref(databaseSocial, `users/cpf/${user.cpf}/config/privacy/eventsBuyVisible`);
        const snapshot = await get(privacyRef);
        if (snapshot.exists()) {
          setEventsBuyVisible(snapshot.val());
        } else {
          // Se não houver configuração, assume como visível (true) e salva no DB
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
    <SafeAreaView style={styles.container}>
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
                <MaterialCommunityIcons name="ticket-off" size={20} color={Colors.textPrimary} />
                <Text style={styles.optionText}>Ocultar exibição de ingressos de eventos adquiridos ao público</Text>
              </View>
              <Switch
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor={Platform.OS === 'android' ? Colors.cardBackground : Colors.textSecondary}
                ios_backgroundColor={Colors.border}
                onValueChange={toggleEventsBuyVisible}
                value={!eventsBuyVisible} // Invertido para refletir o texto "Ocultar"
              />
            </View>
          </View>
        </ScrollView>
      )}
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
});


