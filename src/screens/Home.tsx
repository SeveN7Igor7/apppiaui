import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../services/firebase';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type Evento = {
  id: string;
  nomeevento: string;
  nomeurl?: string;
  imageurl: string;
  eventvisible: boolean;
  datainicio?: string;
  aberturaportas?: string;
  vendaaberta: { vendaaberta: boolean; mensagem: string };
};

type VibeData = {
  media: number;
  count: number;
};

export default function Home() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [storyAberto, setStoryAberto] = useState<Evento | null>(null);
  const [vibes, setVibes] = useState<Record<string, VibeData>>({});

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationErrorMsg('Permissão para localização negada.');
        setLocationLoading(false);
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        setLocationErrorMsg('Erro ao obter localização.');
      }
      setLocationLoading(false);
    })();
  }, []);

  useEffect(() => {
    const eventosRef = ref(database, 'eventos/');
    const unsubscribe = onValue(eventosRef, (snapshot) => {
      const data = snapshot.val();
      const lista: Evento[] = [];

      if (data) {
        Object.keys(data).forEach((id) => {
          const evento = data[id];
          if (evento.eventvisible) {
            console.log(`[Home] Evento carregado: ID=${id}, nome=${evento.nomeevento}`);
            lista.push({
              id,
              nomeevento: evento.nomeevento || 'Sem nome',
              imageurl: evento.imageurl || '',
              nomeurl: evento.nomeurl,
              eventvisible: true,
              datainicio: evento.datainicio,
              aberturaportas: evento.aberturaportas,
              vendaaberta: evento.vendaaberta || { vendaaberta: false, mensagem: '' },
            });
          }
        });
      }

      setEventos(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aqui a função que calcula média considerando só avaliações da última 1 hora
  async function calcularMediaVibe(eventId: string): Promise<VibeData | null> {
    try {
      console.log(`[Home] Iniciando cálculo da vibe para evento: ${eventId}`);

      const snapshot = await get(ref(databaseSocial, `avaliacoesVibe/${eventId}/`));
      console.log(`[Home] Snapshot da vibe para evento ${eventId}:`, snapshot.exists(), snapshot.val());

      if (!snapshot.exists()) {
        console.log(`[Home] Nenhuma avaliação encontrada para o evento ${eventId}.`);
        return null;
      }

      const data = snapshot.val();
      const agora = Date.now();
      const umaHoraMs = 60 * 60 * 1000;

      // Filtrar só avaliações feitas na última 1 hora
      const avaliacoesRecentes = Object.values(data).filter((item: any) => {
        if (!item.timestamp) return false;
        const diff = agora - item.timestamp;
        return diff >= 0 && diff <= umaHoraMs;
      }) as { nota: number; timestamp: number }[];

      console.log(`[Home] Avaliações recentes (última 1h) para evento ${eventId}:`, avaliacoesRecentes.length, avaliacoesRecentes);

      if (avaliacoesRecentes.length === 0) return null;

      const totalNotas = avaliacoesRecentes.reduce((acc, cur) => acc + cur.nota, 0);
      const quantidade = avaliacoesRecentes.length;
      const media = totalNotas / quantidade;

      console.log(`[Home] Média atualizada para evento ${eventId}: ${media} com ${quantidade} avaliações.`);

      return { media, count: quantidade };
    } catch (error) {
      console.error(`[Home] Erro ao calcular vibe do evento ${eventId}:`, error);
      return null;
    }
  }

  useEffect(() => {
    if (eventos.length === 0) return;

    async function carregarVibes() {
      const vibesArray = await Promise.all(
        eventos.map(async (evento) => {
          const vibe = await calcularMediaVibe(evento.id);
          return { id: evento.id, vibe };
        })
      );

      const vibesMap: Record<string, VibeData> = {};
      vibesArray.forEach(({ id, vibe }) => {
        if (vibe) {
          vibesMap[id] = vibe;
        }
      });

      setVibes(vibesMap);
    }

    carregarVibes();

    // Opcional: atualizar vibes a cada X minutos para refletir "expiração" das avaliações
    const intervalo = setInterval(() => {
      carregarVibes();
    }, 5 * 60 * 1000); // a cada 5 minutos

    return () => clearInterval(intervalo);
  }, [eventos]);

  const getUrgenciaMensagem = (evento: Evento): string => {
    try {
      if (!evento.datainicio || !evento.aberturaportas) return '';
      const hoje = new Date();
      const [dia, mes, ano] = evento.datainicio.split('/').map(Number);
      const [hora, minuto] = evento.aberturaportas.replace('h', ':').split(':').map(Number);
      const dataEvento = new Date(ano, mes - 1, dia, hora, minuto);

      const diffMs = dataEvento.getTime() - hoje.getTime();
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMin = Math.floor(diffMs / (1000 * 60));

      if (diffMin <= 0) return '🔴 Acontecendo agora!';
      if (diffMin < 60) return `⏳ Faltam ${diffMin} min`;
      if (diffHoras <= 5) return `⏱️ Faltam ${diffHoras} horas`;
      return '';
    } catch {
      return '';
    }
  };

  const eventosHoje = eventos.filter((ev) => {
    if (!ev.datainicio) return false;
    try {
      const hoje = new Date();
      const [dia, mes, ano] = ev.datainicio.split('/').map(Number);
      return (
        hoje.getDate() === dia &&
        hoje.getMonth() + 1 === mes &&
        hoje.getFullYear() === ano
      );
    } catch {
      return false;
    }
  });

  const eventosFuturos = eventos.filter((ev) => !eventosHoje.includes(ev));
  const eventosParaLista = [...eventosHoje, ...eventosFuturos];

  function handleAvaliarVibe(evento: Evento) {
    if (!user) {
      Alert.alert(
        'Login necessário',
        'Você precisa estar logado para avaliar a vibe do evento.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Perfil' as never) },
        ]
      );
      return;
    }
    navigation.navigate('VibeScreen' as never, {
      eventId: evento.id,
      nomeEvento: evento.nomeevento,
      cpf: user.cpf,
    } as never);
  }

  const getMensagemVibe = (eventoId: string): string => {
    const vibe = vibes[eventoId];
    if (!vibe || vibe.count === 0) return 'Seja o primeiro a avaliar!';
    if (vibe.count <= 3) return `Poucas avaliações (${vibe.count})`;
    if (vibe.count >= 4 && vibe.count < 9) {
      if (vibe.media < 3) return 'Vibe baixa, pode melhorar';
      if (vibe.media < 4.5) return 'Vibe boa, mas pode melhorar';
      return 'Vibe alta, evento recomendado!';
    }
    if (vibe.media < 3) return 'Vibe baixa';
    if (vibe.media < 4.5) return 'Vibe moderada';
    return '🔥 Altíssima vibe!';
  };

  const mostraSeloAltaVibe = (eventoId: string): boolean => {
    const vibe = vibes[eventoId];
    return !!vibe && vibe.count >= 9 && vibe.media >= 4.5;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎫 Eventos Piauí Tickets</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text>Carregando eventos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {eventosHoje.length > 0 && (
            <View style={styles.storiesContainer}>
              <Text style={styles.sectionTitle}>🔥 Em Destaque</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {eventosHoje.map((evento) => (
                  <TouchableOpacity
                    key={evento.id}
                    style={styles.storyCard}
                    onPress={() => setStoryAberto(evento)}
                  >
                    <Image source={{ uri: evento.imageurl }} style={styles.storyImage} />
                    <Text style={styles.storyText}>{evento.nomeevento}</Text>
                    <Text style={styles.storyUrgencia}>{getUrgenciaMensagem(evento)}</Text>

                    <Text style={{ fontSize: 11, color: '#444' }}>
                      {getMensagemVibe(evento.id)}
                    </Text>

                    {mostraSeloAltaVibe(evento.id) && (
                      <Text style={{ color: '#e53935', fontWeight: 'bold', fontSize: 16 }}>
                        🔥 Altíssima vibe!
                      </Text>
                    )}

                    <TouchableOpacity
                      onPress={() => handleAvaliarVibe(evento)}
                      style={styles.botaoAvaliar}
                    >
                      <Text style={styles.botaoAvaliarText}>✨ Avaliar vibe</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.locationMessageContainer}>
            {locationLoading && (
              <Text style={styles.locationMessageText}>Carregando localização...</Text>
            )}
            {!!locationErrorMsg && (
              <Text style={[styles.locationMessageText, { color: '#b71c1c' }]}>
                {locationErrorMsg}
              </Text>
            )}
          </View>

          <View style={styles.mapContainer}>
            {location && (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                showsUserLocation
                showsMyLocationButton
                zoomControlEnabled
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Você está aqui"
                />
              </MapView>
            )}
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>📅 Próximos Eventos</Text>
            {eventosParaLista.map((evento) => {
              const encerrado = !evento.vendaaberta?.vendaaberta;
              return (
                <View key={evento.id} style={styles.eventCard}>
                  <Image
                    source={{ uri: evento.imageurl }}
                    style={[styles.eventImage, encerrado && { opacity: 0.4 }]}
                  />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventName}>{evento.nomeevento}</Text>
                    {encerrado && (
                      <Text style={styles.vendaEncerrada}>🚫 Vendas online encerradas</Text>
                    )}

                    {eventosHoje.includes(evento) && (
                      <>
                        <Text style={{ fontSize: 11, color: '#444' }}>
                          {getMensagemVibe(evento.id)}
                        </Text>

                        {mostraSeloAltaVibe(evento.id) && (
                          <Text style={{ color: '#e53935', fontWeight: 'bold', fontSize: 16 }}>
                            🔥 Altíssima vibe!
                          </Text>
                        )}

                        <TouchableOpacity
                          onPress={() => handleAvaliarVibe(evento)}
                          style={styles.botaoAvaliarLista}
                        >
                          <Text style={styles.botaoAvaliarText}>✨ Avaliar vibe</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.futureSection}>
            <Text style={styles.sectionTitle}>✨ Em breve</Text>
            <Text style={styles.placeholder}>Novidades serão exibidas aqui!</Text>
          </View>
        </ScrollView>
      )}

      <Modal visible={!!storyAberto} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {storyAberto && (
              <>
                <Image source={{ uri: storyAberto.imageurl }} style={styles.storyFullImage} />
                <Text style={styles.modalTitle}>{storyAberto.nomeevento}</Text>
                <TouchableOpacity
                  style={styles.botaoComprar}
                  onPress={() =>
                    Linking.openURL(
                      `https://piauitickets.com/comprar/${storyAberto.id}/${storyAberto.nomeurl || ''}`
                    )
                  }
                >
                  <Text style={styles.botaoComprarText}>🎟️ Garanta seu acesso agora</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStoryAberto(null);
                    handleAvaliarVibe(storyAberto);
                  }}
                  style={styles.botaoAvaliarModal}
                >
                  <Text style={styles.botaoAvaliarText}>✨ Avaliar vibe</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStoryAberto(null)} style={styles.fecharModal}>
                  <Text style={styles.fecharModalText}>✖ Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storiesContainer: {
    marginTop: 20,
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  storyCard: {
    marginRight: 16,
    width: 120,
    alignItems: 'center',
  },
  storyImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6200ee',
    marginBottom: 6,
  },
  storyText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  storyUrgencia: {
    fontSize: 11,
    color: '#e53935',
    textAlign: 'center',
  },
  botaoAvaliar: {
    marginTop: 6,
    backgroundColor: '#ff4081',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  botaoAvaliarLista: {
    marginTop: 8,
    backgroundColor: '#ff4081',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  botaoAvaliarModal: {
    backgroundColor: '#ff4081',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 20,
  },
  botaoAvaliarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  locationMessageContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    minHeight: 20,
  },
  locationMessageText: {
    fontSize: 14,
    color: '#555',
  },
  mapContainer: {
    marginHorizontal: 16,
    marginVertical: 25,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  map: {
    flex: 1,
    width: '100%',
  },
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  eventCard: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    paddingBottom: 12,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventContent: {
    padding: 10,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendaEncerrada: {
    marginTop: 4,
    color: '#b71c1c',
    fontWeight: 'bold',
  },
  futureSection: {
    marginTop: 40,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  placeholder: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    width: width * 0.85,
    padding: 10,
    alignItems: 'center',
  },
  storyFullImage: {
    width: '100%',
    height: 220,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  botaoComprar: {
    backgroundColor: '#6200ee',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 15,
  },
  botaoComprarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fecharModal: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  fecharModalText: {
    fontSize: 22,
    color: '#888',
  },
});
