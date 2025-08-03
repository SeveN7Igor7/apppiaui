import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StackNavigator from './src/navigation/StackNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  Animated,
  Image
} from 'react-native';
import { ref, onValue, get } from 'firebase/database';
import { databaseSocial } from './src/services/firebaseappdb';
import * as FileSystem from 'expo-file-system';

type VideoDownloadInfo = {
  id: string;
  url: string;
  filename: string;
  size?: number;
};

export default function App() {
  const [appVisible, setAppVisible] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<{
    isDownloading: boolean;
    progress: number;
    totalFiles: number;
    completedFiles: number;
    totalSizeMB: number;
    downloadedSizeMB: number;
  }>({
    isDownloading: false,
    progress: 0,
    totalFiles: 0,
    completedFiles: 0,
    totalSizeMB: 0,
    downloadedSizeMB: 0,
  });

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Diretório para armazenar vídeos permanentemente no dispositivo
  const VIDEO_STORAGE_DIR = FileSystem.documentDirectory + 'app_videos/';

  useEffect(() => {
    // Animar progresso do download
    Animated.timing(progressAnim, {
      toValue: downloadProgress.completedFiles / Math.max(downloadProgress.totalFiles, 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [downloadProgress.completedFiles, downloadProgress.totalFiles]);

  const ensureVideoDirectoryExists = async () => {
    console.log('[VideoStorage] Verificando diretório de vídeos:', VIDEO_STORAGE_DIR);
    const dirInfo = await FileSystem.getInfoAsync(VIDEO_STORAGE_DIR);
    if (!dirInfo.exists) {
      console.log('[VideoStorage] Criando diretório de vídeos...');
      await FileSystem.makeDirectoryAsync(VIDEO_STORAGE_DIR, { intermediates: true });
      console.log('[VideoStorage] Diretório de vídeos criado.');
    }
  };

  const getVideoFileSize = async (url: string): Promise<number> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      console.warn('[VideoStorage] Erro ao obter tamanho do arquivo:', url, error);
      return 0;
    }
  };

  const isVideoDownloaded = async (filename: string): Promise<boolean> => {
    const localPath = VIDEO_STORAGE_DIR + filename;
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    return fileInfo.exists;
  };

  const downloadVideoWithProgress = async (
    videoInfo: VideoDownloadInfo,
    onProgress: (progress: number, downloadedBytes: number) => void
  ): Promise<string | null> => {
    const localPath = VIDEO_STORAGE_DIR + videoInfo.filename;
    
    try {
      console.log('[VideoStorage] Iniciando download:', videoInfo.url, 'para', localPath);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        videoInfo.url,
        localPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          const downloadedBytes = downloadProgress.totalBytesWritten;
          onProgress(progress, downloadedBytes);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        console.log('[VideoStorage] Vídeo baixado com sucesso:', result.uri);
        return result.uri;
      }
      return null;
    } catch (error) {
      console.error('[VideoStorage] Erro ao baixar vídeo:', videoInfo.url, error);
      return null;
    }
  };

  const checkAndDownloadVideos = async () => {
    try {
      console.log('[VideoStorage] Iniciando verificação de conteúdos adicionais...');
      await ensureVideoDirectoryExists();

      // Buscar URLs de vídeo do Firebase
      const conteudosMenuRef = ref(databaseSocial, 'configgeralapp/conteudosmenu/');
      const snapshot = await get(conteudosMenuRef);
      const data = snapshot.val();

      if (!data) {
        console.log('[VideoStorage] Nenhum conteúdo encontrado no Firebase.');
        return;
      }

      const videosToDownload: VideoDownloadInfo[] = [];
      
      // Processar dados do Firebase
      for (const eventId in data) {
        const eventContent = data[eventId];
        if (Array.isArray(eventContent) && eventContent.length > 1 && typeof eventContent[1] === 'string') {
          const url = eventContent[1];
          const filename = url.split('/').pop() || `video_${eventId}.mp4`;
          
          // Verificar se o vídeo já está baixado
          const isDownloaded = await isVideoDownloaded(filename);
          if (!isDownloaded) {
            const size = await getVideoFileSize(url);
            videosToDownload.push({
              id: eventId,
              url,
              filename,
              size,
            });
          } else {
            console.log('[VideoStorage] Vídeo já baixado:', filename);
          }
        }
      }

      if (videosToDownload.length === 0) {
        console.log('[VideoStorage] Todos os vídeos já estão baixados.');
        return;
      }

      // Calcular tamanho total em MB
      const totalSizeBytes = videosToDownload.reduce((acc, video) => acc + (video.size || 0), 0);
      const totalSizeMB = totalSizeBytes / (1024 * 1024);

      console.log(`[VideoStorage] Iniciando download de ${videosToDownload.length} vídeos (${totalSizeMB.toFixed(2)} MB)`);

      setDownloadProgress({
        isDownloading: true,
        progress: 0,
        totalFiles: videosToDownload.length,
        completedFiles: 0,
        totalSizeMB,
        downloadedSizeMB: 0,
      });

      let completedFiles = 0;
      let totalDownloadedBytes = 0;

      // Baixar vídeos sequencialmente
      for (const videoInfo of videosToDownload) {
        const result = await downloadVideoWithProgress(
          videoInfo,
          (progress, downloadedBytes) => {
            const currentDownloadedMB = (totalDownloadedBytes + downloadedBytes) / (1024 * 1024);
            setDownloadProgress(prev => ({
              ...prev,
              progress,
              downloadedSizeMB: currentDownloadedMB,
            }));
          }
        );

        if (result) {
          completedFiles++;
          totalDownloadedBytes += videoInfo.size || 0;
          setDownloadProgress(prev => ({
            ...prev,
            completedFiles,
            downloadedSizeMB: totalDownloadedBytes / (1024 * 1024),
          }));
          console.log(`[VideoStorage] Progresso: ${completedFiles}/${videosToDownload.length} vídeos baixados`);
        }
      }

      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: false,
      }));

      console.log('[VideoStorage] Download de conteúdos adicionais concluído!');

    } catch (error) {
      console.error('[VideoStorage] Erro durante verificação/download de vídeos:', error);
      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: false,
      }));
      Alert.alert(
        'Erro no Download',
        'Ocorreu um erro ao baixar os conteúdos adicionais. O app continuará funcionando normalmente.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Verificar configurações do app
      const configRef = ref(databaseSocial, 'configgeralapp');
      const unsubscribe = onValue(configRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAppVisible(data.appvisible);
          setMessage(data.message || 'O aplicativo está temporariamente indisponível.');
        } else {
          setAppVisible(true);
          setMessage(null);
        }

        // Se o app está visível, verificar e baixar vídeos
        if (data?.appvisible !== false) {
          await checkAndDownloadVideos();
        }
        
        setLoading(false);
      }, (error) => {
        console.error("Erro ao ler configgeralapp do Firebase:", error);
        setAppVisible(true);
        setMessage(null);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    initializeApp();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (loading || downloadProgress.isDownloading) {
    return (
      <View style={styles.container}>
        {/* Logo */}
        <Image 
          source={require('./src/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Loader */}
        <ActivityIndicator size="large" color="#FFF" style={styles.loader} />

        {/* Status */}
        {loading && (
          <Text style={styles.statusText}>Carregando configurações...</Text>
        )}
        
        {downloadProgress.isDownloading && (
          <>
            <Text style={styles.statusText}>Baixando conteúdos adicionais</Text>
            <Text style={styles.progressText}>
              {downloadProgress.downloadedSizeMB.toFixed(1)} MB / {downloadProgress.totalSizeMB.toFixed(1)} MB
            </Text>
            
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[styles.progressBar, { width: progressWidth }]}
              />
            </View>
          </>
        )}

        {/* Aviso sobre dados móveis */}
        <Text style={styles.dataWarning}>
          A utilização de redes móveis pode gerar cobrança de dados
        </Text>
      </View>
    );
  }

  if (appVisible === false) {
    return (
      <View style={styles.container}>
        <Image 
          source={require('./src/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.errorTitle}>Aplicativo Indisponível</Text>
        <Text style={styles.errorMessage}>{message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  loader: {
    marginBottom: 20,
  },
  statusText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressText: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 40,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  dataWarning: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    color: '#CCC',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

