import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

const { width, height } = Dimensions.get('window');

// Detectar altura do menu bar do celular (aproximadamente 34px no iOS e 48px no Android)
const BOTTOM_SAFE_AREA = Platform.OS === 'ios' ? 34 : 48;

export const eventDetailsStyles = StyleSheet.create({
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
  headerTitle: {
    ...Typography.styles.h2,
    color: Colors.text.onPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  shareButton: {
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
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.container.horizontal,
  },
  errorText: {
    ...Typography.styles.h3,
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  errorSubtext: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  
  // Scroll Content
  scrollContent: {
    flexGrow: 1,
  },
  
  // Event Image Container
  eventImageContainer: {
    position: 'relative',
    height: 280,
    backgroundColor: Colors.neutral.lightGray,
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
    ...Typography.styles.bodyLarge,
    color: Colors.text.onPrimary,
    marginTop: Spacing.sm,
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  eventHighVibeBadge: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary.magenta,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventHighVibeBadgeText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  eventUrgencyBadge: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    backgroundColor: Colors.primary.orange,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventUrgencyText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  
  // Event Content
  eventContent: {
    flex: 1,
    padding: Spacing.container.horizontal,
  },
  
  // Event Title Section
  eventTitleSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  eventName: {
    ...Typography.styles.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    lineHeight: 32,
  },
  eventCategory: {
    ...Typography.styles.bodyMedium,
    color: Colors.primary.purple,
    fontWeight: Typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Event Info Section
  eventInfoSection: {
    marginBottom: Spacing.xl,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  eventInfoIcon: {
    width: 24,
    alignItems: 'center',
  },
  eventInfoText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    marginLeft: Spacing.md,
    flex: 1,
    lineHeight: 22,
  },
  eventInfoTextPrimary: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  
  // Price Section
  priceSection: {
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  priceLabel: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  
  // Vibe Section
  vibeSection: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    elevation: Spacing.elevation.small,
    shadowColor: Colors.shadow.light,
    shadowOffset: Spacing.shadowOffset.small,
    shadowOpacity: 0.1,
    shadowRadius: Spacing.shadowRadius.small,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
  },
  vibeSectionTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  vibeContainer: {
    alignItems: 'center',
  },
  vibeStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  vibeMessage: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  vibeCount: {
    ...Typography.styles.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  vibeActionButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary.purple,
    borderRadius: Spacing.button.borderRadius,
    paddingHorizontal: Spacing.button.paddingHorizontal,
    paddingVertical: Spacing.button.paddingVertical,
    minWidth: 200,
    elevation: 2,
    shadowColor: Colors.primary.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  vibeActionButtonDisabled: {
    backgroundColor: Colors.neutral.lightGray,
    elevation: 0,
    shadowOpacity: 0,
  },
  vibeActionButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.semiBold,
  },
  vibeActionButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
  vibeDisabledMessage: {
    ...Typography.styles.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  
  // Description Section
  descriptionSection: {
    marginBottom: Spacing.xl,
  },
  descriptionTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  
  // Actions Section
  actionsSection: {
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl + BOTTOM_SAFE_AREA : Spacing.lg + BOTTOM_SAFE_AREA,
    paddingHorizontal: Spacing.container.horizontal,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray,
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
  },
  
  // Primary Action Button
  primaryActionButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  primaryActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.button.paddingHorizontal,
    paddingVertical: Spacing.button.paddingVertical,
  },
  primaryActionButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.sm,
  },
  
  // Secondary Action Button
  secondaryActionButton: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.button.borderRadius,
    borderWidth: 2,
    borderColor: Colors.primary.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.button.paddingHorizontal,
    paddingVertical: Spacing.button.paddingVertical,
  },
  secondaryActionButtonText: {
    ...Typography.styles.button,
    color: Colors.primary.purple,
    marginLeft: Spacing.sm,
  },
  
  // Disabled Button
  disabledButton: {
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: Spacing.button.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.button.paddingHorizontal,
    paddingVertical: Spacing.button.paddingVertical,
  },
  disabledButtonText: {
    ...Typography.styles.button,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  
  // Status Message
  statusMessage: {
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  statusMessageText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.semiBold,
  },
  
  // Urgency Message
  urgencyMessage: {
    backgroundColor: Colors.primary.orange,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyMessageText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.onPrimary,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.sm,
  },

  // Chat Button
  chatButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary.purple,
    borderRadius: 28,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    elevation: 5,
    shadowColor: Colors.shadow.dark,
    shadowOffset: Spacing.shadowOffset.medium,
    shadowOpacity: 0.3,
    shadowRadius: Spacing.shadowRadius.medium,
  },
  chatButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
    fontWeight: Typography.fontWeight.semiBold,
  },

  // Chat Modal
  chatModalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.white, // Fundo branco
    borderTopLeftRadius: Spacing.card.borderRadius,
    borderTopRightRadius: Spacing.card.borderRadius,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Ajuste para status bar
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Alinhar itens na horizontal
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary.purple, // Cor de destaque para o cabeçalho
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.purple, // Cor da borda
  },
  chatCloseButton: {
    padding: Spacing.xs,
  },
  chatHeaderTitle: {
    ...Typography.styles.h3,
    color: Colors.text.onPrimary,
    fontWeight: Typography.fontWeight.bold,
    flex: 1, // Para o título ocupar o espaço restante
    textAlign: 'center', // Centralizar o título
  },
  chatContent: {
    flex: 1,
    backgroundColor: Colors.neutral.white, // Fundo branco para o conteúdo do chat
  },


});