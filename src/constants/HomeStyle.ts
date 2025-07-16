import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

const { width, height } = Dimensions.get('window');

export const homeStyles = StyleSheet.create({
  // Container Principal
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  
  // Header Styles
  header: {
    backgroundColor: Colors.neutral.black,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.container.horizontal,
    elevation: Spacing.elevation.high,
    shadowColor: Colors.shadow.dark,
    shadowOffset: Spacing.shadowOffset.medium,
    shadowOpacity: 0.3,
    shadowRadius: Spacing.shadowRadius.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {
    height: 32,
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.container.horizontal,
  },
  loadingText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  
  // Scroll View Styles
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: Spacing.xxxxl,
  },
  
  // Section Styles
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
});

// Estilos de Gamificação
export const gamificationStyles = StyleSheet.create({
  // Card de Status do Usuário
  userStatsCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
    marginHorizontal: Spacing.container.horizontal,
    marginTop: Spacing.lg,
    elevation: Spacing.elevation.medium,
    shadowColor: Colors.shadow.medium,
    shadowOffset: Spacing.shadowOffset.small,
    shadowOpacity: 0.15,
    shadowRadius: Spacing.shadowRadius.small,
  },
  userStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: Spacing.md,
  },
  userName: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
  },
  userLevel: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
  },
  streakBadge: {
    backgroundColor: Colors.primary.magenta,
    borderRadius: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    ...Typography.styles.caption,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  
  // Barra de XP
  xpContainer: {
    marginBottom: Spacing.md,
  },
  xpBar: {
    height: 8,
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: Colors.primary.purple,
    borderRadius: 4,
  },
  xpText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  
  // Estatísticas
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  
  // Desafio Diário
  challengeCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
    marginHorizontal: Spacing.container.horizontal,
    marginTop: Spacing.lg,
    elevation: Spacing.elevation.medium,
    shadowColor: Colors.shadow.medium,
    shadowOffset: Spacing.shadowOffset.small,
    shadowOpacity: 0.15,
    shadowRadius: Spacing.shadowRadius.small,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.orange,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  challengeTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  challengeDescription: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.orange,
    borderRadius: 3,
  },
  progressText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  challengeReward: {
    ...Typography.styles.caption,
    color: Colors.primary.orange,
    fontWeight: Typography.fontWeight.semiBold,
  },
  
  // Badges
  badgesSection: {
    marginTop: Spacing.section.marginTop,
    paddingHorizontal: Spacing.container.horizontal,
  },
  badgesScroll: {
    paddingRight: Spacing.lg,
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 80,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgeLabel: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  viewAllBadges: {
    alignItems: 'center',
    width: 80,
  },
  viewAllText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  
  // Eventos Recomendados
  recommendedSection: {
    marginTop: Spacing.section.marginTop,
    paddingHorizontal: Spacing.container.horizontal,
  },
  recommendedScroll: {
    paddingRight: Spacing.lg,
  },
  recommendedCard: {
    width: 160,
    marginRight: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.card.borderRadius,
    elevation: Spacing.elevation.small,
    shadowColor: Colors.shadow.light,
    shadowOffset: Spacing.shadowOffset.small,
    shadowOpacity: 0.1,
    shadowRadius: Spacing.shadowRadius.small,
    overflow: 'hidden',
  },
  recommendedImage: {
    width: '100%',
    height: 100,
  },
  recommendedContent: {
    padding: Spacing.sm,
  },
  recommendedTitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.xs,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.magenta,
    borderRadius: 8,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  recommendedBadgeText: {
    ...Typography.styles.caption,
    color: Colors.text.onPrimary,
    marginLeft: 2,
    fontSize: 10,
  },
  
  // Modal de Level Up
  levelUpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelUpModal: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.xxxl,
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    elevation: Spacing.elevation.high,
    shadowColor: Colors.shadow.dark,
    shadowOffset: Spacing.shadowOffset.large,
    shadowOpacity: 0.3,
    shadowRadius: Spacing.shadowRadius.large,
  },
  levelUpTitle: {
    ...Typography.styles.h1,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  levelUpText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  levelUpButton: {
    backgroundColor: Colors.primary.purple,
    borderRadius: Spacing.button.borderRadius,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  levelUpButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
  },
});

// Estilos de Descoberta
export const discoveryStyles = StyleSheet.create({
  discoveryContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  discoveryText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  discoverySubtext: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
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
    backgroundColor: Colors.neutral.white,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    elevation: Spacing.elevation.small,
    shadowColor: Colors.shadow.light,
    shadowOffset: Spacing.shadowOffset.small,
    shadowOpacity: 0.1,
    shadowRadius: Spacing.shadowRadius.small,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
  },
  categoryButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
});

export const storyStyles = StyleSheet.create({
  // Stories Styles (Instagram-like)
  storiesScrollContent: {
    paddingRight: Spacing.lg,
  },
  storyCard: {
    alignItems: 'center',
    width: 80,
  },
  storyImageContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  storyImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: Colors.neutral.white,
  },
  storyBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 38,
    zIndex: -1,
  },
  storyVibeBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary.magenta,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  storyTitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export const eventStyles = StyleSheet.create({
  // Event Card Styles
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
});

export const vibeStyles = StyleSheet.create({
  // Vibe Related Styles
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
});

export const actionStyles = StyleSheet.create({
  // Action Button Styles
  actionButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.button.paddingHorizontal,
    paddingVertical: Spacing.button.paddingVertical,
  },
  actionButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
  },
});

export const storyModalStyles = StyleSheet.create({
  // Story Modal Styles (Instagram-like)
  storyModalOverlay: {
    flex: 1,
    backgroundColor: Colors.story.background,
  },
  storyModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  storyModalDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.story.overlay,
  },
  storyModalHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  storyModalProgress: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  storyProgressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.story.text,
    borderRadius: 2,
  },
  storyModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storyModalEventInfo: {
    flex: 1,
  },
  storyModalEventName: {
    ...Typography.styles.h3,
    color: Colors.story.text,
    fontWeight: Typography.fontWeight.bold,
  },
  storyModalEventDate: {
    ...Typography.styles.bodyMedium,
    color: Colors.story.text,
    opacity: 0.8,
    marginTop: 2,
  },
  storyModalCloseButton: {
    padding: Spacing.sm,
  },
  storyModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  storyUrgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  storyUrgencyText: {
    ...Typography.styles.bodyLarge,
    color: Colors.story.text,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  storyVibeMessage: {
    ...Typography.styles.bodyLarge,
    color: Colors.story.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  storyModalActions: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: Spacing.md,
  },
  storyActionButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  storyPrimaryButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  storyActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  storyActionButtonText: {
    ...Typography.styles.button,
    color: Colors.story.text,
    marginLeft: Spacing.sm,
  },
  
  // Estilos para visualização completa
  verConteudoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  verConteudoButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.story.text,
    marginLeft: Spacing.xs,
    opacity: 0.9,
  },
  voltarButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

// Exportação consolidada de todos os estilos
export const styles = {
  ...homeStyles,
  ...gamificationStyles,
  ...discoveryStyles,
  ...storyStyles,
  ...eventStyles,
  ...vibeStyles,
  ...actionStyles,
  ...storyModalStyles,
};
