import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Sistema de design moderno e profissional
export const DesignSystem = {
  // Espaçamentos consistentes baseados em múltiplos de 4
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Raios de borda consistentes
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Tipografia moderna
  typography: {
    sizes: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
      '4xl': 28,
      '5xl': 32,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    families: {
      ios: 'SF Pro Display',
      android: 'Roboto',
    },
  },
  
  // Sombras consistentes
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 10,
    },
  },
};

// Paleta de cores moderna e acessível
export const GamificationColors = {
  // Cores primárias
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9', // Cor principal
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  
  // Cores de gamificação
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7', // Cor principal
    600: '#9333EA',
    700: '#7C2D12',
    800: '#6B21A8',
    900: '#581C87',
  },
  
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Cor principal
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Cor principal
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E', // Cor principal
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  
  // Cores neutras
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Estados
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Gradientes modernos
export const GamificationGradients = {
  primary: ['#A855F7', '#7C3AED'],
  secondary: ['#10B981', '#059669'],
  accent: ['#F59E0B', '#D97706'],
  rose: ['#F43F5E', '#E11D48'],
  blue: ['#3B82F6', '#2563EB'],
  
  // Gradientes especiais
  xpBar: ['#10B981', '#059669', '#047857'],
  levelBadge: ['#A855F7', '#7C3AED', '#6D28D9'],
  streakFire: ['#F59E0B', '#D97706', '#B45309'],
  achievement: ['#F59E0B', '#D97706', '#B45309'],
  
  // Gradientes sutis para backgrounds
  cardBackground: ['#FFFFFF', '#FAFBFC'],
  sectionBackground: ['#F8FAFC', '#F1F5F9'],
};

