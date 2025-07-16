import { ref, get, set, update } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';

// Estrutura de dados de gamificação no Firebase
export type UserGameData = {
  level: number;
  xp: number;
  xpToNext: number;
  eventosParticipados: number;
  vibesAvaliadas: number;
  badges: string[];
  streak: number;
  lastLoginDate: string;
  vibesHistory: { [eventId: string]: { nota: number; timestamp: number } };
  eventosHistory: string[];
  dailyChallenges: {
    [date: string]: {
      vibesAvaliadasHoje: number;
      eventosVisitadosHoje: number;
      completed: boolean;
    };
  };
  achievements: {
    [badgeId: string]: {
      unlockedAt: string;
      progress?: number;
      maxProgress?: number;
    };
  };
  stats: {
    totalXpEarned: number;
    longestStreak: number;
    favoriteEventType?: string;
    averageVibeRating: number;
    firstEventDate?: string;
    lastActivityDate: string;
  };
};

// Dados padrão para novos usuários
export const defaultUserGameData: UserGameData = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  eventosParticipados: 0,
  vibesAvaliadas: 0,
  badges: [],
  streak: 0,
  lastLoginDate: new Date().toISOString().split('T')[0],
  vibesHistory: {},
  eventosHistory: [],
  dailyChallenges: {},
  achievements: {},
  stats: {
    totalXpEarned: 0,
    longestStreak: 0,
    averageVibeRating: 0,
    lastActivityDate: new Date().toISOString(),
  },
};

// Configuração de badges e suas condições
export const badgeConfig = {
  first_vibe: {
    name: 'Primeira Vibe',
    description: 'Avalie sua primeira vibe',
    icon: 'star',
    condition: (data: UserGameData) => data.vibesAvaliadas >= 1,
    xpReward: 25,
  },
  first_event: {
    name: 'Primeiro Evento',
    description: 'Participe do seu primeiro evento',
    icon: 'calendar-check',
    condition: (data: UserGameData) => data.eventosParticipados >= 1,
    xpReward: 50,
  },
  vibe_master: {
    name: 'Mestre das Vibes',
    description: 'Avalie 10 vibes',
    icon: 'fire',
    condition: (data: UserGameData) => data.vibesAvaliadas >= 10,
    xpReward: 100,
  },
  vibe_addict: {
    name: 'Viciado em Vibes',
    description: 'Avalie 50 vibes',
    icon: 'heart-multiple',
    condition: (data: UserGameData) => data.vibesAvaliadas >= 50,
    xpReward: 250,
  },
  early_bird: {
    name: 'Madrugador',
    description: 'Faça login antes das 8h',
    icon: 'clock-fast',
    condition: (data: UserGameData) => {
      // Esta condição será verificada no momento do login
      return false; // Será definida dinamicamente
    },
    xpReward: 30,
  },
  social_butterfly: {
    name: 'Borboleta Social',
    description: 'Compartilhe 5 eventos',
    icon: 'account-group',
    condition: (data: UserGameData) => {
      // Implementar quando houver funcionalidade de compartilhamento
      return false;
    },
    xpReward: 75,
  },
  streak_master: {
    name: 'Mestre da Sequência',
    description: 'Mantenha uma sequência de 7 dias',
    icon: 'lightning-bolt',
    condition: (data: UserGameData) => data.streak >= 7,
    xpReward: 150,
  },
  streak_legend: {
    name: 'Lenda da Sequência',
    description: 'Mantenha uma sequência de 30 dias',
    icon: 'crown',
    condition: (data: UserGameData) => data.streak >= 30,
    xpReward: 500,
  },
  explorer: {
    name: 'Explorador',
    description: 'Participe de 5 eventos diferentes',
    icon: 'compass',
    condition: (data: UserGameData) => data.eventosParticipados >= 5,
    xpReward: 125,
  },
  event_enthusiast: {
    name: 'Entusiasta de Eventos',
    description: 'Participe de 20 eventos',
    icon: 'calendar-multiple',
    condition: (data: UserGameData) => data.eventosParticipados >= 20,
    xpReward: 300,
  },
  high_roller: {
    name: 'Apostador',
    description: 'Dê notas altas (4-5) em 20 vibes',
    icon: 'dice-5',
    condition: (data: UserGameData) => {
      const highRatings = Object.values(data.vibesHistory).filter(vibe => vibe.nota >= 4).length;
      return highRatings >= 20;
    },
    xpReward: 200,
  },
  critic: {
    name: 'Crítico',
    description: 'Avalie vibes com diferentes notas (1-5)',
    icon: 'star-half',
    condition: (data: UserGameData) => {
      const ratings = Object.values(data.vibesHistory).map(vibe => vibe.nota);
      const uniqueRatings = new Set(ratings);
      return uniqueRatings.size >= 5;
    },
    xpReward: 100,
  },
};

