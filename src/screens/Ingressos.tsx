"use client"

import { useEffect, useState, useContext } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  Dimensions,
} from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { ref, get } from "firebase/database"
import { database } from "../services/firebase"
import QRCode from "react-native-qrcode-svg"
import { AuthContext } from "../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// Importação dos estilos corrigidos
import { ingressosStyles } from '../constants/IngressosStyle'

interface Ticket {
  codigo: string
  tipo: string
  eventid: string
  [key: string]: any
}

interface EventSummary {
  eventid: string
  nomeevento: string
  imageurl: string
  quantidadeTotal: number
  dataevento?: string
  local?: string
}

interface EventDetails extends EventSummary {
  ingressos: Ticket[]
}

export default function Ingressos() {
  const { user } = useContext(AuthContext)
  const [userData, setUserData] = useState<any>(null)
  const [eventos, setEventos] = useState<EventSummary[]>([])
  const [selectedEvento, setSelectedEvento] = useState<EventDetails | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(false)
  const [eventDetailsLoading, setEventDetailsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"events" | "eventDetails" | "ticketDetails">("events")
  
  // Estados para funcionalidade offline
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [showEventSelectionModal, setShowEventSelectionModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedEventsForDownload, setSelectedEventsForDownload] = useState<string[]>([])
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSummary, setDownloadSummary] = useState<any>(null)
  const [availableStorage, setAvailableStorage] = useState(0)
  
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const buscarUsuario = async () => {
      if (!user?.cpf) {
        setUserData(null)
        return
      }
      try {
        const snap = await get(ref(database, `users/cpf/${user.cpf}`))
        if (snap.exists()) {
          setUserData(snap.val())
        } else {
          setUserData(null)
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error)
        setUserData(null)
      }
    }
    buscarUsuario()
  }, [user])

  useEffect(() => {
    if (userData && userData.ingressoscomprados) {
      carregarEventosAgrupados()
    } else {
      setEventos([])
    }
  }, [userData])

  // Função para verificar armazenamento disponível
  const checkAvailableStorage = async () => {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync()
      const freeSpaceMB = freeSpace / (1024 * 1024)
      setAvailableStorage(freeSpaceMB)
      return freeSpaceMB
    } catch (error) {
      console.error('Erro ao verificar armazenamento:', error)
      return 0
    }
  }

  // Função para abrir modal de download offline
  const handleOfflineDownload = async () => {
    await checkAvailableStorage()
    setShowOfflineModal(true)
  }

  // Função para confirmar e ir para seleção de eventos
  const handleOfflineModalConfirm = () => {
    setShowOfflineModal(false)
    setShowEventSelectionModal(true)
  }

  // Função para alternar seleção de evento
  const toggleEventSelection = (eventId: string) => {
    setSelectedEventsForDownload(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  // Função para confirmar seleção e mostrar modal de download
  const handleEventSelectionConfirm = async () => {
    if (selectedEventsForDownload.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um evento para download.')
      return
    }

    const freeSpace = await checkAvailableStorage()
    if (freeSpace < 200) {
      Alert.alert(
        'Armazenamento Insuficiente',
        'Você precisa de pelo menos 200MB livres para realizar o download dos ingressos.'
      )
      return
    }

    setShowEventSelectionModal(false)
    setShowDownloadModal(true)
  }

  // Função para realizar o download dos ingressos
  const performOfflineDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      const offlineTickets = []
      let totalTickets = 0

      for (let i = 0; i < selectedEventsForDownload.length; i++) {
        const eventId = selectedEventsForDownload[i]
        setDownloadProgress((i / selectedEventsForDownload.length) * 100)

        // Buscar dados do evento
        const snapEvento = await get(ref(database, `eventos/${eventId}`))
        const eventoData = snapEvento.exists() ? snapEvento.val() : {}

        // Buscar ingressos do usuário para este evento
        const ingressosDoEvento = []
        const ingressosComprados = userData.ingressoscomprados
        
        for (const codigo in ingressosComprados) {
          const ingresso = ingressosComprados[codigo]
          if (ingresso.eventid === eventId) {
            const offlineTicket = {
              cpf: user.cpf,
              nomeCompleto: userData.nome || '',
              email: userData.email || '',
              eventId: eventId,
              nomeEvento: eventoData.nomeevento || 'Evento desconhecido',
              tipo: ingresso.tipo,
              token: codigo,
              dataEvento: eventoData.dataevento || '',
              local: eventoData.local || ''
            }
            offlineTickets.push(offlineTicket)
            ingressosDoEvento.push(offlineTicket)
            totalTickets++
          }
        }
      }

      // Salvar no AsyncStorage
      await AsyncStorage.setItem('offlineTickets', JSON.stringify(offlineTickets))

      setDownloadProgress(100)
      
      // Preparar resumo do download
      const summary = {
        totalTickets,
        events: selectedEventsForDownload.length,
        downloadDate: new Date().toLocaleDateString('pt-BR')
      }
      
      setDownloadSummary(summary)
      setIsDownloading(false)

    } catch (error) {
      console.error('Erro no download:', error)
      Alert.alert('Erro', 'Ocorreu um erro durante o download dos ingressos.')
      setIsDownloading(false)
      setShowDownloadModal(false)
    }
  }

  // Função para fechar modal de download e resetar estados
  const handleDownloadComplete = () => {
    setShowDownloadModal(false)
    setSelectedEventsForDownload([])
    setDownloadProgress(0)
    setDownloadSummary(null)
  }

  const carregarEventosAgrupados = async () => {
    setLoading(true)
    const ingressosComprados = userData.ingressoscomprados
    const grupos: { [key: string]: Ticket[] } = {}

    for (const codigo in ingressosComprados) {
      const ingresso = ingressosComprados[codigo]
      const eventid = ingresso.eventid
      if (!grupos[eventid]) grupos[eventid] = []
      grupos[eventid].push({ ...ingresso, codigo })
    }

    const listaEventos: EventSummary[] = []

    for (const eventid in grupos) {
      try {
        const snapEvento = await get(ref(database, `eventos/${eventid}`))
        const eventoData = snapEvento.exists() ? snapEvento.val() : {}
        listaEventos.push({
          eventid,
          nomeevento: eventoData.nomeevento || "Evento desconhecido",
          imageurl: eventoData.imageurl || "",
          dataevento: eventoData.dataevento || "",
          local: eventoData.local || "",
          quantidadeTotal: grupos[eventid].length,
        })
      } catch (error) {
        console.error("Erro ao buscar evento:", error)
      }
    }

    setEventos(listaEventos)
    setLoading(false)
  }

  const carregarIngressosDoEvento = async (eventid: string) => {
    setEventDetailsLoading(true)
    try {
      const snapEvento = await get(ref(database, `eventos/${eventid}`))
      const eventoData = snapEvento.exists() ? snapEvento.val() : {}

      const ingressosDoUsuarioParaEsteEvento: Ticket[] = []
      const ingressosComprados = userData.ingressoscomprados
      for (const codigo in ingressosComprados) {
        const ingresso = ingressosComprados[codigo]
        if (ingresso.eventid === eventid) {
          ingressosDoUsuarioParaEsteEvento.push({ ...ingresso, codigo })
        }
      }

      const fullEventDetails: EventDetails = {
        eventid,
        nomeevento: eventoData.nomeevento || "Evento desconhecido",
        imageurl: eventoData.imageurl || "",
        dataevento: eventoData.dataevento || "",
        local: eventoData.local || "",
        ingressos: ingressosDoUsuarioParaEsteEvento,
        quantidadeTotal: ingressosDoUsuarioParaEsteEvento.length,
      }
      setSelectedEvento(fullEventDetails)
    } catch (error) {
      console.error("Erro ao carregar ingressos do evento:", error)
      Alert.alert("Erro", "Não foi possível carregar os detalhes do evento.")
    } finally {
      setEventDetailsLoading(false)
    }
  }

  const handleEventSelect = (eventoSummary: EventSummary) => {
    setSelectedEvento(null)
    setViewMode("eventDetails")
    carregarIngressosDoEvento(eventoSummary.eventid)
  }

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setViewMode("ticketDetails")
  }

  const handleBackPress = () => {
    if (viewMode === "ticketDetails") {
      setViewMode("eventDetails")
      setSelectedTicket(null)
    } else if (viewMode === "eventDetails") {
      setViewMode("events")
      setSelectedEvento(null)
    } else {
      navigation.goBack()
    }
  }

  const handleTransferTicket = () => {
    Alert.alert(
      "Transferir Ingresso",
      "Esta funcionalidade estará disponível em breve. Você poderá transferir seus ingressos para outros usuários.",
      [{ text: "OK", style: "default" }],
    )
  }

  const getHeaderTitle = () => {
    switch (viewMode) {
      case "eventDetails":
        return selectedEvento?.nomeevento || "Detalhes do Evento"
      case "ticketDetails":
        return "Ingresso Digital"
      default:
        return "Meus Ingressos"
    }
  }

  const contentPaddingBottom = insets.bottom + 80

  if (!user?.cpf || !userData) {
    return (
      <View style={ingressosStyles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        <Header
          title="Meus Ingressos"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
          isMainTitle={true}
          insets={insets}
        />
        <View style={[ingressosStyles.contentContainer, { paddingBottom: contentPaddingBottom }]}>
          <EmptyState
            icon="ticket-outline"
            title="Acesso Necessário"
            message="Você precisa estar logado para visualizar seus ingressos."
          />
        </View>
        <BottomActionBar
          viewMode={viewMode}
          onTransfer={handleTransferTicket}
          selectedTicket={selectedTicket}
          selectedEvento={selectedEvento}
          insetsBottom={insets.bottom}
        />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={ingressosStyles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        <Header
          title="Meus Ingressos"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
          isMainTitle={true}
          insets={insets}
        />
        <View style={[ingressosStyles.contentContainer, { paddingBottom: contentPaddingBottom }]}>
          <LoadingState message="Carregando seus eventos..." />
        </View>
        <BottomActionBar
          viewMode={viewMode}
          onTransfer={handleTransferTicket}
          selectedTicket={selectedTicket}
          selectedEvento={selectedEvento}
          insetsBottom={insets.bottom}
        />
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
        {viewMode === "events" && <EventsListView eventos={eventos} onEventSelect={handleEventSelect} onOfflineDownload={handleOfflineDownload} />}

        {viewMode === "eventDetails" && eventDetailsLoading && (
          <LoadingState message="Carregando detalhes do evento..." />
        )}
        {viewMode === "eventDetails" && !eventDetailsLoading && selectedEvento && (
          <EventDetailsView evento={selectedEvento} onTicketSelect={handleTicketSelect} />
        )}

        {viewMode === "ticketDetails" && selectedTicket && (
          <TicketDetailsView ticket={selectedTicket} evento={selectedEvento!} />
        )}
      </View>

      <BottomActionBar
        viewMode={viewMode}
        onTransfer={handleTransferTicket}
        selectedTicket={selectedTicket}
        selectedEvento={selectedEvento}
        insetsBottom={insets.bottom}
      />

      {/* Modal de Aviso Offline */}
      <OfflineWarningModal 
        visible={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        onConfirm={handleOfflineModalConfirm}
      />

      {/* Modal de Seleção de Eventos */}
      <EventSelectionModal
        visible={showEventSelectionModal}
        eventos={eventos}
        selectedEvents={selectedEventsForDownload}
        onToggleEvent={toggleEventSelection}
        onClose={() => setShowEventSelectionModal(false)}
        onConfirm={handleEventSelectionConfirm}
      />

      {/* Modal de Download */}
      <DownloadModal
        visible={showDownloadModal}
        eventos={eventos.filter(e => selectedEventsForDownload.includes(e.eventid))}
        userData={userData}
        availableStorage={availableStorage}
        downloadProgress={downloadProgress}
        isDownloading={isDownloading}
        downloadSummary={downloadSummary}
        onClose={() => setShowDownloadModal(false)}
        onStartDownload={performOfflineDownload}
        onComplete={handleDownloadComplete}
      />
    </View>
  )
}

// ===== COMPONENTE HEADER CORRIGIDO =====
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
  // CORREÇÃO: Calcular o padding top correto para Android e iOS
  const headerPaddingTop = Platform.OS === 'android' 
    ? insets.top + 16  // Para Android, usar insets.top + padding normal
    : 16;              // Para iOS, SafeAreaView já cuida da área segura
  
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

// ===== COMPONENTE BOTTOM ACTION BAR REDESENHADO =====
function BottomActionBar({
  viewMode,
  onTransfer,
  selectedTicket,
  selectedEvento,
  insetsBottom,
}: {
  viewMode: string
  onTransfer: () => void
  selectedTicket: Ticket | null
  selectedEvento: EventDetails | null
  insetsBottom: number
}) {
  const getActions = () => {
    switch (viewMode) {
      case "ticketDetails":
        return [
          {
            icon: "swap-horizontal",
            label: "Transferir",
            onPress: onTransfer,
            disabled: true,
          },
        ]
      case "eventDetails":
        return [
          {
            icon: "swap-horizontal",
            label: "Transferir",
            onPress: onTransfer,
            disabled: true,
          },
        ]
      default:
        return [
          {
            icon: "swap-horizontal",
            label: "Transferir",
            onPress: onTransfer,
            disabled: true,
          },
        ]
    }
  }

  const actions = getActions()

  return (
    <View style={[ingressosStyles.bottomActionBar, { paddingBottom: insetsBottom }]}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[ingressosStyles.actionButton, action.disabled && ingressosStyles.actionButtonDisabled]}
          onPress={action.disabled ? undefined : action.onPress}
          disabled={action.disabled}
          activeOpacity={action.disabled ? 1 : 0.7}
        >
          <MaterialCommunityIcons 
            name={action.icon as any} 
            size={20} 
            color={action.disabled ? "#9CA3AF" : "#6366F1"} 
          />
          <Text style={[ingressosStyles.actionButtonText, action.disabled && ingressosStyles.actionButtonTextDisabled]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ===== COMPONENTES AUXILIARES REDESENHADOS =====
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

// ===== LISTA DE EVENTOS COMPLETAMENTE REDESENHADA =====
function EventsListView({
  eventos,
  onEventSelect,
  onOfflineDownload,
}: { eventos: EventSummary[]; onEventSelect: (evento: EventSummary) => void; onOfflineDownload: () => void }) {
  if (eventos.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="Nenhum Ingresso"
        message="Você ainda não possui ingressos. Explore nossos eventos e garanta o seu!"
      />
    )
  }

  const totalIngressos = eventos.reduce((total, evento) => total + evento.quantidadeTotal, 0)

  return (
    <View style={ingressosStyles.container}>
      {/* Summary Card Redesenhado */}
      <View style={ingressosStyles.summaryCard}>
        <View style={ingressosStyles.summaryHeader}>
          <View style={ingressosStyles.summaryIcon}>
            <MaterialCommunityIcons name="ticket-confirmation" size={20} color="#FFFFFF" />
          </View>
          <Text style={ingressosStyles.summaryTitle}>Seus Ingressos</Text>
        </View>
        <View style={ingressosStyles.summaryStats}>
          <View style={ingressosStyles.summaryStatItem}>
            <Text style={ingressosStyles.summaryStatNumber}>{eventos.length}</Text>
            <Text style={ingressosStyles.summaryStatLabel}>
              {eventos.length === 1 ? 'Evento' : 'Eventos'}
            </Text>
          </View>
          <View style={ingressosStyles.summaryStatItem}>
            <Text style={ingressosStyles.summaryStatNumber}>{totalIngressos}</Text>
            <Text style={ingressosStyles.summaryStatLabel}>
              {totalIngressos === 1 ? 'Ingresso' : 'Ingressos'}
            </Text>
          </View>
        </View>
      </View>

      {/* Botão de Download Offline */}
      <TouchableOpacity 
        style={ingressosStyles.offlineDownloadButton}
        onPress={onOfflineDownload}
        activeOpacity={0.8}
      >
        <View style={ingressosStyles.offlineDownloadContent}>
          <View style={ingressosStyles.offlineDownloadIcon}>
            <MaterialCommunityIcons name="download" size={24} color="#FFFFFF" />
          </View>
          <View style={ingressosStyles.offlineDownloadText}>
            <Text style={ingressosStyles.offlineDownloadTitle}>BAIXAR INGRESSOS PARA USO OFFLINE</Text>
            <Text style={ingressosStyles.offlineDownloadSubtitle}>Para usar sem conexão com a internet</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Lista de Eventos Compacta */}
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.eventid}
        contentContainerStyle={ingressosStyles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={ingressosStyles.eventCard} 
            onPress={() => onEventSelect(item)}
          >
            <View style={ingressosStyles.eventCardContent}>
              {/* Imagem do Evento Compacta */}
              <View style={ingressosStyles.eventImageContainer}>
                {item.imageurl ? (
                  <Image source={{ uri: item.imageurl }} style={ingressosStyles.eventImage} />
                ) : (
                  <View style={[ingressosStyles.eventImage, ingressosStyles.imagePlaceholder]}>
                    <MaterialCommunityIcons name="image-outline" size={24} color="#9CA3AF" />
                  </View>
                )}
                <View style={ingressosStyles.ticketBadge}>
                  <Text style={ingressosStyles.ticketBadgeText}>{item.quantidadeTotal}</Text>
                </View>
              </View>

              {/* Informações do Evento */}
              <View style={ingressosStyles.eventInfo}>
                <View style={ingressosStyles.eventHeader}>
                  <Text style={ingressosStyles.eventName} numberOfLines={2}>
                    {item.nomeevento}
                  </Text>
                  {item.dataevento && (
                    <Text style={ingressosStyles.eventDate}>{item.dataevento}</Text>
                  )}
                  {item.local && (
                    <Text style={ingressosStyles.eventLocation} numberOfLines={1}>
                      {item.local}
                    </Text>
                  )}
                </View>
                
                <View style={ingressosStyles.eventFooter}>
                  <Text style={ingressosStyles.ticketCount}>
                    {item.quantidadeTotal} {item.quantidadeTotal === 1 ? 'ingresso' : 'ingressos'}
                  </Text>
                  <View style={ingressosStyles.eventArrow}>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

// ===== EVENT DETAILS VIEW REDESENHADA =====
function EventDetailsView({
  evento,
  onTicketSelect,
}: { evento: EventDetails; onTicketSelect: (ticket: Ticket) => void }) {
  return (
    <ScrollView style={ingressosStyles.container} showsVerticalScrollIndicator={false}>
      <View style={ingressosStyles.eventDetailsHeader}>
        {evento.imageurl ? (
          <Image source={{ uri: evento.imageurl }} style={ingressosStyles.eventDetailImage} />
        ) : (
          <View style={[ingressosStyles.eventDetailImage, ingressosStyles.imagePlaceholder]}>
            <MaterialCommunityIcons name="image-outline" size={48} color="#9CA3AF" />
          </View>
        )}

        <View style={ingressosStyles.eventDetailsInfo}>
          <Text style={ingressosStyles.eventDetailName}>{evento.nomeevento}</Text>
          {evento.dataevento && (
            <View style={ingressosStyles.eventDetailRow}>
              <View style={ingressosStyles.eventDetailIcon}>
                <MaterialCommunityIcons name="calendar-outline" size={20} color="#6366F1" />
              </View>
              <Text style={ingressosStyles.eventDetailText}>{evento.dataevento}</Text>
            </View>
          )}
          {evento.local && (
            <View style={ingressosStyles.eventDetailRow}>
              <View style={ingressosStyles.eventDetailIcon}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#6366F1" />
              </View>
              <Text style={ingressosStyles.eventDetailText}>{evento.local}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={ingressosStyles.ticketsSection}>
        <Text style={ingressosStyles.sectionTitle}>Seus Ingressos ({evento.quantidadeTotal})</Text>

        {evento.ingressos.map((ticket, index) => (
          <TouchableOpacity
            key={ticket.codigo}
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
                <Text style={ingressosStyles.ticketCode}>#{ticket.codigo.slice(-8)}</Text>
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

// ===== TICKET DETAILS VIEW REDESENHADA =====
function TicketDetailsView({ ticket, evento }: { ticket: Ticket; evento: EventDetails }) {
  return (
    <ScrollView style={ingressosStyles.container} contentContainerStyle={ingressosStyles.ticketDetailsContainer}>
      <View style={ingressosStyles.ticketDetailsCard}>
        <View style={ingressosStyles.ticketHeader}>
          <Text style={ingressosStyles.ticketEventName}>{evento.nomeevento}</Text>
          <Text style={ingressosStyles.ticketTypeDetail}>{ticket.tipo}</Text>
        </View>

        <View style={ingressosStyles.qrCodeContainer}>
          <QRCode value={ticket.codigo} size={200} />
        </View>

        <View style={ingressosStyles.ticketInfoContainer}>
          <View style={ingressosStyles.ticketInfoRow}>
            <Text style={ingressosStyles.ticketInfoLabel}>Código do Ingresso</Text>
            <Text style={ingressosStyles.ticketInfoValue}>{ticket.codigo}</Text>
          </View>

          {evento.dataevento && (
            <View style={ingressosStyles.ticketInfoRow}>
              <Text style={ingressosStyles.ticketInfoLabel}>Data do Evento</Text>
              <Text style={ingressosStyles.ticketInfoValue}>{evento.dataevento}</Text>
            </View>
          )}

          {evento.local && (
            <View style={ingressosStyles.ticketInfoRow}>
              <Text style={ingressosStyles.ticketInfoLabel}>Local</Text>
              <Text style={ingressosStyles.ticketInfoValue}>{evento.local}</Text>
            </View>
          )}
        </View>

        <View style={ingressosStyles.ticketFooter}>
          <View style={ingressosStyles.validationBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
            <Text style={ingressosStyles.validationText}>Ingresso Válido</Text>
          </View>
        </View>
      </View>

      <View style={ingressosStyles.instructionsCard}>
        <Text style={ingressosStyles.instructionsTitle}>Instruções</Text>
        <Text style={ingressosStyles.instructionsText}>
          • Apresente este QR Code na entrada do evento{"\n"}
          • Mantenha o brilho da tela no máximo{"\n"}
          • Chegue com antecedência para evitar filas{"\n"}
          • Este ingresso é pessoal e intransferível
        </Text>
      </View>
    </ScrollView>
  )
}


// ===== MODAL DE AVISO OFFLINE =====
function OfflineWarningModal({ 
  visible, 
  onClose, 
  onConfirm 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={ingressosStyles.modalOverlay}>
        <View style={ingressosStyles.modalContainer}>
          <View style={ingressosStyles.modalHeader}>
            <View style={ingressosStyles.modalIcon}>
              <MaterialCommunityIcons name="download-outline" size={32} color="#6366F1" />
            </View>
            <Text style={ingressosStyles.modalTitle}>Download de Ingressos</Text>
          </View>

          <View style={ingressosStyles.modalContent}>
            <Text style={ingressosStyles.modalText}>
              O Download de Ingressos é uma ferramenta para uso exclusivamente no momento para uso OFF-LINE, ou seja, se você não tiver conexão à internet no momento da entrada do seu Evento.
            </Text>
            <Text style={ingressosStyles.modalText}>
              É importante ter memória livre para realizar o download. Recomendamos pelo menos 200MB de espaço disponível.
            </Text>
            <Text style={ingressosStyles.modalText}>
              • Os ingressos serão salvos no seu dispositivo{'\n'}
              • Funcionam sem conexão com a internet{'\n'}
              • Incluem QR Code para validação{'\n'}
              • Dados seguros e criptografados
            </Text>
          </View>

          <View style={ingressosStyles.modalActions}>
            <TouchableOpacity 
              style={ingressosStyles.modalButtonSecondary}
              onPress={onClose}
            >
              <Text style={ingressosStyles.modalButtonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={ingressosStyles.modalButtonPrimary}
              onPress={onConfirm}
            >
              <Text style={ingressosStyles.modalButtonPrimaryText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ===== MODAL DE SELEÇÃO DE EVENTOS =====
function EventSelectionModal({ 
  visible, 
  eventos, 
  selectedEvents, 
  onToggleEvent, 
  onClose, 
  onConfirm 
}: { 
  visible: boolean; 
  eventos: EventSummary[]; 
  selectedEvents: string[]; 
  onToggleEvent: (eventId: string) => void; 
  onClose: () => void; 
  onConfirm: () => void; 
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={ingressosStyles.modalOverlay}>
        <View style={ingressosStyles.modalContainerLarge}>
          <View style={ingressosStyles.modalHeader}>
            <Text style={ingressosStyles.modalTitle}>Selecionar Eventos</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={ingressosStyles.modalContent}>
            <Text style={ingressosStyles.modalSubtitle}>
              Escolha quais eventos deseja baixar para uso offline:
            </Text>

            <ScrollView style={ingressosStyles.eventSelectionList}>
              {eventos.map((evento) => (
                <TouchableOpacity
                  key={evento.eventid}
                  style={[
                    ingressosStyles.eventSelectionItem,
                    selectedEvents.includes(evento.eventid) && ingressosStyles.eventSelectionItemSelected
                  ]}
                  onPress={() => onToggleEvent(evento.eventid)}
                >
                  <View style={ingressosStyles.eventSelectionContent}>
                    <View style={ingressosStyles.eventSelectionInfo}>
                      <Text style={ingressosStyles.eventSelectionName}>{evento.nomeevento}</Text>
                      <Text style={ingressosStyles.eventSelectionDetails}>
                        {evento.quantidadeTotal} {evento.quantidadeTotal === 1 ? 'ingresso' : 'ingressos'}
                        {evento.dataevento && ` • ${evento.dataevento}`}
                      </Text>
                    </View>
                    <View style={[
                      ingressosStyles.eventSelectionCheckbox,
                      selectedEvents.includes(evento.eventid) && ingressosStyles.eventSelectionCheckboxSelected
                    ]}>
                      {selectedEvents.includes(evento.eventid) && (
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={ingressosStyles.modalActions}>
            <TouchableOpacity 
              style={ingressosStyles.modalButtonSecondary}
              onPress={onClose}
            >
              <Text style={ingressosStyles.modalButtonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                ingressosStyles.modalButtonPrimary,
                selectedEvents.length === 0 && ingressosStyles.modalButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={selectedEvents.length === 0}
            >
              <Text style={ingressosStyles.modalButtonPrimaryText}>
                Confirmar ({selectedEvents.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ===== MODAL DE DOWNLOAD =====
function DownloadModal({ 
  visible, 
  eventos, 
  userData, 
  availableStorage, 
  downloadProgress, 
  isDownloading, 
  downloadSummary, 
  onClose, 
  onStartDownload, 
  onComplete 
}: { 
  visible: boolean; 
  eventos: EventSummary[]; 
  userData: any; 
  availableStorage: number; 
  downloadProgress: number; 
  isDownloading: boolean; 
  downloadSummary: any; 
  onClose: () => void; 
  onStartDownload: () => void; 
  onComplete: () => void; 
}) {
  const totalTickets = eventos.reduce((total, evento) => total + evento.quantidadeTotal, 0)
  const requiredStorage = 200 // MB
  const storagePercentage = Math.min((availableStorage / requiredStorage) * 100, 100)

  if (downloadSummary) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onComplete}
      >
        <View style={ingressosStyles.modalOverlay}>
          <View style={ingressosStyles.modalContainer}>
            <View style={ingressosStyles.modalHeader}>
              <View style={ingressosStyles.modalIconSuccess}>
                <MaterialCommunityIcons name="check-circle" size={32} color="#10B981" />
              </View>
              <Text style={ingressosStyles.modalTitle}>Download Concluído!</Text>
            </View>

            <View style={ingressosStyles.modalContent}>
              <View style={ingressosStyles.downloadSummary}>
                <Text style={ingressosStyles.downloadSummaryTitle}>Resumo do Download</Text>
                
                <View style={ingressosStyles.downloadSummaryItem}>
                  <Text style={ingressosStyles.downloadSummaryLabel}>Ingressos baixados:</Text>
                  <Text style={ingressosStyles.downloadSummaryValue}>{downloadSummary.totalTickets}</Text>
                </View>
                
                <View style={ingressosStyles.downloadSummaryItem}>
                  <Text style={ingressosStyles.downloadSummaryLabel}>Eventos:</Text>
                  <Text style={ingressosStyles.downloadSummaryValue}>{downloadSummary.events}</Text>
                </View>
                
                <View style={ingressosStyles.downloadSummaryItem}>
                  <Text style={ingressosStyles.downloadSummaryLabel}>Data do download:</Text>
                  <Text style={ingressosStyles.downloadSummaryValue}>{downloadSummary.downloadDate}</Text>
                </View>
              </View>

              <Text style={ingressosStyles.modalText}>
                Seus ingressos foram salvos com sucesso no dispositivo e podem ser acessados mesmo sem conexão com a internet.
              </Text>
            </View>

            <View style={ingressosStyles.modalActions}>
              <TouchableOpacity 
                style={ingressosStyles.modalButtonPrimary}
                onPress={onComplete}
              >
                <Text style={ingressosStyles.modalButtonPrimaryText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={ingressosStyles.modalOverlay}>
        <View style={ingressosStyles.modalContainerLarge}>
          <View style={ingressosStyles.modalHeader}>
            <Text style={ingressosStyles.modalTitle}>Confirmar Download</Text>
            {!isDownloading && (
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          <View style={ingressosStyles.modalContent}>
            {!isDownloading ? (
              <>
                <View style={ingressosStyles.downloadInfo}>
                  <Text style={ingressosStyles.downloadInfoTitle}>Detalhes do Download</Text>
                  
                  <View style={ingressosStyles.downloadInfoItem}>
                    <MaterialCommunityIcons name="calendar-multiple" size={20} color="#6366F1" />
                    <Text style={ingressosStyles.downloadInfoText}>
                      {eventos.length} {eventos.length === 1 ? 'evento selecionado' : 'eventos selecionados'}
                    </Text>
                  </View>
                  
                  <View style={ingressosStyles.downloadInfoItem}>
                    <MaterialCommunityIcons name="ticket-confirmation" size={20} color="#6366F1" />
                    <Text style={ingressosStyles.downloadInfoText}>
                      {totalTickets} {totalTickets === 1 ? 'ingresso' : 'ingressos'} para download
                    </Text>
                  </View>
                  
                  <View style={ingressosStyles.downloadInfoItem}>
                    <MaterialCommunityIcons name="account" size={20} color="#6366F1" />
                    <Text style={ingressosStyles.downloadInfoText}>
                      Titular: {userData?.nome || 'Usuário'}
                    </Text>
                  </View>
                </View>

                <View style={ingressosStyles.storageInfo}>
                  <Text style={ingressosStyles.storageInfoTitle}>Armazenamento do Dispositivo</Text>
                  
                  <View style={ingressosStyles.storageBar}>
                    <View style={ingressosStyles.storageBarBackground}>
                      <View 
                        style={[
                          ingressosStyles.storageBarFill,
                          { width: `${Math.min(storagePercentage, 100)}%` },
                          availableStorage < requiredStorage && ingressosStyles.storageBarFillDanger
                        ]} 
                      />
                    </View>
                  </View>
                  
                  <View style={ingressosStyles.storageDetails}>
                    <Text style={ingressosStyles.storageText}>
                      Disponível: {availableStorage.toFixed(0)}MB
                    </Text>
                    <Text style={ingressosStyles.storageText}>
                      Necessário: {requiredStorage}MB
                    </Text>
                  </View>

                  {availableStorage < requiredStorage && (
                    <View style={ingressosStyles.storageWarning}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                      <Text style={ingressosStyles.storageWarningText}>
                        Armazenamento insuficiente para o download
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={ingressosStyles.downloadProgress}>
                <Text style={ingressosStyles.downloadProgressTitle}>Baixando Ingressos...</Text>
                
                <View style={ingressosStyles.progressBar}>
                  <View style={ingressosStyles.progressBarBackground}>
                    <View 
                      style={[
                        ingressosStyles.progressBarFill,
                        { width: `${downloadProgress}%` }
                      ]} 
                    />
                  </View>
                </View>
                
                <Text style={ingressosStyles.downloadProgressText}>
                  {Math.round(downloadProgress)}% concluído
                </Text>
                
                <ActivityIndicator size="large" color="#6366F1" style={ingressosStyles.downloadLoader} />
              </View>
            )}
          </View>

          {!isDownloading && (
            <View style={ingressosStyles.modalActions}>
              <TouchableOpacity 
                style={ingressosStyles.modalButtonSecondary}
                onPress={onClose}
              >
                <Text style={ingressosStyles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  ingressosStyles.modalButtonPrimary,
                  availableStorage < requiredStorage && ingressosStyles.modalButtonDisabled
                ]}
                onPress={onStartDownload}
                disabled={availableStorage < requiredStorage}
              >
                <Text style={ingressosStyles.modalButtonPrimaryText}>Iniciar Download</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

