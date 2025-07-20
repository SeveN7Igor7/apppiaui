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
  Dimensions,
  Linking,
  Alert,
  StatusBar,
  TextInput,
  FlatList,
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

// Importação dos estilos separados
import { explorarStyles } from '../constants/ExplorarStyle';

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
  categoria?: string;
  descricao?: string;
  local?: string;
  preco?: string;
};

type VibeData = {
  media: number;
  count: number;
};

export default function Explorar() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventosFiltrados, setEventosFiltrados] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [vibes, setVibes] = useState<Record<string, VibeData>>({});
  
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const categorias = [
    { id: 'todos', nome: 'Todos', icone: 'view-grid' },
    { id: 'shows', nome: 'Shows', icone: 'music' },
    { id: 'festas', nome: 'Festas', icone: 'party-popper' },
    { id: 'teatro', nome: 'Teatro', icone: 'theater' },
    { id: 'esportes', nome: 'Esportes', icone: 'soccer' },
    { id: 'cultura', nome: 'Cultura', icone: 'palette' },
  ];

  useEffect(() => {
    const eventosRef = ref(database, 'eventos/');
    const unsubscribe = onValue(eventosRef, (snapshot) => {
      const data = snapshot.val();
      const lista: Evento[] = [];

      if (data) {
        Object.keys(data).forEach((id) => {
          const evento = data[id];
          if (evento.eventvisible) {
            console.log(`[Explorar] Evento carregado: ID=${id}, nome=${evento.nomeevento}`);
            lista.push({
              id,
              nomeevento: evento.nomeevento || 'Sem nome',
              imageurl: evento.imageurl || '',
              nomeurl: evento.nomeurl,
              eventvisible: true,
              datainicio: evento.datainicio,
              aberturaportas: evento.aberturaportas,
              vendaaberta: evento.vendaaberta || { vendaaberta: false, mensagem: '' },
              categoria: evento.categoria || 'outros',
              descricao: evento.descricao || '',
              local: evento.local || '',
              preco: evento.preco || '',
            });
          }
        });
      }

      setEventos(lista);
      setEventosFiltrados(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função que calcula média considerando só avaliações da última 1 hora
  async function calcularMediaVibe(eventId: string): Promise<VibeData | null> {
    try {
      console.log(`[Explorar] Iniciando cálculo da vibe para evento: ${eventId}`);

      const snapshot = await get(ref(databaseSocial, `avaliacoesVibe/${eventId}/`));
      console.log(`[Explorar] Snapshot da vibe para evento ${eventId}:`, snapshot.exists(), snapshot.val());

      if (!snapshot.exists()) {
        console.log(`[Explorar] Nenhuma avaliação encontrada para o evento ${eventId}.`);
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

      console.log(`[Explorar] Avaliações recentes (última 1h) para evento ${eventId}:`, avaliacoesRecentes.length, avaliacoesRecentes);

      if (avaliacoesRecentes.length === 0) return null;

      const totalNotas = avaliacoesRecentes.reduce((acc, cur) => acc + cur.nota, 0);
      const quantidade = avaliacoesRecentes.length;
      const media = totalNotas / quantidade;

      console.log(`[Explorar] Média atualizada para evento ${eventId}: ${media} com ${quantidade} avaliações.`);

      return { media, count: quantidade };
    } catch (error) {
      console.error(`[Explorar] Erro ao calcular vibe do evento ${eventId}:`, error);
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

  const getVibeStars = (eventoId: string): number => {
    const vibe = vibes[eventoId];
    if (!vibe) return 0;
    return Math.round(vibe.media);
  };

  // Filtrar eventos baseado na pesquisa e categoria
  useEffect(() => {
    let eventosFiltrados = eventos;

    // Filtrar por categoria
    if (categoriaFiltro !== 'todos') {
      eventosFiltrados = eventosFiltrados.filter(evento => 
        evento.categoria?.toLowerCase() === categoriaFiltro.toLowerCase()
      );
    }

    // Filtrar por texto de pesquisa
    if (searchText.trim()) {
      eventosFiltrados = eventosFiltrados.filter(evento =>
        evento.nomeevento.toLowerCase().includes(searchText.toLowerCase()) ||
        evento.local?.toLowerCase().includes(searchText.toLowerCase()) ||
        evento.categoria?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setEventosFiltrados(eventosFiltrados);
  }, [eventos, searchText, categoriaFiltro]);

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

  const handleVerDetalhes = (evento: Evento) => {
    console.log('[Explorar] handleVerDetalhes chamado com evento:', evento);
    console.log('[Explorar] evento.id:', evento.id);
    console.log('[Explorar] Navegando para EventDetails com eventId:', evento.id);
    
    // Adicionando log para verificar o tipo de evento.id antes de navegar
    console.log('[Explorar] Tipo de evento.id antes da navegação:', typeof evento.id);

    navigation.navigate("EventDetails" as never, {
      eventId: evento.id,
    } as never);
  };

  const renderCategoriaButton = (categoria: any) => (
    <TouchableOpacity
      key={categoria.id}
      style={[
        explorarStyles.categoriaButton,
        categoriaFiltro === categoria.id && explorarStyles.categoriaButtonActive
      ]}
      onPress={() => setCategoriaFiltro(categoria.id)}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons 
        name={categoria.icone as any} 
        size={18} 
        color={categoriaFiltro === categoria.id ? Colors.text.onPrimary : Colors.primary.purple} 
      />
      <Text style={[
        explorarStyles.categoriaButtonText,
        categoriaFiltro === categoria.id && explorarStyles.categoriaButtonTextActive
      ]}>
        {categoria.nome}
      </Text>
    </TouchableOpacity>
  );

  const renderEventoCard = ({ item: evento }: { item: Evento }) => {
    const encerrado = !evento.vendaaberta?.vendaaberta;
    
    return (
      <TouchableOpacity
        style={explorarStyles.eventoCard}
        onPress={() => handleVerDetalhes(evento)}
        activeOpacity={0.9}
      >
        <View style={explorarStyles.eventoImageContainer}>
          <Image
            source={{ uri: evento.imageurl }}
            style={[explorarStyles.eventoImage, encerrado && explorarStyles.eventoImageDisabled]}
          />
          
          {/* Overlay para eventos encerrados */}
          {encerrado && (
            <View style={explorarStyles.eventoDisabledOverlay}>
              <MaterialCommunityIcons name="close-circle" size={24} color={Colors.text.onPrimary} />
              <Text style={explorarStyles.eventoDisabledText}>Vendas Encerradas</Text>
            </View>
          )}
          
          {/* Badge de alta vibe para eventos ativos */}
          {mostraSeloAltaVibe(evento.id) && !encerrado && (
            <View style={explorarStyles.eventoHighVibeBadge}>
              <MaterialCommunityIcons name="fire" size={14} color={Colors.text.onPrimary} />
              <Text style={explorarStyles.eventoHighVibeBadgeText}>Alta Vibe</Text>
            </View>
          )}

          {/* Badge de urgência */}
          {getUrgenciaMensagem(evento) && (
            <View style={explorarStyles.eventoUrgencyBadge}>
              <MaterialCommunityIcons name="clock-fast" size={12} color={Colors.text.onPrimary} />
              <Text style={explorarStyles.eventoUrgencyText}>{getUrgenciaMensagem(evento)}</Text>
            </View>
          )}
        </View>
        
        <View style={explorarStyles.eventoCardContent}>
          <Text style={explorarStyles.eventoName} numberOfLines={2}>
            {evento.nomeevento}
          </Text>
          
          {evento.local && (
            <View style={explorarStyles.eventoInfoRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={Colors.text.tertiary} />
              <Text style={explorarStyles.eventoInfoText} numberOfLines={1}>{evento.local}</Text>
            </View>
          )}
          
          {evento.datainicio && (
            <View style={explorarStyles.eventoInfoRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={Colors.text.tertiary} />
              <Text style={explorarStyles.eventoInfoText}>{evento.datainicio}</Text>
            </View>
          )}

          {/* Vibe do evento */}
          <View style={explorarStyles.vibeContainer}>
            <Text style={explorarStyles.vibeLabel}>Vibe atual:</Text>
            <View style={explorarStyles.vibeStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name={star <= getVibeStars(evento.id) ? "star" : "star-outline"}
                  size={14}
                  color={star <= getVibeStars(evento.id) ? Colors.primary.orange : Colors.text.tertiary}
                />
              ))}
            </View>
            <Text style={explorarStyles.vibeMessage}>{getMensagemVibe(evento.id)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={explorarStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.neutral.black} />
      
      {/* Header com fundo preto */}
      <View style={explorarStyles.header}>
        <View style={explorarStyles.headerContent}>
          <MaterialCommunityIcons name="compass" size={24} color={Colors.text.onPrimary} />
          <Text style={explorarStyles.headerTitle}>Explorar Eventos</Text>
          <TouchableOpacity style={explorarStyles.profileButton}>
            <MaterialCommunityIcons name="account-circle" size={24} color={Colors.text.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de Pesquisa */}
      <View style={explorarStyles.searchContainer}>
        <View style={explorarStyles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={explorarStyles.searchInput}
            placeholder="Pesquisar eventos..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de Categoria */}
      <View style={explorarStyles.categoriasContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={explorarStyles.categoriasScrollContent}
        >
          {categorias.map(renderCategoriaButton)}
        </ScrollView>
      </View>

      {loading ? (
        <View style={explorarStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.purple} />
          <Text style={explorarStyles.loadingText}>Carregando eventos...</Text>
        </View>
      ) : (
        <FlatList
          data={eventosFiltrados}
          renderItem={renderEventoCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={explorarStyles.eventoRow}
          contentContainerStyle={explorarStyles.eventosListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={explorarStyles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-remove" size={48} color={Colors.text.tertiary} />
              <Text style={explorarStyles.emptyText}>Nenhum evento encontrado</Text>
              <Text style={explorarStyles.emptySubtext}>
                Tente ajustar os filtros ou pesquisar por outros termos.
              </Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
}

