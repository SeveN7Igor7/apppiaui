"use client"

import { useEffect, useState, useContext, useRef } from "react"
import { Modal, Animated, Dimensions, StyleSheet } from "react-native"
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  SafeAreaView, // Usado para a tela principal
  StatusBar,
  Alert,
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { ref, onValue, get } from "firebase/database"
import { database } from "../services/firebase"
import { databaseSocial } from "../services/firebaseappdb"
import { AuthContext } from "../contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Colors } from "../constants/Colors"

import ChatComponent from "../components/ChatComponent"
import { eventDetailsStyles } from "../constants/EventDetailsStyle"

type EventDetailsRouteParams = {
  eventId: string
}

type Evento = {
  id: string
  nomeevento: string
  imageurl: string
  local?: string
  datainicio?: string
  aberturaportas?: string
  nomeurl?: string
  vendaaberta: { vendaaberta: boolean; mensagem: string }
  categoria?: string
  descricao?: string
  preco?: string
}

type VibeData = {
  media: number
  count: number
}

export default function EventDetails() {
  const route = useRoute()
  const navigation = useNavigation()
  const { eventId } = route.params as EventDetailsRouteParams
  const { user } = useContext(AuthContext)

  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [vibe, setVibe] = useState<VibeData | null>(null)
  const [isChatVisible, setIsChatVisible] = useState(false)
  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    const eventoRef = ref(database, `eventos/${eventId}`)
    const unsubscribe = onValue(eventoRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setEvento({
          id: eventId,
          nomeevento: data.nomeevento || "Sem nome",
          imageurl: data.imageurl || "",
          nomeurl: data.nomeurl,
          local: data.local,
          datainicio: data.datainicio,
          aberturaportas: data.aberturaportas,
          vendaaberta: data.vendaaberta || { vendaaberta: false, mensagem: "" },
          categoria: data.categoria || "outros",
          descricao: data.descricao || "",
          preco: data.preco || "",
        })
      } else {
        setEvento(null)
      }
      setLoading(false)
    }, (error) => {
      console.error("[EventDetails] Erro ao buscar dados do evento:", error)
      setLoading(false)
      setEvento(null)
    })
    return () => unsubscribe()
  }, [eventId])

  async function calcularMediaVibe(eventId: string): Promise<VibeData | null> {
    try {
      const snapshot = await get(ref(databaseSocial, `avaliacoesVibe/${eventId}/`))
      if (!snapshot.exists()) return null
      const data = snapshot.val()
      const agora = Date.now()
      const umaHoraMs = 3600000
      const avaliacoesRecentes = Object.values(data).filter((item: any) => item.timestamp && (agora - item.timestamp <= umaHoraMs)) as { nota: number }[]
      if (avaliacoesRecentes.length === 0) return null
      const totalNotas = avaliacoesRecentes.reduce((acc, cur) => acc + cur.nota, 0)
      return { media: totalNotas / avaliacoesRecentes.length, count: avaliacoesRecentes.length }
    } catch (error) {
      console.error(`[EventDetails] Erro ao calcular vibe do evento ${eventId}:`, error)
      return null
    }
  }

  useEffect(() => {
    if (!evento) return
    const carregarVibe = async () => setVibe(await calcularMediaVibe(evento.id))
    carregarVibe()
    const intervalo = setInterval(carregarVibe, 300000)
    return () => clearInterval(intervalo)
  }, [evento])

  const getUrgenciaMensagem = (): string => {
    if (!evento?.datainicio || !evento?.aberturaportas) return ""
    try {
      const hoje = new Date()
      const [dia, mes, ano] = evento.datainicio.split("/").map(Number)
      const [hora, minuto] = evento.aberturaportas.replace("h", ":").split(":").map(Number)
      const dataEvento = new Date(ano, mes - 1, dia, hora, minuto)
      const diffMs = dataEvento.getTime() - hoje.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin <= 0) return "Acontecendo agora!"
      if (diffMin < 60) return `Faltam ${diffMin} min`
      const diffHoras = Math.floor(diffMs / 3600000)
      if (diffHoras <= 5) return `Faltam ${diffHoras} horas`
      return ""
    } catch { return "" }
  }

  const getMensagemVibe = (): string => {
    if (!vibe || vibe.count === 0) return "Seja o primeiro a avaliar!"
    if (vibe.count <= 3) return `Poucas avaliações (${vibe.count})`
    if (vibe.media < 3) return "Vibe baixa"
    if (vibe.media < 4.5) return "Vibe moderada"
    return "Altíssima vibe!"
  }

  const mostraSeloAltaVibe = (): boolean => !!vibe && vibe.count >= 9 && vibe.media >= 4.5
  const getVibeStars = (): number => vibe ? Math.round(vibe.media) : 0
  const formatarCategoria = (cat?: string): string => cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Evento"
  const formatarData = (data?: string): string => {
    if (!data) return ""
    try {
      const [dia, mes, ano] = data.split("/")
      const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
      return `${dia} de ${meses[parseInt(mes, 10) - 1]} de ${ano}`
    } catch { return data }
  }
  const formatarHorario = (horario?: string): string => horario ? horario.replace("h", ":") : ""

  const eventoJaComecou = (): boolean => {
    if (!evento?.datainicio || !evento?.aberturaportas) return false
    try {
      const agora = new Date()
      const [dia, mes, ano] = evento.datainicio.split("/").map(Number)
      const [hora, minuto] = evento.aberturaportas.replace("h", ":").split(":").map(Number)
      return agora >= new Date(ano, mes - 1, dia, hora, minuto)
    } catch { return false }
  }

  const getMensagemLiberacaoVibe = (): string => {
    if (!evento?.datainicio || !evento?.aberturaportas) return ""
    try {
      const [dia, mes, ano] = evento.datainicio.split("/").map(Number)
      const [hora, minuto] = evento.aberturaportas.replace("h", ":").split(":").map(Number)
      const dataAbertura = new Date(ano, mes - 1, dia, hora, minuto)
      return `Avaliação liberada a partir de ${dataAbertura.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
    } catch { return "Avaliação será liberada quando o evento começar" }
  }

  const handleOpenSalesPage = () => evento && Linking.openURL(`https://piauitickets.com/comprar/${eventId}/${evento.nomeurl || ""}` ).catch(err => console.error("Erro ao abrir URL:", err))
  const handleAvaliarVibe = () => {
    if (!user) return Alert.alert("Login necessário", "Você precisa estar logado para avaliar.", [{ text: "Cancelar" }, { text: "Login", onPress: () => navigation.navigate("Perfil" as never) }])
    if (!evento) return
    if (!eventoJaComecou()) return Alert.alert("Avaliação não disponível", getMensagemLiberacaoVibe(), [{ text: "Entendi" }])
    navigation.navigate("VibeScreen" as never, { eventId: evento.id, nomeEvento: evento.nomeevento, cpf: user.cpf } as never)
  }

  const handleGoBack = () => navigation.goBack()
  const handleOpenChat = () => {
    setIsChatVisible(true)
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start()
  }
  const handleCloseChat = () => {
    Animated.timing(slideAnim, { toValue: Dimensions.get("window").height, duration: 300, useNativeDriver: true }).start(() => setIsChatVisible(false))
  }
  const handleShare = () => Alert.alert("Compartilhar", "Funcionalidade em breve!")

  if (loading) {
    return (
      <SafeAreaView style={eventDetailsStyles.container}>
        <View style={eventDetailsStyles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary.purple} /></View>
      </SafeAreaView>
    )
  }

  if (!evento) {
    return (
      <SafeAreaView style={eventDetailsStyles.container}>
        <View style={eventDetailsStyles.errorContainer}><Text style={eventDetailsStyles.errorText}>Evento não encontrado</Text></View>
      </SafeAreaView>
    )
  }

  const encerrado = !evento.vendaaberta?.vendaaberta
  const urgencia = getUrgenciaMensagem()

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral.black }}>
      <SafeAreaView style={eventDetailsStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.neutral.black} />
        <View style={eventDetailsStyles.header}>
          <View style={eventDetailsStyles.headerContent}>
            <TouchableOpacity style={eventDetailsStyles.backButton} onPress={handleGoBack}><MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.onPrimary} /></TouchableOpacity>
            <Text style={eventDetailsStyles.headerTitle}>Detalhes do Evento</Text>
            <TouchableOpacity style={eventDetailsStyles.shareButton} onPress={handleShare}><MaterialCommunityIcons name="share-variant" size={24} color={Colors.text.onPrimary} /></TouchableOpacity>
          </View>
        </View>

        <ScrollView style={eventDetailsStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={eventDetailsStyles.eventImageContainer}>
            <Image source={{ uri: evento.imageurl }} style={[eventDetailsStyles.eventImage, encerrado && eventDetailsStyles.eventImageDisabled]} />
            {encerrado && <View style={eventDetailsStyles.eventDisabledOverlay}><MaterialCommunityIcons name="close-circle" size={32} color={Colors.text.onPrimary} /><Text style={eventDetailsStyles.eventDisabledText}>Vendas Encerradas</Text></View>}
            {mostraSeloAltaVibe() && !encerrado && <View style={eventDetailsStyles.eventHighVibeBadge}><MaterialCommunityIcons name="fire" size={18} color={Colors.text.onPrimary} /><Text style={eventDetailsStyles.eventHighVibeBadgeText}>Alta Vibe</Text></View>}
            {eventoJaComecou() && <TouchableOpacity style={eventDetailsStyles.chatButton} onPress={handleOpenChat}><MaterialCommunityIcons name="chat" size={24} color={Colors.text.onPrimary} /><Text style={eventDetailsStyles.chatButtonText}>Chat do Evento</Text></TouchableOpacity>}
            {urgencia && <View style={eventDetailsStyles.eventUrgencyBadge}><MaterialCommunityIcons name="clock-fast" size={16} color={Colors.text.onPrimary} /><Text style={eventDetailsStyles.eventUrgencyText}>{urgencia}</Text></View>}
          </View>

          <View style={eventDetailsStyles.eventContent}>
            <View style={eventDetailsStyles.eventTitleSection}><Text style={eventDetailsStyles.eventCategory}>{formatarCategoria(evento.categoria)}</Text><Text style={eventDetailsStyles.eventName}>{evento.nomeevento}</Text></View>
            {urgencia && <View style={eventDetailsStyles.urgencyMessage}><MaterialCommunityIcons name="clock-fast" size={20} color={Colors.text.onPrimary} /><Text style={eventDetailsStyles.urgencyMessageText}>{urgencia}</Text></View>}
            <View style={eventDetailsStyles.eventInfoSection}>
              {evento.datainicio && <View style={eventDetailsStyles.eventInfoRow}><View style={eventDetailsStyles.eventInfoIcon}><MaterialCommunityIcons name="calendar" size={20} color={Colors.primary.purple} /></View><Text style={[eventDetailsStyles.eventInfoText, eventDetailsStyles.eventInfoTextPrimary]}>{formatarData(evento.datainicio)}</Text></View>}
              {evento.aberturaportas && <View style={eventDetailsStyles.eventInfoRow}><View style={eventDetailsStyles.eventInfoIcon}><MaterialCommunityIcons name="clock-outline" size={20} color={Colors.primary.purple} /></View><Text style={eventDetailsStyles.eventInfoText}>Abertura dos portões: {formatarHorario(evento.aberturaportas)}</Text></View>}
              {evento.local && <View style={eventDetailsStyles.eventInfoRow}><View style={eventDetailsStyles.eventInfoIcon}><MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary.purple} /></View><Text style={eventDetailsStyles.eventInfoText}>{evento.local}</Text></View>}
            </View>
            {evento.preco && <View style={eventDetailsStyles.priceSection}><Text style={eventDetailsStyles.priceLabel}>Preço dos ingressos</Text><Text style={eventDetailsStyles.priceValue}>{evento.preco}</Text></View>}
            <View style={eventDetailsStyles.vibeSection}>
              <Text style={eventDetailsStyles.vibeSectionTitle}>Vibe do Evento</Text>
              <View style={eventDetailsStyles.vibeContainer}>
                <View style={eventDetailsStyles.vibeStars}>{[1, 2, 3, 4, 5].map(star => <MaterialCommunityIcons key={star} name={star <= getVibeStars() ? "star" : "star-outline"} size={28} color={star <= getVibeStars() ? Colors.primary.orange : Colors.text.tertiary} />)}</View>
                <Text style={eventDetailsStyles.vibeMessage}>{getMensagemVibe()}</Text>
                {vibe && <Text style={eventDetailsStyles.vibeCount}>{vibe.count} {vibe.count === 1 ? "avaliação" : "avaliações"} na última hora</Text>}
                <TouchableOpacity style={[eventDetailsStyles.vibeActionButton, !eventoJaComecou() && eventDetailsStyles.vibeActionButtonDisabled]} onPress={handleAvaliarVibe} disabled={!eventoJaComecou()}><MaterialCommunityIcons name={eventoJaComecou() ? "heart" : "clock-outline"} size={20} color={eventoJaComecou() ? Colors.text.onPrimary : Colors.text.tertiary} /><Text style={[eventDetailsStyles.vibeActionButtonText, !eventoJaComecou() && eventDetailsStyles.vibeActionButtonTextDisabled]}>{eventoJaComecou() ? "Avaliar Vibe" : "Aguardando Início"}</Text></TouchableOpacity>
                {!eventoJaComecou() && <Text style={eventDetailsStyles.vibeDisabledMessage}>{getMensagemLiberacaoVibe()}</Text>}
              </View>
            </View>
            {evento.descricao && <View style={eventDetailsStyles.descriptionSection}><Text style={eventDetailsStyles.descriptionTitle}>Sobre o Evento</Text><Text style={eventDetailsStyles.descriptionText}>{evento.descricao}</Text></View>}
            <View style={eventDetailsStyles.actionsSection}>
              {evento.vendaaberta?.vendaaberta ? (
                <>
                  <TouchableOpacity style={eventDetailsStyles.primaryActionButton} onPress={handleOpenSalesPage}><LinearGradient colors={[Colors.primary.purple, Colors.primary.magenta]} style={eventDetailsStyles.primaryActionButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><MaterialCommunityIcons name="ticket" size={20} color={Colors.text.onPrimary} /><Text style={eventDetailsStyles.primaryActionButtonText}>Comprar Ingresso</Text></LinearGradient></TouchableOpacity>
                  {eventoJaComecou() ? <TouchableOpacity style={eventDetailsStyles.secondaryActionButton} onPress={handleAvaliarVibe}><MaterialCommunityIcons name="heart" size={20} color={Colors.primary.purple} /><Text style={eventDetailsStyles.secondaryActionButtonText}>Avaliar Vibe</Text></TouchableOpacity> : <View style={eventDetailsStyles.disabledButton}><MaterialCommunityIcons name="clock-outline" size={20} color={Colors.text.tertiary} /><Text style={eventDetailsStyles.disabledButtonText}>Avaliação em Breve</Text></View>}
                </>
              ) : (
                <>
                  <View style={eventDetailsStyles.statusMessage}><Text style={eventDetailsStyles.statusMessageText}>{evento.vendaaberta?.mensagem || "Vendas encerradas"}</Text></View>
                  <View style={eventDetailsStyles.disabledButton}><MaterialCommunityIcons name="ticket-outline" size={20} color={Colors.text.tertiary} /><Text style={eventDetailsStyles.disabledButtonText}>Vendas Encerradas</Text></View>
                  {eventoJaComecou() ? <TouchableOpacity style={eventDetailsStyles.secondaryActionButton} onPress={handleAvaliarVibe}><MaterialCommunityIcons name="heart" size={20} color={Colors.primary.purple} /><Text style={eventDetailsStyles.secondaryActionButtonText}>Avaliar Vibe</Text></TouchableOpacity> : <View style={eventDetailsStyles.disabledButton}><MaterialCommunityIcons name="clock-outline" size={20} color={Colors.text.tertiary} /><Text style={eventDetailsStyles.disabledButtonText}>Avaliação em Breve</Text></View>}
                </>
              )}
            </View>
          </View>
        </ScrollView>

        <Modal animationType="slide" transparent={true} visible={isChatVisible} onRequestClose={handleCloseChat}>
          {/* CORREÇÃO: A View externa com fundo e a Animated.View controlam a aparência do Modal */}
          <View style={styles.modalBackdrop}>
            <Animated.View style={[styles.chatModalContainer, { transform: [{ translateY: slideAnim }] }]}>
              <View style={eventDetailsStyles.chatHeader}>
                <TouchableOpacity style={eventDetailsStyles.chatCloseButton} onPress={handleCloseChat}>
                  <MaterialCommunityIcons name="close" size={24} color={Colors.text.onPrimary} />
                </TouchableOpacity>
                <Text style={eventDetailsStyles.chatHeaderTitle}>Chat do Evento</Text>
                <View style={{ width: 24 }} />
              </View>
              <View style={eventDetailsStyles.chatContent}>
                <ChatComponent eventId={eventId} isInsideModal={true} />
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  )
}

// Estilos adicionais para o Modal para evitar conflitos
const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escurecido
    justifyContent: 'flex-end',
  },
  chatModalContainer: {
    height: '90%', // Ocupa 90% da altura da tela
    backgroundColor: Colors.neutral.black, // Fundo do modal
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});
