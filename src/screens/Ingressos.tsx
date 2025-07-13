"use client"

import { useEffect, useState, useContext } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { ref, get } from "firebase/database"
import { database } from "../services/firebase"
import QRCode from "react-native-qrcode-svg"
import { AuthContext } from "../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

interface Ticket {
  codigo: string
  tipo: string
  eventid: string
  [key: string]: any
}

interface EventSummary {
  // Interface para a lista inicial de eventos (apenas resumo)
  eventid: string
  nomeevento: string
  imageurl: string
  quantidadeTotal: number
  dataevento?: string
  local?: string
}

interface EventDetails extends EventSummary {
  // Interface para os detalhes completos do evento (com ingressos)
  ingressos: Ticket[]
}

export default function Ingressos() {
  const { user } = useContext(AuthContext)
  const [userData, setUserData] = useState<any>(null)
  const [eventos, setEventos] = useState<EventSummary[]>([]) // Armazena apenas o resumo dos eventos
  const [selectedEvento, setSelectedEvento] = useState<EventDetails | null>(null) // Armazena os detalhes completos do evento selecionado
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(false) // Para o carregamento inicial da lista de eventos
  const [eventDetailsLoading, setEventDetailsLoading] = useState(false) // Para o carregamento dos detalhes de um evento específico
  const [viewMode, setViewMode] = useState<"events" | "eventDetails" | "ticketDetails">("events")
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

  // Carrega apenas o resumo dos eventos (nome, imagem, quantidade de ingressos)
  const carregarEventosAgrupados = async () => {
    setLoading(true)
    const ingressosComprados = userData.ingressoscomprados
    const grupos: { [key: string]: Ticket[] } = {}

    // Agrupa ingressos por eventid para obter as contagens
    for (const codigo in ingressosComprados) {
      const ingresso = ingressosComprados[codigo]
      const eventid = ingresso.eventid
      if (!grupos[eventid]) grupos[eventid] = []
      grupos[eventid].push({ ...ingresso, codigo })
    }

    const listaEventos: EventSummary[] = []

    // Busca apenas os resumos dos eventos (sem os detalhes dos ingressos individuais)
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
          quantidadeTotal: grupos[eventid].length, // Apenas a contagem é necessária aqui
        })
      } catch (error) {
        console.error("Erro ao buscar evento:", error)
      }
    }

    setEventos(listaEventos)
    setLoading(false)
  }

  // Carrega os detalhes completos de um evento, incluindo seus ingressos
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
        ingressos: ingressosDoUsuarioParaEsteEvento, // Agora inclui os ingressos reais
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
    // Ao selecionar um evento, aciona o carregamento de seus detalhes completos
    setSelectedEvento(null) // Limpa a seleção anterior para mostrar o loader
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
      setSelectedEvento(null) // Limpa o evento selecionado ao voltar para a lista de eventos
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

  const handleShareTicket = () => {
    Alert.alert("Compartilhar", "Funcionalidade de compartilhamento em desenvolvimento.", [
      { text: "OK", style: "default" },
    ])
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

  // Calcula o padding inferior para evitar sobreposição com a barra de ações
  const bottomBarHeight = 70 // Altura aproximada da barra de ações inferior
  const contentPaddingBottom = insets.bottom + bottomBarHeight

  if (!user?.cpf || !userData) {
    return (
      <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
        <Header
          title="Meus Ingressos"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
          isMainTitle={true}
        />
        <View style={[styles.contentContainer, { paddingBottom: contentPaddingBottom }]}>
          <EmptyState
            icon="ticket-outline"
            title="Acesso Necessário"
            message="Você precisa estar logado para visualizar seus ingressos."
          />
        </View>
        {/* Bottom Action Bar - Mantido como solicitado */}
        <BottomActionBar
          viewMode={viewMode}
          onTransfer={handleTransferTicket}
          onShare={handleShareTicket}
          selectedTicket={selectedTicket}
          selectedEvento={selectedEvento}
          insetsBottom={insets.bottom}
        />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
        <Header
          title="Meus Ingressos"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
          isMainTitle={true}
        />
        <View style={[styles.contentContainer, { paddingBottom: contentPaddingBottom }]}>
          <LoadingState message="Carregando seus eventos..." />
        </View>
        {/* Bottom Action Bar - Mantido como solicitado */}
        <BottomActionBar
          viewMode={viewMode}
          onTransfer={handleTransferTicket}
          onShare={handleShareTicket}
          selectedTicket={selectedTicket}
          selectedEvento={selectedEvento}
          insetsBottom={insets.bottom}
        />
      </View>
    )
  }

  return (
    <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
      <Header
        title={getHeaderTitle()}
        onBackPress={handleBackPress}
        showBackButton={viewMode !== "events"}
        isMainTitle={viewMode === "events"}
      />

      <View style={[styles.contentContainer, { paddingBottom: contentPaddingBottom }]}>
        {viewMode === "events" && <EventsListView eventos={eventos} onEventSelect={handleEventSelect} />}

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

      {/* Bottom Action Bar - COPIADO EXATAMENTE DO CÓDIGO DO USUÁRIO */}
      <BottomActionBar
        viewMode={viewMode}
        onTransfer={handleTransferTicket}
        onShare={handleShareTicket}
        selectedTicket={selectedTicket}
        selectedEvento={selectedEvento}
        insetsBottom={insets.bottom}
      />
    </View>
  )
}

