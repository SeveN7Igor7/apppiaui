import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

const { width, height } = Dimensions.get('window');

export const explorarStyles = StyleSheet.create({
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
  profileButton: {
    padding: Spacing.xs,
  },
  
  // Search Container
  searchContainer: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.container.horizontal,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: 25,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  
  // Categorias
  categoriasContainer: {
    backgroundColor: Colors.neutral.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray,
  },
  categoriasScrollContent: {
    paddingHorizontal: Spacing.container.horizontal,
    gap: Spacing.sm,
  },
  categoriaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary.purple,
  },
  categoriaButtonActive: {
    backgroundColor: Colors.primary.purple,
  },
  categoriaButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.primary.purple,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  categoriaButtonTextActive: {
    color: Colors.text.onPrimary,
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
  
  // Lista de Eventos
  eventosListContent: {
    padding: Spacing.container.horizontal,
    paddingBottom: Spacing.xxxxl,
  },
  eventoRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  
  // Event Card Styles
  eventoCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.card.borderRadius,
    elevation: Spacing.elevation.medium,
    shadowColor: Colors.shadow.medium,
    shadowOffset: Spacing.shadowOffset.small,
    shadowOpacity: 0.15,
    shadowRadius: Spacing.shadowRadius.small,
    overflow: 'hidden',
    width: (width - Spacing.container.horizontal * 2 - Spacing.lg) / 2,
  },
  eventoImageContainer: {
    position: 'relative',
    height: 120,
  },
  eventoImage: {
    width: '100%',
    height: '100%',
  },
  eventoImageDisabled: {
    opacity: 0.5,
  },
  eventoDisabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay.modal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventoDisabledText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.onPrimary,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  eventoHighVibeBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.primary.magenta,
    borderRadius: 8,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventoHighVibeBadgeText: {
    ...Typography.styles.caption,
    color: Colors.text.onPrimary,
    marginLeft: 2,
    fontWeight: Typography.fontWeight.semiBold,
    fontSize: 10,
  },
  eventoUrgencyBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: Colors.primary.orange,
    borderRadius: 8,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventoUrgencyText: {
    ...Typography.styles.caption,
    color: Colors.text.onPrimary,
    marginLeft: 2,
    fontWeight: Typography.fontWeight.semiBold,
    fontSize: 10,
  },
  eventoCardContent: {
    padding: Spacing.sm,
  },
  eventoName: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  eventoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventoInfoText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  
  // Vibe Container
  vibeContainer: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray,
  },
  vibeLabel: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  vibeStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  vibeMessage: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxxl,
  },
  emptyText: {
    ...Typography.styles.h3,
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay.modal,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    elevation: Spacing.elevation.high,
    shadowColor: Colors.shadow.dark,
    shadowOffset: Spacing.shadowOffset.large,
    shadowOpacity: 0.3,
    shadowRadius: Spacing.shadowRadius.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
  },
  
  // Modal Image
  modalImageContainer: {
    position: 'relative',
    height: 200,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalHighVibeBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary.magenta,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHighVibeBadgeText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  
  // Modal Event Info
  modalEventInfo: {
    padding: Spacing.lg,
  },
  modalEventName: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalInfoText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    marginLeft: Spacing.md,
    flex: 1,
  },
  
  // Modal Vibe Section
  modalVibeSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray,
  },
  modalVibeTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  modalVibeContainer: {
    alignItems: 'center',
  },
  modalVibeStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalVibeMessage: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalVibeCount: {
    ...Typography.styles.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  
  // Modal Descrição Section
  modalDescricaoSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray,
  },
  modalDescricaoTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  modalDescricaoText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  
  // Modal Actions
  modalActions: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray,
    gap: Spacing.md,
  },
  modalActionButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  modalPrimaryButton: {
    borderRadius: Spacing.button.borderRadius,
    overflow: 'hidden',
  },
  modalActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.button.paddingHorizontal,
    paddingVertical: Spacing.button.paddingVertical,
  },
  modalActionButtonText: {
    ...Typography.styles.button,
    color: Colors.text.onPrimary,
    marginLeft: Spacing.sm,
  },
});
