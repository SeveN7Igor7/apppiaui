# Funcionalidade de Ingressos Offline

## Descrição
Esta funcionalidade permite que os usuários baixem seus ingressos para uso offline, possibilitando o acesso aos QR codes mesmo sem conexão com a internet.

## Arquivos Modificados/Criados

### 1. `src/screens/Ingressos.tsx`
**Modificações:**
- Adicionados imports para AsyncStorage, FileSystem, Modal e Dimensions
- Criados estados para controle dos modais offline
- Implementadas funções para:
  - Verificação de armazenamento disponível
  - Download e salvamento local dos ingressos
  - Controle dos modais de aviso, seleção e download
- Adicionado botão "BAIXAR INGRESSOS PARA USO OFFLINE" na lista de eventos
- Criados três modais:
  - **OfflineWarningModal**: Modal de aviso sobre a funcionalidade
  - **EventSelectionModal**: Modal para seleção de eventos
  - **DownloadModal**: Modal de confirmação e progresso do download

### 2. `src/screens/IngressosOffline.tsx` (NOVO)
**Funcionalidades:**
- Tela dedicada para visualização de ingressos offline
- Carregamento de ingressos salvos no AsyncStorage
- Agrupamento de ingressos por evento
- Exibição de QR codes funcionais sem conexão
- Interface similar à tela online, mas otimizada para uso offline
- Banner indicativo de modo offline

### 3. `src/constants/IngressosStyle.ts`
**Adições:**
- Estilos para o botão de download offline
- Estilos para todos os modais (aviso, seleção, download)
- Estilos para barras de progresso e armazenamento
- Estilos específicos para a tela offline
- Estilos para badges e indicadores offline

### 4. `App.tsx`
**Modificações:**
- Adicionados imports para NetInfo, AsyncStorage e MaterialCommunityIcons
- Implementado monitoramento de conectividade
- Criados estados para controle de conexão e ingressos offline
- Adicionada lógica para exibir tela offline quando sem internet
- Criadas duas telas de sem conexão:
  - Com ingressos offline disponíveis (botão de acesso)
  - Sem ingressos offline (apenas aviso)

### 5. `package.json`
**Adições:**
- Dependência `@react-native-community/netinfo` para detecção de conectividade

## Como Funciona

### 1. Download de Ingressos
1. Na tela de ingressos, o usuário clica em "BAIXAR INGRESSOS PARA USO OFFLINE"
2. Aparece um modal explicativo sobre a funcionalidade
3. Após confirmar, o usuário seleciona quais eventos deseja baixar
4. O sistema verifica se há pelo menos 200MB de armazenamento livre
5. Se aprovado, inicia o download com barra de progresso
6. Os ingressos são salvos no AsyncStorage com todas as informações necessárias

### 2. Dados Salvos por Ingresso
- CPF do cliente
- Nome completo do cliente
- Email
- ID do evento
- Nome do evento
- Tipo do ingresso
- Token (código do QR)
- Data do evento
- Local do evento

### 3. Acesso Offline
1. Quando o dispositivo está sem internet, o App.tsx detecta automaticamente
2. Se há ingressos offline salvos, mostra botão para acessá-los
3. A tela offline carrega os dados do AsyncStorage
4. Exibe os ingressos agrupados por evento
5. QR codes funcionam normalmente para validação

### 4. Interface Offline
- Banner indicativo de modo offline
- Lista de eventos sem imagens (ícones no lugar)
- Detalhes completos dos ingressos
- QR codes totalmente funcionais
- Informações do titular e evento

## Instalação

1. Instale a nova dependência:
```bash
npm install @react-native-community/netinfo
```

2. Para projetos Expo, adicione no app.json se necessário:
```json
{
  "expo": {
    "plugins": [
      "@react-native-community/netinfo"
    ]
  }
}
```

## Requisitos de Sistema
- Mínimo de 200MB de armazenamento livre para download
- AsyncStorage para persistência local
- Conectividade para download inicial
- FileSystem para verificação de armazenamento

## Fluxo de Uso

### Online (Download)
1. Usuário acessa "Meus Ingressos"
2. Clica em "BAIXAR INGRESSOS PARA USO OFFLINE"
3. Lê informações sobre a funcionalidade → "Entendi"
4. Seleciona eventos desejados → "Confirmar"
5. Verifica armazenamento disponível → "Iniciar Download"
6. Aguarda download com progresso → "Concluir"

### Offline (Acesso)
1. App detecta falta de conexão
2. Se há ingressos offline, mostra botão de acesso
3. Usuário clica em "Acessar Ingressos Offline"
4. Navega pelos eventos e ingressos salvos
5. Apresenta QR codes na entrada dos eventos

## Observações Técnicas
- Os ingressos offline são independentes da conexão
- QR codes mantêm os tokens originais para validação
- Interface otimizada para uso sem imagens
- Dados criptografados no AsyncStorage
- Verificação automática de conectividade
- Fallback gracioso quando sem internet

## Benefícios
- Acesso garantido aos ingressos sem internet
- Redução de problemas na entrada de eventos
- Experiência do usuário aprimorada
- Backup local dos dados importantes
- Interface profissional e intuitiva

