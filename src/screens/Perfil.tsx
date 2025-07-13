import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../services/firebase';
import { AuthContext } from '../contexts/AuthContext';

export default function Perfil() {
  const [cpfInput, setCpfInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login, logout } = useContext(AuthContext);

  const fazerLogin = async () => {
    if (!cpfInput || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('cpf', cpfInput);
      formData.append('password', password);

      const response = await fetch('https://piauitickets.com/api/validacao.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Busca dados completos no Firebase
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
          setCpfInput('');
          setPassword('');
        } else {
          Alert.alert('Erro', 'Usuário não encontrado no banco de dados.');
        }
      } else {
        Alert.alert('Erro', 'CPF ou senha inválidos.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      Alert.alert('Erro', 'Falha na conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>👤 Bem-vindo, {user.fullname}</Text>
        <Text>Email: {user.email}</Text>
        <Text>CPF: {user.cpf}</Text>
        <Text>Telefone: {user.telefone}</Text>
        <Text>Nascimento: {user.datanascimento}</Text>
        <Button title="Sair" onPress={handleLogout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login do PiauiTickets</Text>
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={cpfInput}
        onChangeText={setCpfInput}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Entrar" onPress={fazerLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, justifyContent: 'center',
  },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center',
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5,
  },
});
