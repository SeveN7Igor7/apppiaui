import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../services/firebase';
import { databaseSocial } from '../services/firebaseappdb';
import { AuthContext } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Importação dos estilos separados
import { eventDetailsStyles } from '../constants/EventDetailsStyle';

type EventDetailsRouteParams = {
  eventId: string;
};

type Evento = {
  id: string;
  nomeevento: string;
  imageurl: string;
  local?: string;
  datainicio?: string;
  aberturaportas?: string;
  nomeurl?: string;
  vendaaberta: { vendaaberta: boolean; mensagem: string };
  categoria?: string;
  descricao?: string;
  preco?: string;
};

type VibeData = {
  media: number;
  count: number;
};

export default function EventDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId } = route.params as EventDetailsRouteParams;
  const { user } = useContext(AuthContext);

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [vibe, setVibe] = useState<VibeData | null>(null);

  useEffect(() => {
    if (!eventId) return;

    console.log('[EventDetails] Carregando evento com ID:', eventId);

    const eventoRef = ref(database, `eventos/${eventId}`);
    const unsubscribe = onValue(eventoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('[EventDetails] Dados do evento carregados:', data);
        setEvento({
          id: eventId,
          nomeevento: data.nomeevento || 'Sem nome',
          imageurl: data.imageurl || '',
          nomeurl: data.nomeurl,
          local: data.local,
          datainicio: data.datainicio,
          aberturaportas: data.aberturaportas,
          vendaaberta: data.vendaaberta || { vendaaberta: false, mensagem: '' },
          categoria: data.categoria || 'outros',
          descricao: data.descricao || '',
          preco: data.preco || '',
        });
      } else {
        console.log('[EventDetails] Evento não encontrado para ID:', eventId);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // Função que calcula média considerando só avaliações da última 1 hora
  async function calcularMediaVibe(eventId: string): Promise<VibeData | null> {
    try {
      console.log(`[EventDetails] Iniciando cálculo da vibe para evento: ${eventId}`);

      const snapshot = await get(ref(databaseSocial, `avaliacoesVibe/${eventId}/`));
      console.log(`[EventDetails] Snapshot da vibe para evento ${eventId}:`, snapshot.exists(), snapshot.val());

      if (!snapshot.exists()) {
        console.log(`[EventDetails] Nenhuma avaliação encontrada para o evento ${eventId}.`);
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

      console.log(`[EventDetails] Avaliações recentes (última 1h) para evento ${eventId}:`, avaliacoesRecentes.length, avaliacoesRecentes);

      if (avaliacoesRecentes.length === 0) return null;

      const totalNotas = avaliacoesRecentes.reduce((acc, cur) => acc + cur.nota, 0);
      const quantidade = avaliacoesRecentes.length;
      const media = totalNotas / quantidade;

      console.log(`[EventDetails] Média atualizada para evento ${eventId}: ${media} com ${quantidade} avaliações.`);

      return { media, count: quantidade };
    } catch (error) {
      console.error(`[EventDetails] Erro ao calcular vibe do evento ${eventId}:`, error);
      return null;
    }
  }

  useEffect(() => {
    if (!evento) return;

    async function carregarVibe() {
      const vibeData = await calcularMediaVibe(evento.id);
      setVibe(vibeData);
    }

    carregarVibe();

    // Atualizar vibe a cada 5 minutos
    const intervalo = setInterval(() => {
      carregarVibe();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [evento]);

  const getUrgenciaMensagem = (): string => {
    if (!evento?.datainicio || !evento?.aberturaportas) return '';
    try {
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

  const getMensagemVibe = (): string => {
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

  const mostraSeloAltaVibe = (): boolean => {
    return !!vibe && vibe.count >= 9 && vibe.media >= 4.5;
  };

  const getVibeStars = (): number => {
    if (!vibe) return 0;
    return Math.round(vibe.media);
  };

  const formatarCategoria = (categoria?: string): string => {
    if (!categoria) return 'Evento';
    return categoria.charAt(0).toUpperCase() + categoria.slice(1);
  };

  const formatarData = (data?: string): string => {
    if (!data) return '';
    try {
      const [dia, mes, ano] = data.split('/');
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${dia} de ${meses[parseInt(mes) - 1]} de ${ano}`;
    } catch {
      return data;
    }
  };

  const formatarHorario = (horario?: string): string => {
    if (!horario) return '';
    return horario.replace('h', ':');
  };

  // Função para verificar se o evento já começou (abertura dos portões)
  const eventoJaComecou = (): boolean => {
    if (!evento?.datainicio || !evento?.aberturaportas) return false;
    
    try {
      const agora = new Date();
      const [dia, mes, ano] = evento.datainicio.split('/').map(Number);
      const [hora, minuto] = evento.aberturaportas.replace('h', ':').split(':').map(Number);
      
      // Criar data do evento com horário de abertura dos portões
      const dataAbertura = new Date(ano, mes - 1, dia, hora, minuto);
      
      console.log('[EventDetails] Verificando se evento começou:', {
        agora: agora.toISOString(),
        dataAbertura: dataAbertura.toISOString(),
        jaComecou: agora >= dataAbertura
      });
      
      return agora >= dataAbertura;
    } catch (error) {
      console.error('[EventDetails] Erro ao verificar se evento começou:', error);
      return false;
    }
  };

  // Função para obter mensagem de quando a avaliação será liberada
  const getMensagemLiberacaoVibe = (): string => {
    if (!evento?.datainicio || !evento?.aberturaportas) return '';
    
    try {
      const [dia, mes, ano] = evento.datainicio.split('/').map(Number);
      const [hora, minuto] = evento.aberturaportas.replace('h', ':').split(':').map(Number);
      const dataAbertura = new Date(ano, mes - 1, dia, hora, minuto);
      
      const opcoes: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      };
      
      const dataFormatada = dataAbertura.toLocaleString('pt-BR', opcoes);
      return `Avaliação liberada a partir de ${dataFormatada}`;
    } catch (error) {
      return 'Avaliação será liberada quando o evento começar';
    }
  };

  const handleOpenSalesPage = () => {
    if (!evento) return;
    const url = `https://piauitickets.com/comprar/${eventId}/${evento.nomeurl || ''}`;
    Linking.openURL(url).catch(err => console.error("Erro ao abrir URL:", err));
  };

  const handleAvaliarVibe = () => {
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
    
    if (!evento) return;
    
    // Verificar se o evento já começou
    if (!eventoJaComecou()) {
      Alert.alert(
        'Avaliação não disponível',
        'A avaliação de vibe só estará disponível após a abertura dos portões do evento.\n\n' + getMensagemLiberacaoVibe(),
        [{ text: 'Entendi', style: 'default' }]
      );
      return;
    }
    
    navigation.navigate("VibeScreen" as never, {
      eventId: evento.id,
      nomeEvento: evento.nomeevento,
      cpf: user.cpf,
    } as never);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    // Implementar funcionalidade de compartilhamento
    Alert.alert('Compartilhar', 'Funcionalidade de compartilhamento será implementada em breve!');
  };

  if (loading) {
    return (
      <SafeAreaView style={eventDetailsStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.neutral.black} />
        
        {/* Header */}
        <View style={eventDetailsStyles.header}>
          <View style={eventDetailsStyles.headerContent}>
            <TouchableOpacity style={eventDetailsStyles.backButton} onPress={handleGoBack}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.onPrimary} />
            </TouchableOpacity>
            <Text style={eventDetailsStyles.headerTitle}>Detalhes do Evento</Text>
            <TouchableOpacity style={eventDetailsStyles.shareButton} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={24} color={Colors.text.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={eventDetailsStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.purple} />
          <Text style={eventDetailsStyles.loadingText}>Carregando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!evento) {
    return (
      <SafeAreaView style={eventDetailsStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.neutral.black} />
        
        {/* Header */}
        <View style={eventDetailsStyles.header}>
          <View style={eventDetailsStyles.headerContent}>
            <TouchableOpacity style={eventDetailsStyles.backButton} onPress={handleGoBack}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.onPrimary} />
            </TouchableOpacity>
            <Text style={eventDetailsStyles.headerTitle}>Detalhes do Evento</Text>
            <TouchableOpacity style={eventDetailsStyles.shareButton} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={24} color={Colors.text.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={eventDetailsStyles.errorContainer}>
          <MaterialCommunityIcons name="calendar-remove" size={48} color={Colors.text.tertiary} />
          <Text style={eventDetailsStyles.errorText}>Evento não encontrado</Text>
          <Text style={eventDetailsStyles.errorSubtext}>
            O evento que você está procurando pode ter sido removido ou não existe.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const encerrado = !evento.vendaaberta?.vendaaberta;
  const urgencia = getUrgenciaMensagem();

  return (
    <SafeAreaView style={eventDetailsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.neutral.black} />
      
      {/* Header */}
      <View style={eventDetailsStyles.header}>
        <View style={eventDetailsStyles.headerContent}>
          <TouchableOpacity style={eventDetailsStyles.backButton} onPress={handleGoBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.onPrimary} />
          </TouchableOpacity>
          <Text style={eventDetailsStyles.headerTitle}>Detalhes do Evento</Text>
          <TouchableOpacity style={eventDetailsStyles.shareButton} onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant" size={24} color={Colors.text.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={eventDetailsStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Event Image */}
        <View style={eventDetailsStyles.eventImageContainer}>
          <Image
            source={{ uri: evento.imageurl }}
            style={[eventDetailsStyles.eventImage, encerrado && eventDetailsStyles.eventImageDisabled]}
          />
          
          {/* Overlay para eventos encerrados */}
          {encerrado && (
            <View style={eventDetailsStyles.eventDisabledOverlay}>
              <MaterialCommunityIcons name="close-circle" size={32} color={Colors.text.onPrimary} />
              <Text style={eventDetailsStyles.eventDisabledText}>Vendas Encerradas</Text>
            </View>
          )}
          
          {/* Badge de alta vibe para eventos ativos */}
          {mostraSeloAltaVibe() && !encerrado && (
            <View style={eventDetailsStyles.eventHighVibeBadge}>
              <MaterialCommunityIcons name="fire" size={18} color={Colors.text.onPrimary} />
              <Text style={eventDetailsStyles.eventHighVibeBadgeText}>Alta Vibe</Text>
            </View>
          )}

          {/* Badge de urgência */}
          {urgencia && (
            <View style={eventDetailsStyles.eventUrgencyBadge}>
              <MaterialCommunityIcons name="clock-fast" size={16} color={Colors.text.onPrimary} />
              <Text style={eventDetailsStyles.eventUrgencyText}>{urgencia}</Text>
            </View>
          )}
        </View>

        <View style={eventDetailsStyles.eventContent}>
          {/* Event Title Section */}
          <View style={eventDetailsStyles.eventTitleSection}>
            <Text style={eventDetailsStyles.eventCategory}>
              {formatarCategoria(evento.categoria)}
            </Text>
            <Text style={eventDetailsStyles.eventName}>
              {evento.nomeevento}
            </Text>
          </View>

          {/* Urgency Message */}
          {urgencia && (
            <View style={eventDetailsStyles.urgencyMessage}>
              <MaterialCommunityIcons name="clock-fast" size={20} color={Colors.text.onPrimary} />
              <Text style={eventDetailsStyles.urgencyMessageText}>{urgencia}</Text>
            </View>
          )}

          {/* Event Info Section */}
          <View style={eventDetailsStyles.eventInfoSection}>
            {evento.datainicio && (
              <View style={eventDetailsStyles.eventInfoRow}>
                <View style={eventDetailsStyles.eventInfoIcon}>
                  <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary.purple} />
                </View>
                <Text style={[eventDetailsStyles.eventInfoText, eventDetailsStyles.eventInfoTextPrimary]}>
                  {formatarData(evento.datainicio)}
                </Text>
              </View>
            )}

            {evento.aberturaportas && (
              <View style={eventDetailsStyles.eventInfoRow}>
                <View style={eventDetailsStyles.eventInfoIcon}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.primary.purple} />
                </View>
                <Text style={eventDetailsStyles.eventInfoText}>
                  Abertura dos portões: {formatarHorario(evento.aberturaportas)}
                </Text>
              </View>
            )}

            {evento.local && (
              <View style={eventDetailsStyles.eventInfoRow}>
                <View style={eventDetailsStyles.eventInfoIcon}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary.purple} />
                </View>
                <Text style={eventDetailsStyles.eventInfoText}>
                  {evento.local}
                </Text>
              </View>
            )}
          </View>

          {/* Price Section */}
          {evento.preco && (
            <View style={eventDetailsStyles.priceSection}>
              <Text style={eventDetailsStyles.priceLabel}>Preço dos ingressos</Text>
              <Text style={eventDetailsStyles.priceValue}>{evento.preco}</Text>
            </View>
          )}

          {/* Vibe Section */}
          <View style={eventDetailsStyles.vibeSection}>
            <Text style={eventDetailsStyles.vibeSectionTitle}>Vibe do Evento</Text>
            <View style={eventDetailsStyles.vibeContainer}>
              <View style={eventDetailsStyles.vibeStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={star <= getVibeStars() ? "star" : "star-outline"}
                    size={28}
                    color={star <= getVibeStars() ? Colors.primary.orange : Colors.text.tertiary}
                  />
                ))}
              </View>
              <Text style={eventDetailsStyles.vibeMessage}>{getMensagemVibe()}</Text>
              {vibe && (
                <Text style={eventDetailsStyles.vibeCount}>
                  {vibe.count} {vibe.count === 1 ? 'avaliação' : 'avaliações'} na última hora
                </Text>
              )}
              
              {/* Botão de avaliar com estado condicional */}
              <TouchableOpacity 
                style={[
                  eventDetailsStyles.vibeActionButton,
                  !eventoJaComecou() && eventDetailsStyles.vibeActionButtonDisabled
                ]} 
                onPress={handleAvaliarVibe}
                disabled={!eventoJaComecou()}
              >
                <MaterialCommunityIcons 
                  name={eventoJaComecou() ? "heart" : "clock-outline"} 
                  size={20} 
                  color={eventoJaComecou() ? Colors.text.onPrimary : Colors.text.tertiary} 
                />
                <Text style={[
                  eventDetailsStyles.vibeActionButtonText,
                  !eventoJaComecou() && eventDetailsStyles.vibeActionButtonTextDisabled
                ]}>
                  {eventoJaComecou() ? 'Avaliar Vibe' : 'Aguardando Início'}
                </Text>
              </TouchableOpacity>
              
              {/* Mensagem explicativa quando desabilitado */}
              {!eventoJaComecou() && (
                <Text style={eventDetailsStyles.vibeDisabledMessage}>
                  {getMensagemLiberacaoVibe()}
                </Text>
              )}
            </View>
          </View>

          {/* Description Section */}
          {evento.descricao && (
            <View style={eventDetailsStyles.descriptionSection}>
              <Text style={eventDetailsStyles.descriptionTitle}>Sobre o Evento</Text>
              <Text style={eventDetailsStyles.descriptionText}>
                {evento.descricao}
              </Text>
            </View>
          )}

          {/* Actions Section */}
          <View style={eventDetailsStyles.actionsSection}>
            {evento.vendaaberta?.vendaaberta ? (
              <>
                <TouchableOpacity style={eventDetailsStyles.primaryActionButton} onPress={handleOpenSalesPage}>
                  <LinearGradient
                    colors={[Colors.primary.purple, Colors.primary.magenta]}
                    style={eventDetailsStyles.primaryActionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <MaterialCommunityIcons name="ticket" size={20} color={Colors.text.onPrimary} />
                    <Text style={eventDetailsStyles.primaryActionButtonText}>Comprar Ingresso</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {eventoJaComecou() ? (
                  <TouchableOpacity style={eventDetailsStyles.secondaryActionButton} onPress={handleAvaliarVibe}>
                    <MaterialCommunityIcons name="heart" size={20} color={Colors.primary.purple} />
                    <Text style={eventDetailsStyles.secondaryActionButtonText}>Avaliar Vibe</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={eventDetailsStyles.disabledButton}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.text.tertiary} />
                    <Text style={eventDetailsStyles.disabledButtonText}>Avaliação em Breve</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={eventDetailsStyles.statusMessage}>
                  <Text style={eventDetailsStyles.statusMessageText}>
                    {evento.vendaaberta?.mensagem || 'Vendas encerradas para este evento'}
                  </Text>
                </View>
                
                <View style={eventDetailsStyles.disabledButton}>
                  <MaterialCommunityIcons name="ticket-outline" size={20} color={Colors.text.tertiary} />
                  <Text style={eventDetailsStyles.disabledButtonText}>Vendas Encerradas</Text>
                </View>
                
                {eventoJaComecou() ? (
                  <TouchableOpacity style={eventDetailsStyles.secondaryActionButton} onPress={handleAvaliarVibe}>
                    <MaterialCommunityIcons name="heart" size={20} color={Colors.primary.purple} />
                    <Text style={eventDetailsStyles.secondaryActionButtonText}>Avaliar Vibe</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={eventDetailsStyles.disabledButton}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.text.tertiary} />
                    <Text style={eventDetailsStyles.disabledButtonText}>Avaliação em Breve</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}