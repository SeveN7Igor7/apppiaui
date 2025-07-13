import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

// IMPORTA APENAS O DATABASE CORRETO DO FIREBASEAPPDB
import { databaseSocial as database } from '../services/firebaseappdb';
import { ref, set, get, child } from 'firebase/database';

type VibeScreenRouteProp = RouteProp<
  { params: { eventId: string; nomeEvento: string; cpf: string } },
  'params'
>;

export default function VibeScreen() {
  const route = useRoute<VibeScreenRouteProp>();
  const navigation = useNavigation();

  const { eventId, nomeEvento, cpf } = route.params;

  const [nota, setNota] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // DEBUG: Verificar se o database está definido
  console.log('database importado em VibeScreen:', database);

  // Carrega avaliação existente se houver
  useEffect(() => {
    async function carregarAvaliacao() {
      try {
        const snapshot = await get(child(ref(database), `avaliacoesVibe/${eventId}/${cpf}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setNota(data.nota);
          console.log('Avaliação encontrada:', data);
        } else {
          console.log('Nenhuma avaliação encontrada para este usuário.');
        }
      } catch (error) {
        console.error('Erro ao carregar avaliação:', error);
        Alert.alert('Erro', 'Não foi possível carregar sua avaliação. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    carregarAvaliacao();
  }, [eventId, cpf]);

  async function enviarAvaliacao(novaNota: number) {
    setEnviando(true);
    try {
      await set(ref(database, `avaliacoesVibe/${eventId}/${cpf}`), {
        nota: novaNota,
        timestamp: Date.now(),
      });
      setNota(novaNota);
      Alert.alert('Obrigado!', 'Sua avaliação foi registrada com sucesso.');
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível enviar sua avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const opcoesNotas = [1, 2, 3, 4, 5];
  const emojis = ['😞', '😐', '🙂', '😃', '🤩'];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Carregando avaliação...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Avalie a vibe do evento:</Text>
      <Text style={styles.nomeEvento}>{nomeEvento}</Text>

      {nota !== null ? (
        <View style={styles.avaliacaoAtualContainer}>
          <Text style={styles.avaliacaoAtualTexto}>
            Você já avaliou este evento com a nota:
          </Text>
          <Text style={styles.notaAtual}>{emojis[nota - 1]} ({nota})</Text>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.botaoVoltarText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.opcoesContainer}>
            {opcoesNotas.map((num, i) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.emojiButton,
                  nota === num && styles.emojiButtonSelecionado,
                ]}
                onPress={() => enviarAvaliacao(num)}
                disabled={enviando}
              >
                <Text style={styles.emoji}>{emojis[i]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {enviando && <ActivityIndicator size="small" color="#6200ee" />}
          <TouchableOpacity
            style={styles.botaoCancelar}
            onPress={() => navigation.goBack()}
            disabled={enviando}
          >
            <Text style={styles.botaoCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  nomeEvento: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    color: '#6200ee',
  },
  opcoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  emojiButton: {
    padding: 10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonSelecionado: {
    borderColor: '#6200ee',
    backgroundColor: '#e0d7ff',
  },
  emoji: {
    fontSize: 36,
  },
  avaliacaoAtualContainer: {
    alignItems: 'center',
  },
  avaliacaoAtualTexto: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  notaAtual: {
    fontSize: 48,
    marginBottom: 24,
  },
  botaoVoltar: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  botaoVoltarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botaoCancelar: {
    alignSelf: 'center',
  },
  botaoCancelarText: {
    color: '#6200ee',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
