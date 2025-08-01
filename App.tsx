import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StackNavigator from './src/navigation/StackNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { databaseSocial } from './src/services/firebaseappdb'; // Importe o databaseSocial

export default function App() {
  const [appVisible, setAppVisible] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = ref(databaseSocial, 'configgeralapp');
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAppVisible(data.appvisible);
        setMessage(data.message || 'O aplicativo está temporariamente indisponível.');
      } else {
        // Se o nó não existir, assume que o app está visível por padrão
        setAppVisible(true);
        setMessage(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao ler configgeralapp do Firebase:", error);
      // Em caso de erro, assume que o app está visível para não bloquear o usuário
      setAppVisible(true);
      setMessage(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }

  if (appVisible === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFF',
    fontSize: 16,
  },
  messageText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
});
