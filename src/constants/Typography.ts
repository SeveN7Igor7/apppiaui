// Sistema de Tipografia - Piauí Tickets App (CORRIGIDO)
import { Platform } from 'react-native';

export const Typography = {
  // Família de Fontes do Sistema
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },
  
  // Tamanhos de Fonte
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
  },
  
  // Pesos de Fonte
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  
  // Altura de Linha
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Estilos Pré-definidos (CORRIGIDOS COM FONTFAMILY)
  styles: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 1.2 * 28,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
      }),
    },
    h2: {
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 1.3 * 22,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 1.4 * 18,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5 * 16,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.4 * 14,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.3 * 12,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    caption: {
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 1.2 * 10,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.2 * 16,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    buttonSmall: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 1.2 * 12,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
  },
};
