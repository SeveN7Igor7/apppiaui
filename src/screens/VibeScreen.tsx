import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// IMPORTA APENAS O DATABASE CORRETO DO FIREBASEAPPDB
import { databaseSocial as database } from '../services/firebaseappdb';
import { ref, set, get, child } from 'firebase/database';

type VibeScreenRouteProp = RouteProp<
  { params: { eventId: string; nomeEvento: string; cpf: string } },
  'params'
>;

const { width, height } = Dimensions.get('window');

export default function VibeScreen() {
  const route = useRoute<VibeScreenRouteProp>();
  const navigation = useNavigation();
  const { eventId, nomeEvento, cpf } = route.params;

  const [nota, setNota] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // DEBUG: Verificar se o database está definido
  console.log('database importado em VibeScreen:', database);

  useEffect(() => {
    // Animação de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animação de pulso contínua para o título
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

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

  const animateEmojiSelection = (index: number) => {
    // Vibração tátil
    Vibration.vibrate(50);

    // Animação de bounce no emoji selecionado
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showSuccessAnimation = () => {
    setShowSuccess(true);

    // Animação de sucesso
    Animated.parallel([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Após 2 segundos, esconder a animação de sucesso
      setTimeout(() => {
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccess(false);
        });
      }, 2000);
    });
  };

  async function enviarAvaliacao(novaNota: number) {
    setSelectedEmoji(novaNota);
    animateEmojiSelection(novaNota - 1);

    setEnviando(true);
    try {
      await set(ref(database, `avaliacoesVibe/${eventId}/${cpf}`), {
        nota: novaNota,
        timestamp: Date.now(),
      });
      setNota(novaNota);
      showSuccessAnimation();
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível enviar sua avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const opcoesNotas = [1, 2, 3, 4, 5];
  const emojis = ['😞', '😐', '🙂', '😃', '🤩'];
  const vibeLabels = ['Vibe Baixa', 'Vibe Morna', 'Vibe Boa', 'Vibe Alta', 'Vibe Incrível!'];
  const vibeColors = ['#FF6B6B', '#FFA726', '#FFEB3B', '#66BB6A', '#AB47BC'];

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.centered}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Carregando avaliação...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header com animação de pulso */}
        <Animated.View style={[styles.header, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialCommunityIcons name="heart-pulse" size={40} color="#fff" />
          <Text style={styles.titulo}>Como está a vibe?</Text>
          <Text style={styles.nomeEvento}>{nomeEvento}</Text>
        </Animated.View>

        {nota !== null ? (
          // Tela de avaliação já realizada
          <Animated.View style={styles.avaliacaoAtualContainer}>
            <View style={styles.avaliacaoCompletaCard}>
              <MaterialCommunityIcons name="check-circle" size={60} color="#4CAF50" />
              <Text style={styles.avaliacaoAtualTexto}>
                Vibe Registrada!
              </Text>
              <View style={styles.notaAtualContainer}>
                <Text style={styles.notaAtualEmoji}>{emojis[nota - 1]}</Text>
                <Text style={styles.notaAtualLabel}>{vibeLabels[nota - 1]}</Text>
                <Text style={styles.notaAtualNota}>({nota}/5)</Text>
              </View>

              <View style={styles.impactoContainer}>
                <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
                <Text style={styles.impactoTexto}>
                  Sua avaliação ajuda outros usuários!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.botaoVoltar}
                onPress={() => navigation.goBack()}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.botaoVoltarGradient}
                >
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                  <Text style={styles.botaoVoltarText}>Voltar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          // Tela de avaliação
          <>
            <View style={styles.avaliacaoCard}>
              <Text style={styles.instrucaoTexto}>
                Toque no emoji que representa sua experiência:
              </Text>

              <View style={styles.opcoesContainer}>
                {opcoesNotas.map((num, i) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === num && styles.emojiButtonSelecionado,
                    ]}
                    onPress={() => enviarAvaliacao(num)}
                    disabled={enviando}
                  >
                    <Animated.View
                      style={[
                        styles.emojiContainer,
                        { transform: [{ scale: scaleAnims[i] }] }
                      ]}
                    >
                      <Text style={styles.emoji}>{emojis[i]}</Text>
                      <Text style={[styles.vibeLabel, { color: vibeColors[i] }]}>
                        {vibeLabels[i]}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>

              {enviando && (
                <View style={styles.enviandoContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.enviandoTexto}>Registrando sua vibe...</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => navigation.goBack()}
              disabled={enviando}
            >
              <Text style={styles.botaoCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Animação de sucesso */}
        {showSuccess && (
          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: successAnim,
                transform: [{ scale: successAnim }]
              }
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
            <Text style={styles.successText}>Vibe Registrada!</Text>
            <Text style={styles.successSubtext}>Obrigado por contribuir!</Text>

            {/* Confetes animados */}
            <Animated.View
              style={[
                styles.confettiContainer,
                {
                  opacity: confettiAnim,
                  transform: [{ translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 50]
                  })}]
                }
              ]}
            >
              <Text style={styles.confetti}>🎉</Text>
              <Text style={styles.confetti}>✨</Text>
              <Text style={styles.confetti}>🎊</Text>
              <Text style={styles.confetti}>⭐</Text>
            </Animated.View>
          </Animated.View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  nomeEvento: {
    fontSize: 18,
    color: '#E8EAF6',
    textAlign: 'center',
    fontWeight: '500',
  },
  avaliacaoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    // backdropFilter is a web CSS property, might not work directly in React Native without a polyfill or specific library
    // For React Native, consider using 'react-native-blur' or similar for blur effects if needed.
    // Removed for broader compatibility: backdropFilter: 'blur(10px)',
  },
  instrucaoTexto: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  opcoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from 'space-around' for better distribution
    marginBottom: 24,
  },
  emojiButton: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 15,
    flex: 1, // Added to make buttons take equal space
    // minWidth: 60, // Removed to allow shrinking on smaller screens
  },
  emojiButtonSelecionado: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    // transform: [{ scale: 1.1 }], // Removed, as animation handles this
  },
  emojiContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  vibeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  enviandoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  enviandoTexto: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  avaliacaoAtualContainer: {
    alignItems: 'center',
  },
  avaliacaoCompletaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    // Removed for broader compatibility: backdropFilter: 'blur(10px)',
  },
  avaliacaoAtualTexto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  notaAtualContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  notaAtualEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  notaAtualLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  notaAtualNota: {
    fontSize: 16,
    color: '#E8EAF6',
  },
  impactoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  impactoTexto: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  botaoVoltar: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  botaoVoltarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  botaoVoltarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  botaoCancelar: {
    alignSelf: 'center',
    padding: 12,
  },
  botaoCancelarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    color: '#E8EAF6',
    marginTop: 8,
    textAlign: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  confetti: {
    fontSize: 30,
  },
});