// Componente do Bottom Action Bar - COPIADO EXATAMENTE DO CÓDIGO DO USUÁRIO
function BottomActionBar({
  viewMode,
  onTransfer,
  onShare,
  selectedTicket,
  selectedEvento,
  insetsBottom,
}: {
  viewMode: string
  onTransfer: () => void
  onShare: () => void
  selectedTicket: Ticket | null
  selectedEvento: Event | null
  insetsBottom: number
}) {
  const getActions = () => {
    switch (viewMode) {
      case "ticketDetails":
        return [
          {
            icon: "swap-horizontal-outline",
            label: "Transferir",
            onPress: onTransfer,
            disabled: true, // Inativo conforme solicitado
          },
        ]
      case "eventDetails":
        return [
          {
            icon: "swap-horizontal-outline",
            label: "Transferir",
            onPress: onTransfer,
            disabled: true,
          },
        ]
      default:
        return [
          {
            icon: "swap-horizontal-outline",
            label: "Transferir",
            onPress: onTransfer,
            disabled: true,
          },
        ]
    }
  }

  const actions = getActions()

  return (
    <View style={[styles.bottomActionBar, { paddingBottom: insetsBottom }]}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.actionButton, action.disabled && styles.actionButtonDisabled]}
          onPress={action.disabled ? undefined : action.onPress}
          disabled={action.disabled}
          activeOpacity={action.disabled ? 1 : 0.7}
        >
          <Ionicons name={action.icon as any} size={20} color={action.disabled ? "#ccc" : "#6200ee"} />
          <Text style={[styles.actionButtonText, action.disabled && styles.actionButtonTextDisabled]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// Componente Header atualizado
function Header({
  title,
  onBackPress,
  showBackButton = true,
  isMainTitle = false,
}: {
  title: string
  onBackPress: () => void
  showBackButton?: boolean
  isMainTitle?: boolean
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
      </View>

      <View style={styles.headerCenter}>
        <Text
          style={[styles.headerTitle, isMainTitle ? styles.mainHeaderTitle : styles.subHeaderTitle]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={styles.headerRight} />
    </View>
  )
}

// Componentes auxiliares
function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name={icon as any} size={64} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  )
}

function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  )
}

