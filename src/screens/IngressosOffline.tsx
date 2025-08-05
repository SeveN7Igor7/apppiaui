import { useEffect, useState } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialCommunityIcons } from "@expo/vector-icons"
import QRCode from "react-native-qrcode-svg"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// Importação dos estilos
import { ingressosStyles } from '../constants/IngressosStyle'

interface OfflineTicket {
  cpf: string
  nomeCompleto: string
  email: string
  eventId: string
  nomeEvento: string
  tipo: string
  token: string
  dataEvento?: string
  local?: string
}

interface GroupedTickets {
  [eventId: string]: {
    nomeEvento: string
    dataEvento?: string
    local?: string
    tickets: OfflineTicket[]
  }
}

export default function IngressosOffline() {
  const [offlineTickets, setOfflineTickets] = useState<OfflineTicket[]>([])
  const [groupedTickets, setGroupedTickets] = useState<GroupedTickets>({})
  const [selectedTicket, setSelectedTicket] = useState<OfflineTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"events" | "eventDetails" | "ticketDetails">("events")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    loadOfflineTickets()
  }, [])

  const loadOfflineTickets = async () => {
    try {
      setLoading(true)
      const storedTickets = await AsyncStorage.getItem('offlineTickets')
      
      if (storedTickets) {
        const tickets: OfflineTicket[] = JSON.parse(storedTickets)
        setOfflineTickets(tickets)
        
        // Agrupar ingressos por evento
        const grouped: GroupedTickets = {}
        tickets.forEach(ticket => {
          if (!grouped[ticket.eventId]) {
            grouped[ticket.eventId] = {
              nomeEvento: ticket.nomeEvento,
              dataEvento: ticket.dataEvento,
              local: ticket.local,
              tickets: []
            }
          }
          grouped[ticket.eventId].tickets.push(ticket)
        })
        
        setGroupedTickets(grouped)
      } else {
        setOfflineTickets([])
        setGroupedTickets({})
      }
    } catch (error) {
      console.error('Erro ao carregar ingressos offline:', error)
      Alert.alert('Erro', 'Não foi possível carregar os ingressos offline.')
    } finally {
      setLoading(false)
    }
  }

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    setViewMode("eventDetails")
  }

  const handleTicketSelect = (ticket: OfflineTicket) => {
    setSelectedTicket(ticket)
    setViewMode("ticketDetails")
  }

  const handleBackPress = () => {
    if (viewMode === "ticketDetails") {
      setViewMode("eventDetails")
      setSelectedTicket(null)
    } else if (viewMode === "eventDetails") {
      setViewMode("events")
      setSelectedEventId(null)
    } else {
      navigation.goBack()
    }
  }

  const getHeaderTitle = () => {
    switch (viewMode) {
      case "eventDetails":
        return selectedEventId ? groupedTickets[selectedEventId]?.nomeEvento || "Detalhes do Evento" : "Detalhes do Evento"
      case "ticketDetails":
        return "Ingresso Offline"
      default:
        return "Ingressos Offline"
    }
  }

  const contentPaddingBottom = insets.bottom + 80

  if (loading) {
    return (
      <View style={ingressosStyles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        <Header
          title="Ingressos Offline"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
          isMainTitle={true}
          insets={insets}
        />
        <View style={[ingressosStyles.contentContainer, { paddingBottom: contentPaddingBottom }]}>
          <LoadingState message="Carregando ingressos offline..." />
        </View>
      </View>
    )
  }

  return (
    <View style={ingressosStyles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Header
        title={getHeaderTitle()}
        onBackPress={handleBackPress}
        showBackButton={viewMode !== "events"}
        isMainTitle={viewMode === "events"}
        insets={insets}
      />

      <View style={[ingressosStyles.contentContainer, { paddingBottom: contentPaddingBottom }]}>
        {viewMode === "events" && (
          <OfflineEventsListView 
            groupedTickets={groupedTickets} 
            onEventSelect={handleEventSelect} 
          />
        )}

        {viewMode === "eventDetails" && selectedEventId && (
          <OfflineEventDetailsView 
            eventData={groupedTickets[selectedEventId]} 
            onTicketSelect={handleTicketSelect} 
          />
        )}

        {viewMode === "ticketDetails" && selectedTicket && (
          <OfflineTicketDetailsView ticket={selectedTicket} />
        )}
      </View>
    </View>
  )
}

// ===== COMPONENTE HEADER =====
function Header({
  title,
  onBackPress,
  showBackButton = true,
  isMainTitle = false,
  insets,
}: {
  title: string
  onBackPress: () => void
  showBackButton?: boolean
  isMainTitle?: boolean
  insets: any
}) {
  const headerPaddingTop = Platform.OS === 'android' 
    ? insets.top + 16
    : 16;
  
  const headerPaddingBottom = 16;

  return (
    <View style={[
      ingressosStyles.headerWithSafeArea,
      {
        paddingTop: headerPaddingTop,
        paddingBottom: headerPaddingBottom,
      }
    ]}>
      <View style={ingressosStyles.headerLeft}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={ingressosStyles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={ingressosStyles.backButtonPlaceholder} />
        )}
      </View>

      <View style={ingressosStyles.headerCenter}>
        <Text
          style={[ingressosStyles.headerTitle, isMainTitle ? ingressosStyles.mainHeaderTitle : ingressosStyles.subHeaderTitle]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={ingressosStyles.headerRight} />
    </View>
  )
}

// ===== COMPONENTES AUXILIARES =====
function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <View style={ingressosStyles.emptyState}>
      <View style={ingressosStyles.emptyIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={64} color="#9CA3AF" />
      </View>
      <Text style={ingressosStyles.emptyTitle}>{title}</Text>
      <Text style={ingressosStyles.emptyMessage}>{message}</Text>
    </View>
  )
}

