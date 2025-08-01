import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: Colors.neutral.black,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparente para ver o vídeo
    paddingHorizontal: Spacing.container.horizontal,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56, // Altura padrão do cabeçalho
  },
  headerLogo: {
    height: 32,
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.onPrimary,
    marginTop: Spacing.md,
  },
  bottomSheetBackground: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandle: {
    backgroundColor: Colors.neutral.lightGray,
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  bottomSheetContent: {
    paddingBottom: Spacing.xxxxl,
  },
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


