import { get, ref } from 'firebase/database';
import { databaseSocial } from '../services/firebaseappdb';

export type ResultadoVibe = {
  media: number;
  quantidade: number;
};

export async function calcularVibe(eventId: string): Promise<ResultadoVibe | null> {
  try {
    console.log(`[vibeUtils] Iniciando cálculo da vibe para evento: ${eventId}`);

    const snapshot = await get(ref(databaseSocial, `avaliacoesVibe/${eventId}/`));
    console.log(`[vibeUtils] Snapshot recebido do Firebase: exists=${snapshot.exists()}`, snapshot.val());

    if (!snapshot.exists()) {
      console.log(`[vibeUtils] Nenhuma avaliação encontrada para o evento ${eventId}.`);
      return null;
    }

    const data = snapshot.val();
    console.log('[vibeUtils] Dados brutos das avaliações:', data);

    const avaliacoes = Object.values(data) as { nota: number }[];
    console.log(`[vibeUtils] Quantidade de avaliações encontradas: ${avaliacoes.length}`);
    console.log('[vibeUtils] Avaliações extraídas:', avaliacoes);

    const totalNotas = avaliacoes.reduce((acc, cur) => acc + cur.nota, 0);
    console.log(`[vibeUtils] Soma total das notas: ${totalNotas}`);

    const quantidade = avaliacoes.length;
    const media = totalNotas / quantidade;
    console.log(`[vibeUtils] Média calculada: ${media} com base em ${quantidade} avaliações.`);

    return { media, quantidade };
  } catch (error) {
    console.error(`[vibeUtils] Erro ao calcular vibe do evento ${eventId}:`, error);
    return null;
  }
}

/**
 * Retorna mensagem de avaliação baseada na quantidade e média de votos.
 */
export function getMensagemVibe(vibe: ResultadoVibe | null | undefined): string {
  console.log('[vibeUtils] Gerando mensagem para vibe:', vibe);
  if (!vibe || vibe.quantidade === 0) {
    return 'Seja o primeiro a avaliar!';
  }
  if (vibe.quantidade <= 3) {
    return `Poucas avaliações (${vibe.quantidade})`;
  }
  if (vibe.quantidade >= 4 && vibe.quantidade < 9) {
    if (vibe.media < 3) return 'Vibe baixa, pode melhorar';
    if (vibe.media < 4.5) return 'Vibe boa, mas pode melhorar';
    return 'Vibe alta, evento recomendado!';
  }
  // 9 ou mais avaliações (mais confiável)
  if (vibe.media < 3) return 'Vibe baixa';
  if (vibe.media < 4.5) return 'Vibe moderada';
  return '🔥 Altíssima vibe!';
}

/**
 * Retorna se deve mostrar o selo de "Altíssima vibe"
 */
export function deveMostrarSeloAltaVibe(vibe: ResultadoVibe | null | undefined): boolean {
  console.log('[vibeUtils] Verificando se deve mostrar selo alta vibe:', vibe);
  return !!vibe && vibe.quantidade >= 9 && vibe.media >= 4.5;
}