function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <View style={ingressosStyles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={ingressosStyles.loadingText}>{message}</Text>
    </View>
  )
}

// ===== LISTA DE EVENTOS OFFLINE =====
function OfflineEventsListView({
  groupedTickets,
  onEventSelect,
}: { 
  groupedTickets: GroupedTickets; 
  onEventSelect: (eventId: string) => void; 
}) {
  const eventIds = Object.keys(groupedTickets)
  
  if (eventIds.length === 0) {
    return (
      <EmptyState
        icon="wifi-off"
        title="Nenhum Ingresso Offline"
        message="Você ainda não baixou nenhum ingresso para uso offline. Conecte-se à internet e faça o download na tela de ingressos."
      />
    )
  }

  const totalTickets = eventIds.reduce((total, eventId) => 
    total + groupedTickets[eventId].tickets.length, 0
  )

  return (
    <View style={ingressosStyles.container}>
      {/* Banner Offline */}
      <View style={ingressosStyles.offlineBanner}>
        <View style={ingressosStyles.offlineBannerIcon}>
          <MaterialCommunityIcons name="wifi-off" size={24} color="#FFFFFF" />
        </View>
        <View style={ingressosStyles.offlineBannerText}>
          <Text style={ingressosStyles.offlineBannerTitle}>Modo Offline</Text>
          <Text style={ingressosStyles.offlineBannerSubtitle}>
            Seus ingressos salvos no dispositivo
          </Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={ingressosStyles.summaryCard}>
        <View style={ingressosStyles.summaryHeader}>
          <View style={ingressosStyles.summaryIcon}>
            <MaterialCommunityIcons name="ticket-confirmation" size={20} color="#FFFFFF" />
          </View>
          <Text style={ingressosStyles.summaryTitle}>Ingressos Offline</Text>
        </View>
        <View style={ingressosStyles.summaryStats}>
          <View style={ingressosStyles.summaryStatItem}>
            <Text style={ingressosStyles.summaryStatNumber}>{eventIds.length}</Text>
            <Text style={ingressosStyles.summaryStatLabel}>
              {eventIds.length === 1 ? 'Evento' : 'Eventos'}
            </Text>
          </View>
          <View style={ingressosStyles.summaryStatItem}>
            <Text style={ingressosStyles.summaryStatNumber}>{totalTickets}</Text>
            <Text style={ingressosStyles.summaryStatLabel}>
              {totalTickets === 1 ? 'Ingresso' : 'Ingressos'}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Eventos */}
      <FlatList
        data={eventIds}
        keyExtractor={(item) => item}
        contentContainerStyle={ingressosStyles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: eventId }) => {
          const eventData = groupedTickets[eventId]
          return (
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={ingressosStyles.offlineEventCard} 
              onPress={() => onEventSelect(eventId)}
            >
              <View style={ingressosStyles.eventCardContent}>
                {/* Ícone do Evento (sem imagem no offline) */}
                <View style={ingressosStyles.offlineEventIcon}>
                  <MaterialCommunityIcons name="calendar-outline" size={32} color="#6366F1" />
                  <View style={ingressosStyles.ticketBadge}>
                    <Text style={ingressosStyles.ticketBadgeText}>{eventData.tickets.length}</Text>
                  </View>
                </View>

                {/* Informações do Evento */}
                <View style={ingressosStyles.eventInfo}>
                  <View style={ingressosStyles.eventHeader}>
                    <Text style={ingressosStyles.eventName} numberOfLines={2}>
                      {eventData.nomeEvento}
                    </Text>
                    {eventData.dataEvento && (
                      <Text style={ingressosStyles.eventDate}>{eventData.dataEvento}</Text>
                    )}
                    {eventData.local && (
                      <Text style={ingressosStyles.eventLocation} numberOfLines={1}>
                        {eventData.local}
                      </Text>
                    )}
                  </View>
                  
                  <View style={ingressosStyles.eventFooter}>
                    <Text style={ingressosStyles.ticketCount}>
                      {eventData.tickets.length} {eventData.tickets.length === 1 ? 'ingresso' : 'ingressos'}
                    </Text>
                    <View style={ingressosStyles.eventArrow}>
                      <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

// ===== DETALHES DO EVENTO OFFLINE =====
function OfflineEventDetailsView({
  eventData,
  onTicketSelect,
}: { 
  eventData: GroupedTickets[string]; 
  onTicketSelect: (ticket: OfflineTicket) => void; 
}) {
  return (
    <ScrollView style={ingressosStyles.container} showsVerticalScrollIndicator={false}>
      <View style={ingressosStyles.offlineEventDetailsHeader}>
        <View style={ingressosStyles.offlineEventDetailIcon}>
          <MaterialCommunityIcons name="calendar-outline" size={48} color="#6366F1" />
        </View>

        <View style={ingressosStyles.eventDetailsInfo}>
          <Text style={ingressosStyles.eventDetailName}>{eventData.nomeEvento}</Text>
          {eventData.dataEvento && (
            <View style={ingressosStyles.eventDetailRow}>
              <View style={ingressosStyles.eventDetailIcon}>
                <MaterialCommunityIcons name="calendar-outline" size={20} color="#6366F1" />
              </View>
              <Text style={ingressosStyles.eventDetailText}>{eventData.dataEvento}</Text>
            </View>
          )}
          {eventData.local && (
            <View style={ingressosStyles.eventDetailRow}>
              <View style={ingressosStyles.eventDetailIcon}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#6366F1" />
              </View>
              <Text style={ingressosStyles.eventDetailText}>{eventData.local}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={ingressosStyles.ticketsSection}>
        <Text style={ingressosStyles.sectionTitle}>
          Seus Ingressos ({eventData.tickets.length})
        </Text>

        {eventData.tickets.map((ticket, index) => (
          <TouchableOpacity
            key={`${ticket.token}-${index}`}
            style={ingressosStyles.ticketCard}
            onPress={() => onTicketSelect(ticket)}
            activeOpacity={0.8}
          >
            <View style={ingressosStyles.ticketCardLeft}>
              <View style={ingressosStyles.ticketIcon}>
                <MaterialCommunityIcons name="ticket" size={24} color="#FFFFFF" />
              </View>
              <View style={ingressosStyles.ticketInfo}>
                <Text style={ingressosStyles.ticketType}>{ticket.tipo}</Text>
                <Text style={ingressosStyles.ticketCode}>#{ticket.token.slice(-8)}</Text>
              </View>
            </View>

            <View style={ingressosStyles.ticketCardRight}>
              <View style={ingressosStyles.qrCodePreview}>
                <MaterialCommunityIcons name="qrcode" size={20} color="#6B7280" />
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

// ===== DETALHES DO INGRESSO OFFLINE =====
function OfflineTicketDetailsView({ ticket }: { ticket: OfflineTicket }) {
  return (
    <ScrollView style={ingressosStyles.container} contentContainerStyle={ingressosStyles.ticketDetailsContainer}>
      <View style={ingressosStyles.ticketDetailsCard}>
        <View style={ingressosStyles.ticketHeader}>
          <Text style={ingressosStyles.ticketEventName}>{ticket.nomeEvento}</Text>
          <Text style={ingressosStyles.ticketTypeDetail}>{ticket.tipo}</Text>
        </View>

        <View style={ingressosStyles.qrCodeContainer}>
          <QRCode value={ticket.token} size={200} />
        </View>

        <View style={ingressosStyles.ticketInfoContainer}>
          <View style={ingressosStyles.ticketInfoRow}>
            <Text style={ingressosStyles.ticketInfoLabel}>Código do Ingresso</Text>
            <Text style={ingressosStyles.ticketInfoValue}>{ticket.token}</Text>
          </View>

          <View style={ingressosStyles.ticketInfoRow}>
            <Text style={ingressosStyles.ticketInfoLabel}>Titular</Text>
            <Text style={ingressosStyles.ticketInfoValue}>{ticket.nomeCompleto}</Text>
          </View>

          <View style={ingressosStyles.ticketInfoRow}>
            <Text style={ingressosStyles.ticketInfoLabel}>CPF</Text>
            <Text style={ingressosStyles.ticketInfoValue}>{ticket.cpf}</Text>
          </View>

          {ticket.dataEvento && (
            <View style={ingressosStyles.ticketInfoRow}>
              <Text style={ingressosStyles.ticketInfoLabel}>Data do Evento</Text>
              <Text style={ingressosStyles.ticketInfoValue}>{ticket.dataEvento}</Text>
            </View>
          )}

          {ticket.local && (
            <View style={ingressosStyles.ticketInfoRow}>
              <Text style={ingressosStyles.ticketInfoLabel}>Local</Text>
              <Text style={ingressosStyles.ticketInfoValue}>{ticket.local}</Text>
            </View>
          )}
        </View>

        <View style={ingressosStyles.ticketFooter}>
          <View style={ingressosStyles.offlineBadge}>
            <MaterialCommunityIcons name="wifi-off" size={16} color="#6366F1" />
            <Text style={ingressosStyles.offlineBadgeText}>Ingresso Offline</Text>
          </View>
        </View>
      </View>

      <View style={ingressosStyles.instructionsCard}>
        <Text style={ingressosStyles.instructionsTitle}>Instruções</Text>
        <Text style={ingressosStyles.instructionsText}>
          • Apresente este QR Code na entrada do evento{'\n'}
          • Mantenha o brilho da tela no máximo{'\n'}
          • Este ingresso funciona sem conexão com a internet{'\n'}
          • Chegue com antecedência para evitar filas
        </Text>
      </View>
    </ScrollView>
  )
}

