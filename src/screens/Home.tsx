import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
  Alert,
  StatusBar,
  StyleSheet,
} from 'react-native';
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
import { Video } from 'expo-av';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';

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

type VideoUrl = {
  id: string;
  url: string;
  localUri?: string;
};

export default function Home() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [vibes, setVibes] = useState<Record<string, VibeData>>({});
  const [videoUrls, setVideoUrls] = useState<VideoUrl[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const bottomSheetRef = useRef<BottomSheet>(null);

  // Diretório onde os vídeos estão armazenados (mesmo do App.tsx)
  const VIDEO_STORAGE_DIR = FileSystem.documentDirectory + 'app_videos/';

  const handleSheetChanges = useCallback((index: number) => {
    console.log('[BottomSheet] handleSheetChanges:', index);
  }, []);

  // Função para navegar para a tela de Ingressos
  const handleNavigateToIngressos = () => {
    navigation.navigate('Ingressos' as never);
  };

  // Função para navegar para a tela de Perfil
  const handleNavigateToPerfil = () => {
    navigation.navigate('Perfil' as never);
  };

  useEffect(() => {
    console.log('[Firebase] Tentando carregar eventos...');
    const eventosRef = ref(database, 'eventos/');
    const unsubscribe = onValue(eventosRef, (snapshot) => {
      const data = snapshot.val();
      const lista: Evento[] = [];

      if (data) {
        Object.keys(data).forEach((id) => {
          const evento = data[id];
          if (evento.eventvisible) {
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
      console.log('[Firebase] Eventos carregados com sucesso:', lista.length);
    }, (error) => {
      console.error('[Firebase] Erro ao carregar eventos do Firebase:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Lógica para buscar URLs de vídeo do Firebase e usar vídeos locais
  useEffect(() => {
    const getLocalVideoUri = async (url: string): Promise<string | null> => {
      const filename = url.split('/').pop();
      if (!filename) {
        console.warn('[VideoLocal] Não foi possível extrair o nome do arquivo da URL:', url);
        return null;
      }
      const localPath = VIDEO_STORAGE_DIR + filename;

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log('[VideoLocal] Vídeo local encontrado:', localPath);
        return localPath;
      } else {
        console.log('[VideoLocal] Vídeo local não encontrado, usando URL remota:', url);
        return null;
      }
    };

    const loadVideoUrls = async () => {
      console.log('[Video] Carregando URLs de vídeo...');
      try {
        const conteudosMenuRef = ref(databaseSocial, 'configgeralapp/conteudosmenu/');
        const snapshot = await get(conteudosMenuRef);
        const data = snapshot.val();

        if (data) {
          const fetchedUrls: VideoUrl[] = [];
          console.log('[Video] Dados de URLs encontrados no Firebase:', Object.keys(data).length, 'itens');
          
          for (const eventId in data) {
            const eventContent = data[eventId];
            if (Array.isArray(eventContent) && eventContent.length > 1 && typeof eventContent[1] === 'string') {
              const remoteUrl = eventContent[1];
              console.log(`[Video] Processando URL: ${remoteUrl} para o evento ${eventId}`);
              
              // Verificar se existe versão local
              const localUri = await getLocalVideoUri(remoteUrl);
              
              fetchedUrls.push({ 
                id: eventId, 
                url: remoteUrl, 
                localUri: localUri || undefined 
              });
            } else {
              console.warn(`[Video] Conteúdo inesperado para o evento ${eventId}:`, eventContent);
            }
          }
          
          console.log('[Video] URLs de vídeo processadas:', fetchedUrls.length);
          setVideoUrls(fetchedUrls);
        } else {
          console.log('[Video] Nenhuma URL de vídeo encontrada no Firebase.');
        }
      } catch (error) {
        console.error('[Firebase] Erro ao buscar URLs de vídeo do Firebase:', error);
      }
    };

    loadVideoUrls();
  }, []);

  // Função para avançar para o próximo vídeo automaticamente (sem loader)
  const handleVideoPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      console.log('[Video] Vídeo atual terminou. Avançando para o próximo.');
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoUrls.length);
    }
  };

  // Função que calcula média considerando só avaliações da última 1 hora
  async function calcularMediaVibe(eventId: string): Promise<VibeData | null> {
    try {
      const snapshot = await get(ref(databaseSocial, `avaliacoesVibe/${eventId}/`));
      if (!snapshot.exists()) {
        console.log(`[Vibe] Nenhuma avaliação encontrada para o evento ${eventId}.`);
        return null;
      }

      const data = snapshot.val();
      const agora = Date.now();
      const umaHoraMs = 60 * 60 * 1000;

      const avaliacoesRecentes = Object.values(data).filter((item: any) => {
        if (!item.timestamp) return false;
        const diff = agora - item.timestamp;
        return diff >= 0 && diff <= umaHoraMs;
      }) as { nota: number; timestamp: number }[];

      if (avaliacoesRecentes.length === 0) {
        console.log(`[Vibe] Nenhuma avaliação recente para o evento ${eventId}.`);
        return null;
      }

      const totalNotas = avaliacoesRecentes.reduce((acc, cur) => acc + cur.nota, 0);
      const quantidade = avaliacoesRecentes.length;
      const media = totalNotas / quantidade;

      console.log(`[Vibe] Média calculada para o evento ${eventId}: ${media} com ${quantidade} avaliações.`);
      return { media, count: quantidade };
    } catch (error) {
      console.error(`[Vibe] Erro ao calcular vibe do evento ${eventId}:`, error);
      return null;
    }
  }

  useEffect(() => {
    if (eventos.length === 0) return;

    async function carregarVibes() {
      console.log('[Vibe] Carregando vibes para eventos...');
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
      console.log('[Vibe] Vibes carregadas:', vibesMap);
    }

    carregarVibes();

    const intervalo = setInterval(() => {
      console.log('[Vibe] Atualizando vibes...');
      carregarVibes();
    }, 5 * 60 * 1000);

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
    } catch (e) {
      console.error('[Urgencia] Erro ao calcular mensagem de urgência:', e);
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
    } catch (e) {
      console.error('[EventosHoje] Erro ao filtrar eventos de hoje:', e);
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
    navigation.navigate("VibeScreen" as never, {
      eventId: evento.id,
      nomeEvento: evento.nomeevento,
      cpf: user.cpf,
    } as never);
  }

  const handleOpenSalesPage = (evento: Evento) => {
    const url = `https://piauitickets.com/comprar/${evento.id}/${evento.nomeurl || ''}`;
    Linking.openURL(url).catch(err => console.error('Erro ao abrir URL de vendas:', err));
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
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Video Background - Sem loader, transição dinâmica */}
      {videoUrls.length > 0 && (
        <Video
          source={{ 
            uri: videoUrls[currentVideoIndex].localUri || videoUrls[currentVideoIndex].url 
          }}
          style={styles.videoBackground}
          shouldPlay
          isLooping={false}
          isMuted
          resizeMode="cover"
          onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
          onLoad={() => {
            console.log('[Video] Vídeo carregado e reproduzindo:', videoUrls[currentVideoIndex].id);
          }}
          onError={(error) => {
            console.error('[Video] Erro ao carregar vídeo:', error);
            // Em caso de erro, tenta o próximo vídeo
            setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoUrls.length);
          }}
        />
      )}
      {videoUrls.length === 0 && (
        <View style={styles.fallbackBackground} />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleNavigateToIngressos}>
            <MaterialCommunityIcons name="ticket" size={24} color={Colors.text.onPrimary} />
          </TouchableOpacity>
          <Image 
            source={require('../images/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.profileButton} onPress={handleNavigateToPerfil}>
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
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={['25%', '50%', '90%']}
          onChange={handleSheetChanges}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetHandle}
        >
          <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
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

            {/* Seção de Descoberta */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="compass" size={24} color={Colors.primary.orange} />
                <Text style={styles.sectionTitle}>Descubra Novos Eventos</Text>
              </View>
              
              <View style={styles.discoveryContainer}>
                <MaterialCommunityIcons name="map-search" size={48} color={Colors.text.tertiary} />
                <Text style={styles.discoveryText}>Explore eventos por categoria</Text>
                <Text style={styles.discoverySubtext}>Encontre shows, festas e experiências únicas.</Text>
                
                <View style={styles.categoryButtons}>
                  <TouchableOpacity style={styles.categoryButton}>
                    <MaterialCommunityIcons name="music" size={20} color={Colors.primary.purple} />
                    <Text style={styles.categoryButtonText}>Shows</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.categoryButton}>
                    <MaterialCommunityIcons name="party-popper" size={20} color={Colors.primary.magenta} />
                    <Text style={styles.categoryButtonText}>Festas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.categoryButton}>
                    <MaterialCommunityIcons name="food" size={20} color={Colors.primary.orange} />
                    <Text style={styles.categoryButtonText}>Gastronomia</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.categoryButton}>
                    <MaterialCommunityIcons name="theater" size={20} color={Colors.primary.blue} />
                    <Text style={styles.categoryButtonText}>Teatro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.categoryButton}>
                    <MaterialCommunityIcons name="palette" size={20} color={Colors.primary.green} />
                    <Text style={styles.categoryButtonText}>Arte</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.categoryButton}>
                    <MaterialCommunityIcons name="run" size={20} color={Colors.primary.red} />
                    <Text style={styles.categoryButtonText}>Esportes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: Colors.neutral.black,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.container.horizontal,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  headerLogo: {
    height: 32,
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.onPrimary,
    marginTop: Spacing.md,
  },
  bottomSheetBackground: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandle: {
    backgroundColor: Colors.neutral.lightGray,
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  bottomSheetContent: {
    paddingBottom: Spacing.xxxxl,
  },
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  actionButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
  },
  discoveryContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  discoveryText: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  discoverySubtext: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
});