// Configuração de níveis e XP
export const levelConfig = {
  calculateXpToNext: (level: number): number => {
    return Math.floor(100 * Math.pow(1.2, level - 1)); // Progressão exponencial
  },
  
  calculateTotalXpForLevel: (level: number): number => {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += levelConfig.calculateXpToNext(i);
    }
    return total;
  },
  
  calculateLevelFromXp: (xp: number): number => {
    let level = 1;
    let totalXp = 0;
    
    while (totalXp <= xp) {
      totalXp += levelConfig.calculateXpToNext(level);
      if (totalXp <= xp) {
        level++;
      }
    }
    
    return level;
  },
};

export class GameDataService {
  private static instance: GameDataService;
  
  public static getInstance(): GameDataService {
    if (!GameDataService.instance) {
      GameDataService.instance = new GameDataService();
    }
    return GameDataService.instance;
  }

  // Função para carregar dados de gamificação do Firebase
  async loadUserGameData(cpf: string): Promise<UserGameData> {
    try {
      console.log(`[GameDataService] Carregando dados de gamificação para CPF: ${cpf}`);
      
      const userRef = ref(databaseSocial, `users/cpf/${cpf}/gameData`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val() as UserGameData;
        console.log(`[GameDataService] Dados encontrados:`, data);
        
        // Migrar dados antigos se necessário
        const migratedData = this.migrateDataIfNeeded(data);
        
        // Atualizar streak baseado na última data de login
        const updatedData = await this.updateStreakAndLogin(cpf, migratedData);
        
        return updatedData;
      } else {
        console.log(`[GameDataService] Nenhum dado encontrado, criando dados padrão para CPF: ${cpf}`);
        
        // Criar dados padrão para novo usuário
        const newUserData = {
          ...defaultUserGameData,
          lastLoginDate: new Date().toISOString().split('T')[0],
          stats: {
            ...defaultUserGameData.stats,
            lastActivityDate: new Date().toISOString(),
          },
        };
        
        await set(userRef, newUserData);
        console.log(`[GameDataService] Dados padrão criados para CPF: ${cpf}`);
        
        return newUserData;
      }
    } catch (error) {
      console.error(`[GameDataService] Erro ao carregar dados de gamificação:`, error);
      return defaultUserGameData;
    }
  }

  // Função para migrar dados antigos para nova estrutura
  private migrateDataIfNeeded(data: any): UserGameData {
    const migratedData: UserGameData = {
      ...defaultUserGameData,
      ...data,
    };

    // Garantir que campos obrigatórios existam
    if (!migratedData.achievements) {
      migratedData.achievements = {};
    }
    
    if (!migratedData.stats) {
      migratedData.stats = {
        totalXpEarned: migratedData.xp || 0,
        longestStreak: migratedData.streak || 0,
        averageVibeRating: this.calculateAverageVibeRating(migratedData.vibesHistory || {}),
        lastActivityDate: new Date().toISOString(),
      };
    }

    if (!migratedData.dailyChallenges) {
      migratedData.dailyChallenges = {};
    }

    return migratedData;
  }