function EventsListView({
  eventos,
  onEventSelect,
}: { eventos: EventSummary[]; onEventSelect: (evento: EventSummary) => void }) {
  if (eventos.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="Nenhum Ingresso"
        message="Você ainda não possui ingressos. Explore nossos eventos e garante o seu!"
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumo</Text>
        <Text style={styles.summaryText}>
          {eventos.length} evento{eventos.length !== 1 ? "s" : ""} •{" "}
          {eventos.reduce((total, evento) => total + evento.quantidadeTotal, 0)} ingresso
          {eventos.reduce((total, evento) => total + evento.quantidadeTotal, 0) !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={eventos}
        keyExtractor={(item) => item.eventid}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} style={styles.eventCard} onPress={() => onEventSelect(item)}>
            <View style={styles.eventImageContainer}>
              {item.imageurl ? (
                <Image source={{ uri: item.imageurl }} style={styles.eventImage} />
              ) : (
                <View style={[styles.eventImage, styles.imagePlaceholder]}>
                  <Ionicons name="image-outline" size={32} color="#fff" />
                </View>
              )}
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeText}>{item.quantidadeTotal}</Text>
              </View>
            </View>

            <View style={styles.eventInfo}>
              <Text style={styles.eventName} numberOfLines={2}>
                {item.nomeevento}
              </Text>
              {item.dataevento && <Text style={styles.eventDate}>{item.dataevento}</Text>}
              {item.local && (
                <Text style={styles.eventLocation} numberOfLines={1}>
                  {item.local}
                </Text>
              )}
              <View style={styles.eventFooter}>
                <Text style={styles.ticketCount}>
                  {item.quantidadeTotal} ingresso{item.quantidadeTotal !== 1 ? "s" : ""}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#000" />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

function EventDetailsView({
  evento,
  onTicketSelect,
}: { evento: EventDetails; onTicketSelect: (ticket: Ticket) => void }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.eventDetailsHeader}>
        {evento.imageurl ? (
          <Image source={{ uri: evento.imageurl }} style={styles.eventDetailImage} />
        ) : (
          <View style={[styles.eventDetailImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={48} color="#fff" />
          </View>
        )}

        <View style={styles.eventDetailsInfo}>
          <Text style={styles.eventDetailName}>{evento.nomeevento}</Text>
          {evento.dataevento && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.eventDetailText}>{evento.dataevento}</Text>
            </View>
          )}
          {evento.local && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.eventDetailText}>{evento.local}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.ticketsSection}>
        <Text style={styles.sectionTitle}>Seus Ingressos ({evento.quantidadeTotal})</Text>

        {evento.ingressos.map((ticket, index) => (
          <TouchableOpacity
            key={ticket.codigo}
            style={styles.ticketCard}
            onPress={() => onTicketSelect(ticket)}
            activeOpacity={0.8}
          >
            <View style={styles.ticketCardLeft}>
              <View style={styles.ticketIcon}>
                <Ionicons name="ticket" size={24} color="#000" />
              </View>
              <View>
                <Text style={styles.ticketType}>{ticket.tipo}</Text>
                <Text style={styles.ticketCode}>#{ticket.codigo.slice(-8)}</Text>
              </View>
            </View>

            <View style={styles.ticketCardRight}>
              <View style={styles.qrCodePreview}>
                <Ionicons name="qr-code-outline" size={20} color="#000" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

function TicketDetailsView({ ticket, evento }: { ticket: Ticket; evento: EventDetails }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.ticketDetailsContainer}>
      <View style={styles.ticketDetailsCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketEventName}>{evento.nomeevento}</Text>
          <Text style={styles.ticketTypeDetail}>{ticket.tipo}</Text>
        </View>

        <View style={styles.qrCodeContainer}>
          <QRCode value={ticket.codigo} size={200} />
        </View>

        <View style={styles.ticketInfoContainer}>
          <View style={styles.ticketInfoRow}>
            <Text style={styles.ticketInfoLabel}>Código do Ingresso</Text>
            <Text style={styles.ticketInfoValue}>{ticket.codigo}</Text>
          </View>

          {evento.dataevento && (
            <View style={styles.ticketInfoRow}>
              <Text style={styles.ticketInfoLabel}>Data do Evento</Text>
              <Text style={styles.ticketInfoValue}>{evento.dataevento}</Text>
            </View>
          )}

          {evento.local && (
            <View style={styles.ticketInfoRow}>
              <Text style={styles.ticketInfoLabel}>Local</Text>
              <Text style={styles.ticketInfoValue}>{evento.local}</Text>
            </View>
          )}
        </View>

        <View style={styles.ticketFooter}>
          <View style={styles.validationBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.validationText}>Ingresso Válido</Text>
          </View>
        </View>
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Instruções</Text>
        <Text style={styles.instructionsText}>
          • Apresente este QR Code na entrada do evento{"\n"}• Mantenha o brilho da tela no máximo{"\n"}• Chegue com
          antecedência para evitar filas{"\n"}• Este ingresso é pessoal e intransferível
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  // Header Styles - Atualizados
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000", // Preto
    paddingVertical: 13, // Reduzido para um cabeçalho menor
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    width: 40,
  },
  logo: {
    width: 40, // Logo ajustada
    height: 40, // Logo ajustada
    marginRight: 10, // Espaçamento entre logo e título
  },
  backButton: {
    padding: 4,
  },
  backButtonPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    color: "#fff",
    textAlign: "center",
  },
  mainHeaderTitle: {
    fontSize: 20, // Fonte menor para "Meus Ingressos"
    letterSpacing: 1, // Espaçamento entre letras para um visual diferente
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "Roboto-Bold", // Exemplo de fonte diferente
  },
  subHeaderTitle: {
    fontSize: 20, // Fonte menor para títulos de eventos
  },
  // Bottom Action Bar Styles - COPIADO EXATAMENTE DO CÓDIGO DO USUÁRIO
  bottomActionBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    position: "absolute", // Fixa na parte inferior
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000", // Mudado para preto
    marginLeft: 6,
  },
  actionButtonTextDisabled: {
    color: "#ccc",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20, // Ajustado para não sobrepor o bottom bar
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  eventImageContainer: {
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#e0e0e0",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#bbb",
  },
  ticketBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#000", // Preto
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ticketBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  eventInfo: {
    padding: 16,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: "#000", // Preto
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  eventDetailsHeader: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventDetailImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#e0e0e0",
  },
  eventDetailsInfo: {
    padding: 20,
  },
  eventDetailName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  ticketsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ticketCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ticketIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8e8e8", // Cinza claro
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  ticketCode: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  ticketCardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrCodePreview: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#e8e8e8", // Cinza claro
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  ticketDetailsContainer: {
    padding: 16,
  },
  ticketDetailsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  ticketEventName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  ticketTypeDetail: {
    fontSize: 16,
    color: "#000", // Preto
    fontWeight: "500",
  },
  qrCodeContainer: {
    alignItems: "center",
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  ticketInfoContainer: {
    marginBottom: 20,
  },
  ticketInfoRow: {
    marginBottom: 12,
  },
  ticketInfoLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },
  ticketInfoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  ticketFooter: {
    alignItems: "center",
  },
  validationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  validationText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginLeft: 4,
  },
  instructionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
})
