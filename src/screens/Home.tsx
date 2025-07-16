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
  StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../services/firebase';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';
import { MapStyle } from '../constants/MapStyle';
import { Animated, Easing } from 'react-native';

const PulsatingCircle = ({ size, color }) => {
  const scale = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(scale, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const pulseStyle = {
    transform: [
      {
        scale: scale.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.5, 1],
        }),
      },
    ],
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    position: 'absolute',
  };

  return <Animated.View style={pulseStyle} />;
};

const { width, height } = Dimensions.get('window');

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
  const [visualizacaoCompleta, setVisualizacaoCompleta] = useState(false);

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

      if (diffMin <= 0) return 'Acontecendo agora!';
      if (diffMin < 60) return `Faltam ${diffMin} min`;
      if (diffHoras <= 5) return `Faltam ${diffHoras} horas`;
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

  const handleOpenSalesPage = (evento: Evento) => {
    const url = `https://piauitickets.com/comprar/${evento.id}/${evento.nomeurl || ''}`;
    Linking.openURL(url).catch(err => console.error('Erro ao abrir URL:', err));
  };

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
    return 'Altíssima vibe!';
  };

  const mostraSeloAltaVibe = (eventoId: string): boolean => {
    const vibe = vibes[eventoId];
    return !!vibe && vibe.count >= 9 && vibe.media >= 4.5;
  };

  // Componente Story Card estilo Instagram
  const renderStoryCard = (evento: Evento, index: number) => (
    <TouchableOpacity
      key={evento.id}
      style={[styles.storyCard, { marginLeft: index === 0 ? 0 : 12 }]}
      onPress={() => setStoryAberto(evento)}
      activeOpacity={0.8}
    >
      <View style={styles.storyImageContainer}>
        <Image source={{ uri: evento.imageurl }} style={styles.storyImage} />
        
        {/* Borda gradiente estilo Instagram */}
        <LinearGradient
          colors={['#FF006E', '#FB5607', '#FF006E']}
          style={styles.storyBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Badge de alta vibe */}
        {mostraSeloAltaVibe(evento.id) && (
          <View style={styles.storyVibeBadge}>
            <MaterialCommunityIcons name="fire" size={12} color={Colors.text.onPrimary} />
          </View>
        )}
      </View>
      
      <Text style={styles.storyTitle} numberOfLines={2}>
        {evento.nomeevento}
      </Text>
    </TouchableOpacity>
  );

  const renderEventCard = (evento: Evento) => {
    const encerrado = !evento.vendaaberta?.vendaaberta;
    
    return (
      <TouchableOpacity
        key={evento.id}
        style={styles.eventCard}
        onPress={() => handleOpenSalesPage(evento)}
        activeOpacity={0.9}
      >
        <View style={styles.eventImageContainer}>
          <Image
            source={{ uri: evento.imageurl }}
            style={[styles.eventImage, encerrado && styles.eventImageDisabled]}
          />
          
          {/* Overlay para eventos encerrados */}
          {encerrado && (
            <View style={styles.eventDisabledOverlay}>
              <MaterialCommunityIcons name="close-circle" size={24} color={Colors.text.onPrimary} />
              <Text style={styles.eventDisabledText}>Vendas Encerradas</Text>
            </View>
          )}
          
          {/* Badge de alta vibe para eventos ativos */}
          {mostraSeloAltaVibe(evento.id) && !encerrado && (
            <View style={styles.eventHighVibeBadge}>
              <MaterialCommunityIcons name="fire" size={14} color={Colors.text.onPrimary} />
              <Text style={styles.eventHighVibeBadgeText}>Alta Vibe</Text>
            </View>
          )}
        </View>
        
        <View style={styles.eventCardContent}>
          <Text style={styles.eventName} numberOfLines={2}>
            {evento.nomeevento}
          </Text>
          
          {evento.datainicio && (
            <View style={styles.eventInfoRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={Colors.text.tertiary} />
              <Text style={styles.eventInfoText}>{evento.datainicio}</Text>
            </View>
          )}
          
          {evento.aberturaportas && (
            <View style={styles.eventInfoRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.text.tertiary} />
              <Text style={styles.eventInfoText}>{evento.aberturaportas}</Text>
            </View>
          )}
          
          {/* Informações de vibe para eventos de hoje */}
          {eventosHoje.includes(evento) && (
            <>
              <Text style={styles.vibeMessage}>{getMensagemVibe(evento.id)}</Text>
              
              <TouchableOpacity
                onPress={() => handleAvaliarVibe(evento)}
                style={styles.vibeButtonSmall}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradients.primaryMagenta}
                  style={styles.vibeButtonSmallGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="star-outline" size={14} color={Colors.text.onPrimary} />
                  <Text style={styles.vibeButtonSmallText}>Avaliar Vibe</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
          
          {/* Botão de ação principal */}
          {!encerrado && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenSalesPage(evento)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Colors.gradients.primaryPurple}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="ticket" size={16} color={Colors.text.onPrimary} />
                <Text style={styles.actionButtonText}>Ver Detalhes</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.neutral.black} />
      
      {/* Header com fundo preto */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="ticket" size={24} color={Colors.text.onPrimary} />
          <Image 
            source={require('../images/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.profileButton}>
            <MaterialCommunityIcons name="account-circle" size={24} color={Colors.text.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.purple} />
          <Text style={styles.loadingText}>Carregando eventos...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Seção de Stories (Eventos em Destaque) */}
          {eventosHoje.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="fire" size={24} color={Colors.primary.magenta} />
                <Text style={styles.sectionTitle}>Em Destaque</Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScrollContent}
              >
                {eventosHoje.map(renderStoryCard)}
              </ScrollView>
            </View>
          )}

          {/* Seção de Localização */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="map-marker" size={24} color={Colors.primary.purple} />
              <Text style={styles.sectionTitle}>Localização</Text>
            </View>
            
            {locationLoading && (
              <View style={styles.locationMessage}>
                <ActivityIndicator size="small" color={Colors.primary.purple} />
                <Text style={styles.locationMessageText}>Carregando localização...</Text>
              </View>
            )}
            
            {!!locationErrorMsg && (
              <View style={styles.locationMessage}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.feedback.error} />
                <Text style={[styles.locationMessageText, { color: Colors.feedback.error }]}>
                  {locationErrorMsg}
                </Text>
              </View>
            )}

            {location && (
              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  customMapStyle={MapStyle}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  zoomControlEnabled={false}
                  showsCompass={false}
                  showsScale={false}
                  showsTraffic={false}
                  showsIndoors={false}
                  showsBuildings={false}
                >

                  {location && (
                    <View style={styles.pulsatingContainer}>
                      <PulsatingCircle size={20} color="rgba(66, 133, 244, 0.7)" />
                      <View style={styles.userLocationDot} />
                    </View>
                  )}
                </MapView>
              </View>
            )}
          </View>

          {/* Seção de Próximos Eventos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar" size={24} color={Colors.primary.purple} />
              <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            </View>
            
            <View style={styles.eventsGrid}>
              {eventosParaLista.map(renderEventCard)}
            </View>
          </View>

          {/* Seção Em Breve */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="star-outline" size={24} color={Colors.primary.magenta} />
              <Text style={styles.sectionTitle}>Em Breve</Text>
            </View>
            
            <View style={styles.comingSoonContainer}>
              <MaterialCommunityIcons name="rocket-launch" size={48} color={Colors.text.tertiary} />
              <Text style={styles.comingSoonText}>Novidades serão exibidas aqui!</Text>
              <Text style={styles.comingSoonSubtext}>Fique ligado para não perder nenhum evento incrível.</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal de Story estilo Instagram */}
      <Modal visible={!!storyAberto} animationType="fade" transparent>
        <View style={styles.storyModalOverlay}>
          {storyAberto && (
            <>
              {/* Imagem de fundo */}
              <Image source={{ uri: storyAberto.imageurl }} style={styles.storyModalBackground} />
              
              {/* Overlay escuro - oculto na visualização completa */}
              {!visualizacaoCompleta && (
                <View style={styles.storyModalDarkOverlay} />
              )}
              
              {/* Header do story - oculto na visualização completa */}
              {!visualizacaoCompleta && (
                <View style={styles.storyModalHeader}>
                  <View style={styles.storyModalProgress}>
                    <View style={styles.storyProgressBar} />
                  </View>
                  
                  <View style={styles.storyModalHeaderContent}>
                    <View style={styles.storyModalEventInfo}>
                      <Text style={styles.storyModalEventName}>{storyAberto.nomeevento}</Text>
                      {storyAberto.datainicio && (
                        <Text style={styles.storyModalEventDate}>{storyAberto.datainicio}</Text>
                      )}
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => {
                        setStoryAberto(null);
                        setVisualizacaoCompleta(false);
                      }} 
                      style={styles.storyModalCloseButton}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="close" size={24} color={Colors.story.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Conteúdo central - oculto na visualização completa */}
              {!visualizacaoCompleta && (
                <View style={styles.storyModalContent}>
                  {getUrgenciaMensagem(storyAberto) && (
                    <View style={styles.storyUrgencyBadge}>
                      <MaterialCommunityIcons name="clock-fast" size={20} color={Colors.story.text} />
                      <Text style={styles.storyUrgencyText}>{getUrgenciaMensagem(storyAberto)}</Text>
                    </View>
                  )}
                  
                  <Text style={styles.storyVibeMessage}>{getMensagemVibe(storyAberto.id)}</Text>
                  
                  {/* Botão Ver Conteúdo Inteiro */}
                  <TouchableOpacity
                    style={styles.verConteudoButton}
                    onPress={() => setVisualizacaoCompleta(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="fullscreen" size={16} color={Colors.story.text} />
                    <Text style={styles.verConteudoButtonText}>Ver conteúdo inteiro</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Botão de voltar - visível apenas na visualização completa */}
              {visualizacaoCompleta && (
                <TouchableOpacity
                  style={styles.voltarButton}
                  onPress={() => setVisualizacaoCompleta(false)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.story.text} />
                </TouchableOpacity>
              )}
              
              {/* Botões de ação na parte inferior - ocultos na visualização completa */}
              {!visualizacaoCompleta && (
                <View style={styles.storyModalActions}>
                  <TouchableOpacity
                    style={styles.storyActionButton}
                    onPress={() => {
                      setStoryAberto(null);
                      setVisualizacaoCompleta(false);
                      handleAvaliarVibe(storyAberto);
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={Colors.gradients.primaryMagenta}
                      style={styles.storyActionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <MaterialCommunityIcons name="star-outline" size={20} color={Colors.story.text} />
                      <Text style={styles.storyActionButtonText}>Avaliar Vibe</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.storyPrimaryButton}
                    onPress={() =>
                      Linking.openURL(
                        `https://piauitickets.com/comprar/${storyAberto.id}/${storyAberto.nomeurl || ''}`
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={Colors.gradients.primaryPurple}
                      style={styles.storyActionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <MaterialCommunityIcons name="ticket" size={20} color={Colors.story.text} />
                      <Text style={styles.storyActionButtonText}>Garanta seu ingresso</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  
  // Header Styles
  header: {
    backgroundColor: Colors.neutral.black,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.container.horizontal,
    elevation: Spacing.elevation.high,
    shadowColor: Colors.shadow.dark,
    shadowOffset: Spacing.shadowOffset.medium,
    shadowOpacity: 0.3,
    shadowRadius: Spacing.shadowRadius.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {
    height: 32,
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.container.horizontal,
  },
  loadingText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  
  // Scroll View Styles
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: Spacing.xxxxl,
  },
  
  // Section Styles
  section: {
    marginTop: Spacing.section.marginTop,
    paddingHorizontal: Spacing.container.horizontal,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  
  // Stories Styles (Instagram-like)
  storiesScrollContent: {
    paddingRight: Spacing.lg,
  },
  storyCard: {
    alignItems: 'center',
    width: 80,
  },
  storyImageContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  storyImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: Colors.neutral.white,
  },
  storyBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 38,
    zIndex: -1,
  },
  storyVibeBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary.magenta,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  storyTitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Event Card Styles
  eventsGrid: {
    gap: Spacing.lg,
  },
  eventCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.card.borderRadius,
    elevation: Spacing.elevation.medium,
    shadowColor: Colors.shadow.medium,
    shadowOffset: Spacing.shadowOffset.small,
    shadowOpacity: 0.15,
    shadowRadius: Spacing.shadowRadius.small,
    overflow: 'hidden',
  },
  eventImageContainer: {
    position: 'relative',
    height: 180,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImageDisabled: {
    opacity: 0.5,
  },
  eventDisabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay.modal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDisabledText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.onPrimary,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  eventHighVibeBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary.magenta,
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventHighVibeBadgeText: {
    ...Typography.styles.caption,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  eventCardContent: {
    padding: Spacing.card.padding,
  },
  eventName: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventInfoText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  vibeMessage: {
    ...Typography.styles.bodySmall,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  vibeButtonSmall: {
    borderRadius: 15,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  vibeButtonSmallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  vibeButtonSmallText: {
    ...Typography.styles.buttonSmall,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
  },
  actionButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.button.paddingHorizontal,
    paddingVertical: Spacing.button.paddingVertical,
  },
  actionButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
  },
  
  // Location Styles
  locationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  locationMessageText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  mapContainer: {
    height: 200,
    borderRadius: Spacing.card.borderRadius,
    overflow: 'hidden',
    elevation: Spacing.elevation.medium,
    shadowColor: Colors.shadow.medium,
    shadowOffset: Spacing.shadowOffset.medium,
    shadowOpacity: 0.2,
    shadowRadius: Spacing.shadowRadius.medium,
  },
  map: {
    flex: 1,
  },
  
  // Coming Soon Styles
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  comingSoonText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  comingSoonSubtext: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  
  // Story Modal Styles (Instagram-like)
  storyModalOverlay: {
    flex: 1,
    backgroundColor: Colors.story.background,
  },
  storyModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  storyModalDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.story.overlay,
  },
  storyModalHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  storyModalProgress: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  storyProgressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.story.text,
    borderRadius: 2,
  },
  storyModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storyModalEventInfo: {
    flex: 1,
  },
  storyModalEventName: {
    ...Typography.styles.h3,
    color: Colors.story.text,
    fontWeight: Typography.fontWeight.bold,
  },
  storyModalEventDate: {
    ...Typography.styles.bodyMedium,
    color: Colors.story.text,
    opacity: 0.8,
    marginTop: 2,
  },
  storyModalCloseButton: {
    padding: Spacing.sm,
  },
  storyModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  storyUrgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  storyUrgencyText: {
    ...Typography.styles.bodyLarge,
    color: Colors.story.text,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  storyVibeMessage: {
    ...Typography.styles.bodyLarge,
    color: Colors.story.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  storyModalActions: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: Spacing.md,
  },
  storyActionButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  storyPrimaryButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  storyActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  storyActionButtonText: {
    ...Typography.styles.button,
    color: Colors.story.text,
    marginLeft: Spacing.sm,
  },
  
  // Estilos para visualização completa
  verConteudoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  verConteudoButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.story.text,
    marginLeft: Spacing.xs,
    opacity: 0.9,
  },
  voltarButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulsatingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
  },
  userLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4285F4',
    borderWidth: 1,
    borderColor: '#fff',
  },

});