  // Função para atualizar streak e login
  private async updateStreakAndLogin(cpf: string, data: UserGameData): Promise<UserGameData> {
    const today = new Date().toISOString().split('T')[0];
    
    if (data.lastLoginDate !== today) {
      const streakIncrement = this.calculateStreak(data.lastLoginDate);
      const newStreak = streakIncrement === 1 ? data.streak + 1 : (streakIncrement === 0 ? data.streak : 1);
      
      const updatedData = {
        ...data,
        streak: newStreak,
        lastLoginDate: today,
        stats: {
          ...data.stats,
          longestStreak: Math.max(data.stats.longestStreak || 0, newStreak),
          lastActivityDate: new Date().toISOString(),
        },
      };
      
      // Verificar badge de madrugador
      const currentHour = new Date().getHours();
      if (currentHour < 8 && !data.badges.includes('early_bird')) {
        updatedData.badges = [...data.badges, 'early_bird'];
        updatedData.achievements.early_bird = {
          unlockedAt: new Date().toISOString(),
        };
      }
      
      // Salvar a atualização
      await this.updateUserGameData(cpf, {
        streak: updatedData.streak,
        lastLoginDate: today,
        stats: updatedData.stats,
        badges: updatedData.badges,
        achievements: updatedData.achievements,
      });
      
      return updatedData;
    }
    
    return data;
  }

