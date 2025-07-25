import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
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
import { Animated, Easing } from 'react-native';

// Importação dos estilos separados
import { styles } from '../constants/HomeStyle';

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
  
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();



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

  // Função que calcula média considerando só avaliações da última 1 hora
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

    // Atualizar vibes a cada 5 minutos
    const intervalo = setInterval(() => {
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
    navigation.navigate("VibeScreen" as never, {
      eventId: evento.id,
      nomeEvento: evento.nomeevento,
      cpf: user.cpf,
    } as never);
  }

  const handleOpenSalesPage = (evento: Evento) => {
    const url = `https://piauitickets.com/comprar/${evento.id}/${evento.nomeurl || ''}`;
    Linking.openURL(url).catch(err => console.error("Erro ao abrir URL:", err));
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
                  <MaterialCommunityIcons name="theater" size={20} color={Colors.primary.orange} />
                  <Text style={styles.categoryButtonText}>Teatro</Text>
                </TouchableOpacity>
              </View>
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