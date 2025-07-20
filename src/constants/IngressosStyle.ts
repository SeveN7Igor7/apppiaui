import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Paleta de cores moderna e elegante
const Colors = {
  primary: {
    main: '#6366F1',      // Indigo moderno
    light: '#818CF8',     // Indigo claro
    dark: '#4F46E5',      // Indigo escuro
    gradient: ['#6366F1', '#8B5CF6'], // Gradiente roxo-indigo
  },
  secondary: {
    main: '#F59E0B',      // Âmbar
    light: '#FCD34D',     // Âmbar claro
    dark: '#D97706',      // Âmbar escuro
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
  success: {
    main: '#10B981',
    light: '#34D399',
    bg: '#ECFDF5',
  },
  warning: {
    main: '#F59E0B',
    light: '#FCD34D',
    bg: '#FFFBEB',
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    bg: '#FEF2F2',
  },
  background: {
    primary: '#FAFBFC',   // Fundo principal mais suave
    secondary: '#F8F9FA', // Fundo secundário
    card: '#FFFFFF',      // Fundo dos cards
  }
};

// Sistema de tipografia moderno
const Typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'SF Pro Display Medium' : 'Roboto-Medium',
    semibold: Platform.OS === 'ios' ? 'SF Pro Display Semibold' : 'Roboto-Bold',
    bold: Platform.OS === 'ios' ? 'SF Pro Display Bold' : 'Roboto-Black',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  }
};

// Sistema de espaçamento consistente
const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Sistema de sombras elegantes
const Shadows = {
  sm: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const ingressosStyles = StyleSheet.create({
  // ===== CONTAINERS PRINCIPAIS =====
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    // CORREÇÃO: Garantir que o SafeAreaView funcione corretamente
    paddingTop: Platform.OS === 'android' ? 0 : 0, // SafeAreaView já cuida disso
  },
  
  // NOVO: Container principal que respeita a área segura
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  contentContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // ===== HEADER STYLES (CORRIGIDO) =====
  header: {
    backgroundColor: Colors.neutral.black,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
    // CORREÇÃO: Garantir que o header não sobreponha a status bar
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.lg,
  },
  
  // NOVO: Header com padding top dinâmico para Android
  headerWithSafeArea: {
    backgroundColor: Colors.neutral.black,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
    // Padding vertical será aplicado dinamicamente
  },
  
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  backButtonPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral.white,
    textAlign: 'center',
  },
  mainHeaderTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.white,
    letterSpacing: 0.5,
  },
  subHeaderTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral.white,
  },

  // ===== BOTTOM ACTION BAR =====
  bottomActionBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Shadows.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.neutral.gray100,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.neutral.gray100,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.main,
    marginLeft: Spacing.sm,
  },
  actionButtonTextDisabled: {
    color: Colors.neutral.gray400,
  },

  // ===== EMPTY STATE =====
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['4xl'],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.gray700,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral.gray500,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },

  // ===== LOADING STATE =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral.gray600,
    marginTop: Spacing.lg,
  },

  // ===== SUMMARY CARD (REDESENHADO) =====
  summaryCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.xl,
    borderRadius: 16,
    ...Shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.gray800,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
  },
  summaryStatLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral.gray500,
    marginTop: Spacing.xs,
  },

  // ===== LISTA DE EVENTOS (REDESENHADA PARA MELHOR USABILIDADE) =====
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Espaço para o bottom bar
  },

  // Cards de eventos compactos e elegantes
  eventCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  eventCardContent: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  
  // Imagem do evento menor e mais compacta
  eventImageContainer: {
    position: 'relative',
    marginRight: Spacing.lg,
  },
  eventImage: {
    width: 80,  // Muito menor que os 160px originais
    height: 80, // Quadrada para melhor aproveitamento do espaço
    borderRadius: 12,
    backgroundColor: Colors.neutral.gray200,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray300,
  },
  
  // Badge de quantidade de ingressos redesenhado
  ticketBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.secondary.main,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.background.card,
    minWidth: 24,
    alignItems: 'center',
  },
  ticketBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.white,
  },

  // Informações do evento otimizadas
  eventInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventHeader: {
    marginBottom: Spacing.sm,
  },
  eventName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral.gray800,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.tight,
    marginBottom: Spacing.xs,
  },
  eventDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  eventLocation: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral.gray500,
  },
  
  // Footer do card redesenhado
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray100,
  },
  ticketCount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral.gray600,
  },
  eventArrow: {
    padding: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray100,
  },

  // ===== EVENT DETAILS VIEW (REDESENHADA) =====
  eventDetailsHeader: {
    backgroundColor: Colors.background.card,
    margin: Spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  eventDetailImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.neutral.gray200,
  },
  eventDetailsInfo: {
    padding: Spacing['2xl'],
  },
  eventDetailName: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.gray800,
    marginBottom: Spacing.lg,
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.tight,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  eventDetailIcon: {
    width: 24,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral.gray600,
    flex: 1,
  },

  // ===== TICKETS SECTION (REDESENHADA) =====
  ticketsSection: {
    margin: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.gray800,
    marginBottom: Spacing.lg,
  },

  // Cards de ingressos mais elegantes
  ticketCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
    ...Shadows.sm,
  },
  ticketCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketType: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral.gray800,
    marginBottom: Spacing.xs,
  },
  ticketCode: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral.gray500,
  },
  ticketCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrCodePreview: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  // ===== TICKET DETAILS VIEW (REDESENHADA) =====
  ticketDetailsContainer: {
    padding: Spacing.lg,
  },
  ticketDetailsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: Spacing['3xl'],
    marginBottom: Spacing.lg,
    ...Shadows.xl,
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  ticketEventName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.gray800,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.tight,
  },
  ticketTypeDetail: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.main,
  },
  
  // QR Code container elegante
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
    padding: Spacing['2xl'],
    backgroundColor: Colors.neutral.gray50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  
  // Informações do ingresso organizadas
  ticketInfoContainer: {
    marginBottom: Spacing['2xl'],
  },
  ticketInfoRow: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  ticketInfoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  ticketInfoValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral.gray800,
  },
  
  // Badge de validação redesenhado
  ticketFooter: {
    alignItems: 'center',
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success.bg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.success.light,
  },
  validationText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.success.main,
    marginLeft: Spacing.sm,
  },

  // ===== INSTRUCTIONS CARD (REDESENHADA) =====
  instructionsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: Spacing['2xl'],
    ...Shadows.md,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral.gray800,
    marginBottom: Spacing.lg,
  },
  instructionsText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral.gray600,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },

  // ===== UTILITÁRIOS =====
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  textCenter: {
    textAlign: 'center',
  },
  
  // Gradientes para elementos especiais
  gradientBackground: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