export const GamificationStyles = StyleSheet.create({
  // ==================== CONTAINER PRINCIPAL ====================
  gamificationContainer: {
    flex: 1,
    backgroundColor: GamificationColors.gray[50],
  },
  
  // ==================== HEADER DE GAMIFICAÇÃO ====================
  gamificationHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.md,
    borderLeftWidth: 4,
    borderLeftColor: GamificationColors.purple[500],
  },
  
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.full,
    ...DesignSystem.shadows.sm,
  },
  
  levelText: {
    color: '#FFFFFF',
    fontSize: DesignSystem.typography.sizes.base,
    fontWeight: DesignSystem.typography.weights.semibold,
    marginLeft: DesignSystem.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${GamificationColors.amber[500]}15`,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: `${GamificationColors.amber[500]}25`,
  },
  
  streakText: {
    color: GamificationColors.amber[600],
    fontSize: DesignSystem.typography.sizes.base,
    fontWeight: DesignSystem.typography.weights.bold,
    marginLeft: DesignSystem.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  streakLabel: {
    color: GamificationColors.amber[500],
    fontSize: DesignSystem.typography.sizes.sm,
    marginLeft: DesignSystem.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  // ==================== SEÇÃO DE XP ====================
  xpSection: {
    gap: DesignSystem.spacing.sm,
  },
  
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  xpLabel: {
    fontSize: DesignSystem.typography.sizes.base,
    color: GamificationColors.gray[600],
    fontWeight: DesignSystem.typography.weights.medium,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  xpValue: {
    fontSize: DesignSystem.typography.sizes.base,
    color: GamificationColors.gray[800],
    fontWeight: DesignSystem.typography.weights.semibold,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  xpBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  
  xpBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: GamificationColors.gray[200],
    borderRadius: DesignSystem.borderRadius.sm,
    overflow: 'hidden',
    ...DesignSystem.shadows.sm,
  },
  
  xpBarFill: {
    height: '100%',
    borderRadius: DesignSystem.borderRadius.sm,
  },
  
  xpBarGradient: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  
  xpPercentage: {
    fontSize: DesignSystem.typography.sizes.sm,
    color: GamificationColors.gray[500],
    fontWeight: DesignSystem.typography.weights.medium,
    minWidth: 32,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  // ==================== ESTATÍSTICAS RÁPIDAS ====================
  quickStatsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.md,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  
  sectionTitle: {
    fontSize: DesignSystem.typography.sizes.lg,
    fontWeight: DesignSystem.typography.weights.semibold,
    color: GamificationColors.gray[800],
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md,
  },
  
  statCard: {
    flex: 1,
    minWidth: (width - 80) / 2,
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    gap: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.sm,
  },
  
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DesignSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignSystem.shadows.sm,
  },
  
  statValue: {
    fontSize: DesignSystem.typography.sizes['2xl'],
    fontWeight: DesignSystem.typography.weights.bold,
    color: GamificationColors.gray[800],
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  statLabel: {
    fontSize: DesignSystem.typography.sizes.sm,
    color: GamificationColors.gray[600],
    fontWeight: DesignSystem.typography.weights.medium,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  // ==================== SEÇÃO DE BADGES ====================
  badgesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.md,
    borderLeftWidth: 4,
    borderLeftColor: GamificationColors.amber[500],
  },
  
  badgeCountContainer: {
    backgroundColor: `${GamificationColors.amber[500]}15`,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: `${GamificationColors.amber[500]}25`,
  },
  
  badgeCount: {
    fontSize: DesignSystem.typography.sizes.sm,
    color: GamificationColors.amber[600],
    fontWeight: DesignSystem.typography.weights.semibold,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  badgesScroll: {
    paddingRight: DesignSystem.spacing.xl,
    gap: DesignSystem.spacing.md,
  },
  
  badgeItem: {
    alignItems: 'center',
    width: 72,
    gap: DesignSystem.spacing.sm,
  },
  
  badgeIconContainer: {
    ...DesignSystem.shadows.md,
  },
  
  badgeIconGradient: {
    width: 52,
    height: 52,
    borderRadius: DesignSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  badgeLabel: {
    fontSize: DesignSystem.typography.sizes.xs,
    color: GamificationColors.gray[600],
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: DesignSystem.typography.weights.medium,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  emptyStateText: {
    fontSize: DesignSystem.typography.sizes.base,
    color: GamificationColors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
    padding: DesignSystem.spacing.xl,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  // ==================== MODAL DE BADGE ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.borderRadius.xxl,
    padding: DesignSystem.spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...DesignSystem.shadows.xl,
    borderWidth: 1,
    borderColor: GamificationColors.gray[100],
  },
  
  modalCloseButton: {
    position: 'absolute',
    top: DesignSystem.spacing.lg,
    right: DesignSystem.spacing.lg,
    padding: DesignSystem.spacing.sm,
    backgroundColor: GamificationColors.gray[100],
    borderRadius: DesignSystem.borderRadius.full,
    ...DesignSystem.shadows.sm,
  },
  
  modalBadgeContainer: {
    marginBottom: DesignSystem.spacing.xl,
    alignItems: 'center',
  },
  
  modalBadgeIcon: {
    width: 88,
    height: 88,
    borderRadius: DesignSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignSystem.shadows.lg,
  },
  
  modalBadgeTitle: {
    fontSize: DesignSystem.typography.sizes['3xl'],
    fontWeight: DesignSystem.typography.weights.bold,
    color: GamificationColors.gray[800],
    marginBottom: DesignSystem.spacing.sm,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  modalBadgeDescription: {
    fontSize: DesignSystem.typography.sizes.base,
    color: GamificationColors.gray[600],
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.xl,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  modalProgressContainer: {
    width: '100%',
    marginBottom: DesignSystem.spacing.xl,
    backgroundColor: GamificationColors.gray[50],
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: GamificationColors.gray[200],
  },
  
  modalProgressLabel: {
    fontSize: DesignSystem.typography.sizes.sm,
    color: GamificationColors.gray[600],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: DesignSystem.typography.weights.medium,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  modalProgressBar: {
    height: 8,
    backgroundColor: GamificationColors.gray[200],
    borderRadius: DesignSystem.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.sm,
  },
  
  modalProgressFill: {
    height: '100%',
    backgroundColor: GamificationColors.emerald[500],
    borderRadius: DesignSystem.borderRadius.sm,
  },
  
  modalProgressText: {
    fontSize: DesignSystem.typography.sizes.sm,
    color: GamificationColors.gray[600],
    textAlign: 'center',
    fontWeight: DesignSystem.typography.weights.medium,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  modalUnlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${GamificationColors.emerald[500]}15`,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: `${GamificationColors.emerald[500]}25`,
  },
  
  modalUnlockedDate: {
    fontSize: DesignSystem.typography.sizes.sm,
    color: GamificationColors.emerald[600],
    fontWeight: DesignSystem.typography.weights.medium,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  modalXpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${GamificationColors.purple[500]}15`,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    gap: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: `${GamificationColors.purple[500]}25`,
  },
  
  modalXpReward: {
    fontSize: DesignSystem.typography.sizes.lg,
    color: GamificationColors.purple[600],
    fontWeight: DesignSystem.typography.weights.semibold,
    fontFamily: Platform.OS === 'ios' ? DesignSystem.typography.families.ios : DesignSystem.typography.families.android,
  },
  
  // ==================== RESPONSIVIDADE ====================
  // Ajustes para telas pequenas
  ...(width < 350 && {
    gamificationHeader: {
      padding: DesignSystem.spacing.lg,
    },
    quickStatsContainer: {
      padding: DesignSystem.spacing.lg,
    },
    badgesSection: {
      padding: DesignSystem.spacing.lg,
    },
    statCard: {
      padding: DesignSystem.spacing.md,
    },
    modalContent: {
      padding: DesignSystem.spacing.xl,
    },
    modalBadgeTitle: {
      fontSize: DesignSystem.typography.sizes['2xl'],
    },
  }),
  
  // Ajustes para telas grandes
  ...(width > 400 && {
    gamificationHeader: {
      padding: DesignSystem.spacing.xxl,
    },
    quickStatsContainer: {
      padding: DesignSystem.spacing.xxl,
    },
    badgesSection: {
      padding: DesignSystem.spacing.xxl,
    },
    statCard: {
      padding: DesignSystem.spacing.xl,
    },
  }),
  
  // ==================== ESTADOS DE INTERAÇÃO ====================
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  
  disabledState: {
    opacity: 0.5,
  },
  
  focusedState: {
    borderWidth: 2,
    borderColor: GamificationColors.primary[500],
  },
  
  // ==================== ANIMAÇÕES ====================
  fadeIn: {
    opacity: 1,
  },
  
  fadeOut: {
    opacity: 0,
  },
  
  slideUp: {
    transform: [{ translateY: 0 }],
  },
  
  slideDown: {
    transform: [{ translateY: 20 }],
  },
  
  scaleIn: {
    transform: [{ scale: 1 }],
  },
  
  scaleOut: {
    transform: [{ scale: 0.95 }],
  },
});

// Utilitários para acessibilidade
export const AccessibilityUtils = {
  // Contraste mínimo para texto
  getContrastColor: (backgroundColor: string) => {
    // Implementação simplificada - em produção, usar biblioteca de contraste
    const lightColors = ['50', '100', '200', '300'];
    const isLight = lightColors.some(shade => backgroundColor.includes(shade));
    return isLight ? GamificationColors.gray[800] : '#FFFFFF';
  },
  
  // Tamanhos mínimos para toque
  minimumTouchTarget: {
    width: 44,
    height: 44,
  },
  
  // Labels para screen readers
  accessibilityLabels: {
    level: (level: number) => `Nível ${level}`,
    xp: (current: number, total: number) => `${current} de ${total} pontos de experiência`,
    streak: (days: number) => `Sequência de ${days} dias`,
    badge: (name: string, unlocked: boolean) => 
      unlocked ? `Conquista ${name} desbloqueada` : `Conquista ${name} bloqueada`,
    progress: (current: number, total: number) => 
      `Progresso: ${current} de ${total} completo`,
  },
};

// Constantes para animações
export const AnimationConstants = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },
  
  spring: {
    tension: 50,
    friction: 4,
  },
};

export default GamificationStyles;