  // Função para calcular streak
  private calculateStreak(lastLoginDate: string): number {
    const today = new Date();
    const lastLogin = new Date(lastLoginDate);
    
    // Zerar as horas para comparar apenas as datas
    today.setHours(0, 0, 0, 0);
    lastLogin.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastLogin.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 1; // Login consecutivo
    } else if (diffDays === 0) {
      return 0; // Mesmo dia
    } else {
      return -1; // Quebrou o streak
    }
  }

  // Função para atualizar dados de gamificação no Firebase
  async updateUserGameData(cpf: string, updates: Partial<UserGameData>): Promise<void> {
    try {
      console.log(`[GameDataService] Atualizando dados de gamificação para CPF: ${cpf}`, updates);
      
      const userRef = ref(databaseSocial, `users/cpf/${cpf}/gameData`);
      
      // Adicionar timestamp de última atividade
      const updatesWithTimestamp = {
        ...updates,
        stats: {
          ...updates.stats,
          lastActivityDate: new Date().toISOString(),
        },
      };
      
      await update(userRef, updatesWithTimestamp);
      console.log(`[GameDataService] Dados atualizados com sucesso`);
    } catch (error) {
      console.error(`[GameDataService] Erro ao atualizar dados de gamificação:`, error);
      throw error;
    }
  }

  // Função para verificar e atualizar badges
  checkAndUpdateBadges(gameData: UserGameData): { newBadges: string[]; unlockedBadges: string[] } {
    const currentBadges = new Set(gameData.badges);
    const newBadges = [...gameData.badges];
    const unlockedBadges: string[] = [];
    
    Object.entries(badgeConfig).forEach(([badgeId, config]) => {
      if (!currentBadges.has(badgeId) && config.condition(gameData)) {
        newBadges.push(badgeId);
        unlockedBadges.push(badgeId);
      }
    });
    
    return { newBadges, unlockedBadges };
  }

  // Função para verificar se o usuário subiu de nível
  checkLevelUp(currentXp: number, currentLevel: number): { newLevel: number; leveledUp: boolean } {
    const newLevel = levelConfig.calculateLevelFromXp(currentXp);
    return {
      newLevel,
      leveledUp: newLevel > currentLevel,
    };
  }

  // Função para adicionar XP e verificar level up
  async addXP(cpf: string, currentData: UserGameData, xpAmount: number, reason: string): Promise<{
    updatedData: UserGameData;
    leveledUp: boolean;
    unlockedBadges: string[];
  }> {
    const newXp = currentData.xp + xpAmount;
    const { newLevel, leveledUp } = this.checkLevelUp(newXp, currentData.level);
    
    const updatedData: UserGameData = {
      ...currentData,
      xp: newXp,
      level: newLevel,
      xpToNext: levelConfig.calculateXpToNext(newLevel),
      stats: {
        ...currentData.stats,
        totalXpEarned: (currentData.stats.totalXpEarned || 0) + xpAmount,
        lastActivityDate: new Date().toISOString(),
      },
    };
    
    // Verificar badges
    const { newBadges, unlockedBadges } = this.checkAndUpdateBadges(updatedData);
    updatedData.badges = newBadges;
    
    // Adicionar achievements para badges desbloqueados
    unlockedBadges.forEach(badgeId => {
      updatedData.achievements[badgeId] = {
        unlockedAt: new Date().toISOString(),
      };
    });
    
    // Atualizar no Firebase
    await this.updateUserGameData(cpf, {
      xp: updatedData.xp,
      level: updatedData.level,
      xpToNext: updatedData.xpToNext,
      badges: updatedData.badges,
      achievements: updatedData.achievements,
      stats: updatedData.stats,
    });
    
    console.log(`[GameDataService] +${xpAmount} XP adicionado. Motivo: ${reason}`);
    if (leveledUp) {
      console.log(`[GameDataService] Usuário subiu para o nível ${newLevel}!`);
    }
    if (unlockedBadges.length > 0) {
      console.log(`[GameDataService] Badges desbloqueados: ${unlockedBadges.join(', ')}`);
    }
    
    return { updatedData, leveledUp, unlockedBadges };
  }

  // Função para registrar uma vibe avaliada
  async registerVibeEvaluated(cpf: string, currentData: UserGameData, eventId: string, nota: number): Promise<{
    updatedData: UserGameData;
    leveledUp: boolean;
    unlockedBadges: string[];
    challengeCompleted: boolean;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    
    // Atualizar histórico de vibes
    const vibesHistory = {
      ...currentData.vibesHistory,
      [eventId]: { nota, timestamp },
    };
    
    // Atualizar desafio diário
    const todayChallenge = currentData.dailyChallenges[today] || {
      vibesAvaliadasHoje: 0,
      eventosVisitadosHoje: 0,
      completed: false,
    };
    
    const newVibesAvaliadasHoje = todayChallenge.vibesAvaliadasHoje + 1;
    const challengeCompleted = newVibesAvaliadasHoje >= 3 && !todayChallenge.completed;
    
    const dailyChallenges = {
      ...currentData.dailyChallenges,
      [today]: {
        ...todayChallenge,
        vibesAvaliadasHoje: newVibesAvaliadasHoje,
        completed: challengeCompleted || todayChallenge.completed,
      },
    };
    
    const updatedData: UserGameData = {
      ...currentData,
      vibesAvaliadas: currentData.vibesAvaliadas + 1,
      vibesHistory,
      dailyChallenges,
      stats: {
        ...currentData.stats,
        averageVibeRating: this.calculateAverageVibeRating(vibesHistory),
        lastActivityDate: new Date().toISOString(),
      },
    };
    
    // Calcular XP
    let xpToAdd = 10; // XP base por avaliar vibe
    if (challengeCompleted) {
      xpToAdd += 50; // Bônus por completar desafio diário
    }
    
    // Adicionar XP e verificar level up/badges
    const result = await this.addXP(cpf, updatedData, xpToAdd, 'Vibe avaliada');
    
    // Atualizar dados específicos da vibe
    await this.updateUserGameData(cpf, {
      vibesAvaliadas: updatedData.vibesAvaliadas,
      vibesHistory: updatedData.vibesHistory,
      dailyChallenges: updatedData.dailyChallenges,
    });
    
    return {
      ...result,
      challengeCompleted,
    };
  }

  // Função para registrar participação em evento
  async registerEventParticipation(cpf: string, currentData: UserGameData, eventId: string): Promise<{
    updatedData: UserGameData;
    leveledUp: boolean;
    unlockedBadges: string[];
  }> {
    if (currentData.eventosHistory.includes(eventId)) {
      // Evento já foi registrado
      return {
        updatedData: currentData,
        leveledUp: false,
        unlockedBadges: [],
      };
    }
    
    const eventosHistory = [...currentData.eventosHistory, eventId];
    
    const updatedData: UserGameData = {
      ...currentData,
      eventosParticipados: currentData.eventosParticipados + 1,
      eventosHistory,
      stats: {
        ...currentData.stats,
        firstEventDate: currentData.stats.firstEventDate || new Date().toISOString(),
        lastActivityDate: new Date().toISOString(),
      },
    };
    
    // Adicionar XP e verificar level up/badges
    const result = await this.addXP(cpf, updatedData, 25, 'Participação em evento');
    
    // Atualizar dados específicos do evento
    await this.updateUserGameData(cpf, {
      eventosParticipados: updatedData.eventosParticipados,
      eventosHistory: updatedData.eventosHistory,
      stats: updatedData.stats,
    });
    
    return result;
  }

  // Função para calcular média de avaliação de vibes
  private calculateAverageVibeRating(vibesHistory: { [eventId: string]: { nota: number; timestamp: number } }): number {
    const ratings = Object.values(vibesHistory).map(vibe => vibe.nota);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratings.length) * 100) / 100; // Arredondar para 2 casas decimais
  }

  // Função para obter informações de um badge
  getBadgeInfo(badgeId: string) {
    return badgeConfig[badgeId] || {
      name: badgeId.replace('_', ' '),
      description: 'Badge especial',
      icon: 'medal',
      xpReward: 0,
    };
  }

  // Função para obter progresso de um badge específico
  getBadgeProgress(badgeId: string, gameData: UserGameData): { current: number; max: number; percentage: number } {
    const config = badgeConfig[badgeId];
    if (!config) return { current: 0, max: 1, percentage: 0 };
    
    let current = 0;
    let max = 1;
    
    switch (badgeId) {
      case 'vibe_master':
        current = gameData.vibesAvaliadas;
        max = 10;
        break;
      case 'vibe_addict':
        current = gameData.vibesAvaliadas;
        max = 50;
        break;
      case 'explorer':
        current = gameData.eventosParticipados;
        max = 5;
        break;
      case 'event_enthusiast':
        current = gameData.eventosParticipados;
        max = 20;
        break;
      case 'streak_master':
        current = gameData.streak;
        max = 7;
        break;
      case 'streak_legend':
        current = gameData.streak;
        max = 30;
        break;
      case 'high_roller':
        current = Object.values(gameData.vibesHistory).filter(vibe => vibe.nota >= 4).length;
        max = 20;
        break;
      default:
        current = gameData.badges.includes(badgeId) ? 1 : 0;
        max = 1;
    }
    
    const percentage = Math.min((current / max) * 100, 100);
    
    return { current: Math.min(current, max), max, percentage };
  }

  // Função para obter estatísticas detalhadas do usuário
  getUserStats(gameData: UserGameData) {
    const totalBadges = Object.keys(badgeConfig).length;
    const unlockedBadges = gameData.badges.length;
    const badgeCompletionRate = (unlockedBadges / totalBadges) * 100;
    
    return {
      ...gameData.stats,
      badgeCompletionRate: Math.round(badgeCompletionRate),
      totalBadgesAvailable: totalBadges,
      unlockedBadges,
      currentLevelProgress: {
        current: gameData.xp - levelConfig.calculateTotalXpForLevel(gameData.level),
        max: gameData.xpToNext,
        percentage: ((gameData.xp - levelConfig.calculateTotalXpForLevel(gameData.level)) / gameData.xpToNext) * 100,
      },
    };
  }
}
